import React, { useState } from 'react';

const Hearse = () => {
  const [providers] = useState([
    { id: 1, name: 'Islamic Funeral Services — Nairobi', county: 'Nairobi', phone: '+254722300001', eta: '20 min', services: 'Hearse · Kafan · Ghusl' },
    { id: 2, name: 'Al-Rahma Funeral Home', county: 'Mombasa', phone: '+254722300002', eta: '30 min', services: 'Hearse · Kafan · Janazah' },
    { id: 3, name: 'Muslim Burial Society — Kisumu', county: 'Kisumu', phone: '+254722300003', eta: '45 min', services: 'Hearse · Kafan' }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🚑 Hearse &amp; Shroud</div>
          <div className="page-subtitle">Emergency funeral services — 24/7</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ borderTop: '3px solid #C0392B' }}>
          <div className="card-header">
            <span className="card-title">Emergency Hearse Service</span>
            <span className="card-badge" style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>24/7</span>
          </div>
          <div style={{ padding: '14px', background: 'rgba(192,57,43,0.06)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#C0392B', fontWeight: 500 }}>
            ⚠️ Hotline: <strong>0800 720 720</strong>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Your County</label>
              <select className="form-select">
                <option>Nairobi</option><option>Mombasa</option><option>Kisumu</option><option>Garissa</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="Enter address" />
            </div>
            <div className="form-field">
              <label className="form-label">Services Needed</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <label><input type="checkbox" checked /> Hearse Transport</label>
                <label><input type="checkbox" /> Kafan (Shroud)</label>
                <label><input type="checkbox" /> Ghusl (Washing)</label>
              </div>
            </div>
            <button className="btn btn-red btn-full">📲 Request Hearse Now</button>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">Service Providers</span></div>
            {providers.map(p => (
              <div key={p.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0B3D2E' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>{p.services}</div>
                <div style={{ fontSize: '0.72rem', color: '#27AE60' }}>● Available · ETA {p.eta}</div>
                <button className="btn btn-sm btn-red" style={{ marginTop: '8px' }}>📞 Call</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hearse;
