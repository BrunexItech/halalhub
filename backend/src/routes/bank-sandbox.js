const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');

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

// ============================================================
// 1. CREATE VIRTUAL ACCOUNT (Internal - No Auth Required)
// ============================================================
router.post('/accounts', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.body.userId || req.user?.id;
    const { currency = 'KES' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check if user already has an account
    const existing = await db.query(
      'SELECT id, account_number FROM virtual_accounts WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already has a virtual account',
        account: existing.rows[0]
      });
    }

    // Generate unique account number
    const accountNumber = 'HH-' + Date.now().toString(36).toUpperCase() +
                          crypto.randomBytes(4).toString('hex').toUpperCase();

    const accountId = 'vact-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query(
      `INSERT INTO virtual_accounts (
        id, user_id, account_number, currency, balance, is_active, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [accountId, userId, accountNumber, currency, 0, true]
    );

    res.status(201).json({
      success: true,
      message: 'Virtual account created successfully',
      data: {
        accountNumber: accountNumber,
        currency: currency,
        balance: 0
      }
    });

  } catch (error) {
    console.error('Error creating virtual account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create virtual account'
    });
  }
});

// ============================================================
// 2. GET ACCOUNT BALANCE
// ============================================================
router.get('/accounts/:accountNumber', async (req, res) => {
  try {
    const db = await getClient();
    const { accountNumber } = req.params;

    const result = await db.query(
      `SELECT account_number, currency, balance, is_active
       FROM virtual_accounts
       WHERE account_number = $1 AND is_active = true`,
      [accountNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// ============================================================
// 3. GET USER'S VIRTUAL ACCOUNT
// ============================================================
router.get('/my-account', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, account_number, currency, balance, is_active, createdat
       FROM virtual_accounts
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    res.json({
      success: true,
      account: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// ============================================================
// 4. SIMULATE DEPOSIT (Webhook Trigger for Testing)
// ============================================================
router.post('/deposit', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const { accountNumber, amount, reference } = req.body;

    if (!accountNumber || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Account number and amount are required'
      });
    }

    // Get account with lock
    const accountResult = await db.query(
      `SELECT id, user_id, balance FROM virtual_accounts
       WHERE account_number = $1 AND is_active = true FOR UPDATE`,
      [accountNumber]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const account = accountResult.rows[0];

    await db.query('BEGIN');

    // Generate transaction reference
    const ref = reference || 'DEP-' + Date.now().toString(36).toUpperCase() +
                crypto.randomBytes(4).toString('hex').toUpperCase();

    // Update account balance
    await db.query(
      `UPDATE virtual_accounts
       SET balance = balance + $1, updatedat = NOW()
       WHERE id = $2`,
      [amount, account.id]
    );

    // Record transaction
    const txId = 'btxn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO bank_transactions (
        id, reference, from_account, to_account, amount, fee, type, status, external_reference, completed_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())`,
      [txId, ref, null, accountNumber, amount, 0, 'deposit', 'completed', ref]
    );

    // Get new balance
    const newBalanceResult = await db.query(
      'SELECT balance FROM virtual_accounts WHERE id = $1',
      [account.id]
    );

    await db.query('COMMIT');

    console.log(`[Bank Sandbox] Deposit: ${ref} - ${amount} to ${accountNumber}`);

    res.json({
      success: true,
      message: 'Deposit processed successfully',
      data: {
        transactionId: txId,
        reference: ref,
        accountNumber: accountNumber,
        amount: amount,
        newBalance: newBalanceResult.rows[0].balance,
        status: 'completed'
      }
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process deposit'
    });
  }
});

