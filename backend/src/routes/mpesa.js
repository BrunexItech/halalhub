const router = require('express').Router();
const axios = require('axios');
const { Client } = require('pg');

const client = new Client({
  user: 'halalhub_user',
  password: '@halalhub@#',
  host: 'localhost',
  port: 5432,
  database: 'halalhub'
});
client.connect();

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;

async function getToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}

router.post('/stk-push', async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const userId = req.headers['user-id'] || 'user-001';
    
    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString('base64');

    const callbackUrl = 'https://ed90-102-176-180-218.ngrok-free.app/api/mpesa/callback';

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

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const checkoutId = response.data.CheckoutRequestID;
    const ref = 'HH-TXN-' + Date.now();
    
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, checkout_request_id, phone, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ref, userId, 'topup', amount, 'pending', checkoutId, phone, ref]
    );

    res.json({ 
      success: true, 
      data: response.data,
      transactionId: ref,
      checkoutId: checkoutId
    });
    
  } catch (err) {
    console.error('STK Error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: err.response?.data || err.message 
    });
  }
});

router.post('/callback', async (req, res) => {
  console.log('📞 Callback received');
  
  try {
    const { Body } = req.body;
    const result = Body?.stkCallback;
    const checkoutId = result?.CheckoutRequestID;
    
    if (result?.ResultCode === 0) {
      const items = result.CallbackMetadata?.Item || [];
      const amount = items.find(i => i.Name === 'Amount')?.Value || 0;
      const phone = items.find(i => i.Name === 'PhoneNumber')?.Value || '';
      
      await client.query(
        `UPDATE transactions SET status = 'success', amount = $1 WHERE checkout_request_id = $2`,
        [amount, checkoutId]
      );
      
      await client.query(
        `UPDATE users SET walletbalance = walletbalance + $1 WHERE phone = $2`,
        [amount, phone]
      );
      
      console.log(`✅ Payment confirmed: KES ${amount} added to ${phone}`);
    } else {
      await client.query(
        `UPDATE transactions SET status = 'failed' WHERE checkout_request_id = $1`,
        [checkoutId]
      );
      console.log(`❌ Payment failed: ${result?.ResultDesc}`);
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err) {
    console.error('Callback error:', err.message);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
});

// MANUAL TOPUP - For testing without M-Pesa
router.post('/manual-topup', async (req, res) => {
  try {
    const { phone, amount } = req.body;
    
    await client.query(
      `UPDATE users SET walletbalance = walletbalance + $1 WHERE phone = $2`,
      [amount, phone]
    );
    
    const ref = 'HH-MAN-' + Date.now();
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, status, phone, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ref, 'user-001', 'manual_topup', amount, 'success', phone, ref]
    );
    
    res.json({ 
      success: true, 
      message: `KES ${amount} added to ${phone}` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:checkoutId', async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM transactions WHERE checkout_request_id = $1`,
      [req.params.checkoutId]
    );
    res.json(result.rows[0] || { status: 'not_found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
