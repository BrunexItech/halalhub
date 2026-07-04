const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const NISAB = { gold: 842500, silver: 71400 };
const ZAKAT_RATE = 0.025;

// Calculate Zakat
router.post('/calculate', (req, res) => {
  const {
    cash = 0,
    gold = 0,
    silver = 0,
    business = 0,
    investments = 0,
    receivables = 0,
    liabilities = 0,
    nisabType = 'silver'
  } = req.body;
  
  const totalAssets = cash + gold + silver + business + investments + receivables;
  const netAssets = totalAssets - liabilities;
  const nisabThreshold = NISAB[nisabType] || NISAB.silver;
  const zakatDue = netAssets >= nisabThreshold ? Math.round(netAssets * ZAKAT_RATE) : 0;
  
  res.json({
    netAssets,
    nisabThreshold,
    nisabType,
    zakatDue,
    isObligatory: netAssets >= nisabThreshold
  });
});

// Pay Zakat
router.post('/pay', authenticate, (req, res) => {
  const { amount, institution, method } = req.body;
  
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Invalid zakat amount' });
  }
  
  const ref = 'HH-ZKT-' + Date.now();
  
  res.json({
    message: 'Zakat payment initiated',
    amount,
    institution,
    method,
    reference: ref,
    receipt: `/api/zakat/receipt/${ref}`,
    note: 'JazakAllah Khayran — Your Zakat will be distributed'
  });
});

// Get Zakat history
router.get('/history', authenticate, (req, res) => {
  res.json({
    history: [
      { year: '1446 AH', date: '2026-04-07', amount: 18250, institution: 'SUPKEM', status: 'paid' },
      { year: '1445 AH', date: '2025-03-15', amount: 14800, institution: 'Islamic Relief', status: 'paid' },
      { year: '1444 AH', date: '2024-04-01', amount: 11500, institution: 'Local Mosque', status: 'paid' }
    ]
  });
});

module.exports = router;