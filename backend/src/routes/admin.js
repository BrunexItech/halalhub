const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const db = await getClient();
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND isadmin = true',
      [email]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Admin not found' });
    }
    
    const valid = await bcrypt.compare(password, user.pinhash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin stats
router.get('/stats', async (req, res) => {
  try {
    const db = await getClient();
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const adminCount = await db.query("SELECT COUNT(*) FROM users WHERE isadmin = true");
    
    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalAdmins: parseInt(adminCount.rows[0].count),
      totalTransactions: 3542,
      totalVolume: 2845000,
      activeLoans: 28,
      zakatCollected: 384000,
      sadaqaCollected: 742000,
      pendingKYC: 47
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query('SELECT * FROM users ORDER BY createdat DESC');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const db = await getClient();
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;