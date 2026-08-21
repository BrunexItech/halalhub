const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const virtualAccountService = require('../services/virtual-account.service');

// ============================================================
// Africa's Talking SMS Setup
// ============================================================
const africastalking = require('africastalking')({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});
const sms = africastalking.SMS;

// ============================================================
// Database Connection Pool
// ============================================================
const dbPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  max: 20,
});

// ============================================================
// JWT Secret Validation
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in environment variables');
}

// OTP Store (temporary - will be moved to Redis)
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
// SMS Sending Function
// ============================================================
const sendSMS = async (phone, message) => {
  try {
    const result = await sms.send({
      to: [phone],
      message: message,
      from: process.env.AT_FROM || 'ITQAAN'
    });
    console.log(`SMS sent to ${phone}: ${message}`);
    return result;
  } catch (error) {
    console.error('SMS failed:', error.message);
    throw error;
  }
};

// ============================================================
// REGISTRATION OTP - Sends real SMS
// ============================================================
router.post('/send-registration-otp', async (req, res) => {
  const { phone, email } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  try {
    const result = await dbPool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    if (result.rows.length > 0) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    otpStore.set(`reg_${phone}`, { 
      otp, 
      expiresAt: Date.now() + 300000
    });
    
    await sendSMS(phone, `Your Itqaan verification code is: ${otp}. Valid for 5 minutes.`);
    
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

// Verify registration OTP
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
// 1. CLIENT REGISTRATION
// ============================================================
router.post('/register-client', async (req, res) => {
  try {
    const { 
      fullName, phone, email, nationalId, 
      password,
      pin,
      region, subCounty, ward, termsAccepted, privacyAccepted 
    } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !password || !pin) {
      return res.status(400).json({ error: 'All fields including password and PIN are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
   if (pin.length !== 4) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    
    const otpVerified = otpStore.get(`reg_${phone}_verified`);
    if (!otpVerified) {
      return res.status(400).json({ error: 'Please verify your phone number with OTP first' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const pinHash = await bcrypt.hash(pin, 12);
    const userId = 'client-' + Date.now();
    
    await dbPool.query('BEGIN');
    
    try {
      await dbPool.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, password_hash, pinhash, role, region, sub_county, ward, 
          kycstatus, terms_accepted, terms_accepted_at, privacy_accepted, privacy_accepted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, NOW(), $13, NOW())`,
        [userId, fullName, phone, email, nationalId, passwordHash, pinHash, 'client', region || '', subCounty || '', ward || '', termsAccepted || true, privacyAccepted || true]
      );
      
      await dbPool.query('COMMIT');
      
      await createVirtualAccount(userId);
      
      otpStore.delete(`reg_${phone}`);
      otpStore.delete(`reg_${phone}_verified`);
      
      const account = await virtualAccountService.getUserAccount(userId);
      const balance = account?.balance || 0;
      
      const token = jwt.sign(
        { id: userId, email, role: 'client' },
        JWT_SECRET,
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
      await dbPool.query('ROLLBACK');
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
// 2. VENDOR REGISTRATION
// ============================================================
router.post('/register-vendor', async (req, res) => {
  try {
    const { 
      businessName, businessType, vendorType,
      phone, email, nationalId, kraPin, businessRegNo, 
      password,
      pin,
      region, subCounty, ward, halalDeclared, termsAccepted, privacyAccepted
    } = req.body;
    
    if (!businessName || !businessType || !phone || !email || !nationalId || !kraPin || !businessRegNo || !password || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!halalDeclared || !termsAccepted) {
      return res.status(400).json({ error: 'Please accept all declarations' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    if (pin.length !== 4) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    
    const otpVerified = otpStore.get(`reg_${phone}_verified`);
    if (!otpVerified) {
      return res.status(400).json({ error: 'Please verify your phone number with OTP first' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const pinHash = await bcrypt.hash(pin, 12);
    const vendorId = 'vendor-' + Date.now();
    const profileId = 'profile-' + Date.now();
    
    const vendorTypeValue = vendorType || businessType || 'halalmarket';
    
    await dbPool.query('BEGIN');
    
    try {
      await dbPool.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, password_hash, pinhash, role, region, sub_county, ward,
          business_name, kra_pin, business_reg_no, halal_declared, terms_accepted, terms_accepted_at,
          privacy_accepted, privacy_accepted_at, vendor_status, kycstatus
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17, NOW(), 'pending', 'pending')`,
        [
          vendorId, 
          businessName, 
          phone, 
          email, 
          nationalId, 
          passwordHash,
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
      
      await dbPool.query(`
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
      
      await dbPool.query('COMMIT');
      
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
      await dbPool.query('ROLLBACK');
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
// 3. LEADER REGISTRATION
// ============================================================
router.post('/register-leader', async (req, res) => {
  try {
    const { 
      fullName, phone, email, nationalId,
      password,
      pin,
      leaderType, location, region, subCounty, ward,
      mosqueName, mosqueLocation, qualifications, yearsOfService,
      bio, institution, consultationFee, consultationTypes,
      availableForConsultation, termsAccepted, privacyAccepted
    } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !password || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!leaderType || !LEADER_TYPES.includes(leaderType)) {
      return res.status(400).json({ 
        error: 'Valid leader type is required. Types: ' + LEADER_TYPES.join(', ')
      });
    }
    
    if (!location || !region || !subCounty || !ward) {
      return res.status(400).json({ error: 'Location details are required' });
    }
    
    if (!termsAccepted) {
      return res.status(400).json({ error: 'Please accept the terms and conditions' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
   if (pin.length !== 4) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }
    
    const otpVerified = otpStore.get(`reg_${phone}_verified`);
    if (!otpVerified) {
      return res.status(400).json({ error: 'Please verify your phone number with OTP first' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const pinHash = await bcrypt.hash(pin, 12);
    const leaderId = 'leader-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const leaderProfileId = 'lprof-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const shareLink = 'leader-' + Date.now().toString(36) + crypto.randomBytes(6).toString('hex');
    
    const finalTitle = LEADER_TYPE_LABELS[leaderType] || leaderType;
    
    await dbPool.query('BEGIN');
    
    try {
      await dbPool.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, password_hash, pinhash, role, region, sub_county, ward, 
          leader_status, kycstatus, terms_accepted, terms_accepted_at, privacy_accepted, privacy_accepted_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending', $12, NOW(), $13, NOW())`,
        [leaderId, fullName, phone, email, nationalId, passwordHash, pinHash, 'leader', region, subCounty, ward, termsAccepted || true, privacyAccepted || true]
      );
      
      await dbPool.query(`
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
      
      await dbPool.query(`
        INSERT INTO leader_pension_balances (leader_id, total_contributions, total_supporters)
        VALUES ($1, 0, 0)
      `, [leaderProfileId]);
      
      await dbPool.query('COMMIT');
      
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
      await dbPool.query('ROLLBACK');
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
// 4. VALIDATE PASSWORD - Step 1 (Public)
// ============================================================
router.post('/validate-password', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }
    
    const result = await dbPool.query(
      `SELECT u.id, u.fullname, u.phone, u.email, u.role, u.password_hash, 
              u.vendor_status, u.leader_status, u.kycstatus,
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
    
    // Verify password only
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Password is valid - return user data (without token)
    res.json({
      success: true,
      message: 'Password validated successfully',
      user: {
        id: user.id,
        fullName: user.fullname,
        phone: user.phone,
        email: user.email,
        role: user.role,
        vendorType: user.vendor_type || null,
        leaderType: user.leader_type || null,
        vendorStatus: user.vendor_status || null,
        leaderStatus: user.leader_status || null,
        kycStatus: user.kycstatus || 'pending'
      }
    });
    
  } catch (err) {
    console.error('Password validation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 5. VERIFY PIN - Step 2 (Public)
// ============================================================
router.post('/verify-pin', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    
    if (!phone || !pin) {
      return res.status(400).json({ error: 'Phone and PIN are required' });
    }
    
    const result = await dbPool.query(
      `SELECT u.id, u.fullname, u.phone, u.email, u.role, u.pinhash, 
              u.vendor_status, u.leader_status, u.kycstatus,
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
    
    // Verify PIN only
    const validPin = await bcrypt.compare(pin, user.pinhash);
    if (!validPin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    
    // PIN is valid - generate token and complete login
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
      JWT_SECRET,
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
    console.error('PIN verification error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6. FULL LOGIN - Combined (Fallback)
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { phone, password, pin } = req.body;
    
    if (!phone || !password || !pin) {
      return res.status(400).json({ error: 'Phone, password, and PIN are required' });
    }
    
    const result = await dbPool.query(
      `SELECT u.id, u.fullname, u.phone, u.email, u.role, u.password_hash, u.pinhash, 
              u.vendor_status, u.leader_status, u.kycstatus,
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
    
    // Step 1: Verify Password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Step 2: Verify PIN
    const validPin = await bcrypt.compare(pin, user.pinhash);
    if (!validPin) {
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
      JWT_SECRET,
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
// 7. GET CURRENT USER - PROTECTED
// ============================================================
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await dbPool.query(
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