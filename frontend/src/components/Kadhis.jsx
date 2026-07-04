import React, { useState } from 'react';

const Kadhis = () => {
  const [kadhis] = useState([
    { id: 1, name: 'Sheikh Abdul Rahman Al-Naqib', county: 'Nairobi', expertise: 'Family Law · Inheritance', fee: 'KES 2,000/hr', rating: 4.9 },
    { id: 2, name: 'Kadhi Mohammed Ali Hassan', county: 'Mombasa', expertise: 'Inheritance · Business', fee: 'KES 1,500/hr', rating: 4.8 },
    { id: 3, name: 'Sheikh Ibrahim Yusuf', county: 'Nairobi', expertise: 'Islamic Finance · Fatwa', fee: 'KES 3,000/hr', rating: 5.0 },
    { id: 4, name: 'Sheikh Abdirahman Mohamed', county: 'Garissa', expertise: 'Marriage · Family Law', fee: 'KES 800/hr', rating: 4.7 }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">📖 Kadhis &amp; Scholars</div>
          <div className="page-subtitle">Book consultations with Islamic scholars</div>
        </div>
      </div>

      <div className="grid-auto">
        {kadhis.map(k => (
          <div className="listing-card" key={k.id}>
            <div className="listing-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#0B3D2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📖</div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: '#0B3D2E' }}>{k.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6B5C3E' }}>{k.county} · ⭐ {k.rating}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#C9A84C', fontWeight: 600, marginBottom: '6px' }}>{k.expertise}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0B3D2E' }}>{k.fee}</span>
                <span className="county-badge">{k.county}</span>
              </div>
              <button className="btn btn-sm btn-gold" style={{ width: '100%' }}>Book Consultation</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kadhis;
