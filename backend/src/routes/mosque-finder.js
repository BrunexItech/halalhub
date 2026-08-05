const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// ============================================================
// HELPER: FETCH FROM OPENSTREETMAP (OSM) - Improved for Kenya
// ============================================================
async function fetchFromOSM(lat, lon, radiusKm = 5, search = '') {
  const radiusMeters = radiusKm * 1000;

  // Build search query - use multiple search terms for better coverage
  let searchTerm = search || 'mosque';
  
  // If search term is generic, try multiple terms
  const searchTerms = searchTerm.length > 2 
    ? [searchTerm] 
    : ['mosque', 'masjid', 'musallah', 'prayer', 'islamic', 'muslim'];

  let allResults = [];

  for (const term of searchTerms) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&lat=${lat}&lon=${lon}&radius=${radiusMeters}&limit=50&addressdetails=1&extratags=1&namedetails=1`;

    console.log(`[Mosque Finder] Fetching OSM data for term: ${term}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HalalHub/1.0 (https://halalhub.com)',
          'Accept-Language': 'en'
        }
      });

      if (!response.ok) {
        console.warn(`[Mosque Finder] OSM returned ${response.status} for term: ${term}`);
        continue;
      }

      const data = await response.json();
      console.log(`[Mosque Finder] OSM returned ${data.length} results for term: ${term}`);
      allResults = [...allResults, ...data];
    } catch (err) {
      console.error(`[Mosque Finder] Error fetching term ${term}:`, err.message);
    }
  }

  // Remove duplicates by osm_id
  const seen = new Set();
  const uniqueResults = allResults.filter(el => {
    const key = el.osm_id || el.display_name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Mosque Finder] Total unique results: ${uniqueResults.length}`);

  // MORE LENIENT FILTERING - Include anything that might be a mosque
  const filteredData = uniqueResults.filter(el => {
    const name = (el.display_name || '').toLowerCase();
    const tags = el.extratags || {};
    const classType = el.class || '';
    const type = el.type || '';
    
    // Check for mosque-related keywords in name (expanded list)
    const mosqueKeywords = [
      'mosque', 'masjid', 'musallah', 'prayer', 'islamic', 'muslim',
      'salaam', 'tawheed', 'iman', 'khadija', 'ahmadiyya', 'sharia',
      'halal', 'quran', 'sunnah', 'madrasa', 'maktab', 'dua',
      'ramadan', 'eid', 'juma', 'khutbah', 'imam', 'sheikh',
      'allah', 'muhammed', 'muhammad', 'ahmed', 'ali', 'umar',
      'abu', 'bakar', 'osman', 'uthman', 'talib'
    ];
    
    const hasMosqueKeyword = mosqueKeywords.some(keyword => 
      name.includes(keyword) || name.includes(keyword.replace(' ', ''))
    );
    
    // Check if it's a place of worship or religious building
    const isPlaceOfWorship = (classType === 'amenity' && type === 'place_of_worship') ||
                             type === 'religious' ||
                             type === 'mosque' ||
                             classType === 'building' ||
                             classType === 'place' ||
                             classType === 'landuse';
    
    // Check if denomination or religion is Muslim
    const isMuslim = tags.denomination === 'muslim' || 
                     tags.denomination === 'islamic' ||
                     tags.religion === 'muslim' ||
                     tags.religion === 'islam' ||
                     tags.religion === 'islamic';
    
    // Include if it's a place of worship OR has mosque keyword OR is Muslim denomination
    // OR if it's a building in a predominantly Muslim area
    const shouldInclude = isPlaceOfWorship || hasMosqueKeyword || isMuslim;
    
    if (shouldInclude) {
      console.log(`[Mosque Finder] Including: ${el.display_name?.substring(0, 50)}... (${classType}/${type})`);
    }
    
    return shouldInclude;
  });

  console.log(`[Mosque Finder] Filtered to ${filteredData.length} results`);

  // If we still have no results, try a more aggressive approach with a wider radius
  if (filteredData.length === 0 && radiusKm < 20) {
    console.log(`[Mosque Finder] No results found, trying wider radius...`);
    return fetchFromOSM(lat, lon, Math.min(radiusKm * 2, 50), search || 'mosque');
  }

  return filteredData.map(el => {
    const address = el.address || {};
    const extratags = el.extratags || {};
    
    // Get the best name available
    const name = el.name || 
                 el.namedetails?.name || 
                 el.display_name?.split(',')[0] || 
                 'Mosque';
    
    // Get city/locality
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.county || 
                 address.state || 
                 address.region || 
                 '';
    
    // Get street address
    const street = address.road || 
                   address.street || 
                   address.hamlet || 
                   address.suburb || 
                   address.neighbourhood || 
                   '';

    // Get county/region
    const county = address.county || 
                   address.state || 
                   address.region || 
                   address.province || 
                   '';

    // Get full address
    const fullAddress = el.display_name || 
                       [street, city, county].filter(Boolean).join(', ');

    // Extract facilities from tags
    const facilities = [];
    if (extratags.wheelchair === 'yes') facilities.push('Wheelchair Accessible');
    if (extratags.women === 'yes' || extratags.female === 'yes') facilities.push('Women\'s Section');
    if (extratags.men === 'yes' || extratags.male === 'yes') facilities.push('Men\'s Section');
    if (extratags.parking === 'yes') facilities.push('Parking Available');
    if (extratags.wudu === 'yes' || extratags.ablution === 'yes') facilities.push('Ablution Facilities');
    if (extratags.school === 'yes') facilities.push('Islamic School');
    if (extratags.library === 'yes') facilities.push('Library');
    if (extratags.community_centre === 'yes') facilities.push('Community Centre');
    if (extratags.kitchen === 'yes') facilities.push('Kitchen Facilities');
    if (extratags.shower === 'yes') facilities.push('Shower Facilities');
    if (extratags.toilets === 'yes') facilities.push('Toilet Facilities');
    
    // Add default facility if none found
    if (facilities.length === 0) {
      facilities.push('Prayer Hall');
    }

    // Get opening hours if available
    const openingHours = extratags.opening_hours || 
                        extratags.openinghours || 
                        null;

    // Get phone if available
    const phone = address.phone || 
                  extratags.phone || 
                  null;

    // Get website if available
    const website = extratags.website || 
                   extratags.url || 
                   null;

    return {
      id: `osm-${el.osm_id || Date.now() + Math.random()}`,
      name: name,
      lat: parseFloat(el.lat),
      lon: parseFloat(el.lon),
      address: fullAddress,
      street: street,
      city: city,
      county: county,
      postcode: address.postcode || '',
      country: address.country || 'Kenya',
      phone: phone,
      website: website,
      opening_hours: openingHours,
      facilities: facilities,
      source: 'osm',
      osm_id: el.osm_id || null,
      osm_type: el.osm_type || null,
      display_name: el.display_name || fullAddress,
      distance: null, // Will be calculated later
      verified: false // OSM data is not verified by HalalHub
    };
  });
}

// ============================================================
// HELPER: CALCULATE DISTANCE (Haversine formula)
// ============================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================
// 1. FIND MOSQUES NEARBY (Public - No Auth Required)
// ============================================================
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 5, search = '' } = req.query;

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = parseFloat(radius);

    // Validate latitude range
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude. Must be between -90 and 90.'
      });
    }

    // Validate longitude range
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude. Must be between -180 and 180.'
      });
    }

    // Validate radius
    if (isNaN(radiusNum) || radiusNum < 1 || radiusNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Radius must be between 1 and 100 km'
      });
    }

    console.log(`[Mosque Finder] Searching for mosques near (${latNum}, ${lonNum}) within ${radiusNum}km`);

    // Fetch mosques from OSM
    let mosques = [];
    let osmError = null;

    try {
      mosques = await fetchFromOSM(latNum, lonNum, radiusNum, search);
    } catch (err) {
      console.error('[Mosque Finder] OSM fetch error:', err.message);
      osmError = err.message || 'OSM data temporarily unavailable';

      // If OSM fails, try a fallback query with a wider radius
      try {
        console.log('[Mosque Finder] Trying fallback query with wider radius...');
        mosques = await fetchFromOSM(latNum, lonNum, Math.min(radiusNum * 2, 50), 'masjid');
      } catch (fallbackErr) {
        console.error('[Mosque Finder] Fallback also failed:', fallbackErr.message);
        return res.status(503).json({
          success: false,
          error: 'Unable to fetch mosque data. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? osmError : undefined
        });
      }
    }

    // Calculate distance for each mosque
    const mosquesWithDistance = mosques.map(mosque => {
      const distance = calculateDistance(latNum, lonNum, mosque.lat, mosque.lon);
      return {
        ...mosque,
        distance: distance
      };
    });

    // Sort by distance (closest first)
    const sortedMosques = mosquesWithDistance.sort((a, b) => a.distance - b.distance);

    // Filter duplicates by name and location proximity
    const uniqueMosques = [];
    const seenNames = new Set();
    const seenLocations = new Set();

    for (const mosque of sortedMosques) {
      // Normalize name for comparison
      const normalizedName = mosque.name.toLowerCase().trim();
      
      // Create a location key for proximity check
      const locationKey = `${Math.round(mosque.lat * 1000)},${Math.round(mosque.lon * 1000)}`;
      
      // Check if we already have a similar mosque within 200m
      const isDuplicate = uniqueMosques.some(existing => {
        const dist = calculateDistance(existing.lat, existing.lon, mosque.lat, mosque.lon);
        const nameMatch = existing.name.toLowerCase().trim() === normalizedName;
        return dist < 0.2 && nameMatch;
      });

      if (!isDuplicate && !seenNames.has(normalizedName) && !seenLocations.has(locationKey)) {
        uniqueMosques.push(mosque);
        seenNames.add(normalizedName);
        seenLocations.add(locationKey);
      }
    }

    console.log(`[Mosque Finder] Found ${uniqueMosques.length} unique mosques`);

    // Prepare response
    const responseData = {
      success: true,
      data: {
        mosques: uniqueMosques,
        total: uniqueMosques.length,
        source: {
          osm: uniqueMosques.length,
          fallback: osmError ? true : false
        },
        location: {
          lat: latNum,
          lon: lonNum,
          radius: radiusNum
        },
        search_query: search || 'mosque'
      }
    };

    // Add warning if OSM had errors
    if (osmError) {
      responseData.data.warning = 'Some data may be incomplete due to OSM service issues.';
      responseData.data.error_details = osmError;
    }

    // If no mosques found, send helpful message
    if (uniqueMosques.length === 0) {
      responseData.message = 'No mosques found in this area. Try expanding your search radius or using a different location.';
      responseData.data.suggestion = 'You can also try searching for "mosque", "masjid", or "prayer" in the search box.';
    }

    res.json(responseData);

  } catch (error) {
    console.error('[Mosque Finder] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find mosques. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================
// 2. SEARCH MOSQUES BY QUERY (Public)
// ============================================================
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { lat = '', lon = '', radius = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    // If lat/lon provided, use them to limit search area
    let latNum = null;
    let lonNum = null;

    if (lat && lon) {
      latNum = parseFloat(lat);
      lonNum = parseFloat(lon);
      
      if (isNaN(latNum) || isNaN(lonNum)) {
        latNum = null;
        lonNum = null;
      }
    }

    console.log(`[Mosque Finder] Searching for: "${query}"`);

    // Use OSM to search for mosques with query
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' mosque')}&limit=30&addressdetails=1&extratags=1&namedetails=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'HalalHub/1.0 (https://halalhub.com)',
        'Accept-Language': 'en'
      }
    });

    if (!response.ok) {
      throw new Error(`OSM search error: ${response.status}`);
    }

    const data = await response.json();

    // Filter for mosques/places of worship - more lenient
    const filteredData = data.filter(el => {
      const name = el.display_name?.toLowerCase() || '';
      const tags = el.extratags || {};
      
      const isPlaceOfWorship = el.class === 'amenity' && el.type === 'place_of_worship';
      const isReligious = el.type === 'religious';
      const isMosque = el.type === 'mosque';
      
      const mosqueKeywords = ['mosque', 'masjid', 'musallah', 'prayer', 'islamic', 'muslim'];
      const hasKeyword = mosqueKeywords.some(keyword => name.includes(keyword));
      
      const tagDenomination = tags.denomination === 'muslim' || tags.denomination === 'islamic';
      
      return isPlaceOfWorship || isReligious || isMosque || hasKeyword || tagDenomination;
    });

    const mosques = filteredData.map(el => {
      const address = el.address || {};
      const extratags = el.extratags || {};

      return {
        id: `osm-${el.osm_id || Date.now() + Math.random()}`,
        name: el.name || el.display_name?.split(',')[0] || 'Mosque',
        lat: parseFloat(el.lat),
        lon: parseFloat(el.lon),
        address: el.display_name || '',
        city: address.city || address.town || address.village || '',
        county: address.county || address.state || '',
        country: address.country || 'Kenya',
        phone: address.phone || extratags.phone || null,
        website: extratags.website || extratags.url || null,
        opening_hours: extratags.opening_hours || null,
        facilities: ['Prayer Hall'],
        source: 'osm',
        verified: false
      };
    });

    // If lat/lon provided, calculate distances
    let mosquesWithDistance = mosques;
    if (latNum && lonNum) {
      mosquesWithDistance = mosques.map(m => ({
        ...m,
        distance: calculateDistance(latNum, lonNum, m.lat, m.lon)
      }));
      mosquesWithDistance.sort((a, b) => a.distance - b.distance);
    }

    res.json({
      success: true,
      mosques: mosquesWithDistance,
      total: mosquesWithDistance.length,
      query: query,
      source: 'osm'
    });

  } catch (error) {
    console.error('[Mosque Finder] Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search mosques. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================
// 3. GET MOSQUE BY ID (Public)
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // If it's an OSM ID, we need to fetch from OSM
    if (id.startsWith('osm-')) {
      // Try to get more details from OSM
      const osmId = id.replace('osm-', '');
      
      const url = `https://nominatim.openstreetmap.org/lookup?format=json&osm_ids=${osmId}&addressdetails=1&extratags=1&namedetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HalalHub/1.0 (https://halalhub.com)',
          'Accept-Language': 'en'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch mosque details from OSM');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Mosque not found'
        });
      }

      const el = data[0];
      const address = el.address || {};
      const extratags = el.extratags || {};

      const mosque = {
        id: `osm-${el.osm_id}`,
        name: el.name || el.display_name?.split(',')[0] || 'Mosque',
        lat: parseFloat(el.lat),
        lon: parseFloat(el.lon),
        address: el.display_name || '',
        street: address.road || address.street || '',
        city: address.city || address.town || address.village || '',
        county: address.county || address.state || '',
        postcode: address.postcode || '',
        country: address.country || 'Kenya',
        phone: address.phone || extratags.phone || null,
        website: extratags.website || extratags.url || null,
        opening_hours: extratags.opening_hours || null,
        facilities: ['Prayer Hall'],
        source: 'osm',
        osm_id: el.osm_id,
        osm_type: el.osm_type,
        verified: false
      };

      return res.json({
        success: true,
        mosque: mosque
      });
    }

    // If not an OSM ID, return 404 since we only use OSM
    return res.status(404).json({
      success: false,
      error: 'Mosque not found'
    });

  } catch (error) {
    console.error('[Mosque Finder] Get by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mosque details'
    });
  }
});

// ============================================================
// 4. GET STATS (Public)
// ============================================================
router.get('/stats/summary', async (req, res) => {
  try {
    // Since we only use OSM, we can't give exact stats
    // Return general info about the service
    res.json({
      success: true,
      stats: {
        message: 'This service uses OpenStreetMap data to find mosques.',
        source: 'OpenStreetMap (OSM)',
        coverage: 'Global',
        data_updated: 'Real-time from OSM'
      }
    });

  } catch (error) {
    console.error('[Mosque Finder] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

module.exports = router;