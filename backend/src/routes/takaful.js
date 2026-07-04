const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const takafulMembers = [];

// Get plans
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      { id: 'basic', name: 'Basic Cover', price: 500, coverage: 500000, type: 'Medical + Accidental Death' },
      { id: 'family', name: 'Family Shield', price: 1500, coverage: 2000000, type: 'Full Family Coverage' },
      { id: 'business', name: 'Business Takaful', price: 3000, coverage: 10000000, type: 'SME + Property' }
    ]
  });
});

// Join Takaful
router.post('/join', authenticate, (req, res) => {
  const { planId, beneficiaries } = req.body;
  
  if (!planId) {
    return res.status(400).json({ error: 'Plan selection is required' });
  }
  
  const membership = {
    id: 'HH-TKF-' + Date.now(),
    userId: req.user.id,
    planId,
    beneficiaries: beneficiaries || 4,
    status: 'active',
    joinedAt: new Date()
  };
  
  takafulMembers.push(membership);
  
  res.json({
    message: 'Successfully joined Takaful pool',
    membership
  });
});

// Get pool stats
router.get('/stats', (req, res) => {
  res.json({
    members: 2847,
    poolBalance: 14200000,
    claimsPaid: 98.2
  });
});

module.exports = router;