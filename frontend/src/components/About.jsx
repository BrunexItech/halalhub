import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const ecosystemServices = [
    { name: 'Wallet', description: 'Digital wallet for everyday transactions' },
    { name: 'P2P Amanah', description: 'Interest-free peer-to-peer lending' },
    { name: 'Zakat', description: 'Calculate and pay your Zakat' },
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

  return (
    <div className="min-h-screen bg-[#F1F7FC]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-8 md:p-12 lg:p-16 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">About HalalHub</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Islamic Digital Ecosystem</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Technology That Serves
                <span className="block text-[#E8C96A]">Faith, Community & Everyday Life</span>
              </h1>
              <p className="text-white/70 text-base md:text-lg mt-4 max-w-xl leading-relaxed">
                HalalHub is a complete Islamic digital ecosystem designed to help Muslims access 
                trusted financial services, charitable solutions, travel experiences, and everyday 
                digital tools in one connected platform.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button 
                  className="px-6 py-3 bg-[#E8C96A] text-[#0a1628] font-bold rounded-xl hover:bg-[#d4b95a] transition-all duration-200 shadow-lg shadow-[#E8C96A]/20"
                  onClick={() => navigate('/register/role')}
                >
                  Explore HalalHub
                </button>
                <button 
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
                  onClick={() => document.querySelector('.mission-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Our Mission
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <span className="text-5xl md:text-7xl font-bold text-white/90">H</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        
        {/* ===== THE PROBLEM ===== */}
        <div className="mb-12 md:mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-semibold text-[#1769AA] uppercase tracking-wider">Why HalalHub Exists</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2A3A] mt-2">The Muslim Digital Experience Should Not Be Fragmented</h2>
            <div className="w-16 h-1 bg-[#1769AA] mx-auto mt-4 rounded-full" />
            <p className="text-[#5A6A7A] text-base md:text-lg mt-4 leading-relaxed">
              Muslims today often rely on many disconnected platforms for payments, giving, travel, 
              community support, and everyday services. HalalHub brings these essential services 
              together into one connected ecosystem designed around Islamic values.
            </p>
          </div>
        </div>

        {/* ===== MISSION & VISION ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-16 mission-section">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 text-center hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[#1769AA]">1</span>
            </div>
            <h3 className="text-lg font-bold text-[#1A2A3A] mb-2">Our Mission</h3>
            <p className="text-sm text-[#5A6A7A] leading-relaxed">
              To build technology that respects Islamic values, connects communities, and makes 
              essential services more accessible to Muslims everywhere.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 text-center hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[#1769AA]">2</span>
            </div>
            <h3 className="text-lg font-bold text-[#1A2A3A] mb-2">Our Vision</h3>
            <p className="text-sm text-[#5A6A7A] leading-relaxed">
              A world where Muslims can access trusted, meaningful, and Sharia-conscious digital 
              services through one connected ecosystem.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 text-center hover:shadow-md transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[#1769AA]">3</span>
            </div>
            <h3 className="text-lg font-bold text-[#1A2A3A] mb-2">Our Purpose</h3>
            <p className="text-sm text-[#5A6A7A] leading-relaxed">
              Technology is the tool. The purpose is to make meaningful services more accessible, 
              transparent, and connected for the Muslim community.
            </p>
          </div>
        </div>

        {/* ===== THE ECOSYSTEM ===== */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-[#1769AA] uppercase tracking-wider">One Connected Platform</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2A3A] mt-2">The HalalHub Ecosystem</h2>
            <div className="w-16 h-1 bg-[#1769AA] mx-auto mt-4 rounded-full" />
            <p className="text-[#5A6A7A] text-base mt-4 max-w-2xl mx-auto">
              All the services you need, designed for the Muslim community, in one trusted place.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ecosystemServices.map((service, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 hover:border-[#1769AA] hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="text-sm font-semibold text-[#1A2A3A]">{service.name}</div>
                <div className="text-xs text-[#94A3B8] mt-1">{service.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ISLAMIC VALUES ===== */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-[#1769AA] uppercase tracking-wider">Guided by Principles</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2A3A] mt-2">Our Values</h2>
            <div className="w-16 h-1 bg-[#1769AA] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 hover:border-[#1769AA] transition-all duration-200">
                <h3 className="text-base font-bold text-[#1769AA] mb-2">{value.title}</h3>
                <p className="text-sm text-[#5A6A7A] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SHARIA-CONSCIOUS DESIGN ===== */}
        <div className="bg-[#1769AA]/5 rounded-xl border border-[#1769AA]/10 p-6 md:p-8 mb-12 md:mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-bold text-[#1A2A3A] mb-3">Designed with Islamic Principles in Mind</h3>
            <p className="text-sm md:text-base text-[#5A6A7A] leading-relaxed">
              HalalHub is built to be Sharia-conscious, transparent, and responsible. Every service is 
              designed with care for Islamic values, encouraging users to consult qualified professionals 
              for specific religious or legal guidance when needed.
            </p>
          </div>
        </div>

        {/* ===== GLOBAL COMMUNITY ===== */}
        <div className="mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-semibold text-[#1769AA] uppercase tracking-wider">For Muslims Worldwide</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2A3A] mt-2">A Global Community</h2>
              <div className="w-16 h-1 bg-[#1769AA] mt-4 rounded-full" />
              <p className="text-[#5A6A7A] text-base md:text-lg mt-4 leading-relaxed">
                HalalHub is not limited by borders. Muslims around the world have different cultures, 
                languages, and needs. Our platform is designed to serve Muslims across different regions 
                while respecting local realities.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-[#F1F7FC] rounded-lg">
                  <div className="text-2xl font-bold text-[#1769AA]">10K+</div>
                  <div className="text-xs text-[#94A3B8]">Community Members</div>
                </div>
                <div className="p-4 bg-[#F1F7FC] rounded-lg">
                  <div className="text-2xl font-bold text-[#1769AA]">8+</div>
                  <div className="text-xs text-[#94A3B8]">Countries</div>
                </div>
                <div className="p-4 bg-[#F1F7FC] rounded-lg">
                  <div className="text-2xl font-bold text-[#1769AA]">12+</div>
                  <div className="text-xs text-[#94A3B8]">Services</div>
                </div>
                <div className="p-4 bg-[#F1F7FC] rounded-lg">
                  <div className="text-2xl font-bold text-[#1769AA]">98%</div>
                  <div className="text-xs text-[#94A3B8]">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== HOW WE'RE DIFFERENT ===== */}
        <div className="mb-12 md:mb-16">
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 md:p-8">
            <div className="text-center mb-6">
              <span className="text-xs font-semibold text-[#1769AA] uppercase tracking-wider">What Makes Us Different</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2A3A] mt-2">Built for the Muslim Community</h2>
              <div className="w-16 h-1 bg-[#1769AA] mx-auto mt-4 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-[#E8EEF4] rounded-lg">
                <div className="text-sm font-semibold text-[#1A2A3A]">Not a Generic Platform</div>
                <p className="text-sm text-[#5A6A7A] mt-1">HalalHub is designed around the needs and values of the Muslim community from the beginning — not a generic platform with Islamic features added later.</p>
              </div>
              <div className="p-4 border border-[#E8EEF4] rounded-lg">
                <div className="text-sm font-semibold text-[#1A2A3A]">Connected Ecosystem</div>
                <p className="text-sm text-[#5A6A7A] mt-1">Unlike disconnected services, HalalHub brings financial tools, charitable solutions, travel services, and everyday digital experiences into one trusted platform.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== THE FUTURE ===== */}
        <div className="mb-12 md:mb-16">
          <div className="bg-[#F1F7FC] rounded-xl border border-[#E8EEF4] p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-[#1A2A3A] mb-3">Continuously Evolving</h3>
            <p className="text-sm md:text-base text-[#5A6A7A] max-w-2xl mx-auto leading-relaxed">
              The ecosystem grows as the needs of the community grow. HalalHub is committed to 
              expanding its services, reaching more communities, and building trusted partnerships 
              across the globe.
            </p>
          </div>
        </div>

        {/* ===== CALL TO ACTION ===== */}
        <div className="bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl p-8 md:p-12 text-center shadow-lg shadow-[#1769AA]/20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Join the HalalHub Community</h2>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Explore the ecosystem and discover how HalalHub can serve your needs.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button 
              className="px-8 py-3 bg-[#E8C96A] text-[#0a1628] font-bold rounded-xl hover:bg-[#d4b95a] transition-all duration-200 shadow-lg shadow-[#E8C96A]/20"
              onClick={() => navigate('/register/role')}
            >
              Explore the Ecosystem
            </button>
            <button 
              className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={() => navigate('/dashboard')}
            >
              Discover HalalHub
            </button>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#94A3B8] tracking-wider">
            Built with purpose. Guided by faith. Serving the Ummah.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;