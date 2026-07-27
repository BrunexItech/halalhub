import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cart from './Cart';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Ecommerce = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('halalhub_token');
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Products
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // ===== CART =====
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // ===== ORDERS =====
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  
  // ===== SEARCH & FILTER =====
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  
  // ===== WISHLIST =====
  const [wishlist, setWishlist] = useState([]);
  
  // ===== CHECKOUT =====
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // ===== DERIVED DATA =====
  const [categories, setCategories] = useState(['All']);
  const [vendors, setVendors] = useState(['All']);
  
  const priceRanges = [
    { label: 'All', value: 'All' },
    { label: 'Under KES 1,000', value: 'under-1000', min: 0, max: 1000 },
    { label: 'KES 1,000 - 2,500', value: '1000-2500', min: 1000, max: 2500 },
    { label: 'KES 2,500 - 5,000', value: '2500-5000', min: 2500, max: 5000 },
    { label: 'Over KES 5,000', value: 'over-5000', min: 5000, max: Infinity }
  ];

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchCart();
    fetchOrders();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE}/client/products`, config);
      
      const productData = response.data.products || [];
      setProducts(productData);
      
      const uniqueCategories = ['All', ...new Set(productData.map(p => p.category).filter(Boolean))];
      const uniqueVendors = ['All', ...new Set(productData.map(p => p.vendor_name || p.business_name).filter(Boolean))];
      setCategories(uniqueCategories);
      setVendors(uniqueVendors);
      
      applyFilters(productData);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/cart`, config);
      setCart(response.data.items || []);
    } catch (err) {
      console.error('Cart error:', err);
      setCart([]);
    }
  };

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/client/orders`, config);
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // ===== FILTER FUNCTIONS =====
  const applyFilters = (productList = products) => {
    let filtered = [...productList];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.vendor_name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (selectedVendor !== 'All') {
      filtered = filtered.filter(p => p.vendor_name === selectedVendor || p.business_name === selectedVendor);
    }
    
    if (selectedPriceRange !== 'All') {
      const range = priceRanges.find(r => r.value === selectedPriceRange);
      if (range) {
        filtered = filtered.filter(p =>
          p.price >= range.min && p.price <= range.max
        );
      }
    }
    
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        break;
    }
    
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedVendor, selectedPriceRange, sortBy, products]);

  // ===== CART FUNCTIONS =====
  const addToCart = async (product) => {
    if (!isAuthenticated) {
      setError('Please login to add items to cart');
      return;
    }
    
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/cart`, { 
        product_id: product.id, 
        quantity: 1 
      }, config);
      
      await fetchCart();
      
      setSuccess(`${product.name} added to cart!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add to cart. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/cart/${productId}`, config);
      await fetchCart();
    } catch (err) {
      setError('Failed to remove item from cart.');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/cart/${productId}`, { quantity }, config);
      await fetchCart();
    } catch (err) {
      setError('Failed to update quantity.');
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  // ===== CHECKOUT =====
  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty!');
      return;
    }
    setShowCheckoutModal(true);
  };

  const confirmOrder = async () => {
    setProcessing(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const orderData = {
        vendor_id: cart[0]?.vendor_id || cart[0]?.vendorId,
        items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: getCartTotal(),
        delivery_fee: 500,
        delivery_address: 'Nairobi CBD'
      };
      
      await axios.post(`${API_BASE}/client/orders`, orderData, config);
      
      const newOrderNumber = 'HM' + Date.now().toString().slice(-8);
      setOrderNumber(newOrderNumber);
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      
      // Clear cart immediately
      setCart([]);
      
      await fetchOrders();
      
      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
      setSuccess('Added to wishlist!');
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
    }).format(amount || 0);
  };

  const getStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if ((rating || 0) % 1 >= 0.5) stars += '★';
    return stars;
  };

  const getStatusBadge = (status) => {
    const colors = {
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      'processing': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'shipped': { bg: 'bg-amber-50', text: 'text-amber-700' },
      'pending': { bg: 'bg-orange-50', text: 'text-orange-700' },
      'cancelled': { bg: 'bg-red-50', text: 'text-red-700' }
    };
    return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-700' };
  };

  // SVG Icons
  const CartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const HeartIcon = ({ filled }) => (
    <svg className={`w-5 h-5 ${filled ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-[#F1F7FC] rounded-2xl w-48 animate-pulse" />
            <div className="h-4 bg-[#F1F7FC] rounded-lg w-64 mt-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm animate-pulse">
                <div className="h-48 bg-[#F1F7FC]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#F1F7FC] rounded-lg w-3/4" />
                  <div className="h-3 bg-[#F1F7FC] rounded-lg w-1/2" />
                  <div className="h-6 bg-[#F1F7FC] rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">Halal Market</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Shop halal-certified products from trusted vendors</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isAuthenticated && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {user?.fullName || 'Guest'}
              </span>
            )}
            <button
              className="relative px-4 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition"
              onClick={() => setShowCart(true)}
            >
              <span className="flex items-center gap-1.5">
                <CartIcon />
                Cart
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {getCartItemCount()}
                  </span>
                )}
              </span>
            </button>
            {!isAuthenticated ? (
              <button className="px-4 py-2.5 rounded-xl bg-[#1A2A3A] text-white font-semibold text-sm hover:bg-[#2A3A4A] transition" onClick={() => navigate('/register/role')}>
                Sign In / Register
              </button>
            ) : (
              <>
                <button className="px-3 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition text-sm" onClick={() => setShowOrderHistory(!showOrderHistory)}>
                  Orders
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3 text-sm text-red-600">
            <span>{error}</span>
            <button className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition" onClick={() => { setError(''); fetchProducts(); }}>
              Retry
            </button>
          </div>
        )}

        {/* HERO */}
        <div className="bg-gradient-to-r from-[#1769AA] to-[#2F80C0] rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">Welcome to Halal Market</span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">Shop with Peace of Mind</h2>
              <p className="text-white/80 text-sm mt-1">100% halal-certified products from trusted sellers.</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{products.length} Products</span>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">100% Halal Certified</span>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">{categories.length - 1} Categories</span>
              </div>
            </div>
            <div className="text-6xl opacity-80">🛍️</div>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <input type="text" className="w-full px-4 py-2.5 pl-9 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><SearchIcon /></span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Category</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 appearance-none" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Vendor</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 appearance-none" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                {vendors.map(vendor => <option key={vendor} value={vendor}>{vendor}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Price</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 appearance-none" value={selectedPriceRange} onChange={(e) => setSelectedPriceRange(e.target.value)}>
                {priceRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Sort</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 appearance-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#F1F7FC]">
            <span className="text-sm text-[#94A3B8]">{filteredProducts.length} products found</span>
            <button className="text-sm text-[#1769AA] hover:text-[#2F80C0] transition flex items-center gap-1" onClick={fetchProducts}>
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EEF4]">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-[#1A2A3A]">No products found</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/5 transition-all duration-300 group cursor-pointer" onClick={() => { setSelectedProduct(p); setShowProductModal(true); }}>
                <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${p.images?.[0] || 'https://via.placeholder.com/400x300/1769AA/fff?text=Product'})` }}>
                  {p.badge && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1769AA] text-white text-[10px] font-semibold">{p.badge}</span>}
                  {p.original_price && <span className="absolute top-3 right-12 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">-{Math.round((1 - p.price / p.original_price) * 100)}%</span>}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}><HeartIcon filled={wishlist.includes(p.id)} /></button>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors text-sm">{p.name}</h4>
                    <span className="text-xs font-semibold text-[#C9A84C]">{getStars(p.rating)} {p.rating}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">by {p.vendor_name || p.business_name || 'Vendor'} · {p.reviews || 0} reviews</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✓ Halal</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">{p.category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F7FC]">
                    <div>
                      <span className="font-bold text-[#1769AA] text-lg">{formatCurrency(p.price)}</span>
                      {p.original_price && <span className="text-xs text-[#94A3B8] line-through ml-2">{formatCurrency(p.original_price)}</span>}
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-[#1769AA] text-white text-xs font-semibold hover:bg-[#2F80C0] transition disabled:opacity-50" onClick={(e) => { e.stopPropagation(); addToCart(p); }} disabled={processing}>Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER HISTORY */}
        {isAuthenticated && showOrderHistory && (
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Order History</h3>
              <button className="px-3 py-1.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowOrderHistory(false)}>Close</button>
            </div>
            {loadingOrders ? (
              <div className="text-center py-8 text-[#94A3B8]">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-[#1A2A3A] font-semibold">No orders yet</p>
                <p className="text-sm text-[#94A3B8]">Start shopping to see your orders here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="flex flex-wrap items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-[#1A2A3A]">#{order.id}</span>
                        <span className="text-sm text-[#94A3B8]">{new Date(order.order_date).toLocaleDateString()}</span>
                        <span className="text-sm text-[#94A3B8]">{order.items?.length || 0} items</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#1A2A3A]">{formatCurrency(order.total_amount)}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>{order.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center">
            <div className="text-2xl font-heading font-bold text-[#1A2A3A]">{products.length}</div>
            <div className="text-xs text-[#94A3B8]">Halal Products</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center">
            <div className="text-2xl font-heading font-bold text-[#1A2A3A]">{categories.length - 1}</div>
            <div className="text-xs text-[#94A3B8]">Categories</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center">
            <div className="text-2xl font-heading font-bold text-emerald-600">100%</div>
            <div className="text-xs text-[#94A3B8]">Halal Certified</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center">
            <div className="text-2xl font-heading font-bold text-[#C9A84C]">✓</div>
            <div className="text-xs text-[#94A3B8]">Trusted Sellers</div>
          </div>
        </div>

        {/* ===== CART COMPONENT WITH PROPS ===== */}
        <Cart 
          cart={cart}
          setCart={setCart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          getCartTotal={getCartTotal}
          getCartItemCount={getCartItemCount}
          handleCheckout={handleCheckout}
          processing={processing}
          formatCurrency={formatCurrency}
          onClose={() => setShowCart(false)}
          showCart={showCart}
          isAuthenticated={isAuthenticated}
          fetchCart={fetchCart}
        />

        {/* ===== PRODUCT DETAIL MODAL ===== */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={() => setShowProductModal(false)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <button className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A] shadow-sm z-10" onClick={() => setShowProductModal(false)}><CloseIcon /></button>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-64 md:h-auto bg-cover bg-center rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none" style={{ backgroundImage: `url(${selectedProduct.images?.[0] || 'https://via.placeholder.com/400x300/1769AA/fff?text=Product'})` }} />
                <div className="p-6">
                  <h2 className="text-xl font-heading font-bold text-[#1A2A3A]">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-[#C9A84C]">{getStars(selectedProduct.rating)} {selectedProduct.rating}</span>
                    <span className="text-sm text-[#94A3B8]">({selectedProduct.reviews || 0} reviews)</span>
                    <span className="text-sm text-[#94A3B8]">by {selectedProduct.vendor_name || 'Vendor'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedProduct.tags?.map((tag, i) => <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">#{tag}</span>)}
                  </div>
                  <p className="text-sm text-[#5A6A7A] mt-3 leading-relaxed">{selectedProduct.description}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-2xl font-heading font-bold text-[#1769AA]">{formatCurrency(selectedProduct.price)}</span>
                    {selectedProduct.original_price && <span className="text-sm text-[#94A3B8] line-through">{formatCurrency(selectedProduct.original_price)}</span>}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-50" onClick={() => { addToCart(selectedProduct); setShowProductModal(false); }} disabled={processing}>Add to Cart</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCheckoutModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Order Summary</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowCheckoutModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#F1F7FC] text-sm">
                      <span className="text-[#1A2A3A]">{item.name} x{item.quantity}</span>
                      <span className="font-semibold text-[#1A2A3A]">{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Subtotal:</span><span className="font-semibold text-[#1A2A3A]">{formatCurrency(getCartTotal())}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Delivery:</span><span className="font-semibold text-[#1A2A3A]">{formatCurrency(500)}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-[#E2E8F0] pt-2"><span className="text-[#1A2A3A]">Total:</span><span className="text-[#1769AA]">{formatCurrency(getCartTotal() + 500)}</span></div>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mt-4">{error}</div>}
              </div>
              <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-50" onClick={confirmOrder} disabled={processing}>{processing ? 'Processing...' : 'Place Order'}</button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Order Placed!</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowSuccessModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-xl font-heading font-bold text-[#1A2A3A]">Order Confirmed!</h4>
                <p className="text-sm text-[#94A3B8] mt-1">Order #{orderNumber}</p>
                <p className="text-sm text-[#5A6A7A] mt-4 leading-relaxed">Your order has been placed successfully.</p>
              </div>
              <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition" onClick={() => { setShowSuccessModal(false); setShowOrderHistory(true); }}>View Orders</button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowSuccessModal(false)}>Continue Shopping</button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS TOAST */}
        {success && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-3 animate-slideDown max-w-sm">
            <span className="text-sm font-medium">{success}</span>
            <button className="text-white/70 hover:text-white transition" onClick={() => setSuccess('')}>
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ecommerce;