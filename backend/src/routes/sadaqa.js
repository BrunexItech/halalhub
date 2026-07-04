const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Get campaigns
router.get('/campaigns', (req, res) => {
  res.json({
    campaigns: [
      { id: 1, name: 'Orphan Sponsorship — Garissa', org: 'Islamic Relief Kenya', target: 500000, raised: 342000, image: '👶', county: 'Garissa' },
      { id: 2, name: 'Masjid Al-Nur Construction', org: 'Westlands Muslim Community', target: 2000000, raised: 1450000, image: '🕌', county: 'Nairobi' },
      { id: 3, name: 'Water Well — Turkana', org: 'Muslim Aid Kenya', target: 800000, raised: 620000, image: '💧', county: 'Turkana' }
    ]
  });
});

// Donate
router.post('/donate', authenticate, (req, res) => {
  const { campaignId, amount, isRecurring, dedication } = req.body;
  
  if (!amount || amount < 10) {
    return res.status(400).json({ error: 'Minimum donation is KES 10' });
  }
  
  res.json({
    message: 'Sadaqa donation received — May Allah accept it 🤲',
    amount,
    campaignId,
    isRecurring,
    dedication,
    reference: 'HH-SDQ-' + Date.now()
  });
});

module.exports = router;