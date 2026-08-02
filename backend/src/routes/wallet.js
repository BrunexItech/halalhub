const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const virtualAccountService = require('../services/virtual-account.service');
const bankClient = require('../services/bank-client');
const feeService = require('../services/fee.service');

// ============================================================
// 1. GET WALLET BALANCE (Authenticated)
// ============================================================
router.get('/balance', authenticate, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  try {
    const userId = req.user.id;

    // Get user's virtual account from our database
    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found. Please contact support.'
      });
    }

    // Get balance from our cached database (fast)
    const balance = account.balance || 0;

    res.json({
      success: true,
      balance: balance,
      currency: account.currency || 'KES',
      accountNumber: account.account_number
    });

  } catch (err) {
    console.error('Error fetching balance:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance'
    });
  }
});

// ============================================================
// 2. GET WALLET TRANSACTIONS (Authenticated)
// ============================================================
router.get('/transactions', authenticate, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const result = await virtualAccountService.getUserTransactions(userId, limit);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Failed to fetch transactions'
      });
    }

    res.json({
      success: true,
      transactions: result.transactions,
      total: result.total
    });

  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// ============================================================
// 3. GET ACCOUNT DETAILS (Authenticated)
// ============================================================
router.get('/account', authenticate, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  try {
    const userId = req.user.id;

    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found'
      });
    }

    res.json({
      success: true,
      account: {
        accountNumber: account.account_number,
        currency: account.currency || 'KES',
        balance: account.balance || 0,
        isActive: account.is_active,
        createdAt: account.createdat
      }
    });

  } catch (err) {
    console.error('Error fetching account:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// ============================================================
// 4. DEPOSIT TO WALLET (Authenticated - via M-Pesa/Bank)
// ============================================================
router.post('/deposit', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, reference } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit is KES 10'
      });
    }

    // Get user's account
    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found'
      });
    }

    // Process deposit via bank
    const result = await virtualAccountService.processDeposit(
      account.account_number,
      amount,
      reference || `DEP-${Date.now()}`
    );

    // Get updated balance
    const updatedAccount = await virtualAccountService.getUserAccount(userId);

    res.json({
      success: true,
      message: 'Deposit processed successfully',
      data: {
        amount: amount,
        reference: result.data?.reference || reference,
        newBalance: updatedAccount?.balance || 0,
        accountNumber: account.account_number
      }
    });

  } catch (err) {
    console.error('Error processing deposit:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process deposit'
    });
  }
});

// ============================================================
// 5. WITHDRAW FROM WALLET (Authenticated)
// ============================================================
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, destination, destinationType = 'mpesa' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum withdrawal is KES 10'
      });
    }

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: 'Destination (M-Pesa number or bank account) is required'
      });
    }

    // Get user's account
    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found'
      });
    }

    // Check if user has enough balance
    if (account.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        balance: account.balance,
        required: amount
      });
    }

    // Process withdrawal via bank
    const result = await virtualAccountService.processWithdrawal(
      userId,
      account.account_number,
      amount,
      destination,
      destinationType
    );

    // Get updated balance
    const updatedAccount = await virtualAccountService.getUserAccount(userId);

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        amount: amount,
        destination: destination,
        destinationType: destinationType,
        reference: result.data?.reference,
        newBalance: updatedAccount?.balance || 0
      }
    });

  } catch (err) {
    console.error('Error processing withdrawal:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process withdrawal'
    });
  }
});

// ============================================================
// 6. TRANSFER TO ANOTHER USER (Authenticated)
// ============================================================
router.post('/transfer', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { toAccount, amount, description = '' } = req.body;

    if (!toAccount) {
      return res.status(400).json({
        success: false,
        error: 'Recipient account number is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Minimum transfer is KES 1'
      });
    }

    // Get user's account
    const fromAccount = await virtualAccountService.getUserAccount(userId);

    if (!fromAccount) {
      return res.status(404).json({
        success: false,
        error: 'Your virtual account not found'
      });
    }

    // Check if user has enough balance
    if (fromAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        balance: fromAccount.balance,
        required: amount
      });
    }

    // Process transfer via bank
    const result = await virtualAccountService.processTransfer(
      userId,
      fromAccount.account_number,
      toAccount,
      amount,
      description
    );

    // Get updated balance
    const updatedAccount = await virtualAccountService.getUserAccount(userId);

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        amount: amount,
        fromAccount: fromAccount.account_number,
        toAccount: toAccount,
        reference: result.data?.reference,
        fee: result.data?.fee || 0,
        newBalance: updatedAccount?.balance || 0
      }
    });

  } catch (err) {
    console.error('Error processing transfer:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process transfer'
    });
  }
});

// ============================================================
// 7. GET BALANCE BY ACCOUNT NUMBER (Public - for webhooks)
// ============================================================
router.get('/balance/:accountNumber', async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await virtualAccountService.getAccountByNumber(accountNumber);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      balance: account.balance || 0,
      currency: account.currency || 'KES',
      accountNumber: account.account_number
    });

  } catch (err) {
    console.error('Error fetching balance by account:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance'
    });
  }
});

// ============================================================
// 8. SYNC WITH BANK (Authenticated - Reconciliation)
// ============================================================
router.post('/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await virtualAccountService.syncWithBank(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to sync with bank'
      });
    }

    res.json({
      success: true,
      message: 'Balance synced with bank successfully',
      data: {
        ourBalance: result.ourBalance,
        bankBalance: result.bankBalance,
        isSynced: result.isSynced,
        accountNumber: result.accountNumber
      }
    });

  } catch (err) {
    console.error('Error syncing with bank:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to sync with bank'
    });
  }
});

// ============================================================
// 9. GET TRANSACTION BY REFERENCE (Authenticated)
// ============================================================
router.get('/transaction/:reference', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reference } = req.params;

    const transaction = await virtualAccountService.getTransactionByReference(reference);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Check if transaction belongs to the user
    const account = await virtualAccountService.getUserAccount(userId);
    if (transaction.from_account !== account?.account_number && 
        transaction.to_account !== account?.account_number) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      transaction: transaction
    });

  } catch (err) {
    console.error('Error fetching transaction:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
});

// ============================================================
// 10. GET WALLET STATS (Authenticated)
// ============================================================
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const account = await virtualAccountService.getUserAccount(userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Virtual account not found'
      });
    }

    // Get transaction counts
    const result = await virtualAccountService.getUserTransactions(userId, 1000);
    const transactions = result.transactions || [];

    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransfers = transactions
      .filter(t => t.type === 'transfer' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFees = transactions
      .filter(t => t.type === 'fee')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      stats: {
        balance: account.balance || 0,
        currency: account.currency || 'KES',
        accountNumber: account.account_number,
        totalTransactions: transactions.length,
        totalDeposits: totalDeposits,
        totalWithdrawals: totalWithdrawals,
        totalTransfers: totalTransfers,
        totalFees: totalFees
      }
    });

  } catch (err) {
    console.error('Error fetching wallet stats:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet stats'
    });
  }
});

module.exports = router;