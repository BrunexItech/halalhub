const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

const otpStore = new Map();

// Client Registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, email, nationalId, pin, region, subCounty, role } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const db = await getClient();
    const pinHash = await bcrypt.hash(pin, 12);
    const userId = 'user-' + Date.now();
    
    await db.query(
      `INSERT INTO users (id, fullname, phone, email, nationalid, pinhash, role, region, sub_county)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, fullName, phone, email, nationalId, pinHash, role || 'client', region || '', subCounty || '']
    );
    
    const token = jwt.sign(
      { id: userId, email, role: role || 'client' },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: userId, fullName, phone, email, role: role || 'client' }
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone or email already registered' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Vendor Registration
router.post('/register-vendor', async (req, res) => {
  try {
    const { 
      businessName, region, subCounty, phone, email, nationalId, kraPin, businessRegNo, pin, 
      halalDeclared, termsAccepted 
    } = req.body;
    
    if (!businessName || !phone || !email || !nationalId || !kraPin || !businessRegNo || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!halalDeclared || !termsAccepted) {
      return res.status(400).json({ error: 'Please accept all declarations' });
    }
    
    const db = await getClient();
    const pinHash = await bcrypt.hash(pin, 12);
    const vendorId = 'vendor-' + Date.now();
    
    const existing = await db.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phone, email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Phone or email already registered' });
    }
    
    await db.query(
      `INSERT INTO users (id, fullname, phone, email, nationalid, pinhash, role, region, sub_county,
        business_name, kra_pin, business_reg_no, halal_declared, terms_accepted, vendor_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        vendorId, 
        businessName, 
        phone, 
        email, 
        nationalId, 
        pinHash, 
        'vendor', 
        region || '',
        subCounty || '',
        businessName,
        kraPin,
        businessRegNo,
        halalDeclared,
        termsAccepted,
        'pending'
      ]
    );
    
    res.status(201).json({
      message: 'Vendor application submitted successfully! Awaiting admin approval.',
      vendorId: vendorId,
      status: 'pending'
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone or email already registered' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Login Step 1 - OTP shown in console only
router.post('/login-step1', async (req, res) => {
  const { phone } = req.body;
  
  try {
    const db = await getClient();
    const result = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const user = result.rows[0];
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    otpStore.set(phone, { otp, expiresAt: Date.now() + 300000 });
    
    console.log(`📧 OTP for ${user.email}: ${otp}`);
    console.log(`📱 Phone: ${phone}`);
    
    res.json({
      message: 'OTP sent. Check console for code.',
      phone: phone.replace(/(\+254)(\d{3})\d+(\d{3})/, '$1$2***$3')
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Login Step 2 - Verify OTP and PIN
router.post('/login-step2', async (req, res) => {
  try {
    const { phone, pin, otp } = req.body;
    
    const otpData = otpStore.get(phone);
    if (!otpData || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    const db = await getClient();
    const result = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const valid = await bcrypt.compare(pin, user.pinhash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    
    otpStore.delete(phone);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        phone: user.phone,
        email: user.email,
        role: user.role  // <-- This returns role to frontend
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;