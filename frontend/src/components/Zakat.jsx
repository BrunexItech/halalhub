import React, { useState } from 'react';

const Zakat = () => {
  const [cash, setCash] = useState(500000);
  const [gold, setGold] = useState(150000);
  const [silver, setSilver] = useState(20000);
  const [business, setBusiness] = useState(80000);
  const [invest, setInvest] = useState(50000);
  const [liab, setLiab] = useState(100000);

  const total = cash + gold + silver + business + invest - liab;
  const due = total >= 71400 ? Math.round(total * 0.025) : 0;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">⚖️ Zakat Calculator</div>
          <div className="page-subtitle">Calculate your Zakat obligation</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-gold">
          <div className="card-header">
            <span className="card-title">Zakat Calculator</span>
            <span className="card-badge badge-gold">1446 AH</span>
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Cash &amp; Bank Savings (KES)</label>
              <input className="form-input" type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Gold Value (KES)</label>
              <input className="form-input" type="number" value={gold} onChange={(e) => setGold(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Silver Value (KES)</label>
              <input className="form-input" type="number" value={silver} onChange={(e) => setSilver(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Business Assets (KES)</label>
              <input className="form-input" type="number" value={business} onChange={(e) => setBusiness(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Investments (KES)</label>
              <input className="form-input" type="number" value={invest} onChange={(e) => setInvest(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label className="form-label">Liabilities (KES)</label>
              <input className="form-input" type="number" value={liab} onChange={(e) => setLiab(Number(e.target.value))} />
            </div>
          </div>

          <div className="zakat-result mt-16" style={{
            background: 'linear-gradient(135deg, #F5E8C0, #fff)',
            border: '1.5px solid #C9A84C',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#6B5C3E', marginBottom: '6px' }}>Total Zakatable Assets</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: '#0B3D2E', fontWeight: 700 }}>
              KES {total.toLocaleString()}
            </div>
            <div className="divider"></div>
            <div style={{ fontSize: '0.85rem', color: '#6B5C3E', marginBottom: '4px' }}>Your Zakat Due (2.5%)</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', fontWeight: 700, color: '#0B3D2E' }}>
              KES {due.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6B5C3E', marginTop: '4px' }}>
              {total >= 71400 ? '✓ Nisab exceeded — Zakat Obligatory' : '⚠ Below Nisab — Zakat not yet obligatory'}
            </div>
            <button className="btn btn-gold mt-16">Pay Zakat Now</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">About Zakat</span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.7', color: '#6B5C3E' }}>
            <p style={{ marginBottom: '8px' }}>Zakat is the third pillar of Islam — an annual obligatory payment of <strong>2.5%</strong> of qualifying wealth held for one lunar year (Hawl), provided it exceeds the Nisab threshold.</p>
            <p style={{ marginBottom: '8px' }}>Formula: <strong>Zakat = 2.5% × (Total Assets − Liabilities)</strong></p>
            <p>All payments are routed through SUPKEM, Waqf Commission Kenya, or verified local mosques.</p>
          </div>
          <div className="sharia-badge mt-16">☽ Fatwa Reference: Fiqh al-Zakah, Sheikh Yusuf al-Qaradawi</div>
        </div>
      </div>
    </div>
  );
};

export default Zakat;
