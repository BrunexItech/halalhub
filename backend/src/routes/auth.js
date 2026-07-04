const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const client = new Client({
  user: 'halalhub_user',
  password: '@halalhub@#',
  host: 'localhost',
  port: 5432,
  database: 'halalhub'
});
client.connect();

const otpStore = new Map();

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, email, nationalId, pin } = req.body;
    
    if (!fullName || !phone || !email || !nationalId || !pin) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const pinHash = await bcrypt.hash(pin, 12);
    const userId = 'user-' + Date.now();
    
    await client.query(
      `INSERT INTO users (id, fullname, phone, email, nationalid, pinhash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, fullName, phone, email, nationalId, pinHash, 'user']
    );
    
    const token = jwt.sign(
      { id: userId, email, role: 'user' },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: userId, fullName, phone, email, role: 'user' }
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Phone or email already registered' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Login Step 1 - Send OTP via Email ONLY
router.post('/login-step1', async (req, res) => {
  const { phone } = req.body;
  
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const user = result.rows[0];
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    otpStore.set(phone, { otp, expiresAt: Date.now() + 300000 });
    
    // Send email with OTP
    await transporter.sendMail({
      from: `"HalalHub" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your HalalHub OTP Code',
      html: `
        <h2>🔐 Your HalalHub OTP</h2>
        <p>Use the following code to complete your login:</p>
        <h1 style="font-size: 2rem; color: #0B3D2E;">${otp}</h1>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>🌙 HalalHub — Sharia-Compliant Fintech</p>
      `
    });
    
    console.log(`✅ OTP sent via Email to ${user.email}`);
    
    res.json({
      message: 'OTP sent to your email',
      phone: phone.replace(/(\+254)(\d{3})\d+(\d{3})/, '$1$2***$3')
    });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Check email config.' });
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
    
    const result = await client.query(
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
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
