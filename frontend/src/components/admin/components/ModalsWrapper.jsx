import React from 'react';
import UserModal from './UserModal';
import DeleteModal from './DeleteModal';
import SuccessModal from './SuccessModal';

const ModalsWrapper = ({
  // User Modal
  showUserModal,
  setShowUserModal,
  selectedUser,
  formatCurrency,
  getRoleBadge,
  getStatusBadge,
  getLeaderTypeLabel,
  updateKYCStatus,
  // Delete Modal
  showDeleteModal,
  setShowDeleteModal,
  userToDelete,
  deleteUser,
  loading,
  // Success Modal
  showSuccessModal,
  setShowSuccessModal,
  modalMessage,
  // Additional modals
  showAddRecipientModal,
  setShowAddRecipientModal,
  recipientForm,
  setRecipientForm,
  editingRecipient,
  handleAddRecipient,
  loadingRecipientForm,
  zakatCategories,
  error,
  showDisburseModal,
  setShowDisburseModal,
  disburseForm,
  setDisburseForm,
  zakatRecipients,
  handleDisburse,
  loadingDisburse,
  showAddCampaignModal,
  setShowAddCampaignModal,
  campaignForm,
  setCampaignForm,
  editingCampaign,
  handleAddCampaign,
  loadingCampaignForm,
  sadaqaCategories,
  showAssignModal,
  setShowAssignModal,
  assignForm,
  setAssignForm,
  hearseProviders,
  handleAssignRequest,
  loadingAssign,
  showHajjBookingModal,
  setShowHajjBookingModal,
  selectedHajjBooking,
  handleCancelHajjBooking,
  showAddPlanModal,
  setShowAddPlanModal,
  planForm,
  setPlanForm,
  editingPlan,
  handleSavePlan,
  loadingPlanForm
}) => {
  return (
    <>
      {/* User Modal */}
      <UserModal
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        selectedUser={selectedUser}
        formatCurrency={formatCurrency}
        getRoleBadge={getRoleBadge}
        getStatusBadge={getStatusBadge}
        getLeaderTypeLabel={getLeaderTypeLabel}
        updateKYCStatus={updateKYCStatus}
      />

      {/* Delete Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        userToDelete={userToDelete}
        deleteUser={deleteUser}
        loading={loading}
      />

      {/* Success Modal */}
      <SuccessModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        modalMessage={modalMessage}
      />

      {/* Add/Edit Recipient Modal */}
      {showAddRecipientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddRecipientModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingRecipient ? 'Edit Recipient' : 'Add Recipient Organization'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddRecipientModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Organization Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={recipientForm.name}
                  onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                  placeholder="e.g., Islamic Relief Kenya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Category *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={recipientForm.category}
                  onChange={(e) => setRecipientForm({ ...recipientForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {zakatCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={recipientForm.description}
                  onChange={(e) => setRecipientForm({ ...recipientForm, description: e.target.value })}
                  placeholder="Brief description of the organization"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={recipientForm.location}
                  onChange={(e) => setRecipientForm({ ...recipientForm, location: e.target.value })}
                  placeholder="e.g., Nairobi, Kenya"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.contact_name}
                    onChange={(e) => setRecipientForm({ ...recipientForm, contact_name: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Phone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.contact_phone}
                    onChange={(e) => setRecipientForm({ ...recipientForm, contact_phone: e.target.value })}
                    placeholder="+254XXXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={recipientForm.contact_email}
                  onChange={(e) => setRecipientForm({ ...recipientForm, contact_email: e.target.value })}
                  placeholder="contact@organization.org"
                />
              </div>

              <div className="border-t border-[#E8EEF4] pt-4">
                <p className="text-xs text-[#94A3B8] mb-3">Payment Details (Optional)</p>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.bank_name}
                    onChange={(e) => setRecipientForm({ ...recipientForm, bank_name: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Bank Account Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.bank_account}
                    onChange={(e) => setRecipientForm({ ...recipientForm, bank_account: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">M-Pesa Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.mpesa_number}
                    onChange={(e) => setRecipientForm({ ...recipientForm, mpesa_number: e.target.value })}
                    placeholder="+254XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddRecipientModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleAddRecipient}
                  disabled={loadingRecipientForm || !recipientForm.name || !recipientForm.category}
                >
                  {loadingRecipientForm ? 'Saving...' : editingRecipient ? 'Update Recipient' : 'Add Recipient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDisburseModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Disburse Funds</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowDisburseModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Recipient *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={disburseForm.recipientId}
                  onChange={(e) => setDisburseForm({ ...disburseForm, recipientId: e.target.value })}
                >
                  <option value="">Select recipient</option>
                  {zakatRecipients.filter(r => r.verified).map(recipient => (
                    <option key={recipient.id} value={recipient.id}>{recipient.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Amount *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, amount: e.target.value })}
                  placeholder="0"
                  min="1"
                />
                <p className="text-xs text-[#94A3B8] mt-1">Available: {formatCurrency(zakatPool?.zakatBalance || 0)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Type</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={disburseForm.type}
                  onChange={(e) => setDisburseForm({ ...disburseForm, type: e.target.value })}
                >
                  <option value="zakat">Zakat</option>
                  <option value="sadaqa">Sadaqa</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowDisburseModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleDisburse}
                  disabled={loadingDisburse || !disburseForm.recipientId || !disburseForm.amount}
                >
                  {loadingDisburse ? 'Processing...' : 'Confirm Disbursement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Campaign Modal */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddCampaignModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddCampaignModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Water Well Project"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Organization *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.organization}
                  onChange={(e) => setCampaignForm({ ...campaignForm, organization: e.target.value })}
                  placeholder="e.g., Muslim Aid Kenya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Category *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={campaignForm.category}
                  onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {sadaqaCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Target Amount *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.target}
                  onChange={(e) => setCampaignForm({ ...campaignForm, target: e.target.value })}
                  placeholder="0"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Brief description of the campaign"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.location}
                  onChange={(e) => setCampaignForm({ ...campaignForm, location: e.target.value })}
                  placeholder="e.g., Garissa, Kenya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30"
                  checked={campaignForm.featured}
                  onChange={(e) => setCampaignForm({ ...campaignForm, featured: e.target.checked })}
                />
                <label htmlFor="featured" className="text-sm text-[#5A6A7A]">Feature this campaign</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddCampaignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleAddCampaign}
                  disabled={loadingCampaignForm || !campaignForm.name || !campaignForm.organization || !campaignForm.target || !campaignForm.category}
                >
                  {loadingCampaignForm ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Hearse Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Assign Service Request</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAssignModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Select Provider *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={assignForm.providerId}
                  onChange={(e) => setAssignForm({ ...assignForm, providerId: e.target.value })}
                >
                  <option value="">Select a verified provider</option>
                  {hearseProviders
                    .filter(p => p.is_verified && p.verification_status === 'approved')
                    .map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.business_name} - {provider.vehicle_type || 'N/A'}
                      </option>
                    ))}
                </select>
                {hearseProviders.filter(p => p.is_verified && p.verification_status === 'approved').length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No verified providers available. Please approve providers first.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Optional notes for the provider"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleAssignRequest}
                  disabled={loadingAssign || !assignForm.providerId || !assignForm.requestId}
                >
                  {loadingAssign ? 'Assigning...' : 'Assign Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hajj Booking Modal */}
      {showHajjBookingModal && selectedHajjBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHajjBookingModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Hajj Booking Details</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowHajjBookingModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="font-bold text-[#1A2A3A]">{selectedHajjBooking.package_name}</div>
                <div className="text-sm text-[#94A3B8]">{selectedHajjBooking.package_type}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Client</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.client_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Phone</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.client_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Email</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.client_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Pilgrims</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.pilgrims}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Total Amount</span>
                  <span className="font-bold text-[#1769AA]">{formatCurrency(selectedHajjBooking.total_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Booking Date</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedHajjBooking.booking_date)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#94A3B8]">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadge(selectedHajjBooking.status).bg} ${getStatusBadge(selectedHajjBooking.status).text}`}>
                    {getStatusBadge(selectedHajjBooking.status).label}
                  </span>
                </div>
              </div>

              {selectedHajjBooking.pilgrim_names && selectedHajjBooking.pilgrim_names.length > 0 && (
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">Pilgrim Names</p>
                  <ul className="text-sm text-[#1A2A3A] space-y-1">
                    {selectedHajjBooking.pilgrim_names.map((name, i) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedHajjBooking.special_requests && (
                <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                  <strong>Special Requests:</strong> {selectedHajjBooking.special_requests}
                </div>
              )}

              {selectedHajjBooking.status !== 'cancelled' && selectedHajjBooking.status !== 'completed' && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                    onClick={() => {
                      const reason = prompt('Enter reason for confirming:');
                      if (reason !== null) {
                        // Confirm logic
                      }
                    }}
                    disabled={loading}
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
                    onClick={() => {
                      const reason = prompt('Enter reason for cancellation:');
                      if (reason !== null) {
                        handleCancelHajjBooking(selectedHajjBooking.id, reason);
                      }
                    }}
                    disabled={loading}
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
              <button
                className="w-full px-4 py-2 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                onClick={() => setShowHajjBookingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Takaful Plan Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddPlanModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingPlan ? 'Edit Takaful Plan' : 'Add New Takaful Plan'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddPlanModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Plan Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g., Family Takaful Plan"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Type *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.type}
                  onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                  placeholder="e.g., Family, Health, Education"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Coverage</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.coverage}
                  onChange={(e) => setPlanForm({ ...planForm, coverage: e.target.value })}
                  placeholder="e.g., Comprehensive Medical"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Brief description of the plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Monthly Cost (KES) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={planForm.monthlyCost}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyCost: e.target.value })}
                    placeholder="1000"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Annual Cost (KES) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={planForm.annualCost}
                    onChange={(e) => setPlanForm({ ...planForm, annualCost: e.target.value })}
                    placeholder="10000"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Max Coverage (KES) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.maxCoverage}
                  onChange={(e) => setPlanForm({ ...planForm, maxCoverage: e.target.value })}
                  placeholder="500000"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Benefits (comma separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.benefits.join(', ')}
                  onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value.split(',').map(b => b.trim()).filter(Boolean) })}
                  placeholder="e.g., Outpatient, Inpatient, Maternity"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="planActive"
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                />
                <label htmlFor="planActive" className="text-sm text-[#5A6A7A]">Active</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddPlanModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleSavePlan}
                  disabled={loadingPlanForm || !planForm.name || !planForm.type || !planForm.monthlyCost || !planForm.annualCost || !planForm.maxCoverage}
                >
                  {loadingPlanForm ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalsWrapper;