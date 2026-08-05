const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Client } = require('pg');
const crypto = require('crypto');

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
// 1. GET ALL LEADERS FOR CONSULTATION (Public)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const db = await getClient();
    const { leader_type, search, limit = 50 } = req.query;

    let query = `
      SELECT 
        l.id,
        l.user_id,
        l.leader_type,
        l.name,
        l.title,
        l.qualifications as expertise,
        l.consultation_fee as fee,
        l.years_of_service as experience,
        l.bio,
        l.is_verified as verified,
        l.institution,
        l.consultation_types,
        l.available_for_consultation as available,
        l.createdat,
        l.updatedat,
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

    if (search) {
      query += ` AND (u.fullname ILIKE $${paramIndex} OR l.bio ILIKE $${paramIndex} OR l.title ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY l.is_verified DESC, l.rating DESC NULLS LAST, u.fullname ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      leaders: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching leaders for consultation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaders'
    });
  }
});

// ============================================================
// 2. GET LEADER BY ID FOR CONSULTATION (Public)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const db = await getClient();
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        l.id,
        l.user_id,
        l.leader_type,
        l.name,
        l.title,
        l.qualifications as expertise,
        l.consultation_fee as fee,
        l.years_of_service as experience,
        l.bio,
        l.is_verified as verified,
        l.institution,
        l.consultation_types,
        l.available_for_consultation as available,
        l.createdat,
        l.updatedat,
        u.fullname as name,
        u.profile_image,
        u.email,
        u.phone
      FROM leaders l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1 AND l.available_for_consultation = true AND l.status = 'approved'
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Leader not found or not available for consultation'
      });
    }

    res.json({
      success: true,
      leader: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching leader:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leader'
    });
  }
});

// ============================================================
// 3. GET LEADER STATS (Public)
// ============================================================
router.get('/stats/summary', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_leaders,
        COUNT(CASE WHEN leader_type = 'islamic_scholar' THEN 1 END) as total_scholars,
        COUNT(CASE WHEN leader_type = 'imam' THEN 1 END) as total_imams,
        COUNT(CASE WHEN leader_type = 'adhan_caller' THEN 1 END) as total_adhan_callers,
        COUNT(CASE WHEN leader_type = 'ustadh' THEN 1 END) as total_ustadhs,
        COUNT(CASE WHEN leader_type = 'ustadha' THEN 1 END) as total_ustadhas,
        COUNT(CASE WHEN leader_type = 'kadhi' THEN 1 END) as total_kadhis,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
        COUNT(CASE WHEN available_for_consultation = true THEN 1 END) as available_count,
        AVG(rating) as avg_rating
      FROM leaders
      WHERE status = 'approved'
    `);

    res.json({
      success: true,
      stats: {
        totalLeaders: parseInt(result.rows[0].total_leaders) || 0,
        totalScholars: parseInt(result.rows[0].total_scholars) || 0,
        totalImams: parseInt(result.rows[0].total_imams) || 0,
        totalAdhanCallers: parseInt(result.rows[0].total_adhan_callers) || 0,
        totalUstadhs: parseInt(result.rows[0].total_ustadhs) || 0,
        totalUstadhas: parseInt(result.rows[0].total_ustadhas) || 0,
        totalKadhis: parseInt(result.rows[0].total_kadhis) || 0,
        verifiedCount: parseInt(result.rows[0].verified_count) || 0,
        availableCount: parseInt(result.rows[0].available_count) || 0,
        avgRating: parseFloat(result.rows[0].avg_rating) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching leader stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leader stats'
    });
  }
});

// ============================================================
// 4. GET LEADER TYPES (Public)
// ============================================================
router.get('/types/list', async (req, res) => {
  try {
    const LEADER_TYPES = [
      { id: 'islamic_scholar', label: 'Islamic Scholar' },
      { id: 'imam', label: 'Imam' },
      { id: 'adhan_caller', label: 'Adhan Caller' },
      { id: 'ustadh', label: 'Ustadh' },
      { id: 'ustadha', label: 'Ustadha' },
      { id: 'kadhi', label: 'Kadhi' }
    ];

    res.json({
      success: true,
      types: LEADER_TYPES
    });

  } catch (error) {
    console.error('Error fetching leader types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leader types'
    });
  }
});

module.exports = router;