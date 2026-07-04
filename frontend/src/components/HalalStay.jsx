import React, { useState } from 'react';

const HalalStay = () => {
  const [properties] = useState([
    { id: 1, name: 'Al-Firdaus Apartment', county: 'Nairobi', type: 'Apartment', price: 4500, emoji: '🏢', rating: 4.8 },
    { id: 2, name: 'Zam-Zam Guest House', county: 'Mombasa', type: 'Guest House', price: 2800, emoji: '🏠', rating: 4.6 },
    { id: 3, name: 'Madinah Suites', county: 'Nairobi', type: 'Serviced Suite', price: 7200, emoji: '🏨', rating: 4.9 },
    { id: 4, name: 'Kakamega Halal Lodge', county: 'Kakamega', type: 'Lodge', price: 3200, emoji: '🏡', rating: 4.5 },
    { id: 5, name: 'Lamu Heritage House', county: 'Lamu', type: 'Heritage', price: 5500, emoji: '🕌', rating: 4.7 }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🏨 HalalStay</div>
          <div className="page-subtitle">Halal-certified accommodation across Kenya</div>
        </div>
      </div>

      <div className="grid-auto">
        {properties.map(p => (
          <div className="listing-card" key={p.id}>
            <div className="listing-img" style={{ height: '140px', fontSize: '3rem' }}>{p.emoji}</div>
            <div className="listing-body">
              <div className="listing-name">{p.name}</div>
              <div className="listing-meta">{p.type} · {p.county}</div>
              <div className="listing-tags">
                <span className="halal-cert">✓ Halal Certified</span>
                <span className="county-badge">{p.county}</span>
              </div>
              <div className="stars">⭐ {p.rating}</div>
              <div className="listing-footer">
                <div className="listing-price">KES {p.price.toLocaleString()}/night</div>
                <button className="btn btn-sm btn-gold">Book Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HalalStay;
