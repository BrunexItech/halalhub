const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const utilities = [
  { id: 'kplc', name: 'KPLC Electricity', icon: '⚡', paybill: '888880' },
  { id: 'water', name: 'Nairobi Water', icon: '💧', paybill: '444400' },
  { id: 'safaricom', name: 'Safaricom Fibre', icon: '🌐', paybill: '333200' },
  { id: 'dstv', name: 'DSTV / Zuku', icon: '📺', paybill: '321000' }
];

// Get utilities
router.get('/', (req, res) => {
  res.json({ utilities });
});

// Pay utility
router.post('/pay', authenticate, (req, res) => {
  const { utilityId, accountNumber, amount } = req.body;
  
  res.json({
    message: 'Utility payment initiated via M-Pesa',
    reference: 'HH-UTIL-' + Date.now(),
    utilityId,
    accountNumber,
    amount
  });
});

module.exports = router;