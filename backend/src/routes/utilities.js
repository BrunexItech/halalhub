const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const crypto = require('crypto');
const virtualAccountService = require('../services/virtual-account.service');
const bankClient = require('../services/bank-client');

// ============================================================
// Database Connection Pool (removed hardcoded credentials)
// ============================================================
const dbPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  max: 20,
});

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
    const userId = req.user.id;
    
    const result = await dbPool.query(
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
    const userId = req.user.id;
    
    const result = await dbPool.query(
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
    const userId = req.user.id;
    const { providerId, nickname, accountNumber } = req.body;
    
    if (!providerId || !nickname || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Provider, nickname, and account number are required'
      });
    }
    
    const existing = await dbPool.query(
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
    
    await dbPool.query(
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
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await dbPool.query(
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
// PAY UTILITY BILL (Authenticated) - PIN REQUIRED
// ========================================
router.post('/pay', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { providerId, accountNumber, amount, paymentMethod = 'wallet', pin } = req.body;
    
    // Validate PIN is provided
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required to pay utility bill'
      });
    }

    // Verify PIN
    const userResult = await dbPool.query(
      'SELECT pinhash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const validPin = await bcrypt.compare(pin, userResult.rows[0].pinhash);
    if (!validPin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }
    
    if (!providerId || !accountNumber || !amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Valid provider, account number, and amount (min KES 10) required'
      });
    }
    
    const amountNum = parseFloat(amount);
    
    const userAccount = await virtualAccountService.getUserAccount(userId);
    
    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }
    
    if (userAccount.balance < amountNum) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: KES ${userAccount.balance.toLocaleString()}`
      });
    }
    
    await dbPool.query('BEGIN');
    
    try {
      const ref = 'UTIL-' + Date.now().toString(36).toUpperCase() + 
                  crypto.randomBytes(4).toString('hex').toUpperCase();
      
      const paymentId = 'pay-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      const receiptNumber = 'RCP-' + ref.slice(0, 10);
      
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        process.env.BANK_MASTER_ACCOUNT || 'HALALHUB-MASTER-001',
        amountNum,
        `Utility payment - ${providerId}`
      );
      
      await dbPool.query(
        `INSERT INTO utility_payments 
         (id, user_id, provider_id, account_number, amount, transaction_ref, 
          status, payment_method, receipt_number, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [paymentId, userId, providerId, accountNumber, amountNum, ref, 'completed', paymentMethod, receiptNumber]
      );
      
      const txId = 'txn-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
      await dbPool.query(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [txId, userId, 'utility', -amountNum, 'success', ref, `Utility payment - ${providerId}`]
      );
      
      const updatedAccount = await virtualAccountService.getUserAccount(userId);
      const newBalance = updatedAccount?.balance || 0;
      
      await dbPool.query('COMMIT');
      
      console.log(`[Utility Payment] ${ref} - KES ${amountNum} by user ${userId} using virtual account ${userAccount.account_number}`);
      
      res.json({
        success: true,
        message: 'Utility payment successful',
        data: {
          transactionRef: ref,
          amount: amountNum,
          balance: newBalance,
          receiptNumber: receiptNumber,
          paymentId: paymentId,
          paidAt: new Date().toISOString(),
          accountNumber: userAccount.account_number
        }
      });
      
    } catch (err) {
      await dbPool.query('ROLLBACK');
      throw err;
    }
    
  } catch (error) {
    await dbPool.query('ROLLBACK');
    console.error('Utility payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment failed. Please try again.'
    });
  }
});

// ========================================
// CHECK PAYMENT STATUS (Authenticated)
// ========================================
router.get('/status/:ref', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ref } = req.params;
    
    const result = await dbPool.query(
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