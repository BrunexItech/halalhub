const { Client } = require('pg');
const bankClient = require('./bank-client');
const feeService = require('./fee.service');

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
// ACCOUNT MANAGEMENT
// ============================================================

/**
 * Get or create virtual account for a user
 */
const getOrCreateAccount = async (userId, currency = 'KES') => {
  const db = await getClient();

  let account = await db.query(
    `SELECT * FROM virtual_accounts WHERE user_id = $1 AND is_active = true`,
    [userId]
  );

  if (account.rows.length > 0) {
    return account.rows[0];
  }

  // Create new account
  const bankResponse = await bankClient.createAccount(userId, currency);

  if (!bankResponse.success) {
    throw new Error('Failed to create bank account');
  }

  // Account already created in database by bank-sandbox.js
  // But if it failed to save, create it here
  const existing = await db.query(
    'SELECT * FROM virtual_accounts WHERE account_number = $1',
    [bankResponse.data.accountNumber]
  );

  if (existing.rows.length === 0) {
    // Fallback: create in our database
    const accountId = 'vact-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
    await db.query(
      `INSERT INTO virtual_accounts (
        id, user_id, account_number, currency, balance, is_active, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [accountId, userId, bankResponse.data.accountNumber, currency, 0, true]
    );

    account = await db.query(
      'SELECT * FROM virtual_accounts WHERE account_number = $1',
      [bankResponse.data.accountNumber]
    );
  } else {
    account = existing;
  }

  return account.rows[0];
};

/**
 * Get user's virtual account
 */
const getUserAccount = async (userId) => {
  const db = await getClient();

  const result = await db.query(
    `SELECT id, user_id, account_number, currency, balance, is_active, createdat, updatedat
     FROM virtual_accounts
     WHERE user_id = $1 AND is_active = true`,
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Get account by account number
 */
const getAccountByNumber = async (accountNumber) => {
  const db = await getClient();

  const result = await db.query(
    `SELECT va.*, u.fullname as user_name, u.phone as user_phone, u.email as user_email
     FROM virtual_accounts va
     JOIN users u ON va.user_id = u.id
     WHERE va.account_number = $1 AND va.is_active = true`,
    [accountNumber]
  );

  return result.rows[0] || null;
};

/**
 * Get user's balance (from our database cache)
 */
const getUserBalance = async (userId) => {
  const account = await getUserAccount(userId);

  if (!account) {
    return { success: false, error: 'Account not found', balance: 0 };
  }

  return {
    success: true,
    balance: account.balance,
    currency: account.currency,
    accountNumber: account.account_number
  };
};

// ============================================================
// TRANSACTIONS
// ============================================================

/**
 * Record a transaction in our database
 */
const recordTransaction = async (data) => {
  const db = await getClient();

  const {
    reference,
    fromAccount,
    toAccount,
    amount,
    fee = 0,
    type,
    status = 'pending',
    externalReference = null,
    description = ''
  } = data;

  const txId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');

  await db.query(
    `INSERT INTO bank_transactions (
      id, reference, from_account, to_account, amount, fee, type, status, description, external_reference, createdat, updatedat
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
    [txId, reference, fromAccount, toAccount, amount, fee, type, status, description, externalReference]
  );

  return { id: txId, reference, status };
};

/**
 * Get transaction history for user
 */
const getUserTransactions = async (userId, limit = 50) => {
  const db = await getClient();

  const account = await getUserAccount(userId);

  if (!account) {
    return { success: false, error: 'Account not found', transactions: [] };
  }

  const result = await db.query(
    `SELECT 
      id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat
     FROM bank_transactions
     WHERE from_account = $1 OR to_account = $1
     ORDER BY createdat DESC
     LIMIT $2`,
    [account.account_number, limit]
  );

  return {
    success: true,
    transactions: result.rows,
    total: result.rows.length
  };
};

/**
 * Get transaction by reference
 */
const getTransactionByReference = async (reference) => {
  const db = await getClient();

  const result = await db.query(
    `SELECT 
      bt.*,
      va_from.account_number as from_account_number,
      va_to.account_number as to_account_number,
      u_from.fullname as from_user_name,
      u_to.fullname as to_user_name
     FROM bank_transactions bt
     LEFT JOIN virtual_accounts va_from ON bt.from_account = va_from.account_number
     LEFT JOIN users u_from ON va_from.user_id = u_from.id
     LEFT JOIN virtual_accounts va_to ON bt.to_account = va_to.account_number
     LEFT JOIN users u_to ON va_to.user_id = u_to.id
     WHERE bt.reference = $1`,
    [reference]
  );

  return result.rows[0] || null;
};

// ============================================================
// DEPOSITS
// ============================================================

/**
 * Process a deposit
 */
const processDeposit = async (accountNumber, amount, reference = null) => {
  const db = await getClient();

  // Call bank to process deposit
  const bankResponse = await bankClient.deposit(accountNumber, amount, reference);

  if (!bankResponse.success) {
    throw new Error(bankResponse.error || 'Deposit failed');
  }

  // Update our local balance
  await db.query(
    `UPDATE virtual_accounts
     SET balance = $1, updatedat = NOW()
     WHERE account_number = $2`,
    [bankResponse.data.newBalance, accountNumber]
  );

  return bankResponse;
};

// ============================================================
// TRANSFERS
// ============================================================

/**
 * Process a transfer between accounts
 */
const processTransfer = async (userId, fromAccount, toAccount, amount, description = '') => {
  const db = await getClient();

  // Check if user owns the fromAccount
  const accountCheck = await db.query(
    'SELECT id FROM virtual_accounts WHERE account_number = $1 AND user_id = $2 AND is_active = true',
    [fromAccount, userId]
  );

  if (accountCheck.rows.length === 0) {
    throw new Error('You do not own this account');
  }

  // Calculate fee
  const fee = feeService.calculateTransactionFee(amount);

  // Call bank to process transfer
  const bankResponse = await bankClient.transfer(fromAccount, toAccount, amount, fee, description);

  if (!bankResponse.success) {
    throw new Error(bankResponse.error || 'Transfer failed');
  }

  // Update our local balance
  await db.query(
    `UPDATE virtual_accounts
     SET balance = $1, updatedat = NOW()
     WHERE account_number = $2`,
    [bankResponse.data.newBalance, fromAccount]
  );

  // Record fee transaction (if fee > 0)
  if (fee > 0) {
    const feeTxId = 'btxn-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
    const feeRef = 'FEE-' + Date.now().toString(36).toUpperCase() + require('crypto').randomBytes(4).toString('hex').toUpperCase();

    await db.query(
      `INSERT INTO bank_transactions (
        id, reference, from_account, to_account, amount, fee, type, status, description, completed_at, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())`,
      [feeTxId, feeRef, fromAccount, process.env.BANK_MASTER_ACCOUNT || 'HALALHUB_MASTER', fee, 0, 'fee', 'completed', 'Transaction fee']
    );
  }

  return bankResponse;
};

// ============================================================
// WITHDRAWALS
// ============================================================

/**
 * Process a withdrawal
 */
const processWithdrawal = async (userId, accountNumber, amount, destination, destinationType = 'mpesa') => {
  const db = await getClient();

  // Check if user owns the account
  const accountCheck = await db.query(
    'SELECT id, balance FROM virtual_accounts WHERE account_number = $1 AND user_id = $2 AND is_active = true',
    [accountNumber, userId]
  );

  if (accountCheck.rows.length === 0) {
    throw new Error('Account not found');
  }

  const account = accountCheck.rows[0];

  // Check if user has enough balance
  if (account.balance < amount) {
    throw new Error(`Insufficient balance. Available: ${account.balance}`);
  }

  // Call bank to process withdrawal
  const bankResponse = await bankClient.withdraw(accountNumber, amount, destination, destinationType);

  if (!bankResponse.success) {
    throw new Error(bankResponse.error || 'Withdrawal failed');
  }

  // Update our local balance
  await db.query(
    `UPDATE virtual_accounts
     SET balance = $1, updatedat = NOW()
     WHERE account_number = $2`,
    [bankResponse.data.newBalance, accountNumber]
  );

  return bankResponse;
};

// ============================================================
// WEBHOOK HANDLING
// ============================================================

/**
 * Handle bank webhook
 */
const handleWebhook = async (transactionId, status, externalReference = null) => {
  const db = await getClient();

  // Update transaction status
  await db.query(
    `UPDATE bank_transactions
     SET status = $1, 
         external_reference = COALESCE($2, external_reference),
         completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
         updatedat = NOW()
     WHERE id = $3`,
    [status, externalReference, transactionId]
  );

  // If transaction is a transfer or deposit, update account balances
  const txResult = await db.query(
    `SELECT * FROM bank_transactions WHERE id = $1`,
    [transactionId]
  );

  if (txResult.rows.length > 0 && status === 'completed') {
    const tx = txResult.rows[0];

    if (tx.type === 'deposit' && tx.to_account) {
      // Update balance for deposit
      await db.query(
        `UPDATE virtual_accounts
         SET balance = balance + $1, updatedat = NOW()
         WHERE account_number = $2`,
        [tx.amount, tx.to_account]
      );
    }

    if (tx.type === 'transfer' && tx.from_account && tx.to_account) {
      // For transfers, balances are already updated during the transfer request
      // But we can double-check here
      // This ensures consistency if webhook arrives before transfer completes
    }

    if (tx.type === 'withdrawal' && tx.from_account) {
      // For withdrawals, balances are already updated during the withdrawal request
    }
  }

  // Record webhook
  const webhookId = 'whk-' + Date.now().toString(36) + require('crypto').randomBytes(4).toString('hex');
  await db.query(
    `INSERT INTO bank_webhooks (id, transaction_id, payload, processed, processed_at, createdat)
     VALUES ($1, $2, $3, true, NOW(), NOW())`,
    [webhookId, transactionId, { transactionId, status, externalReference }]
  );

  return { success: true, transactionId, status };
};

// ============================================================
// RECONCILIATION
// ============================================================

/**
 * Sync user balance with bank (reconciliation)
 */
const syncWithBank = async (userId) => {
  const db = await getClient();

  const account = await getUserAccount(userId);

  if (!account) {
    throw new Error('Account not found');
  }

  // Get balance from bank
  const bankResponse = await bankClient.getBalance(account.account_number);

  if (!bankResponse.success) {
    throw new Error(bankResponse.error || 'Failed to fetch bank balance');
  }

  const bankBalance = bankResponse.data.balance;

  // If our balance differs, update it
  if (account.balance !== bankBalance) {
    await db.query(
      `UPDATE virtual_accounts
       SET balance = $1, updatedat = NOW()
       WHERE id = $2`,
      [bankBalance, account.id]
    );

    console.log(`[Virtual Account] Synced user ${userId}: ${account.balance} -> ${bankBalance}`);
  }

  return {
    success: true,
    ourBalance: account.balance,
    bankBalance: bankBalance,
    isSynced: account.balance === bankBalance,
    accountNumber: account.account_number
  };
};

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

/**
 * Get all accounts (Admin only)
 */
const adminGetAllAccounts = async (limit = 100) => {
  const db = await getClient();

  const result = await db.query(`
    SELECT 
      va.*,
      u.fullname as user_name,
      u.phone as user_phone,
      u.email as user_email
    FROM virtual_accounts va
    JOIN users u ON va.user_id = u.id
    ORDER BY va.createdat DESC
    LIMIT $1
  `, [limit]);

  const totalResult = await db.query(
    'SELECT SUM(balance) as total_balance FROM virtual_accounts WHERE is_active = true'
  );

  return {
    accounts: result.rows,
    totalAccounts: result.rows.length,
    totalBalance: parseInt(totalResult.rows[0].total_balance) || 0
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Account Management
  getOrCreateAccount,
  getUserAccount,
  getAccountByNumber,
  getUserBalance,

  // Transactions
  recordTransaction,
  getUserTransactions,
  getTransactionByReference,

  // Deposits
  processDeposit,

  // Transfers
  processTransfer,

  // Withdrawals
  processWithdrawal,

  // Webhook
  handleWebhook,

  // Reconciliation
  syncWithBank,

  // Admin
  adminGetAllAccounts
};