// ============================================================
// 5. TRANSFER BETWEEN ACCOUNTS (No Auth Required - Internal)
// ============================================================
router.post('/transfer', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user?.id || req.body.userId || null;
    const { fromAccount, toAccount, amount, fee = 0, description = '' } = req.body;

    if (!fromAccount || !toAccount || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'From account, to account, and amount are required'
      });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer to the same account'
      });
    }

    await db.query('BEGIN');

    // Get from account
    const fromResult = await db.query(
      `SELECT id, user_id, balance FROM virtual_accounts
       WHERE account_number = $1 AND is_active = true FOR UPDATE`,
      [fromAccount]
    );

    if (fromResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'From account not found'
      });
    }

    const from = fromResult.rows[0];

    // Check if user owns the from account (skip for system transfers)
    if (userId && from.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this account'
      });
    }

    if (from.balance < (amount + fee)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        balance: from.balance,
        required: amount + fee
      });
    }

    // Get to account
    const toResult = await db.query(
      `SELECT id, balance FROM virtual_accounts
       WHERE account_number = $1 AND is_active = true FOR UPDATE`,
      [toAccount]
    );

    if (toResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'To account not found'
      });
    }

    const to = toResult.rows[0];

    // Generate reference
    const ref = 'TRF-' + Date.now().toString(36).toUpperCase() +
                crypto.randomBytes(4).toString('hex').toUpperCase();

    // Update balances
    await db.query(
      `UPDATE virtual_accounts SET balance = balance - $1, updatedat = NOW() WHERE id = $2`,
      [amount + fee, from.id]
    );

    await db.query(
      `UPDATE virtual_accounts SET balance = balance + $1, updatedat = NOW() WHERE id = $2`,
      [amount, to.id]
    );

    // Record transaction
    const txId = 'btxn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO bank_transactions (
        id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())`,
      [txId, ref, fromAccount, toAccount, amount, fee, 'transfer', 'completed', description || null]
    );

    // Get new balances
    const newFromResult = await db.query(
      'SELECT balance FROM virtual_accounts WHERE id = $1',
      [from.id]
    );

    await db.query('COMMIT');

    console.log(`[Bank Sandbox] Transfer: ${ref} - ${amount} from ${fromAccount} to ${toAccount}`);

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transactionId: txId,
        reference: ref,
        fromAccount: fromAccount,
        toAccount: toAccount,
        amount: amount,
        fee: fee,
        newBalance: newFromResult.rows[0].balance,
        status: 'completed'
      }
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process transfer'
    });
  }
});

// ============================================================
// 6. WITHDRAW TO M-PESA/BANK
// ============================================================
router.post('/withdraw', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { accountNumber, amount, destination, destinationType = 'mpesa' } = req.body;

    if (!accountNumber || !amount || amount <= 0 || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Account number, amount, and destination are required'
      });
    }

    // Get account
    const accountResult = await db.query(
      `SELECT id, user_id, balance FROM virtual_accounts
       WHERE account_number = $1 AND is_active = true FOR UPDATE`,
      [accountNumber]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const account = accountResult.rows[0];

    if (account.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this account'
      });
    }

    if (account.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        balance: account.balance,
        required: amount
      });
    }

    await db.query('BEGIN');

    // Generate reference
    const ref = 'WTH-' + Date.now().toString(36).toUpperCase() +
                crypto.randomBytes(4).toString('hex').toUpperCase();

    // Deduct from account
    await db.query(
      `UPDATE virtual_accounts SET balance = balance - $1, updatedat = NOW() WHERE id = $2`,
      [amount, account.id]
    );

    // Record transaction
    const txId = 'btxn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO bank_transactions (
        id, reference, from_account, to_account, amount, fee, type, status, description, external_reference, completed_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
      [txId, ref, accountNumber, destination, amount, 0, 'withdrawal', 'completed',
       `Withdrawal to ${destinationType}: ${destination}`, ref]
    );

    // Get new balance
    const newBalanceResult = await db.query(
      'SELECT balance FROM virtual_accounts WHERE id = $1',
      [account.id]
    );

    await db.query('COMMIT');

    console.log(`[Bank Sandbox] Withdrawal: ${ref} - ${amount} to ${destination} (${destinationType})`);

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        transactionId: txId,
        reference: ref,
        amount: amount,
        destination: destination,
        destinationType: destinationType,
        newBalance: newBalanceResult.rows[0].balance,
        status: 'completed'
      }
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal'
    });
  }
});

// ============================================================
// 7. GET TRANSACTION HISTORY
// ============================================================
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { accountNumber, limit = 50 } = req.query;

    // Get user's accounts
    const accounts = await db.query(
      'SELECT account_number FROM virtual_accounts WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const accountNumbers = accounts.rows.map(a => a.account_number);

    if (accountNumbers.length === 0) {
      return res.json({
        success: true,
        transactions: [],
        total: 0
      });
    }

    let query = `
      SELECT 
        id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat
      FROM bank_transactions
      WHERE (from_account = ANY($1) OR to_account = ANY($1))
      ORDER BY createdat DESC
      LIMIT $2
    `;

    const result = await db.query(query, [accountNumbers, parseInt(limit)]);

    res.json({
      success: true,
      transactions: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// ============================================================
// 8. ADMIN - GET ALL VIRTUAL ACCOUNTS
// ============================================================
router.get('/admin/accounts', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { limit = 100 } = req.query;

    const result = await db.query(`
      SELECT 
        va.*,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email
      FROM virtual_accounts va
      JOIN users u ON va.user_id = u.id
      ORDER BY va.createdat DESC
      LIMIT $1
    `, [parseInt(limit)]);

    // Get total balance
    const totalResult = await db.query(
      'SELECT SUM(balance) as total_balance FROM virtual_accounts WHERE is_active = true'
    );

    res.json({
      success: true,
      accounts: result.rows,
      totalAccounts: result.rows.length,
      totalBalance: parseInt(totalResult.rows[0].total_balance) || 0
    });

  } catch (error) {
    console.error('Error fetching admin accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts'
    });
  }
});

// ============================================================
// 9. ADMIN - GET ALL TRANSACTIONS
// ============================================================
router.get('/admin/transactions', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { type, status, limit = 100 } = req.query;

    let query = `
      SELECT 
        bt.*,
        u_from.fullname as from_user,
        u_to.fullname as to_user
      FROM bank_transactions bt
      LEFT JOIN virtual_accounts va_from ON bt.from_account = va_from.account_number
      LEFT JOIN users u_from ON va_from.user_id = u_from.id
      LEFT JOIN virtual_accounts va_to ON bt.to_account = va_to.account_number
      LEFT JOIN users u_to ON va_to.user_id = u_to.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type && type !== 'all') {
      query += ` AND bt.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND bt.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY bt.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    // Get stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'transfer' THEN amount ELSE 0 END) as total_transfers,
        SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
        SUM(fee) as total_fees_collected
      FROM bank_transactions
      WHERE status = 'completed'
    `);

    res.json({
      success: true,
      transactions: result.rows,
      total: result.rows.length,
      stats: {
        totalTransactions: parseInt(statsResult.rows[0].total_transactions) || 0,
        totalDeposits: parseInt(statsResult.rows[0].total_deposits) || 0,
        totalTransfers: parseInt(statsResult.rows[0].total_transfers) || 0,
        totalWithdrawals: parseInt(statsResult.rows[0].total_withdrawals) || 0,
        totalFeesCollected: parseInt(statsResult.rows[0].total_fees_collected) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching admin transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// ============================================================
// 10. SIMULATE WEBHOOK (For Testing)
// ============================================================
router.post('/webhook', async (req, res) => {
  try {
    const db = await getClient();
    const { transactionId, status, externalReference } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and status are required'
      });
    }

    // Check if transaction exists
    const txResult = await db.query(
      'SELECT id, status FROM bank_transactions WHERE id = $1',
      [transactionId]
    );

    if (txResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Update transaction status
    await db.query(
      `UPDATE bank_transactions
       SET status = $1, 
           external_reference = COALESCE($2, external_reference),
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
           updatedat = NOW()
       WHERE id = $3`,
      [status, externalReference || null, transactionId]
    );

    // Record webhook
    const webhookId = 'whk-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO bank_webhooks (id, transaction_id, payload, processed, processed_at, createdat)
       VALUES ($1, $2, $3, true, NOW(), NOW())`,
      [webhookId, transactionId, req.body]
    );

    console.log(`[Bank Sandbox] Webhook: Transaction ${transactionId} status updated to ${status}`);

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        transactionId: transactionId,
        status: status,
        externalReference: externalReference || null
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

module.exports = router;