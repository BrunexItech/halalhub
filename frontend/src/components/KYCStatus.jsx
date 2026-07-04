import React from 'react';

const KYCStatus = () => {
  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">📋 My KYC Status</div>
          <div className="page-subtitle">Track your verification status</div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, #0B3D2E, #145A40)', color: 'white', padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '3rem' }}>📋</div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 600, color: '#C9A84C' }}>Provider KYC Centre</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Register & track your Halal business verification</div>
          </div>
        </div>
        <button className="btn btn-gold" style={{ marginTop: '16px' }}>+ Register Business</button>
      </div>

      <div className="kyc-status-card verified">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0B3D2E' }}>🍽️ Al-Amour Halal Restaurant</div>
            <div style={{ fontSize: '0.78rem', color: '#6B5C3E' }}>Submitted: 1 Apr 2026 · Nairobi</div>
          </div>
          <span className="kyc-status-badge kyc-verified">✓ VERIFIED</span>
        </div>
      </div>

      <div className="kyc-status-card review">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0B3D2E' }}>🏠 Madinah Suites HalalStay</div>
            <div style={{ fontSize: '0.78rem', color: '#6B5C3E' }}>Submitted: 6 Apr 2026 · Nairobi</div>
          </div>
          <span className="kyc-status-badge" style={{ background: 'rgba(52,152,219,0.15)', color: '#1a6fa5' }}>🔍 UNDER REVIEW</span>
        </div>
      </div>

      <div className="kyc-status-card pending">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0B3D2E' }}>🛒 Baraka Organic Halal Shop</div>
            <div style={{ fontSize: '0.78rem', color: '#6B5C3E' }}>Submitted: 8 Apr 2026 · Mombasa</div>
          </div>
          <span className="kyc-status-badge kyc-pending">⏳ PENDING</span>
        </div>
      </div>
    </div>
  );
};

export default KYCStatus;
