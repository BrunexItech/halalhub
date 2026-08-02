const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
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
// HELPER: FETCH FROM OPENSTREETMAP (OSM)
// ============================================================
async function fetchFromOSM(lat, lon, radius = 5000) {
  const overpassQuery = `
    [out:json];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      node["amenity"="mosque"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      way["amenity"="mosque"](around:${radius},${lat},${lon});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      relation["amenity"="mosque"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: overpassQuery,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error('OSM service temporarily unavailable');
  }

  const data = await response.json();

  return data.elements
    .filter(el => el.tags && el.tags.name)
    .map(el => {
      let lat, lon;
      if (el.type === 'node') {
        lat = el.lat;
        lon = el.lon;
      } else if (el.type === 'way' || el.type === 'relation') {
        lat = el.center?.lat || el.lat || 0;
        lon = el.center?.lon || el.lon || 0;
      }

      const address = el.tags['addr:street'] ||
        el.tags['addr:place'] ||
        el.tags['addr:city'] ||
        el.tags['addr:full'] ||
        el.tags['description'] ||
        '';

      const facilities = [];
      if (el.tags['wudu'] || el.tags['ablution']) facilities.push('Wudu Area');
      if (el.tags['parking'] || el.tags['parking:street'] === 'yes') facilities.push('Parking');
      if (el.tags['women'] === 'yes' || el.tags['women:area'] === 'yes') facilities.push('Women Section');
      if (el.tags['wheelchair'] === 'yes') facilities.push('Wheelchair Accessible');
      if (el.tags['school'] === 'yes' || el.tags['madrasa'] === 'yes') facilities.push('Madrasa');
      if (el.tags['library'] === 'yes') facilities.push('Library');
      if (el.tags['kitchen'] === 'yes') facilities.push('Kitchen Facilities');
      if (el.tags['toilets'] === 'yes') facilities.push('Toilets');
      if (el.tags['shower'] === 'yes') facilities.push('Shower Facilities');

      return {
        id: `osm-${el.id}`,
        name: el.tags.name || 'Unnamed Mosque',
        lat: lat,
        lon: lon,
        address: address,
        city: el.tags['addr:city'] || el.tags['addr:town'] || '',
        phone: el.tags.phone || el.tags['contact:phone'] || '',
        website: el.tags.website || el.tags['contact:website'] || '',
        openingHours: el.tags.opening_hours || '',
        facilities: facilities,
        source: 'osm',
        osmId: el.id,
        verified: false,
        isActive: true,
        imam_name: null
      };
    })
    .filter(m => m.lat && m.lon);
}

// ============================================================
// HELPER: CALCULATE DISTANCE
// ============================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================
// 1. FIND MOSQUES (Public - No Auth Required)
// ============================================================
router.get('/nearby', async (req, res) => {
  try {
    const db = await getClient();
    const { lat, lon, radius = 5, search } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusMeters = parseInt(radius) * 1000;

    // ============================================================
    // STEP 1: FETCH FROM DATABASE (Admin-added mosques)
    // ============================================================
    let dbQuery = `
      SELECT 
        m.id,
        m.name,
        m.location as address,
        m.county as city,
        m.latitude as lat,
        m.longitude as lon,
        m.createdat,
        u.fullname as imam_name,
        u.id as imam_user_id,
        u.profile_image as imam_image,
        i.id as imam_profile_id,
        i.title as imam_title,
        i.is_verified as imam_verified,
        i.qualifications as imam_qualifications,
        i.years_of_service as imam_years,
        pb.total_contributions as imam_total_contributions,
        pb.total_supporters as imam_total_supporters,
        'database' as source,
        true as verified,
        true as is_active,
        ARRAY[]::text[] as facilities,
        NULL as osmId
      FROM mosques m
      LEFT JOIN imams i ON m.imam_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN pension_balances pb ON i.id = pb.imam_id
      WHERE m.latitude IS NOT NULL 
        AND m.longitude IS NOT NULL
        AND m.name IS NOT NULL
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      dbQuery += ` AND m.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Only return mosques within radius
    dbQuery += ` AND (
      (6371 * acos(
        cos(radians($${paramIndex})) * 
        cos(radians(m.latitude)) * 
        cos(radians(m.longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * 
        sin(radians(m.latitude))
      )) <= $${paramIndex + 2}
    )`;
    params.push(latNum, lonNum, parseInt(radius));

    const dbResult = await db.query(dbQuery, params);

    // Add distance to each database mosque
    const dbMosques = dbResult.rows.map(m => {
      const distance = calculateDistance(latNum, lonNum, parseFloat(m.lat), parseFloat(m.lon));
      return {
        ...m,
        distance: distance,
        lat: parseFloat(m.lat),
        lon: parseFloat(m.lon)
      };
    });

    // ============================================================
    // STEP 2: FETCH FROM OSM (Fallback)
    // ============================================================
    let osmMosques = [];
    let osmError = null;

    try {
      const osmData = await fetchFromOSM(latNum, lonNum, radiusMeters);

      // Filter out OSM mosques that already exist in database (by name and proximity)
      const dbNames = dbMosques.map(m => m.name.toLowerCase().trim());
      const dbCoords = dbMosques.map(m => ({ lat: m.lat, lon: m.lon }));

      osmMosques = osmData
        .filter(osm => {
          // Check if same name exists in DB
          const nameMatch = dbNames.includes(osm.name.toLowerCase().trim());
          if (nameMatch) return false;

          // Check if same coordinates exist in DB (within 100m)
          const coordMatch = dbCoords.some(dbCoord => {
            const dist = calculateDistance(osm.lat, osm.lon, dbCoord.lat, dbCoord.lon);
            return dist < 0.1; // 100 meters
          });
          if (coordMatch) return false;

          return true;
        })
        .map(osm => {
          const distance = calculateDistance(latNum, lonNum, osm.lat, osm.lon);
          return {
            ...osm,
            distance: distance,
            source: 'osm',
            verified: false,
            is_active: true,
            imam_name: null
          };
        });

    } catch (err) {
      console.error('OSM fetch error:', err);
      osmError = 'OSM data temporarily unavailable';
    }

    // ============================================================
    // STEP 3: COMBINE AND SORT RESULTS
    // ============================================================
    const allMosques = [...dbMosques, ...osmMosques]
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        mosques: allMosques,
        total: allMosques.length,
        source: {
          database: dbMosques.length,
          osm: osmMosques.length,
          fallback: osmError ? true : false
        },
        location: {
          lat: latNum,
          lon: lonNum,
          radius: parseInt(radius)
        }
      }
    });

  } catch (error) {
    console.error('Error finding mosques:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find mosques. Please try again.'
    });
  }
});

// ============================================================
// 2. GET MOSQUE BY ID (Public)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const db = await getClient();
    const { id } = req.params;

    // Check if it's a database mosque ID
    if (!id.startsWith('osm-')) {
      const result = await db.query(`
        SELECT 
          m.id,
          m.name,
          m.location as address,
          m.county as city,
          m.latitude as lat,
          m.longitude as lon,
          m.createdat,
          u.fullname as imam_name,
          u.id as imam_user_id,
          u.profile_image as imam_image,
          u.bio as imam_bio,
          i.id as imam_profile_id,
          i.title as imam_title,
          i.qualifications as imam_qualifications,
          i.years_of_service as imam_years,
          i.is_verified as imam_verified,
          pb.total_contributions as imam_total_contributions,
          pb.total_supporters as imam_total_supporters,
          'database' as source,
          true as verified
        FROM mosques m
        LEFT JOIN imams i ON m.imam_id = i.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN pension_balances pb ON i.id = pb.imam_id
        WHERE m.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Mosque not found'
        });
      }

      return res.json({
        success: true,
        mosque: result.rows[0]
      });
    }

    // For OSM IDs, we need to return a generic response
    // Since we don't store OSM data permanently
    return res.status(404).json({
      success: false,
      error: 'OSM mosque details not available. Please search again.'
    });

  } catch (error) {
    console.error('Error fetching mosque:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mosque details'
    });
  }
});

