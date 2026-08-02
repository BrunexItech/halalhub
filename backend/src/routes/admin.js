const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { authenticate, authorize } = require('../middleware/auth');
const crypto = require('crypto');

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
// 2. ADMIN DASHBOARD STATS (UPDATED with Butchery and Hajj)
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
        (SELECT COUNT(*) FROM hearse_requests) as total_hearse_requests,
        (SELECT COUNT(*) FROM hearse_requests WHERE status = 'pending') as pending_hearse_requests,
        (SELECT COUNT(*) FROM hearse_providers WHERE verification_status = 'pending') as pending_hearse_providers,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM hajj_packages) as total_hajj_packages,
        (SELECT COUNT(*) FROM hajj_bookings) as total_hajj_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE status = 'pending') as pending_hajj_bookings,
        (SELECT COUNT(*) FROM products WHERE meat_type IS NOT NULL) as total_butchery_products
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
// 19. GET SYSTEM OVERVIEW (UPDATED with Butchery and Hajj)
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
        (SELECT COALESCE(SUM(total_contributions), 0) FROM pension_balances) as total_pension_fund,
        (SELECT COUNT(*) FROM hajj_packages) as total_hajj_packages,
        (SELECT COUNT(*) FROM hajj_bookings) as total_hajj_bookings,
        (SELECT COUNT(*) FROM products WHERE meat_type IS NOT NULL) as total_butchery_products
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

