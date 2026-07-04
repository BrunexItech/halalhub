import React from 'react';

const Takaful = () => {
  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🛡️ Takaful</div>
          <div className="page-subtitle">Islamic Insurance — Mutual Guarantee</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card card-forest">
            <div className="card-header">
              <span className="card-title">Takaful Cover</span>
            </div>
            <div className="sharia-badge mb-16">☽ Mutual Guarantee — Tabarru' Model (Donation-based)</div>
            
            <div style={{ padding: '16px', border: '1.5px solid #C9A84C', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, color: '#0B3D2E' }}>Basic Cover</div>
              <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Medical + Accidental Death</div>
              <div className="font-serif" style={{ fontSize: '1.3rem', color: '#C9A84C', fontWeight: 700 }}>KES 500/month</div>
              <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Covers up to KES 500,000</div>
            </div>

            <div style={{ padding: '16px', border: '1.5px solid #0B3D2E', borderRadius: '8px', background: 'rgba(11,61,46,0.04)', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, color: '#0B3D2E' }}>Family Shield</div>
              <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Full family coverage</div>
              <div className="font-serif" style={{ fontSize: '1.3rem', color: '#C9A84C', fontWeight: 700 }}>KES 1,500/month</div>
              <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Covers family up to KES 2,000,000</div>
            </div>

            <button className="btn btn-gold btn-full">Join Takaful Pool</button>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Takaful Status</span>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '2rem' }}>🛡️</div>
                <div className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0B3D2E' }}>Family Shield</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Active Plan</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '2rem' }}>💰</div>
                <div className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0B3D2E' }}>KES 1,500</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Monthly Contribution</div>
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(39,174,96,0.08)', borderRadius: '8px', border: '1px solid rgba(39,174,96,0.2)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#27AE60' }}>✓ Policy Active · Expires April 2027</div>
              <div style={{ fontSize: '0.75rem', color: '#6B5C3E', marginTop: '3px' }}>Coverage: KES 2,000,000 · 4 family members</div>
            </div>
          </div>

          <div className="card mt-16">
            <div className="card-header">
              <span className="card-title">Pool Stats</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', textAlign: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0B3D2E' }}>2,847</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Pool Members</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C9A84C' }}>KES 14.2M</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Pool Balance</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#27AE60' }}>98.2%</div>
                <div style={{ fontSize: '0.75rem', color: '#6B5C3E' }}>Claims Paid</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Takaful;
