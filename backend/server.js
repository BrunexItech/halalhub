require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MASTER ACCOUNT CONFIGURATION (from .env)
// ============================================================

const PENSION_MASTER_ACCOUNT = process.env.PENSION_MASTER_ACCOUNT || 'PENSION-MASTER-001';
const TAKAFUL_POOL_ACCOUNT = process.env.TAKAFUL_POOL_ACCOUNT || 'TAKAFUL-POOL-001';
const ZAKAT_POOL_ACCOUNT = process.env.ZAKAT_POOL_ACCOUNT || 'ZAKAT-POOL-001';
const SADAQA_POOL_ACCOUNT = process.env.SADAQA_POOL_ACCOUNT || 'SADAQA-POOL-001';
const BANK_MASTER_ACCOUNT = process.env.BANK_MASTER_ACCOUNT || 'HALALHUB-MASTER-001';

// Configure CORS properly
app.use(cors({
  origin: ['http://38.242.200.152:9999', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173','http://localhost:9999'],
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
app.use('/api/hajj', require('./src/routes/hajj'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/p2p', require('./src/routes/p2p'));
app.use('/api/takaful', require('./src/routes/takaful'));
app.use('/api/pension', require('./src/routes/pension'));
app.use('/api/mosque', require('./src/routes/mosque'));
app.use('/api/wills', require('./src/routes/wills'));
app.use('/api/kadhis', require('./src/routes/kadhis'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/livekit', require('./src/routes/livekit'));
app.use('/api/utilities', require('./src/routes/utilities'));
app.use('/api/mosque-finder', require('./src/routes/mosque-finder'));
app.use('/api/zakat', require('./src/routes/zakat'));
app.use('/api/sadaqa', require('./src/routes/sadaqa'));
app.use('/api/hearse', require('./src/routes/hearse'));
app.use('/api/bank', require('./src/routes/bank-sandbox'));

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
        vendor_type TEXT DEFAULT 'halalmarket',
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
    // 4. PRODUCTS TABLE (with Butchery fields)
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
    // 4a. ADD BUTCHERY COLUMNS TO PRODUCTS (if they don't exist)
    // ============================================================
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='meat_type') THEN
          ALTER TABLE products ADD COLUMN meat_type TEXT DEFAULT 'beef';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='cut_type') THEN
          ALTER TABLE products ADD COLUMN cut_type TEXT DEFAULT 'whole';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price_per_kg') THEN
          ALTER TABLE products ADD COLUMN price_per_kg INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_kg') THEN
          ALTER TABLE products ADD COLUMN stock_kg DECIMAL(10,2) DEFAULT 0;
        END IF;
      END $$;
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
    // 10. PENSION CONTRIBUTIONS (Imam) - FIXED: Added updatedat
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
        contribution_date TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
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
    // 28. ZAKAT RECIPIENTS TABLE - FIXED: Added user_id & updatedat
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS zakat_recipients (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        location TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        bank_name TEXT,
        bank_account TEXT,
        mpesa_number TEXT,
        verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        total_received INTEGER DEFAULT 0,
        donor_count INTEGER DEFAULT 0,
        verified_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 29. ZAKAT PAYMENTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS zakat_payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id TEXT NOT NULL REFERENCES zakat_recipients(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reference TEXT UNIQUE NOT NULL,
        category TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        paid_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 30. SADAQA CAMPAIGNS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS sadaqa_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        organization TEXT NOT NULL,
        target INTEGER NOT NULL,
        raised INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        location TEXT,
        image_url TEXT,
        donor_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        featured BOOLEAN DEFAULT FALSE,
        end_date DATE,
        verified BOOLEAN DEFAULT TRUE,
        updates JSONB DEFAULT '[]',
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 31. SADAQA PAYMENTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS sadaqa_payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        campaign_id TEXT NOT NULL REFERENCES sadaqa_campaigns(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reference TEXT UNIQUE NOT NULL,
        dedication TEXT,
        is_anonymous BOOLEAN DEFAULT FALSE,
        donor_name TEXT,
        status TEXT DEFAULT 'pending',
        paid_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 32. COMMUNITY POOL TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS community_pool (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        source TEXT NOT NULL,
        reference TEXT NOT NULL,
        source_id TEXT,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 33. POOL DISBURSEMENTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS pool_disbursements (
        id TEXT PRIMARY KEY,
        recipient_id TEXT NOT NULL REFERENCES zakat_recipients(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        reference TEXT UNIQUE NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        disbursed_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 34. HEARSE PROVIDERS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS hearse_providers (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
        license_number TEXT,
        service_area TEXT,
        vehicle_type TEXT,
        vehicle_registration TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_status TEXT DEFAULT 'pending',
        hourly_rate INTEGER DEFAULT 0,
        distance_rate INTEGER DEFAULT 0,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 35. HEARSE REQUESTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS hearse_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL,
        pickup_location TEXT NOT NULL,
        destination_location TEXT,
        mosque_location TEXT,
        cemetery_location TEXT,
        shroud_type TEXT,
        shroud_quantity INTEGER DEFAULT 1,
        contact_person TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        scheduled_date DATE,
        scheduled_time TEXT,
        urgency TEXT DEFAULT 'standard',
        special_requests TEXT,
        status TEXT DEFAULT 'pending',
        reference TEXT UNIQUE NOT NULL,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 36. HEARSE REQUEST ASSIGNMENTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS hearse_request_assignments (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES hearse_requests(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL REFERENCES hearse_providers(id) ON DELETE CASCADE,
        assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'assigned',
        notes TEXT,
        assigned_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 37. HEARSE PROVIDER SERVICES TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS hearse_provider_services (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES hearse_providers(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL,
        price INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW(),
        UNIQUE(provider_id, service_type)
      )
    `);

    // ============================================================
    // 38. HAJJ PACKAGES TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS hajj_packages (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('hajj', 'umrah')),
        description TEXT,
        duration_days INTEGER NOT NULL DEFAULT 14,
        price INTEGER NOT NULL,
        includes TEXT[] DEFAULT '{}',
        excludes TEXT[] DEFAULT '{}',
        images TEXT[] DEFAULT '{}',
        available_slots INTEGER DEFAULT 50,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        source TEXT DEFAULT 'halalhub',
        external_id TEXT,
        last_sync_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 39. HAJJ BOOKINGS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS hajj_bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        package_id TEXT NOT NULL REFERENCES hajj_packages(id) ON DELETE CASCADE,
        pilgrims INTEGER NOT NULL DEFAULT 1,
        pilgrim_names TEXT[] DEFAULT '{}',
        passport_numbers TEXT[] DEFAULT '{}',
        contact_phone TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        special_requests TEXT,
        total_price INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'pending',
        payment_reference TEXT,
        external_reference TEXT,
        refund_reference TEXT,
        booking_date TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 40. VIRTUAL ACCOUNTS TABLE (BANK)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS virtual_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_number TEXT UNIQUE NOT NULL,
        currency TEXT DEFAULT 'KES',
        balance INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 41. BANK TRANSACTIONS TABLE (BANK)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_transactions (
        id TEXT PRIMARY KEY,
        reference TEXT UNIQUE NOT NULL,
        from_account TEXT,
        to_account TEXT,
        amount INTEGER NOT NULL,
        fee INTEGER DEFAULT 0,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        description TEXT,
        external_reference TEXT,
        completed_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 42. BANK WEBHOOKS TABLE (BANK)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_webhooks (
        id TEXT PRIMARY KEY,
        transaction_id TEXT REFERENCES bank_transactions(id) ON DELETE CASCADE,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 43. UTILITY PAYMENTS TABLE
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS utility_payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL,
        account_number TEXT NOT NULL,
        amount INTEGER NOT NULL,
        transaction_ref TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'wallet',
        receipt_number TEXT,
        paid_at TIMESTAMP,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 44. SAVED SERVICES TABLE (Utilities)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_services (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        account_number TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // 45. TRANSACTIONS TABLE - FIXED: Added missing columns
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        reference TEXT,
        description TEXT,
        checkout_request_id TEXT,
        phone TEXT,
        createdat TIMESTAMP DEFAULT NOW(),
        updatedat TIMESTAMP DEFAULT NOW()
      )
    `);

    // ============================================================
    // UNIQUE CONSTRAINT FOR DUPLICATE BOOKINGS
    // ============================================================
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'unique_kadhi_booking_slot'
        ) THEN
          ALTER TABLE consultation_bookings 
          ADD CONSTRAINT unique_kadhi_booking_slot 
          UNIQUE (kadhi_id, booking_date, booking_time);
        END IF;
      END $$;
    `);

    // ============================================================
    // INDEXES FOR PERFORMANCE
    // ============================================================
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_vendor_status ON users(vendor_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_imam_status ON users(imam_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_meat_type ON products(meat_type)`);
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
    await client.query(`CREATE INDEX IF NOT EXISTS idx_zakat_payments_user_id ON zakat_payments(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_zakat_payments_recipient_id ON zakat_payments(recipient_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_zakat_payments_status ON zakat_payments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_zakat_recipients_category ON zakat_recipients(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_zakat_recipients_verified ON zakat_recipients(verified)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sadaqa_payments_user_id ON sadaqa_payments(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sadaqa_payments_campaign_id ON sadaqa_payments(campaign_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sadaqa_payments_status ON sadaqa_payments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sadaqa_campaigns_status ON sadaqa_campaigns(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sadaqa_campaigns_category ON sadaqa_campaigns(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_community_pool_type ON community_pool(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pool_disbursements_recipient_id ON pool_disbursements(recipient_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pool_disbursements_status ON pool_disbursements(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_providers_vendor_id ON hearse_providers(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_providers_is_verified ON hearse_providers(is_verified)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_requests_user_id ON hearse_requests(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_requests_status ON hearse_requests(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_requests_reference ON hearse_requests(reference)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_request_assignments_request_id ON hearse_request_assignments(request_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_request_assignments_provider_id ON hearse_request_assignments(provider_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_request_assignments_status ON hearse_request_assignments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_provider_services_provider_id ON hearse_provider_services(provider_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hearse_provider_services_service_type ON hearse_provider_services(service_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hajj_packages_vendor_id ON hajj_packages(vendor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hajj_packages_type ON hajj_packages(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hajj_packages_is_active ON hajj_packages(is_active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hajj_bookings_user_id ON hajj_bookings(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hajj_bookings_package_id ON hajj_bookings(package_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hajj_bookings_status ON hajj_bookings(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON virtual_accounts(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON virtual_accounts(account_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_transactions_from_account ON bank_transactions(from_account)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_transactions_to_account ON bank_transactions(to_account)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_transactions_reference ON bank_transactions(reference)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bank_webhooks_transaction_id ON bank_webhooks(transaction_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_utility_payments_user_id ON utility_payments(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_utility_payments_transaction_ref ON utility_payments(transaction_ref)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_utility_payments_status ON utility_payments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_saved_services_user_id ON saved_services(user_id)`);

    // ============================================================
    // CREATE SYSTEM USER (for master accounts)
    // ============================================================
    const systemUserExists = await client.query(
      'SELECT id FROM users WHERE id = $1',
      ['system']
    );

    if (systemUserExists.rows.length === 0) {
      await client.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, pinhash, role, isadmin, kycstatus, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        ['system', 'System Account', '0000000000', 'system@halalhub.com', 'SYSTEM000', 'system', 'system', false, 'verified']
      );
      console.log(' System user created for master accounts');
    } else {
      console.log('System user already exists');
    }

    // ============================================================
    // CREATE MASTER ACCOUNTS (System Accounts)
    // ============================================================
    const masterAccounts = [
      { accountNumber: PENSION_MASTER_ACCOUNT, name: 'Pension Master Account' },
      { accountNumber: TAKAFUL_POOL_ACCOUNT, name: 'Takaful Pool Account' },
      { accountNumber: ZAKAT_POOL_ACCOUNT, name: 'Zakat Pool Account' },
      { accountNumber: SADAQA_POOL_ACCOUNT, name: 'Sadaqa Pool Account' },
      { accountNumber: BANK_MASTER_ACCOUNT, name: 'HalalHub Master Account' }
    ];

    for (const master of masterAccounts) {
      const exists = await client.query(
        'SELECT id FROM virtual_accounts WHERE account_number = $1',
        [master.accountNumber]
      );
      
      if (exists.rows.length === 0) {
        const id = 'vact-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
        await client.query(
          `INSERT INTO virtual_accounts (
            id, user_id, account_number, currency, balance, is_active, createdat, updatedat
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [id, 'system', master.accountNumber, 'KES', 0, true]
        );
        console.log(`Master account created: ${master.accountNumber} (${master.name})`);
      } else {
        console.log(`Master account exists: ${master.accountNumber} (${master.name})`);
      }
    }

    // ============================================================
    // ENSURE TAKAFUL POOL STATS EXISTS
    // ============================================================
    const poolStatsExists = await client.query(
      'SELECT id FROM takaful_pool_stats LIMIT 1'
    );

    if (poolStatsExists.rows.length === 0) {
      await client.query(`
        INSERT INTO takaful_pool_stats (
          id, total_members, pool_balance, claims_paid, surplus, total_claims, updatedat
        ) VALUES ('pool-stats-1', 0, 0, 0, 0, 0, NOW())
      `);
      console.log('Takaful pool stats initialized');
    }

    // ============================================================
    // CREATE DEFAULT ADMIN USER (if not exists)
    // ============================================================
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'halalhub@gmail.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';

    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1 AND isadmin = true',
      [adminEmail]
    );

    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const adminHash = await bcrypt.hash(adminPassword, 12);
      const adminId = 'admin-' + Date.now();
      
      await client.query(
        `INSERT INTO users (
          id, fullname, phone, email, nationalid, pinhash, role, isadmin, kycstatus, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [adminId, 'System Administrator', '+254700000000', adminEmail, 'ADMIN001', adminHash, 'admin', true, 'verified']
      );
      console.log(`Admin user created: ${adminEmail} (Password: ${adminPassword})`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    console.log('All database tables ready');
    console.log(' All master accounts verified/created:');
    console.log(`   - ${PENSION_MASTER_ACCOUNT} (Pension)`);
    console.log(`   - ${TAKAFUL_POOL_ACCOUNT} (Takaful)`);
    console.log(`   - ${ZAKAT_POOL_ACCOUNT} (Zakat)`);
    console.log(`   - ${SADAQA_POOL_ACCOUNT} (Sadaqa)`);
    console.log(`   - ${BANK_MASTER_ACCOUNT} (Master)`);
    
    await client.end();
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDB();

app.listen(PORT, () => {
  console.log(`HalalHub API running on port ${PORT}`);
});