import React from 'react';

const ZakatTab = ({
  loadingZakat,
  zakatRecipients,
  zakatPayments,
  zakatPool,
  formatCurrency,
  formatDate,
  setShowAddRecipientModal,
  setEditingRecipient,
  setRecipientForm,
  setShowDisburseModal,
  setDisburseForm,
  zakatCategories
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
      <div className="flex flex-wrap justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
        <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Zakat Management</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[#94A3B8]">Pool: {formatCurrency(zakatPool.zakatBalance || 0)}</span>
          <button
            className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition"
            onClick={() => {
              setEditingRecipient(null);
              setRecipientForm({
                name: '', description: '', category: '', location: '',
                contact_name: '', contact_phone: '', contact_email: '',
                bank_name: '', bank_account: '', mpesa_number: ''
              });
              setShowAddRecipientModal(true);
            }}
          >
            + Add Recipient
          </button>
          <button
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
            onClick={() => setShowDisburseModal(true)}
            disabled={zakatPool.zakatBalance === 0}
          >
            Disburse
          </button>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Verified Recipients</h4>
      {loadingZakat ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
        </div>
      ) : zakatRecipients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[#94A3B8]">No recipients added yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2A3A]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Received</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Donors</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zakatRecipients.map((recipient) => (
                <tr key={recipient.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-[#1A2A3A]">{recipient.name}</div>
                    <div className="text-xs text-[#94A3B8]">{recipient.location || 'N/A'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                      {recipient.category || 'general'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(recipient.total_received || 0)}</td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{recipient.donor_count || 0}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${recipient.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {recipient.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                      onClick={() => {
                        setEditingRecipient(recipient);
                        setRecipientForm({
                          name: recipient.name || '',
                          description: recipient.description || '',
                          category: recipient.category || '',
                          location: recipient.location || '',
                          contact_name: recipient.contact_name || '',
                          contact_phone: recipient.contact_phone || '',
                          contact_email: recipient.contact_email || '',
                          bank_name: recipient.bank_name || '',
                          bank_account: recipient.bank_account || '',
                          mpesa_number: recipient.mpesa_number || ''
                        });
                        setShowAddRecipientModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Payment History</h4>
      {zakatPayments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-[#94A3B8]">No Zakat payments yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2A3A]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Recipient</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {zakatPayments.slice(0, 20).map((payment) => (
                <tr key={payment.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                  <td className="px-3 py-2 text-sm text-[#1A2A3A]">{payment.user_name || 'Unknown'}</td>
                  <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(payment.amount)}</td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{payment.recipient_name || 'N/A'}</td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{formatDate(payment.paid_at)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {payment.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ZakatTab;