import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterRole = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const RoleCard = ({ id, title, description, icon, features, onClick }) => (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-500 text-left group ${
        hovered === id 
          ? 'border-[#C9A44B] bg-[#0B342B] shadow-2xl shadow-black/30 -translate-y-0.5' 
          : 'border-[rgba(201,164,75,0.18)] hover:border-[#C9A44B]/40 hover:bg-[#0B342B]/50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-500 flex-shrink-0 ${
          hovered === id 
            ? 'bg-gradient-to-br from-[#C9A44B] to-[#E1C16B] text-[#032A24] shadow-lg shadow-[#C9A44B]/20' 
            : 'bg-[#0B342B] text-[#C9A44B] border border-[rgba(201,164,75,0.18)]'
        }`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#F7F6F1]">{title}</div>
          <div className="text-xs text-[#B7C0BA] mt-0.5">{description}</div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {features.map((feature, idx) => (
              <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#0B342B] text-[#B7C0BA] border border-[rgba(201,164,75,0.18)]">
                {feature}
              </span>
            ))}
          </div>
        </div>
        <div className={`text-[#C9A44B] transition-all duration-500 ${
          hovered === id ? 'translate-x-0.5 opacity-100' : 'opacity-0'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#032A24] px-4 py-8">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="bg-[#0B342B] rounded-3xl shadow-2xl shadow-black/30 p-6 md:p-8 w-full border border-[#C9A44B]/30 relative overflow-hidden">
          
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <img 
                  src="/itqaan_logo.png" 
                  alt="Itqaan" 
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-[9px] font-medium text-[#C9A44B] tracking-[0.2em] uppercase">Choose Your Role</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#032A24] rounded-xl p-1 mb-6">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-[#B7C0BA] hover:text-[#F7F6F1] transition-all duration-300"
              >
                Sign In
              </button>
              <button className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] shadow-lg shadow-[#C9A44B]/30 transition-all duration-300">
                Register
              </button>
            </div>

            <h2 className="text-lg font-bold text-[#F7F6F1]">Choose Your Role</h2>
            <p className="text-[#B7C0BA] text-xs mt-1">Select how you want to use Itqaan</p>

            <div className="mt-4 space-y-3">
              <RoleCard
                id="client"
                title="Client"
                description="Access services as a customer"
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                }
                features={['Payments', 'Zakat', 'HalalStay']}
                onClick={() => navigate('/register/client')}
              />

              <RoleCard
                id="vendor"
                title="Vendor"
                description="Register your business"
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
                  </svg>
                }
                features={['Halal Certified', 'Sell Products']}
                onClick={() => navigate('/register/vendor')}
              />

              <RoleCard
                id="religious"
                title="Religious Leader"
                description="Register as an Islamic Scholar, Imam, Adhan Caller, Ustadh, Ustadha, or Kadhi"
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z"/>
                  </svg>
                }
                features={['Pension', 'Consultations', 'Verified']}
                onClick={() => navigate('/register/leader')}
              />
            </div>

            <div className="mt-6 pt-5 border-t border-[#C9A44B]/20 text-center">
              <p className="text-xs text-[#B7C0BA]">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/')}
                  className="font-semibold text-[#C9A44B] hover:text-[#E1C16B] transition"
                >
                  Sign In
                </button>
              </p>
            </div>

            <div className="mt-3">
              <p className="text-center text-[9px] text-[#C9A44B]/40 tracking-wider">
                Secure · Encrypted · No Riba
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterRole;