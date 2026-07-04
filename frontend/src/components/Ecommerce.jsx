import React, { useState } from 'react';

const Ecommerce = () => {
  const [products] = useState([
    { id: 1, name: 'Premium Medjool Dates — 1kg', category: 'Halal Food', price: 1800, seller: 'Al-Madinah Dates', emoji: '🌴' },
    { id: 2, name: 'Ihram Set — Men (Hajj)', category: 'Islamic Clothing', price: 2500, seller: 'Makkah Gear', emoji: '🧕' },
    { id: 3, name: 'Quran — Large Print Tajweed', category: 'Books', price: 3200, seller: 'Islamic Books Kenya', emoji: '📖' },
    { id: 4, name: 'Premium Prayer Mat', category: 'Prayer Items', price: 1500, seller: 'Sujood Imports', emoji: '🙏' },
    { id: 5, name: 'Halal Honey — Kenyan Pure', category: 'Halal Food', price: 950, seller: 'Baraka Bee Farm', emoji: '🍯' },
    { id: 6, name: 'Abaya — Modest Fashion', category: 'Islamic Clothing', price: 4500, seller: 'Haya Designs', emoji: '👗' }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🛒 Halal Market</div>
          <div className="page-subtitle">Shop halal-certified products</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select className="form-select" style={{ width: '200px' }}>
          <option>All Categories</option>
          <option>Halal Food</option>
          <option>Islamic Clothing</option>
          <option>Books</option>
        </select>
        <input className="form-input" style={{ flex: 1, minWidth: '200px' }} placeholder="🔍 Search products..." />
        <span className="halal-cert">✓ All products Halal-Certified</span>
      </div>

      <div className="grid-auto">
        {products.map(p => (
          <div className="listing-card" key={p.id}>
            <div className="listing-img" style={{ height: '130px', fontSize: '3rem' }}>{p.emoji}</div>
            <div className="listing-body">
              <div className="listing-name">{p.name}</div>
              <div className="listing-meta">{p.seller}</div>
              <div className="listing-tags">
                <span className="halal-cert" style={{ fontSize: '0.62rem' }}>✓ Halal</span>
                <span className="county-badge">{p.category}</span>
              </div>
              <div className="listing-footer">
                <div className="listing-price">KES {p.price.toLocaleString()}</div>
                <button className="btn btn-sm btn-gold">🛒 Add</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ecommerce;
