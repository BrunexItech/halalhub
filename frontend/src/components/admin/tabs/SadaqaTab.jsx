import React from 'react';

const SadaqaTab = ({
  loadingSadaqa,
  sadaqaCampaigns,
  sadaqaDonations,
  sadaqaPool,
  formatCurrency,
  formatDate,
  setShowAddCampaignModal,
  setEditingCampaign,
  setCampaignForm,
  handleDeleteCampaign
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
      <div className="flex flex-wrap justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
        <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Sadaqa Management</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[#94A3B8]">Pool: {formatCurrency(sadaqaPool.sadaqaBalance || 0)}</span>
          <button
            className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition"
            onClick={() => {
              setEditingCampaign(null);
              setCampaignForm({
                name: '', description: '', organization: '', target: '',
                category: '', location: '', image_url: '', end_date: '', featured: false
              });
              setShowAddCampaignModal(true);
            }}
          >
            + Add Campaign
          </button>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Campaigns</h4>
      {loadingSadaqa ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
        </div>
      ) : sadaqaCampaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[#94A3B8]">No campaigns created yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2A3A]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Organization</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Raised</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Target</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sadaqaCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-[#1A2A3A]">{campaign.name}</div>
                    <div className="text-xs text-[#94A3B8]">{campaign.category}</div>
                  </td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{campaign.organization}</td>
                  <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(campaign.raised || 0)}</td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{formatCurrency(campaign.target || 0)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                      {campaign.status || 'active'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                        onClick={() => {
                          setEditingCampaign(campaign);
                          setCampaignForm({
                            name: campaign.name || '',
                            description: campaign.description || '',
                            organization: campaign.organization || '',
                            target: campaign.target || '',
                            category: campaign.category || '',
                            location: campaign.location || '',
                            image_url: campaign.image_url || '',
                            end_date: campaign.end_date || '',
                            featured: campaign.featured || false
                          });
                          setShowAddCampaignModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-600 hover:text-white transition"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Donation History</h4>
      {sadaqaDonations.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-[#94A3B8]">No Sadaqa donations yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2A3A]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Campaign</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {sadaqaDonations.slice(0, 20).map((donation) => (
                <tr key={donation.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                  <td className="px-3 py-2 text-sm text-[#1A2A3A]">{donation.user_name || 'Anonymous'}</td>
                  <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(donation.amount)}</td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{donation.campaign_name || 'N/A'}</td>
                  <td className="px-3 py-2 text-sm text-[#94A3B8]">{formatDate(donation.paid_at)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${donation.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {donation.status || 'pending'}
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

export default SadaqaTab;