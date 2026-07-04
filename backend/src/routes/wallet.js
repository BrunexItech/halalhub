const router = require('express').Router();
const { Client } = require('pg');

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

router.get('/balance', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  try {
    const db = await getClient();
    let phone = req.headers['phone'] || '254794913318';
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    
    const result = await db.query(
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
    const db = await getClient();
    let phone = req.headers['phone'] || '254794913318';
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    
    const result = await db.query(
      'SELECT * FROM transactions WHERE phone = $1 ORDER BY created_at DESC LIMIT 20',
      [phone]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;