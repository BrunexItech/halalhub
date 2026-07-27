const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vendor-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilter
});

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

// All vendor routes require authentication and vendor role
router.use(authenticate);
router.use(authorize('vendor', 'admin'));

// ============================================================
// IMAGE UPLOAD ENDPOINT
// ============================================================
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Image uploaded successfully'
    });

  } catch (err) {
    console.error('Image upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ============================================================
// 1. GET VENDOR DASHBOARD STATS
// ============================================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const vendorType = await db.query(`
      SELECT business_type FROM vendor_profiles WHERE user_id = $1
    `, [userId]);

    const businessType = vendorType.rows[0]?.business_type || '';

    let statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM products WHERE vendor_id = $1 AND is_active = true) as total_products,
        (SELECT COUNT(*) FROM orders WHERE vendor_id = $1 AND status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM bookings WHERE vendor_id = $1 AND status = 'pending') as pending_bookings,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE vendor_id = $1 AND status = 'completed') as total_revenue,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE target_id = $1 AND target_type = 'vendor') as rating,
        (SELECT COUNT(*) FROM reviews WHERE target_id = $1 AND target_type = 'vendor') as total_reviews,
        (SELECT COUNT(*) FROM listings WHERE vendor_id = $1 AND is_active = true) as total_listings,
        (SELECT COUNT(*) FROM menu_items WHERE vendor_id = $1 AND is_available = true) as total_menu_items,
    `;

    if (businessType === 'halalstay') {
      statsQuery += `
        (SELECT COUNT(*) FROM bookings WHERE vendor_id = $1) as total_orders,
        (SELECT COUNT(*) FROM bookings WHERE vendor_id = $1) as total_bookings,
        (SELECT COALESCE(SUM(total_rooms), 0) FROM listings WHERE vendor_id = $1 AND is_active = true) as total_rooms,
        (SELECT COALESCE(SUM(available_rooms), 0) FROM listings WHERE vendor_id = $1 AND is_active = true) as available_rooms
      `;
    } else if (businessType === 'restaurant' || businessType === 'halalmarket') {
      statsQuery += `
        (SELECT COUNT(*) FROM orders WHERE vendor_id = $1) as total_orders,
        (SELECT COUNT(*) FROM bookings WHERE vendor_id = $1) as total_bookings,
        0 as total_rooms,
        0 as available_rooms
      `;
    } else {
      statsQuery += `
        (SELECT COUNT(*) FROM orders WHERE vendor_id = $1) as total_orders,
        (SELECT COUNT(*) FROM bookings WHERE vendor_id = $1) as total_bookings,
        0 as total_rooms,
        0 as available_rooms
      `;
    }

    const stats = await db.query(statsQuery, [userId]);

    res.json({
      success: true,
      stats: {
        totalProducts: parseInt(stats.rows[0].total_products) || 0,
        totalOrders: parseInt(stats.rows[0].total_orders) || 0,
        totalBookings: parseInt(stats.rows[0].total_bookings) || 0,
        pendingOrders: parseInt(stats.rows[0].pending_orders) || 0,
        pendingBookings: parseInt(stats.rows[0].pending_bookings) || 0,
        totalRevenue: parseInt(stats.rows[0].total_revenue) || 0,
        rating: parseFloat(stats.rows[0].rating) || 0,
        totalReviews: parseInt(stats.rows[0].total_reviews) || 0,
        totalListings: parseInt(stats.rows[0].total_listings) || 0,
        totalMenuItems: parseInt(stats.rows[0].total_menu_items) || 0,
        totalRooms: parseInt(stats.rows[0].total_rooms) || 0,
        availableRooms: parseInt(stats.rows[0].available_rooms) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching vendor stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch vendor stats' });
  }
});

// ============================================================
// 2. GET VENDOR PROFILE
// ============================================================
router.get('/profile', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        u.id, u.fullname, u.phone, u.email, u.business_name, 
        u.kra_pin, u.business_reg_no, u.halal_declared, 
        u.vendor_status, u.kycstatus, u.region, u.sub_county, u.ward,
        u.profile_image, u.bio,
        vp.id as profile_id, vp.business_type, vp.description, 
        vp.location, vp.county, vp.website, vp.logo_url, vp.cover_image,
        vp.is_verified, vp.rating, vp.total_reviews, vp.total_orders, vp.total_revenue,
        vp.is_active as profile_active
      FROM users u
      LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ success: true, vendor: result.rows[0] });

  } catch (err) {
    console.error('Error fetching vendor profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch vendor profile' });
  }
});

