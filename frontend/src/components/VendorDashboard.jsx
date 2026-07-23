import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorService, orderService, productService } from '../services/api';

const VendorDashboard = ({ user }) => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Business Types
  const businessTypes = [
    { id: 'butchery', name: 'Halal Butchery', description: 'Premium halal meat products', icon: '🥩' },
    { id: 'restaurant', name: 'Halal Restaurant', description: 'Halal-certified dining', icon: '🍽️' },
    { id: 'halalstay', name: 'HalalStay', description: 'Halal accommodation', icon: '🏨' },
    { id: 'ecommerce', name: 'E-Commerce', description: 'Online halal products', icon: '🛍️' },
    { id: 'bakery', name: 'Halal Bakery', description: 'Fresh halal baked goods', icon: '🍞' },
    { id: 'catering', name: 'Halal Catering', description: 'Event catering services', icon: '🎯' },
    { id: 'grocery', name: 'Halal Grocery', description: 'Halal grocery items', icon: '🛒' },
    { id: 'pharmacy', name: 'Halal Pharmacy', description: 'Halal-certified medicines', icon: '💊' },
    { id: 'fashion', name: 'Modest Fashion', description: 'Islamic modest clothing', icon: '👗' },
    { id: 'beauty', name: 'Halal Beauty', description: 'Halal cosmetics & beauty', icon: '✨' }
  ];

  // State
  const [selectedBusinessType, setSelectedBusinessType] = useState(null);
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    halalCertificate: null,
    businessType: ''
  });
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    rating: 0
  });
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // ===== FETCH DATA =====
  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    setLoading(true);
    setError('');
    try {
      // Mock data - replace with real API
      setStats({
        totalProducts: 24,
        totalOrders: 67,
        totalRevenue: 584500,
        pendingOrders: 8,
        rating: 4.9
      });
      
      setProducts([
        { id: 1, name: 'Premium Beef Cuts', category: 'Beef', price: 1200, stock: 45, status: 'Active', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=300&fit=crop', weight: '1kg' },
        { id: 2, name: 'Whole Organic Chicken', category: 'Poultry', price: 850, stock: 30, status: 'Active', image: 'https://plus.unsplash.com/premium_photo-1695931841253-1e17e7ed59b5?q=80&w=1470&auto=format&fit=crop', weight: '1.5kg' },
        { id: 3, name: 'Fresh Goat Meat', category: 'Goat', price: 1500, stock: 12, status: 'Low Stock', image: 'https://images.unsplash.com/photo-1695683948567-edd8b7ca3a6c?q=80&w=871&auto=format&fit=crop', weight: '1kg' }
      ]);
      
      setOrders([
        { id: 'ORD-001', customer: 'Ali Hassan', items: 'Beef Cuts x2', amount: 2400, status: 'Completed', date: '2026-07-06', avatar: 'https://ui-avatars.com/api/?name=Ali+Hassan&background=1769AA&color=fff' },
        { id: 'ORD-002', customer: 'Fatima Omar', items: 'Chicken x3, Sausages x2', amount: 3850, status: 'Pending', date: '2026-07-06', avatar: 'https://ui-avatars.com/api/?name=Fatima+Omar&background=C9A84C&color=fff' },
        { id: 'ORD-003', customer: 'Mohamed Ibrahim', items: 'Goat Meat x1', amount: 1500, status: 'Processing', date: '2026-07-05', avatar: 'https://ui-avatars.com/api/?name=Mohamed+Ibrahim&background=059669&color=fff' }
      ]);
      
      // Check if vendor has business setup
      const hasBusiness = localStorage.getItem('vendor_business');
      if (hasBusiness) {
        setBusinessInfo(JSON.parse(hasBusiness));
        setSelectedBusinessType(JSON.parse(hasBusiness).businessType);
      }
      
    } catch (err) {
      setError('Failed to load vendor data. Please refresh.');
      console.error('Vendor data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== BUSINESS SETUP =====
  const handleBusinessSetup = (businessType) => {
    setSelectedBusinessType(businessType);
    setBusinessInfo({ ...businessInfo, businessType: businessType.id });
    setShowBusinessSetup(true);
  };

  const saveBusinessSetup = () => {
    if (!businessInfo.name || !businessInfo.location || !businessInfo.phone) {
      setError('Please fill in all required fields');
      return;
    }
    
    localStorage.setItem('vendor_business', JSON.stringify(businessInfo));
    setShowBusinessSetup(false);
    setSuccess('Business setup complete!');
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleBusinessInfoChange = (e) => {
    setBusinessInfo({ ...businessInfo, [e.target.name]: e.target.value });
    setError('');
  };

  // ===== ORDER MANAGEMENT =====
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    setSuccess(`Order ${orderId} updated to ${newStatus}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // ===== PRODUCT MANAGEMENT =====
  const deleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // ===== HELPERS =====
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      'Processing': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      'Active': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      'Low Stock': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      'Cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      'Shipped': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      'Delivered': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
    };
    return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="h-8 bg-[#F1F7FC] rounded-2xl w-48 animate-pulse" />
          <div className="h-4 bg-[#F1F7FC] rounded-lg w-64 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#E8EEF4] shadow-sm animate-pulse">
              <div className="h-6 bg-[#F1F7FC] rounded-lg w-1/3 mb-3" />
              <div className="h-8 bg-[#F1F7FC] rounded-lg w-2/3 mb-2" />
              <div className="h-4 bg-[#F1F7FC] rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== MAIN COMPONENT =====
  // If no business setup, show business type selection
  if (!selectedBusinessType && !showBusinessSetup) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-[#1A2A3A]">Vendor Dashboard</h1>
            <p className="text-[#94A3B8] mt-1">Choose your business type to get started</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {businessTypes.map((type) => (
              <div 
                key={type.id} 
                className="bg-white rounded-2xl p-6 border-2 border-[#E8EEF4] hover:border-[#1769AA] hover:shadow-xl hover:shadow-[#1769AA]/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 group"
                onClick={() => handleBusinessSetup(type)}
              >
                <div className="text-4xl mb-4">{type.icon}</div>
                <h3 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{type.name}</h3>
                <p className="text-sm text-[#94A3B8] mt-1">{type.description}</p>
                <button className="mt-4 w-full py-3 rounded-2xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-300">
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== BUSINESS SETUP MODAL =====
  if (showBusinessSetup && selectedBusinessType) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EEF4]">
          <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
            <div>
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                Setup {selectedBusinessType.name}
              </h3>
              <p className="text-sm text-[#94A3B8]">Complete your business profile</p>
            </div>
            <button 
              className="w-10 h-10 rounded-2xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]"
              onClick={() => setShowBusinessSetup(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                type="text"
                name="name"
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                placeholder="Business Name *"
                value={businessInfo.name}
                onChange={handleBusinessInfoChange}
              />
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <textarea
                name="description"
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300 resize-y"
                placeholder="Business Description"
                rows="3"
                value={businessInfo.description}
                onChange={handleBusinessInfoChange}
              />
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                type="text"
                name="location"
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                placeholder="Location *"
                value={businessInfo.location}
                onChange={handleBusinessInfoChange}
              />
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                type="tel"
                name="phone"
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                placeholder="Phone Number *"
                value={businessInfo.phone}
                onChange={handleBusinessInfoChange}
              />
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1769AA]/20 to-[#2F80C0]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <input
                type="email"
                name="email"
                className="relative w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                placeholder="Email Address"
                value={businessInfo.email}
                onChange={handleBusinessInfoChange}
              />
            </div>
            
            {error && (
              <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-sm text-[#DC2626]">
                {error}
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
            <button 
              className="flex-1 px-6 py-3.5 rounded-2xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-300"
              onClick={() => setShowBusinessSetup(false)}
            >
              Cancel
            </button>
            <button 
              className="flex-1 px-6 py-3.5 rounded-2xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={saveBusinessSetup}
            >
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN DASHBOARD =====
  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===== PAGE HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">
              {businessInfo.name || 'Vendor Dashboard'}
            </h1>
            <p className="text-sm text-[#94A3B8] mt-0.5 flex items-center gap-2">
              <span>{selectedBusinessType?.icon}</span>
              <span>{selectedBusinessType?.name}</span>
              <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
              <span>{businessInfo.location || 'Manage your business'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified Vendor
            </span>
            <button 
              className="px-5 py-3 rounded-2xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate('/ecommerce')}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </span>
            </button>
            <button 
              className="px-4 py-3 rounded-2xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A] transition-all duration-300 text-sm"
              onClick={fetchVendorData}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== ERROR BANNER ===== */}
        {error && (
          <div className="mb-4 p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-sm text-[#DC2626]">
            <span>{error}</span>
            <button 
              className="px-4 py-2 rounded-2xl bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] transition-all duration-300"
              onClick={() => { setError(''); fetchVendorData(); }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-3xl">📦</span>
              <span className="text-xs font-semibold text-[#1769AA] bg-[#F1F7FC] px-3 py-1 rounded-full">Products</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-heading font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{stats.totalProducts}</div>
              <div className="text-xs text-[#94A3B8]">Total Products</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🛒</span>
              <span className="text-xs font-semibold text-[#1769AA] bg-[#F1F7FC] px-3 py-1 rounded-full">Orders</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-heading font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{stats.totalOrders}</div>
              <div className="text-xs text-[#94A3B8]">{stats.pendingOrders} pending</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-3xl">💰</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Revenue</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-heading font-bold text-[#1A2A3A] group-hover:text-emerald-600 transition-colors">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-xs text-[#94A3B8]">Total Revenue</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8EEF4] shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-3xl">⭐</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Rating</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-heading font-bold text-[#1A2A3A] group-hover:text-amber-600 transition-colors">{stats.rating}</div>
              <div className="text-xs text-[#94A3B8]">Average Rating</div>
            </div>
          </div>
        </div>

        {/* ===== PRODUCTS ===== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Your Products</h3>
            <button 
              className="text-sm font-semibold text-[#1769AA] hover:text-[#2F80C0] transition flex items-center gap-1"
              onClick={() => navigate('/ecommerce')}
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const badge = getStatusBadge(product.status);
              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/5 transition-all duration-300 group">
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${product.image})` }}
                  >
                    <span className={`absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {product.status}
                    </span>
                    <span className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{product.name}</h4>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm text-[#94A3B8]">{product.weight}</span>
                      <span className="font-bold text-[#1769AA]">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F7FC]">
                      <span className={`text-xs font-medium ${product.stock < 10 ? 'text-[#DC2626]' : 'text-[#94A3B8]'}`}>
                        Stock: {product.stock}
                      </span>
                      <button 
                        className="text-[#94A3B8] hover:text-[#DC2626] transition p-1.5 hover:bg-[#FEF2F2] rounded-lg"
                        onClick={() => deleteProduct(product.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== ORDERS ===== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Recent Orders</h3>
            <button className="text-sm font-semibold text-[#1769AA] hover:text-[#2F80C0] transition flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F7FC]">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Order</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-4 font-semibold text-[#1A2A3A]">{order.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <img src={order.avatar} alt={order.customer} className="w-8 h-8 rounded-xl" />
                          <span className="font-medium text-[#1A2A3A]">{order.customer}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#5A6A7A] hidden md:table-cell">{order.items}</td>
                      <td className="px-5 py-4 font-semibold text-[#1A2A3A]">{formatCurrency(order.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#94A3B8] hidden lg:table-cell">{order.date}</td>
                      <td className="px-5 py-4">
                        <select 
                          className="px-3 py-2 rounded-2xl border border-[#E2E8F0] bg-white text-xs font-medium text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-300"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div>
          <h3 className="text-lg font-heading font-bold text-[#1A2A3A] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div 
              className="bg-white rounded-2xl p-5 text-center border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/10 hover:border-[#1769AA] transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/ecommerce')}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">🛒</div>
              <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">Manage Products</div>
            </div>
            <div 
              className="bg-white rounded-2xl p-5 text-center border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/10 hover:border-[#1769AA] transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/kyc-status')}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">📋</div>
              <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">KYC Status</div>
            </div>
            <div 
              className="bg-white rounded-2xl p-5 text-center border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/10 hover:border-[#1769AA] transition-all duration-300 cursor-pointer group"
              onClick={() => alert('Payout history coming soon')}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">💰</div>
              <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">Payouts</div>
            </div>
            <div 
              className="bg-white rounded-2xl p-5 text-center border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/10 hover:border-[#1769AA] transition-all duration-300 cursor-pointer group"
              onClick={() => alert('Analytics coming soon')}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">📊</div>
              <div className="text-sm font-semibold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">Analytics</div>
            </div>
          </div>
        </div>

        {/* ===== SUCCESS TOAST ===== */}
        {success && (
          <div className="fixed top-6 right-6 z-50 bg-[#1769AA] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#1769AA]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-white/10">
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
            <button 
              className="text-white/60 hover:text-white transition ml-2"
              onClick={() => setSuccess('')}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;