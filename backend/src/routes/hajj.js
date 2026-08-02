const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate, authorize } = require('../middleware/auth');
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

// ============================================================
// 1. GET ALL PACKAGES (Public)
// ============================================================
router.get('/packages', async (req, res) => {
  try {
    const db = await getClient();
    const { type, vendor_id, min_price, max_price, limit = 50, featured } = req.query;

    let query = `
      SELECT 
        p.*,
        u.fullname as vendor_name,
        u.business_name,
        u.profile_image as vendor_image,
        vp.rating as vendor_rating,
        vp.is_verified as vendor_verified,
        vp.logo_url as vendor_logo,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id) as total_bookings
      FROM hajj_packages p
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE p.is_active = true AND u.vendor_status = 'approved'
    `;
    const params = [];
    let paramIndex = 1;

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

    if (min_price) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(parseInt(min_price));
      paramIndex++;
    }

    if (max_price) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(parseInt(max_price));
      paramIndex++;
    }

    if (featured === 'true') {
      query += ` AND p.is_featured = true`;
    }

    query += ` ORDER BY p.is_featured DESC, p.createdat DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      packages: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching packages:', err.message);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// ============================================================
// 2. GET PACKAGE BY ID (Public)
// ============================================================
router.get('/packages/:packageId', async (req, res) => {
  try {
    const db = await getClient();
    const packageId = req.params.packageId;

    const result = await db.query(`
      SELECT 
        p.*,
        u.fullname as vendor_name,
        u.business_name,
        u.profile_image as vendor_image,
        u.phone as vendor_phone,
        u.email as vendor_email,
        vp.rating as vendor_rating,
        vp.is_verified as vendor_verified,
        vp.logo_url as vendor_logo,
        vp.location as vendor_location,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id) as total_bookings
      FROM hajj_packages p
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE p.id = $1 AND p.is_active = true
    `, [packageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true, package: result.rows[0] });

  } catch (err) {
    console.error('Error fetching package:', err.message);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// ============================================================
// 3. CREATE PACKAGE (Vendor only)
// ============================================================
router.post('/packages', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      name,
      type,
      description,
      duration_days,
      price,
      includes,
      excludes,
      images,
      available_slots,
      is_active,
      is_featured
    } = req.body;

    if (!name || !type || !price || !duration_days) {
      return res.status(400).json({
        error: 'Name, type, price, and duration are required'
      });
    }

    if (!['hajj', 'umrah'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "hajj" or "umrah"' });
    }

    // Check if vendor is approved
    const vendorCheck = await db.query(
      'SELECT vendor_status FROM users WHERE id = $1',
      [userId]
    );

    if (vendorCheck.rows[0]?.vendor_status !== 'approved') {
      return res.status(403).json({ error: 'Vendor not approved' });
    }

    const packageId = 'hajj-' + Date.now().toString(36) + uuidv4().slice(0, 8);

    await db.query(`
      INSERT INTO hajj_packages (
        id, vendor_id, name, type, description, duration_days,
        price, includes, excludes, images, available_slots,
        is_active, is_featured, source, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'halalhub', NOW(), NOW())
    `, [
      packageId,
      userId,
      name,
      type,
      description || null,
      duration_days,
      price,
      includes || [],
      excludes || [],
      images || [],
      available_slots || 50,
      is_active !== false,
      is_featured || false
    ]);

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      packageId: packageId
    });

  } catch (err) {
    console.error('Error creating package:', err.message);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// ============================================================
// 4. UPDATE PACKAGE (Vendor only)
// ============================================================
router.put('/packages/:packageId', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const packageId = req.params.packageId;
    const {
      name,
      type,
      description,
      duration_days,
      price,
      includes,
      excludes,
      images,
      available_slots,
      is_active,
      is_featured
    } = req.body;

    const check = await db.query(
      'SELECT id FROM hajj_packages WHERE id = $1 AND vendor_id = $2',
      [packageId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (type && !['hajj', 'umrah'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "hajj" or "umrah"' });
    }

    await db.query(`
      UPDATE hajj_packages SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        description = COALESCE($3, description),
        duration_days = COALESCE($4, duration_days),
        price = COALESCE($5, price),
        includes = COALESCE($6, includes),
        excludes = COALESCE($7, excludes),
        images = COALESCE($8, images),
        available_slots = COALESCE($9, available_slots),
        is_active = COALESCE($10, is_active),
        is_featured = COALESCE($11, is_featured),
        updatedat = NOW()
      WHERE id = $12 AND vendor_id = $13
    `, [
      name,
      type,
      description,
      duration_days,
      price,
      includes,
      excludes,
      images,
      available_slots,
      is_active,
      is_featured,
      packageId,
      userId
    ]);

    res.json({
      success: true,
      message: 'Package updated successfully'
    });

  } catch (err) {
    console.error('Error updating package:', err.message);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// ============================================================
// 5. DELETE PACKAGE (Vendor only)
// ============================================================
router.delete('/packages/:packageId', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const packageId = req.params.packageId;

    const result = await db.query(
      'DELETE FROM hajj_packages WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [packageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting package:', err.message);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// ============================================================
// 6. CREATE BOOKING (Client only) WITH PAYMENT
// ============================================================
router.post('/book', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const {
      package_id,
      pilgrims,
      pilgrim_names,
      passport_numbers,
      contact_phone,
      contact_email,
      special_requests
    } = req.body;

    if (!package_id || !pilgrims || !contact_phone || !contact_email) {
      return res.status(400).json({
        error: 'Package ID, pilgrims count, contact phone, and email are required'
      });
    }

    if (pilgrims < 1) {
      return res.status(400).json({ error: 'At least 1 pilgrim is required' });
    }

    // Get package details
    const packageResult = await db.query(`
      SELECT vendor_id, name, price, available_slots, type
      FROM hajj_packages
      WHERE id = $1 AND is_active = true
    `, [package_id]);

    if (packageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found or inactive' });
    }

    const pkg = packageResult.rows[0];

    if (pkg.available_slots < pilgrims) {
      return res.status(400).json({ error: 'Not enough slots available' });
    }

    const totalPrice = pkg.price * pilgrims;

    // ============================================================
    // VIRTUAL ACCOUNT PAYMENT FLOW
    // ============================================================

    // 1. Get client's virtual account
    const clientAccount = await virtualAccountService.getUserAccount(userId);

    if (!clientAccount) {
      return res.status(404).json({
        error: 'Virtual account not found. Please contact support.'
      });
    }

    // 2. Check if client has enough balance
    if (clientAccount.balance < totalPrice) {
      return res.status(400).json({
        error: `Insufficient balance. Available: KES ${clientAccount.balance.toLocaleString()}, Required: KES ${totalPrice.toLocaleString()}`
      });
    }

    // 3. Get vendor's virtual account
    const vendorAccount = await virtualAccountService.getUserAccount(pkg.vendor_id);

    if (!vendorAccount) {
      return res.status(404).json({
        error: 'Vendor virtual account not found. Please contact support.'
      });
    }

    const bookingId = 'hajj-book-' + Date.now().toString(36) + uuidv4().slice(0, 6);
    const transactionRef = 'HAJJ-' + Date.now().toString(36).toUpperCase() + uuidv4().slice(0, 6).toUpperCase();

    await db.query('BEGIN');

    try {
      // 4. Transfer payment from client to vendor
      await virtualAccountService.processTransfer(
        userId,
        clientAccount.account_number,
        vendorAccount.account_number,
        totalPrice,
        `Hajj/Umrah booking - ${bookingId}`
      );

      // 5. Create booking
      await db.query(`
        INSERT INTO hajj_bookings (
          id, user_id, package_id, pilgrims, pilgrim_names,
          passport_numbers, contact_phone, contact_email,
          special_requests, total_price, status, payment_status,
          payment_reference, booking_date, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', 'completed', $11, NOW(), NOW())
      `, [
        bookingId,
        userId,
        package_id,
        pilgrims,
        pilgrim_names || [],
        passport_numbers || [],
        contact_phone,
        contact_email,
        special_requests || null,
        totalPrice,
        transactionRef
      ]);

      // 6. Update available slots
      await db.query(`
        UPDATE hajj_packages
        SET available_slots = available_slots - $1, updatedat = NOW()
        WHERE id = $2
      `, [pilgrims, package_id]);

      // 7. Get user details for notification
      const userResult = await db.query(
        'SELECT fullname, phone FROM users WHERE id = $1',
        [userId]
      );

      // 8. Notification for vendor
      const vendorNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        vendorNotifId,
        pkg.vendor_id,
        'New Hajj/Umrah Booking',
        `${userResult.rows[0]?.fullname || 'A client'} has booked ${pkg.name} for ${pilgrims} pilgrim(s). KES ${totalPrice.toLocaleString()} deposited to your virtual account.`,
        'hajj',
        `/vendor/hajj-bookings`
      ]);

      // 9. Notification for client
      const clientNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        clientNotifId,
        userId,
        'Hajj/Umrah Booking Confirmed',
        `Your booking for ${pkg.name} has been confirmed. Total: KES ${totalPrice.toLocaleString()} has been deducted from your virtual account.`,
        'hajj',
        `/hajj/bookings/${bookingId}`
      ]);

      await db.query('COMMIT');

      // Get updated client balance
      const updatedClientAccount = await virtualAccountService.getUserAccount(userId);

      res.status(201).json({
        success: true,
        message: 'Booking and payment processed successfully',
        bookingId: bookingId,
        totalPrice: totalPrice,
        status: 'confirmed',
        payment_reference: transactionRef,
        new_balance: updatedClientAccount?.balance || 0,
        payment_status: 'completed'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error creating booking:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

// ============================================================
// 7. GET USER BOOKINGS (Client only)
// ============================================================
router.get('/bookings', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT 
        b.*,
        p.name as package_name,
        p.type as package_type,
        p.images as package_images,
        u.fullname as vendor_name,
        u.business_name,
        u.phone as vendor_phone
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      JOIN users u ON p.vendor_id = u.id
      WHERE b.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
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
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================================
// 8. GET BOOKING BY ID (Client or Vendor)
// ============================================================
router.get('/bookings/:bookingId', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const bookingId = req.params.bookingId;

    const result = await db.query(`
      SELECT 
        b.*,
        p.name as package_name,
        p.type as package_type,
        p.description as package_description,
        p.duration_days,
        p.price as package_price,
        p.images as package_images,
        u.fullname as vendor_name,
        u.business_name,
        u.phone as vendor_phone,
        u.email as vendor_email,
        vp.location as vendor_location
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE b.id = $1
    `, [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    // Check if user is the client or the vendor
    if (booking.user_id !== userId && booking.vendor_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      booking: booking
    });

  } catch (err) {
    console.error('Error fetching booking:', err.message);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ============================================================
// 9. CANCEL BOOKING (Client only - within 24 hours) WITH REFUND
// ============================================================
router.put('/bookings/:bookingId/cancel', authenticate, async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { reason } = req.body;

    const check = await db.query(`
      SELECT b.*, p.available_slots, p.vendor_id, p.price
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      WHERE b.id = $1 AND b.user_id = $2
    `, [bookingId, userId]);

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

    // Check if within 24 hours of booking creation
    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursDiff = (now - bookingDate) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return res.status(400).json({ error: 'Cancellations only allowed within 24 hours of booking' });
    }

    // ============================================================
    // REFUND LOGIC - Reverse the payment
    // ============================================================

    // 1. Get client's virtual account for refund
    const clientAccount = await virtualAccountService.getUserAccount(userId);

    if (!clientAccount) {
      return res.status(404).json({
        error: 'Virtual account not found. Please contact support.'
      });
    }

    // 2. Get vendor's virtual account
    const vendorAccount = await virtualAccountService.getUserAccount(booking.vendor_id);

    if (!vendorAccount) {
      return res.status(404).json({
        error: 'Vendor virtual account not found. Please contact support.'
      });
    }

    const refundAmount = booking.total_price;
    const refundRef = 'REF-' + Date.now().toString(36).toUpperCase() + uuidv4().slice(0, 6).toUpperCase();

    await db.query('BEGIN');

    try {
      // 3. Refund from vendor back to client (reverse transfer)
      await virtualAccountService.processTransfer(
        booking.vendor_id,
        vendorAccount.account_number,
        clientAccount.account_number,
        refundAmount,
        `Hajj booking refund - ${bookingId}`
      );

      // 4. Update booking status
      await db.query(`
        UPDATE hajj_bookings
        SET status = 'cancelled',
            special_requests = COALESCE(special_requests, '') || ' | Cancelled. Reason: ' || $1,
            payment_status = 'refunded',
            refund_reference = $2,
            updatedat = NOW()
        WHERE id = $3
      `, [reason || 'No reason provided', refundRef, bookingId]);

      // 5. Restore available slots
      await db.query(`
        UPDATE hajj_packages
        SET available_slots = available_slots + $1, updatedat = NOW()
        WHERE id = $2
      `, [booking.pilgrims, booking.package_id]);

      // 6. Notification for client (refund)
      const clientNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        clientNotifId,
        userId,
        'Hajj Booking Cancelled - Refund Processed',
        `Your Hajj/Umrah booking has been cancelled. KES ${refundAmount.toLocaleString()} has been refunded to your virtual account.`,
        'hajj',
        `/hajj/bookings/${bookingId}`
      ]);

      // 7. Notification for vendor
      const vendorNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        vendorNotifId,
        booking.vendor_id,
        'Hajj Booking Cancelled - Funds Refunded',
        `A Hajj/Umrah booking has been cancelled. KES ${refundAmount.toLocaleString()} has been refunded to the client.`,
        'hajj',
        `/vendor/hajj-bookings`
      ]);

      await db.query('COMMIT');

      const updatedClientAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Booking cancelled and refunded successfully',
        refund_amount: refundAmount,
        refund_reference: refundRef,
        new_balance: updatedClientAccount?.balance || 0
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error cancelling booking:', err.message);
    res.status(500).json({ error: err.message || 'Failed to cancel booking' });
  }
});

// ============================================================
// 10. GET VENDOR PACKAGES (Vendor only)
// ============================================================
router.get('/vendor/packages', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 100 } = req.query;

    const result = await db.query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id) as total_bookings,
        (SELECT COUNT(*) FROM hajj_bookings WHERE package_id = p.id AND status = 'pending') as pending_bookings
      FROM hajj_packages p
      WHERE p.vendor_id = $1
      ORDER BY p.createdat DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({
      success: true,
      packages: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching vendor packages:', err.message);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// ============================================================
// 11. GET VENDOR BOOKINGS (Vendor only)
// ============================================================
router.get('/vendor/bookings', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT 
        b.*,
        p.name as package_name,
        p.type as package_type,
        u.fullname as client_name,
        u.phone as client_phone,
        u.email as client_email
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      JOIN users u ON b.user_id = u.id
      WHERE p.vendor_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
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
    console.error('Error fetching vendor bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================================
// 12. UPDATE BOOKING STATUS (Vendor only) WITH PAYMENT STATUS
// ============================================================
router.put('/vendor/bookings/:bookingId/status', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { status } = req.body;

    if (!status || !['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be "confirmed", "completed", or "cancelled"'
      });
    }

    const check = await db.query(`
      SELECT b.*, p.vendor_id, p.id as package_id, p.available_slots
      FROM hajj_bookings b
      JOIN hajj_packages p ON b.package_id = p.id
      WHERE b.id = $1 AND p.vendor_id = $2
    `, [bookingId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = check.rows[0];

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot update a cancelled booking' });
    }

    await db.query('BEGIN');

    try {
      const oldStatus = booking.status;

      await db.query(`
        UPDATE hajj_bookings
        SET status = $1, updatedat = NOW()
        WHERE id = $2
      `, [status, bookingId]);

      // If cancelling, restore slots and handle refund
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        await db.query(`
          UPDATE hajj_packages
          SET available_slots = available_slots + $1, updatedat = NOW()
          WHERE id = $2
        `, [booking.pilgrims, booking.package_id]);
      }

      // Notification for client
      const notificationId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        booking.user_id,
        `Booking ${status}`,
        `Your Hajj/Umrah booking has been ${status}.`,
        'hajj',
        `/hajj/bookings/${bookingId}`
      ]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: `Booking ${status} successfully`
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error updating booking status:', err.message);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// ============================================================
// 13. GET PACKAGE STATS (Vendor only)
// ============================================================
router.get('/vendor/stats', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM hajj_packages WHERE vendor_id = $1 AND is_active = true) as total_packages,
        (SELECT COUNT(*) FROM hajj_bookings b
         JOIN hajj_packages p ON b.package_id = p.id
         WHERE p.vendor_id = $1 AND b.status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM hajj_bookings b
         JOIN hajj_packages p ON b.package_id = p.id
         WHERE p.vendor_id = $1 AND b.status = 'confirmed') as confirmed_bookings,
        (SELECT COUNT(*) FROM hajj_bookings b
         JOIN hajj_packages p ON b.package_id = p.id
         WHERE p.vendor_id = $1 AND b.status = 'completed') as completed_bookings,
        (SELECT COALESCE(SUM(b.total_price), 0) FROM hajj_bookings b
         JOIN hajj_packages p ON b.package_id = p.id
         WHERE p.vendor_id = $1 AND b.status = 'completed') as total_revenue
    `, [userId]);

    res.json({
      success: true,
      stats: {
        totalPackages: parseInt(result.rows[0].total_packages) || 0,
        pendingBookings: parseInt(result.rows[0].pending_bookings) || 0,
        confirmedBookings: parseInt(result.rows[0].confirmed_bookings) || 0,
        completedBookings: parseInt(result.rows[0].completed_bookings) || 0,
        totalRevenue: parseInt(result.rows[0].total_revenue) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching vendor stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch vendor stats' });
  }
});

module.exports = router;