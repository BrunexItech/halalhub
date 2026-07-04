const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

const loans = [];

// Get active loans
router.get('/', (req, res) => {
  const active = loans.filter(l => l.status === 'active');
  res.json({ loans: active, total: active.length });
});

// Request loan
router.post('/apply', authenticate, (req, res) => {
  const { purpose, amount, repaymentMonths, description, guarantor } = req.body;
  
  if (!purpose || !amount || !repaymentMonths) {
    return res.status(400).json({ error: 'Purpose, amount and repayment period are required' });
  }
  
  if (amount < 5000) {
    return res.status(400).json({ error: 'Minimum loan amount is KES 5,000' });
  }
  
  const loan = {
    id: 'HH-P2P-' + Date.now(),
    borrowerId: req.user.id,
    borrowerName: req.user.fullName || req.user.email,
    purpose,
    amount,
    raised: 0,
    repaymentMonths,
    description,
    guarantor,
    status: 'active',
    createdAt: new Date()
  };
  
  loans.push(loan);
  
  res.status(201).json({
    message: 'Loan request submitted — Qard Hasan (Interest-Free)',
    loan
  });
});

// Fund a loan
router.post('/:id/fund', authenticate, (req, res) => {
  const { amount } = req.body;
  const loan = loans.find(l => l.id === req.params.id);
  
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  if (loan.borrowerId === req.user.id) {
    return res.status(400).json({ error: 'Cannot fund your own loan' });
  }
  
  loan.raised += amount;
  if (loan.raised >= loan.amount) {
    loan.status = 'funded';
  }
  
  res.json({
    message: 'Funding recorded — JazakAllah Khayran!',
    loanId: loan.id,
    amountFunded: loan.raised,
    percentFunded: Math.min(100, Math.round(loan.raised / loan.amount * 100))
  });
});

module.exports = router;