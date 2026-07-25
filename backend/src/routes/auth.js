const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

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

// ============================================================
// REGISTRATION OTP ENDPOINTS
// ============================================================

router.post('/send-registration-otp', async (req, res) => {
  const { phone, email } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  try {
    const db = await getClient();
    const existing = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    otpStore.set(`reg_${phone}`, { 
      otp, 
      expiresAt: Date.now() + 300000
    });
    
    console.log(`Registration OTP for ${phone}: ${otp}`);
    console.log(`Email: ${email || 'Not provided'}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: otp
    });
  } catch (err) {
    console.error('Error sending registration OTP:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-registration-otp', async (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }
  
  try {
    const otpData = otpStore.get(`reg_${phone}`);
    
    if (!otpData) {
      return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
    }
    
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(`reg_${phone}`);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    
    if (otpData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
    
    otpStore.set(`reg_${phone}_verified`, { verified: true });
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// ============================================================
// 1. CLIENT REGISTRATION
// ============================================================
router.post('/register-client', async (req, res) => {
  try {
    const { fullName, phone, email, nationalId, pin, region, subCounty, ward } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const otpVerified = otpStore.get(`reg_${phone}_verified`);
    if (!otpVerified) {
      return res.status(400).json({ error: 'Please verify your phone number with OTP first' });
    }
    
    const db = await getClient();
    const pinHash = await bcrypt.hash(pin, 12);
    const userId = 'client-' + Date.now();
    
    await db.query(
      `INSERT INTO users (id, fullname, phone, email, nationalid, pinhash, role, region, sub_county, ward, kycstatus)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
      [userId, fullName, phone, email, nationalId, pinHash, 'client', region || '', subCounty || '', ward || '']
    );
    
    otpStore.delete(`reg_${phone}`);
    otpStore.delete(`reg_${phone}_verified`);
    
    const token = jwt.sign(
      { id: userId, email, role: 'client' },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: userId, fullName, phone, email, role: 'client' }
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone, email, or national ID already registered' });
    } else {
      console.error('Client registration error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ============================================================
// 2. VENDOR REGISTRATION (FIXED - county removed, using region)
// ============================================================
router.post('/register-vendor', async (req, res) => {
  try {
    const { 
      businessName, businessType, phone, email, nationalId, kraPin, businessRegNo, pin, 
      region, subCounty, ward, halalDeclared, termsAccepted 
    } = req.body;
    
    if (!businessName || !businessType || !phone || !email || !nationalId || !kraPin || !businessRegNo || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!halalDeclared || !termsAccepted) {
      return res.status(400).json({ error: 'Please accept all declarations' });
    }
    
    const otpVerified = otpStore.get(`reg_${phone}_verified`);
    if (!otpVerified) {
      return res.status(400).json({ error: 'Please verify your phone number with OTP first' });
    }
    
    const db = await getClient();
    const pinHash = await bcrypt.hash(pin, 12);
    const vendorId = 'vendor-' + Date.now();
    const profileId = 'profile-' + Date.now();
    
    // Insert user
    await db.query(
      `INSERT INTO users (
        id, fullname, phone, email, nationalid, pinhash, role, region, sub_county, ward,
        business_name, kra_pin, business_reg_no, halal_declared, terms_accepted, vendor_status, kycstatus
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', 'pending')`,
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
        ward || '',
        businessName,
        kraPin,
        businessRegNo,
        halalDeclared,
        termsAccepted
      ]
    );
    
    // Insert vendor profile - FIXED: removed county, using region as location
    await db.query(`
      INSERT INTO vendor_profiles (
        id, user_id, business_name, business_type, description, location, is_active, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [
      profileId, 
      vendorId, 
      businessName, 
      businessType || 'halalmarket', 
      req.body.description || '', 
      region || '', 
      true
    ]);
    
    otpStore.delete(`reg_${phone}`);
    otpStore.delete(`reg_${phone}_verified`);
    
    res.status(201).json({
      success: true,
      message: 'Vendor application submitted successfully! Awaiting admin approval.',
      vendorId: vendorId,
      status: 'pending'
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone, email, or national ID already registered' });
    } else {
      console.error('Vendor registration error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ============================================================
// 3. IMAM REGISTRATION
// ============================================================
router.post('/register-imam', async (req, res) => {
  try {
    const { 
      fullName, phone, email, nationalId, pin, 
      title, mosqueName, mosqueLocation, mosqueCounty, qualifications, yearsOfService,
      region, subCounty, ward, termsAccepted 
    } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!mosqueName || !mosqueLocation) {
      return res.status(400).json({ error: 'Mosque name and location are required' });
    }
    
    if (!termsAccepted) {
      return res.status(400).json({ error: 'Please accept the terms and conditions' });
    }
    
    const otpVerified = otpStore.get(`reg_${phone}_verified`);
    if (!otpVerified) {
      return res.status(400).json({ error: 'Please verify your phone number with OTP first' });
    }
    
    const db = await getClient();
    const pinHash = await bcrypt.hash(pin, 12);
    const imamId = 'imam-' + Date.now();
    const imamProfileId = 'imamprof-' + Date.now();
    
    await db.query(
      `INSERT INTO users (
        id, fullname, phone, email, nationalid, pinhash, role, region, sub_county, ward, 
        imam_status, kycstatus
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending')`,
      [imamId, fullName, phone, email, nationalId, pinHash, 'imam', region || '', subCounty || '', ward || '']
    );
    
    await db.query(`
      INSERT INTO imams (
        id, user_id, title, mosque_name, mosque_location, mosque_county, 
        qualifications, years_of_service, status, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW())
    `, [imamProfileId, imamId, title || 'Imam', mosqueName, mosqueLocation, mosqueCounty || '', qualifications || [], parseInt(yearsOfService) || 0]);
    
    await db.query(`
      INSERT INTO pension_balances (imam_id, total_contributions, total_supporters)
      VALUES ($1, 0, 0)
    `, [imamProfileId]);
    
    otpStore.delete(`reg_${phone}`);
    otpStore.delete(`reg_${phone}_verified`);
    
    res.status(201).json({
      success: true,
      message: 'Imam application submitted successfully! Awaiting admin approval.',
      imamId: imamId,
      status: 'pending'
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone, email, or national ID already registered' });
    } else {
      console.error('Imam registration error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ============================================================
// 4. LOGIN - Step 1 (Send OTP)
// ============================================================
router.post('/login-step1', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
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
    
    otpStore.set(`login_${phone}`, { 
      otp, 
      expiresAt: Date.now() + 300000
    });
    
    console.log(`Login OTP for ${user.email}: ${otp}`);
    console.log(`Phone: ${phone}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      phone: phone.replace(/(\+254)(\d{3})\d+(\d{3})/, '$1$2***$3'),
      otp: otp
    });
  } catch (err) {
    console.error('Error sending login OTP:', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ============================================================
// 5. LOGIN - Step 2 (Verify OTP and PIN)
// ============================================================
router.post('/login-step2', async (req, res) => {
  try {
    const { phone, pin, otp } = req.body;
    
    if (!phone || !pin || !otp) {
      return res.status(400).json({ error: 'Phone, PIN, and OTP are required' });
    }
    
    const otpData = otpStore.get(`login_${phone}`);
    if (!otpData) {
      return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
    }
    
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(`login_${phone}`);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    
    if (otpData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
    
    const db = await getClient();
    const result = await db.query(
      `SELECT id, fullname, phone, email, role, pinhash, vendor_status, imam_status, kycstatus, walletbalance 
       FROM users WHERE phone = $1`,
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
    
    let statusWarning = null;
    if (user.role === 'vendor' && user.vendor_status !== 'approved') {
      statusWarning = `Vendor account status: ${user.vendor_status}`;
    }
    if (user.role === 'imam' && user.imam_status !== 'approved') {
      statusWarning = `Imam account status: ${user.imam_status}`;
    }
    
    otpStore.delete(`login_${phone}`);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        phone: user.phone,
        email: user.email,
        role: user.role,
        vendorStatus: user.vendor_status || 'pending',
        imamStatus: user.imam_status || 'pending',
        kycStatus: user.kycstatus || 'pending'
      },
      statusWarning: statusWarning
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6. GET CURRENT USER
// ============================================================
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'halalhub_sharia_2025');
    const db = await getClient();
    
    const result = await db.query(
      `SELECT id, fullname, phone, email, role, vendor_status, imam_status, kycstatus, walletbalance 
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;