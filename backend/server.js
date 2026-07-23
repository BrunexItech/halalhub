require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/mpesa', require('./src/routes/mpesa'));
app.use('/api/kyc', require('./src/routes/kyc'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'HalalHub API is running' });
});

// Create tables on startup
async function initDB() {
  const { Client } = require('pg');
  const client = new Client({
    user: process.env.DB_USER || 'halalhub_user',
    password: process.env.DB_PASSWORD || '@halalhub@#',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'halalhub'
  });
  
  try {
    await client.connect();
    
    // Create users table with vendor fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        fullname TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        nationalid TEXT UNIQUE NOT NULL,
        pinhash TEXT NOT NULL,
        role TEXT DEFAULT 'client',
        isadmin BOOLEAN DEFAULT FALSE,
        kycstatus TEXT DEFAULT 'pending',
        walletbalance INTEGER DEFAULT 0,
        region TEXT,
        sub_county TEXT,
        business_name TEXT,
        kra_pin TEXT,
        business_reg_no TEXT,
        halal_declared BOOLEAN DEFAULT FALSE,
        terms_accepted BOOLEAN DEFAULT FALSE,
        vendor_status TEXT DEFAULT 'pending',
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        checkout_request_id TEXT,
        phone TEXT,
        reference TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create vendor_documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_documents (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        business_certificate TEXT,
        halal_certificate TEXT,
        kra_certificate TEXT,
        id_front TEXT,
        id_back TEXT,
        submitted_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Database tables ready');
    await client.end();
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  }
}

initDB();

app.listen(PORT, () => {
  console.log(`🕋 HalalHub API running on port ${PORT}`);
});