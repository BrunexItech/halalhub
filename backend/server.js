require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS properly
app.use(cors({
  origin: ['http://38.242.200.152:9999', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve static files from uploads directory with proper CORS headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  }
}));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/mpesa', require('./src/routes/mpesa'));
app.use('/api/kyc', require('./src/routes/kyc'));
app.use('/api/vendor', require('./src/routes/vendor'));
app.use('/api/imam', require('./src/routes/imam'));
app.use('/api/client', require('./src/routes/client'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/p2p', require('./src/routes/p2p'));
app.use('/api/takaful', require('./src/routes/takaful'));
app.use('/api/pension', require('./src/routes/pension'));
app.use('/api/mosque', require('./src/routes/mosque'));
app.use('/api/wills', require('./src/routes/wills'));
app.use('/api/kadhis', require('./src/routes/kadhis'));
app.use('/api/bookings', require('./src/routes/bookings'));

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
    
    // ============================================================
    // 1. USERS TABLE
    // ============================================================
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
        ward TEXT,
        business_name TEXT,
        kra_pin TEXT,
        business_reg_no TEXT,
        halal_declared BOOLEAN DEFAULT FALSE,
        terms_accepted BOOLEAN DEFAULT FALSE,
        vendor_status TEXT DEFAULT 'pending',
        vendor_approved_at TIMESTAMP,
        imam_status TEXT DEFAULT 'pending',
        imam_approved_at TIMESTAMP,
        profile_image TEXT,
        bio TEXT,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 2. VENDOR PROFILES TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        county TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        logo_url TEXT,
        cover_image TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        total_revenue INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 3. VENDOR DOCUMENTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_documents (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_certificate TEXT,
        halal_certificate TEXT,
        kra_certificate TEXT,
        id_front TEXT,
        id_back TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP
      )
    `);

    // ============================================================
    // 4. PRODUCTS TABLE (Ecommerce)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER,
        stock INTEGER DEFAULT 0,
        unit TEXT DEFAULT 'piece',
        images TEXT[],
        tags TEXT[],
        is_halal BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_sold INTEGER DEFAULT 0,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 5. LISTINGS TABLE (HalalStay)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        location TEXT NOT NULL,
        county TEXT,
        price_per_night INTEGER NOT NULL,
        bedrooms INTEGER DEFAULT 1,
        bathrooms INTEGER DEFAULT 1,
        max_guests INTEGER DEFAULT 2,
        amenities TEXT[],
        images TEXT[],
        is_halal BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_bookings INTEGER DEFAULT 0,
        total_rooms INTEGER DEFAULT 1,
        available_rooms INTEGER DEFAULT 1,
        min_stay INTEGER DEFAULT 1,
        max_advance_days INTEGER DEFAULT 90,
        blocked_dates TEXT[] DEFAULT '{}',
        max_guests_per_room INTEGER DEFAULT 2,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 6. LISTING AVAILABILITY TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS listing_availability (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        price_modifier INTEGER DEFAULT 0,
        UNIQUE(listing_id, date)
      )
    `);

    // ============================================================
    // 7. HALALSTAY BOOKINGS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS halalstay_bookings (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INTEGER DEFAULT 1,
        total_price INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'pending',
        payment_reference TEXT,
        special_requests TEXT,
        booking_date TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 8. ORDERS TABLE (Ecommerce)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        items JSONB NOT NULL,
        subtotal INTEGER NOT NULL,
        delivery_fee INTEGER DEFAULT 0,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'pending',
        payment_reference TEXT,
        delivery_address TEXT,
        delivery_type TEXT DEFAULT 'delivery',
        special_instructions TEXT,
        order_date TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 9. IMAMS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS imams (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT DEFAULT 'Imam',
        sub_role TEXT DEFAULT 'imam',
        mosque_name TEXT NOT NULL,
        mosque_location TEXT NOT NULL,
        mosque_county TEXT,
        qualifications TEXT[],
        years_of_service INTEGER DEFAULT 0,
        bio TEXT,
        profile_image TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        verified_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 10. PENSION CONTRIBUTIONS (Imam)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS pension_contributions (
        id TEXT PRIMARY KEY,
        imam_id TEXT NOT NULL REFERENCES imams(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        payment_method TEXT DEFAULT 'mpesa',
        payment_reference TEXT,
        status TEXT DEFAULT 'pending',
        contribution_date TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 11. PENSION BALANCE (Imam)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS pension_balances (
        imam_id TEXT PRIMARY KEY REFERENCES imams(id) ON DELETE CASCADE,
        total_contributions INTEGER DEFAULT 0,
        total_supporters INTEGER DEFAULT 0,
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 12. RESTAURANT MENU ITEMS
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        image TEXT,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 13. REVIEWS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        images TEXT[],
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 14. NOTIFICATIONS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        link TEXT,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 15. SUPPORTERS (Imam Supporters)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS supporters (
        id TEXT PRIMARY KEY,
        imam_id TEXT NOT NULL REFERENCES imams(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER DEFAULT 0,
        frequency TEXT DEFAULT 'once',
        status TEXT DEFAULT 'active',
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW(),
        UNIQUE(imam_id, user_id)
      )
    `);

    // ============================================================
    // 16. MOSQUE TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS mosques (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        county TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        imam_id TEXT REFERENCES imams(id) ON DELETE SET NULL,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 17. CART TABLE (Ecommerce)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `);

    // ============================================================
    // 18. P2P TRANSACTIONS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS p2p_transactions (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        note TEXT,
        reference TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 19. TAKAFUL PLANS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS takaful_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        coverage TEXT,
        monthly_cost INTEGER NOT NULL,
        annual_cost INTEGER NOT NULL,
        max_coverage INTEGER NOT NULL,
        benefits TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 20. TAKAFUL POLICIES TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS takaful_policies (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL REFERENCES takaful_plans(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active',
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        monthly_contribution INTEGER NOT NULL,
        total_coverage INTEGER NOT NULL,
        members INTEGER DEFAULT 1,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 21. TAKAFUL FAMILY MEMBERS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS takaful_family_members (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL REFERENCES takaful_policies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        relation TEXT NOT NULL,
        age INTEGER NOT NULL,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 22. TAKAFUL CLAIMS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS takaful_claims (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL REFERENCES takaful_policies(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP,
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 23. TAKAFUL CONTRIBUTIONS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS takaful_contributions (
        id TEXT PRIMARY KEY,
        policy_id TEXT NOT NULL REFERENCES takaful_policies(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'paid',
        payment_reference TEXT,
        payment_method TEXT DEFAULT 'wallet',
        contribution_date DATE DEFAULT NOW(),
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 24. TAKAFUL POOL STATS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS takaful_pool_stats (
        id TEXT PRIMARY KEY,
        total_members INTEGER DEFAULT 0,
        pool_balance INTEGER DEFAULT 0,
        claims_paid DECIMAL(5,2) DEFAULT 0,
        surplus INTEGER DEFAULT 0,
        total_claims INTEGER DEFAULT 0,
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 25. WILLS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS wills (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        id_number TEXT,
        executor_name TEXT NOT NULL,
        executor_phone TEXT,
        executor_email TEXT,
        assets TEXT,
        bequests JSONB DEFAULT '[]',
        heirs JSONB DEFAULT '[]',
        witnesses JSONB DEFAULT '[]',
        special_instructions TEXT,
        status TEXT DEFAULT 'draft',
        version TEXT DEFAULT 'v1',
        reference TEXT UNIQUE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 26. KADHIS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS kadhis (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'kadhi',
        county TEXT NOT NULL,
        expertise TEXT[],
        fee INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        experience TEXT,
        bio TEXT,
        languages TEXT[],
        verified BOOLEAN DEFAULT FALSE,
        verification_date DATE,
        institution TEXT,
        consultation_types TEXT[],
        available BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 27. CONSULTATION BOOKINGS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS consultation_bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kadhi_id TEXT NOT NULL REFERENCES kadhis(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        booking_time TEXT NOT NULL,
        type TEXT DEFAULT 'video',
        topic TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        room_name TEXT,
        user_name TEXT,
        user_email TEXT,
        accepted_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_vendor_status ON users(vendor_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_imam_status ON users(imam_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_listings_vendor_id ON listings(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_halalstay_bookings_user_id ON halalstay_bookings(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_halalstay_bookings_vendor_id ON halalstay_bookings(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_halalstay_bookings_status ON halalstay_bookings(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_listing_availability_date ON listing_availability(date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_p2p_sender_id ON p2p_transactions(sender_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_p2p_recipient_id ON p2p_transactions(recipient_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_p2p_status ON p2p_transactions(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_takaful_policies_user_id ON takaful_policies(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_takaful_policies_status ON takaful_policies(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_takaful_claims_policy_id ON takaful_claims(policy_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_takaful_claims_status ON takaful_claims(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_takaful_family_members_policy_id ON takaful_family_members(policy_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_imams_user_id ON imams(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_imams_sub_role ON imams(sub_role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_imams_mosque_name ON imams(mosque_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_supporters_imam_id ON supporters(imam_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_supporters_user_id ON supporters(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pension_contributions_imam_id ON pension_contributions(imam_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pension_contributions_user_id ON pension_contributions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_mosques_imam_id ON mosques(imam_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_mosques_county ON mosques(county)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wills_user_id ON wills(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wills_status ON wills(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_wills_reference ON wills(reference)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kadhis_user_id ON kadhis(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kadhis_type ON kadhis(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kadhis_county ON kadhis(county)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id ON consultation_bookings(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consultation_bookings_kadhi_id ON consultation_bookings(kadhi_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consultation_bookings_room_name ON consultation_bookings(room_name)`);

    console.log('All database tables ready');
    await client.end();
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDB();

app.listen(PORT, () => {
  console.log(`HalalHub API running on port ${PORT}`);
});