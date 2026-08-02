const router = require('express').Router();
const axios = require('axios');
const { Client } = require('pg');
const virtualAccountService = require('../services/virtual-account.service');

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

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;

// Master account for receiving deposits
const MASTER_ACCOUNT = process.env.BANK_MASTER_ACCOUNT || 'HALALHUB-MASTER-001';

async function getToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}

// ============================================================
// 1. STK PUSH - Initiate M-Pesa Payment
// ============================================================
router.post('/stk-push', async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const userId = req.headers['user-id'] || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!phone || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and valid amount are required'
      });
    }

    const db = await getClient();
    
    // ============================================================
    // VIRTUAL ACCOUNT CHECK - Ensure user has an account
    // ============================================================
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');

    // Use the ngrok URL from your server
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://b4e4-2a02-c207-2298-5677-00-1.ngrok-free.app/api/mpesa/callback';

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: 'HalalHub',
      TransactionDesc: 'Payment'
    };

    console.log('📤 Sending STK Push for:', phone, 'Amount:', amount);

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const checkoutId = response.data.CheckoutRequestID;
    const ref = 'HH-TXN-' + Date.now().toString(36).toUpperCase();

    // ============================================================
    // RECORD TRANSACTION IN BANK TRANSACTIONS TABLE
    // ============================================================
    await db.query(
      `INSERT INTO bank_transactions (
        id, reference, to_account, amount, fee, type, status, 
        external_reference, description, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        ref,
        ref,
        userAccount.account_number,
        amount,
        0,
        'deposit',
        'pending',
        checkoutId,
        `M-Pesa deposit from ${phone}`
      ]
    );

    console.log('✅ STK Push sent successfully');
    res.json({
      success: true,
      data: response.data,
      transactionId: ref,
      checkoutId: checkoutId
    });

  } catch (err) {
    console.error('STK Error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// ============================================================
// 2. M-PESA CALLBACK - Handle Payment Confirmation
// ============================================================
router.post('/callback', async (req, res) => {
  console.log('📞 M-Pesa Callback received');

  const db = await getClient();

  try {
    const { Body } = req.body;
    const result = Body?.stkCallback;
    const checkoutId = result?.CheckoutRequestID;

    if (!checkoutId) {
      console.error('❌ No CheckoutRequestID in callback');
      return res.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    // Get transaction details
    const txResult = await db.query(
      'SELECT * FROM bank_transactions WHERE external_reference = $1 AND type = $2',
      [checkoutId, 'deposit']
    );

    if (txResult.rows.length === 0) {
      console.error('❌ Transaction not found for checkoutId:', checkoutId);
      return res.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    const transaction = txResult.rows[0];

    if (result?.ResultCode === 0) {
      // ============================================================
      // PAYMENT SUCCESSFUL - Credit Virtual Account
      // ============================================================

      const items = result.CallbackMetadata?.Item || [];
      const amount = items.find(i => i.Name === 'Amount')?.Value || transaction.amount;
      const phone = items.find(i => i.Name === 'PhoneNumber')?.Value || '';
      const mpesaReceipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || '';

      console.log(`✅ Payment confirmed: KES ${amount} from ${phone}`);

      // 1. Get the user's virtual account
      const accountResult = await db.query(
        'SELECT account_number FROM virtual_accounts WHERE account_number = $1',
        [transaction.to_account]
      );

      if (accountResult.rows.length === 0) {
        console.error('❌ Virtual account not found:', transaction.to_account);
        return res.json({ ResultCode: 0, ResultDesc: 'Success' });
      }

      const accountNumber = accountResult.rows[0].account_number;

      // 2. Process deposit via virtual account service
      await virtualAccountService.processDeposit(
        accountNumber,
        amount,
        `MPESA-${mpesaReceipt}`
      );

      // 3. Update transaction status
      await db.query(
        `UPDATE bank_transactions 
         SET status = 'completed',
             completed_at = NOW(),
             description = $1,
             updatedat = NOW()
         WHERE external_reference = $2`,
        [`M-Pesa deposit - Receipt: ${mpesaReceipt}`, checkoutId]
      );

      // 4. Record in transactions table for audit
      const txId = 'txn-' + Date.now().toString(36);
      await db.query(
        `INSERT INTO transactions (id, user_id, type, amount, status, reference, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          txId,
          transaction.user_id || 'system',
          'deposit',
          amount,
          'success',
          mpesaReceipt || transaction.reference,
          `M-Pesa top-up via ${phone}`
        ]
      );

      // 5. Create notification for user
      const userResult = await db.query(
        'SELECT user_id FROM virtual_accounts WHERE account_number = $1',
        [accountNumber]
      );

      if (userResult.rows.length > 0) {
        const notificationId = 'notif-' + Date.now().toString(36);
        await db.query(
          `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            notificationId,
            userResult.rows[0].user_id,
            'M-Pesa Deposit Successful',
            `KES ${amount.toLocaleString()} has been deposited to your virtual account. Reference: ${mpesaReceipt}`,
            'deposit',
            '/wallet'
          ]
        );
      }

      console.log(`✅ Virtual account credited: ${accountNumber} with KES ${amount}`);

    } else {
      // ============================================================
      // PAYMENT FAILED - Update Transaction Status
      // ============================================================

      const failureReason = result?.ResultDesc || 'Payment failed';

      console.log(`❌ Payment failed: ${failureReason}`);

      await db.query(
        `UPDATE bank_transactions 
         SET status = 'failed',
             description = $1,
             updatedat = NOW()
         WHERE external_reference = $2`,
        [`M-Pesa payment failed: ${failureReason}`, checkoutId]
      );

      // Create notification for user
      const accountResult = await db.query(
        'SELECT user_id FROM virtual_accounts WHERE account_number = $1',
        [transaction.to_account]
      );

      if (accountResult.rows.length > 0) {
        const notificationId = 'notif-' + Date.now().toString(36);
        await db.query(
          `INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            notificationId,
            accountResult.rows[0].user_id,
            'M-Pesa Deposit Failed',
            `Your M-Pesa deposit of KES ${transaction.amount.toLocaleString()} failed. Reason: ${failureReason}`,
            'deposit',
            '/wallet'
          ]
        );
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (err) {
    console.error('Callback error:', err.message);
    // Always return success to M-Pesa to avoid retries
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

// ============================================================
// 3. CHECK PAYMENT STATUS
// ============================================================
router.get('/status/:checkoutId', async (req, res) => {
  try {
    const db = await getClient();
    const { checkoutId } = req.params;

    const result = await db.query(
      `SELECT id, reference, amount, status, description, completed_at, createdat
       FROM bank_transactions 
       WHERE external_reference = $1 AND type = 'deposit'`,
      [checkoutId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        status: 'not_found',
        message: 'Transaction not found'
      });
    }

    const tx = result.rows[0];

    res.json({
      success: true,
      status: tx.status,
      amount: tx.amount,
      reference: tx.reference,
      description: tx.description,
      completedAt: tx.completed_at,
      createdAt: tx.createdat
    });

  } catch (err) {
    console.error('Status check error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check transaction status'
    });
  }
});

