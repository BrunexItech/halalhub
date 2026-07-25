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

// ============================================================
// 1. GET PENSION STATS (Public)
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const db = await getClient();

    // Get total imams (approved)
    const imamsResult = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND imam_status = $2',
      ['imam', 'approved']
    );

    // Get total mosques
    const mosquesResult = await db.query(
      'SELECT COUNT(*) as count FROM mosques'
    );

    // Get unique communities (counties where mosques exist)
    const communitiesResult = await db.query(
      'SELECT COUNT(DISTINCT county) as count FROM mosques WHERE county IS NOT NULL'
    );

    // Get total active supporters (clients who have supported at least one imam)
    const supportersResult = await db.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM supporters WHERE status = $1',
      ['active']
    );

    // Get total pension contributions
    const contributionsResult = await db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM pension_contributions WHERE status = $1',
      ['completed']
    );

    res.json({
      success: true,
      stats: {
        totalImams: parseInt(imamsResult.rows[0].count) || 0,
        totalMosques: parseInt(mosquesResult.rows[0].count) || 0,
        communitiesServed: parseInt(communitiesResult.rows[0].count) || 0,
        monthlyContributors: parseInt(supportersResult.rows[0].count) || 0,
        totalContributions: parseInt(contributionsResult.rows[0].total) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching pension stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch pension stats' });
  }
});

// ============================================================
// 2. GET ALL MOSQUES (Public)
// ============================================================
router.get('/mosques', async (req, res) => {
  try {
    const db = await getClient();
    const { county, search, limit = 50 } = req.query;

    let query = `
      SELECT 
        m.id,
        m.name,
        m.location,
        m.county,
        m.latitude,
        m.longitude,
        u.fullname as imam_name,
        u.id as imam_id
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
      query += ` AND (m.name ILIKE $${paramIndex} OR u.fullname ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY m.name ASC LIMIT ${parseInt(limit)}`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      mosques: result.rows.map(m => ({
        id: m.id,
        name: m.name,
        location: m.location,
        county: m.county,
        latitude: m.latitude,
        longitude: m.longitude,
        imam_name: m.imam_name || 'No Imam Assigned',
        imam_id: m.imam_id
      })),
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching mosques:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosques' });
  }
});

// ============================================================
// 3. GET MOSQUE DETAILS (Public)
// ============================================================
router.get('/mosques/:id', async (req, res) => {
  try {
    const db = await getClient();
    const mosqueId = req.params.id;

    const result = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.location,
        m.county,
        m.latitude,
        m.longitude,
        m.createdat,
        u.fullname as imam_name,
        u.id as imam_id,
        u.profile_image as imam_image,
        u.bio as imam_bio,
        i.title as imam_title,
        i.years_of_service,
        i.is_verified as imam_verified
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE m.id = $1
    `, [mosqueId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mosque not found' });
    }

    // Get imams at this mosque (all imams associated with this mosque)
    const imamsResult = await db.query(`
      SELECT 
        u.id,
        u.fullname,
        u.profile_image,
        i.id as imam_id,
        i.title,
        i.years_of_service,
        i.is_verified,
        pb.total_contributions,
        pb.total_supporters
      FROM imams i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE i.mosque_name = $1 AND u.imam_status = 'approved'
      ORDER BY i.years_of_service DESC
    `, [result.rows[0].name]);

    res.json({
      success: true,
      mosque: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        location: result.rows[0].location,
        county: result.rows[0].county,
        latitude: result.rows[0].latitude,
        longitude: result.rows[0].longitude,
        imam_name: result.rows[0].imam_name,
        imam_id: result.rows[0].imam_id,
        imam_image: result.rows[0].imam_image,
        imam_bio: result.rows[0].imam_bio,
        imam_title: result.rows[0].imam_title,
        years_of_service: result.rows[0].years_of_service,
        imam_verified: result.rows[0].imam_verified,
        createdat: result.rows[0].createdat
      },
      imams: imamsResult.rows.map(i => ({
        id: i.id,
        imam_id: i.imam_id,
        name: i.fullname,
        profile_image: i.profile_image,
        title: i.title,
        yearsOfService: parseInt(i.years_of_service) || 0,
        verified: i.is_verified || false,
        totalContributions: parseInt(i.total_contributions) || 0,
        totalSupporters: parseInt(i.total_supporters) || 0
      }))
    });

  } catch (err) {
    console.error('Error fetching mosque details:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosque details' });
  }
});

// ============================================================
// 4. GET IMAM PROFILE (Public)
// ============================================================
router.get('/imams/:id', async (req, res) => {
  try {
    const db = await getClient();
    const imamId = req.params.id;

    // Check if it's a user ID or imam ID
    const isUser = imamId.startsWith('user-') || imamId.startsWith('client-') || imamId.startsWith('vendor-') || imamId.startsWith('imam-');
    
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
          m.id as mosque_id
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
          m.id as mosque_id
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
        mosque_name: imam.mosque_name,
        mosque_location: imam.mosque_location,
        mosque_county: imam.mosque_county,
        mosque_id: imam.mosque_id,
        qualifications: imam.qualifications || [],
        years_of_service: parseInt(imam.years_of_service) || 0,
        verified: imam.is_verified || false,
        total_contributions: parseInt(imam.total_contributions) || 0,
        total_supporters: parseInt(imam.total_supporters) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching imam profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch imam profile' });
  }
});