// ============================================================
// 3. CREATE OR UPDATE VENDOR PROFILE
// ============================================================
router.post('/profile', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      business_type,
      description,
      location,
      county,
      website,
      logo_url,
      cover_image,
      business_name,
      is_active
    } = req.body;

    if (!business_type || !location) {
      return res.status(400).json({ error: 'Business type and location are required' });
    }

    const existing = await db.query(
      'SELECT id FROM vendor_profiles WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      await db.query(`
        UPDATE vendor_profiles 
        SET business_type = $1, description = $2, location = $3, 
            county = $4, website = $5, logo_url = $6, cover_image = $7,
            is_active = COALESCE($8, is_active),
            updatedat = NOW()
        WHERE user_id = $9
      `, [business_type, description, location, county, website, logo_url, cover_image, is_active !== false, userId]);

      if (business_name) {
        await db.query(
          'UPDATE users SET business_name = $1 WHERE id = $2',
          [business_name, userId]
        );
      }

      res.json({ success: true, message: 'Profile updated successfully' });

    } else {
      const id = uuidv4();
      await db.query(`
        INSERT INTO vendor_profiles (
          id, user_id, business_type, description, location, 
          county, website, logo_url, cover_image, is_active, createdat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [id, userId, business_type, description, location, county, website, logo_url, cover_image, is_active !== false]);

      if (business_name) {
        await db.query(
          'UPDATE users SET business_name = $1 WHERE id = $2',
          [business_name, userId]
        );
      }

      res.json({ success: true, message: 'Profile created successfully' });
    }

  } catch (err) {
    console.error('Error saving vendor profile:', err.message);
    res.status(500).json({ error: 'Failed to save vendor profile' });
  }
});

// ============================================================
// 4. TOGGLE VENDOR PROFILE ACTIVE STATUS
// ============================================================
router.put('/profile/toggle-status', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { is_active } = req.body;

    const result = await db.query(
      'UPDATE vendor_profiles SET is_active = $1, updatedat = NOW() WHERE user_id = $2 RETURNING is_active',
      [is_active, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      message: `Business ${is_active ? 'activated' : 'deactivated'} successfully`,
      is_active: result.rows[0].is_active
    });

  } catch (err) {
    console.error('Error toggling vendor status:', err.message);
    res.status(500).json({ error: 'Failed to toggle vendor status' });
  }
});

