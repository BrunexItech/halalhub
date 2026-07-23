import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantService, orderService } from '../services/api';
import Cart from './Cart';

const Restaurants = () => {
  const navigate = useNavigate();
  
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
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const mockRestaurants = [
        {
          id: 1,
          name: 'Al-Bahar Swahili Restaurant',
          county: 'Mombasa',
          cuisine: ['Swahili', 'Coastal'],
          rating: 4.9,
          reviews: 234,
          priceRange: '300-800',
          emoji: '🍽️',
          phone: '+254712345678',
          address: 'Mombasa CBD, Mombasa',
          description: 'Authentic Swahili coastal cuisine with fresh seafood and traditional dishes.',
          open: true,
          deliveryTime: '30-45 min',
          deliveryFee: 200,
          images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop']
        },
        {
          id: 2,
          name: 'Habesha Ethiopian & Somali',
          county: 'Nairobi',
          cuisine: ['Somali', 'Ethiopian'],
          rating: 4.8,
          reviews: 189,
          priceRange: '400-900',
          emoji: '🥘',
          phone: '+254798765432',
          address: 'Eastleigh, Nairobi',
          description: 'Authentic East African cuisine with rich flavors and traditional dining experience.',
          open: true,
          deliveryTime: '35-50 min',
          deliveryFee: 250,
          images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop']
        },
        {
          id: 3,
          name: 'Delhi Palace — Halal Indian',
          county: 'Nairobi',
          cuisine: ['Indian', 'Biryani'],
          rating: 4.7,
          reviews: 156,
          priceRange: '500-1200',
          emoji: '🍛',
          phone: '+254776543210',
          address: 'Parklands, Nairobi',
          description: 'Authentic Indian cuisine with halal meat and traditional tandoori dishes.',
          open: true,
          deliveryTime: '25-40 min',
          deliveryFee: 300,
          images: ['https://images.unsplash.com/photo-1565557623262-b5c11c5f3b8b?w=400&h=300&fit=crop']
        },
        {
          id: 4,
          name: 'Mama Halisi Kitchen',
          county: 'Kisumu',
          cuisine: ['Kenyan', 'Coastal'],
          rating: 4.6,
          reviews: 98,
          priceRange: '200-600',
          emoji: '🫕',
          phone: '+254754321098',
          address: 'Kisumu CBD, Kisumu',
          description: 'Homestyle Kenyan cooking with a coastal twist. Fresh ingredients daily.',
          open: false,
          deliveryTime: '40-60 min',
          deliveryFee: 150,
          images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop']
        },
        {
          id: 5,
          name: 'Arabian Nights Restaurant',
          county: 'Nairobi',
          cuisine: ['Arabian', 'Turkish'],
          rating: 4.9,
          reviews: 312,
          priceRange: '600-1500',
          emoji: '🌙',
          phone: '+254722233445',
          address: 'Westlands, Nairobi',
          description: 'Luxurious Arabian and Turkish dining with shisha lounge and live entertainment.',
          open: true,
          deliveryTime: '30-45 min',
          deliveryFee: 350,
          images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop']
        }
      ];
      
      setRestaurants(mockRestaurants);
    } catch (err) {
      setError('Failed to load restaurants. Please refresh.');
      console.error('Restaurants error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async (restaurantId) => {
    try {
      setMenuItems([
        { id: 1, name: 'Beef Biryani', price: 550, category: 'Main Course', description: 'Fragrant rice with tender beef' },
        { id: 2, name: 'Chicken Tikka Masala', price: 450, category: 'Main Course', description: 'Grilled chicken in creamy sauce' },
        { id: 3, name: 'Garlic Naan', price: 120, category: 'Bread', description: 'Fresh baked naan with garlic' },
        { id: 4, name: 'Mango Lassi', price: 200, category: 'Beverages', description: 'Refreshing mango yogurt drink' }
      ]);
    } catch (err) {
      setError('Failed to load menu.');
    }
  };

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
  const handleViewMenu = (restaurant) => {
    setSelectedRestaurant(restaurant);
    fetchMenu(restaurant.id);
    setShowMenuModal(true);
  };

  const handleOrderNow = (restaurant) => {
    if (!isAuthenticated) {
      alert('Please login or register to place an order.');
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowOrderModal(false);
      setShowSuccessModal(true);
      setCart([]);
      setSuccess('✅ Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to place order. Please try again.');
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
    return stars;
  };

  const getPriceRangeDisplay = (range) => {
    const parts = range.split('-');
    return `${formatCurrency(parseInt(parts[0]))}–${formatCurrency(parseInt(parts[1]))}`;
  };

  // ===== FILTERS =====
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = selectedCounty === 'All' || r.county === selectedCounty;
    const matchesCuisine = selectedCuisine === 'All' || r.cuisine.includes(selectedCuisine);
    const matchesRating = r.rating >= minRating;
    return matchesSearch && matchesCounty && matchesCuisine && matchesRating;
  });

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
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">HalaRestaurants</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Discover halal restaurants across Kenya</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">☽ Halal Certified</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A] text-xs font-semibold">🍴 {restaurants.length} Restaurants</span>
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
          <input className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200" placeholder="🔍 Search restaurants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
            {counties.map(county => <option key={county} value={county}>{county}</option>)}
          </select>
          <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={selectedCuisine} onChange={(e) => setSelectedCuisine(e.target.value)}>
            {cuisineOptions.map(cuisine => <option key={cuisine} value={cuisine}>{cuisine}</option>)}
          </select>
          <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>All Ratings</option>
            <option value={4.5}>⭐ 4.5+</option>
            <option value={4.0}>⭐ 4.0+</option>
            <option value={3.5}>⭐ 3.5+</option>
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
                <div className="h-40 bg-cover bg-center relative flex items-center justify-center" style={{ backgroundImage: `url(${restaurant.images?.[0] || ''})`, backgroundColor: '#EDE5D4' }}>
                  <span className="text-5xl opacity-80">{restaurant.emoji}</span>
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${restaurant.open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {restaurant.open ? '● Open' : '● Closed'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#1A2A3A] group-hover:text-[#1769AA] transition-colors">{restaurant.name}</h4>
                    <span className="text-sm font-semibold text-[#C9A84C]">{getStars(restaurant.rating)} {restaurant.rating}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{restaurant.cuisine.join(' · ')} · {restaurant.county}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✓ Halal</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">{restaurant.county}</span>
                    {restaurant.deliveryFee === 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">🚚 Free Delivery</span>}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#F1F7FC]">
                    <div>
                      <span className="font-semibold text-[#1A2A3A]">{getPriceRangeDisplay(restaurant.priceRange)}</span>
                      <span className="text-xs text-[#94A3B8] ml-2">🚚 {restaurant.deliveryTime}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[#5A6A7A] text-xs font-semibold hover:bg-[#F1F7FC] transition" onClick={() => handleViewMenu(restaurant)}>📋 Menu</button>
                      <button className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${restaurant.open ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} onClick={() => handleOrderNow(restaurant)} disabled={!restaurant.open}>
                        {restaurant.open ? '🍽️ Order' : 'Closed'}
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
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">📋 {selectedRestaurant.name} - Menu</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowMenuModal(false)}>✕</button>
              </div>
              <div className="p-6">
                {[...new Set(menuItems.map(item => item.category))].map(category => (
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
                          <button className="px-3 py-1.5 rounded-xl bg-[#1769AA] text-white text-xs font-semibold hover:bg-[#2F80C0] transition-all duration-200" onClick={() => addToCart(item)}>+ Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {cart.length > 0 && (
                  <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4 border border-[#E8EEF4]">
                    <div className="flex justify-between font-semibold text-[#1A2A3A] pb-2 border-b border-[#E2E8F0]">
                      <span>🛒 Your Order</span>
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
                    <button className="w-full mt-3 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200" onClick={() => { setShowMenuModal(false); setShowOrderModal(true); }}>
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
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">🍽️ Place Order</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowOrderModal(false)}>✕</button>
              </div>
              <div className="p-6">
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4">
                  <div className="font-bold text-[#1A2A3A]">{selectedRestaurant.emoji} {selectedRestaurant.name}</div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">{selectedRestaurant.address}</div>
                </div>

                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-[#F1F7FC] text-sm">
                    <span className="text-[#1A2A3A]">{item.name} x{item.quantity}</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Subtotal</span><span className="font-semibold text-[#1A2A3A]">{formatCurrency(getCartTotal())}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#94A3B8]">Delivery Fee</span><span className="font-semibold text-[#1A2A3A]">{selectedRestaurant.deliveryFee === 0 ? 'FREE' : formatCurrency(selectedRestaurant.deliveryFee)}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t border-[#E2E8F0] pt-2"><span className="text-[#1A2A3A]">Total</span><span className="text-[#1769AA]">{formatCurrency(getCartTotal() + selectedRestaurant.deliveryFee)}</span></div>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Delivery Type</label>
                    <select className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 appearance-none" value={orderData.deliveryType} onChange={(e) => setOrderData({...orderData, deliveryType: e.target.value})}>
                      <option value="delivery">🚚 Delivery</option>
                      <option value="pickup">🏃 Pickup</option>
                    </select>
                  </div>
                  {orderData.deliveryType === 'delivery' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Delivery Address *</label>
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
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200 disabled:opacity-50" onClick={handlePlaceOrder} disabled={processing}>{processing ? 'Placing Order...' : '✅ Place Order'}</button>
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
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">✅ Order Placed!</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowSuccessModal(false)}>✕</button>
              </div>
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <h4 className="text-xl font-heading font-bold text-[#1A2A3A]">Your order has been placed!</h4>
                <p className="text-sm text-[#94A3B8] mt-2">{selectedRestaurant?.name} is preparing your order.<br />You will receive a confirmation message shortly.</p>
              </div>
              <div className="p-6 border-t border-[#E8EEF4]">
                <button className="w-full py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] hover:shadow-lg hover:shadow-[#1769AA]/30 transition-all duration-200" onClick={() => setShowSuccessModal(false)}>Done</button>
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

export default Restaurants;