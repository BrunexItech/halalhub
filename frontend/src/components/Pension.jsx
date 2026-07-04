import React, { useState } from 'react';

const Pension = () => {
  const [monthly, setMonthly] = useState(3000);
  const [retAge, setRetAge] = useState(65);
  const [curAge, setCurAge] = useState(35);
  
  const years = Math.max(0, retAge - curAge);
  const projected = Math.round(monthly * 12 * years * 1.06);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🕌 Imam &amp; Scholar Pension</div>
          <div className="page-subtitle">Wakala-managed Halal Equity</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-forest">
          <div className="card-header">
            <span className="card-title">Pension Scheme</span>
            <span className="card-badge badge-gold">Wakala Model</span>
          </div>
          <div className="sharia-badge mb-16">☽ Wakala-managed Halal Equity · No Interest · Ethical Sukuk</div>
          
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Monthly Contribution (KES)</label>
              <input className="form-input" type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Current Age</label>
              <input className="form-input" type="number" value={curAge} onChange={(e) => setCurAge(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Retirement Age</label>
              <input className="form-input" type="number" value={retAge} onChange={(e) => setRetAge(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ background: '#F9F4EC', borderRadius: '8px', padding: '20px', marginTop: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Projected Pension at Age {retAge}</div>
            <div className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#0B3D2E' }}>KES {projected.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginTop: '4px' }}>
              {years} years · KES {monthly.toLocaleString()}/month · Est. 6% Halal Return p.a.
            </div>
            <div className="progress-bar mt-12">
              <div className="progress-fill gold" style={{ width: '45%', height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #C9A84C, #E8C96A)' }}></div>
            </div>
          </div>
          <button className="btn btn-gold btn-full mt-16">Enroll in Pension Scheme</button>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Pension Account</span>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ textAlign: 'center', padding: '14px' }}>
                <div style={{ fontSize: '1.8rem' }}>💰</div>
                <div className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0B3D2E' }}>KES 432,000</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Accumulated</div>
              </div>
              <div style={{ textAlign: 'center', padding: '14px' }}>
                <div style={{ fontSize: '1.8rem' }}>📈</div>
                <div className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C9A84C' }}>+6.2%</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Halal Return p.a.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pension;
