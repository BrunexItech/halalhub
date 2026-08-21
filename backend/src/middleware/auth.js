const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in environment variables');
}

// Create connection pool (singleton)
const dbPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  max: 20, // connection pool size
});

exports.authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const result = await dbPool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

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

// Status check helpers (using pool)
const checkStatus = async (userId, statusField, statusValue, errorMessage) => {
  const result = await dbPool.query(
    `SELECT ${statusField} FROM users WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const status = result.rows[0][statusField];
  if (status !== statusValue) {
    throw new Error(errorMessage || `Status is ${status}`);
  }
  
  return true;
};

exports.isVendorApproved = async (req, res, next) => {
  try {
    await checkStatus(req.user.id, 'vendor_status', 'approved', 'Vendor account not approved');
    next();
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
};

exports.isImamApproved = async (req, res, next) => {
  try {
    await checkStatus(req.user.id, 'imam_status', 'approved', 'Imam account not approved');
    next();
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
};

exports.isKYCVerified = async (req, res, next) => {
  try {
    await checkStatus(req.user.id, 'kycstatus', 'verified', 'KYC not verified');
    next();
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
};