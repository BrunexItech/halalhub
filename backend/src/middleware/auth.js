const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'halalhub_sharia_2025';

// ============================================================
// AUTHENTICATE MIDDLEWARE - Verify JWT Token
// ============================================================
exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============================================================
// GENERATE TOKEN - Create JWT
// ============================================================
exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// ============================================================
// AUTHORIZE ROLES - Check if user has required role
// ============================================================
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// ============================================================
// CHECK VENDOR STATUS - Verify vendor is approved
// ============================================================
exports.isVendorApproved = async (req, res, next) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      user: process.env.DB_USER || 'halalhub_user',
      password: process.env.DB_PASSWORD || '@halalhub@#',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'halalhub'
    });
    await client.connect();

    const result = await client.query(
      'SELECT vendor_status FROM users WHERE id = $1',
      [req.user.id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const status = result.rows[0].vendor_status;
    if (status !== 'approved') {
      return res.status(403).json({ 
        error: `Vendor account not approved. Status: ${status}` 
      });
    }

    next();
  } catch (err) {
    console.error('Error checking vendor status:', err.message);
    return res.status(500).json({ error: 'Failed to verify vendor status' });
  }
};

// ============================================================
// CHECK IMAM STATUS - Verify imam is approved
// ============================================================
exports.isImamApproved = async (req, res, next) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      user: process.env.DB_USER || 'halalhub_user',
      password: process.env.DB_PASSWORD || '@halalhub@#',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'halalhub'
    });
    await client.connect();

    const result = await client.query(
      'SELECT imam_status FROM users WHERE id = $1',
      [req.user.id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const status = result.rows[0].imam_status;
    if (status !== 'approved') {
      return res.status(403).json({ 
        error: `Imam account not approved. Status: ${status}` 
      });
    }

    next();
  } catch (err) {
    console.error('Error checking imam status:', err.message);
    return res.status(500).json({ error: 'Failed to verify imam status' });
  }
};

// ============================================================
// CHECK KYC STATUS - Verify user KYC is complete
// ============================================================
exports.isKYCVerified = async (req, res, next) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      user: process.env.DB_USER || 'halalhub_user',
      password: process.env.DB_PASSWORD || '@halalhub@#',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'halalhub'
    });
    await client.connect();

    const result = await client.query(
      'SELECT kycstatus FROM users WHERE id = $1',
      [req.user.id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const status = result.rows[0].kycstatus;
    if (status !== 'verified') {
      return res.status(403).json({ 
        error: `KYC not verified. Status: ${status}` 
      });
    }

    next();
  } catch (err) {
    console.error('Error checking KYC status:', err.message);
    return res.status(500).json({ error: 'Failed to verify KYC status' });
  }
};