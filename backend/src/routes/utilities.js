const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');

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

// ========================================
// GET ALL UTILITY PROVIDERS (Hardcoded)
// ========================================
router.get('/', async (req, res) => {
  const utilities = [
    { id: 'kplc', name: 'Kenya Power', paybill: '888880', category: 'electricity', icon: '⚡', color: '#E31E24', description: 'Prepaid & postpaid electricity bills', service_type: 'prepaid', fields: ['Meter Number', 'Account Number'] },
    { id: 'nairobi-water', name: 'Nairobi Water', paybill: '444400', category: 'water', icon: '💧', color: '#2196F3', description: 'Water & sewerage services', service_type: 'bill', fields: ['Account Number'] },
    { id: 'safaricom-fibre', name: 'Safaricom Fibre', paybill: '333200', category: 'internet', icon: '🌐', color: '#4CAF50', description: 'High-speed fibre internet', service_type: 'subscription', fields: ['Account Number'] },
    { id: 'dstv', name: 'DStv', paybill: '321000', category: 'tv', icon: '📺', color: '#9C27B0', description: 'Satellite TV subscriptions', service_type: 'subscription', fields: ['Subscriber Number'] },
    { id: 'gotv', name: 'GOtv', paybill: '321100', category: 'tv', icon: '📺', color: '#FF5722', description: 'Digital TV subscriptions', service_type: 'subscription', fields: ['Subscriber Number'] },
    { id: 'zuku', name: 'Zuku Fibre', paybill: '333300', category: 'internet', icon: '🌐', color: '#E91E63', description: 'Fibre internet & TV', service_type: 'subscription', fields: ['Account Number'] },
    { id: 'county-rates', name: 'County Rates', paybill: '222111', category: 'government', icon: '🏛️', color: '#FF9800', description: 'Land rates & property taxes', service_type: 'bill', fields: ['Account Number'] }
  ];
  
  res.json({
    success: true,
    utilities: utilities
  });
});

// ========================================
// GET PAYMENT HISTORY (Authenticated)
// ========================================
router.get('/history', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT 
        id,
        provider_id,
        account_number,
        amount,
        transaction_ref,
        status,
        payment_method,
        receipt_number,
        paid_at,
        createdat
       FROM utility_payments
       WHERE user_id = $1
       ORDER BY createdat DESC
       LIMIT 50`,
      [userId]
    );
    
    res.json({
      success: true,
      history: result.rows
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load payment history'
    });
  }
});

// ========================================
// GET SAVED SERVICES (Authenticated)
// ========================================
router.get('/saved', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT 
        id,
        provider_id,
        nickname,
        account_number,
        is_default
       FROM saved_services
       WHERE user_id = $1
       ORDER BY nickname`,
      [userId]
    );
    
    res.json({
      success: true,
      savedServices: result.rows
    });
  } catch (error) {
    console.error('Error fetching saved services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load saved services'
    });
  }
});

// ========================================
// SAVE SERVICE (Authenticated)
// ========================================
router.post('/saved', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { providerId, nickname, accountNumber } = req.body;
    
    if (!providerId || !nickname || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Provider, nickname, and account number are required'
      });
    }
    
    // Check if already saved
    const existing = await db.query(
      'SELECT id FROM saved_services WHERE user_id = $1 AND provider_id = $2 AND account_number = $3',
      [userId, providerId, accountNumber]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This service is already saved'
      });
    }
    
    const id = 'svc-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    
    await db.query(
      `INSERT INTO saved_services (id, user_id, provider_id, nickname, account_number)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, providerId, nickname, accountNumber]
    );
    
    res.status(201).json({
      success: true,
      message: 'Service saved successfully',
      id: id
    });
  } catch (error) {
    console.error('Error saving service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save service'
    });
  }
});

// ========================================
// DELETE SAVED SERVICE (Authenticated)
// ========================================
router.delete('/saved/:id', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM saved_services WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Saved service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service removed successfully'
    });
  } catch (error) {
    console.error('Error deleting saved service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove service'
    });
  }
});

// ========================================
// PAY UTILITY BILL (Authenticated)
// ========================================
router.post('/pay', authenticate, async (req, res) => {
  const db = await getClient();
  
  try {
    const userId = req.user.id;
    const { providerId, accountNumber, amount, paymentMethod = 'wallet' } = req.body;
    
    // Validate inputs
    if (!providerId || !accountNumber || !amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Valid provider, account number, and amount (min KES 10) required'
      });
    }
    
    const amountNum = parseFloat(amount);
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Get user's current wallet balance with FOR UPDATE lock
    const balanceResult = await db.query(
      'SELECT walletbalance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    
    if (balanceResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const currentBalance = balanceResult.rows[0].walletbalance;
    
    if (currentBalance < amountNum) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient wallet balance. Available: KES ${currentBalance.toLocaleString()}`
      });
    }
    
    // Generate transaction reference
    const ref = 'UTIL-' + Date.now().toString(36).toUpperCase() + 
                crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const paymentId = 'pay-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const receiptNumber = 'RCP-' + ref.slice(0, 10);
    
    // Deduct from wallet
    await db.query(
      'UPDATE users SET walletbalance = walletbalance - $1, updatedat = NOW() WHERE id = $2',
      [amountNum, userId]
    );
    
    // Insert payment record
    await db.query(
      `INSERT INTO utility_payments 
       (id, user_id, provider_id, account_number, amount, transaction_ref, 
        status, payment_method, receipt_number, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [paymentId, userId, providerId, accountNumber, amountNum, ref, 'completed', paymentMethod, receiptNumber]
    );
    
    // Also record in transactions table for consistency
    const txId = 'txn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, reference, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [txId, userId, 'utility', -amountNum, 'success', ref, 'Utility payment']
    );
    
    // Get new balance
    const newBalanceResult = await db.query(
      'SELECT walletbalance FROM users WHERE id = $1',
      [userId]
    );
    
    const newBalance = newBalanceResult.rows[0].walletbalance;
    
    await db.query('COMMIT');
    
    console.log(`Utility payment: ${ref} - KES ${amountNum} by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Utility payment successful',
      data: {
        transactionRef: ref,
        amount: amountNum,
        balance: newBalance,
        receiptNumber: receiptNumber,
        paymentId: paymentId,
        paidAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Utility payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment failed. Please try again.'
    });
  }
});

// ========================================
// CHECK PAYMENT STATUS (Authenticated)
// ========================================
router.get('/status/:ref', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { ref } = req.params;
    
    const result = await db.query(
      `SELECT 
        id,
        provider_id,
        account_number,
        amount,
        transaction_ref,
        status,
        payment_method,
        receipt_number,
        paid_at,
        createdat
       FROM utility_payments
       WHERE transaction_ref = $1 AND user_id = $2`,
      [ref, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      payment: result.rows[0]
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status'
    });
  }
});

module.exports = router;