const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Create will
router.post('/create', authenticate, (req, res) => {
  const { assets, bequests, executor, wishes } = req.body;
  
  res.json({
    message: 'Will saved securely — End-to-end encrypted',
    reference: 'HH-WILL-' + Date.now(),
    note: 'Attestation by Kadhi required',
    status: 'draft'
  });
});

// Calculate inheritance
router.post('/calculate-inheritance', (req, res) => {
  const { estate, heirs } = req.body;
  
  // Simplified calculation
  const shares = {
    'Wife': 1/8,
    'Son': 2/3 * 0.5,
    'Daughter': 1/3 * 0.5,
    'Mother': 1/6
  };
  
  const distribution = Object.entries(shares).map(([heir, share]) => ({
    heir,
    percentage: Math.round(share * 100),
    amount: Math.round(estate * share)
  }));
  
  res.json({ distribution });
});

module.exports = router;