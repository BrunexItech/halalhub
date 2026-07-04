const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const kycApplications = [];

// Submit KYC
router.post('/submit', authenticate, (req, res) => {
  const { type, businessName, regNumber, kraPin, county, subCounty } = req.body;
  
  const application = {
    id: 'HH-KYC-' + Date.now(),
    userId: req.user.id,
    type,
    businessName,
    regNumber,
    kraPin,
    county,
    subCounty,
    status: 'pending',
    submittedAt: new Date()
  };
  
  kycApplications.push(application);
  
  res.status(201).json({
    message: 'KYC application submitted successfully',
    application
  });
});

// Get KYC status
router.get('/status', authenticate, (req, res) => {
  const apps = kycApplications.filter(a => a.userId === req.user.id);
  res.json({ applications: apps });
});

// Verify Halal Certificate
router.post('/verify-halal', (req, res) => {
  const { certificateNumber, issuingBody } = req.body;
  
  // Demo verification
  const isValid = certificateNumber && certificateNumber.length >= 8;
  
  res.json({
    verified: isValid,
    certificateNumber,
    issuingBody,
    expiry: '31 December 2026'
  });
});

module.exports = router;