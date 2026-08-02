/**
 * WEBHOOK HANDLER
 * 
 * This file processes all callbacks from the bank/PSP.
 * When the bank completes a transaction, they call our webhook endpoint.
 * This handler updates our database accordingly.
 * 
 * In production, this would be called by the real bank's webhook system.
 * In sandbox mode, it's called by bank-sandbox.js or manually for testing.
 */

const virtualAccountService = require('./virtual-account.service');

// ============================================================
// WEBHOOK EVENTS
// ============================================================

const EVENT_TYPES = {
  DEPOSIT_COMPLETED: 'deposit.completed',
  DEPOSIT_FAILED: 'deposit.failed',
  TRANSFER_COMPLETED: 'transfer.completed',
  TRANSFER_FAILED: 'transfer.failed',
  WITHDRAWAL_COMPLETED: 'withdrawal.completed',
  WITHDRAWAL_FAILED: 'withdrawal.failed',
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_BLOCKED: 'account.blocked',
  ACCOUNT_UNBLOCKED: 'account.unblocked'
};

// ============================================================
// MAIN WEBHOOK HANDLER
// ============================================================

/**
 * Main webhook handler - entry point for all bank callbacks
 * 
 * @param {Object} payload - The webhook payload from the bank
 * @param {string} eventType - The type of event (deposit.completed, transfer.completed, etc.)
 * @param {string} signature - Optional signature for verification (production)
 * @returns {Promise<Object>} Processing result
 */
const handleWebhook = async (payload, eventType, signature = null) => {
  console.log(`[Webhook Handler] Received event: ${eventType}`);

  // In production, verify signature
  if (signature) {
    const isValid = verifySignature(payload, signature);
    if (!isValid) {
      console.error('[Webhook Handler] Invalid signature');
      throw new Error('Invalid webhook signature');
    }
  }

  switch (eventType) {
    case EVENT_TYPES.DEPOSIT_COMPLETED:
      return handleDepositCompleted(payload);
    
    case EVENT_TYPES.DEPOSIT_FAILED:
      return handleDepositFailed(payload);
    
    case EVENT_TYPES.TRANSFER_COMPLETED:
      return handleTransferCompleted(payload);
    
    case EVENT_TYPES.TRANSFER_FAILED:
      return handleTransferFailed(payload);
    
    case EVENT_TYPES.WITHDRAWAL_COMPLETED:
      return handleWithdrawalCompleted(payload);
    
    case EVENT_TYPES.WITHDRAWAL_FAILED:
      return handleWithdrawalFailed(payload);
    
    case EVENT_TYPES.ACCOUNT_CREATED:
      return handleAccountCreated(payload);
    
    default:
      console.warn(`[Webhook Handler] Unknown event type: ${eventType}`);
      return { success: false, message: 'Unknown event type', eventType };
  }
};

// ============================================================
// DEPOSIT HANDLERS
// ============================================================

/**
 * Handle deposit completed event
 * 
 * Called when: Bank receives money from user's M-Pesa/Bank account
 * What it does: Updates user's virtual account balance
 */
