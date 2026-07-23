import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterRole = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F7FC] px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Single Card - Clean & Centered */}
        <div className="bg-white rounded-2xl shadow-xl shadow-[#1769AA]/5 p-8 lg:p-10 w-full border border-[#E8EEF4]">
          
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#1769AA] flex items-center justify-center">
                <span className="text-white text-lg font-bold">H</span>
              </div>
              <span className="text-2xl font-bold text-[#1A2A3A]">HalalHub</span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">Choose your account type</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-[#F1F7FC] rounded-xl p-1.5 mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-lg text-sm font-semibold text-[#5A6A7A] hover:text-[#1A2A3A] transition"
            >
              Sign In
            </button>
            <button className="flex-1 py-3 rounded-lg text-sm font-semibold bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20">
              Register
            </button>
          </div>

          <h2 className="text-xl font-bold text-[#1A2A3A]">Choose Your Role</h2>
          <p className="text-[#94A3B8] text-sm mt-1">Select how you want to use HalalHub</p>

          <div className="mt-6 space-y-4">
            {/* Client Role */}
            <button
              onClick={() => navigate('/register/client')}
              onMouseEnter={() => setHovered('client')}
              onMouseLeave={() => setHovered(null)}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                hovered === 'client' 
                  ? 'border-[#1769AA] bg-[#F1F7FC] shadow-lg shadow-[#1769AA]/10 -translate-y-0.5' 
                  : 'border-[#E2E8F0] hover:border-[#1769AA]/40 hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                  hovered === 'client' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'bg-[#F1F7FC] text-[#1769AA]'
                }`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#1A2A3A]">Client</div>
                  <div className="text-sm text-[#94A3B8]">Access services as a customer</div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1769AA]">Payments</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1769AA]">Zakat</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1769AA]">HalalStay</span>
                  </div>
                </div>
                <div className={`text-[#1769AA] transition-all duration-300 ${
                  hovered === 'client' ? 'translate-x-1 opacity-100' : 'opacity-0'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Vendor Role */}
            <button
              onClick={() => navigate('/register/vendor')}
              onMouseEnter={() => setHovered('vendor')}
              onMouseLeave={() => setHovered(null)}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                hovered === 'vendor' 
                  ? 'border-[#1769AA] bg-[#F1F7FC] shadow-lg shadow-[#1769AA]/10 -translate-y-0.5' 
                  : 'border-[#E2E8F0] hover:border-[#1769AA]/40 hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                  hovered === 'vendor' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'bg-[#F1F7FC] text-[#1769AA]'
                }`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#1A2A3A]">Vendor</div>
                  <div className="text-sm text-[#94A3B8]">Register your business</div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A]">Halal Certified</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1769AA]">Sell Products</span>
                  </div>
                </div>
                <div className={`text-[#1769AA] transition-all duration-300 ${
                  hovered === 'vendor' ? 'translate-x-1 opacity-100' : 'opacity-0'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-7 pt-6 border-t border-[#F1F7FC] text-center">
            <p className="text-sm text-[#5A6A7A]">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/')}
                className="font-semibold text-[#1769AA] hover:text-[#2F80C0] transition"
              >
                Sign In
              </button>
            </p>
          </div>

          <div className="mt-4">
            <p className="text-center text-xs text-[#94A3B8] tracking-wider">
              Secure · Encrypted · No Riba
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterRole;