import React from 'react';

const DeleteModal = ({
  showDeleteModal,
  setShowDeleteModal,
  userToDelete,
  deleteUser,
  loading
}) => {
  if (!showDeleteModal || !userToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
      <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
          <h3 className="text-xl font-heading font-bold text-red-600">Confirm Delete</h3>
          <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowDeleteModal(false)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 text-center">
          <h4 className="text-lg font-bold text-[#1A2A3A]">Delete User?</h4>
          <p className="text-sm text-[#94A3B8] mt-2">
            Are you sure you want to delete <strong className="text-[#1A2A3A]">{userToDelete.fullname || userToDelete.fullName}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
          <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
          <button 
            className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60" 
            onClick={deleteUser} 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;