// ============================================================
// 5. GET VENDOR PRODUCTS
// ============================================================
router.get('/products', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 100 } = req.query;

    const result = await db.query(`
      SELECT * FROM products 
      WHERE vendor_id = $1 
      ORDER BY createdat DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({ success: true, products: result.rows });

  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ============================================================
// 6. CREATE PRODUCT
// ============================================================
router.post('/products', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      name,
      description,
      category,
      price,
      original_price,
      stock,
      unit,
      images,
      tags,
      is_halal,
      is_active
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const id = uuidv4();
    await db.query(`
      INSERT INTO products (
        id, vendor_id, name, description, category, price, 
        original_price, stock, unit, images, tags, 
        is_halal, is_active, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    `, [id, userId, name, description, category, price, original_price || null, stock || 0, unit || 'piece', images || [], tags || [], is_halal !== false, is_active !== false]);

    res.json({ success: true, message: 'Product created successfully', productId: id });

  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ============================================================
// 7. UPDATE PRODUCT
// ============================================================
router.put('/products/:productId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const productId = req.params.productId;
    const {
      name,
      description,
      category,
      price,
      original_price,
      stock,
      unit,
      images,
      tags,
      is_halal,
      is_active
    } = req.body;

    const check = await db.query(
      'SELECT id FROM products WHERE id = $1 AND vendor_id = $2',
      [productId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.query(`
      UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        price = COALESCE($4, price),
        original_price = COALESCE($5, original_price),
        stock = COALESCE($6, stock),
        unit = COALESCE($7, unit),
        images = COALESCE($8, images),
        tags = COALESCE($9, tags),
        is_halal = COALESCE($10, is_halal),
        is_active = COALESCE($11, is_active),
        updatedat = NOW()
      WHERE id = $12 AND vendor_id = $13
    `, [name, description, category, price, original_price, stock, unit, images, tags, is_halal, is_active, productId, userId]);

    res.json({ success: true, message: 'Product updated successfully' });

  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ============================================================
// 8. DELETE PRODUCT
// ============================================================
router.delete('/products/:productId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const productId = req.params.productId;

    const result = await db.query(
      'DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [productId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });

  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ============================================================
// 9. GET VENDOR ORDERS (FIXED - shows item names)
// ============================================================
router.get('/orders', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    const vendorType = await db.query(`
      SELECT business_type FROM vendor_profiles WHERE user_id = $1
    `, [userId]);

    const businessType = vendorType.rows[0]?.business_type || '';

    if (businessType === 'halalstay') {
      let query = `
        SELECT 
          b.id,
          b.listing_id as order_id,
          b.user_id,
          b.vendor_id,
          'booking' as order_type,
          b.total_price as total_amount,
          b.status,
          b.booking_date as order_date,
          b.check_in,
          b.check_out,
          b.guests,
          b.special_requests,
          u.fullname as customer_name,
          u.phone as customer_phone,
          l.title as items
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        JOIN users u ON b.user_id = u.id
        WHERE b.vendor_id = $1
      `;
      const params = [userId];

      if (status) {
        query += ' AND b.status = $2';
        params.push(status);
      }

      query += ` ORDER BY b.booking_date DESC LIMIT ${parseInt(limit)}`;

      const result = await db.query(query, params);

      return res.json({ success: true, orders: result.rows });
    }

    let query = `
      SELECT 
        o.id,
        o.user_id,
        o.vendor_id,
        'order' as order_type,
        o.total_amount,
        o.status,
        o.order_date,
        o.delivery_address,
        o.special_instructions,
        u.fullname as customer_name,
        u.phone as customer_phone,
        o.items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND o.status = $2';
      params.push(status);
    }

    query += ` ORDER BY o.order_date DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    // Format items to show item names
    const orders = result.rows.map(order => {
      let itemsDisplay = '';
      if (order.items) {
        const itemsArray = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        if (Array.isArray(itemsArray) && itemsArray.length > 0) {
          itemsDisplay = itemsArray.map(item => item.name).join(', ');
        } else {
          itemsDisplay = `${itemsArray?.length || 0} items`;
        }
      }
      return {
        ...order,
        items: itemsDisplay || `${order.items?.length || 0} items`
      };
    });

    res.json({ success: true, orders: orders });

  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ============================================================
// 10. UPDATE ORDER STATUS (Vendor only)
// ============================================================
router.put('/orders/:orderId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const orderId = req.params.orderId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const isBooking = orderId.startsWith('book-');

    if (isBooking) {
      const check = await db.query(
        'SELECT id, listing_id FROM bookings WHERE id = $1 AND vendor_id = $2',
        [orderId, userId]
      );

      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const oldStatus = await db.query(
        'SELECT status FROM bookings WHERE id = $1',
        [orderId]
      );

      await db.query('BEGIN');

      try {
        await db.query(
          'UPDATE bookings SET status = $1, updatedat = NOW() WHERE id = $2',
          [status, orderId]
        );

        if (status === 'cancelled' && oldStatus.rows[0].status !== 'cancelled') {
          await db.query(`
            UPDATE listings 
            SET available_rooms = available_rooms + 1,
                updatedat = NOW()
            WHERE id = $1
          `, [check.rows[0].listing_id]);
        }

        await db.query('COMMIT');

        return res.json({ success: true, message: 'Booking updated successfully' });
      } catch (err) {
        await db.query('ROLLBACK');
        throw err;
      }
    }

    const check = await db.query(
      'SELECT id FROM orders WHERE id = $1 AND vendor_id = $2',
      [orderId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await db.query(
      'UPDATE orders SET status = $1, updatedat = NOW() WHERE id = $2',
      [status, orderId]
    );

    res.json({ success: true, message: 'Order updated successfully' });

  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ============================================================
// 11. GET VENDOR BOOKINGS
// ============================================================
router.get('/bookings', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT b.*, l.title as listing_title, u.fullname as customer_name, u.phone as customer_phone
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON b.user_id = u.id
      WHERE b.vendor_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND b.status = $2';
      params.push(status);
    }

    query += ` ORDER BY b.booking_date DESC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({ success: true, bookings: result.rows });

  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ============================================================
// 12. UPDATE BOOKING STATUS (Vendor only)
// ============================================================
router.put('/bookings/:bookingId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const check = await db.query(
      'SELECT id, listing_id FROM bookings WHERE id = $1 AND vendor_id = $2',
      [bookingId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const oldStatus = await db.query(
      'SELECT status FROM bookings WHERE id = $1',
      [bookingId]
    );

    await db.query('BEGIN');

    try {
      await db.query(
        'UPDATE bookings SET status = $1, updatedat = NOW() WHERE id = $2',
        [status, bookingId]
      );

      if (status === 'cancelled' && oldStatus.rows[0].status !== 'cancelled') {
        await db.query(`
          UPDATE listings 
          SET available_rooms = available_rooms + 1,
              updatedat = NOW()
          WHERE id = $1
        `, [check.rows[0].listing_id]);
      }

      await db.query('COMMIT');

      res.json({ success: true, message: 'Booking updated successfully' });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error updating booking:', err.message);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ============================================================
// 13. GET VENDOR LISTINGS
// ============================================================
router.get('/listings', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT * FROM listings 
      WHERE vendor_id = $1 
      ORDER BY createdat DESC
    `, [userId]);

    res.json({ success: true, listings: result.rows });

  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ============================================================
// 14. CREATE LISTING (with max_guests_per_room)
// ============================================================
router.post('/listings', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      title,
      description,
      type,
      location,
      county,
      price_per_night,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      images,
      is_halal,
      is_active,
      total_rooms,
      min_stay,
      max_advance_days,
      max_guests_per_room
    } = req.body;

    if (!title || !location || !price_per_night) {
      return res.status(400).json({ error: 'Title, location, and price are required' });
    }

    const id = uuidv4();
    const rooms = total_rooms || 1;
    const minStay = min_stay || 1;
    const maxAdvance = max_advance_days || 90;
    const maxGuestsPerRoom = max_guests_per_room || 2;

    await db.query(`
      INSERT INTO listings (
        id, vendor_id, title, description, type, location, county,
        price_per_night, bedrooms, bathrooms, max_guests,
        amenities, images, is_halal, is_active,
        total_rooms, available_rooms, min_stay, max_advance_days,
        max_guests_per_room,
        createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
    `, [id, userId, title, description, type || 'house', location, county, price_per_night, bedrooms || 1, bathrooms || 1, max_guests || 2, amenities || [], images || [], is_halal !== false, is_active !== false, rooms, rooms, minStay, maxAdvance, maxGuestsPerRoom]);

    res.json({ success: true, message: 'Listing created successfully', listingId: id });

  } catch (err) {
    console.error('Error creating listing:', err.message);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// ============================================================
// 15. UPDATE LISTING (with max_guests_per_room)
// ============================================================
router.put('/listings/:listingId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const listingId = req.params.listingId;
    const {
      title,
      description,
      type,
      location,
      county,
      price_per_night,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      images,
      is_halal,
      is_active,
      total_rooms,
      min_stay,
      max_advance_days,
      max_guests_per_room
    } = req.body;

    const check = await db.query(
      'SELECT id FROM listings WHERE id = $1 AND vendor_id = $2',
      [listingId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await db.query(`
      UPDATE listings SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        location = COALESCE($4, location),
        county = COALESCE($5, county),
        price_per_night = COALESCE($6, price_per_night),
        bedrooms = COALESCE($7, bedrooms),
        bathrooms = COALESCE($8, bathrooms),
        max_guests = COALESCE($9, max_guests),
        amenities = COALESCE($10, amenities),
        images = COALESCE($11, images),
        is_halal = COALESCE($12, is_halal),
        is_active = COALESCE($13, is_active),
        total_rooms = COALESCE($14, total_rooms),
        min_stay = COALESCE($15, min_stay),
        max_advance_days = COALESCE($16, max_advance_days),
        max_guests_per_room = COALESCE($17, max_guests_per_room),
        updatedat = NOW()
      WHERE id = $18 AND vendor_id = $19
    `, [title, description, type, location, county, price_per_night, bedrooms, bathrooms, max_guests, amenities, images, is_halal, is_active, total_rooms, min_stay, max_advance_days, max_guests_per_room, listingId, userId]);

    res.json({ success: true, message: 'Listing updated successfully' });

  } catch (err) {
    console.error('Error updating listing:', err.message);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// ============================================================
// 16. DELETE LISTING
// ============================================================
router.delete('/listings/:listingId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const listingId = req.params.listingId;

    const result = await db.query(
      'DELETE FROM listings WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [listingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ success: true, message: 'Listing deleted successfully' });

  } catch (err) {
    console.error('Error deleting listing:', err.message);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// ============================================================
// 17. GET VENDOR EARNINGS
// ============================================================
router.get('/earnings', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const vendorType = await db.query(`
      SELECT business_type FROM vendor_profiles WHERE user_id = $1
    `, [userId]);

    const businessType = vendorType.rows[0]?.business_type || '';

    let earningsQuery = '';

    if (businessType === 'halalstay') {
      earningsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN total_price ELSE 0 END), 0) as pending_earnings,
          COALESCE(SUM(CASE WHEN status = 'completed' AND booking_date >= NOW() - INTERVAL '30 days' THEN total_price ELSE 0 END), 0) as monthly_earnings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
        FROM bookings
        WHERE vendor_id = $1
      `;
    } else {
      earningsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_earnings,
          COALESCE(SUM(CASE WHEN status = 'completed' AND order_date >= NOW() - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as monthly_earnings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
        FROM orders
        WHERE vendor_id = $1
      `;
    }

    const result = await db.query(earningsQuery, [userId]);

    res.json({ success: true, earnings: result.rows[0] });

  } catch (err) {
    console.error('Error fetching earnings:', err.message);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// ============================================================
// 18. GET VENDOR REVIEWS
// ============================================================
router.get('/reviews', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT r.*, u.fullname as reviewer_name, u.profile_image as reviewer_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.target_id = $1 AND r.target_type = 'vendor'
      ORDER BY r.createdat DESC
    `, [userId]);

    res.json({ success: true, reviews: result.rows });

  } catch (err) {
    console.error('Error fetching reviews:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ============================================================
// 19. GET VENDOR MENU ITEMS (Restaurants)
// ============================================================
router.get('/menu-items', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT * FROM menu_items 
      WHERE vendor_id = $1 
      ORDER BY createdat DESC
    `, [userId]);

    res.json({ success: true, menuItems: result.rows });

  } catch (err) {
    console.error('Error fetching menu items:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// ============================================================
// 20. CREATE MENU ITEM (Restaurants)
// ============================================================
router.post('/menu-items', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      name,
      description,
      category,
      price,
      is_available,
      image
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const id = uuidv4();
    await db.query(`
      INSERT INTO menu_items (
        id, vendor_id, name, description, category, price, is_available, image, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [id, userId, name, description, category, price, is_available !== false, image || null]);

    res.json({ success: true, message: 'Menu item created successfully', menuItemId: id });

  } catch (err) {
    console.error('Error creating menu item:', err.message);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// ============================================================
// 21. UPDATE MENU ITEM
// ============================================================
router.put('/menu-items/:menuItemId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const menuItemId = req.params.menuItemId;
    const {
      name,
      description,
      category,
      price,
      is_available,
      image
    } = req.body;

    const check = await db.query(
      'SELECT id FROM menu_items WHERE id = $1 AND vendor_id = $2',
      [menuItemId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await db.query(`
      UPDATE menu_items SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        price = COALESCE($4, price),
        is_available = COALESCE($5, is_available),
        image = COALESCE($6, image),
        updatedat = NOW()
      WHERE id = $7 AND vendor_id = $8
    `, [name, description, category, price, is_available, image, menuItemId, userId]);

    res.json({ success: true, message: 'Menu item updated successfully' });

  } catch (err) {
    console.error('Error updating menu item:', err.message);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// ============================================================
// 22. DELETE MENU ITEM
// ============================================================
router.delete('/menu-items/:menuItemId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const menuItemId = req.params.menuItemId;

    const result = await db.query(
      'DELETE FROM menu_items WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [menuItemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Menu item deleted successfully' });

  } catch (err) {
    console.error('Error deleting menu item:', err.message);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// ============================================================
// 23. VENDOR CANCEL BOOKING (Vendor only)
// ============================================================
router.put('/cancel-booking/:bookingId', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const { reason } = req.body;

    const check = await db.query(
      'SELECT id, listing_id, status FROM bookings WHERE id = $1 AND vendor_id = $2',
      [bookingId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (check.rows[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (check.rows[0].status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    await db.query('BEGIN');

    try {
      await db.query(
        `UPDATE bookings 
         SET status = 'cancelled', 
             special_requests = COALESCE(special_requests, '') || ' | Cancelled by vendor. Reason: ' || $1,
             updatedat = NOW()
         WHERE id = $2`,
        [reason || 'No reason provided', bookingId]
      );

      await db.query(`
        UPDATE listings 
        SET available_rooms = available_rooms + 1,
            updatedat = NOW()
        WHERE id = $1
      `, [check.rows[0].listing_id]);

      await db.query('COMMIT');

      res.json({ 
        success: true, 
        message: 'Booking cancelled successfully. Room availability restored.' 
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error cancelling booking:', err.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ============================================================
// 24. UPDATE ROOM INVENTORY (Vendor only)
// ============================================================
router.put('/listings/:listingId/inventory', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const listingId = req.params.listingId;
    const { total_rooms, available_rooms, min_stay, max_advance_days } = req.body;

    const check = await db.query(
      'SELECT id FROM listings WHERE id = $1 AND vendor_id = $2',
      [listingId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (total_rooms !== undefined) {
      updates.push(`total_rooms = $${paramIndex}`);
      params.push(total_rooms);
      paramIndex++;
    }

    if (available_rooms !== undefined) {
      updates.push(`available_rooms = $${paramIndex}`);
      params.push(available_rooms);
      paramIndex++;
    }

    if (min_stay !== undefined) {
      updates.push(`min_stay = $${paramIndex}`);
      params.push(min_stay);
      paramIndex++;
    }

    if (max_advance_days !== undefined) {
      updates.push(`max_advance_days = $${paramIndex}`);
      params.push(max_advance_days);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updatedat = NOW()`);
    params.push(listingId);
    params.push(userId);

    const query = `
      UPDATE listings 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND vendor_id = $${paramIndex + 1}
    `;

    await db.query(query, params);

    res.json({ 
      success: true, 
      message: 'Inventory updated successfully' 
    });

  } catch (err) {
    console.error('Error updating inventory:', err.message);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// ============================================================
// 25. BLOCK/UNBLOCK DATES (Vendor only)
// ============================================================
router.post('/listings/:listingId/block-dates', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const listingId = req.params.listingId;
    const { dates, is_blocked } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }

    const check = await db.query(
      'SELECT id FROM listings WHERE id = $1 AND vendor_id = $2',
      [listingId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    await db.query('BEGIN');

    try {
      for (const date of dates) {
        await db.query(`
          INSERT INTO listing_availability (id, listing_id, date, is_available)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (listing_id, date) 
          DO UPDATE SET is_available = $4
        `, [uuidv4(), listingId, date, is_blocked !== false]);
      }

      await db.query('COMMIT');

      res.json({ 
        success: true, 
        message: `${is_blocked ? 'Blocked' : 'Unblocked'} ${dates.length} date(s) successfully` 
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error blocking dates:', err.message);
    res.status(500).json({ error: 'Failed to block dates' });
  }
});

// ============================================================
// 26. GET BLOCKED DATES (Vendor only)
// ============================================================
router.get('/listings/:listingId/blocked-dates', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const listingId = req.params.listingId;
    const { start_date, end_date } = req.query;

    const check = await db.query(
      'SELECT id FROM listings WHERE id = $1 AND vendor_id = $2',
      [listingId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    let query = `
      SELECT date, is_available 
      FROM listing_availability 
      WHERE listing_id = $1
    `;
    const params = [listingId];
    let paramIndex = 2;

    if (start_date && end_date) {
      query += ` AND date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }

    query += ` ORDER BY date`;

    const result = await db.query(query, params);

    res.json({ 
      success: true, 
      blockedDates: result.rows.filter(row => !row.is_available),
      allDates: result.rows
    });

  } catch (err) {
    console.error('Error fetching blocked dates:', err.message);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

module.exports = router;