import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ecommerceService, cartService, paymentService, orderService } from '../services/api';
import Cart from './Cart';

const Ecommerce = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });
  
  // ===== TERMS & CONDITIONS =====
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsScrollComplete, setTermsScrollComplete] = useState(false);
  const termsContentRef = useRef(null);
  
  // Products
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // ===== CART =====
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  
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
  const [priceRange, setPriceRange] = useState([0, 10000]);
  
  // ===== WISHLIST =====
  const [wishlist, setWishlist] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);
  
  // ===== CHECKOUT =====
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
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
    fetchWishlist();
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
      const mockProducts = [
        { id: 1, name: 'Premium Medjool Dates — 1kg', category: 'Halal Food', price: 1800, originalPrice: 2200, seller: 'Al-Madinah Dates', image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=400&h=300&fit=crop&crop=center', rating: 4.8, reviews: 234, description: 'Premium quality Medjool dates from the holy city of Madinah.', inStock: true, badge: 'Best Seller', tags: ['Organic', 'Premium', 'Ramadan Special'], vendorId: 1 },
        { id: 2, name: 'Halal Honey — Kenyan Pure', category: 'Halal Food', price: 950, originalPrice: 1200, seller: 'Baraka Bee Farm', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop&crop=center', rating: 4.9, reviews: 178, description: '100% pure, raw honey from Kenya.', inStock: true, badge: 'Organic', tags: ['Raw', 'Unfiltered', 'Natural'], vendorId: 2 },
        { id: 3, name: 'Halal Beef Sausages — 500g', category: 'Halal Food', price: 750, originalPrice: 900, seller: 'Halal Meats Kenya', image: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=400&h=300&fit=crop&crop=center', rating: 4.6, reviews: 89, description: 'Premium halal beef sausages.', inStock: true, badge: 'New', tags: ['Beef', 'Spicy', 'Grill Ready'], vendorId: 3 },
        { id: 4, name: 'Zamzam Water — 5L', category: 'Halal Food', price: 350, originalPrice: 450, seller: 'Barakah Supplies', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop&crop=center', rating: 4.9, reviews: 312, description: 'Blessed Zamzam water from Makkah.', inStock: true, badge: 'Sacred', tags: ['Zamzam', 'Blessed', 'Makkah'], vendorId: 4 },
        { id: 5, name: 'Assorted Halal Chocolates', category: 'Halal Food', price: 1200, originalPrice: 1500, seller: 'Sweet Halal Treats', image: 'https://images.unsplash.com/photo-1549007953-2f2c0f240b6a?w=400&h=300&fit=crop&crop=center', rating: 4.7, reviews: 156, description: 'Luxury halal chocolates.', inStock: true, badge: 'Gift Box', tags: ['Assorted', 'Luxury', 'Gift'], vendorId: 5 },
        { id: 6, name: 'Ihram Set — Men (Hajj/Umrah)', category: 'Islamic Clothing', price: 2500, originalPrice: 3200, seller: 'Makkah Gear', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=300&fit=crop&crop=center', rating: 4.7, reviews: 189, description: 'High-quality white ihram set for Hajj and Umrah.', inStock: true, badge: 'Hajj Essential', tags: ['Turkish Fabric', 'Seamless', 'Luxury'], vendorId: 6 },
        { id: 7, name: 'Premium Abaya — Modest Fashion', category: 'Islamic Clothing', price: 4500, originalPrice: 5500, seller: 'Haya Designs', image: 'https://images.unsplash.com/photo-1586363104863-0f6e5b6ca66f?w=400&h=300&fit=crop&crop=center', rating: 4.9, reviews: 267, description: 'Elegant premium abaya.', inStock: true, badge: 'Best Seller', tags: ['Crepe', 'Embroidered', 'Modern'], vendorId: 7 },
        { id: 8, name: 'Kufi Cap — Embroidered (Pack of 3)', category: 'Islamic Clothing', price: 1800, originalPrice: 2200, seller: 'Makkah Gear', image: 'https://images.unsplash.com/photo-1586363104863-0f6e5b6ca66f?w=400&h=300&fit=crop&crop=center', rating: 4.6, reviews: 123, description: 'Beautiful embroidered kufi caps.', inStock: true, badge: 'Set of 3', tags: ['Assorted Colors', 'Embroidered', 'Comfortable'], vendorId: 6 },
        { id: 9, name: 'Quran — Large Print Tajweed', category: 'Books', price: 3200, originalPrice: 4000, seller: 'Islamic Books Kenya', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&crop=center', rating: 4.9, reviews: 456, description: 'Large print Quran with Tajweed color coding.', inStock: true, badge: 'Best Seller', tags: ['Tajweed', 'Large Print', 'Madinah Script'], vendorId: 8 },
        { id: 10, name: 'Premium Prayer Mat — Silk Touch', category: 'Prayer Items', price: 1500, originalPrice: 1900, seller: 'Sujood Imports', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=300&fit=crop&crop=center', rating: 4.8, reviews: 567, description: 'Luxury prayer mat with silk-like finish.', inStock: true, badge: 'Premium', tags: ['Luxury', 'Non-Slip', 'Beautiful'], vendorId: 9 },
        { id: 11, name: 'Islamic Wall Art — Calligraphy', category: 'Home & Décor', price: 4500, originalPrice: 5500, seller: 'Islamic Art Kenya', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=300&fit=crop&crop=center', rating: 4.8, reviews: 234, description: 'Beautiful Islamic calligraphy wall art.', inStock: true, badge: 'Best Seller', tags: ['Calligraphy', 'Framed', 'Decor'], vendorId: 10 },
        { id: 12, name: 'Halal Skincare Set (3-Piece)', category: 'Beauty & Wellness', price: 5500, originalPrice: 6800, seller: 'PureHalal Beauty', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop&crop=center', rating: 4.7, reviews: 156, description: 'Complete halal skincare set.', inStock: true, badge: 'Best Seller', tags: ['Natural', 'Alcohol-Free', 'Complete Set'], vendorId: 11 }
      ];
      
      setProducts(mockProducts);
      
      const uniqueCategories = ['All', ...new Set(mockProducts.map(p => p.category))];
      const uniqueVendors = ['All', ...new Set(mockProducts.map(p => p.seller))];
      setCategories(uniqueCategories);
      setVendors(uniqueVendors);
      
      applyFilters(mockProducts);
      
    } catch (err) {
      setError('Failed to load products. Please refresh.');
      console.error('Products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    setCartLoading(true);
    try {
      setCart([]);
    } catch (err) {
      console.error('Cart error:', err);
    } finally {
      setCartLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      setOrders([]);
    } catch (err) {
      console.error('Orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    try {
      setWishlist([]);
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  // ===== FILTER FUNCTIONS =====
  const applyFilters = (productList = products) => {
    let filtered = [...productList];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.seller.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (selectedVendor !== 'All') {
      filtered = filtered.filter(p => p.seller === selectedVendor);
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
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
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
      setShowAuthModal(true);
      return;
    }
    
    if (!product.inStock) {
      setError('⚠️ This product is out of stock.');
      return;
    }
    
    setProcessing(true);
    try {
      const existing = cart.find(item => item.id === product.id);
      if (existing) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, { ...product, quantity: 1 }]);
      }
      
      setSuccess(`✅ ${product.name} added to cart!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add to cart. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setCart(cart.filter(item => item.id !== productId));
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
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    } catch (err) {
      setError('Failed to update quantity.');
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // ===== WISHLIST =====
  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      if (wishlist.includes(productId)) {
        setWishlist(wishlist.filter(id => id !== productId));
        setSuccess('⭐ Removed from wishlist');
      } else {
        setWishlist([...wishlist, productId]);
        setSuccess('⭐ Added to wishlist!');
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update wishlist.');
    }
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newOrderNumber = 'HM' + Date.now().toString().slice(-8);
      setOrderNumber(newOrderNumber);
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      setCart([]);
      
      await fetchOrders();
      
      setSuccess('✅ Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
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

  const getStars = (rating) => {
    const fullStars = Math.floor(rating);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '⭐';
    if (rating % 1 >= 0.5) stars += '⭐';
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

  const handleAuth = (e) => {
    e.preventDefault();
    // Auth logic here
  };

  const handleAuthInputChange = (e) => {
    setAuthFormData({ ...authFormData, [e.target.name]: e.target.value });
  };

  const handleTermsScroll = (e) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      setTermsScrollComplete(true);
    }
  };

  const handleTermsAccept = () => {
    if (termsScrollComplete) {
      setShowTermsModal(false);
    }
  };

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
        {/* ===== PAGE HEADER ===== */}
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
              className="relative px-4 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200"
              onClick={() => setShowCart(true)}
            >
              🛒 Cart
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {getCartItemCount()}
                </span>
              )}
            </button>
            {!isAuthenticated ? (
              <button className="px-4 py-2.5 rounded-xl bg-[#1A2A3A] text-white font-semibold text-sm hover:bg-[#2A3A4A] transition-all duration-200" onClick={() => setShowAuthModal(true)}>
                Sign In / Register
              </button>
            ) : (
              <>
                <button className="px-3 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition-all duration-200 text-sm" onClick={() => setShowWishlist(!showWishlist)}>
                  ❤️ {wishlist.length}
                </button>
                <button className="px-3 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition-all duration-200 text-sm" onClick={() => setShowOrderHistory(!showOrderHistory)}>
                  📋 Orders
                </button>
              </>
            )}
          </div>
        </div>

        {/* ===== ERROR BANNER ===== */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3 text-sm text-red-600">
            <span>{error}</span>
            <button className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition" onClick={() => { setError(''); fetchProducts(); }}>
              Retry
            </button>
          </div>
        )}

        {/* ===== HERO BANNER ===== */}
        <div className="bg-gradient-to-r from-[#1769AA] to-[#2F80C0] rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">🌙 Welcome to Halal Market</span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">Shop with Peace of Mind</h2>
              <p className="text-white/80 text-sm mt-1">100% halal-certified products from trusted sellers.</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">🛒 {products.length} Products</span>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">✓ 100% Halal Certified</span>
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">🏷️ {categories.length - 1} Categories</span>
              </div>
            </div>
            <div className="text-6xl opacity-80">🛍️</div>
          </div>
        </div>

        {/* ===== SEARCH & FILTER ===== */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">🔎 Search</label>
              <input type="text" className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">📂 Category</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">🏪 Vendor</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                {vendors.map(vendor => <option key={vendor} value={vendor}>{vendor}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">💰 Price</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedPriceRange} onChange={(e) => setSelectedPriceRange(e.target.value)}>
                {priceRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">📊 Sort</label>
              <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="popular">⭐ Popular</option>
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💰 Price: High to Low</option>
                <option value="name">📝 Name</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#F1F7FC]">
            <span className="text-sm text-[#94A3B8]">{filteredProducts.length} products found</span>
          </div>
        </div>

        {/* ===== PRODUCTS GRID ===== */}
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
                <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${p.image})` }}>
                  {p.badge && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1769AA] text-white text-[10px] font-semibold">{p.badge}</span>}
                  {p.originalPrice && <span className="absolute top-3 right-12 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">-{Math.round((1 - p.price / p.originalPrice) * 100)}%</span>}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-lg shadow-sm hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}>{wishlist.includes(p.id) ? '❤️' : '🤍'}</button>
                  {!p.inStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Out of Stock</span></div>}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors text-sm">{p.name}</h4>
                    <span className="text-xs font-semibold text-[#C9A84C]">{getStars(p.rating)} {p.rating}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">by {p.seller} · {p.reviews} reviews</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✓ Halal</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">{p.category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F7FC]">
                    <div>
                      <span className="font-bold text-[#1769AA] text-lg">{formatCurrency(p.price)}</span>
                      {p.originalPrice && <span className="text-xs text-[#94A3B8] line-through ml-2">{formatCurrency(p.originalPrice)}</span>}
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-[#1769AA] text-white text-xs font-semibold hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); addToCart(p); }} disabled={!p.inStock || processing}>{p.inStock ? '🛒 Add' : 'Out of Stock'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== ORDER HISTORY ===== */}
        {isAuthenticated && showOrderHistory && (
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">📋 Order History</h3>
              <button className="px-3 py-1.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowOrderHistory(false)}>✕ Close</button>
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
                        <span className="text-sm text-[#94A3B8]">{order.date}</span>
                        <span className="text-sm text-[#94A3B8]">{order.items} items</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#1A2A3A]">{formatCurrency(order.total)}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>{order.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== STATS ===== */}
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

        {/* ======================================== */}
        {/* ===== CART COMPONENT ===== */}
        {/* ======================================== */}
        <Cart />

        {/* ======================================== */}
        {/* ===== MODALS ===== */}
        {/* ======================================== */}

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAuthModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">🛒 Welcome to Halal Market</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAuthModal(false)}>✕</button>
              </div>
              <div className="p-6">
                <div className="flex gap-1 bg-[#F1F7FC] rounded-xl p-1.5 mb-6">
                  <button className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === 'signin' ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' : 'text-[#5A6A7A] hover:text-[#1A2A3A]'}`} onClick={() => setAuthMode('signin')}>Sign In</button>
                  <button className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === 'register' ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' : 'text-[#5A6A7A] hover:text-[#1A2A3A]'}`} onClick={() => setAuthMode('register')}>Register</button>
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div><label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Full Name</label><input type="text" name="fullName" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="Your full name" value={authFormData.fullName} onChange={handleAuthInputChange} required /></div>
                      <div><label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Phone Number</label><input type="tel" name="phone" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="+254 7XX XXX XXX" value={authFormData.phone} onChange={handleAuthInputChange} required /></div>
                    </>
                  )}
                  <div><label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Email</label><input type="email" name="email" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="your@email.com" value={authFormData.email} onChange={handleAuthInputChange} required /></div>
                  <div><label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Password</label><input type="password" name="password" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="••••••••" value={authFormData.password} onChange={handleAuthInputChange} required minLength="6" /></div>
                  {authMode === 'register' && <div><label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Confirm Password</label><input type="password" name="confirmPassword" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="••••••••" value={authFormData.confirmPassword} onChange={handleAuthInputChange} required minLength="6" /></div>}
                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProductModal(false)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button className="absolute right-6 top-6 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A] shadow-sm" onClick={() => setShowProductModal(false)}>✕</button>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-64 md:h-auto bg-cover bg-center rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none" style={{ backgroundImage: `url(${selectedProduct.image})` }} />
                <div className="p-6">
                  <h2 className="text-xl font-heading font-bold text-[#1A2A3A]">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-[#C9A84C]">{getStars(selectedProduct.rating)} {selectedProduct.rating}</span>
                    <span className="text-sm text-[#94A3B8]">({selectedProduct.reviews} reviews)</span>
                    <span className="text-sm text-[#94A3B8]">by {selectedProduct.seller}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedProduct.tags?.map((tag, i) => <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">#{tag}</span>)}
                  </div>
                  <p className="text-sm text-[#5A6A7A] mt-3 leading-relaxed">{selectedProduct.description}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-2xl font-heading font-bold text-[#1769AA]">{formatCurrency(selectedProduct.price)}</span>
                    {selectedProduct.originalPrice && <span className="text-sm text-[#94A3B8] line-through">{formatCurrency(selectedProduct.originalPrice)}</span>}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { addToCart(selectedProduct); setShowProductModal(false); }} disabled={!selectedProduct.inStock || processing}>{selectedProduct.inStock ? '🛒 Add to Cart' : 'Out of Stock'}</button>
                    <button className="px-4 py-3 rounded-xl bg-white border border-[#E2E8F0] text-[#5A6A7A] hover:bg-[#F1F7FC] transition-all duration-200" onClick={() => toggleWishlist(selectedProduct.id)}>{wishlist.includes(selectedProduct.id) ? '❤️ Saved' : '🤍 Save'}</button>
                  </div>
                  <div className="mt-3">{selectedProduct.inStock ? <span className="text-sm text-emerald-600 font-semibold">✅ In Stock</span> : <span className="text-sm text-red-600 font-semibold">❌ Out of Stock</span>}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCheckoutModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">📋 Order Summary</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowCheckoutModal(false)}>✕</button>
              </div>
              <div className="p-6">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#F1F7FC] text-sm">
                      <span className="text-[#1A2A3A]">{item.name} x{item.quantity}</span>
                      <span className="font-semibold text-[#1A2A3A]">{formatCurrency(item.price * item.quantity)}</span>
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
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-200" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200 disabled:opacity-50" onClick={confirmOrder} disabled={processing}>{processing ? 'Processing...' : '✅ Place Order'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">✅ Order Placed!</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowSuccessModal(false)}>✕</button>
              </div>
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-xl font-heading font-bold text-[#1A2A3A]">Order Confirmed!</h4>
                <p className="text-sm text-[#94A3B8] mt-1">Order #: {orderNumber}</p>
                <p className="text-sm text-[#5A6A7A] mt-4 leading-relaxed">Your order has been placed successfully. You will receive a confirmation email shortly.</p>
              </div>
              <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200" onClick={() => { setShowSuccessModal(false); setShowOrderHistory(true); }}>View Orders</button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-200" onClick={() => setShowSuccessModal(false)}>Continue Shopping</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SUCCESS TOAST ===== */}
        {success && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-3 animate-slideDown max-w-sm">
            <span className="text-sm font-medium">{success}</span>
            <button className="text-white/70 hover:text-white transition" onClick={() => setSuccess('')}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ecommerce;