import React from 'react';

const HajjTab = ({
  hajjStats,
  hajjSubTab,
  setHajjSubTab,
  hajjPackageFilter,
  setHajjPackageFilter,
  hajjBookingFilter,
  setHajjBookingFilter,
  hajjTypeFilter,
  setHajjTypeFilter,
  filteredHajjPackages,
  filteredHajjBookings,
  loadingHajj,
  loading,
  formatCurrency,
  formatDate,
  getStatusBadge,
  handleToggleHajjPackage,
  handleCancelHajjBooking,
  viewHajjBooking
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1A2A3A]">{hajjStats.totalPackages}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Packages</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{hajjStats.activePackages}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Packages</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{hajjStats.pendingBookings}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending Bookings</div>
        </div>
        <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(hajjStats.totalRevenue)}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Revenue</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{hajjStats.completedBookings}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Completed</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
        <button
          onClick={() => setHajjSubTab('packages')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            hajjSubTab === 'packages' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Packages
          {hajjStats.totalPackages > 0 && (
            <span className="ml-2 bg-[#1769AA] text-white text-xs rounded-full px-2 py-0.5">
              {hajjStats.totalPackages}
            </span>
          )}
        </button>
        <button
          onClick={() => setHajjSubTab('bookings')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            hajjSubTab === 'bookings' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Bookings
          {hajjStats.pendingBookings > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {hajjStats.pendingBookings}
            </span>
          )}
        </button>
      </div>

      {/* Packages Tab */}
      {hajjSubTab === 'packages' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h4 className="text-sm font-semibold text-[#1A2A3A]">Hajj & Umrah Packages</h4>
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                value={hajjPackageFilter}
                onChange={(e) => setHajjPackageFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                value={hajjTypeFilter}
                onChange={(e) => setHajjTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="hajj">Hajj</option>
                <option value="umrah">Umrah</option>
              </select>
            </div>
          </div>

          {loadingHajj ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading packages...</span>
            </div>
          ) : filteredHajjPackages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No packages found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Vendor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Slots</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHajjPackages.map((pkg) => {
                    const statusBadge = getStatusBadge(pkg.is_active ? 'active' : 'inactive');
                    return (
                      <tr key={pkg.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-[#1A2A3A]">{pkg.name}</div>
                          <div className="text-xs text-[#94A3B8]">{pkg.duration_days} days</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.type === 'hajj' ? 'bg-[#1769AA]/10 text-[#1769AA]' : 'bg-emerald-50 text-emerald-700'}`}>
                            {pkg.type === 'hajj' ? 'Hajj' : 'Umrah'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{pkg.vendor_name || 'N/A'}</td>
                        <td className="px-3 py-2 hidden md:table-cell font-semibold text-[#1769AA]">{formatCurrency(pkg.price)}</td>
                        <td className="px-3 py-2 hidden lg:table-cell text-sm text-[#94A3B8]">{pkg.available_slots}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className={`px-2 py-1 text-xs rounded hover:text-white transition ${
                              pkg.is_active 
                                ? 'bg-red-50 text-red-600 hover:bg-red-600' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600'
                            }`}
                            onClick={() => handleToggleHajjPackage(pkg.id, pkg.is_active)}
                            disabled={loading}
                          >
                            {pkg.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {hajjSubTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h4 className="text-sm font-semibold text-[#1A2A3A]">Hajj & Umrah Bookings</h4>
            <select
              className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
              value={hajjBookingFilter}
              onChange={(e) => setHajjBookingFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loadingHajj ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading bookings...</span>
            </div>
          ) : filteredHajjBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No bookings found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Client</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Package</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Pilgrims</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHajjBookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status);
                    return (
                      <tr key={booking.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-semibold text-[#1A2A3A]">{booking.client_name || 'Unknown'}</div>
                            <div className="text-xs text-[#94A3B8]">{booking.client_phone || ''}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{booking.package_name}</td>
                        <td className="px-3 py-2 hidden md:table-cell text-sm text-[#94A3B8]">{booking.pilgrims}</td>
                        <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(booking.total_price)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {booking.status !== 'cancelled' && booking.status !== 'completed' ? (
                            <div className="flex gap-1">
                              <button
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                                onClick={() => {
                                  const reason = prompt('Enter reason for confirming:');
                                  if (reason !== null) {
                                    // Confirm logic would go here
                                  }
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                onClick={() => {
                                  const reason = prompt('Enter reason for cancellation:');
                                  if (reason !== null) {
                                    handleCancelHajjBooking(booking.id, reason);
                                  }
                                }}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                                onClick={() => viewHajjBooking(booking)}
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <button
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                              onClick={() => viewHajjBooking(booking)}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HajjTab;