const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');
const virtualAccountService = require('../services/virtual-account.service');

// Database connection
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

const NISAB = { gold: 842500, silver: 71400 };
const ZAKAT_RATE = 0.025;

// Master account for Zakat pool
const ZAKAT_POOL_ACCOUNT = process.env.ZAKAT_POOL_ACCOUNT || 'ZAKAT-POOL-001';

// ============================================================
// 1. CALCULATE ZAKAT (Public)
// ============================================================
router.post('/calculate', async (req, res) => {
  try {
    const {
      cash = 0,
      gold = 0,
      silver = 0,
      business = 0,
      investments = 0,
      receivables = 0,
      liabilities = 0,
      nisabType = 'silver'
    } = req.body;

    const totalAssets = cash + gold + silver + business + investments + receivables;
    const netAssets = totalAssets - liabilities;
    const nisabThreshold = NISAB[nisabType] || NISAB.silver;
    const zakatDue = netAssets >= nisabThreshold ? Math.round(netAssets * ZAKAT_RATE) : 0;

    res.json({
      success: true,
      data: {
        totalAssets,
        liabilities,
        netAssets,
        nisabThreshold,
        nisabType,
        zakatDue,
        isObligatory: netAssets >= nisabThreshold,
        rate: ZAKAT_RATE
      }
    });
  } catch (error) {
    console.error('Zakat calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate Zakat'
    });
  }
});

// ============================================================
// 2. GET ZAKAT DUE FOR CURRENT USER (Authenticated)
// ============================================================
router.get('/due', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    // Get user's virtual account balance
    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    const balance = account.balance || 0;
    
    // Calculate Zakat due (2.5% of balance if above nisab)
    const nisabThreshold = NISAB.silver;
    const zakatDue = balance >= nisabThreshold ? Math.round(balance * ZAKAT_RATE) : 0;

    // Get user's total Zakat paid this year
    const currentYear = new Date().getFullYear();
    const paidResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid
       FROM zakat_payments
       WHERE user_id = $1 
         AND status = 'completed'
         AND EXTRACT(YEAR FROM paid_at) = $2`,
      [userId, currentYear]
    );

    res.json({
      success: true,
      zakatDue: zakatDue,
      walletBalance: balance,
      nisabThreshold: nisabThreshold,
      totalPaidThisYear: parseInt(paidResult.rows[0].total_paid) || 0,
      isObligatory: balance >= nisabThreshold
    });

  } catch (error) {
    console.error('Error fetching Zakat due:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Zakat due'
    });
  }
});

// ============================================================
// 3. GET VERIFIED RECIPIENTS (Public)
// ============================================================
router.get('/recipients', async (req, res) => {
  try {
    const db = await getClient();
    const { category } = req.query;

    let query = `
      SELECT 
        id,
        name,
        description,
        category,
        location,
        verified,
        total_received,
        donor_count
      FROM zakat_recipients
      WHERE verified = true AND is_active = true
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY total_received ASC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      recipients: result.rows
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipients'
    });
  }
});

