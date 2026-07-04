import React from 'react';

const Utilities = () => {
  const utils = [
    { name: 'KPLC Electricity', icon: '⚡', paybill: '888880' },
    { name: 'Nairobi Water', icon: '💧', paybill: '444400' },
    { name: 'Safaricom Fibre', icon: '🌐', paybill: '333200' },
    { name: 'DSTV / Zuku', icon: '📺', paybill: '321000' },
    { name: 'County Rates', icon: '🏛️', paybill: '222111' }
  ];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">⚡ Utilities</div>
          <div className="page-subtitle">Pay your utility bills</div>
        </div>
      </div>

      <div className="grid-auto">
        {utils.map(u => (
          <div className="card" key={u.name} style={{ cursor: 'pointer', borderLeft: '4px solid #C9A84C' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{u.icon}</div>
            <div style={{ fontWeight: 600, color: '#0B3D2E', marginBottom: '2px' }}>{u.name}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B5C3E' }}>Paybill: {u.paybill}</div>
          </div>
        ))}
      </div>

      <div className="card mt-24" style={{ maxWidth: '560px' }}>
        <div className="card-header">
          <span className="card-title">Pay Utility Bill</span>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Utility Type</label>
            <select className="form-select">
              <option>KPLC Electricity</option>
              <option>Nairobi Water</option>
              <option>Safaricom Fibre</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Account Number</label>
            <input className="form-input" placeholder="Enter account number" />
          </div>
          <div className="form-field">
            <label className="form-label">Amount (KES)</label>
            <input className="form-input" type="number" placeholder="1,500" />
          </div>
          <button className="btn btn-gold btn-full" onClick={() => alert('Payment initiated via M-Pesa ✓')}>💳 Pay Now</button>
        </div>
      </div>
    </div>
  );
};

export default Utilities;
