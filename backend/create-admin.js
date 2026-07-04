const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new Client({
    user: process.env.DB_USER || 'halalhub_user',
    password: process.env.DB_PASSWORD || '@halalhub@#',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'halalhub'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        fullname TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        nationalid TEXT UNIQUE NOT NULL,
        pinhash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        isadmin BOOLEAN DEFAULT FALSE,
        kycstatus TEXT DEFAULT 'pending',
        walletbalance INTEGER DEFAULT 0,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table ready');

    const hashedPin = await bcrypt.hash('Admin123!', 12);

    await client.query(
      `INSERT INTO users (id, fullname, phone, email, nationalid, pinhash, role, isadmin, kycstatus)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO NOTHING`,
      [
        'admin-001',
        'System Administrator',
        '+254700000000',
        'halalhub@gmail.com',
        'ADMIN001',
        hashedPin,
        'admin',
        true,
        'verified'
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: halalhub@gmail.com');
    console.log('🔑 Password: Admin123!');

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createAdmin();