// ============================================================
// 21. GET ALL MOSQUES (Admin)
// ============================================================
router.get('/mosques', async (req, res) => {
  try {
    const db = await getClient();
    const { county, search, status, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        m.id,
        m.name,
        m.location,
        m.county,
        m.latitude,
        m.longitude,
        m.createdat,
        m.updatedat,
        u.fullname as imam_name,
        u.id as imam_user_id,
        u.profile_image as imam_image,
        i.id as imam_profile_id,
        i.title as imam_title,
        i.is_verified as imam_verified
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (county && county !== 'All') {
      query += ` AND m.county = $${paramIndex}`;
      params.push(county);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (m.name ILIKE $${paramIndex} OR m.location ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY m.name ASC LIMIT ${parseInt(limit)}`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      mosques: result.rows,
      total: result.rows.length
    });
    
  } catch (err) {
    console.error('Error fetching mosques:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosques' });
  }
});

// ============================================================
// 22. ADD MOSQUE (Admin)
// ============================================================
router.post('/mosques', async (req, res) => {
  try {
    const db = await getClient();
    const {
      name,
      location,
      county,
      latitude,
      longitude,
      imam_id
    } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const existing = await db.query(
      'SELECT id FROM mosques WHERE name = $1 AND location = $2',
      [name, location]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Mosque already exists at this location' });
    }
    
    if (imam_id) {
      const imamCheck = await db.query(
        'SELECT id FROM imams WHERE id = $1',
        [imam_id]
      );
      if (imamCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Imam not found' });
      }
    }
    
    const mosqueId = 'mosque-' + Date.now();
    await db.query(`
      INSERT INTO mosques (
        id, name, location, county, latitude, longitude, imam_id, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [mosqueId, name, location, county, latitude || null, longitude || null, imam_id || null]);
    
    res.status(201).json({
      success: true,
      message: 'Mosque added successfully',
      mosqueId: mosqueId
    });
    
  } catch (err) {
    console.error('Error adding mosque:', err.message);
    res.status(500).json({ error: 'Failed to add mosque' });
  }
});

// ============================================================
// 23. UPDATE MOSQUE (Admin)
// ============================================================
router.put('/mosques/:id', async (req, res) => {
  try {
    const db = await getClient();
    const mosqueId = req.params.id;
    const {
      name,
      location,
      county,
      latitude,
      longitude,
      imam_id
    } = req.body;
    
    const check = await db.query(
      'SELECT id FROM mosques WHERE id = $1',
      [mosqueId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Mosque not found' });
    }
    
    await db.query(`
      UPDATE mosques SET
        name = COALESCE($1, name),
        location = COALESCE($2, location),
        county = COALESCE($3, county),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        imam_id = COALESCE($6, imam_id),
        updatedat = NOW()
      WHERE id = $7
    `, [name, location, county, latitude, longitude, imam_id, mosqueId]);
    
    res.json({
      success: true,
      message: 'Mosque updated successfully'
    });
    
  } catch (err) {
    console.error('Error updating mosque:', err.message);
    res.status(500).json({ error: 'Failed to update mosque' });
  }
});

// ============================================================
// 24. DELETE MOSQUE (Admin)
// ============================================================
router.delete('/mosques/:id', async (req, res) => {
  try {
    const db = await getClient();
    const mosqueId = req.params.id;
    
    const result = await db.query(
      'DELETE FROM mosques WHERE id = $1 RETURNING id',
      [mosqueId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mosque not found' });
    }
    
    res.json({
      success: true,
      message: 'Mosque deleted successfully'
    });
    
  } catch (err) {
    console.error('Error deleting mosque:', err.message);
    res.status(500).json({ error: 'Failed to delete mosque' });
  }
});

// ============================================================
// 25. GET MOSQUE STATS (Admin)
// ============================================================
router.get('/mosques/stats', async (req, res) => {
  try {
    const db = await getClient();
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_mosques,
        COUNT(DISTINCT county) as total_counties,
        COUNT(DISTINCT imam_id) as total_imams_assigned,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates
      FROM mosques
    `);
    
    res.json({
      success: true,
      stats: {
        totalMosques: parseInt(result.rows[0].total_mosques) || 0,
        totalCounties: parseInt(result.rows[0].total_counties) || 0,
        totalImamsAssigned: parseInt(result.rows[0].total_imams_assigned) || 0,
        withCoordinates: parseInt(result.rows[0].with_coordinates) || 0
      }
    });
    
  } catch (err) {
    console.error('Error fetching mosque stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosque stats' });
  }
});

// ============================================================
// 26. GET ALL HEARSE REQUESTS (Admin)
// ============================================================
router.get('/hearse/requests', async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        hr.id,
        hr.service_type,
        hr.pickup_location,
        hr.destination_location,
        hr.contact_person,
        hr.contact_phone,
        hr.scheduled_date,
        hr.scheduled_time,
        hr.urgency,
        hr.status,
        hr.reference,
        hr.createdat,
        u.fullname as user_name,
        u.phone as user_phone,
        u.email as user_email,
        ha.id as assignment_id,
        ha.provider_id,
        ha.status as assignment_status,
        vp.business_name as provider_name
      FROM hearse_requests hr
      LEFT JOIN users u ON hr.user_id = u.id
      LEFT JOIN hearse_request_assignments ha ON hr.id = ha.request_id
      LEFT JOIN hearse_providers hp ON ha.provider_id = hp.id
      LEFT JOIN vendor_profiles vp ON hp.vendor_id = vp.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND hr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY hr.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      requests: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching hearse requests:', err.message);
    res.status(500).json({ error: 'Failed to fetch hearse requests' });
  }
});

// ============================================================
// 27. GET ALL HEARSE PROVIDERS (Admin)
// ============================================================
router.get('/hearse/providers', async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        hp.id,
        hp.license_number,
        hp.service_area,
        hp.vehicle_type,
        hp.vehicle_registration,
        hp.is_verified,
        hp.verification_status,
        hp.hourly_rate,
        hp.distance_rate,
        hp.createdat,
        vp.id as vendor_profile_id,
        vp.business_name,
        vp.business_type,
        vp.vendor_type,
        vp.location,
        vp.phone,
        vp.email,
        vp.is_verified as vendor_verified,
        u.fullname as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM hearse_providers hp
      JOIN vendor_profiles vp ON hp.vendor_id = vp.id
      JOIN users u ON vp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      if (status === 'verified') {
        query += ` AND hp.is_verified = true AND hp.verification_status = 'approved'`;
      } else if (status === 'pending') {
        query += ` AND hp.verification_status = 'pending'`;
      } else if (status === 'rejected') {
        query += ` AND hp.verification_status = 'rejected'`;
      }
    }

    query += ` ORDER BY hp.createdat DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      providers: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching hearse providers:', err.message);
    res.status(500).json({ error: 'Failed to fetch hearse providers' });
  }
});

// ============================================================
// 28. VERIFY HEARSE PROVIDER (Admin)
// ============================================================
router.put('/hearse/providers/:id/verify', async (req, res) => {
  try {
    const db = await getClient();
    const providerId = req.params.id;
    const { status, notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    const result = await db.query(
      `UPDATE hearse_providers 
       SET is_verified = $1, 
           verification_status = $2,
           updatedat = NOW()
       WHERE id = $3
       RETURNING id, vendor_id`,
      [status === 'approved', status, providerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const userResult = await db.query(
      `SELECT u.id, vp.business_name
       FROM vendor_profiles vp
       JOIN users u ON vp.user_id = u.id
       WHERE vp.id = $1`,
      [result.rows[0].vendor_id]
    );

    const notificationId = uuidv4();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, createdat)
      VALUES ($1, $2, $3, $4, 'hearse_provider_verification', NOW())
    `, [
      notificationId,
      userResult.rows[0].id,
      status === 'approved' ? 'Hearse Provider Application Approved' : 'Hearse Provider Application Rejected',
      status === 'approved' 
        ? 'Your hearse provider application has been approved. You can now accept service requests.'
        : `Your hearse provider application has been rejected. ${notes || 'Please contact support for more details.'}`
    ]);

    res.json({
      success: true,
      message: `Provider ${status} successfully`
    });
  } catch (err) {
    console.error('Error verifying hearse provider:', err.message);
    res.status(500).json({ error: 'Failed to verify hearse provider' });
  }
});

// ============================================================
// 29. ASSIGN HEARSE REQUEST (Admin)
// ============================================================
router.post('/hearse/assign', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { requestId, providerId, notes } = req.body;

    if (!requestId || !providerId) {
      return res.status(400).json({ error: 'Request ID and Provider ID are required' });
    }

    const requestCheck = await db.query(
      'SELECT id, user_id FROM hearse_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already assigned' });
    }

    const providerCheck = await db.query(
      'SELECT id FROM hearse_providers WHERE id = $1 AND is_verified = true',
      [providerId]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found or not verified' });
    }

    const existingAssignment = await db.query(
      'SELECT id FROM hearse_request_assignments WHERE request_id = $1',
      [requestId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({ error: 'This request is already assigned' });
    }

    await db.query('BEGIN');

    const assignmentId = 'ass-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query(`
      INSERT INTO hearse_request_assignments (
        id, request_id, provider_id, assigned_by, status, notes, assigned_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, 'assigned', $5, NOW(), NOW(), NOW())
    `, [assignmentId, requestId, providerId, userId, notes || null]);

    await db.query(
      `UPDATE hearse_requests SET status = 'assigned', updatedat = NOW() WHERE id = $1`,
      [requestId]
    );

    const providerDetails = await db.query(
      `SELECT vp.business_name, vp.phone 
       FROM hearse_providers hp
       JOIN vendor_profiles vp ON hp.vendor_id = vp.id
       WHERE hp.id = $1`,
      [providerId]
    );

    const notificationId = uuidv4();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, createdat)
      VALUES ($1, $2, $3, $4, 'hearse_assignment', NOW())
    `, [
      notificationId,
      requestCheck.rows[0].user_id,
      'Service Request Assigned',
      `Your hearse service request has been assigned to ${providerDetails.rows[0].business_name}. They will contact you shortly.`
    ]);

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Request assigned successfully',
      data: {
        assignmentId: assignmentId,
        requestId: requestId,
        providerId: providerId
      }
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error assigning hearse request:', err.message);
    res.status(500).json({ error: 'Failed to assign hearse request' });
  }
});

// ============================================================
// 30. GET ALL BUTCHERY VENDORS (Admin)
// ============================================================
router.get('/butchery/vendors', async (req, res) => {
  try {
    const db = await getClient();
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        u.id,
        u.fullname,
        u.phone,
        u.email,
        u.business_name,
        u.kra_pin,
        u.business_reg_no,
        u.vendor_status,
        u.createdat,
        vp.id as profile_id,
        vp.business_type,
        vp.business_name as profile_business_name,
        vp.description,
        vp.location,
        vp.county,
        vp.is_verified,
        vp.rating,
        vp.logo_url,
        vp.cover_image,
        (SELECT COUNT(*) FROM products WHERE vendor_id = u.id AND meat_type IS NOT NULL) as total_butchery_products,
        (SELECT COUNT(*) FROM products WHERE vendor_id = u.id) as total_products
      FROM users u
      JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE u.role = 'vendor' AND vp.business_type = 'halalbutchery'
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND u.vendor_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY u.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      vendors: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching butchery vendors:', err.message);
    res.status(500).json({ error: 'Failed to fetch butchery vendors' });
  }
});

// ============================================================
// 31. GET ALL BUTCHERY PRODUCTS (Admin)
// ============================================================
router.get('/butchery/products', async (req, res) => {
  try {
    const db = await getClient();
    const { vendor_id, meat_type, status, limit = 100 } = req.query;

    let query = `
      SELECT 
        p.*,
        u.fullname as vendor_name,
        u.business_name,
        vp.location as vendor_location,
        vp.is_verified as vendor_verified
      FROM products p
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE p.meat_type IS NOT NULL
    `;
    const params = [];
    let paramIndex = 1;

    if (vendor_id) {
      query += ` AND p.vendor_id = $${paramIndex}`;
      params.push(vendor_id);
      paramIndex++;
    }

    if (meat_type && meat_type !== 'all') {
      query += ` AND p.meat_type = $${paramIndex}`;
      params.push(meat_type);
      paramIndex++;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        query += ` AND p.is_active = true`;
      } else if (status === 'inactive') {
        query += ` AND p.is_active = false`;
      }
    }

    query += ` ORDER BY p.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      products: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching butchery products:', err.message);
    res.status(500).json({ error: 'Failed to fetch butchery products' });
  }
});

// ============================================================
// 32. UPDATE BUTCHERY PRODUCT STATUS (Admin)
// ============================================================
router.put('/butchery/products/:id/status', async (req, res) => {
  try {
    const db = await getClient();
    const productId = req.params.id;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active status is required' });
    }

    const result = await db.query(
      `UPDATE products 
       SET is_active = $1, updatedat = NOW()
       WHERE id = $2 AND meat_type IS NOT NULL
       RETURNING id, name, is_active`,
      [is_active, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Butchery product not found' });
    }

    res.json({
      success: true,
      message: `Product ${is_active ? 'activated' : 'deactivated'} successfully`,
      product: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating butchery product:', err.message);
    res.status(500).json({ error: 'Failed to update product status' });
  }
});

// ============================================================
// 33. GET ALL HAJJ PACKAGES (Admin)
// ============================================================
router.get('/hajj/packages', async (req, res) => {
  try {
    const db = await getClient();
    const { status, type, vendor_id, limit = 100 } = req.query;

    let query = `
      SELECT 
        p.*,
        u.fullname as vendor_name,
        u.business_name,
        u.phone as vendor_phone,
        u.email as vendor_email,
        vp.location as vendor_location,
        vp.is_verified as vendor_verified,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id) as total_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id AND status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id AND status = 'confirmed') as confirmed_bookings
      FROM hajj_packages p
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND p.is_active = $${paramIndex}`;
      params.push(status === 'active' ? true : false);
      paramIndex++;
    }

    if (type && type !== 'all') {
      query += ` AND p.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (vendor_id) {
      query += ` AND p.vendor_id = $${paramIndex}`;
      params.push(vendor_id);
      paramIndex++;
    }

    query += ` ORDER BY p.createdat DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      packages: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching Hajj packages:', err.message);
    res.status(500).json({ error: 'Failed to fetch Hajj packages' });
  }
});

// ============================================================
// 34. UPDATE HAJJ PACKAGE STATUS (Admin)
// ============================================================
router.put('/hajj/packages/:id/status', async (req, res) => {
  try {
    const db = await getClient();
    const packageId = req.params.id;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active status is required' });
    }

    const result = await db.query(
      `UPDATE hajj_packages 
       SET is_active = $1, updatedat = NOW()
       WHERE id = $2
       RETURNING id, name, is_active`,
      [is_active, packageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({
      success: true,
      message: `Package ${is_active ? 'activated' : 'deactivated'} successfully`,
      package: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating Hajj package:', err.message);
    res.status(500).json({ error: 'Failed to update package status' });
  }
});

// ============================================================
// 35. GET ALL HAJJ BOOKINGS (Admin)
// ============================================================
router.get('/hajj/bookings', async (req, res) => {
  try {
    const db = await getClient();
    const { status, package_id, vendor_id, limit = 100 } = req.query;

    let query = `
      SELECT 
        b.*,
        p.name as package_name,
        p.type as package_type,
        p.price as package_price,
        u.fullname as vendor_name,
        u.business_name,
        u.phone as vendor_phone,
        u.email as vendor_email,
        c.fullname as client_name,
        c.phone as client_phone,
        c.email as client_email,
        vp.location as vendor_location
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      JOIN users u ON p.vendor_id = u.id
      JOIN users c ON b.user_id = c.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (package_id) {
      query += ` AND b.package_id = $${paramIndex}`;
      params.push(package_id);
      paramIndex++;
    }

    if (vendor_id) {
      query += ` AND p.vendor_id = $${paramIndex}`;
      params.push(vendor_id);
      paramIndex++;
    }

    query += ` ORDER BY b.booking_date DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      bookings: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching Hajj bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch Hajj bookings' });
  }
});

// ============================================================
// 36. CANCEL HAJJ BOOKING (Admin)
// ============================================================
router.put('/hajj/bookings/:id/cancel', async (req, res) => {
  try {
    const db = await getClient();
    const bookingId = req.params.id;
    const { reason } = req.body;

    const check = await db.query(`
      SELECT b.*, p.available_slots, p.id as package_id
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      WHERE b.id = $1
    `, [bookingId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = check.rows[0];

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    await db.query('BEGIN');

    try {
      await db.query(`
        UPDATE hajj_bookings
        SET status = 'cancelled',
            special_requests = COALESCE(special_requests, '') || ' | Cancelled by admin. Reason: ' || $1,
            updatedat = NOW()
        WHERE id = $2
      `, [reason || 'No reason provided', bookingId]);

      await db.query(`
        UPDATE hajj_packages
        SET available_slots = available_slots + $1, updatedat = NOW()
        WHERE id = $2
      `, [booking.pilgrims, booking.package_id]);

      // Notification for client
      const notificationId = uuidv4();
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        booking.user_id,
        'Hajj Booking Cancelled by Admin',
        `Your Hajj booking for ${booking.package_name || 'package'} has been cancelled by admin. ${reason || 'Please contact support for more details.'}`,
        'hajj',
        `/hajj/bookings/${bookingId}`
      ]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error cancelling Hajj booking:', err.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ============================================================
// 37. GET HAJJ STATS (Admin)
// ============================================================
router.get('/hajj/stats', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM hajj_packages) as total_packages,
        (SELECT COUNT(*) FROM hajj_packages WHERE is_active = true) as active_packages,
        (SELECT COUNT(*) FROM hajj_packages WHERE is_active = false) as inactive_packages,
        (SELECT COUNT(*) FROM hajj_bookings) as total_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE status = 'confirmed') as confirmed_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE status = 'completed') as completed_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE status = 'cancelled') as cancelled_bookings,
        (SELECT COALESCE(SUM(total_price), 0) FROM hajj_bookings WHERE status = 'completed') as total_revenue
      FROM hajj_packages
    `);

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching Hajj stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch Hajj stats' });
  }
});

// ============================================================
// 38. GET BUTCHERY STATS (Admin)
// ============================================================
router.get('/butchery/stats', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users u
         JOIN vendor_profiles vp ON u.id = vp.user_id
         WHERE u.role = 'vendor' AND vp.business_type = 'halalbutchery') as total_butchers,
        (SELECT COUNT(*) FROM users u
         JOIN vendor_profiles vp ON u.id = vp.user_id
         WHERE u.role = 'vendor' AND vp.business_type = 'halalbutchery' AND u.vendor_status = 'approved') as active_butchers,
        (SELECT COUNT(*) FROM users u
         JOIN vendor_profiles vp ON u.id = vp.user_id
         WHERE u.role = 'vendor' AND vp.business_type = 'halalbutchery' AND u.vendor_status = 'pending') as pending_butchers,
        (SELECT COUNT(*) FROM products WHERE meat_type IS NOT NULL) as total_meat_products,
        (SELECT COUNT(*) FROM products WHERE meat_type IS NOT NULL AND is_active = true) as active_meat_products
      FROM users
    `);

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching butchery stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch butchery stats' });
  }
});

module.exports = router;