import React from 'react';

const UserModal = ({
  showUserModal,
  setShowUserModal,
  selectedUser,
  formatCurrency,
  getRoleBadge,
  getStatusBadge,
  getLeaderTypeLabel,
  updateKYCStatus
}) => {
  if (!showUserModal || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">User Details</h3>
          <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowUserModal(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#F1F7FC]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white text-2xl font-bold">
              {(selectedUser.fullname || selectedUser.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold text-[#1A2A3A]">{selectedUser.fullname || selectedUser.fullName}</div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getRoleBadge(selectedUser.role)}`}>{selectedUser.role || 'client'}</span>
              {selectedUser.role === 'leader' && selectedUser.leader_type && (
                <span className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700">{getLeaderTypeLabel(selectedUser.leader_type)}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] rounded-xl p-3">
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-[#1A2A3A]">{selectedUser.email || 'N/A'}</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-3">
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Phone</p>
              <p className="text-sm font-medium text-[#1A2A3A]">{selectedUser.phone || 'N/A'}</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-3">
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Balance</p>
              <p className="text-sm font-medium text-[#1769AA]">{formatCurrency(selectedUser.walletbalance || 0)}</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-3">
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">KYC Status</p>
              <p className={`text-sm font-medium ${getStatusBadge(selectedUser.kycstatus || 'pending').text}`}>
                {getStatusBadge(selectedUser.kycstatus || 'pending').label}
              </p>
            </div>
          </div>

          {selectedUser.kycstatus === 'pending' && (
            <div className="flex gap-3 mt-5 pt-5 border-t border-[#F1F7FC]">
              <button className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition" onClick={() => { updateKYCStatus(selectedUser.id, 'verified'); setShowUserModal(false); }}>Approve KYC</button>
              <button className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition" onClick={() => { updateKYCStatus(selectedUser.id, 'rejected'); setShowUserModal(false); }}>Reject KYC</button>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-[#E8EEF4]">
          <button className="w-full py-2.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowUserModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;