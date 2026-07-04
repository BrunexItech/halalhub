import React, { useState } from 'react';

const Sadaqa = () => {
  const [amount, setAmount] = useState('');
  const campaigns = [
    { id: 1, name: 'Orphan Sponsorship — Garissa', org: 'Islamic Relief Kenya', target: 500000, raised: 342000, emoji: '👶' },
    { id: 2, name: 'Masjid Al-Nur Construction', org: 'Westlands Muslim Community', target: 2000000, raised: 1450000, emoji: '🕌' },
    { id: 3, name: 'Water Well — Turkana', org: 'Muslim Aid Kenya', target: 800000, raised: 620000, emoji: '💧' }
  ];

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🤲 Sadaqa</div>
          <div className="page-subtitle">Give ongoing charity</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <h3 className="font-serif mb-16" style={{ fontSize: '1.2rem', color: '#0B3D2E' }}>Active Sadaqa Campaigns</h3>
          {campaigns.map(c => {
            const pct = Math.round(c.raised / c.target * 100);
            return (
              <div className="card" key={c.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>{c.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, color: '#0B3D2E' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginBottom: '6px' }}>{c.org}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span>KES {c.raised.toLocaleString()} raised</span>
                      <span style={{ fontWeight: 700, color: '#0B3D2E' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px', background: 'rgba(0,0,0,0.07)', borderRadius: '4px', marginBottom: '10px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #0B3D2E, #1A7A55)' }}></div>
                    </div>
                    <button className="btn btn-sm btn-gold" onClick={() => setAmount('500')}>Donate Now</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="card card-gold">
            <div className="card-header">
              <span className="card-title">Give Sadaqa</span>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Select Campaign</label>
                <select className="form-select">
                  <option>Orphan Sponsorship — Garissa</option>
                  <option>Masjid Al-Nur Construction</option>
                  <option>Water Well — Turkana</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Amount (KES)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => setAmount('100')}>100</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setAmount('500')}>500</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setAmount('1000')}>1,000</button>
                  <button className="btn btn-sm btn-outline" onClick={() => setAmount('5000')}>5,000</button>
                </div>
                <input className="form-input" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <button className="btn btn-gold btn-full" onClick={() => alert('Sadaqa donation sent! 🤲')}>Give Sadaqa — Lillahi Ta'ala</button>
            </div>
            <div className="mt-12 sharia-badge">☽ 100% reaches beneficiaries. Platform fee: KES 0</div>
          </div>

          <div className="card mt-16">
            <div className="card-header">
              <span className="card-title">Your Sadaqa Impact</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', textAlign: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0B3D2E' }}>8,400</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Total Given (KES)</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#C9A84C' }}>14</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Donations Made</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#27AE60' }}>6</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Lives Impacted</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sadaqa;