// ============================================================
// 4. PAY ZAKAT (Authenticated - User)
// ============================================================
router.post('/pay', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { amount, recipientId, category, notes = '' } = req.body;

    // Validate input
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Minimum Zakat amount is KES 100'
      });
    }

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Please select a verified recipient'
      });
    }

    // Check recipient exists and is verified
    const recipientCheck = await db.query(
      `SELECT id, name, category FROM zakat_recipients 
       WHERE id = $1 AND verified = true AND is_active = true`,
      [recipientId]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found or not verified'
      });
    }

    const recipient = recipientCheck.rows[0];

    // ============================================================
    // VIRTUAL ACCOUNT FLOW - REPLACES OLD WALLET SYSTEM
    // ============================================================

    // 1. Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    // 2. Check if user has enough balance
    if (userAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: KES ${userAccount.balance.toLocaleString()}`
      });
    }

    // Begin transaction
    await db.query('BEGIN');

    try {
      // 3. Generate reference
      const ref = 'ZKT-' + Date.now().toString(36).toUpperCase() +
                  crypto.randomBytes(4).toString('hex').toUpperCase();

      const paymentId = 'zkt-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

      // 4. DEDUCT FROM VIRTUAL ACCOUNT using virtualAccountService
      await virtualAccountService.processTransfer(
        userId,                                    // User ID
        userAccount.account_number,               // From account (user's virtual account)
        ZAKAT_POOL_ACCOUNT,                       // To account (Zakat pool account)
        amount,                                   // Amount
        `Zakat payment - ${recipient.name}`       // Description
      );

      // 5. Record Zakat payment
      await db.query(
        `INSERT INTO zakat_payments (
          id, user_id, recipient_id, amount, reference, category, notes, status, paid_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW(), NOW(), NOW())`,
        [paymentId, userId, recipientId, amount, ref, category, notes]
      );

      // 6. Update recipient stats
      await db.query(
        `UPDATE zakat_recipients 
         SET total_received = total_received + $1, 
             donor_count = donor_count + 1,
             updatedat = NOW()
         WHERE id = $2`,
        [amount, recipientId]
      );

      // 7. Credit community pool (Zakat fund)
      await db.query(
        `INSERT INTO community_pool (id, type, amount, source, reference, source_id, createdat)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          'pool-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex'),
          'zakat',
          amount,
          'user_payment',
          ref,
          paymentId
        ]
      );

      // 8. Record in transactions table for history
      const txId = 'txn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await db.query(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [txId, userId, 'zakat', -amount, 'success', ref, `Zakat payment to ${recipient.name}`]
      );

      // 9. Get new balance
      const updatedAccount = await virtualAccountService.getUserAccount(userId);
      const newBalance = updatedAccount?.balance || 0;

      await db.query('COMMIT');

      console.log(`[Zakat] ${ref} - KES ${amount} by user ${userId} to ${recipient.name} using virtual account ${userAccount.account_number}`);

      res.status(201).json({
        success: true,
        message: 'Zakat paid successfully',
        data: {
          reference: ref,
          amount: amount,
          recipient: recipient.name,
          category: recipient.category,
          balance: newBalance,
          paymentId: paymentId,
          paidAt: new Date().toISOString(),
          accountNumber: userAccount.account_number
        }
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Zakat payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment failed. Please try again.'
    });
  }
});

// ============================================================
// 5. GET ZAKAT HISTORY (Authenticated - User)
// ============================================================
router.get('/history', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const result = await db.query(
      `SELECT 
        zp.id,
        zp.amount,
        zp.reference,
        zp.category,
        zp.notes,
        zp.status,
        zp.paid_at,
        zp.createdat,
        zr.name as recipient_name,
        zr.description as recipient_description
      FROM zakat_payments zp
      LEFT JOIN zakat_recipients zr ON zp.recipient_id = zr.id
      WHERE zp.user_id = $1
      ORDER BY zp.createdat DESC
      LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Error fetching Zakat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Zakat history'
    });
  }
});

// ============================================================
// 6. GET ZAKAT SUMMARY (Authenticated - User)
// ============================================================
router.get('/summary', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        COUNT(DISTINCT recipient_id) as unique_recipients,
        MIN(paid_at) as first_payment,
        MAX(paid_at) as last_payment
      FROM zakat_payments
      WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    res.json({
      success: true,
      summary: {
        totalPayments: parseInt(result.rows[0].total_payments) || 0,
        totalAmount: parseInt(result.rows[0].total_amount) || 0,
        uniqueRecipients: parseInt(result.rows[0].unique_recipients) || 0,
        firstPayment: result.rows[0].first_payment,
        lastPayment: result.rows[0].last_payment
      }
    });
  } catch (error) {
    console.error('Error fetching Zakat summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Zakat summary'
    });
  }
});

// ============================================================
// 7. ADMIN - GET ALL ZAKAT PAYMENTS
// ============================================================
router.get('/admin/payments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { status, date_from, date_to, limit = 100 } = req.query;

    let query = `
      SELECT 
        zp.*,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email,
        zr.name as recipient_name,
        zr.category as recipient_category
      FROM zakat_payments zp
      LEFT JOIN users u ON zp.user_id = u.id
      LEFT JOIN zakat_recipients zr ON zp.recipient_id = zr.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND zp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND zp.paid_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND zp.paid_at <= $${paramIndex}`;
      params.push(date_to + ' 23:59:59');
      paramIndex++;
    }

    query += ` ORDER BY zp.paid_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    // Get total stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(amount) as total_amount
      FROM zakat_payments
      WHERE status = 'completed'`
    );

    res.json({
      success: true,
      payments: result.rows,
      stats: {
        total: parseInt(statsResult.rows[0].total) || 0,
        totalAmount: parseInt(statsResult.rows[0].total_amount) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching Zakat payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Zakat payments'
    });
  }
});

// ============================================================
// 8. ADMIN - GET ZAKAT RECIPIENTS (All)
// ============================================================
router.get('/admin/recipients', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { status, category } = req.query;

    let query = `
      SELECT 
        id,
        user_id,
        name,
        description,
        category,
        location,
        contact_name,
        contact_phone,
        contact_email,
        bank_name,
        bank_account,
        mpesa_number,
        verified,
        is_active,
        total_received,
        donor_count,
        verified_at,
        createdat,
        updatedat
      FROM zakat_recipients
      WHERE 1=1
    `;
    const params = [];

    if (status === 'pending') {
      query += ` AND verified = false`;
    } else if (status === 'verified') {
      query += ` AND verified = true AND is_active = true`;
    }

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    query += ` ORDER BY createdat DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      recipients: result.rows
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipients'
    });
  }
});

