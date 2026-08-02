import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] px-3 sm:px-4 md:px-5 lg:px-6 pt-1 sm:pt-4 md:pt-5 lg:pt-6 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-3 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const ecosystemServices = [
    { name: 'Digital Wallet', description: 'Secure daily transactions' },
    { name: 'P2P Amanah', description: 'Interest-free peer lending' },
    { name: 'Zakat', description: 'Calculate and pay Zakat' },
    { name: 'Sadaqa', description: 'Give voluntary charity' },
    { name: 'Takaful', description: 'Islamic mutual insurance' },
    { name: 'Imam Pension', description: 'Retirement support for Imams' },
    { name: 'HalalStay', description: 'Halal-friendly accommodation' },
    { name: 'Hajj & Umrah', description: 'Complete pilgrimage services' },
    { name: 'Digital Wills', description: 'Islamic estate planning' },
    { name: 'Mosque Finder', description: 'Discover mosques near you' },
    { name: 'Utilities', description: 'Pay your utility bills' },
    { name: 'Funeral Services', description: 'Islamic funeral assistance' },
  ];

  const values = [
    {
      title: 'Trust',
      description: 'Built on a foundation of integrity and reliability. Every interaction is designed to earn and maintain your confidence.'
    },
    {
      title: 'Transparency',
      description: 'Clear communication about services, fees, and processes. No hidden terms or unexpected surprises.'
    },
    {
      title: 'Community',
      description: 'Technology designed to connect, support, and strengthen the Ummah. We grow together.'
    },
    {
      title: 'Responsibility',
      description: 'Financial and digital services designed thoughtfully, with care for their impact on individuals and communities.'
    },
    {
      title: 'Accessibility',
      description: 'Important services should be easier for Muslims to access, regardless of where they are.'
    },
    {
      title: 'Innovation',
      description: 'Islamic values and modern technology working together responsibly to serve the community better.'
    }
  ];

  // SVG Icons
  const ShieldIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const HeartIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const GlobeIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  );

  const StarIcon = () => (
    <svg className="w-5 h-5 text-[#C9A44B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const BuildingIcon = () => (
    <svg className="w-5 h-5 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF7] px-3 sm:px-4 md:px-5 lg:px-6 pt-1 sm:pt-4 md:pt-5 lg:pt-6 pb-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ===== HERO SECTION ===== */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)] mb-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-[rgba(201,164,75,0.05)] rounded-full" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <BuildingIcon />
                <span className="text-[10px] font-semibold text-[#B7C0BA] uppercase tracking-wider">About HalalHub</span>
                <span className="w-px h-3 bg-[rgba(201,164,75,0.2)]" />
                <span className="text-[10px] font-medium text-[#C9A44B]">Islamic Digital Ecosystem</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F7F6F1] leading-tight">
                Technology That Serves
                <span className="block text-[#C9A44B]">Faith, Community & Everyday Life</span>
              </h1>
              <p className="text-[#B7C0BA] text-sm mt-2 max-w-xl leading-relaxed">
                HalalHub is a complete Islamic digital ecosystem designed to help Muslims access 
                trusted financial services, charitable solutions, travel experiences, and everyday 
                digital tools in one connected platform.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button 
                  className="px-5 py-2 bg-[#C9A44B] text-[#032A24] font-bold text-sm rounded-lg hover:bg-[#E1C16B] transition-all duration-200 shadow-lg shadow-[#C9A44B]/20"
                  onClick={() => navigate('/register/role')}
                >
                  Explore HalalHub
                </button>
                <button 
                  className="px-5 py-2 bg-white/10 backdrop-blur-sm text-[#F7F6F1] font-semibold text-sm rounded-lg border border-[rgba(201,164,75,0.2)] hover:bg-white/20 transition-all duration-200"
                  onClick={() => document.querySelector('.mission-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Our Mission
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#C9A44B] to-[#E1C16B] flex items-center justify-center shadow-xl shadow-[#C9A44B]/20">
                <span className="text-3xl sm:text-4xl font-bold text-[#032A24]">H</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== THE PROBLEM ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[10px] font-semibold text-[#0B342B] uppercase tracking-wider">Why HalalHub Exists</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1.5">The Muslim Digital Experience Should Not Be Fragmented</h2>
            <div className="w-12 h-0.5 bg-[#0B342B] mx-auto mt-3 rounded-full" />
            <p className="text-sm text-[#6B7280] mt-3 leading-relaxed">
              Muslims today often rely on many disconnected platforms for payments, giving, travel, 
              community support, and everyday services. HalalHub brings these essential services 
              together into one connected ecosystem designed around Islamic values.
            </p>
          </div>
        </div>

        {/* ===== MISSION & VISION ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 mission-section">
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-[#0B342B]">1</span>
            </div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-1.5">Our Mission</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              To build technology that respects Islamic values, connects communities, and makes 
              essential services more accessible to Muslims everywhere.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-[#0B342B]">2</span>
            </div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-1.5">Our Vision</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              A world where Muslims can access trusted, meaningful, and Sharia-conscious digital 
              services through one connected ecosystem.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 text-center hover:shadow-md hover:border-[rgba(11,52,43,0.2)] transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-[#0B342B]">3</span>
            </div>
            <h3 className="text-sm font-bold text-[#1F2937] mb-1.5">Our Purpose</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Technology is the tool. The purpose is to make meaningful services more accessible, 
              transparent, and connected for the Muslim community.
            </p>
          </div>
        </div>

        {/* ===== THE ECOSYSTEM ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <span className="text-[10px] font-semibold text-[#0B342B] uppercase tracking-wider">One Connected Platform</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1.5">The HalalHub Ecosystem</h2>
            <div className="w-12 h-0.5 bg-[#0B342B] mx-auto mt-3 rounded-full" />
            <p className="text-sm text-[#6B7280] mt-3 max-w-2xl mx-auto">
              All the services you need, designed for the Muslim community, in one trusted place.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {ecosystemServices.map((service, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg border border-[rgba(11,52,43,0.08)] shadow-sm p-3 hover:border-[#0B342B]/40 hover:shadow-md transition-all duration-300 text-center"
              >
                <div className="text-xs font-semibold text-[#1F2937]">{service.name}</div>
                <div className="text-[10px] text-[#6B7280] mt-0.5">{service.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ISLAMIC VALUES ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <span className="text-[10px] font-semibold text-[#0B342B] uppercase tracking-wider">Guided by Principles</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1.5">Our Values</h2>
            <div className="w-12 h-0.5 bg-[#0B342B] mx-auto mt-3 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 hover:border-[#0B342B]/40 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-1.5">
                  <StarIcon />
                  <h3 className="text-sm font-bold text-[#1F2937]">{value.title}</h3>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SHARIA-CONSCIOUS DESIGN ===== */}
        <div className="bg-[#0B342B]/5 rounded-xl border border-[rgba(11,52,43,0.08)] p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldIcon />
              <h3 className="text-sm font-bold text-[#1F2937]">Designed with Islamic Principles in Mind</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              HalalHub is built to be Sharia-conscious, transparent, and responsible. Every service is 
              designed with care for Islamic values, encouraging users to consult qualified professionals 
              for specific religious or legal guidance when needed.
            </p>
          </div>
        </div>

        {/* ===== GLOBAL COMMUNITY ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
            <div>
              <span className="text-[10px] font-semibold text-[#0B342B] uppercase tracking-wider">For Muslims Worldwide</span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1.5">A Global Community</h2>
              <div className="w-12 h-0.5 bg-[#0B342B] mt-3 rounded-full" />
              <p className="text-sm text-[#6B7280] mt-3 leading-relaxed">
                HalalHub is not limited by borders. Muslims around the world have different cultures, 
                languages, and needs. Our platform is designed to serve Muslims across different regions 
                while respecting local realities.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-xl font-bold text-[#0B342B]">10K+</div>
                  <div className="text-[10px] text-[#6B7280]">Community Members</div>
                </div>
                <div className="p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-xl font-bold text-[#0B342B]">8+</div>
                  <div className="text-[10px] text-[#6B7280]">Countries</div>
                </div>
                <div className="p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-xl font-bold text-[#0B342B]">12+</div>
                  <div className="text-[10px] text-[#6B7280]">Services</div>
                </div>
                <div className="p-3 bg-[#FAFAF7] rounded-lg border border-[rgba(11,52,43,0.06)]">
                  <div className="text-xl font-bold text-[#3FAF73]">98%</div>
                  <div className="text-[10px] text-[#6B7280]">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== HOW WE'RE DIFFERENT ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-5">
              <span className="text-[10px] font-semibold text-[#0B342B] uppercase tracking-wider">What Makes Us Different</span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] mt-1.5">Built for the Muslim Community</h2>
              <div className="w-12 h-0.5 bg-[#0B342B] mx-auto mt-3 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 border border-[rgba(11,52,43,0.08)] rounded-lg hover:border-[#0B342B]/40 transition-all duration-300">
                <div className="text-sm font-semibold text-[#1F2937]">Not a Generic Platform</div>
                <p className="text-xs text-[#6B7280] mt-1">HalalHub is designed around the needs and values of the Muslim community from the beginning — not a generic platform with Islamic features added later.</p>
              </div>
              <div className="p-3 border border-[rgba(11,52,43,0.08)] rounded-lg hover:border-[#0B342B]/40 transition-all duration-300">
                <div className="text-sm font-semibold text-[#1F2937]">Connected Ecosystem</div>
                <p className="text-xs text-[#6B7280] mt-1">Unlike disconnected services, HalalHub brings financial tools, charitable solutions, travel services, and everyday digital experiences into one trusted platform.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== THE FUTURE ===== */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-[#FAFAF7] rounded-xl border border-[rgba(11,52,43,0.08)] p-4 sm:p-6 text-center">
            <h3 className="text-sm font-bold text-[#1F2937] mb-1.5">Continuously Evolving</h3>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
              The ecosystem grows as the needs of the community grow. HalalHub is committed to 
              expanding its services, reaching more communities, and building trusted partnerships 
              across the globe.
            </p>
          </div>
        </div>

        {/* ===== CALL TO ACTION ===== */}
        <div className="bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#032A24] rounded-xl sm:rounded-2xl p-5 sm:p-7 text-center shadow-xl shadow-black/10 border border-[rgba(201,164,75,0.15)]">
          <h2 className="text-lg sm:text-xl font-bold text-[#F7F6F1] mb-1.5">Join the HalalHub Community</h2>
          <p className="text-[#B7C0BA] text-sm max-w-xl mx-auto leading-relaxed">
            Explore the ecosystem and discover how HalalHub can serve your needs.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button 
              className="px-6 py-2 bg-[#C9A44B] text-[#032A24] font-bold text-sm rounded-lg hover:bg-[#E1C16B] transition-all duration-200 shadow-lg shadow-[#C9A44B]/20"
              onClick={() => navigate('/register/role')}
            >
              Explore the Ecosystem
            </button>
            <button 
              className="px-6 py-2 bg-white/10 backdrop-blur-sm text-[#F7F6F1] font-semibold text-sm rounded-lg border border-[rgba(201,164,75,0.2)] hover:bg-white/20 transition-all duration-200"
              onClick={() => navigate('/dashboard')}
            >
              Discover HalalHub
            </button>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-[#6B7280] tracking-wider">
            Built with purpose. Guided by faith. Serving the Ummah.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;