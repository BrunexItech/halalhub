const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Get packages
router.get('/packages', (req, res) => {
  res.json({
    packages: [
      { id: 'p1', name: 'Economy Hajj 1447 AH', operator: 'Al-Mabrur Travel Kenya', price: 185000, duration: '21 days', tier: 'Economy', rooms: 'Quad sharing' },
      { id: 'p2', name: 'Standard Hajj Package', operator: 'Rahma Hajj Safaris', price: 285000, duration: '28 days', tier: 'Standard', rooms: 'Double sharing' },
      { id: 'p3', name: 'Premium Hajj Experience', operator: 'Al-Safwa Luxury Tours', price: 450000, duration: '21 days', tier: 'Premium', rooms: 'Single room' }
    ]
  });
});

// Book
router.post('/book', authenticate, (req, res) => {
  const { packageId, adults, children, paymentPlan } = req.body;
  
  res.json({
    message: 'Enquiry submitted successfully',
    reference: 'HH-HAJJ-' + Date.now(),
    packageId,
    adults,
    children,
    paymentPlan
  });
});

module.exports = router;