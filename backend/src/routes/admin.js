const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');

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

// ============================================================
// 1. ADMIN LOGIN (No auth required - MUST BE FIRST)
// ============================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const db = await getClient();
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND isadmin = true',
      [email]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Admin not found' });
    }
    
    const valid = await bcrypt.compare(password, user.pinhash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'halalhub_sharia_2025',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ALL OTHER ADMIN ROUTES REQUIRE AUTHENTICATION
// ============================================================
router.use(authenticate);
router.use(authorize('admin'));

// ============================================================
// 2. ADMIN DASHBOARD STATS
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const db = await getClient();
    
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'vendor') as total_vendors,
        (SELECT COUNT(*) FROM users WHERE role = 'imam') as total_imams,
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(*) FROM users WHERE vendor_status = 'pending') as pending_vendors,
        (SELECT COUNT(*) FROM users WHERE imam_status = 'pending') as pending_imams,
        (SELECT COUNT(*) FROM users WHERE kycstatus = 'pending') as pending_kyc,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM listings) as total_listings,
        (SELECT COUNT(*) FROM consultation_bookings) as total_consultations,
        (SELECT COUNT(*) FROM consultation_bookings WHERE status = 'pending') as pending_consultations,
        (SELECT COUNT(*) FROM consultation_bookings WHERE status = 'confirmed') as confirmed_consultations,
        (SELECT COUNT(*) FROM consultation_bookings WHERE status = 'completed') as completed_consultations,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue
    `);
    
    res.json({ success: true, stats: stats.rows[0] });

  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 3. GET ALL USERS (with filters including sub_role)
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const db = await getClient();
    const { role, status, sub_role, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        u.*,
        i.sub_role as imam_sub_role,
        i.mosque_name,
        i.mosque_location,
        i.is_verified as imam_verified,
        i.status as imam_profile_status
      FROM users u
      LEFT JOIN imams i ON u.id = i.user_id
    `;
    const params = [];
    const conditions = [];
    
    if (role) {
      conditions.push(`u.role = $${params.length + 1}`);
      params.push(role);
    }
    
    if (status) {
      conditions.push(`(u.vendor_status = $${params.length + 1} OR u.imam_status = $${params.length + 1})`);
      params.push(status);
    }
    
    if (sub_role) {
      conditions.push(`i.sub_role = $${params.length + 1}`);
      params.push(sub_role);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY u.createdat DESC LIMIT ${parseInt(limit)}`;
    
    const result = await db.query(query, params);
    res.json({ success: true, users: result.rows });
    
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 4. GET USER BY ID
// ============================================================
router.get('/users/:id', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query(`
      SELECT 
        u.*,
        i.sub_role as imam_sub_role,
        i.mosque_name,
        i.mosque_location,
        i.is_verified as imam_verified,
        i.status as imam_profile_status
      FROM users u
      LEFT JOIN imams i ON u.id = i.user_id
      WHERE u.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
    
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 5. UPDATE USER
// ============================================================
router.put('/users/:id', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.params.id;
    const { fullname, phone, email, region, sub_county, ward } = req.body;
    
    await db.query(`
      UPDATE users SET 
        fullname = COALESCE($1, fullname),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        region = COALESCE($4, region),
        sub_county = COALESCE($5, sub_county),
        ward = COALESCE($6, ward),
        updatedat = NOW()
      WHERE id = $7
    `, [fullname, phone, email, region, sub_county, ward, userId]);
    
    res.json({ success: true, message: 'User updated successfully' });
    
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6. DELETE USER
// ============================================================
router.delete('/users/:id', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
    
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 6.5 UPDATE KYC STATUS
// ============================================================
router.put('/users/:id/kyc', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.params.id;
    const { kycStatus } = req.body;

    if (!kycStatus || !['verified', 'pending', 'rejected'].includes(kycStatus)) {
      return res.status(400).json({ error: 'Invalid KYC status. Must be verified, pending, or rejected.' });
    }

    const result = await db.query(
      'UPDATE users SET kycstatus = $1, updatedat = NOW() WHERE id = $2 RETURNING id, fullname, email, kycstatus',
      [kycStatus, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notificationId = uuidv4();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, createdat)
      VALUES ($1, $2, $3, $4, 'kyc_update', NOW())
    `, [
      notificationId,
      userId,
      `KYC Status Updated to ${kycStatus}`,
      `Your KYC status has been updated to ${kycStatus}. ${kycStatus === 'verified' ? 'You now have full access to all features.' : kycStatus === 'rejected' ? 'Please contact support for more information.' : 'Please complete your KYC verification.'}`
    ]);

    res.json({
      success: true,
      message: `KYC status updated to ${kycStatus}`,
      user: result.rows[0]
    });

  } catch (err) {
    console.error('Error updating KYC status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 7. GET PENDING VENDORS
// ============================================================
router.get('/pending-vendors', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query(`
      SELECT u.*, u.id as user_id, vd.*, vp.business_type, vp.description, vp.location
      FROM users u
      LEFT JOIN vendor_documents vd ON u.id = vd.vendor_id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE u.role = 'vendor' AND u.vendor_status = 'pending'
      ORDER BY u.createdat DESC
    `);
    
    res.json({ success: true, vendors: result.rows });
    
  } catch (err) {
    console.error('Error fetching pending vendors:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 8. APPROVE OR REJECT VENDOR
// ============================================================
router.put('/vendors/:id/verify', async (req, res) => {
  try {
    const db = await getClient();
    const vendorId = req.params.id;
    const { status, admin_notes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }
    
    const result = await db.query(`
      UPDATE users SET 
        vendor_status = $1,
        vendor_approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
        kycstatus = CASE WHEN $1 = 'approved' THEN 'verified' ELSE 'rejected' END,
        updatedat = NOW()
      WHERE id = $2 AND role = 'vendor'
      RETURNING id, fullname, email
    `, [status, vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    await db.query(`
      UPDATE vendor_documents 
      SET status = $1, admin_notes = $2, reviewed_at = NOW()
      WHERE vendor_id = $3
    `, [status, admin_notes || null, vendorId]);
    
    await db.query(`
      UPDATE vendor_profiles 
      SET is_verified = $1, updatedat = NOW()
      WHERE user_id = $2
    `, [status === 'approved', vendorId]);
    
    const notificationId = uuidv4();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, createdat)
      VALUES ($1, $2, $3, $4, 'vendor_verification', NOW())
    `, [
      notificationId, 
      vendorId, 
      status === 'approved' ? 'Vendor Application Approved' : 'Vendor Application Rejected',
      status === 'approved' 
        ? 'Your vendor application has been approved. You can now start selling on HalalHub.' 
        : `Your vendor application has been rejected. ${admin_notes || 'Please contact support for more details.'}`
    ]);
    
    res.json({ 
      success: true, 
      message: `Vendor ${status} successfully`,
      vendor: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error verifying vendor:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 9. GET PENDING IMAMS (including Kadhis)
// ============================================================
router.get('/pending-imams', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query(`
      SELECT u.*, u.id as user_id, i.*
      FROM users u
      JOIN imams i ON u.id = i.user_id
      WHERE u.role = 'imam' AND u.imam_status = 'pending'
      ORDER BY u.createdat DESC
    `);
    
    res.json({ success: true, imams: result.rows });
    
  } catch (err) {
    console.error('Error fetching pending imams:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 10. APPROVE OR REJECT IMAM (also handles Kadhi)
// ============================================================
router.put('/imams/:id/verify', async (req, res) => {
  try {
    const db = await getClient();
    const imamId = req.params.id;
    const { status, admin_notes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }
    
    const result = await db.query(`
      UPDATE users SET 
        imam_status = $1,
        imam_approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
        kycstatus = CASE WHEN $1 = 'approved' THEN 'verified' ELSE 'rejected' END,
        updatedat = NOW()
      WHERE id = $2 AND role = 'imam'
      RETURNING id, fullname, email
    `, [status, imamId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imam not found' });
    }
    
    await db.query(`
      UPDATE imams 
      SET is_verified = $1, status = $2, admin_notes = $3, verified_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
          updatedat = NOW()
      WHERE user_id = $4
    `, [status === 'approved', status, admin_notes || null, imamId]);
    
    // If approved and sub_role is kadhi, also update kadhis table
    if (status === 'approved') {
      const imamResult = await db.query(`
        SELECT sub_role FROM imams WHERE user_id = $1
      `, [imamId]);
      
      if (imamResult.rows.length > 0 && imamResult.rows[0].sub_role === 'kadhi') {
        await db.query(`
          UPDATE kadhis SET available = true, verified = true WHERE user_id = $1
        `, [imamId]);
      }
    }
    
    const roleLabel = await db.query(`
      SELECT sub_role FROM imams WHERE user_id = $1
    `, [imamId]);
    
    const label = roleLabel.rows.length > 0 && roleLabel.rows[0].sub_role === 'kadhi' ? 'Kadhi' : 'Imam';
    
    const notificationId = uuidv4();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, createdat)
      VALUES ($1, $2, $3, $4, 'imam_verification', NOW())
    `, [
      notificationId, 
      imamId, 
      status === 'approved' ? `${label} Application Approved` : `${label} Application Rejected`,
      status === 'approved' 
        ? `Your ${label.toLowerCase()} application has been approved. You can now manage your profile and serve the community.` 
        : `Your ${label.toLowerCase()} application has been rejected. ${admin_notes || 'Please contact support for more details.'}`
    ]);
    
    res.json({ 
      success: true, 
      message: `${label} ${status} successfully`,
      imam: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error verifying imam:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 11. GET ALL VENDORS
// ============================================================
router.get('/vendors', async (req, res) => {
  try {
    const db = await getClient();
    const { status } = req.query;
    
    let query = `
      SELECT u.*, vp.business_type, vp.location, vp.is_verified, vp.rating
      FROM users u
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE u.role = 'vendor'
    `;
    const params = [];
    
    if (status) {
      query += ` AND u.vendor_status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ' ORDER BY u.createdat DESC';
    
    const result = await db.query(query, params);
    res.json({ success: true, vendors: result.rows });
    
  } catch (err) {
    console.error('Error fetching vendors:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 12. GET ALL IMAMS (including Kadhis with sub_role filter)
// ============================================================
router.get('/imams', async (req, res) => {
  try {
    const db = await getClient();
    const { status, sub_role } = req.query;
    
    let query = `
      SELECT u.*, i.*
      FROM users u
      JOIN imams i ON u.id = i.user_id
      WHERE u.role = 'imam'
    `;
    const params = [];
    
    if (status) {
      query += ` AND u.imam_status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (sub_role) {
      query += ` AND i.sub_role = $${params.length + 1}`;
      params.push(sub_role);
    }
    
    query += ' ORDER BY u.createdat DESC';
    
    const result = await db.query(query, params);
    res.json({ success: true, imams: result.rows });
    
  } catch (err) {
    console.error('Error fetching imams:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 13. GET ALL TRANSACTIONS
// ============================================================
router.get('/transactions', async (req, res) => {
  try {
    const db = await getClient();
    const { 
      type, 
      status, 
      user_id,
      date_from, 
      date_to, 
      limit = 200 
    } = req.query;
    
    let query = `
      SELECT t.*, u.fullname as user_name, u.phone as user_phone, u.email as user_email, u.role as user_role
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (type && type !== 'All') {
      query += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status && status !== 'All') {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (user_id) {
      query += ` AND t.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    if (date_from) {
      query += ` AND t.created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      query += ` AND t.created_at <= $${paramIndex}`;
      params.push(date_to + ' 23:59:59');
      paramIndex++;
    }
    
    query += ` ORDER BY t.created_at DESC LIMIT ${parseInt(limit)}`;
    
    const result = await db.query(query, params);
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' OR status = 'success' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' OR status = 'cancelled' THEN 1 END) as failed,
        COALESCE(SUM(CASE WHEN status = 'completed' OR status = 'success' THEN amount ELSE 0 END), 0) as total_amount
      FROM transactions t
      WHERE 1=1
    `;
    const statsResult = await db.query(statsQuery);
    
    res.json({ 
      success: true, 
      transactions: result.rows,
      stats: statsResult.rows[0]
    });
    
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 14. GET TRANSACTION BY ID
// ============================================================
router.get('/transactions/:id', async (req, res) => {
  try {
    const db = await getClient();
    const result = await db.query(`
      SELECT t.*, u.fullname as user_name, u.phone as user_phone, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ success: true, transaction: result.rows[0] });
    
  } catch (err) {
    console.error('Error fetching transaction:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 15. GET ALL ORDERS
// ============================================================
router.get('/orders', async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;
    
    let query = `
      SELECT o.*, u.fullname as customer_name, v.fullname as vendor_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users v ON o.vendor_id = v.id
    `;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY o.order_date DESC LIMIT ${parseInt(limit)}`;
    
    const result = await db.query(query, params);
    res.json({ success: true, orders: result.rows });
    
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 16. GET ALL BOOKINGS (HalalStay bookings)
// ============================================================
router.get('/bookings', async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;
    
    let query = `
      SELECT b.*, u.fullname as customer_name, v.fullname as vendor_name, l.title as listing_title
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users v ON b.vendor_id = v.id
      LEFT JOIN listings l ON b.listing_id = l.id
    `;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`b.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY b.booking_date DESC LIMIT ${parseInt(limit)}`;
    
    const result = await db.query(query, params);
    res.json({ success: true, bookings: result.rows });
    
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 17. GET CONSULTATION BOOKINGS (Kadhi bookings)
// ============================================================
router.get('/consultations', async (req, res) => {
  try {
    const db = await getClient();
    const { status, kadhi_id, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        cb.*,
        u.fullname as user_name,
        u.email as user_email,
        u.phone as user_phone,
        k.name as kadhi_name,
        k.type as kadhi_type,
        k.county as kadhi_county
      FROM consultation_bookings cb
      LEFT JOIN users u ON cb.user_id = u.id
      LEFT JOIN kadhis k ON cb.kadhi_id = k.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ` AND cb.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (kadhi_id) {
      query += ` AND cb.kadhi_id = $${params.length + 1}`;
      params.push(kadhi_id);
    }
    
    query += ` ORDER BY cb.booking_date DESC, cb.booking_time DESC LIMIT ${parseInt(limit)}`;
    
    const result = await db.query(query, params);
    
    res.json({ 
      success: true, 
      consultations: result.rows 
    });
    
  } catch (err) {
    console.error('Error fetching consultations:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 18. GET CONSULTATION STATS
// ============================================================
router.get('/consultations/stats', async (req, res) => {
  try {
    const db = await getClient();
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as video_bookings,
        COUNT(CASE WHEN type = 'in-person' THEN 1 END) as in_person_bookings,
        COUNT(CASE WHEN type = 'phone' THEN 1 END) as phone_bookings
      FROM consultation_bookings
    `);
    
    res.json({ 
      success: true, 
      stats: result.rows[0] 
    });
    
  } catch (err) {
    console.error('Error fetching consultation stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 19. GET SYSTEM OVERVIEW
// ============================================================
router.get('/overview', async (req, res) => {
  try {
    const db = await getClient();
    
    const result = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND vendor_status = 'approved') as active_vendors,
        (SELECT COUNT(*) FROM users WHERE role = 'imam' AND imam_status = 'approved') as active_imams,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM listings) as total_listings,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM consultation_bookings WHERE status = 'pending') as pending_consultations,
        (SELECT COUNT(*) FROM reviews) as total_reviews,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(total_contributions), 0) FROM pension_balances) as total_pension_fund
    `);
    
    res.json({ success: true, overview: result.rows[0] });
    
  } catch (err) {
    console.error('Error fetching overview:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 20. GET USER TRANSACTIONS
// ============================================================
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.params.userId;
    const { limit = 50 } = req.query;
    
    const result = await db.query(`
      SELECT t.*, u.fullname as user_name, u.phone as user_phone
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);
    
    res.json({ success: true, transactions: result.rows });
    
  } catch (err) {
    console.error('Error fetching user transactions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;