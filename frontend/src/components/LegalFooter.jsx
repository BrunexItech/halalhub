import React from 'react';
import { Link } from 'react-router-dom';

const LegalFooter = () => {
  return (
    <footer className="bg-[#032A24] border-t border-[#C9A44B]/20 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="/itqaan_logo.png" 
              alt="Itqaan" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-[#B7C0BA] text-xs">|</span>
            <span className="text-[#B7C0BA] text-xs">ITTQANIYUN LIMITED</span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6 text-xs">
            <Link 
              to="/terms" 
              className="text-[#B7C0BA] hover:text-[#C9A44B] transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy" 
              className="text-[#B7C0BA] hover:text-[#C9A44B] transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-[#B7C0BA]/40">|</span>
            <span className="text-[#B7C0BA]/40 text-[10px]">
              ISSC Approved
            </span>
          </div>

          {/* Copyright */}
          <div className="text-[#B7C0BA]/40 text-[10px]">
            &copy; {new Date().getFullYear()} Itqaan. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;