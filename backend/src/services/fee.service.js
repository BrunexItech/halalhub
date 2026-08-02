/**
 * FEE SERVICE
 * 
 * This service calculates transaction fees for all platform transactions.
 * Fees are deducted from the transaction amount and go to the HalalHub master account.
 * 
 * Fee Structure:
 * - Transaction Fee: 1% of transaction amount (configurable)
 * - Withdrawal Fee: 0.5% of withdrawal amount (configurable)
 * - Minimum Fee: KES 10 (configurable)
 * - Maximum Fee: KES 500 (configurable)
 */

// ============================================================
// CONFIGURATION
// ============================================================

// Fee percentages (as decimals)
const TRANSACTION_FEE_PERCENT = parseFloat(process.env.TRANSACTION_FEE_PERCENT || 1.0) / 100; // 1%
const WITHDRAWAL_FEE_PERCENT = parseFloat(process.env.WITHDRAWAL_FEE_PERCENT || 0.5) / 100; // 0.5%
const CROSS_BORDER_FEE_PERCENT = parseFloat(process.env.CROSS_BORDER_FEE_PERCENT || 2.0) / 100; // 2%

// Fee limits
const MINIMUM_FEE = parseInt(process.env.MINIMUM_FEE || 10); // KES 10 minimum
const MAXIMUM_FEE = parseInt(process.env.MAXIMUM_FEE || 500); // KES 500 maximum

// Master account for fees
const MASTER_ACCOUNT = process.env.BANK_MASTER_ACCOUNT || 'HALALHUB_MASTER';

// ============================================================
// FEE CALCULATIONS
// ============================================================

/**
 * Calculate transaction fee
 * 
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type: 'payment', 'withdrawal', 'transfer', 'cross_border'
 * @param {string} currency - Currency code (KES, USD, etc.)
 * @param {number} customRate - Optional custom fee rate (as decimal)
 * @returns {Object} Fee breakdown
 * 
 * Example:
 *   calculateFee(5000, 'payment', 'KES')
 *   Returns: { fee: 50, rate: 0.01, minFee: 10, maxFee: 500, appliedFee: 50 }
 */
const calculateFee = (amount, type = 'payment', currency = 'KES', customRate = null) => {
  if (amount <= 0) {
    return {
      fee: 0,
      rate: 0,
      minFee: MINIMUM_FEE,
      maxFee: MAXIMUM_FEE,
      appliedFee: 0,
      currency: currency
    };
  }

  // Determine fee rate based on transaction type
  let rate = customRate;

  if (rate === null) {
    switch (type) {
      case 'payment':
      case 'transfer':
        rate = TRANSACTION_FEE_PERCENT;
        break;
      case 'withdrawal':
        rate = WITHDRAWAL_FEE_PERCENT;
        break;
      case 'cross_border':
        rate = CROSS_BORDER_FEE_PERCENT;
        break;
      default:
        rate = TRANSACTION_FEE_PERCENT;
        break;
    }
  }

  // Calculate raw fee
  let fee = amount * rate;

  // Apply minimum fee
  if (fee < MINIMUM_FEE && fee > 0) {
    fee = MINIMUM_FEE;
  }

  // Apply maximum fee
  if (fee > MAXIMUM_FEE) {
    fee = MAXIMUM_FEE;
  }

  // Round to nearest whole number
  fee = Math.round(fee);

  return {
    fee: fee,
    rate: rate,
    minFee: MINIMUM_FEE,
    maxFee: MAXIMUM_FEE,
    appliedFee: fee,
    currency: currency,
    originalAmount: amount,
    netAmount: amount - fee
  };
};

/**
 * Calculate transaction fee for a payment
 * 
 * @param {number} amount - Payment amount
 * @param {string} currency - Currency code
 * @returns {Object} Fee breakdown
 */
const calculatePaymentFee = (amount, currency = 'KES') => {
  return calculateFee(amount, 'payment', currency);
};

/**
 * Calculate withdrawal fee
 * 
 * @param {number} amount - Withdrawal amount
 * @param {string} currency - Currency code
 * @returns {Object} Fee breakdown
 */
const calculateWithdrawalFee = (amount, currency = 'KES') => {
  return calculateFee(amount, 'withdrawal', currency);
};

/**
 * Calculate cross-border transaction fee
 * 
 * @param {number} amount - Transaction amount
 * @param {string} currency - Currency code
 * @returns {Object} Fee breakdown
 */
const calculateCrossBorderFee = (amount, currency = 'KES') => {
  return calculateFee(amount, 'cross_border', currency);
};

/**
 * Calculate P2P transfer fee
 * 
 * @param {number} amount - Transfer amount
 * @param {string} currency - Currency code
 * @returns {Object} Fee breakdown
 */
const calculateTransferFee = (amount, currency = 'KES') => {
  // P2P transfers use standard transaction fee
  return calculateFee(amount, 'transfer', currency);
};

// ============================================================
// TRANSACTION FEE (General platform transaction)
// ============================================================

/**
 * Calculate transaction fee for platform transactions
 * Used for: Takaful, Pension, Utilities, Bookings, Orders
 * 
 * @param {number} amount - Transaction amount
 * @param {string} currency - Currency code
 * @returns {Object} Fee breakdown
 */
const calculateTransactionFee = (amount, currency = 'KES') => {
  const result = calculateFee(amount, 'payment', currency);
  return result.fee; // Returns 30 (a number)
};

// ============================================================
// FEE VALIDATION
// ============================================================

/**
 * Validate if a transaction meets minimum requirements
 * 
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type
 * @param {string} currency - Currency code
 * @returns {Object} Validation result
 */
const validateTransaction = (amount, type = 'payment', currency = 'KES') => {
  const minAmount = 1; // Minimum 1 KES
  const maxAmount = 1000000; // Maximum 1,000,000 KES

  if (amount < minAmount) {
    return {
      valid: false,
      error: `Minimum transaction amount is ${minAmount} ${currency}`
    };
  }

  if (amount > maxAmount) {
    return {
      valid: false,
      error: `Maximum transaction amount is ${maxAmount} ${currency}`
    };
  }

  return {
    valid: true,
    error: null
  };
};

// ============================================================
// FEE SUMMARY
// ============================================================

/**
 * Get fee summary for display
 * 
 * @returns {Object} Fee configuration summary
 */
const getFeeSummary = () => {
  return {
    transactionFeePercent: TRANSACTION_FEE_PERCENT * 100,
    withdrawalFeePercent: WITHDRAWAL_FEE_PERCENT * 100,
    crossBorderFeePercent: CROSS_BORDER_FEE_PERCENT * 100,
    minimumFee: MINIMUM_FEE,
    maximumFee: MAXIMUM_FEE,
    masterAccount: MASTER_ACCOUNT
  };
};

/**
 * Calculate fees for multiple transactions (bulk)
 */
const calculateBulkFees = (transactions) => {
  return transactions.map(tx => {
    return calculateFee(tx.amount, tx.type, tx.currency);
  });
};

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

/**
 * Update fee configuration (Admin only)
 * 
 * Note: In production, these would be stored in database.
 * For now, they are controlled by environment variables.
 */
const updateFeeConfig = (config) => {
  // This is a placeholder for when we move fees to database
  // For now, just return the current config
  return getFeeSummary();
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Main calculator
  calculateFee,

  // Specific fee calculators
  calculatePaymentFee,
  calculateWithdrawalFee,
  calculateCrossBorderFee,
  calculateTransferFee,
  calculateTransactionFee, // ← NEW: General transaction fee

  // Validation
  validateTransaction,

  // Summary
  getFeeSummary,
  calculateBulkFees,

  // Admin
  updateFeeConfig,

  // Constants
  TRANSACTION_FEE_PERCENT,
  WITHDRAWAL_FEE_PERCENT,
  CROSS_BORDER_FEE_PERCENT,
  MINIMUM_FEE,
  MAXIMUM_FEE,
  MASTER_ACCOUNT
};