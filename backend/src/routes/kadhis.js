const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');

// Database connection
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
// 1. GET ALL KADHIS (Public)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const db = await getClient();
    const { type, county, expertise, search, limit = 50 } = req.query;

    let query = `
      SELECT 
        id,
        name,
        type,
        county,
        expertise,
        fee,
        rating,
        reviews,
        experience,
        bio,
        languages,
        verified,
        verification_date,
        institution,
        consultation_types,
        available,
        createdat
      FROM kadhis
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type && type !== 'all') {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (county && county !== 'All') {
      query += ` AND county = $${paramIndex}`;
      params.push(county);
      paramIndex++;
    }

    if (expertise && expertise !== 'All') {
      query += ` AND $${paramIndex} = ANY(expertise)`;
      params.push(expertise);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR bio ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY rating DESC, name ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      kadhis: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching kadhis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch kadhis'
    });
  }
});

// ============================================================
// 2. GET KADHI BY ID (Public)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const db = await getClient();
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        id,
        user_id,
        name,
        type,
        county,
        expertise,
        fee,
        rating,
        reviews,
        experience,
        bio,
        languages,
        verified,
        verification_date,
        institution,
        consultation_types,
        available,
        createdat,
        updatedat
      FROM kadhis
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kadhi not found'
      });
    }

    res.json({
      success: true,
      kadhi: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching kadhi:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch kadhi'
    });
  }
});

// ============================================================
// 3. CREATE KADHI (Admin only)
// ============================================================
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const {
      userId,
      name,
      type = 'kadhi',
      county,
      expertise,
      fee = 0,
      experience,
      bio,
      languages,
      institution,
      consultationTypes,
      available = true
    } = req.body;

    if (!name || !county) {
      return res.status(400).json({
        success: false,
        error: 'Name and county are required'
      });
    }

    const kadhiId = 'kadhi-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');

    await db.query(
      `INSERT INTO kadhis (
        id, user_id, name, type, county, expertise, fee, 
        experience, bio, languages, institution, consultation_types, available,
        createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      [
        kadhiId,
        userId || null,
        name,
        type,
        county,
        expertise || [],
        fee,
        experience || null,
        bio || null,
        languages || [],
        institution || null,
        consultationTypes || [],
        available
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Kadhi created successfully',
      data: {
        id: kadhiId,
        name: name,
        type: type
      }
    });

  } catch (error) {
    console.error('Error creating kadhi:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create kadhi'
    });
  }
});

// ============================================================
// 4. UPDATE KADHI (Admin only)
// ============================================================
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { id } = req.params;
    const {
      name,
      type,
      county,
      expertise,
      fee,
      experience,
      bio,
      languages,
      institution,
      consultationTypes,
      available,
      verified,
      verificationDate
    } = req.body;

    const checkResult = await db.query(
      'SELECT id FROM kadhis WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kadhi not found'
      });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      params.push(type);
    }
    if (county !== undefined) {
      updates.push(`county = $${paramIndex++}`);
      params.push(county);
    }
    if (expertise !== undefined) {
      updates.push(`expertise = $${paramIndex++}`);
      params.push(expertise);
    }
    if (fee !== undefined) {
      updates.push(`fee = $${paramIndex++}`);
      params.push(fee);
    }
    if (experience !== undefined) {
      updates.push(`experience = $${paramIndex++}`);
      params.push(experience);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      params.push(bio);
    }
    if (languages !== undefined) {
      updates.push(`languages = $${paramIndex++}`);
      params.push(languages);
    }
    if (institution !== undefined) {
      updates.push(`institution = $${paramIndex++}`);
      params.push(institution);
    }
    if (consultationTypes !== undefined) {
      updates.push(`consultation_types = $${paramIndex++}`);
      params.push(consultationTypes);
    }
    if (available !== undefined) {
      updates.push(`available = $${paramIndex++}`);
      params.push(available);
    }
    if (verified !== undefined) {
      updates.push(`verified = $${paramIndex++}`);
      params.push(verified);
    }
    if (verificationDate !== undefined) {
      updates.push(`verification_date = $${paramIndex++}`);
      params.push(verificationDate);
    }

    updates.push(`updatedat = NOW()`);

    params.push(id);

    await db.query(
      `UPDATE kadhis SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    res.json({
      success: true,
      message: 'Kadhi updated successfully'
    });

  } catch (error) {
    console.error('Error updating kadhi:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update kadhi'
    });
  }
});

// ============================================================
// 5. DELETE KADHI (Admin only)
// ============================================================
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const db = await getClient();
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM kadhis WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kadhi not found'
      });
    }

    res.json({
      success: true,
      message: 'Kadhi deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting kadhi:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete kadhi'
    });
  }
});

// ============================================================
// 6. GET KADHI STATS (Public)
// ============================================================
router.get('/stats/summary', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_kadhis,
        COUNT(CASE WHEN type = 'kadhi' THEN 1 END) as total_kadhis_count,
        COUNT(CASE WHEN type = 'scholar' THEN 1 END) as total_scholars,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
        COUNT(CASE WHEN available = true THEN 1 END) as available_count,
        AVG(rating) as avg_rating
      FROM kadhis
    `);

    res.json({
      success: true,
      stats: {
        totalKadhis: parseInt(result.rows[0].total_kadhis) || 0,
        totalKadhisCount: parseInt(result.rows[0].total_kadhis_count) || 0,
        totalScholars: parseInt(result.rows[0].total_scholars) || 0,
        verifiedCount: parseInt(result.rows[0].verified_count) || 0,
        availableCount: parseInt(result.rows[0].available_count) || 0,
        avgRating: parseFloat(result.rows[0].avg_rating) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching kadhi stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch kadhi stats'
    });
  }
});

// ============================================================
// 7. GET COUNTIES WITH KADHIS (Public)
// ============================================================
router.get('/counties/list', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT DISTINCT county
      FROM kadhis
      WHERE county IS NOT NULL
      ORDER BY county ASC
    `);

    res.json({
      success: true,
      counties: result.rows.map(r => r.county)
    });

  } catch (error) {
    console.error('Error fetching counties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch counties'
    });
  }
});

module.exports = router;