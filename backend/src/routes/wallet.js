const router = require('express').Router();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER || 'halalhub_user',
  password: process.env.DB_PASSWORD || '@halalhub@#',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'halalhub'
});
client.connect();

router.get('/balance', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  try {
    let phone = req.headers['phone'] || '254794913318';
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    
    const result = await client.query(
      'SELECT walletbalance FROM users WHERE phone = $1',
      [phone]
    );
    const balance = result.rows[0]?.walletbalance || 0;
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  try {
    let phone = req.headers['phone'] || '254794913318';
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    
    const result = await client.query(
      'SELECT * FROM transactions WHERE phone = $1 ORDER BY created_at DESC LIMIT 20',
      [phone]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;