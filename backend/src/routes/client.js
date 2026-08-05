const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');
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

// All client routes require authentication
router.use(authenticate);

// ============================================================
// 1. GET ALL VENDORS (Public)
// ============================================================
router.get('/vendors', async (req, res) => {
  try {
    const db = await getClient();
    const { business_type, limit = 50 } = req.query;

    let query = `
      SELECT 
        u.id, u.fullname, u.business_name, u.profile_image,
        vp.id as profile_id, vp.business_type, vp.description, vp.location, vp.county,
        vp.is_verified, vp.rating, vp.total_reviews, vp.logo_url, vp.cover_image
      FROM users u
      JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE u.role = 'vendor' AND u.vendor_status = 'approved' AND vp.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (business_type) {
      query += ` AND vp.business_type = $${paramIndex}`;
      params.push(business_type);
      paramIndex++;
    }

    query += ` ORDER BY vp.rating DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, vendors: result.rows });

  } catch (err) {
    console.error('Error fetching vendors:', err.message);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// ============================================================
// 2. GET VENDOR BY ID (Public)
// ============================================================
router.get('/vendors/:vendorId', async (req, res) => {
  try {
    const db = await getClient();
    const vendorId = req.params.vendorId;

    const result = await db.query(`
      SELECT 
        u.id, u.fullname, u.business_name, u.profile_image, u.bio,
        vp.id as profile_id, vp.business_type, vp.description, vp.location, vp.county,
        vp.is_verified, vp.rating, vp.total_reviews, vp.logo_url, vp.cover_image,
        vp.total_orders, vp.total_revenue
      FROM users u
      JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE u.id = $1 AND u.role = 'vendor' AND u.vendor_status = 'approved' AND vp.is_active = true
    `, [vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ success: true, vendor: result.rows[0] });

  } catch (err) {
    console.error('Error fetching vendor:', err.message);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// ============================================================
// 3. GET ALL PRODUCTS (Public)
// ============================================================
router.get('/products', async (req, res) => {
  try {
    const db = await getClient();
    const { category, vendor_id, min_price, max_price, limit = 50 } = req.query;

    let query = `
      SELECT 
        p.*,
        u.fullname as vendor_name,
        u.business_name,
        vp.business_type as vendor_type,
        vp.rating as vendor_rating,
        vp.logo_url as vendor_logo
      FROM products p
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE p.is_active = true AND u.vendor_status = 'approved' AND vp.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND p.category = $${paramIndex}`;
      params.push(category);
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

    query += ` ORDER BY p.createdat DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, products: result.rows });

  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ============================================================
// 4. GET PRODUCT BY ID (Public)
// ============================================================
router.get('/products/:productId', async (req, res) => {
  try {
    const db = await getClient();
    const productId = req.params.productId;

    const result = await db.query(`
      SELECT 
        p.*,
        u.fullname as vendor_name,
        u.business_name,
        vp.business_type as vendor_type,
        vp.rating as vendor_rating,
        vp.is_verified as vendor_verified,
        vp.logo_url as vendor_logo
      FROM products p
      JOIN users u ON p.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE p.id = $1 AND p.is_active = true
    `, [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });

  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ============================================================
// 5. GET ALL LISTINGS (Public - HalalStay)
// ============================================================
router.get('/listings', async (req, res) => {
  try {
    const db = await getClient();
    const { type, county, min_price, max_price, limit = 50 } = req.query;

    let query = `
      SELECT 
        l.*,
        u.fullname as vendor_name,
        u.business_name,
        vp.rating as vendor_rating,
        vp.logo_url as vendor_logo
      FROM listings l
      JOIN users u ON l.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE l.is_active = true AND u.vendor_status = 'approved' AND vp.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND l.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (county) {
      query += ` AND l.county = $${paramIndex}`;
      params.push(county);
      paramIndex++;
    }

    if (min_price) {
      query += ` AND l.price_per_night >= $${paramIndex}`;
      params.push(parseInt(min_price));
      paramIndex++;
    }

    if (max_price) {
      query += ` AND l.price_per_night <= $${paramIndex}`;
      params.push(parseInt(max_price));
      paramIndex++;
    }

    query += ` ORDER BY l.createdat DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, listings: result.rows });

  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ============================================================
// 6. GET LISTING BY ID (Public)
// ============================================================
router.get('/listings/:listingId', async (req, res) => {
  try {
    const db = await getClient();
    const listingId = req.params.listingId;

    const result = await db.query(`
      SELECT 
        l.*,
        u.fullname as vendor_name,
        u.business_name,
        vp.rating as vendor_rating,
        vp.is_verified as vendor_verified,
        vp.logo_url as vendor_logo
      FROM listings l
      JOIN users u ON l.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE l.id = $1 AND l.is_active = true
    `, [listingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ success: true, listing: result.rows[0] });

  } catch (err) {
    console.error('Error fetching listing:', err.message);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// ============================================================
// 7. CHECK LISTING AVAILABILITY (Public)
// ============================================================
router.get('/listings/:listingId/availability', async (req, res) => {
  try {
    const db = await getClient();
    const listingId = req.params.listingId;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const result = await db.query(`
      SELECT date, is_available 
      FROM listing_availability 
      WHERE listing_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date
    `, [listingId, start_date, end_date]);

    res.json({ success: true, availability: result.rows });

  } catch (err) {
    console.error('Error fetching availability:', err.message);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// ============================================================
// 8. CREATE BOOKING (Client) - HalalStay WITH PAYMENT
// ============================================================
router.post('/bookings', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const {
      listing_id,
      check_in,
      check_out,
      guests,
      rooms,
      special_requests
    } = req.body;

    if (!listing_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'Listing ID, check-in, and check-out are required' });
    }

    const listing = await db.query(
      'SELECT vendor_id, price_per_night, total_rooms, available_rooms, min_stay, max_advance_days, max_guests_per_room FROM listings WHERE id = $1 AND is_active = true',
      [listing_id]
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listingData = listing.rows[0];
    const roomsToBook = rooms || 1;

    if (listingData.available_rooms <= 0 || listingData.available_rooms < roomsToBook) {
      return res.status(400).json({ error: 'Not enough rooms available for this property' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    if (nights < listingData.min_stay) {
      return res.status(400).json({ 
        error: `Minimum stay is ${listingData.min_stay} night(s)` 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxAdvanceDate = new Date(today);
    maxAdvanceDate.setDate(today.getDate() + listingData.max_advance_days);

    if (checkInDate > maxAdvanceDate) {
      return res.status(400).json({ 
        error: `Cannot book more than ${listingData.max_advance_days} days in advance` 
      });
    }

    const maxGuestsPerRoom = listingData.max_guests_per_room || 2;
    const maxAllowedGuests = roomsToBook * maxGuestsPerRoom;

    if (guests > maxAllowedGuests) {
      return res.status(400).json({ 
        error: `Maximum ${maxGuestsPerRoom} guests per room. You booked ${roomsToBook} room(s), so maximum ${maxAllowedGuests} guests allowed.` 
      });
    }

    if (guests < 1) {
      return res.status(400).json({ error: 'At least 1 guest is required' });
    }

    const totalPrice = listingData.price_per_night * roomsToBook * nights;

    const clientAccount = await virtualAccountService.getUserAccount(userId);

    if (!clientAccount) {
      return res.status(404).json({
        error: 'Virtual account not found. Please contact support.'
      });
    }

    if (clientAccount.balance < totalPrice) {
      return res.status(400).json({
        error: `Insufficient balance. Available: KES ${clientAccount.balance.toLocaleString()}, Required: KES ${totalPrice.toLocaleString()}`
      });
    }

    const vendorAccount = await virtualAccountService.getUserAccount(listingData.vendor_id);

    if (!vendorAccount) {
      return res.status(404).json({
        error: 'Vendor virtual account not found. Please contact support.'
      });
    }

    const blockedDatesCheck = await db.query(`
      SELECT date FROM listing_availability 
      WHERE listing_id = $1 AND date BETWEEN $2 AND $3 AND is_available = false
    `, [listing_id, check_in, check_out]);

    if (blockedDatesCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Selected dates are not available' });
    }

    const availabilityExists = await db.query(`
      SELECT COUNT(*) FROM listing_availability WHERE listing_id = $1
    `, [listing_id]);

    const hasAvailabilityRecords = parseInt(availabilityExists.rows[0].count) > 0;

    if (hasAvailabilityRecords) {
      const availabilityCheck = await db.query(`
        SELECT date FROM listing_availability 
        WHERE listing_id = $1 AND date BETWEEN $2 AND $3 AND is_available = false
      `, [listing_id, check_in, check_out]);

      if (availabilityCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Selected dates are not available' });
      }
    }

    const bookingId = 'book-' + Date.now();
    const transactionRef = 'PAY-' + Date.now().toString(36).toUpperCase() + uuidv4().slice(0, 6).toUpperCase();

    await db.query('BEGIN');

    try {
      await virtualAccountService.processTransfer(
        userId,
        clientAccount.account_number,
        vendorAccount.account_number,
        totalPrice,
        `HalalStay booking - ${bookingId}`
      );

      await db.query(`
        INSERT INTO bookings (
          id, listing_id, user_id, vendor_id, check_in, check_out,
          guests, total_price, status, special_requests, booking_date,
          payment_status, payment_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, NOW(), 'completed', $10)
      `, [bookingId, listing_id, userId, listingData.vendor_id, check_in, check_out, guests, totalPrice, special_requests || null, transactionRef]);

      await db.query(`
        UPDATE listings 
        SET available_rooms = available_rooms - $1,
            total_bookings = total_bookings + 1,
            updatedat = NOW()
        WHERE id = $2
      `, [roomsToBook, listing_id]);

      await db.query(`
        UPDATE vendor_profiles
        SET total_orders = total_orders + 1,
            total_revenue = total_revenue + $1,
            updatedat = NOW()
        WHERE user_id = $2
      `, [totalPrice, listingData.vendor_id]);

      const vendorNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        vendorNotifId,
        listingData.vendor_id,
        'New HalalStay Booking',
        `You have a new booking! KES ${totalPrice.toLocaleString()} has been deposited to your virtual account.`,
        'booking',
        `/vendor/bookings`
      ]);

      const clientNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        clientNotifId,
        userId,
        'Booking Confirmed',
        `Your booking has been confirmed. KES ${totalPrice.toLocaleString()} has been deducted from your virtual account.`,
        'booking',
        `/bookings/${bookingId}`
      ]);

      await db.query('COMMIT');

      const updatedClientAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Booking created and payment processed successfully',
        bookingId: bookingId,
        booking_id: bookingId,
        totalPrice: totalPrice,
        total_price: totalPrice,
        nights: nights,
        rooms_booked: roomsToBook,
        rooms_left: listingData.available_rooms - roomsToBook,
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
// 9. GET USER BOOKINGS (HalalStay)
// ============================================================
router.get('/bookings', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        b.*,
        l.title as listing_title,
        l.location as listing_location,
        l.images as listing_images,
        u.fullname as vendor_name
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON b.vendor_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC
    `, [userId]);

    res.json({ success: true, bookings: result.rows });

  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================================
// 10. GET ALL LEADERS (Public - For Pension Support)
// ============================================================
router.get('/leaders', async (req, res) => {
  try {
    const db = await getClient();
    const { leader_type, limit = 50 } = req.query;

    let query = `
      SELECT 
        l.id,
        l.user_id,
        l.leader_type,
        l.name,
        l.title,
        l.location,
        l.county,
        l.mosque_name,
        l.qualifications,
        l.years_of_service,
        l.is_verified,
        l.is_public,
        l.share_link,
        u.profile_image,
        u.bio,
        lp.total_contributions,
        lp.total_supporters
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE l.is_public = true AND l.status = 'approved'
    `;
    const params = [];
    let paramIndex = 1;

    if (leader_type) {
      query += ` AND l.leader_type = $${paramIndex}`;
      params.push(leader_type);
      paramIndex++;
    }

    query += ` ORDER BY lp.total_supporters DESC NULLS LAST, u.fullname ASC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, leaders: result.rows });

  } catch (err) {
    console.error('Error fetching leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaders' });
  }
});

// ============================================================
// 11. GET LEADER BY ID (Public - For Pension Support)
// ============================================================
router.get('/leaders/:id', async (req, res) => {
  try {
    const db = await getClient();
    const leaderId = req.params.id;

    const result = await db.query(`
      SELECT 
        l.id,
        l.user_id,
        l.leader_type,
        l.name,
        l.title,
        l.location,
        l.county,
        l.mosque_name,
        l.mosque_location,
        l.qualifications,
        l.years_of_service,
        l.is_verified,
        l.is_public,
        l.share_link,
        u.profile_image,
        u.bio,
        u.phone,
        u.email,
        lp.total_contributions,
        lp.total_supporters
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN leader_pension_balances lp ON l.id = lp.leader_id
      WHERE l.id = $1 AND l.is_public = true AND l.status = 'approved'
    `, [leaderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    res.json({ success: true, leader: result.rows[0] });

  } catch (err) {
    console.error('Error fetching leader:', err.message);
    res.status(500).json({ error: 'Failed to fetch leader' });
  }
});

// ============================================================
// 12. SUPPORT LEADER (Contribute to their pension)
// ============================================================
router.post('/support-leader', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const { leader_id, amount, frequency = 'once' } = req.body;

    if (!leader_id) {
      return res.status(400).json({ error: 'Leader ID is required' });
    }

    if (!amount || parseInt(amount) < 10) {
      return res.status(400).json({ error: 'Minimum contribution is KES 10' });
    }

    const contributionAmount = parseInt(amount);

    const leaderCheck = await db.query(`
      SELECT l.id, l.user_id, u.fullname 
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1 AND l.is_public = true AND l.status = 'approved'
    `, [leader_id]);

    if (leaderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Leader not found or not accepting contributions' });
    }

    const leader = leaderCheck.rows[0];

    const userAccount = await virtualAccountService.getUserAccount(userId);

    if (!userAccount) {
      return res.status(404).json({ 
        error: 'Virtual account not found. Please contact support.' 
      });
    }

    if (userAccount.balance < contributionAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        balance: userAccount.balance,
        required: contributionAmount
      });
    }

    const PENSION_MASTER_ACCOUNT = process.env.PENSION_MASTER_ACCOUNT || 'PENSION-MASTER-001';

    const masterAccount = await virtualAccountService.getAccountByNumber(PENSION_MASTER_ACCOUNT);

    if (!masterAccount) {
      console.error('[Pension] Master account not found:', PENSION_MASTER_ACCOUNT);
      return res.status(500).json({ 
        error: 'Pension master account not configured. Please contact support.' 
      });
    }

    await db.query('BEGIN');

    try {
      await virtualAccountService.processTransfer(
        userId,
        userAccount.account_number,
        PENSION_MASTER_ACCOUNT,
        contributionAmount,
        `Pension contribution for leader (${leader_id})`
      );

      const contributionId = 'pcont-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO leader_pension_contributions (
          id, leader_id, user_id, amount, payment_method, status, contribution_date, is_self_contribution
        ) VALUES ($1, $2, $3, $4, 'wallet', 'pending', NOW(), false)
      `, [contributionId, leader_id, userId, contributionAmount]);

      await db.query(`
        UPDATE leader_pension_balances 
        SET total_contributions = total_contributions + $1,
            updatedat = NOW()
        WHERE leader_id = $2
      `, [contributionAmount, leader_id]);

      const existingSupporter = await db.query(
        'SELECT id FROM leader_supporters WHERE leader_id = $1 AND user_id = $2',
        [leader_id, userId]
      );

      if (existingSupporter.rows.length > 0) {
        await db.query(
          'UPDATE leader_supporters SET amount = amount + $1, frequency = $2, updatedat = NOW() WHERE id = $3',
          [contributionAmount, frequency || 'once', existingSupporter.rows[0].id]
        );
      } else {
        const supporterId = 'supp-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
        await db.query(`
          INSERT INTO leader_supporters (id, leader_id, user_id, amount, frequency, status, createdat, updatedat)
          VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        `, [supporterId, leader_id, userId, contributionAmount, frequency || 'once']);

        await db.query(`
          UPDATE leader_pension_balances 
          SET total_supporters = total_supporters + 1,
              updatedat = NOW()
          WHERE leader_id = $1
        `, [leader_id]);
      }

      const notificationId = 'notif-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        leader.user_id,
        'New Pension Contribution',
        `A supporter has contributed KES ${contributionAmount.toLocaleString()} to your pension fund. Pending approval.`,
        'pension',
        `/leader-dashboard`
      ]);

      await db.query('COMMIT');

      const updatedAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Contribution recorded successfully. Pending admin approval.',
        contribution_id: contributionId,
        new_balance: updatedAccount?.balance || 0,
        amount: contributionAmount,
        leader_name: leader.fullname || 'Leader',
        status: 'pending'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error supporting leader:', err.message);
    res.status(500).json({ error: 'Failed to support leader' });
  }
});

// ============================================================
// 13. GET SUPPORTED LEADERS (Client)
// ============================================================
router.get('/supported-leaders', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        s.*,
        u.fullname as leader_name,
        u.profile_image,
        l.leader_type,
        l.mosque_name,
        l.location
      FROM leader_supporters s
      JOIN leaders l ON s.leader_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.createdat DESC
    `, [userId]);

    res.json({ success: true, supported: result.rows });

  } catch (err) {
    console.error('Error fetching supported leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch supported leaders' });
  }
});

// ============================================================
// 14. GET ALL LEADERS FOR CONSULTATION (Public)
// ============================================================
router.get('/consultation-leaders', async (req, res) => {
  try {
    const db = await getClient();
    const { leader_type, county, limit = 50 } = req.query;

    let query = `
      SELECT 
        l.id,
        l.user_id,
        l.leader_type,
        l.name,
        l.title,
        l.location,
        l.county,
        l.qualifications as expertise,
        l.consultation_fee as fee,
        l.years_of_service as experience,
        l.bio,
        l.is_verified as verified,
        l.consultation_types,
        l.available_for_consultation as available,
        u.fullname as name,
        u.profile_image,
        u.email,
        u.phone
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      WHERE l.available_for_consultation = true 
        AND l.status = 'approved'
        AND u.role = 'leader'
    `;
    const params = [];
    let paramIndex = 1;

    if (leader_type && leader_type !== 'all') {
      query += ` AND l.leader_type = $${paramIndex}`;
      params.push(leader_type);
      paramIndex++;
    }

    if (county && county !== 'All') {
      query += ` AND l.county = $${paramIndex}`;
      params.push(county);
      paramIndex++;
    }

    query += ` ORDER BY l.is_verified DESC, l.rating DESC NULLS LAST, u.fullname ASC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, leaders: result.rows });

  } catch (err) {
    console.error('Error fetching consultation leaders:', err.message);
    res.status(500).json({ error: 'Failed to fetch consultation leaders' });
  }
});

