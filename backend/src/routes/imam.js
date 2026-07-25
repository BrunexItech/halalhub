const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
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
// All imam routes require authentication and imam role
// ============================================================
router.use(authenticate);
router.use(authorize('imam', 'admin'));

// ============================================================
// 1. GET IMAM DASHBOARD STATS
// ============================================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const stats = await db.query(`
      SELECT 
        i.id as imam_id,
        i.is_verified,
        i.status,
        (SELECT COALESCE(SUM(total_contributions), 0) FROM pension_balances WHERE imam_id = i.id) as total_pension,
        (SELECT COUNT(*) FROM supporters WHERE imam_id = i.id AND status = 'active') as total_supporters,
        (SELECT COUNT(*) FROM pension_contributions WHERE imam_id = i.id) as total_contributions,
        (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
      FROM imams i
      WHERE i.user_id = $1
    `, [userId]);

    if (stats.rows.length === 0) {
      return res.status(404).json({ error: 'Imam profile not found' });
    }

    res.json({ success: true, stats: stats.rows[0] });

  } catch (err) {
    console.error('Error fetching imam stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch imam stats' });
  }
});

// ============================================================
// 2. GET IMAM PROFILE (Private - for the imam themselves)
// ============================================================
router.get('/profile', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        u.id, u.fullname, u.phone, u.email, u.profile_image, u.bio,
        i.id as imam_id, i.title, i.mosque_name, i.mosque_location, i.mosque_county,
        i.qualifications, i.years_of_service, i.is_verified, i.status,
        pb.total_contributions, pb.total_supporters
      FROM users u
      JOIN imams i ON u.id = i.user_id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imam profile not found' });
    }

    res.json({ success: true, imam: result.rows[0] });

  } catch (err) {
    console.error('Error fetching imam profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch imam profile' });
  }
});

// ============================================================
// 3. CREATE OR UPDATE IMAM PROFILE
// ============================================================
router.post('/profile', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const {
      title,
      mosque_name,
      mosque_location,
      mosque_county,
      qualifications,
      years_of_service,
      bio,
      profile_image
    } = req.body;

    if (!mosque_name || !mosque_location) {
      return res.status(400).json({ error: 'Mosque name and location are required' });
    }

    // Check if imam profile exists
    const existing = await db.query(
      'SELECT id FROM imams WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await db.query(`
        UPDATE imams SET
          title = COALESCE($1, title),
          mosque_name = COALESCE($2, mosque_name),
          mosque_location = COALESCE($3, mosque_location),
          mosque_county = COALESCE($4, mosque_county),
          qualifications = COALESCE($5, qualifications),
          years_of_service = COALESCE($6, years_of_service),
          bio = COALESCE($7, bio),
          updatedat = NOW()
        WHERE user_id = $8
      `, [title, mosque_name, mosque_location, mosque_county, qualifications || [], years_of_service || 0, bio, userId]);

      // Update user table
      if (bio) {
        await db.query(
          'UPDATE users SET bio = $1, profile_image = COALESCE($2, profile_image) WHERE id = $3',
          [bio, profile_image, userId]
        );
      }

      res.json({ success: true, message: 'Imam profile updated successfully' });

    } else {
      // Create new imam profile
      const id = uuidv4();
      await db.query(`
        INSERT INTO imams (
          id, user_id, title, mosque_name, mosque_location, mosque_county,
          qualifications, years_of_service, bio, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [id, userId, title || 'Imam', mosque_name, mosque_location, mosque_county, qualifications || [], years_of_service || 0, bio]);

      // Create pension balance entry
      await db.query(`
        INSERT INTO pension_balances (imam_id, total_contributions, total_supporters)
        VALUES ($1, 0, 0)
      `, [id]);

      // Update user table
      await db.query(
        'UPDATE users SET bio = $1, profile_image = COALESCE($2, profile_image), imam_status = $3 WHERE id = $4',
        [bio, profile_image, 'pending', userId]
      );

      res.json({ success: true, message: 'Imam profile created successfully' });
    }

  } catch (err) {
    console.error('Error saving imam profile:', err.message);
    res.status(500).json({ error: 'Failed to save imam profile' });
  }
});

// ============================================================
// 4. GET PENSION BALANCE
// ============================================================
router.get('/pension', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        i.id as imam_id,
        pb.total_contributions,
        pb.total_supporters,
        (SELECT COUNT(*) FROM pension_contributions WHERE imam_id = i.id) as total_transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM pension_contributions WHERE imam_id = i.id AND status = 'completed') as total_amount
      FROM imams i
      JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE i.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pension data not found' });
    }

    res.json({ success: true, pension: result.rows[0] });

  } catch (err) {
    console.error('Error fetching pension:', err.message);
    res.status(500).json({ error: 'Failed to fetch pension' });
  }
});

