import React from 'react';

const ButcheryTab = ({
  butcheryStats,
  butcherySubTab,
  setButcherySubTab,
  butcheryVendorFilter,
  setButcheryVendorFilter,
  butcheryProductFilter,
  setButcheryProductFilter,
  butcheryMeatTypeFilter,
  setButcheryMeatTypeFilter,
  filteredButcheryVendors,
  filteredButcheryProducts,
  loadingButchery,
  loading,
  formatCurrency,
  getStatusBadge,
  approveVendor,
  rejectVendor,
  handleToggleButcheryProduct
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1A2A3A]">{butcheryStats.totalButchers || 0}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Butchers</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{butcheryStats.activeButchers || 0}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Butchers</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{butcheryStats.pendingButchers || 0}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
        </div>
        <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#1769AA]">{butcheryStats.totalMeatProducts || 0}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Meat Products</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{butcheryStats.activeMeatProducts || 0}</div>
          <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Products</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
        <button
          onClick={() => setButcherySubTab('vendors')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            butcherySubTab === 'vendors' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Butchery Vendors
          {butcheryStats.pendingButchers > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {butcheryStats.pendingButchers}
            </span>
          )}
        </button>
        <button
          onClick={() => setButcherySubTab('products')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            butcherySubTab === 'products' 
              ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
              : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
          }`}
        >
          Meat Products
          {butcheryStats.activeMeatProducts > 0 && (
            <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5">
              {butcheryStats.activeMeatProducts}
            </span>
          )}
        </button>
      </div>

      {/* Vendors Tab */}
      {butcherySubTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h4 className="text-sm font-semibold text-[#1A2A3A]">Butchery Vendors</h4>
            <select
              className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
              value={butcheryVendorFilter}
              onChange={(e) => setButcheryVendorFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loadingButchery ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading vendors...</span>
            </div>
          ) : filteredButcheryVendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No butchery vendors found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Business</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Products</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredButcheryVendors.map((vendor) => {
                    const statusBadge = getStatusBadge(vendor.vendor_status);
                    return (
                      <tr key={vendor.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-semibold text-[#1A2A3A]">{vendor.business_name || vendor.fullname}</div>
                            <div className="text-xs text-[#94A3B8]">{vendor.profile_business_name || ''}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="text-[#1A2A3A]">{vendor.email || 'N/A'}</div>
                            <div className="text-[#94A3B8]">{vendor.phone || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{vendor.location || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{vendor.total_butchery_products || 0}</td>
                        <td className="px-3 py-2">
                          {vendor.vendor_status === 'pending' ? (
                            <div className="flex gap-1">
                              <button
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                                onClick={() => approveVendor(vendor)}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button
                                className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                onClick={() => rejectVendor(vendor)}
                                disabled={loading}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#94A3B8]">—</span>
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

      {/* Products Tab */}
      {butcherySubTab === 'products' && (
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
            <h4 className="text-sm font-semibold text-[#1A2A3A]">Meat Products</h4>
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                value={butcheryMeatTypeFilter}
                onChange={(e) => setButcheryMeatTypeFilter(e.target.value)}
              >
                <option value="all">All Meat Types</option>
                <option value="beef">Beef</option>
                <option value="goat">Goat</option>
                <option value="chicken">Chicken</option>
                <option value="lamb">Lamb</option>
                <option value="camel">Camel</option>
                <option value="fish">Fish</option>
                <option value="mixed">Mixed</option>
                <option value="other">Other</option>
              </select>
              <select
                className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                value={butcheryProductFilter}
                onChange={(e) => setButcheryProductFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loadingButchery ? (
            <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
              <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              <span>Loading products...</span>
            </div>
          ) : filteredButcheryProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#1A2A3A] font-semibold">No meat products found</p>
              <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1A2A3A]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Vendor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Meat Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Cut Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredButcheryProducts.map((product) => {
                    const statusBadge = getStatusBadge(product.is_active ? 'active' : 'inactive');
                    return (
                      <tr key={product.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-[#1A2A3A]">{product.name}</div>
                          <div className="text-xs text-[#94A3B8]">{product.category || 'N/A'}</div>
                        </td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{product.vendor_name || 'N/A'}</td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                            {product.meat_type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-xs text-[#94A3B8]">{product.cut_type || 'N/A'}</td>
                        <td className="px-3 py-2 font-semibold text-[#1769AA]">
                          {product.price_per_kg ? formatCurrency(product.price_per_kg) + '/kg' : formatCurrency(product.price)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className={`px-2 py-1 text-xs rounded hover:text-white transition ${
                              product.is_active 
                                ? 'bg-red-50 text-red-600 hover:bg-red-600' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600'
                            }`}
                            onClick={() => handleToggleButcheryProduct(product.id, product.is_active)}
                            disabled={loading}
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
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
    </div>
  );
};

export default ButcheryTab;