import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const LegalModal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#FAFAF7] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-[#032A24] px-6 py-4 flex items-center justify-between border-b border-[rgba(201,164,75,0.2)]">
          <div className="flex items-center gap-3">
            <img 
              src="/itqaan_logo.png" 
              alt="Itqaan" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-[#F7F6F1] font-semibold text-sm">|</span>
            <span className="text-[#C9A44B] font-medium text-sm">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#12342D] transition-colors flex items-center justify-center text-[#B7C0BA] hover:text-[#F7F6F1]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[rgba(201,164,75,0.3)] scrollbar-track-transparent">
          {children}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-[#032A24]/5 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-[#C9A44B]/30 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LegalModal;