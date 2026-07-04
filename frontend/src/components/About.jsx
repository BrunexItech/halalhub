import React from 'react';

const About = () => {
  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">ℹ️ About HalalHub</div>
          <div className="page-subtitle">Africa's leading Sharia-compliant fintech</div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, #0B3D2E, #145A40)', color: 'white', padding: '48px 40px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Amiri', serif", fontSize: '4rem', color: '#C9A84C' }}>هَلَال هَبْ</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 600, marginBottom: '12px' }}>HalalHub</div>
        <div style={{ fontSize: '1rem', opacity: 0.75, maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
          Africa's leading Sharia-compliant fintech and Islamic lifestyle platform — empowering Muslims across Kenya and East Africa.
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-gold">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9A84C, #E8C96A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🎓</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#0B3D2E' }}>Ali Amour</div>
              <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Co-Founder &amp; CEO</div>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#6B5C3E' }}>
            Nairobi-based fintech entrepreneur with deep expertise in East African financial ecosystems, M-Pesa integration, and Islamic finance.
          </p>
        </div>

        <div className="card card-forest">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #0B3D2E, #145A40)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>📖</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', fontWeight: 600, color: '#0B3D2E' }}>Dr. Ibrahim Bulushi</div>
              <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Co-Founder &amp; Chief Sharia Officer</div>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#6B5C3E' }}>
            PhD in Islamic Finance and Fiqh al-Muamalat. Ensures every product and transaction adheres strictly to Islamic law.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Our Core Services</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>⚖️ Zakat Calculator</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🤲 Sadaqa Campaigns</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🤝 P2P Amanah</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🛡️ Takaful</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🕌 Imam Pension</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>⚡ Utility Payments</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🏨 HalalStay</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🕋 Hajj &amp; Umrah</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🚑 Hearse &amp; Shroud</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🛒 Halal Market</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🍽️ HalaRestaurants</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>🕌 Mosque Finder</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>📜 Digital Wills</div>
          <div style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px' }}>📖 Kadhi Directory</div>
        </div>
      </div>
    </div>
  );
};

export default About;
