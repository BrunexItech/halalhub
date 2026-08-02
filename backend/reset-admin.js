const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  user: 'halalhub_user',
  password: 'halalhub123',
  host: 'localhost',
  port: 5432,
  database: 'halalhub'
});

async function resetAdmin() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const hashedPin = await bcrypt.hash('Admin123!', 12);
    
    const res = await client.query(
      'UPDATE users SET pinhash = $1 WHERE email = $2 RETURNING id, email',
      [hashedPin, 'halalhub@gmail.com']
    );
    
    if (res.rows.length > 0) {
      console.log('✅ Password reset for:', res.rows[0].email);
      console.log('🔑 New Password: Admin123!');
    } else {
      console.log('❌ Admin user not found. Creating one...');
      
      const newHash = await bcrypt.hash('Admin123!', 12);
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
          newHash,
          'admin',
          true,
          'verified'
        ]
      );
      console.log('✅ Admin created with password: Admin123!');
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

resetAdmin();
