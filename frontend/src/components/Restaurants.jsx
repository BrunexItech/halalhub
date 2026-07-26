import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cart from './Cart';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Restaurants = () => {
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
  
  // Restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [minRating, setMinRating] = useState(0);
  
  // Menu
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  
  // Order
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState({
    deliveryType: 'delivery',
    deliveryAddress: '',
    specialInstructions: '',
    phone: ''
  });
  
  // Counties
  const counties = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Garissa', 'Malindi'];
  const cuisineOptions = ['All', 'Swahili', 'Coastal', 'Somali', 'Ethiopian', 'Indian', 'Kenyan', 'Arabian', 'Turkish'];

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchRestaurants();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
      setOrderData(prev => ({
        ...prev,
        phone: userData.phone || ''
      }));
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE}/client/vendors?business_type=restaurant`, config);
      
      const restaurantData = response.data.vendors || [];
      setRestaurants(restaurantData);
      
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async (restaurantId) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE}/client/menu-items?vendor_id=${restaurantId}`, config);
      setMenuItems(response.data.menuItems || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu.');
    }
  };

  // ===== FILTERED RESTAURANTS =====
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = (r.business_name || r.fullname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = selectedCounty === 'All' || r.county === selectedCounty || r.location === selectedCounty;
    const matchesCuisine = selectedCuisine === 'All' || (r.cuisine && r.cuisine.includes(selectedCuisine));
    const matchesRating = (r.rating || 0) >= minRating;
    return matchesSearch && matchesCounty && matchesCuisine && matchesRating;
  });

  // ===== CART FUNCTIONS =====
  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(c => 
      c.id === itemId ? { ...c, quantity } : c
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // ===== RESTAURANT OPERATIONS =====
  const handleViewMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    await fetchMenu(restaurant.id);
    setShowMenuModal(true);
  };

  const handleOrderNow = (restaurant) => {
    if (!isAuthenticated) {
      setError('Please login or register to place an order.');
      return;
    }
    setSelectedRestaurant(restaurant);
    setShowOrderModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!orderData.deliveryAddress && orderData.deliveryType === 'delivery') {
      setError('Please enter your delivery address');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const orderPayload = {
        vendor_id: selectedRestaurant.id,
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: getCartTotal(),
        delivery_fee: selectedRestaurant.delivery_fee || 0,
        delivery_address: orderData.deliveryAddress,
        delivery_type: orderData.deliveryType,
        special_instructions: orderData.specialInstructions
      };
      
      await axios.post(`${API_BASE}/client/orders`, orderPayload, config);
      
      setShowOrderModal(false);
      setShowSuccessModal(true);
      setCart([]);
      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
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
    }).format(amount || 0);
  };

  const getStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if ((rating || 0) % 1 >= 0.5) stars += '★';
    return stars;
  };

  const getPriceRangeDisplay = (range) => {
    if (!range) return 'KES 0 - 0';
    const parts = String(range).split('-');
    if (parts.length === 2) {
      return `${formatCurrency(parseInt(parts[0]))}–${formatCurrency(parseInt(parts[1]))}`;
    }
    return formatCurrency(parseInt(range));
  };

  // SVG Icons
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm animate-pulse">
                <div className="h-40 bg-[#F1F7FC]" />
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
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">Halal Restaurants</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Discover halal restaurants across Kenya</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Halal Certified</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A] text-xs font-semibold">{restaurants.length} Restaurants</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3 text-sm text-red-600">
            <span>{error}</span>
            <button className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition" onClick={() => { setError(''); fetchRestaurants(); }}>Retry</button>
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <input 
              className="w-full px-4 py-2.5 pl-9 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" 
              placeholder="Search restaurants..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><SearchIcon /></span>
          </div>
          <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
            {counties.map(county => <option key={county} value={county}>{county}</option>)}
          </select>
          <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)}>
            {cuisineOptions.map(cuisine => <option key={cuisine} value={cuisine}>{cuisine}</option>)}
          </select>
          <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>All Ratings</option>
            <option value={4.5}>4.5+</option>
            <option value={4.0}>4.0+</option>
            <option value={3.5}>3.5+</option>
          </select>
        </div>

        <div className="text-sm text-[#94A3B8] mb-4">{filteredRestaurants.length} restaurants found</div>

        {/* ===== RESTAURANTS GRID ===== */}
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EEF4]">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-[#1A2A3A]">No restaurants found</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#1769AA]/5 transition-all duration-300 group">
                <div className="h-40 bg-cover bg-center relative flex items-center justify-center" style={{ 
                  backgroundImage: restaurant.cover_image ? `url(${restaurant.cover_image})` : restaurant.logo_url ? `url(${restaurant.logo_url})` : 'none',
                  backgroundColor: restaurant.cover_image || restaurant.logo_url ? 'transparent' : '#EDE5D4' 
                }}>
                  <span className={`text-5xl ${restaurant.cover_image || restaurant.logo_url ? 'opacity-40' : 'opacity-60'}`}>🍽️</span>
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${restaurant.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {restaurant.is_active !== false ? 'Open' : 'Closed'}
                  </span>
                  {restaurant.is_verified && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                      Verified
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{restaurant.business_name || restaurant.fullname}</h4>
                    <span className="text-sm font-semibold text-[#C9A84C]">{getStars(restaurant.rating)} {restaurant.rating}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{restaurant.business_type || 'Restaurant'} · {restaurant.county || restaurant.location}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Halal</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">{restaurant.county || 'Kenya'}</span>
                    {restaurant.delivery_fee === 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Free Delivery</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#F1F7FC]">
                    <div>
                      <span className="font-semibold text-[#1A2A3A]">{getPriceRangeDisplay(restaurant.price_range || '0-1000')}</span>
                      <span className="text-xs text-[#94A3B8] ml-2 flex items-center gap-1">
                        <ClockIcon /> {restaurant.delivery_time || '30-45 min'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[#5A6A7A] text-xs font-semibold hover:bg-[#F1F7FC] transition" onClick={() => handleViewMenu(restaurant)}>Menu</button>
                      <button className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${restaurant.is_active !== false ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => handleOrderNow(restaurant)} disabled={restaurant.is_active === false}>
                        {restaurant.is_active !== false ? 'Order' : 'Closed'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================== */}
        {/* ===== CART COMPONENT ===== */}
        {/* ======================================== */}
        <Cart />

        {/* ======================================== */}
        {/* ===== MENU MODAL ===== */}
        {/* ======================================== */}
        {showMenuModal && selectedRestaurant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowMenuModal(false)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">{selectedRestaurant.business_name || selectedRestaurant.fullname} - Menu</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowMenuModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6">
                {menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#94A3B8]">No menu items available</p>
                  </div>
                ) : (
                  [...new Set(menuItems.map(item => item.category))].map(category => (
                    <div key={category} className="mb-6">
                      <h4 className="font-bold text-[#1A2A3A] border-b-2 border-[#1769AA] pb-2 mb-3">{category}</h4>
                      {menuItems.filter(item => item.category === category).map(item => (
                        <div key={item.id} className="flex justify-between items-center py-3 border-b border-[#F1F7FC] last:border-0">
                          <div>
                            <div className="font-medium text-[#1A2A3A]">{item.name}</div>
                            <div className="text-xs text-[#94A3B8]">{item.description}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#1769AA]">{formatCurrency(item.price)}</span>
                            <button className="px-3 py-1.5 rounded-xl bg-[#1769AA] text-white text-xs font-semibold hover:bg-[#2F80C0] transition-all duration-200" onClick={() => addToCart(item)}>Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}

                {cart.length > 0 && (
                  <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4 border border-[#E8EEF4]">
                    <div className="flex justify-between font-semibold text-[#1A2A3A] pb-2 border-b border-[#E2E8F0]">
                      <span>Your Order</span>
                      <span>{cart.length} items</span>
                    </div>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between py-1.5 text-sm">
                        <span className="text-[#5A6A7A]">{item.name} x{item.quantity}</span>
                        <span className="font-medium text-[#1A2A3A]">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-[#E2E8F0] font-bold text-[#1A2A3A]">
                      <span>Total:</span>
                      <span className="text-[#1769AA]">{formatCurrency(getCartTotal())}</span>
                    </div>
                    <button className="w-full mt-3 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg transition-all duration-200" onClick={() => { setShowMenuModal(false); setShowOrderModal(true); }}>
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-[#E8EEF4]">
                <button className="w-full py-2.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-200" onClick={() => setShowMenuModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* ===== ORDER MODAL ===== */}
        {/* ======================================== */}
        {showOrderModal && selectedRestaurant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Place Order</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowOrderModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6">
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4">
                  <div className="font-bold text-[#1A2A3A]">{selectedRestaurant.business_name || selectedRestaurant.fullname}</div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">{selectedRestaurant.location || selectedRestaurant.address || 'Nairobi'}</div>
                </div>

                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-[#F1F7FC] text-sm">
                    <span className="text-[#1A2A3A]">{item.name} x{item.quantity}</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Subtotal</span><span className="font-semibold text-[#1A2A3A]">{formatCurrency(getCartTotal())}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Delivery Fee</span><span className="font-semibold text-[#1A2A3A]">{selectedRestaurant.delivery_fee === 0 ? 'FREE' : formatCurrency(selectedRestaurant.delivery_fee || 0)}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-[#E2E8F0] pt-2"><span className="text-[#1A2A3A]">Total</span><span className="text-[#1769AA]">{formatCurrency(getCartTotal() + (selectedRestaurant.delivery_fee || 0))}</span></div>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Delivery Type</label>
                    <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={orderData.deliveryType} onChange={(e) => setOrderData({...orderData, deliveryType: e.target.value})}>
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>
                  {orderData.deliveryType === 'delivery' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Delivery Address</label>
                      <input className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="Enter your address" value={orderData.deliveryAddress} onChange={(e) => setOrderData({...orderData, deliveryAddress: e.target.value})} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Special Instructions</label>
                    <textarea className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y" placeholder="Any special requests..." rows="2" value={orderData.specialInstructions} onChange={(e) => setOrderData({...orderData, specialInstructions: e.target.value})} />
                  </div>
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mt-4">{error}</div>}
              </div>
              <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition-all duration-200" onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg transition-all duration-200 disabled:opacity-50" onClick={handlePlaceOrder} disabled={processing}>{processing ? 'Placing Order...' : 'Place Order'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* ===== SUCCESS MODAL ===== */}
        {/* ======================================== */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Order Placed!</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowSuccessModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <h4 className="text-xl font-heading font-bold text-[#1A2A3A]">Your order has been placed!</h4>
                <p className="text-sm text-[#94A3B8] mt-2">{selectedRestaurant?.business_name || selectedRestaurant?.fullname} is preparing your order.<br />You will receive a confirmation message shortly.</p>
              </div>
              <div className="p-6 border-t border-[#E8EEF4]">
                <button className="w-full py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg transition-all duration-200" onClick={() => setShowSuccessModal(false)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SUCCESS TOAST ===== */}
        {success && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-3 animate-slideDown max-w-sm">
            <span className="text-sm font-medium">{success}</span>
            <button className="text-white/70 hover:text-white transition" onClick={() => setSuccess('')}><CloseIcon /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;