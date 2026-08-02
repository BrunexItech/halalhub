const axios = require('axios');
require('dotenv').config();

/**
 * BANK CLIENT - Unified interface for bank operations
 * 
 * This file is the ONLY file that changes when switching from sandbox to live bank.
 * All other services call this client.
 * 
 * To go live: Change BANK_PROVIDER in .env from 'sandbox' to 'real'
 */

// ============================================================
// CONFIGURATION
// ============================================================

const BANK_PROVIDER = process.env.BANK_PROVIDER || 'sandbox';
const BANK_SANDBOX_URL = process.env.BANK_SANDBOX_URL || 'http://localhost:5000/api/bank';
const BANK_REAL_URL = process.env.BANK_REAL_URL || 'https://api.realbank.com/v1';
const BANK_API_KEY = process.env.BANK_API_KEY || '';
const BANK_API_SECRET = process.env.BANK_API_SECRET || '';

// Determine which URL to use
const BANK_URL = BANK_PROVIDER === 'real' ? BANK_REAL_URL : BANK_SANDBOX_URL;

console.log(`[Bank Client] Running in ${BANK_PROVIDER.toUpperCase()} mode`);
console.log(`[Bank Client] Bank URL: ${BANK_URL}`);

// ============================================================
// HTTP CLIENT
// ============================================================

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (BANK_PROVIDER === 'real' && BANK_API_KEY) {
    headers['Authorization'] = `Bearer ${BANK_API_KEY}`;
    if (BANK_API_SECRET) {
      headers['X-API-Secret'] = BANK_API_SECRET;
    }
  }

  return headers;
};

const bankRequest = async (method, endpoint, data = null) => {
  try {
    const url = `${BANK_URL}${endpoint}`;
    const headers = getHeaders();

    const config = {
      method,
      url,
      headers,
      timeout: 30000 // 30 second timeout
    };

    if (data && (method === 'post' || method === 'put')) {
      config.data = data;
    }

    if (data && method === 'get') {
      config.params = data;
    }

    const response = await axios(config);
    return response.data;

  } catch (error) {
    console.error(`[Bank Client] Error on ${method.toUpperCase()} ${endpoint}:`, error.message);

    if (error.response) {
      throw error.response.data;
    }

    throw {
      success: false,
      error: 'Bank service unavailable',
      message: error.message
    };
  }
};

// ============================================================
// 1. ACCOUNT MANAGEMENT
// ============================================================

/**
 * Create a virtual account for a user
 * @param {string} userId - User ID
 * @param {string} currency - Currency code (KES, USD, etc.)
 * @returns {Promise<Object>} Account details
 */
const createAccount = async (userId, currency = 'KES') => {
  return bankRequest('post', '/accounts', { userId, currency });
};

/**
 * Get account balance by account number
 * @param {string} accountNumber - Virtual account number
 * @returns {Promise<Object>} Balance info
 */
const getBalance = async (accountNumber) => {
  return bankRequest('get', `/accounts/${accountNumber}`);
};

/**
 * Get user's own account
 * @param {string} token - User's auth token
 * @returns {Promise<Object>} Account details
 */
const getMyAccount = async (token) => {
  // This endpoint requires authentication
  return bankRequest('get', '/my-account', null);
};

// ============================================================
// 2. DEPOSITS
// ============================================================

/**
 * Process a deposit (internal - called by webhook or admin)
 * @param {string} accountNumber - Destination account
 * @param {number} amount - Amount to deposit
 * @param {string} reference - Optional reference
 * @returns {Promise<Object>} Deposit result
 */
const deposit = async (accountNumber, amount, reference = null) => {
  return bankRequest('post', '/deposit', {
    accountNumber,
    amount,
    reference
  });
};

/**
 * Simulate a deposit via webhook (for testing)
 * @param {string} transactionId - Transaction ID
 * @param {string} status - Status (completed/failed)
 * @param {string} externalReference - Bank reference
 * @returns {Promise<Object>} Webhook result
 */
const simulateWebhook = async (transactionId, status, externalReference = null) => {
  return bankRequest('post', '/webhook', {
    transactionId,
    status,
    externalReference
  });
};

// ============================================================
// 3. TRANSFERS
// ============================================================

/**
 * Transfer money between accounts
 * @param {string} fromAccount - Source account number
 * @param {string} toAccount - Destination account number
 * @param {number} amount - Amount to transfer
 * @param {number} fee - Fee to deduct (optional)
 * @param {string} description - Description (optional)
 * @returns {Promise<Object>} Transfer result
 */
const transfer = async (fromAccount, toAccount, amount, fee = 0, description = '') => {
  return bankRequest('post', '/transfer', {
    fromAccount,
    toAccount,
    amount,
    fee,
    description
  });
};

// ============================================================
// 4. WITHDRAWALS
// ============================================================

/**
 * Withdraw money from a virtual account
 * @param {string} accountNumber - Source account
 * @param {number} amount - Amount to withdraw
 * @param {string} destination - Destination (M-Pesa number or bank account)
 * @param {string} destinationType - 'mpesa' or 'bank'
 * @param {string} token - User's auth token
 * @returns {Promise<Object>} Withdrawal result
 */
const withdraw = async (accountNumber, amount, destination, destinationType = 'mpesa', token = null) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return bankRequest('post', '/withdraw', {
    accountNumber,
    amount,
    destination,
    destinationType
  });
};

// ============================================================
// 5. TRANSACTION HISTORY
// ============================================================

/**
 * Get transaction history for an account
 * @param {string} accountNumber - Account number
 * @param {number} limit - Number of transactions to return
 * @param {string} token - User's auth token
 * @returns {Promise<Object>} Transaction list
 */
const getTransactions = async (accountNumber, limit = 50, token = null) => {
  const params = { accountNumber, limit };
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return bankRequest('get', '/transactions', params);
};

// ============================================================
// 6. ADMIN FUNCTIONS
// ============================================================

/**
 * Get all virtual accounts (Admin only)
 * @param {string} token - Admin auth token
 * @param {number} limit - Number of accounts
 * @returns {Promise<Object>} Account list
 */
const adminGetAccounts = async (token, limit = 100) => {
  const headers = { 'Authorization': `Bearer ${token}` };
  return bankRequest('get', '/admin/accounts', { limit });
};

/**
 * Get all bank transactions (Admin only)
 * @param {string} token - Admin auth token
 * @param {string} type - Filter by type (deposit/transfer/withdrawal)
 * @param {string} status - Filter by status
 * @param {number} limit - Number of transactions
 * @returns {Promise<Object>} Transaction list
 */
const adminGetTransactions = async (token, type = null, status = null, limit = 100) => {
  const headers = { 'Authorization': `Bearer ${token}` };
  const params = { type, status, limit };
  return bankRequest('get', '/admin/transactions', params);
};

// ============================================================
// 7. HEALTH CHECK
// ============================================================

/**
 * Check if bank service is healthy
 * @returns {Promise<Object>} Health status
 */
const healthCheck = async () => {
  try {
    // Try to get a simple response from the bank
    await bankRequest('get', '/health');
    return { success: true, status: 'healthy' };
  } catch (error) {
    return { success: false, status: 'unhealthy', error: error.message };
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Configuration
  BANK_PROVIDER,
  BANK_URL,

  // Account Management
  createAccount,
  getBalance,
  getMyAccount,

  // Deposits
  deposit,
  simulateWebhook,

  // Transfers
  transfer,

  // Withdrawals
  withdraw,

  // Transaction History
  getTransactions,

  // Admin Functions
  adminGetAccounts,
  adminGetTransactions,

  // Health Check
  healthCheck
};