// ============================================================
// 15. GET MOSQUES (Public)
// ============================================================
router.get('/mosques', async (req, res) => {
  try {
    const db = await getClient();
    const { county, limit = 50 } = req.query;

    let query = `
      SELECT m.*, u.fullname as leader_name
      FROM mosques m
      LEFT JOIN leaders l ON m.leader_id = l.id
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (county) {
      query += ` AND m.county = $${paramIndex}`;
      params.push(county);
      paramIndex++;
    }

    query += ` ORDER BY m.name LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, mosques: result.rows });

  } catch (err) {
    console.error('Error fetching mosques:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosques' });
  }
});

// ============================================================
// 16. GET RESTAURANT MENU ITEMS (Public)
// ============================================================
router.get('/menu-items', async (req, res) => {
  try {
    const db = await getClient();
    const { vendor_id, category, limit = 50 } = req.query;

    let query = `
      SELECT m.*, u.fullname as vendor_name
      FROM menu_items m
      JOIN users u ON m.vendor_id = u.id
      WHERE m.is_available = true AND u.vendor_status = 'approved'
    `;
    const params = [];
    let paramIndex = 1;

    if (vendor_id) {
      query += ` AND m.vendor_id = $${paramIndex}`;
      params.push(vendor_id);
      paramIndex++;
    }

    if (category) {
      query += ` AND m.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY m.createdat DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, menuItems: result.rows });

  } catch (err) {
    console.error('Error fetching menu items:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// ============================================================
// 17. GET ALL HAJJ PACKAGES (Public)
// ============================================================
router.get('/hajj/packages', async (req, res) => {
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
    console.error('Error fetching Hajj packages:', err.message);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// ============================================================
// 18. GET HAJJ PACKAGE BY ID (Public)
// ============================================================
router.get('/hajj/packages/:packageId', async (req, res) => {
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
    console.error('Error fetching Hajj package:', err.message);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// ============================================================
// 19. CREATE HAJJ BOOKING (Client only) WITH PAYMENT
// ============================================================
router.post('/hajj/book', async (req, res) => {
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

    const clientAccount = await virtualAccountService.getUserAccount(userId);

    if (!clientAccount) {
      return res.status(404).json({
        error: 'Virtual account not found. Please contact support.'
      });
    }

    if (clientAccount.balance < totalPrice) {
      return res.status(400).json({
        error: `Insufficient balance. Available: KES ${clientAccount.balance.toLocaleString()}, Required: KES ${totalPrice.toLocaleString()}`
      });
    }

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
      await virtualAccountService.processTransfer(
        userId,
        clientAccount.account_number,
        vendorAccount.account_number,
        totalPrice,
        `Hajj booking - ${bookingId}`
      );

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

      await db.query(`
        UPDATE hajj_packages
        SET available_slots = available_slots - $1, updatedat = NOW()
        WHERE id = $2
      `, [pilgrims, package_id]);

      const userResult = await db.query(
        'SELECT fullname, phone FROM users WHERE id = $1',
        [userId]
      );

      const vendorNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        vendorNotifId,
        pkg.vendor_id,
        'New Hajj/Umrah Booking',
        `${userResult.rows[0]?.fullname || 'A client'} has booked ${pkg.name} for ${pilgrims} pilgrim(s). KES ${totalPrice.toLocaleString()} deposited to your account.`,
        'hajj',
        `/vendor/hajj-bookings`
      ]);

      const clientNotifId = 'notif-' + Date.now().toString(36) + uuidv4().slice(0, 8);
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        clientNotifId,
        userId,
        'Hajj/Umrah Booking Confirmed',
        `Your booking for ${pkg.name} has been confirmed. Total: KES ${totalPrice.toLocaleString()}. Payment deducted from your virtual account.`,
        'hajj',
        `/hajj/bookings/${bookingId}`
      ]);

      await db.query('COMMIT');

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
    console.error('Error creating Hajj booking:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

// ============================================================
// 20. GET USER HAJJ BOOKINGS (Client only)
// ============================================================
router.get('/hajj/bookings', async (req, res) => {
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
    console.error('Error fetching Hajj bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================================
// 21. GET HAJJ BOOKING BY ID (Client only)
// ============================================================
router.get('/hajj/bookings/:bookingId', async (req, res) => {
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
      WHERE b.id = $1 AND b.user_id = $2
    `, [bookingId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching Hajj booking:', err.message);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// ============================================================
// 22. CANCEL HAJJ BOOKING (Client only - within 24 hours)
// ============================================================
router.put('/hajj/bookings/:bookingId/cancel', async (req, res) => {
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

    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursDiff = (now - bookingDate) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return res.status(400).json({ error: 'Cancellations only allowed within 24 hours of booking' });
    }

    const clientAccount = await virtualAccountService.getUserAccount(userId);

    if (!clientAccount) {
      return res.status(404).json({
        error: 'Virtual account not found. Please contact support.'
      });
    }

    const vendorAccount = await virtualAccountService.getUserAccount(booking.vendor_id);

    if (!vendorAccount) {
      return res.status(404).json({
        error: 'Vendor virtual account not found. Please contact support.'
      });
    }

    const refundAmount = booking.total_price;
    const transactionRef = 'REF-' + Date.now().toString(36).toUpperCase() + uuidv4().slice(0, 6).toUpperCase();

    await db.query('BEGIN');

    try {
      await virtualAccountService.processTransfer(
        booking.vendor_id,
        vendorAccount.account_number,
        clientAccount.account_number,
        refundAmount,
        `Hajj booking refund - ${bookingId}`
      );

      await db.query(`
        UPDATE hajj_bookings
        SET status = 'cancelled',
            special_requests = COALESCE(special_requests, '') || ' | Cancelled. Reason: ' || $1,
            refund_reference = $2,
            updatedat = NOW()
        WHERE id = $3
      `, [reason || 'No reason provided', transactionRef, bookingId]);

      await db.query(`
        UPDATE hajj_packages
        SET available_slots = available_slots + $1, updatedat = NOW()
        WHERE id = $2
      `, [booking.pilgrims, booking.package_id]);

      await db.query('COMMIT');

      const updatedClientAccount = await virtualAccountService.getUserAccount(userId);

      res.json({
        success: true,
        message: 'Booking cancelled and refunded successfully',
        refund_amount: refundAmount,
        refund_reference: transactionRef,
        new_balance: updatedClientAccount?.balance || 0
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error cancelling Hajj booking:', err.message);
    res.status(500).json({ error: err.message || 'Failed to cancel booking' });
  }
});

// ============================================================
// 23. CREATE ORDER (Client - Ecommerce)
// ============================================================
router.post('/orders', async (req, res) => {
  const db = await getClient();

  try {
    const userId = req.user.id;
    const {
      vendor_id,
      items,
      subtotal,
      delivery_fee = 0,
      total_amount,
      delivery_address,
      delivery_type = 'delivery',
      special_instructions
    } = req.body;

    if (!vendor_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Vendor ID and items are required' });
    }

    if (!total_amount || total_amount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    // Check if user has sufficient balance
    const clientAccount = await virtualAccountService.getUserAccount(userId);

    if (!clientAccount) {
      return res.status(404).json({ error: 'Virtual account not found' });
    }

    if (clientAccount.balance < total_amount) {
      return res.status(400).json({
        error: `Insufficient balance. Available: KES ${clientAccount.balance.toLocaleString()}, Required: KES ${total_amount.toLocaleString()}`
      });
    }

    // Check vendor exists
    const vendorCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND vendor_status = $3',
      [vendor_id, 'vendor', 'approved']
    );

    if (vendorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get vendor's virtual account
    const vendorAccount = await virtualAccountService.getUserAccount(vendor_id);

    if (!vendorAccount) {
      return res.status(404).json({ error: 'Vendor virtual account not found' });
    }

    const orderId = 'ord-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
    const transactionRef = 'PAY-' + Date.now().toString(36).toUpperCase() + require('crypto').randomBytes(4).toString('hex').toUpperCase();

    await db.query('BEGIN');

    try {
      // Transfer payment from client to vendor
      await virtualAccountService.processTransfer(
        userId,
        clientAccount.account_number,
        vendorAccount.account_number,
        total_amount,
        `Order payment - ${orderId}`
      );

      // Create order
      await db.query(`
        INSERT INTO orders (
          id, user_id, vendor_id, items, subtotal, delivery_fee,
          total_amount, status, payment_status, payment_reference,
          delivery_address, delivery_type, special_instructions, order_date, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'completed', $8, $9, $10, $11, NOW(), NOW())
      `, [
        orderId,
        userId,
        vendor_id,
        JSON.stringify(items),
        subtotal || 0,
        delivery_fee || 0,
        total_amount,
        transactionRef,
        delivery_address || null,
        delivery_type || 'delivery',
        special_instructions || null
      ]);

      // Update vendor profile stats
      await db.query(`
        UPDATE vendor_profiles
        SET total_orders = total_orders + 1,
            total_revenue = total_revenue + $1,
            updatedat = NOW()
        WHERE user_id = $2
      `, [total_amount, vendor_id]);

      // Update product stock
      for (const item of items) {
        await db.query(
          'UPDATE products SET stock = stock - $1, total_sold = total_sold + $1, updatedat = NOW() WHERE id = $2 AND vendor_id = $3',
          [item.quantity, item.product_id, vendor_id]
        );
      }

      // Clear user's cart
      const productIds = items.map(i => i.product_id);
      await db.query(
        'DELETE FROM cart WHERE user_id = $1 AND product_id = ANY($2)',
        [userId, productIds]
      );

      // Send notification to vendor
      const vendorNotifId = 'notif-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        vendorNotifId,
        vendor_id,
        'New Order Received',
        `You have received a new order. Total: KES ${total_amount.toLocaleString()}. Funds have been deposited to your virtual account.`,
        'order',
        `/vendor/orders/${orderId}`
      ]);

      // Send notification to client
      const clientNotifId = 'notif-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        clientNotifId,
        userId,
        'Order Placed Successfully',
        `Your order has been placed successfully. Total: KES ${total_amount.toLocaleString()}. Payment confirmed.`,
        'order',
        `/orders/${orderId}`
      ]);

      await db.query('COMMIT');

      const updatedClientAccount = await virtualAccountService.getUserAccount(userId);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        orderId: orderId,
        order_id: orderId,
        total_amount: total_amount,
        payment_reference: transactionRef,
        new_balance: updatedClientAccount?.balance || 0
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// ============================================================
// 24. GET USER ORDERS (Client)
// ============================================================
router.get('/orders', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT 
        o.*,
        u.fullname as vendor_name,
        u.business_name,
        u.phone as vendor_phone
      FROM orders o
      JOIN users u ON o.vendor_id = u.id
      WHERE o.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY o.order_date DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      orders: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============================================================
// 25. GET ORDER BY ID (Client)
// ============================================================
router.get('/orders/:orderId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const orderId = req.params.orderId;

    const result = await db.query(`
      SELECT 
        o.*,
        u.fullname as vendor_name,
        u.business_name,
        u.phone as vendor_phone,
        u.email as vendor_email,
        vp.location as vendor_location
      FROM orders o
      JOIN users u ON o.vendor_id = u.id
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE o.id = $1 AND o.user_id = $2
    `, [orderId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      order: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching order:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;