const handleDepositCompleted = async (payload) => {
  console.log('[Webhook Handler] Processing deposit.completed');

  try {
    const {
      transactionId,
      accountNumber,
      amount,
      reference,
      externalReference,
      completedAt
    } = payload;

    if (!transactionId || !accountNumber || !amount) {
      throw new Error('Missing required fields: transactionId, accountNumber, amount');
    }

    // Call service to process the deposit
    const result = await virtualAccountService.processDeposit(
      accountNumber,
      amount,
      reference
    );

    console.log(`[Webhook Handler] Deposit completed: ${reference} - ${amount} to ${accountNumber}`);

    return {
      success: true,
      message: 'Deposit processed successfully',
      data: {
        transactionId,
        accountNumber,
        amount,
        reference,
        externalReference,
        completedAt,
        newBalance: result.data.newBalance
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Deposit completed error:', error.message);
    return {
      success: false,
      message: 'Failed to process deposit',
      error: error.message
    };
  }
};

/**
 * Handle deposit failed event
 */
const handleDepositFailed = async (payload) => {
  console.log('[Webhook Handler] Processing deposit.failed');

  try {
    const {
      transactionId,
      accountNumber,
      amount,
      reference,
      failureReason
    } = payload;

    // Update transaction status to failed
    await virtualAccountService.recordTransaction({
      reference: reference || transactionId,
      fromAccount: null,
      toAccount: accountNumber,
      amount: amount,
      type: 'deposit',
      status: 'failed',
      description: `Deposit failed: ${failureReason || 'Unknown reason'}`
    });

    console.log(`[Webhook Handler] Deposit failed: ${reference} - ${amount} to ${accountNumber}`);

    return {
      success: true,
      message: 'Deposit failure recorded',
      data: {
        transactionId,
        accountNumber,
        amount,
        reference,
        failureReason
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Deposit failed error:', error.message);
    return {
      success: false,
      message: 'Failed to process deposit failure',
      error: error.message
    };
  }
};

// ============================================================
// TRANSFER HANDLERS
// ============================================================

/**
 * Handle transfer completed event
 * 
 * Called when: Bank moves money from one account to another
 * What it does: Updates both sender and receiver balances
 */
const handleTransferCompleted = async (payload) => {
  console.log('[Webhook Handler] Processing transfer.completed');

  try {
    const {
      transactionId,
      fromAccount,
      toAccount,
      amount,
      fee,
      reference,
      externalReference,
      completedAt
    } = payload;

    if (!transactionId || !fromAccount || !toAccount || !amount) {
      throw new Error('Missing required fields: transactionId, fromAccount, toAccount, amount');
    }

    // Update transaction status to completed
    await virtualAccountService.recordTransaction({
      reference: reference || transactionId,
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      fee: fee || 0,
      type: 'transfer',
      status: 'completed',
      description: `Transfer from ${fromAccount} to ${toAccount}`
    });

    console.log(`[Webhook Handler] Transfer completed: ${reference} - ${amount} from ${fromAccount} to ${toAccount}`);

    return {
      success: true,
      message: 'Transfer completed',
      data: {
        transactionId,
        fromAccount,
        toAccount,
        amount,
        fee,
        reference,
        externalReference,
        completedAt
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Transfer completed error:', error.message);
    return {
      success: false,
      message: 'Failed to process transfer',
      error: error.message
    };
  }
};

/**
 * Handle transfer failed event
 */
const handleTransferFailed = async (payload) => {
  console.log('[Webhook Handler] Processing transfer.failed');

  try {
    const {
      transactionId,
      fromAccount,
      toAccount,
      amount,
      reference,
      failureReason
    } = payload;

    // Update transaction status to failed
    await virtualAccountService.recordTransaction({
      reference: reference || transactionId,
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      type: 'transfer',
      status: 'failed',
      description: `Transfer failed: ${failureReason || 'Unknown reason'}`
    });

    console.log(`[Webhook Handler] Transfer failed: ${reference} - ${amount} from ${fromAccount} to ${toAccount}`);

    return {
      success: true,
      message: 'Transfer failure recorded',
      data: {
        transactionId,
        fromAccount,
        toAccount,
        amount,
        reference,
        failureReason
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Transfer failed error:', error.message);
    return {
      success: false,
      message: 'Failed to process transfer failure',
      error: error.message
    };
  }
};

// ============================================================
// WITHDRAWAL HANDLERS
// ============================================================

/**
 * Handle withdrawal completed event
 * 
 * Called when: Bank sends money to user's M-Pesa/Bank account
 * What it does: Updates user's virtual account balance
 */
const handleWithdrawalCompleted = async (payload) => {
  console.log('[Webhook Handler] Processing withdrawal.completed');

  try {
    const {
      transactionId,
      accountNumber,
      amount,
      destination,
      destinationType,
      reference,
      externalReference,
      completedAt
    } = payload;

    if (!transactionId || !accountNumber || !amount) {
      throw new Error('Missing required fields: transactionId, accountNumber, amount');
    }

    // Update transaction status to completed
    await virtualAccountService.recordTransaction({
      reference: reference || transactionId,
      fromAccount: accountNumber,
      toAccount: destination,
      amount: amount,
      type: 'withdrawal',
      status: 'completed',
      description: `Withdrawal to ${destinationType}: ${destination}`
    });

    console.log(`[Webhook Handler] Withdrawal completed: ${reference} - ${amount} from ${accountNumber} to ${destination}`);

    return {
      success: true,
      message: 'Withdrawal completed',
      data: {
        transactionId,
        accountNumber,
        amount,
        destination,
        destinationType,
        reference,
        externalReference,
        completedAt
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Withdrawal completed error:', error.message);
    return {
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    };
  }
};

/**
 * Handle withdrawal failed event
 */
const handleWithdrawalFailed = async (payload) => {
  console.log('[Webhook Handler] Processing withdrawal.failed');

  try {
    const {
      transactionId,
      accountNumber,
      amount,
      destination,
      reference,
      failureReason
    } = payload;

    // Update transaction status to failed
    await virtualAccountService.recordTransaction({
      reference: reference || transactionId,
      fromAccount: accountNumber,
      toAccount: destination,
      amount: amount,
      type: 'withdrawal',
      status: 'failed',
      description: `Withdrawal failed: ${failureReason || 'Unknown reason'}`
    });

    console.log(`[Webhook Handler] Withdrawal failed: ${reference} - ${amount} from ${accountNumber}`);

    return {
      success: true,
      message: 'Withdrawal failure recorded',
      data: {
        transactionId,
        accountNumber,
        amount,
        destination,
        reference,
        failureReason
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Withdrawal failed error:', error.message);
    return {
      success: false,
      message: 'Failed to process withdrawal failure',
      error: error.message
    };
  }
};

// ============================================================
// ACCOUNT HANDLERS
// ============================================================

/**
 * Handle account created event
 */
const handleAccountCreated = async (payload) => {
  console.log('[Webhook Handler] Processing account.created');

  try {
    const {
      accountNumber,
      userId,
      currency,
      createdAt
    } = payload;

    console.log(`[Webhook Handler] Account created: ${accountNumber} for user ${userId}`);

    return {
      success: true,
      message: 'Account creation recorded',
      data: {
        accountNumber,
        userId,
        currency,
        createdAt
      }
    };

  } catch (error) {
    console.error('[Webhook Handler] Account created error:', error.message);
    return {
      success: false,
      message: 'Failed to process account creation',
      error: error.message
    };
  }
};

// ============================================================
// WEBHOOK ROUTER (for Express)
// ============================================================

/**
 * Express route handler for webhooks
 */
const webhookRouter = async (req, res) => {
  const payload = req.body;
  const eventType = req.headers['x-webhook-event'] || req.query.event || payload.event || 'unknown';

  try {
    const result = await handleWebhook(payload, eventType, req.headers['x-webhook-signature'] || null);

    // Respond with 200 OK to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received',
      result: result
    });

  } catch (error) {
    console.error('[Webhook Router] Error:', error.message);
    // Always respond with 200 to avoid retries (even on error)
    res.status(200).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

// ============================================================
// WEBHOOK VERIFICATION
// ============================================================

/**
 * Verify webhook signature (production)
 * 
 * In production, the bank signs the webhook payload.
 * We verify it to ensure it came from the bank.
 * 
 * @param {Object} payload - The webhook payload
 * @param {string} signature - The signature from the bank
 * @returns {boolean} Whether the signature is valid
 */
const verifySignature = (payload, signature) => {
  // In sandbox mode, always return true
  if (process.env.BANK_PROVIDER === 'sandbox') {
    return true;
  }

  // In production, verify the signature
  try {
    const crypto = require('crypto');
    const secret = process.env.BANK_API_SECRET || '';
    
    // Sort keys and stringify payload
    const sorted = Object.keys(payload).sort().reduce((obj, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});
    
    const dataString = JSON.stringify(sorted);
    
    // Generate HMAC-SHA256 signature
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
    
    return computedSignature === signature;
  } catch (error) {
    console.error('[Webhook Handler] Signature verification error:', error.message);
    return false;
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Main handler
  handleWebhook,
  webhookRouter,

  // Individual event handlers (for testing)
  handleDepositCompleted,
  handleDepositFailed,
  handleTransferCompleted,
  handleTransferFailed,
  handleWithdrawalCompleted,
  handleWithdrawalFailed,
  handleAccountCreated,

  // Verification
  verifySignature,

  // Constants
  EVENT_TYPES
};