// ============================================================
// 4. MANUAL TOP-UP (For Testing)
// ============================================================
router.post('/manual-topup', async (req, res) => {
  try {
    const db = await getClient();
    const { phone, amount, userId } = req.body;

    if (!userId || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'User ID and valid amount are required'
      });
    }

    // ============================================================
    // VIRTUAL ACCOUNT - Manual Top-up
    // ============================================================

    // 1. Get user's virtual account
    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found'
      });
    }

    // 2. Process deposit via virtual account service
    const ref = 'MANUAL-' + Date.now().toString(36).toUpperCase();
    await virtualAccountService.processDeposit(
      userAccount.account_number,
      amount,
      ref
    );

    // 3. Record in bank_transactions
    await db.query(
      `INSERT INTO bank_transactions (
        id, reference, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, NOW(), NOW(), NOW())`,
      [
        ref,
        ref,
        userAccount.account_number,
        amount,
        0,
        'deposit',
        `Manual top-up for ${phone}`
      ]
    );

    // 4. Get updated balance
    const updatedAccount = await virtualAccountService.getUserAccount(userId);

    console.log(`✅ Manual top-up: KES ${amount} added to ${userAccount.account_number}`);

    res.json({
      success: true,
      message: `KES ${amount} added successfully`,
      data: {
        accountNumber: userAccount.account_number,
        amount: amount,
        reference: ref,
        newBalance: updatedAccount?.balance || 0
      }
    });

  } catch (err) {
    console.error('Manual top-up error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process manual top-up'
    });
  }
});

// ============================================================
// 5. GET USER DEPOSIT HISTORY
// ============================================================
router.get('/history', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found'
      });
    }

    const result = await db.query(
      `SELECT 
        id, reference, amount, status, description, completed_at, createdat
       FROM bank_transactions 
       WHERE to_account = $1 AND type = 'deposit'
       ORDER BY createdat DESC
       LIMIT 50`,
      [userAccount.account_number]
    );

    res.json({
      success: true,
      deposits: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching deposit history:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deposit history'
    });
  }
});

module.exports = router;