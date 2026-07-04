import React, { useState } from 'react';

const Hajj = () => {
  const [packages] = useState([
    { id: 1, name: 'Economy Hajj 1447 AH', operator: 'Al-Mabrur Travel', price: 185000, duration: '21 days', tier: 'Economy', emoji: '🕋' },
    { id: 2, name: 'Standard Hajj Package', operator: 'Rahma Hajj Safaris', price: 285000, duration: '28 days', tier: 'Standard', emoji: '⭐' },
    { id: 3, name: 'Premium Hajj Experience', operator: 'Al-Safwa Luxury Tours', price: 450000, duration: '21 days', tier: 'Premium', emoji: '✨' },
    { id: 4, name: 'Ramadan Umrah Package', operator: 'Barakah Umrah Kenya', price: 120000, duration: '14 days', tier: 'Umrah', emoji: '🌙' }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🕋 Hajj &amp; Umrah</div>
          <div className="page-subtitle">Book your pilgrimage packages</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          {packages.map(p => (
            <div className="card" key={p.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ fontSize: '2.2rem' }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 600, color: '#0B3D2E' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B5C3E', marginBottom: '6px' }}>{p.operator} · {p.duration}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 700, color: '#0B3D2E' }}>
                      KES {p.price.toLocaleString()}
                    </div>
                    <button className="btn btn-sm btn-gold">Enquire</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card card-gold">
            <div className="card-header"><span className="card-title">Book a Package</span></div>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Journey Type</label>
                <select className="form-select">
                  <option>Hajj 1447 AH (2026)</option>
                  <option>Umrah — Any time</option>
                  <option>Ramadan Umrah</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Departure City</label>
                <select className="form-select">
                  <option>Nairobi (JKIA)</option>
                  <option>Mombasa (MBA)</option>
                  <option>Kisumu (KIS)</option>
                </select>
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-field">
                  <label className="form-label">Adults</label>
                  <input className="form-input" type="number" value="2" />
                </div>
                <div className="form-field">
                  <label className="form-label">Children</label>
                  <input className="form-input" type="number" value="0" />
                </div>
              </div>
              <button className="btn btn-gold btn-full">🕋 Enquire / Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hajj;
