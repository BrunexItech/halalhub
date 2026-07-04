import React, { useState } from 'react';

const Restaurants = () => {
  const [restaurants] = useState([
    { id: 1, name: 'Al-Bahar Swahili Restaurant', county: 'Mombasa', cuisine: 'Swahili · Coastal', rating: 4.9, emoji: '🍽️', priceRange: 'KES 300–800' },
    { id: 2, name: 'Habesha Ethiopian & Somali', county: 'Nairobi', cuisine: 'Somali · Ethiopian', rating: 4.8, emoji: '🥘', priceRange: 'KES 400–900' },
    { id: 3, name: 'Delhi Palace — Halal Indian', county: 'Nairobi', cuisine: 'Indian · Biryani', rating: 4.7, emoji: '🍛', priceRange: 'KES 500–1,200' },
    { id: 4, name: 'Mama Halisi Kitchen', county: 'Kisumu', cuisine: 'Kenyan · Coastal', rating: 4.6, emoji: '🫕', priceRange: 'KES 200–600' }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🍽️ HalaRestaurants</div>
          <div className="page-subtitle">Halal restaurants across Kenya</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select className="form-select" style={{ width: '200px' }}>
          <option>All Counties</option>
          <option>Nairobi</option><option>Mombasa</option><option>Kisumu</option>
        </select>
        <input className="form-input" style={{ flex: 1, minWidth: '200px' }} placeholder="🔍 Search restaurants..." />
      </div>

      <div className="grid-auto">
        {restaurants.map(r => (
          <div className="listing-card" key={r.id}>
            <div className="listing-img" style={{ height: '130px', fontSize: '3rem' }}>{r.emoji}</div>
            <div className="listing-body">
              <div className="listing-name">{r.name}</div>
              <div className="listing-meta">{r.cuisine}</div>
              <div className="stars">⭐ {r.rating}</div>
              <div className="listing-tags">
                <span className="halal-cert">✓ Halal</span>
                <span className="county-badge">{r.county}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B5C3E', marginBottom: '10px' }}>{r.priceRange}</div>
              <button className="btn btn-sm btn-gold">🍽️ Order Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Restaurants;
