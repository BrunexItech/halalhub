import React, { useState } from 'react';

const Wills = () => {
  const [estate, setEstate] = useState(5000000);
  const [heirs] = useState([
    { rel: 'Wife', name: 'Khadija Amour', share: '1/8' },
    { rel: 'Son', name: 'Hassan Amour', share: 'Asabah' },
    { rel: 'Daughter', name: 'Maryam Amour', share: 'Asabah ÷2' }
  ]);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">📜 Digital Wills</div>
          <div className="page-subtitle">Create your Islamic Wasiyyah</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-gold">
          <div className="card-header"><span className="card-title">Create Your Wasiyyah</span></div>
          <div className="sharia-badge mb-16">☽ Wasiyyah — Max 1/3 of estate to non-heirs</div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Full Legal Name</label>
              <input className="form-input" placeholder="As per National ID" />
            </div>
            <div className="form-field">
              <label className="form-label">Executor / Wasi</label>
              <input className="form-input" placeholder="Name of trusted executor" />
            </div>
            <div className="form-field">
              <label className="form-label">Assets to Include</label>
              <textarea className="form-textarea" placeholder="List your assets: bank accounts, property, business..." />
            </div>
            <button className="btn btn-gold btn-full">💾 Save &amp; Encrypt Will</button>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">Islamic Inheritance Calculator</span></div>
            <div className="form-field">
              <label className="form-label">Total Estate Value (KES)</label>
              <input className="form-input" type="number" value={estate} onChange={(e) => setEstate(Number(e.target.value))} />
            </div>
            <div style={{ marginTop: '16px', padding: '16px', background: '#F9F4EC', borderRadius: '8px' }}>
              {heirs.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span>{h.rel}: {h.name}</span>
                  <span style={{ fontWeight: 700, color: '#0B3D2E' }}>{h.share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wills;