// ============================================================
// 5. SUPPORT IMAM (Record contribution)
// ============================================================
router.post('/contribute', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { imam_id, amount, frequency, payment_reference } = req.body;

    if (!imam_id) {
      return res.status(400).json({ error: 'Imam ID is required' });
    }

    if (!amount || parseInt(amount) < 10) {
      return res.status(400).json({ error: 'Minimum contribution is KES 10' });
    }

    // Check if imam exists and is approved
    const imamCheck = await db.query(`
      SELECT i.id, i.user_id FROM imams i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1 AND u.imam_status = 'approved'
    `, [imam_id]);

    if (imamCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Approved imam not found' });
    }

    const imam = imamCheck.rows[0];
    const contributionAmount = parseInt(amount);

    // Start transaction
    await db.query('BEGIN');

    try {
      // Deduct from user's wallet balance
      const userBalance = await db.query(
        'SELECT walletbalance FROM users WHERE id = $1',
        [userId]
      );

      const currentBalance = parseInt(userBalance.rows[0].walletbalance) || 0;

      if (currentBalance < contributionAmount) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      // Deduct from sender
      await db.query(
        'UPDATE users SET walletbalance = walletbalance - $1, updatedat = NOW() WHERE id = $2',
        [contributionAmount, userId]
      );

      // Record contribution
      const contributionId = 'pcont-' + Date.now();
      await db.query(`
        INSERT INTO pension_contributions (
          id, imam_id, user_id, amount, payment_method, payment_reference, status, contribution_date
        ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
      `, [contributionId, imam_id, userId, contributionAmount, 'wallet', payment_reference || null]);

      // Update pension balance
      await db.query(`
        UPDATE pension_balances 
        SET total_contributions = total_contributions + $1,
            updatedat = NOW()
        WHERE imam_id = $2
      `, [contributionAmount, imam_id]);

      // Add or update supporter
      const existingSupporter = await db.query(
        'SELECT id FROM supporters WHERE imam_id = $1 AND user_id = $2',
        [imam_id, userId]
      );

      if (existingSupporter.rows.length > 0) {
        await db.query(
          'UPDATE supporters SET amount = amount + $1, frequency = $2, updatedat = NOW() WHERE id = $3',
          [contributionAmount, frequency || 'once', existingSupporter.rows[0].id]
        );
      } else {
        const supporterId = 'supp-' + Date.now();
        await db.query(`
          INSERT INTO supporters (id, imam_id, user_id, amount, frequency, status, createdat, updatedat)
          VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        `, [supporterId, imam_id, userId, contributionAmount, frequency || 'once']);

        await db.query(`
          UPDATE pension_balances 
          SET total_supporters = total_supporters + 1,
              updatedat = NOW()
          WHERE imam_id = $1
        `, [imam_id]);
      }

      // Create notification for imam
      const notificationId = 'notif-' + Date.now();
      await db.query(`
        INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        notificationId,
        imam.user_id,
        'New Pension Contribution',
        `A supporter has contributed ${formatCurrency(contributionAmount)} to your pension fund.`,
        'pension',
        `/imam-dashboard`
      ]);

      await db.query('COMMIT');

      // Get updated balance
      const newBalance = await db.query(
        'SELECT walletbalance FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Contribution recorded successfully',
        contributionId: contributionId,
        newBalance: parseInt(newBalance.rows[0].walletbalance) || 0,
        amount: contributionAmount,
        imam_name: imamCheck.rows[0].fullname || 'Imam'
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Error recording contribution:', err.message);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

// ============================================================
// 6. GET PENSION CONTRIBUTION HISTORY (User)
// ============================================================
router.get('/contributions', authenticate, async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const result = await db.query(`
      SELECT 
        pc.*,
        u.fullname as imam_name,
        u.phone as imam_phone
      FROM pension_contributions pc
      JOIN imams i ON pc.imam_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE pc.user_id = $1
      ORDER BY pc.contribution_date DESC
      LIMIT ${parseInt(limit)}
    `, [userId]);

    res.json({
      success: true,
      contributions: result.rows.map(c => ({
        id: c.id,
        imam_id: c.imam_id,
        imam_name: c.imam_name,
        amount: parseInt(c.amount),
        payment_method: c.payment_method,
        payment_reference: c.payment_reference,
        status: c.status,
        contribution_date: c.contribution_date
      }))
    });

  } catch (err) {
    console.error('Error fetching contribution history:', err.message);
    res.status(500).json({ error: 'Failed to fetch contribution history' });
  }
});

// Helper function
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

module.exports = router;