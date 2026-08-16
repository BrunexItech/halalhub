import React from 'react';

const SuccessModal = ({
  showSuccessModal,
  setShowSuccessModal,
  modalMessage
}) => {
  if (!showSuccessModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
      <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#E8EEF4] bg-emerald-600 rounded-t-3xl">
          <h3 className="text-xl font-heading font-bold text-white">Success</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-[#1A2A3A] font-medium">{modalMessage}</p>
        </div>
        <div className="p-6 border-t border-[#E8EEF4]">
          <button className="w-full py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition" onClick={() => setShowSuccessModal(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;