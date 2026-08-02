const router = require('express').Router();
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');
const virtualAccountService = require('../services/virtual-account.service');
const bankClient = require('../services/bank-client');
const feeService = require('../services/fee.service');

let client;

async function getClient() {
  if (!client) {
    client = new Client({
      user: process.env.DB_USER || 'halalhub_user',
      password: process.env.DB_PASSWORD || '@halalhub@#',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'halalhub'
    });
    await client.connect();
  }
  return client;
}

// All P2P routes require authentication
router.use(authenticate);

// ============================================================
// 1. SEARCH USERS (for P2P transfer)
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const db = await getClient();
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const searchTerm = `%${q}%`;
    const result = await db.query(`
      SELECT 
        id,
        fullname as name,
        phone,
        email,
        profile_image,
        COALESCE(profile_image, '') as profile_image
      FROM users 
      WHERE id != $1 
        AND (
          fullname ILIKE $2 OR 
          phone ILIKE $2 OR 
          email ILIKE $2
        )
        AND role = 'client'
      LIMIT $3
    `, [userId, searchTerm, parseInt(limit)]);

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      profile_image: user.profile_image,
      initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }));

    res.json({ success: true, users: users });

  } catch (err) {
    console.error('Error searching users:', err.message);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// ============================================================
// 2. GET USER BY ID
// ============================================================
router.get('/users/:userId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.params.userId;

    const result = await db.query(`
      SELECT 
        id,
        fullname as name,
        phone,
        email,
        profile_image
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        profile_image: user.profile_image,
        initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      }
    });

  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================
// 3. GET USER WALLET BALANCE (From Virtual Account)
// ============================================================
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;

    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    res.json({
      success: true,
      balance: account.balance || 0,
      currency: account.currency || 'KES',
      accountNumber: account.account_number
    });

  } catch (err) {
    console.error('Error fetching balance:', err.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// ============================================================
// 4. PROCESS P2P TRANSFER (Using Virtual Accounts)
// ============================================================
router.post('/transfer', async (req, res) => {
  const db = await getClient();

  try {
    const senderId = req.user.id;
    const { recipient_id, amount, note } = req.body;

    // Validate input
    if (!recipient_id) {
      return res.status(400).json({ error: 'Recipient is required' });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (parseFloat(amount) < 50) {
      return res.status(400).json({ error: 'Minimum transfer amount is KES 50' });
    }

    if (senderId === recipient_id) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    // Get sender's virtual account
    const senderAccount = await virtualAccountService.getUserAccount(senderId);

    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        error: 'Sender virtual account not found. Please contact support.'
      });
    }

    const senderBalance = senderAccount.balance || 0;

    if (senderBalance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        balance: senderBalance,
        required: parseFloat(amount)
      });
    }

    // Check recipient exists
    const recipientCheck = await db.query(
      'SELECT id, fullname FROM users WHERE id = $1',
      [recipient_id]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipient = recipientCheck.rows[0];

    // Get recipient's virtual account
    const recipientAccount = await virtualAccountService.getUserAccount(recipient_id);

    if (!recipientAccount) {
      return res.status(404).json({
        success: false,
        error: 'Recipient virtual account not found. Please contact support.'
      });
    }

    // Calculate fee
    const fee = feeService.calculateTransferFee(parseFloat(amount));
    const totalDeduct = parseFloat(amount) + fee.fee;

    // Generate transaction reference
    const reference = 'P2P-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    await db.query('BEGIN');

    try {
      // 1. Deduct from sender's virtual account
      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance - $1, updatedat = NOW() 
         WHERE id = $2`,
        [totalDeduct, senderAccount.id]
      );

      // 2. Add to recipient's virtual account
      await db.query(
        `UPDATE virtual_accounts 
         SET balance = balance + $1, updatedat = NOW() 
         WHERE id = $2`,
        [parseFloat(amount), recipientAccount.id]
      );

      // 3. Record bank transaction
      const txId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO bank_transactions (
          id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
      `, [
        txId,
        reference,
        senderAccount.account_number,
        recipientAccount.account_number,
        parseFloat(amount),
        fee.fee,
        'transfer',
        'completed',
        `P2P transfer to ${recipient.fullname}`
      ]);

      // 4. Record P2P transaction
      const transactionId = 'p2p-' + Date.now();
      await db.query(`
        INSERT INTO p2p_transactions (
          id, sender_id, recipient_id, amount, note, reference, status, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), NOW())
      `, [transactionId, senderId, recipient_id, parseFloat(amount), note || null, reference]);

      // 5. Record fee transaction (if fee > 0)
      if (fee.fee > 0) {
        const feeTxId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
        const feeRef = 'FEE-' + Date.now().toString(36).toUpperCase() + require('crypto').randomBytes(4).toString('hex').toUpperCase();

        await db.query(`
          INSERT INTO bank_transactions (
            id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
        `, [
          feeTxId,
          feeRef,
          senderAccount.account_number,
          process.env.BANK_MASTER_ACCOUNT || 'HALALHUB_MASTER',
          fee.fee,
          0,
          'fee',
          'completed',
          'P2P transfer fee'
        ]);
      }

      await db.query('COMMIT');

      // Get updated balance
      const newBalance = await virtualAccountService.getUserAccount(senderId);

      res.json({
        success: true,
        message: 'Transfer completed successfully',
        reference: reference,
        amount: parseFloat(amount),
        fee: fee.fee,
        recipient_name: recipient.fullname,
        new_balance: newBalance?.balance || 0,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error processing transfer:', err.message);
    res.status(500).json({ error: 'Failed to process transfer' });
  }
});

// ============================================================
// 5. GET TRANSACTION HISTORY
// ============================================================
router.get('/transactions', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT 
        t.*,
        s.fullname as sender_name,
        s.phone as sender_phone,
        r.fullname as recipient_name,
        r.phone as recipient_phone
      FROM p2p_transactions t
      JOIN users s ON t.sender_id = s.id
      JOIN users r ON t.recipient_id = r.id
      WHERE t.sender_id = $1 OR t.recipient_id = $1
      ORDER BY t.createdat DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    const transactions = result.rows.map(t => ({
      id: t.id,
      reference: t.reference,
      amount: parseInt(t.amount),
      note: t.note,
      status: t.status,
      type: t.sender_id === userId ? 'sent' : 'received',
      sender_name: t.sender_name,
      sender_phone: t.sender_phone,
      recipient_name: t.recipient_name,
      recipient_phone: t.recipient_phone,
      createdat: t.createdat
    }));

    res.json({ success: true, transactions: transactions });

  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ============================================================
// 6. GET TRANSACTION BY REFERENCE
// ============================================================
router.get('/transactions/:reference', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const reference = req.params.reference;

    const result = await db.query(`
      SELECT 
        t.*,
        s.fullname as sender_name,
        s.phone as sender_phone,
        r.fullname as recipient_name,
        r.phone as recipient_phone
      FROM p2p_transactions t
      JOIN users s ON t.sender_id = s.id
      JOIN users r ON t.recipient_id = r.id
      WHERE t.reference = $1 AND (t.sender_id = $2 OR t.recipient_id = $2)
    `, [reference, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const t = result.rows[0];
    res.json({
      success: true,
      transaction: {
        id: t.id,
        reference: t.reference,
        amount: parseInt(t.amount),
        note: t.note,
        status: t.status,
        type: t.sender_id === userId ? 'sent' : 'received',
        sender_name: t.sender_name,
        sender_phone: t.sender_phone,
        recipient_name: t.recipient_name,
        recipient_phone: t.recipient_phone,
        createdat: t.createdat
      }
    });

  } catch (err) {
    console.error('Error fetching transaction:', err.message);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// ============================================================
// 7. GET TRANSFER STATISTICS
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN sender_id = $1 THEN amount ELSE 0 END) as total_sent,
        SUM(CASE WHEN recipient_id = $1 THEN amount ELSE 0 END) as total_received,
        COUNT(CASE WHEN sender_id = $1 THEN 1 END) as sent_count,
        COUNT(CASE WHEN recipient_id = $1 THEN 1 END) as received_count
      FROM p2p_transactions
      WHERE sender_id = $1 OR recipient_id = $1
    `, [userId]);

    const stats = result.rows[0];
    res.json({
      success: true,
      stats: {
        totalTransactions: parseInt(stats.total_transactions) || 0,
        totalSent: parseInt(stats.total_sent) || 0,
        totalReceived: parseInt(stats.total_received) || 0,
        sentCount: parseInt(stats.sent_count) || 0,
        receivedCount: parseInt(stats.received_count) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================
// 8. SYNC P2P BALANCE WITH BANK
// ============================================================
router.post('/sync', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await virtualAccountService.syncWithBank(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to sync with bank'
      });
    }

    res.json({
      success: true,
      message: 'Balance synced with bank successfully',
      data: {
        ourBalance: result.ourBalance,
        bankBalance: result.bankBalance,
        isSynced: result.isSynced,
        accountNumber: result.accountNumber
      }
    });

  } catch (err) {
    console.error('Error syncing P2P balance:', err.message);
    res.status(500).json({ error: 'Failed to sync balance' });
  }
});

module.exports = router;