// ============================================================
// 5. GET PENSION CONTRIBUTION HISTORY
// ============================================================
router.get('/pension/history', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT 
        pc.*,
        u.fullname as supporter_name,
        u.phone as supporter_phone
      FROM pension_contributions pc
      JOIN imams i ON pc.imam_id = i.id
      LEFT JOIN users u ON pc.user_id = u.id
      WHERE i.user_id = $1
      ORDER BY pc.contribution_date DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({ success: true, contributions: result.rows });

  } catch (err) {
    console.error('Error fetching contribution history:', err.message);
    res.status(500).json({ error: 'Failed to fetch contribution history' });
  }
});

// ============================================================
// 6. GET SUPPORTERS LIST
// ============================================================
router.get('/supporters', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        s.*,
        u.fullname as supporter_name,
        u.phone as supporter_phone,
        u.email as supporter_email
      FROM supporters s
      JOIN imams i ON s.imam_id = i.id
      JOIN users u ON s.user_id = u.id
      WHERE i.user_id = $1 AND s.status = 'active'
      ORDER BY s.createdat DESC
    `, [userId]);

    res.json({ success: true, supporters: result.rows });

  } catch (err) {
    console.error('Error fetching supporters:', err.message);
    res.status(500).json({ error: 'Failed to fetch supporters' });
  }
});

// ============================================================
// 7. ADD SUPPORTER (Client adds an imam to support)
// ============================================================
router.post('/supporters/:imamId', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const imamId = req.params.imamId;
    const { amount, frequency } = req.body;

    // Verify user is not an imam or vendor
    const userCheck = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows[0]?.role === 'imam' || userCheck.rows[0]?.role === 'vendor') {
      return res.status(403).json({ error: 'Only clients can support imams' });
    }

    // Check if already supporting
    const existing = await db.query(
      'SELECT id FROM supporters WHERE imam_id = $1 AND user_id = $2',
      [imamId, userId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await db.query(
        'UPDATE supporters SET amount = $1, frequency = $2, updatedat = NOW() WHERE id = $3',
        [amount || 0, frequency || 'once', existing.rows[0].id]
      );
    } else {
      // Create new
      const id = uuidv4();
      await db.query(`
        INSERT INTO supporters (id, imam_id, user_id, amount, frequency, createdat, updatedat)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [id, imamId, userId, amount || 0, frequency || 'once']);

      // Update pension balance
      await db.query(`
        UPDATE pension_balances 
        SET total_supporters = total_supporters + 1,
            updatedat = NOW()
        WHERE imam_id = $1
      `, [imamId]);
    }

    res.json({ success: true, message: 'Supporter added successfully' });

  } catch (err) {
    console.error('Error adding supporter:', err.message);
    res.status(500).json({ error: 'Failed to add supporter' });
  }
});

// ============================================================
// 8. RECORD PENSION CONTRIBUTION
// ============================================================
router.post('/pension/contribute', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { imam_id, amount, payment_method, payment_reference } = req.body;

    if (!imam_id || !amount || amount < 100) {
      return res.status(400).json({ error: 'Valid imam ID and amount (min 100) required' });
    }

    // Verify imam exists and is approved
    const imamCheck = await db.query(`
      SELECT i.id FROM imams i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1 AND u.imam_status = 'approved'
    `, [imam_id]);

    if (imamCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Approved imam not found' });
    }

    // Record contribution
    const id = uuidv4();
    await db.query(`
      INSERT INTO pension_contributions (
        id, imam_id, user_id, amount, payment_method, payment_reference, status, contribution_date
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
    `, [id, imam_id, userId, amount, payment_method || 'mpesa', payment_reference || null]);

    // Update pension balance
    await db.query(`
      UPDATE pension_balances 
      SET total_contributions = total_contributions + $1,
          updatedat = NOW()
      WHERE imam_id = $2
    `, [amount, imam_id]);

    // Create notification for imam
    const notificationId = uuidv4();
    await db.query(`
      INSERT INTO notifications (id, user_id, title, message, type, createdat)
      VALUES ($1, (SELECT user_id FROM imams WHERE id = $2), 'New Pension Contribution', 
              'A supporter has contributed ${amount} to your pension fund.', 'pension', NOW())
    `, [notificationId, imam_id]);

    res.json({ success: true, message: 'Contribution recorded successfully', contributionId: id });

  } catch (err) {
    console.error('Error recording contribution:', err.message);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

// ============================================================
// 9. GET NOTIFICATIONS
// ============================================================
router.get('/notifications', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const result = await db.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY createdat DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    // Mark as read
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true, notifications: result.rows });

  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ============================================================