// ============================================================
// 3. GET MOSQUE STATS (Public)
// ============================================================
router.get('/stats/summary', async (req, res) => {
  try {
    const db = await getClient();

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_mosques,
        COUNT(DISTINCT county) as total_counties,
        COUNT(imam_id) as total_imams_assigned
      FROM mosques
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    res.json({
      success: true,
      stats: {
        totalMosques: parseInt(result.rows[0].total_mosques) || 0,
        totalCounties: parseInt(result.rows[0].total_counties) || 0,
        totalImamsAssigned: parseInt(result.rows[0].total_imams_assigned) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching mosque stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mosque stats'
    });
  }
});

// ============================================================
// 4. SEARCH MOSQUES BY NAME OR CITY (Public)
// ============================================================
router.get('/search/:query', async (req, res) => {
  try {
    const db = await getClient();
    const { query } = req.params;
    const { limit = 20 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const result = await db.query(`
      SELECT 
        id,
        name,
        location as address,
        county as city,
        latitude as lat,
        longitude as lon,
        'database' as source,
        true as verified
      FROM mosques
      WHERE name ILIKE $1 
        OR location ILIKE $1 
        OR county ILIKE $1
      LIMIT $2
    `, [`%${query}%`, parseInt(limit)]);

    res.json({
      success: true,
      mosques: result.rows,
      total: result.rows.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Error searching mosques:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search mosques'
    });
  }
});

module.exports = router;