// ============================================================
// 9. ADMIN - ADD ZAKAT RECIPIENT (FIXED)
// ============================================================
router.post('/admin/recipients', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const {
      name,
      description,
      category,
      location,
      contact_name,
      contact_phone,
      contact_email,
      bank_name,
      bank_account,
      mpesa_number
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name and category are required'
      });
    }

    const id = 'rcp-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    // FIXED: Added user_id column and null as second parameter
    await db.query(
      `INSERT INTO zakat_recipients (
        id, user_id, name, description, category, location, contact_name, contact_phone, contact_email,
        bank_name, bank_account, mpesa_number, verified, is_active, verified_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, true, NOW(), NOW(), NOW())`,
      [
        id,
        null, // user_id (can be null for admin-created recipients)
        name,
        description || '',
        category,
        location || '',
        contact_name || '',
        contact_phone || '',
        contact_email || '',
        bank_name || '',
        bank_account || '',
        mpesa_number || ''
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Recipient added successfully',
      recipientId: id
    });
  } catch (error) {
    console.error('Error adding recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add recipient'
    });
  }
});

// ============================================================
// 10. ADMIN - UPDATE ZAKAT RECIPIENT
// ============================================================
router.put('/admin/recipients/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const recipientId = req.params.id;
    const {
      name,
      description,
      category,
      location,
      contact_name,
      contact_phone,
      contact_email,
      bank_name,
      bank_account,
      mpesa_number,
      verified,
      is_active
    } = req.body;

    const check = await db.query(
      'SELECT id FROM zakat_recipients WHERE id = $1',
      [recipientId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    await db.query(
      `UPDATE zakat_recipients SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        location = COALESCE($4, location),
        contact_name = COALESCE($5, contact_name),
        contact_phone = COALESCE($6, contact_phone),
        contact_email = COALESCE($7, contact_email),
        bank_name = COALESCE($8, bank_name),
        bank_account = COALESCE($9, bank_account),
        mpesa_number = COALESCE($10, mpesa_number),
        verified = COALESCE($11, verified),
        is_active = COALESCE($12, is_active),
        verified_at = CASE WHEN $11 = true AND verified = false THEN NOW() ELSE verified_at END,
        updatedat = NOW()
      WHERE id = $13`,
      [
        name, description, category, location, contact_name, contact_phone,
        contact_email, bank_name, bank_account, mpesa_number, verified,
        is_active !== undefined ? is_active : true, recipientId
      ]
    );

    res.json({
      success: true,
      message: 'Recipient updated successfully'
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update recipient'
    });
  }
});

