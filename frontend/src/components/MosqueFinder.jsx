import React, { useState } from 'react';

const MosqueFinder = () => {
  const [mosques] = useState([
    { id: 1, name: 'Jamia Mosque Nairobi', county: 'Nairobi', imam: 'Sheikh Abdul Rahman', phone: '+254722001001', congregation: 3000 },
    { id: 2, name: 'Masjid Al-Nur', county: 'Nairobi', imam: 'Sheikh Mohammed Idd', phone: '+254722002002', congregation: 800 },
    { id: 3, name: 'Mombasa Mandhry Mosque', county: 'Mombasa', imam: 'Sheikh Omar Said', phone: '+254722003003', congregation: 1200 },
    { id: 4, name: 'Garissa Central Mosque', county: 'Garissa', imam: 'Sheikh Abdirahman', phone: '+254722006006', congregation: 700 }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🕌 Mosque Finder</div>
          <div className="page-subtitle">Find mosques across 47 counties</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <select className="form-select" style={{ width: '200px' }}>
          <option>All Counties</option>
          <option>Nairobi</option><option>Mombasa</option><option>Kisumu</option>
        </select>
        <input className="form-input" style={{ flex: 1, minWidth: '200px' }} placeholder="🔍 Search mosque..." />
      </div>

      <div className="grid-auto">
        {mosques.map(m => (
          <div className="listing-card" key={m.id}>
            <div className="listing-img" style={{ height: '120px', fontSize: '2.5rem' }}>🕌</div>
            <div className="listing-body">
              <div className="listing-name">{m.name}</div>
              <div className="listing-meta">👤 {m.imam} · 👥 {m.congregation.toLocaleString()} congregation</div>
              <div className="listing-tags">
                <span className="county-badge">{m.county}</span>
                <span className="halal-cert" style={{ fontSize: '0.65rem' }}>✓ SUPKEM</span>
              </div>
              <div style={{ fontSize: '0.8rem', marginBottom: '10px' }}>�� {m.phone}</div>
              <button className="btn btn-sm btn-forest">💳 Donate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MosqueFinder;
