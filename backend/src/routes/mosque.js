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
// 1. GET ALL MOSQUES (Public)
// ============================================================
router.get('/', async (req, res) => {
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
        m.createdat,
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
        location: m.location || 'Location not specified',
        county: m.county || 'County not specified',
        latitude: m.latitude,
        longitude: m.longitude,
        imam_name: m.imam_name || 'No Imam Assigned',
        imam_user_id: m.imam_user_id,
        imam_image: m.imam_image,
        imam_title: m.imam_title || 'Imam',
        imam_verified: m.imam_verified || false,
        createdat: m.createdat
      })),
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching mosques:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosques' });
  }
});

// ============================================================
// 2. GET MOSQUE BY ID (Public)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const db = await getClient();
    const mosqueId = req.params.id;

    // Get mosque details
    const mosqueResult = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.location,
        m.county,
        m.latitude,
        m.longitude,
        m.createdat,
        u.fullname as imam_name,
        u.id as imam_user_id,
        u.profile_image as imam_image,
        u.bio as imam_bio,
        i.id as imam_profile_id,
        i.title as imam_title,
        i.years_of_service,
        i.is_verified as imam_verified,
        pb.total_contributions,
        pb.total_supporters
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE m.id = $1
    `, [mosqueId]);

    if (mosqueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mosque not found' });
    }

    const mosque = mosqueResult.rows[0];

    // Get all imams at this mosque
    const imamsResult = await db.query(`
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
        pb.total_supporters
      FROM imams i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE i.mosque_name = $1 AND u.imam_status = 'approved'
      ORDER BY i.years_of_service DESC
    `, [mosque.name]);

    // Get count of imams
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM imams WHERE mosque_name = $1',
      [mosque.name]
    );

    res.json({
      success: true,
      mosque: {
        id: mosque.id,
        name: mosque.name,
        location: mosque.location || 'Location not specified',
        county: mosque.county || 'County not specified',
        latitude: mosque.latitude,
        longitude: mosque.longitude,
        createdat: mosque.createdat,
        imam: mosque.imam_name ? {
          name: mosque.imam_name,
          id: mosque.imam_user_id,
          profile_id: mosque.imam_profile_id,
          image: mosque.imam_image,
          bio: mosque.imam_bio,
          title: mosque.imam_title || 'Imam',
          yearsOfService: parseInt(mosque.years_of_service) || 0,
          verified: mosque.imam_verified || false,
          totalContributions: parseInt(mosque.total_contributions) || 0,
          totalSupporters: parseInt(mosque.total_supporters) || 0
        } : null,
        imams_count: parseInt(countResult.rows[0].count) || 0
      },
      imams: imamsResult.rows.map(i => ({
        user_id: i.user_id,
        imam_id: i.imam_id,
        name: i.fullname,
        phone: i.phone,
        email: i.email,
        profile_image: i.profile_image,
        bio: i.bio,
        title: i.title || 'Imam',
        mosque_name: i.mosque_name,
        mosque_location: i.mosque_location,
        mosque_county: i.mosque_county,
        qualifications: i.qualifications || [],
        years_of_service: parseInt(i.years_of_service) || 0,
        verified: i.is_verified || false,
        total_contributions: parseInt(i.total_contributions) || 0,
        total_supporters: parseInt(i.total_supporters) || 0
      }))
    });

  } catch (err) {
    console.error('Error fetching mosque:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosque details' });
  }
});

// ============================================================
// 3. ADD MOSQUE (Vendor/Admin only)
// ============================================================
router.post('/add', authenticate, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const db = await getClient();
    const userId = req.user.id;
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

    // Check if mosque already exists
    const existing = await db.query(
      'SELECT id FROM mosques WHERE name = $1 AND location = $2',
      [name, location]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Mosque already exists at this location' });
    }

    // If imam_id provided, verify imam exists
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

    // Create notification for the imam if assigned
    if (imam_id) {
      const imamUser = await db.query(
        'SELECT user_id FROM imams WHERE id = $1',
        [imam_id]
      );

      if (imamUser.rows.length > 0) {
        const notificationId = 'notif-' + Date.now();
        await db.query(`
          INSERT INTO notifications (id, user_id, title, message, type, link, createdat)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          notificationId,
          imamUser.rows[0].user_id,
          'Mosque Added',
          `You have been assigned as the imam for ${name}.`,
          'mosque',
          `/mosque/${mosqueId}`
        ]);
      }
    }

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
// 4. UPDATE MOSQUE (Vendor/Admin only)
// ============================================================
router.put('/:id', authenticate, authorize('vendor', 'admin'), async (req, res) => {
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
// 5. DELETE MOSQUE (Admin only)
// ============================================================
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
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
// 6. GET MOSQUE STATS (Public)
// ============================================================
router.get('/stats/count', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_mosques,
        COUNT(DISTINCT county) as total_counties,
        COUNT(DISTINCT imam_id) as total_imams_assigned
      FROM mosques
    `);

    res.json({
      success: true,
      stats: {
        totalMosques: parseInt(result.rows[0].total_mosques) || 0,
        totalCounties: parseInt(result.rows[0].total_counties) || 0,
        totalImamsAssigned: parseInt(result.rows[0].total_imams_assigned) || 0
      }
    });

  } catch (err) {
    console.error('Error fetching mosque stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosque stats' });
  }
});

// ============================================================
// 7. GET MOSQUES BY COUNTY
// ============================================================
router.get('/counties/:county', async (req, res) => {
  try {
    const db = await getClient();
    const county = req.params.county;

    const result = await db.query(`
      SELECT 
        id,
        name,
        location,
        county,
        latitude,
        longitude
      FROM mosques
      WHERE county = $1
      ORDER BY name ASC
    `, [county]);

    res.json({
      success: true,
      mosques: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error fetching mosques by county:', err.message);
    res.status(500).json({ error: 'Failed to fetch mosques by county' });
  }
});

// ============================================================
// 8. GET ALL COUNTIES WITH MOSQUES
// ============================================================
router.get('/counties/list', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT DISTINCT county
      FROM mosques
      WHERE county IS NOT NULL
      ORDER BY county ASC
    `);

    res.json({
      success: true,
      counties: result.rows.map(r => r.county)
    });

  } catch (err) {
    console.error('Error fetching counties:', err.message);
    res.status(500).json({ error: 'Failed to fetch counties' });
  }
});

module.exports = router;