// ============================================================
// 11. ADMIN - GET COMMUNITY POOL BALANCE
// ============================================================
router.get('/admin/pool', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();

    // Get pool balance from virtual accounts
    const zakatPool = await virtualAccountService.getAccountByNumber(ZAKAT_POOL_ACCOUNT);
    const zakatBalance = zakatPool?.balance || 0;

    // Get Sadaqa pool balance if exists
    const sadaqaPool = await virtualAccountService.getAccountByNumber('SADAQA-POOL-001');
    const sadaqaBalance = sadaqaPool?.balance || 0;

    // Get disbursed amount
    const disbursedResult = await db.query(
      `SELECT 
        SUM(amount) as total_disbursed
      FROM pool_disbursements
      WHERE status = 'completed'`
    );

    res.json({
      success: true,
      pool: {
        zakatBalance: zakatBalance,
        sadaqaBalance: sadaqaBalance,
        totalBalance: zakatBalance + sadaqaBalance,
        totalDisbursed: parseInt(disbursedResult.rows[0].total_disbursed) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching pool balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pool balance'
    });
  }
});

// ============================================================
// 12. ADMIN - DISBURSE TO RECIPIENT
// ============================================================
router.post('/admin/disburse', authenticate, authorize('admin'), async (req, res) => {
  const db = await getClient();

  try {
    const { recipientId, amount, type = 'zakat', notes = '' } = req.body;

    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipient and amount are required'
      });
    }

    // Check recipient exists and is verified
    const recipientCheck = await db.query(
      `SELECT id, name FROM zakat_recipients WHERE id = $1 AND verified = true AND is_active = true`,
      [recipientId]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found or not verified'
      });
    }

    const recipient = recipientCheck.rows[0];

    // Determine which pool account to use
    const poolAccount = type === 'zakat' ? ZAKAT_POOL_ACCOUNT : 'SADAQA-POOL-001';
    
    // Check pool has enough balance
    const poolBalance = await virtualAccountService.getAccountByNumber(poolAccount);

    if (!poolBalance || poolBalance.balance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient ${type} pool balance. Available: KES ${(poolBalance?.balance || 0).toLocaleString()}`
      });
    }

    // Get recipient's virtual account (assuming they have one)
    // For disbursement, we need to transfer to recipient's virtual account
    // First, check if recipient has a user_id associated
    const recipientUserCheck = await db.query(
      `SELECT user_id FROM zakat_recipients WHERE id = $1`,
      [recipientId]
    );

    let recipientAccountNumber = null;
    let recipientUserId = recipientUserCheck.rows[0]?.user_id;

    if (recipientUserId) {
      const recipientAccount = await virtualAccountService.getUserAccount(recipientUserId);
      if (recipientAccount) {
        recipientAccountNumber = recipientAccount.account_number;
      }
    }

    // If no virtual account found, we need to create one or use bank details
    // For now, we'll record the disbursement and handle payment separately
    // In a real scenario, you'd transfer to the recipient's bank or M-Pesa

    await db.query('BEGIN');

    try {
      const ref = 'DSB-' + Date.now().toString(36).toUpperCase() +
                  crypto.randomBytes(4).toString('hex').toUpperCase();

      const disbursementId = 'dsb-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

      // If recipient has a virtual account, transfer directly
      if (recipientAccountNumber) {
        // Transfer from pool to recipient's virtual account
        await virtualAccountService.processTransfer(
          'system',  // System user (no actual user ID needed for pool transfers)
          poolAccount,
          recipientAccountNumber,
          amount,
          `Zakat disbursement to ${recipient.name}`
        );
      } else {
        // No virtual account - just record the disbursement
        // Actual payment would be done via bank transfer or M-Pesa
        console.log(`[Zakat] Disbursement to ${recipient.name} - No virtual account found. Manual payment required.`);
      }

      // Record disbursement
      await db.query(
        `INSERT INTO pool_disbursements (
          id, recipient_id, amount, type, reference, notes, status, disbursed_at, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), NOW(), NOW())`,
        [disbursementId, recipientId, amount, type, ref, notes]
      );

      // Update recipient stats
      await db.query(
        `UPDATE zakat_recipients 
         SET total_received = total_received + $1
         WHERE id = $2`,
        [amount, recipientId]
      );

      await db.query('COMMIT');

      console.log(`[Zakat] Disbursement: ${ref} - KES ${amount} to ${recipient.name}`);

      res.status(201).json({
        success: true,
        message: 'Disbursement successful',
        data: {
          reference: ref,
          recipient: recipient.name,
          amount: amount,
          type: type,
          disbursementId: disbursementId,
          disbursedAt: new Date().toISOString(),
          transferredToVirtualAccount: !!recipientAccountNumber
        }
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Disbursement error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process disbursement'
    });
  }
});

module.exports = router;