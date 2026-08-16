const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bankClient = require('../services/bank-client');
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

const otpStore = new Map();

// Leader types
const LEADER_TYPES = [
  'islamic_scholar',
  'imam',
  'adhan_caller',
  'ustadh',
  'ustadha',
  'kadhi'
];

const LEADER_TYPE_LABELS = {
  'islamic_scholar': 'Islamic Scholar',
  'imam': 'Imam',
  'adhan_caller': 'Adhan Caller',
  'ustadh': 'Ustadh',
  'ustadha': 'Ustadha',
  'kadhi': 'Kadhi'
};

// ============================================================
// REGISTRATION OTP ENDPOINTS (PUBLIC - No Auth Required)
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
// CREATE VIRTUAL ACCOUNT HELPER
// ============================================================
const createVirtualAccount = async (userId) => {
  try {
    const account = await virtualAccountService.getOrCreateAccount(userId, 'KES');
    console.log(`[Auth] Virtual account created: ${account.account_number}`);
    return account;
  } catch (err) {
    console.error('[Auth] Failed to create virtual account:', err.message);
    return null;
  }
};

// ============================================================
// 1. CLIENT REGISTRATION (PUBLIC - No Auth Required)
// ============================================================
router.post('/register-client', async (req, res) => {
  try {
    const { fullName, phone, email, nationalId, pin, region, subCounty, ward, termsAccepted, privacyAccepted } = req.body;
    
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
    
    await db.query('BEGIN');
    
    try {
      await db.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, pinhash, role, region, sub_county, ward, 
          kycstatus, terms_accepted, terms_accepted_at, privacy_accepted, privacy_accepted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, NOW(), $12, NOW())`,
        [userId, fullName, phone, email, nationalId, pinHash, 'client', region || '', subCounty || '', ward || '', termsAccepted || true, privacyAccepted || true]
      );
      
      await db.query('COMMIT');
      
      await createVirtualAccount(userId);
      
      otpStore.delete(`reg_${phone}`);
      otpStore.delete(`reg_${phone}_verified`);
      
      const account = await virtualAccountService.getUserAccount(userId);
      const balance = account?.balance || 0;
      
      const token = jwt.sign(
        { id: userId, email, role: 'client' },
        process.env.JWT_SECRET || 'halalhub_sharia_2025',
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: { 
          id: userId, 
          fullName, 
          phone, 
          email, 
          role: 'client',
          balance: balance,
          accountNumber: account?.account_number || null
        }
      });
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
    
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
// 2. VENDOR REGISTRATION (PUBLIC - No Auth Required)
// ============================================================
router.post('/register-vendor', async (req, res) => {
  try {
    const { 
      businessName, 
      businessType, 
      vendorType,
      phone, 
      email, 
      nationalId, 
      kraPin, 
      businessRegNo, 
      pin, 
      region, 
      subCounty, 
      ward, 
      halalDeclared, 
      termsAccepted,
      privacyAccepted
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
    
    const vendorTypeValue = vendorType || businessType || 'halalmarket';
    
    await db.query('BEGIN');
    
    try {
      await db.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, pinhash, role, region, sub_county, ward,
          business_name, kra_pin, business_reg_no, halal_declared, terms_accepted, terms_accepted_at,
          privacy_accepted, privacy_accepted_at, vendor_status, kycstatus
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16, NOW(), 'pending', 'pending')`,
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
          termsAccepted || true,
          privacyAccepted || true
        ]
      );
      
      await db.query(`
        INSERT INTO vendor_profiles (
          id, user_id, business_name, business_type, vendor_type, description, location, is_active, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        profileId, 
        vendorId, 
        businessName, 
        businessType || 'halalmarket', 
        vendorTypeValue,
        req.body.description || '', 
        region || '', 
        true
      ]);
      
      await db.query('COMMIT');
      
      await createVirtualAccount(vendorId);
      
      otpStore.delete(`reg_${phone}`);
      otpStore.delete(`reg_${phone}_verified`);
      
      const account = await virtualAccountService.getUserAccount(vendorId);
      const balance = account?.balance || 0;
      
      res.status(201).json({
        success: true,
        message: 'Vendor application submitted successfully! Awaiting admin approval.',
        vendorId: vendorId,
        vendorType: vendorTypeValue,
        status: 'pending',
        balance: balance,
        accountNumber: account?.account_number || null
      });
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
    
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
// 3. LEADER REGISTRATION (PUBLIC - No Auth Required)
// ============================================================
router.post('/register-leader', async (req, res) => {
  try {
    const { 
      fullName, 
      phone, 
      email, 
      nationalId, 
      pin, 
      leaderType,
      location,
      region,
      subCounty,
      ward,
      mosqueName,
      mosqueLocation,
      qualifications, 
      yearsOfService,
      bio,
      institution,
      consultationFee,
      consultationTypes,
      availableForConsultation,
      termsAccepted,
      privacyAccepted
    } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!leaderType || !LEADER_TYPES.includes(leaderType)) {
      return res.status(400).json({ 
        error: 'Valid leader type is required. Types: ' + LEADER_TYPES.join(', ')
      });
    }
    
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    if (!region) {
      return res.status(400).json({ error: 'County is required' });
    }
    
    if (!subCounty) {
      return res.status(400).json({ error: 'Sub-county is required' });
    }
    
    if (!ward) {
      return res.status(400).json({ error: 'Ward is required' });
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
    const leaderId = 'leader-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const leaderProfileId = 'lprof-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const shareLink = 'leader-' + Date.now().toString(36) + crypto.randomBytes(6).toString('hex');
    
    // Auto-generate title from leader type
    const finalTitle = LEADER_TYPE_LABELS[leaderType] || leaderType;
    
    await db.query('BEGIN');
    
    try {
      await db.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, pinhash, role, region, sub_county, ward, 
          leader_status, kycstatus, terms_accepted, terms_accepted_at, privacy_accepted, privacy_accepted_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending', $11, NOW(), $12, NOW())`,
        [leaderId, fullName, phone, email, nationalId, pinHash, 'leader', region, subCounty, ward, termsAccepted || true, privacyAccepted || true]
      );
      
      await db.query(`
        INSERT INTO leaders (
          id, user_id, leader_type, name, title, location, region, sub_county, ward,
          mosque_name, mosque_location,
          qualifications, years_of_service, bio, institution,
          consultation_fee, consultation_types, available_for_consultation,
          is_verified, status, is_public, share_link, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, false, 'pending', false, $19, NOW(), NOW())
      `, [
        leaderProfileId, 
        leaderId, 
        leaderType, 
        fullName,
        finalTitle, 
        location,
        region,
        subCounty,
        ward,
        mosqueName || null,
        mosqueLocation || null,
        qualifications || [], 
        parseInt(yearsOfService) || 0, 
        bio || null,
        institution || null,
        parseInt(consultationFee) || 0,
        consultationTypes || ['video'],
        availableForConsultation !== false,
        shareLink
      ]);
      
      await db.query(`
        INSERT INTO leader_pension_balances (leader_id, total_contributions, total_supporters)
        VALUES ($1, 0, 0)
      `, [leaderProfileId]);
      
      await db.query('COMMIT');
      
      await createVirtualAccount(leaderId);
      
      otpStore.delete(`reg_${phone}`);
      otpStore.delete(`reg_${phone}_verified`);
      
      const account = await virtualAccountService.getUserAccount(leaderId);
      const balance = account?.balance || 0;
      
      const leaderTypeLabel = LEADER_TYPE_LABELS[leaderType] || leaderType;
      
      res.status(201).json({
        success: true,
        message: `${leaderTypeLabel} application submitted successfully! Awaiting admin approval.`,
        leaderId: leaderId,
        leaderType: leaderType,
        shareLink: shareLink,
        status: 'pending',
        balance: balance,
        accountNumber: account?.account_number || null
      });
      
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
    
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone, email, or national ID already registered' });
    } else {
      console.error('Leader registration error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// ============================================================
// 4. LOGIN - Step 1 (Send OTP) - PUBLIC - No Auth Required
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
// 5. LOGIN - Step 2 (Verify OTP and PIN) - PUBLIC - No Auth Required
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
      `SELECT u.id, u.fullname, u.phone, u.email, u.role, u.pinhash, u.vendor_status, u.leader_status, u.kycstatus,
              vp.vendor_type,
              l.leader_type,
              l.share_link,
              l.is_public
       FROM users u
       LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
       LEFT JOIN leaders l ON u.id = l.user_id
       WHERE u.phone = $1`,
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
    let vendorType = user.vendor_type || null;
    let leaderType = user.leader_type || null;
    let shareLink = user.share_link || null;
    let isPublic = user.is_public || false;
    
    if (user.role === 'vendor' && user.vendor_status !== 'approved') {
      statusWarning = `Vendor account status: ${user.vendor_status}`;
    }
    
    if (user.role === 'leader' && user.leader_status !== 'approved') {
      statusWarning = `Leader account status: ${user.leader_status}`;
    }
    
    otpStore.delete(`login_${phone}`);
    
    const account = await virtualAccountService.getUserAccount(user.id);
    const balance = account?.balance || 0;
    const accountNumber = account?.account_number || null;
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        leaderType: leaderType,
        vendorType: vendorType
      },
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
        leaderType: leaderType,
        vendorType: vendorType,
        vendorStatus: user.vendor_status || null,
        leaderStatus: user.leader_status || null,
        kycStatus: user.kycstatus || 'pending',
        balance: balance,
        accountNumber: accountNumber,
        shareLink: shareLink,
        isPublic: isPublic
      },
      statusWarning: statusWarning
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6. GET CURRENT USER - PROTECTED (Requires Authentication)
// ============================================================
const { authenticate, authorize } = require('../middleware/auth');

// All routes below this line require authentication
router.use(authenticate);

router.get('/me', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT u.id, u.fullname, u.phone, u.email, u.role, u.vendor_status, u.leader_status, u.kycstatus,
              vp.vendor_type,
              l.leader_type,
              l.share_link,
              l.is_public
       FROM users u
       LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
       LEFT JOIN leaders l ON u.id = l.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    const account = await virtualAccountService.getUserAccount(user.id);
    const balance = account?.balance || 0;
    const accountNumber = account?.account_number || null;
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        fullName: user.fullname,
        phone: user.phone,
        email: user.email,
        role: user.role,
        leaderType: user.leader_type || null,
        vendorType: user.vendor_type || null,
        vendorStatus: user.vendor_status || null,
        leaderStatus: user.leader_status || null,
        kycStatus: user.kycstatus || 'pending',
        balance: balance,
        accountNumber: accountNumber,
        shareLink: user.share_link || null,
        isPublic: user.is_public || false
      } 
    });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;