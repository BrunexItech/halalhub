import React from 'react';

const P2P = () => {
  const loans = [
    { id: 1, name: 'Education Loan — Mohamed A.', purpose: 'University Tuition', amount: 45000, raised: 30000, period: '12 months', county: 'Nairobi' },
    { id: 2, name: 'Medical Emergency — Amina H.', purpose: 'Hospital Bills', amount: 80000, raised: 65000, period: '6 months', county: 'Mombasa' }
  ];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🤝 P2P Amanah</div>
          <div className="page-subtitle">Interest-Free Qard Hasan Loans</div>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px', padding: '4px' }}>
        <button className="tab-btn active" style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', background: '#0B3D2E', color: 'white', fontFamily: "'Outfit', sans-serif", fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer' }}>Browse Requests</button>
        <button className="tab-btn" style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#6B5C3E', fontFamily: "'Outfit', sans-serif", fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer' }}>Request Loan</button>
        <button className="tab-btn" style={{ padding: '9px 18px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#6B5C3E', fontFamily: "'Outfit', sans-serif", fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer' }}>My Loans</button>
      </div>

      <div className="grid-auto">
        {loans.map(l => {
          const pct = Math.round(l.raised / l.amount * 100);
          return (
            <div className="card" key={l.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '1.5rem' }}>🤝</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0B3D2E' }}>{l.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>{l.purpose} · {l.period}</div>
                </div>
                <span className="halal-cert" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>✓ Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span>KES {l.raised.toLocaleString()} / {l.amount.toLocaleString()}</span>
                <span style={{ fontWeight: 700, color: '#0B3D2E' }}>{pct}%</span>
              </div>
              <div className="progress-bar" style={{ height: '6px', marginBottom: '12px' }}>
                <div className="progress-fill gold" style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #C9A84C, #E8C96A)' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-sm btn-gold" style={{ flex: 1 }}>Fund This Loan</button>
                <span className="county-badge" style={{ fontSize: '0.72rem', padding: '3px 9px', borderRadius: '20px', background: 'rgba(11,61,46,0.08)', color: '#0B3D2E' }}>{l.county}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default P2P;