// 10. GET UNREAD NOTIFICATION COUNT
// ============================================================
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;

    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ success: true, unreadCount: parseInt(result.rows[0].count) });

  } catch (err) {
    console.error('Error fetching unread count:', err.message);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ============================================================
// 11. GET PUBLIC IMAM PROFILE (For clients to view)
// ============================================================
router.get('/public/:id', async (req, res) => {
  try {
    const db = await getClient();
    const imamId = req.params.id;

    // Check if it's a user ID or imam ID
    const isUser = imamId.startsWith('user-') || imamId.startsWith('client-') || 
                   imamId.startsWith('vendor-') || imamId.startsWith('imam-') ||
                   imamId.startsWith('imam-');

    let query;
    let params;

    if (isUser) {
      query = `
        SELECT 
          u.id as user_id,
          u.fullname,
          u.phone,
          u.email,
          u.profile_image,
          u.bio,
          i.id as imam_id,
          i.title,
          i.mosque_name,
          i.mosque_location,
          i.mosque_county,
          i.qualifications,
          i.years_of_service,
          i.is_verified,
          pb.total_contributions,
          pb.total_supporters,
          m.id as mosque_id,
          m.name as mosque_name_full,
          m.location as mosque_location_full,
          m.county as mosque_county_full
        FROM users u
        JOIN imams i ON u.id = i.user_id
        LEFT JOIN pension_balances pb ON i.id = pb.imam_id
        LEFT JOIN mosques m ON m.imam_id = i.id
        WHERE u.id = $1 AND u.role = 'imam' AND u.imam_status = 'approved'
      `;
      params = [imamId];
    } else {
      query = `
        SELECT 
          u.id as user_id,
          u.fullname,
          u.phone,
          u.email,
          u.profile_image,
          u.bio,
          i.id as imam_id,
          i.title,
          i.mosque_name,
          i.mosque_location,
          i.mosque_county,
          i.qualifications,
          i.years_of_service,
          i.is_verified,
          pb.total_contributions,
          pb.total_supporters,
          m.id as mosque_id,
          m.name as mosque_name_full,
          m.location as mosque_location_full,
          m.county as mosque_county_full
        FROM imams i
        JOIN users u ON i.user_id = u.id
        LEFT JOIN pension_balances pb ON i.id = pb.imam_id
        LEFT JOIN mosques m ON m.imam_id = i.id
        WHERE i.id = $1 AND u.role = 'imam' AND u.imam_status = 'approved'
      `;
      params = [imamId];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imam not found' });
    }

    const imam = result.rows[0];

    // Get recent supporters
    const supportersResult = await db.query(`
      SELECT 
        u.fullname,
        u.profile_image,
        s.amount,
        s.createdat
      FROM supporters s
      JOIN users u ON s.user_id = u.id
      WHERE s.imam_id = $1 AND s.status = 'active'
      ORDER BY s.createdat DESC
      LIMIT 5
    `, [imam.imam_id]);

    res.json({
      success: true,
      imam: {
        id: imam.user_id,
        imam_id: imam.imam_id,
        name: imam.fullname,
        phone: imam.phone,
        email: imam.email,
        profile_image: imam.profile_image,
        bio: imam.bio,
        title: imam.title || 'Imam',
        mosque_name: imam.mosque_name || imam.mosque_name_full,
        mosque_location: imam.mosque_location || imam.mosque_location_full,
        mosque_county: imam.mosque_county || imam.mosque_county_full,
        mosque_id: imam.mosque_id,
        qualifications: imam.qualifications || [],
        years_of_service: parseInt(imam.years_of_service) || 0,
        verified: imam.is_verified || false,
        total_contributions: parseInt(imam.total_contributions) || 0,
        total_supporters: parseInt(imam.total_supporters) || 0,
        recent_supporters: supportersResult.rows.map(s => ({
          name: s.fullname,
          profile_image: s.profile_image,
          amount: parseInt(s.amount),
          date: s.createdat
        }))
      }
    });

  } catch (err) {
    console.error('Error fetching public imam profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch imam profile' });
  }
});

module.exports = router;