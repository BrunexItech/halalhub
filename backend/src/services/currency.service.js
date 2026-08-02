/**
 * CURRENCY SERVICE
 * 
 * This service handles currency conversion for international users.
 * It maintains exchange rates and converts between currencies.
 * 
 * In sandbox mode, it uses mock/fixed rates.
 * In production, it would fetch live rates from an API.
 */

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_CURRENCY = process.env.BASE_CURRENCY || 'KES';
const SUPPORTED_CURRENCIES = (process.env.SUPPORTED_CURRENCIES || 'KES,USD,EUR,GBP').split(',');

// Exchange rate provider: 'mock' or 'live'
const EXCHANGE_PROVIDER = process.env.EXCHANGE_PROVIDER || 'mock';

// Real exchange rate API (when going live)
const EXCHANGE_API_URL = process.env.EXCHANGE_API_URL || 'https://api.exchangerate-api.com/v4/latest';
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY || '';

// ============================================================
// MOCK EXCHANGE RATES (Sandbox Mode)
// ============================================================

const MOCK_RATES = {
  USD: 150,    // 1 USD = 150 KES
  EUR: 165,    // 1 EUR = 165 KES
  GBP: 190,    // 1 GBP = 190 KES
  KES: 1,      // 1 KES = 1 KES
  UGX: 0.04,   // 1 UGX = 0.04 KES (25 UGX = 1 KES)
  TZS: 0.06,   // 1 TZS = 0.06 KES (16.67 TZS = 1 KES)
  RWF: 0.12,   // 1 RWF = 0.12 KES (8.33 RWF = 1 KES)
  NGN: 0.10,   // 1 NGN = 0.10 KES (10 NGN = 1 KES)
  ZAR: 8.00,   // 1 ZAR = 8.00 KES
  SAR: 40.00,  // 1 SAR = 40.00 KES
  AED: 41.00   // 1 AED = 41.00 KES
};

// ============================================================
// CACHE
// ============================================================

let cachedRates = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// ============================================================
// RATE FETCHING
// ============================================================

/**
 * Get exchange rates
 * Fetches from API if live mode, otherwise uses mock rates
 */
const getRates = async () => {
  // Check cache
  if (cachedRates && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedRates;
  }

  if (EXCHANGE_PROVIDER === 'live') {
    try {
      const rates = await fetchLiveRates();
      cachedRates = rates;
      cacheTimestamp = Date.now();
      return rates;
    } catch (error) {
      console.error('[Currency Service] Live rate fetch failed, using fallback rates:', error.message);
      return getFallbackRates();
    }
  }

  // Mock mode
  return getMockRates();
};

/**
 * Get mock exchange rates
 */
const getMockRates = () => {
  return { ...MOCK_RATES };
};

/**
 * Get fallback rates (when live API fails)
 */
const getFallbackRates = () => {
  return { ...MOCK_RATES };
};

/**
 * Fetch live exchange rates from API
 */
