const router = require('express').Router();

const mosques = [
  { id: 'm1', name: 'Jamia Mosque Nairobi', county: 'Nairobi', subCounty: 'Starehe', imam: 'Sheikh Abdul Rahman', phone: '+254722001001', lat: -1.2816, lng: 36.8233 },
  { id: 'm2', name: 'Eastleigh Grand Mosque', county: 'Nairobi', subCounty: 'Kamukunji', imam: 'Sheikh Mohammed Idd', phone: '+254722002002', lat: -1.2696, lng: 36.8545 },
  { id: 'm3', name: 'Mombasa Mandhry Mosque', county: 'Mombasa', subCounty: 'Mvita', imam: 'Sheikh Omar Said', phone: '+254722003003', lat: -4.0610, lng: 39.6686 },
  { id: 'm4', name: 'Garissa Central Mosque', county: 'Garissa', subCounty: 'Garissa Township', imam: 'Sheikh Abdirahman', phone: '+254722006006', lat: -0.4530, lng: 39.6401 }
];

// Get mosques with filters
router.get('/', (req, res) => {
  const { county, search } = req.query;
  let result = [...mosques];
  
  if (county) {
    result = result.filter(m => m.county === county);
  }
  
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.imam.toLowerCase().includes(q)
    );
  }
  
  res.json({ mosques: result, total: result.length });
});

// Add mosque
router.post('/add', (req, res) => {
  const { name, county, subCounty, imam, phone, lat, lng } = req.body;
  
  const newMosque = {
    id: 'm' + Date.now(),
    name,
    county,
    subCounty,
    imam,
    phone,
    lat: lat || 0,
    lng: lng || 0
  };
  
  mosques.push(newMosque);
  
  res.status(201).json({
    message: 'Mosque added successfully — Under review',
    mosque: newMosque
  });
});

module.exports = router;