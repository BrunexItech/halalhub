const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate } = require('../middleware/auth');

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
// 8. CREATE BOOKING (Client) - UPDATED with max_guests_per_room validation
// ============================================================
router.post('/bookings', async (req, res) => {
  try {
    const db = await getClient();
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

    // Validate guests per room
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

    // Check if dates are blocked by vendor
    const blockedDatesCheck = await db.query(`
      SELECT date FROM listing_availability 
      WHERE listing_id = $1 AND date BETWEEN $2 AND $3 AND is_available = false
    `, [listing_id, check_in, check_out]);

    if (blockedDatesCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Selected dates are not available' });
    }

    // Check if availability records exist for this listing
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

    await db.query('BEGIN');

    try {
      await db.query(`
        INSERT INTO bookings (
          id, listing_id, user_id, vendor_id, check_in, check_out,
          guests, total_price, status, special_requests, booking_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW())
      `, [bookingId, listing_id, userId, listingData.vendor_id, check_in, check_out, guests, totalPrice, special_requests || null]);

      await db.query(`
        UPDATE listings 
        SET available_rooms = available_rooms - $1,
            total_bookings = total_bookings + 1,
            updatedat = NOW()
        WHERE id = $2
      `, [roomsToBook, listing_id]);

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Booking created successfully',
        bookingId: bookingId,
        booking_id: bookingId,
        totalPrice: totalPrice,
        total_price: totalPrice,
        nights: nights,
        rooms_booked: roomsToBook,
        rooms_left: listingData.available_rooms - roomsToBook
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ============================================================
// 9. GET USER BOOKINGS
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
// 10. CANCEL BOOKING - REMOVED (Vendor only now)
// ============================================================

// ============================================================
// 11. GET ALL IMAMS (Public)
// ============================================================
router.get('/imams', async (req, res) => {
  try {
    const db = await getClient();
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT 
        u.id, u.fullname, u.profile_image, u.bio,
        i.id as imam_id, i.title, i.mosque_name, i.mosque_location, i.mosque_county,
        i.qualifications, i.years_of_service, i.is_verified,
        pb.total_contributions, pb.total_supporters
      FROM users u
      JOIN imams i ON u.id = i.user_id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE u.role = 'imam' AND u.imam_status = 'approved' AND i.is_verified = true
      ORDER BY pb.total_supporters DESC
      LIMIT ${parseInt(limit)}
    `);

    res.json({ success: true, imams: result.rows });

  } catch (err) {
    console.error('Error fetching imams:', err.message);
    res.status(500).json({ error: 'Failed to fetch imams' });
  }
});

// ============================================================
// 12. GET IMAM BY ID (Public)
// ============================================================
router.get('/imams/:imamId', async (req, res) => {
  try {
    const db = await getClient();
    const imamId = req.params.imamId;

    const result = await db.query(`
      SELECT 
        u.id, u.fullname, u.profile_image, u.bio, u.phone, u.email,
        i.id as imam_id, i.title, i.mosque_name, i.mosque_location, i.mosque_county,
        i.qualifications, i.years_of_service, i.is_verified,
        pb.total_contributions, pb.total_supporters
      FROM users u
      JOIN imams i ON u.id = i.user_id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE u.id = $1 AND u.role = 'imam' AND u.imam_status = 'approved'
    `, [imamId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imam not found' });
    }

    res.json({ success: true, imam: result.rows[0] });

  } catch (err) {
    console.error('Error fetching imam:', err.message);
    res.status(500).json({ error: 'Failed to fetch imam' });
  }
});

// ============================================================
// 13. CREATE ORDER (Ecommerce) - FIXED
// ============================================================
router.post('/orders', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      vendor_id,
      items,
      subtotal,
      delivery_fee,
      delivery_address,
      delivery_type,
      special_instructions
    } = req.body;

    if (!vendor_id || !items || !subtotal) {
      return res.status(400).json({ error: 'Vendor ID, items, and subtotal are required' });
    }

    const totalAmount = subtotal + (delivery_fee || 0);
    const orderId = 'ord-' + Date.now();

    await db.query(`
      INSERT INTO orders (
        id, user_id, vendor_id, items, subtotal, delivery_fee, total_amount,
        delivery_address, delivery_type, special_instructions, status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
    `, [orderId, userId, vendor_id, JSON.stringify(items), subtotal, delivery_fee || 0, totalAmount, delivery_address || null, delivery_type || 'delivery', special_instructions || null]);

    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: orderId,
      totalAmount: totalAmount
    });

  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ============================================================
// 14. GET USER ORDERS
// ============================================================
router.get('/orders', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        o.*,
        u.fullname as vendor_name,
        u.business_name
      FROM orders o
      JOIN users u ON o.vendor_id = u.id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
    `, [userId]);

    res.json({ success: true, orders: result.rows });

  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============================================================
// 15. SUPPORT IMAM (Add to supporters)
// ============================================================
router.post('/support-imam', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { imam_id, amount, frequency } = req.body;

    if (!imam_id) {
      return res.status(400).json({ error: 'Imam ID is required' });
    }

    const userCheck = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows[0]?.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can support imams' });
    }

    const imamCheck = await db.query(`
      SELECT i.id FROM imams i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1 AND u.imam_status = 'approved'
    `, [imam_id]);

    if (imamCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Approved imam not found' });
    }

    const existing = await db.query(
      'SELECT id FROM supporters WHERE imam_id = $1 AND user_id = $2',
      [imam_id, userId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE supporters SET amount = $1, frequency = $2, updatedat = NOW() WHERE id = $3',
        [amount || 0, frequency || 'once', existing.rows[0].id]
      );
    } else {
      const supportId = 'supp-' + Date.now();
      await db.query(`
        INSERT INTO supporters (id, imam_id, user_id, amount, frequency, status, createdat, updatedat)
        VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
      `, [supportId, imam_id, userId, amount || 0, frequency || 'once']);

      await db.query(`
        UPDATE pension_balances 
        SET total_supporters = total_supporters + 1,
            updatedat = NOW()
        WHERE imam_id = $1
      `, [imam_id]);
    }

    res.json({ success: true, message: 'Support added successfully' });

  } catch (err) {
    console.error('Error supporting imam:', err.message);
    res.status(500).json({ error: 'Failed to support imam' });
  }
});

// ============================================================
// 16. GET SUPPORTED IMAMS (Client)
// ============================================================
router.get('/supported-imams', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        s.*,
        u.fullname as imam_name,
        u.profile_image,
        i.mosque_name,
        i.mosque_location
      FROM supporters s
      JOIN imams i ON s.imam_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.createdat DESC
    `, [userId]);

    res.json({ success: true, supported: result.rows });

  } catch (err) {
    console.error('Error fetching supported imams:', err.message);
    res.status(500).json({ error: 'Failed to fetch supported imams' });
  }
});

// ============================================================
// 17. GET MOSQUES (Public)
// ============================================================
router.get('/mosques', async (req, res) => {
  try {
    const db = await getClient();
    const { county, limit = 50 } = req.query;

    let query = `
      SELECT m.*, u.fullname as imam_name
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
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
// 18. GET RESTAURANT MENU ITEMS (Public)
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

module.exports = router;