const fetchLiveRates = async () => {
  const axios = require('axios');
  
  // Try to get rates from API
  let response;
  
  if (EXCHANGE_API_KEY) {
    response = await axios.get(`${EXCHANGE_API_URL}/latest/${BASE_CURRENCY}`, {
      headers: { 'Authorization': `Bearer ${EXCHANGE_API_KEY}` }
    });
  } else {
    // Free tier (no API key required)
    response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`);
  }

  if (!response.data || !response.data.rates) {
    throw new Error('Invalid response from exchange rate API');
  }

  // Filter only supported currencies
  const rates = {};
  SUPPORTED_CURRENCIES.forEach(currency => {
    rates[currency] = response.data.rates[currency] || 1;
  });

  // Ensure BASE_CURRENCY is always 1
  rates[BASE_CURRENCY] = 1;

  console.log('[Currency Service] Live rates fetched successfully');
  return rates;
};

// ============================================================
// CONVERSION FUNCTIONS
// ============================================================

/**
 * Convert amount from one currency to another
 * 
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code (USD, KES, etc.)
 * @param {string} toCurrency - Target currency code (USD, KES, etc.)
 * @returns {Promise<number>} Converted amount
 * 
 * Example:
 *   convert(100, 'USD', 'KES') -> 15000 (if 1 USD = 150 KES)
 */
const convert = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getRates();

  // First, convert fromCurrency to base currency
  const fromRate = rates[fromCurrency];
  if (!fromRate) {
    throw new Error(`Currency not supported: ${fromCurrency}`);
  }

  // Then, convert base currency to toCurrency
  const toRate = rates[toCurrency];
  if (!toRate) {
    throw new Error(`Currency not supported: ${toCurrency}`);
  }

  // Conversion calculation
  // amount in fromCurrency -> convert to base -> convert to toCurrency
  const baseAmount = amount / fromRate;
  const convertedAmount = baseAmount * toRate;

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert amount from KES to target currency
 */
const convertFromKES = async (amount, toCurrency) => {
  return convert(amount, 'KES', toCurrency);
};

/**
 * Convert amount to KES from source currency
 */
const convertToKES = async (amount, fromCurrency) => {
  return convert(amount, fromCurrency, 'KES');
};

/**
 * Format currency amount with symbol
 * 
 * @param {number} amount - The amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount with currency symbol
 */
const formatCurrency = (amount, currency) => {
  const symbols = {
    KES: 'KES',
    USD: '$',
    EUR: '€',
    GBP: '£',
    UGX: 'UGX',
    TZS: 'TSh',
    RWF: 'RF',
    NGN: '₦',
    ZAR: 'R',
    SAR: '﷼',
    AED: 'د.إ'
  };

  const symbol = symbols[currency] || currency;
  return `${symbol} ${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

// ============================================================
// SUPPORTED CURRENCIES
// ============================================================

/**
 * Get list of supported currencies
 */
const getSupportedCurrencies = () => {
  return SUPPORTED_CURRENCIES;
};

/**
 * Check if a currency is supported
 */
const isCurrencySupported = (currency) => {
  return SUPPORTED_CURRENCIES.includes(currency);
};

/**
 * Get currency display name
 */
const getCurrencyDisplayName = (currency) => {
  const names = {
    KES: 'Kenyan Shilling',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    UGX: 'Ugandan Shilling',
    TZS: 'Tanzanian Shilling',
    RWF: 'Rwandan Franc',
    NGN: 'Nigerian Naira',
    ZAR: 'South African Rand',
    SAR: 'Saudi Riyal',
    AED: 'UAE Dirham'
  };
  return names[currency] || currency;
};

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

/**
 * Update exchange rates manually (Admin only)
 */
const updateRates = async (newRates) => {
  // In mock mode, we can update the rates in memory
  if (EXCHANGE_PROVIDER === 'mock') {
    Object.keys(newRates).forEach(currency => {
      if (MOCK_RATES[currency] !== undefined) {
        MOCK_RATES[currency] = newRates[currency];
      }
    });
    cachedRates = null; // Clear cache
    console.log('[Currency Service] Rates updated manually');
    return { success: true, message: 'Rates updated successfully' };
  }

  // In live mode, we would need to use the API
  throw new Error('Cannot manually update rates when using live provider');
};

/**
 * Get current exchange rate for a currency pair
 */
const getRate = async (fromCurrency, toCurrency) => {
  const rates = await getRates();
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) {
    throw new Error(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
  }

  // Rate = toCurrency per 1 fromCurrency
  return toRate / fromRate;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Conversion
  convert,
  convertFromKES,
  convertToKES,
  formatCurrency,

  // Rates
  getRates,
  getRate,
  updateRates,

  // Currency info
  getSupportedCurrencies,
  isCurrencySupported,
  getCurrencyDisplayName,

  // Constants
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES
};