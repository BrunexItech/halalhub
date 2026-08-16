import React from 'react';

const UsersTab = ({
  activeUserTab,
  setActiveUserTab,
  clients,
  vendors,
  leaders,
  admins,
  allUsers,
  loadingData,
  searchQuery,
  setSearchQuery,
  filterKYC,
  setFilterKYC,
  filteredUsers,
  getCurrentUsers,
  getCurrentUserCount,
  formatDate,
  formatCurrency,
  getStatusBadge,
  getRoleBadge,
  getLeaderTypeLabel,
  viewUserDetails,
  setUserToDelete,
  setShowDeleteModal,
  updateKYCStatus,
  loading
}) => {
  const userTabs = [
    { id: 'all', label: 'All Users', icon: 'UsersIcon' },
    { id: 'clients', label: 'Clients', icon: 'UserIcon' },
    { id: 'vendors', label: 'Vendors', icon: 'VendorIcon' },
    { id: 'leaders', label: 'Leaders', icon: 'LeaderIcon' },
    { id: 'admins', label: 'Admins', icon: 'AdminIcon' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
      <div className="flex flex-wrap justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
        <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">
          {activeUserTab === 'clients' && 'Clients'}
          {activeUserTab === 'vendors' && 'Vendors'}
          {activeUserTab === 'leaders' && 'Leaders'}
          {activeUserTab === 'admins' && 'Admins'}
          {activeUserTab === 'all' && 'All Users'}
        </h3>
        <span className="text-sm text-[#94A3B8]">{getCurrentUserCount()} users</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 bg-[#F1F7FC] rounded-2xl p-1.5 mb-4">
        {userTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveUserTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeUserTab === tab.id
                ? 'bg-white text-[#1A2A3A] shadow-sm'
                : 'text-[#5A6A7A] hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          type="text"
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
          value={filterKYC}
          onChange={(e) => setFilterKYC(e.target.value)}
        >
          <option value="All">All KYC</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
          <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
          <span>Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#1A2A3A] font-semibold">No users found</p>
          <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A2A3A]">
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Role</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Balance</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">KYC</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const kycStatus = getStatusBadge(user.kycstatus || 'pending');
                const displayRole = user.role === 'leader' ? 'leader' : user.role;
                return (
                  <tr key={user.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-xs">
                          {(user.fullname || user.fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#1A2A3A]">{user.fullname || user.fullName || 'Unknown'}</div>
                          <div className="text-xs text-[#94A3B8]">
                            {displayRole === 'leader' ? 'Leader' : user.role || 'client'}
                            {user.role === 'leader' && user.leader_type && (
                              <span className="ml-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[9px]">
                                {getLeaderTypeLabel(user.leader_type)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="text-xs">
                        <div className="text-[#1A2A3A]">{user.email || 'N/A'}</div>
                        <div className="text-[#94A3B8]">{user.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getRoleBadge(displayRole)}`}>
                        {displayRole === 'leader' ? 'Leader' : displayRole || 'client'}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell font-semibold text-[#1A2A3A]">{formatCurrency(user.walletbalance || 0)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${kycStatus.bg} ${kycStatus.text}`}>
                        {kycStatus.label}
                      </span>
                      {user.kycstatus === 'pending' && (
                        <div className="flex gap-1 mt-1">
                          <button className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-semibold hover:bg-emerald-600 hover:text-white transition" onClick={() => updateKYCStatus(user.id, 'verified')}>Approve</button>
                          <button className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-semibold hover:bg-red-600 hover:text-white transition" onClick={() => updateKYCStatus(user.id, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-[#94A3B8]">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition" onClick={() => viewUserDetails(user)} title="View">V</button>
                        <button className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition" onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} title="Delete">D</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersTab;