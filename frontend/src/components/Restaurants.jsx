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
    if (cart.length === 0) {
      setError('Your cart is empty. Please add items before ordering.');
      return;
    }

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
    if (!range) return '';
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

  const RestaurantIcon = () => (
    <svg className="w-12 h-12 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const EmptyStateIcon = () => (
    <svg className="w-16 h-16 text-[#E8EEF4] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-[#F4F5F1] rounded-2xl w-48 animate-pulse" />
            <div className="h-4 bg-[#F4F5F1] rounded-lg w-64 mt-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm animate-pulse">
                <div className="h-40 bg-[#F4F5F1]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#F4F5F1] rounded-lg w-3/4" />
                  <div className="h-3 bg-[#F4F5F1] rounded-lg w-1/2" />
                  <div className="h-6 bg-[#F4F5F1] rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      
      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden bg-[#0B342B] mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 rounded-2xl p-8 md:p-12 shadow-lg shadow-[#0B342B]/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Halal Dining</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Premium Halal Restaurants</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Discover Halal Restaurants
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                Explore the finest halal-certified restaurants across Kenya. From local cuisine to international flavors, every meal is prepared with care and authenticity.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="text-[13px] font-medium text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
                  {restaurants.length} Halal Restaurants
                </span>
                <span className="text-[13px] font-medium text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
                  100% Halal Certified
                </span>
                <span className="text-[13px] font-medium text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
                  Trusted Vendors
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-6xl opacity-80">🍽️</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-white border border-[#DC2626]/20 flex flex-wrap items-center justify-between gap-3 text-[15px] text-[#DC2626] shadow-sm">
            <span>{error}</span>
            <button className="px-4 py-1.5 rounded-lg bg-[#DC2626] text-white text-[13px] font-medium hover:bg-[#B91C1C] transition" onClick={() => { setError(''); fetchRestaurants(); }}>Retry</button>
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Search</label>
              <input 
                className="w-full px-4 py-2.5 pl-9 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200" 
                placeholder="Search restaurants..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              <span className="absolute left-3 bottom-3.5 text-[#6B7280]"><SearchIcon /></span>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">County</label>
              <select className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 appearance-none" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
                {counties.map(county => <option key={county} value={county}>{county}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Cuisine</label>
              <select className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 appearance-none" value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)}>
                {cuisineOptions.map(cuisine => <option key={cuisine} value={cuisine}>{cuisine}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Minimum Rating</label>
              <select className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 appearance-none" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value={0}>All Ratings</option>
                <option value={4.5}>4.5+</option>
                <option value={4.0}>4.0+</option>
                <option value={3.5}>3.5+</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#F4F5F1]">
            <span className="text-[15px] text-[#6B7280]">{filteredRestaurants.length} restaurants found</span>
          </div>
        </div>

        {/* ===== RESTAURANTS GRID ===== */}
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8EEF4]">
            <EmptyStateIcon />
            <h3 className="text-[17px] font-semibold text-[#1F2937] mt-4">No restaurants found</h3>
            <p className="text-[15px] text-[#6B7280] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-xl hover:shadow-[#0B342B]/5 transition-all duration-300 group">
                <div className="h-40 bg-cover bg-center relative flex items-center justify-center" style={{ 
                  backgroundImage: restaurant.cover_image ? `url(${restaurant.cover_image})` : restaurant.logo_url ? `url(${restaurant.logo_url})` : 'none',
                  backgroundColor: restaurant.cover_image || restaurant.logo_url ? 'transparent' : '#F4F5F1' 
                }}>
                  {!restaurant.cover_image && !restaurant.logo_url && <RestaurantIcon />}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[12px] font-medium ${restaurant.is_active !== false ? 'bg-[#D1FAE5] text-[#3FAF73]' : 'bg-[#F4F5F1] text-[#6B7280]'}`}>
                    {restaurant.is_active !== false ? 'Open' : 'Closed'}
                  </span>
                  {restaurant.is_verified && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#DBEAFE] text-[#3B82F6] border border-[#BFDBFE]">
                      Verified
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-[#1F2937] group-hover:text-[#0B342B] transition-colors text-[15px]">{restaurant.business_name || restaurant.fullname}</h4>
                    <span className="text-[14px] font-semibold text-[#C9A44B]">{getStars(restaurant.rating)} {restaurant.rating}</span>
                  </div>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">{restaurant.business_type || 'Restaurant'} · {restaurant.county || restaurant.location}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#3FAF73]">Halal</span>
                    <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">{restaurant.county || 'Kenya'}</span>
                    {restaurant.delivery_fee === 0 && (
                      <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#3FAF73]">Free Delivery</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-[#F4F5F1]">
                    <div>
                      <span className="font-semibold text-[#1F2937]">{getPriceRangeDisplay(restaurant.price_range)}</span>
                      <span className="text-[13px] text-[#6B7280] ml-2 flex items-center gap-1">
                        <ClockIcon /> {restaurant.delivery_time}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EEF4] text-[#6B7280] text-[13px] font-medium hover:bg-[#FAFAF7] transition" onClick={() => handleViewMenu(restaurant)}>Menu</button>
                      <button className={`px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${restaurant.is_active !== false ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] hover:shadow-lg' : 'bg-[#F4F5F1] text-[#6B7280] cursor-not-allowed'}`} onClick={() => handleOrderNow(restaurant)} disabled={restaurant.is_active === false}>
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
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-[22px] font-semibold text-[#1F2937]">{selectedRestaurant.business_name || selectedRestaurant.fullname}</h3>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">{selectedRestaurant.location || selectedRestaurant.county || 'Menu'}</p>
                </div>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowMenuModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6">
                {menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#6B7280]">No menu items available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {[...new Set(menuItems.map(item => item.category))].map(category => (
                      <div key={category}>
                        <h4 className="font-bold text-[#1F2937] border-b-2 border-[#0B342B] pb-2 mb-3 text-[15px]">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {menuItems.filter(item => item.category === category).map(item => (
                            <div key={item.id} className="bg-[#FAFAF7] rounded-xl p-3 hover:shadow-md transition-all duration-200 border border-[#E8EEF4] hover:border-[#0B342B]/30">
                              <div className="flex gap-3">
                                <div 
                                  className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0 border border-[#E8EEF4]" 
                                  style={{ 
                                    backgroundImage: item.image ? `url(${item.image})` : 'none', 
                                    backgroundColor: item.image ? 'transparent' : '#F4F5F1' 
                                  }} 
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-[#1F2937] text-[15px] truncate">{item.name}</div>
                                  <div className="text-[13px] text-[#6B7280] line-clamp-2">{item.description}</div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-[#0B342B]">{formatCurrency(item.price)}</span>
                                    <button 
                                      className="px-2.5 py-1 rounded-lg bg-[#0B342B] text-white text-[13px] font-medium hover:bg-[#032A24] transition-all duration-200 shadow-sm"
                                      onClick={() => addToCart(item)}
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {cart.length > 0 && (
                      <div className="bg-[#FAFAF7] rounded-xl p-4 mt-4 border border-[#E8EEF4] sticky bottom-0">
                        <div className="flex justify-between font-semibold text-[#1F2937] pb-2 border-b border-[#E8EEF4]">
                          <span>Your Order</span>
                          <span>{cart.length} items</span>
                        </div>
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between py-1.5 text-[14px]">
                            <span className="text-[#6B7280]">{item.name} x{item.quantity}</span>
                            <span className="font-medium text-[#1F2937]">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-[#E8EEF4] font-bold text-[#1F2937]">
                          <span>Total:</span>
                          <span className="text-[#0B342B]">{formatCurrency(getCartTotal())}</span>
                        </div>
                        <button 
                          className="w-full mt-3 py-2.5 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] hover:shadow-lg transition-all duration-200"
                          onClick={() => { setShowMenuModal(false); setShowOrderModal(true); }}
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* ===== ORDER MODAL ===== */}
        {/* ======================================== */}
        {showOrderModal && selectedRestaurant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Place Order</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowOrderModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6">
                <div className="bg-[#FAFAF7] rounded-xl p-4 mb-4 border border-[#E8EEF4]">
                  <div className="font-bold text-[#1F2937]">{selectedRestaurant.business_name || selectedRestaurant.fullname}</div>
                  <div className="text-[13px] text-[#6B7280] mt-0.5">{selectedRestaurant.location || selectedRestaurant.address || 'Nairobi'}</div>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[#6B7280]">Your cart is empty. Please add items before ordering.</p>
                    <button 
                      className="mt-4 px-6 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-sm"
                      onClick={() => { setShowOrderModal(false); setShowMenuModal(true); }}
                    >
                      View Menu
                    </button>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between py-2 border-b border-[#F4F5F1] text-[15px]">
                        <span className="text-[#1F2937]">{item.name} x{item.quantity}</span>
                        <span className="font-semibold text-[#1F2937]">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}

                    <div className="bg-[#FAFAF7] rounded-xl p-4 mt-4 space-y-2 border border-[#E8EEF4]">
                      <div className="flex justify-between text-[15px]"><span className="text-[#6B7280]">Subtotal</span><span className="font-semibold text-[#1F2937]">{formatCurrency(getCartTotal())}</span></div>
                      <div className="flex justify-between text-[15px]"><span className="text-[#6B7280]">Delivery Fee</span><span className="font-semibold text-[#1F2937]">{selectedRestaurant.delivery_fee === 0 ? 'FREE' : formatCurrency(selectedRestaurant.delivery_fee || 0)}</span></div>
                      <div className="flex justify-between text-[17px] font-bold border-t border-[#E8EEF4] pt-2"><span className="text-[#1F2937]">Total</span><span className="text-[#0B342B]">{formatCurrency(getCartTotal() + (selectedRestaurant.delivery_fee || 0))}</span></div>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Delivery Type</label>
                        <select className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 appearance-none" value={orderData.deliveryType} onChange={(e) => setOrderData({...orderData, deliveryType: e.target.value})}>
                          <option value="delivery">Delivery</option>
                          <option value="pickup">Pickup</option>
                        </select>
                      </div>
                      {orderData.deliveryType === 'delivery' && (
                        <div>
                          <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Delivery Address</label>
                          <input className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200" placeholder="Enter your address" value={orderData.deliveryAddress} onChange={(e) => setOrderData({...orderData, deliveryAddress: e.target.value})} />
                        </div>
                      )}
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Special Instructions</label>
                        <textarea className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 resize-y" placeholder="Any special requests..." rows="2" value={orderData.specialInstructions} onChange={(e) => setOrderData({...orderData, specialInstructions: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}

                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626] mt-4">{error}</div>}
              </div>
              <div className="p-6 border-t border-[#F4F5F1] flex gap-3">
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition-all duration-200" onClick={() => setShowOrderModal(false)}>Cancel</button>
                {cart.length > 0 && (
                  <button className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] hover:shadow-lg transition-all duration-200 disabled:opacity-50" onClick={handlePlaceOrder} disabled={processing}>{processing ? 'Placing Order...' : 'Place Order'}</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* ===== SUCCESS MODAL ===== */}
        {/* ======================================== */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Order Placed!</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowSuccessModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto border-4 border-[#0B342B]/20">
                  <svg className="w-10 h-10 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-[22px] font-semibold text-[#1F2937] mt-4">Your order has been placed!</h4>
                <p className="text-[15px] text-[#6B7280] mt-2">{selectedRestaurant?.business_name || selectedRestaurant?.fullname} is preparing your order.<br />You will receive a confirmation message shortly.</p>
              </div>
              <div className="p-6 border-t border-[#F4F5F1]">
                <button className="w-full py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] hover:shadow-lg transition-all duration-200" onClick={() => setShowSuccessModal(false)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SUCCESS TOAST ===== */}
        {success && (
          <div className="fixed top-6 right-6 z-50 bg-[#0B342B] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-[#C9A44B]/20">
            <svg className="w-5 h-5 text-[#C9A44B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[15px] font-medium">{success}</span>
            <button className="text-white/60 hover:text-white transition ml-2 flex-shrink-0" onClick={() => setSuccess('')}><CloseIcon /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;