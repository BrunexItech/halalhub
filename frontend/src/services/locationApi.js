// frontend/src/services/locationApi.js

const API_BASE = 'https://kenyaareadata.vercel.app/api/areas';
const API_KEY = import.meta.env.VITE_KENYA_DATA_API_KEY || 'keyPub1569gsvndc123kg9sjhg';

// Cache to avoid repeated API calls
let cachedAreas = null;
let countiesCache = null;
let subCountiesCache = {};

/**
 * Fetch all Kenya area data (counties, sub-counties, wards)
 */
export const getAreas = async () => {
  if (cachedAreas) return cachedAreas;

  try {
    const response = await fetch(`${API_BASE}?apiKey=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch Kenya area data');
    const data = await response.json();
    cachedAreas = data;
    return data;
  } catch (error) {
    console.error('Error fetching area data:', error);
    throw error;
  }
};

/**
 * Fetch all Kenyan counties
 */
export const getCounties = async () => {
  if (countiesCache) return countiesCache;

  try {
    const areas = await getAreas();
    const counties = Object.keys(areas).map(name => ({
      id: name,
      name: name
    }));
    countiesCache = counties;
    return counties;
  } catch (error) {
    console.error('Error fetching counties:', error);
    throw error;
  }
};

/**
 * Fetch sub-counties for a specific county
 * @param {string} countyName - The name of the county
 */
export const getSubCounties = async (countyName) => {
  if (subCountiesCache[countyName]) return subCountiesCache[countyName];

  try {
    const areas = await getAreas();
    const county = areas[countyName];
    if (!county) {
      throw new Error(`County "${countyName}" not found`);
    }
    const subCounties = Object.keys(county).map(name => ({
      id: name,
      name: name
    }));
    subCountiesCache[countyName] = subCounties;
    return subCounties;
  } catch (error) {
    console.error(`Error fetching sub-counties for ${countyName}:`, error);
    throw error;
  }
};

/**
 * Fetch wards for a specific sub-county
 * @param {string} countyName - The name of the county
 * @param {string} subCountyName - The name of the sub-county
 */
export const getWards = async (countyName, subCountyName) => {
  try {
    const areas = await getAreas();
    const county = areas[countyName];
    if (!county) {
      throw new Error(`County "${countyName}" not found`);
    }
    const subCounty = county[subCountyName];
    if (!subCounty) {
      throw new Error(`Sub-county "${subCountyName}" not found in ${countyName}`);
    }
    return subCounty.map(name => ({
      id: name,
      name: name
    }));
  } catch (error) {
    console.error(`Error fetching wards for ${countyName}/${subCountyName}:`, error);
    throw error;
  }
};

/**
 * Clear all caches (useful for testing)
 */
export const clearLocationCache = () => {
  cachedAreas = null;
  countiesCache = null;
  subCountiesCache = {};
};

/**
 * Get county ID from name (for backward compatibility)
 * @param {string} countyName - The name of the county
 */
export const getCountyId = (countyName) => {
  return countyName;
};

/**
 * Get sub-county ID from name (for backward compatibility)
 * @param {string} subCountyName - The name of the sub-county
 */
export const getSubCountyId = (subCountyName) => {
  return subCountyName;
};

/**
 * Search counties by name
 * @param {string} query - Search query
 */
export const searchCounties = async (query) => {
  const counties = await getCounties();
  if (!query) return counties;
  const lowerQuery = query.toLowerCase();
  return counties.filter(c => c.name.toLowerCase().includes(lowerQuery));
};

/**
 * Search sub-counties by name within a county
 * @param {string} countyName - The name of the county
 * @param {string} query - Search query
 */
export const searchSubCounties = async (countyName, query) => {
  const subCounties = await getSubCounties(countyName);
  if (!query) return subCounties;
  const lowerQuery = query.toLowerCase();
  return subCounties.filter(s => s.name.toLowerCase().includes(lowerQuery));
};