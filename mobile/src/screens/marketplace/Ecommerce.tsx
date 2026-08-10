import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { clientService, cartService } from '../../api/client';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ===== PROFESSIONAL SVG ICONS =====
const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShopIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 9L6 5H18L19 9M5 9H19M5 9L3 11V13H21V11L19 9M5 9V13M19 9V13M5 13H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V13Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M9 13V20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M15 13V20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="8" cy="16" r="1" fill={color} opacity="0.5"/>
    <Circle cx="16" cy="16" r="1" fill={color} opacity="0.5"/>
  </Svg>
);

const SearchIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CartIcon = ({ color = '#FFFFFF', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M2 3H4L8 15H20L22 7H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const UserIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const HeartIcon = ({ color = '#6B7280', size = 18, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" 
      fill={filled ? '#DC2626' : 'none'} 
      stroke={filled ? '#DC2626' : color} 
      strokeWidth="1.5"
    />
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const FilterIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H21M6 12H18M10 18H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const Ecommerce = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useAuth();
  
  const category = route.params?.category || 'all';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [categories, setCategories] = useState<string[]>(['All']);
  const [vendors, setVendors] = useState<string[]>(['All']);
  const [isButcheryMode, setIsButcheryMode] = useState(category === 'butchery');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const priceRanges = [
    { label: 'All', value: 'All' },
    { label: 'Under KES 1,000', value: 'under-1000', min: 0, max: 1000 },
    { label: 'KES 1,000 - 2,500', value: '1000-2500', min: 1000, max: 2500 },
    { label: 'KES 2,500 - 5,000', value: '2500-5000', min: 2500, max: 5000 },
    { label: 'Over KES 5,000', value: 'over-5000', min: 5000, max: Infinity },
  ];

  useEffect(() => {
    fetchProducts();
    if (isAuthenticated) {
      fetchCart();
      fetchOrders();
    }
  }, []);

  useEffect(() => {
    setIsButcheryMode(category === 'butchery');
  }, [category]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedVendor, selectedPriceRange, sortBy, products, isButcheryMode]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientService.getProducts({ limit: 100 });
      const productData = response.data.products || [];
      setProducts(productData);

      const uniqueCategories = ['All', ...new Set(productData.map((p: any) => p.category).filter(Boolean))];
      const uniqueVendors = ['All', ...new Set(productData.map((p: any) => p.vendor_name || p.business_name).filter(Boolean))];
      setCategories(uniqueCategories);
      setVendors(uniqueVendors);

      applyFilters(productData);
    } catch (err) {
      console.log('Error fetching products:', err);
      setError('Failed to load products. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    if (isAuthenticated) {
      fetchCart();
      fetchOrders();
    }
  };

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await cartService.getCart();
      setCart(response.data.items || []);
    } catch (err) {
      console.log('Cart error:', err);
    }
  };

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const response = await clientService.getOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      console.log('Orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const applyFilters = (productList: any[] = products) => {
    let filtered = [...productList];

    if (isButcheryMode) {
      filtered = filtered.filter((p) => p.vendor_type === 'halalbutchery');
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.vendor_name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.meat_type || '').toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (selectedVendor !== 'All') {
      filtered = filtered.filter((p) => p.vendor_name === selectedVendor || p.business_name === selectedVendor);
    }

    if (selectedPriceRange !== 'All') {
      const range = priceRanges.find((r) => r.value === selectedPriceRange);
      if (range) {
        filtered = filtered.filter((p) => p.price >= range.min && p.price <= range.max);
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

  const addToCart = async (product: any) => {
    if (!isAuthenticated) {
      setError('Please login to add items to cart');
      return;
    }

    setProcessing(true);
    try {
      await cartService.addToCart(product.id, 1);
      await fetchCart();
      setSuccess(`${product.name} added to cart!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add to cart. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const removeFromCart = async (cartId: string) => {
    if (!cartId) {
      setError('Invalid cart item');
      return;
    }

    try {
      await cartService.removeFromCart(cartId);
      await fetchCart();
    } catch (err) {
      setError('Failed to remove item from cart.');
    }
  };

  const updateQuantity = async (cartId: string, quantity: number) => {
    if (!cartId) {
      setError('Invalid cart item');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }

    try {
      await cartService.updateQuantity(cartId, quantity);
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
      const orderData = {
        vendor_id: cart[0]?.vendor_id || cart[0]?.vendorId,
        items: cart.map((item) => ({
          product_id: item.product_id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: getCartTotal(),
        delivery_fee: 500,
        delivery_address: 'Nairobi CBD',
      };

      await clientService.createOrder(orderData);

      const newOrderNumber = 'HM' + Date.now().toString().slice(-8);
      setOrderNumber(newOrderNumber);
      setShowCheckoutModal(false);
      setShowSuccessModal(true);

      setCart([]);
      await fetchOrders();

      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
      setSuccess('Added to wishlist!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const getStars = (rating: number) => {
    const fullStars = Math.floor(rating || 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if ((rating || 0) % 1 >= 0.5) stars += '★';
    return stars || '☆';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      completed: { bg: '#D1FAE5', text: '#3FAF73' },
      processing: { bg: '#DBEAFE', text: '#3B82F6' },
      shipped: { bg: '#FEF3C7', text: '#D97706' },
      pending: { bg: '#FEF3C7', text: '#D97706' },
      cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    };
    return colors[status] || { bg: '#F4F5F1', text: '#6B7280' };
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#032A24" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* ===== PREMIUM HEADER ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{
              position: 'absolute',
              top: 0,
              left: 40,
              right: 40,
              height: 2,
              backgroundColor: '#C9A44B',
              opacity: 0.3,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  padding: 6,
                  marginRight: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                }}
              >
                <BackIcon color="#C9A44B" size={22} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShopIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    {isButcheryMode ? 'Halal Butchery' : 'Halal Market'}
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  {isButcheryMode ? 'Fresh Halal Meat' : 'Shop with Peace of Mind'}
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  {isButcheryMode ? '100% halal-certified meat' : '100% halal-certified products'}
                </Text>
              </View>

              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.1)',
              }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#C9A44B',
                  opacity: 0.5,
                }} />
              </View>
            </View>
          </View>

          {/* ===== USER & CART ROW ===== */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {isAuthenticated && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(63, 175, 115, 0.06)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(63, 175, 115, 0.08)',
              }}>
                <UserIcon color="#3FAF73" size={14} />
                <Text style={{ color: '#3FAF73', fontSize: 12, fontWeight: '500' }}>{user?.fullName || 'Guest'}</Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  position: 'relative',
                  backgroundColor: '#032A24',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
                onPress={() => setShowCart(true)}
                activeOpacity={0.7}
              >
                <CartIcon color="#FFFFFF" size={18} />
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Cart</Text>
                {cart.length > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#DC2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>{getCartItemCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {!isAuthenticated ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.06)',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.08)',
                  }}
                  onPress={() => navigation.navigate('RegisterRole' as never)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>Sign In</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.04)',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                  }}
                  onPress={() => setShowOrderHistory(!showOrderHistory)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>Orders</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                onPress={() => { setError(''); fetchProducts(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ===== COLLAPSIBLE SEARCH & FILTERS ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
            marginBottom: 16,
            overflow: 'hidden',
          }}>
            <TouchableOpacity
              onPress={toggleFilters}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 3,
                  height: 16,
                  backgroundColor: '#C9A44B',
                  borderRadius: 2,
                }} />
                <FilterIcon color="#032A24" size={16} />
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  Search & Filters
                </Text>
                <Text style={{ color: '#8B8A86', fontSize: 10 }}>
                  {filteredProducts.length} products
                </Text>
              </View>
              {filtersExpanded ? (
                <ChevronUpIcon color="#6B7280" size={18} />
              ) : (
                <ChevronDownIcon color="#6B7280" size={18} />
              )}
            </TouchableOpacity>

            {filtersExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 130 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Search
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF7', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.06)', paddingHorizontal: 12 }}>
                      <SearchIcon color="#9CA3AF" size={14} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={isButcheryMode ? 'Search meat...' : 'Search products...'}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Category
                    </Text>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                        value={selectedCategory}
                        onChangeText={(text) => setSelectedCategory(text)}
                        placeholder="All"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.7, minWidth: 80 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Price
                    </Text>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                        value={selectedPriceRange}
                        onChangeText={(text) => setSelectedPriceRange(text)}
                        placeholder="All"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.7, minWidth: 80 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Sort By
                    </Text>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <TextInput
                        style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                        value={sortBy}
                        onChangeText={(text) => setSortBy(text)}
                        placeholder="Popular"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>
                    <Text style={{ fontWeight: '600', color: '#032A24' }}>{filteredProducts.length}</Text> products found
                  </Text>
                  <TouchableOpacity onPress={fetchProducts} activeOpacity={0.7}>
                    <Text style={{ color: '#6B7280', fontSize: 12 }}>↻ Refresh</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ===== PREMIUM PRODUCT CARDS ===== */}
          {filteredProducts.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
            }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
              <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '600' }}>No products found</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredProducts.map((product) => {
              const isButchery = product.meat_type && product.vendor_type === 'halalbutchery';
              const isInWishlist = wishlist.includes(product.id);

              return (
                <TouchableOpacity
                  key={product.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    overflow: 'hidden',
                    shadowColor: '#032A24',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 12,
                    elevation: 2,
                  }}
                  onPress={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400x300/032A24/C9A44B?text=Product' }}
                    style={{ width: '100%', height: 190 }}
                    resizeMode="cover"
                  />

                  {/* Wishlist Button */}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    onPress={() => toggleWishlist(product.id)}
                    activeOpacity={0.7}
                  >
                    <HeartIcon color="#6B7280" size={16} filled={isInWishlist} />
                  </TouchableOpacity>

                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 1 }}>
                          by {product.vendor_name || product.business_name || 'Vendor'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <StarIcon color="#C9A44B" size={10} />
                          <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>{product.rating || 0}</Text>
                          {product.total_reviews > 0 && (
                            <Text style={{ color: '#8B8A86', fontSize: 11 }}>({product.total_reviews})</Text>
                          )}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {isButchery && product.price_per_kg ? (
                          <>
                            <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>
                              {formatCurrency(product.price_per_kg)}
                            </Text>
                            <Text style={{ color: '#8B8A86', fontSize: 10 }}>/kg</Text>
                          </>
                        ) : (
                          <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>
                            {formatCurrency(product.price)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.06)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.08)',
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 9, fontWeight: '500' }}>✓ Halal</Text>
                      </View>
                      <View style={{
                        backgroundColor: 'rgba(3, 42, 36, 0.04)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 9 }}>{product.category}</Text>
                      </View>
                      {isButchery && product.meat_type && (
                        <View style={{
                          backgroundColor: 'rgba(201, 164, 75, 0.06)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: 'rgba(201, 164, 75, 0.06)',
                        }}>
                          <Text style={{ color: '#C9A44B', fontSize: 9 }}>{product.meat_type}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      {isButchery && product.stock_kg && (
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>Stock: {product.stock_kg} kg</Text>
                      )}
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#032A24',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 10,
                          opacity: processing ? 0.5 : 1,
                        }}
                        onPress={() => addToCart(product)}
                        disabled={processing}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Add to Cart</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ===== COLLAPSIBLE ORDER HISTORY ===== */}
          {isAuthenticated && showOrderHistory && (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 8,
              elevation: 1,
              marginTop: 16,
              overflow: 'hidden',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  Order History
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.04)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                  onPress={() => setShowOrderHistory(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {loadingOrders ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color="#032A24" />
                  </View>
                ) : orders.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ fontSize: 32, marginBottom: 4 }}>📭</Text>
                    <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>No orders yet</Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>Start shopping to see your orders here</Text>
                  </View>
                ) : (
                  orders.slice(0, 5).map((order) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <View key={order.id} style={{
                        backgroundColor: '#FAFAF7',
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                        marginBottom: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}>
                        <View>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>#{order.id}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>
                            {new Date(order.order_date).toLocaleDateString()}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>{order.items?.length || 0} items</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>{formatCurrency(order.total_amount)}</Text>
                          <View style={{
                            backgroundColor: badge.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}>
                            <Text style={{ color: badge.text, fontSize: 9, fontWeight: '500', textTransform: 'capitalize' }}>
                              {order.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* ===== STATS ===== */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Halal Products', value: products.length },
              { label: 'Categories', value: categories.length - 1 },
              { label: 'Halal Certified', value: '100%', color: '#3FAF73' },
              { label: 'Trusted Sellers', value: '✓', color: '#C9A44B' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <Text style={{
                  color: item.color || '#032A24',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.2,
                }}>
                  {item.value}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 10, textAlign: 'center', marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Halal Market
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== MODALS (Preserved with premium styling) ===== */}
      {/* Product Detail Modal */}
      <Modal visible={showProductModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Product Details
              </Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Image
                source={{ uri: selectedProduct?.images?.[0] || 'https://via.placeholder.com/400x300/032A24/C9A44B?text=Product' }}
                style={{ width: '100%', height: 200, borderRadius: 12 }}
                resizeMode="cover"
              />

              <View style={{ marginTop: 12 }}>
                <Text style={{ color: '#032A24', fontSize: 17, fontWeight: '700' }}>{selectedProduct?.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 13 }}>{getStars(selectedProduct?.rating)} {selectedProduct?.rating}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>({selectedProduct?.reviews || 0} reviews)</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>by {selectedProduct?.vendor_name || 'Vendor'}</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {(selectedProduct?.tags || []).map((tag: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: 'rgba(3, 42, 36, 0.04)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 9 }}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 10, lineHeight: 20 }}>
                  {selectedProduct?.description}
                </Text>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <Text style={{ color: '#032A24', fontSize: 22, fontWeight: '700', letterSpacing: -0.3 }}>
                    {formatCurrency(selectedProduct?.price)}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#032A24',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 10,
                      opacity: processing ? 0.5 : 1,
                    }}
                    onPress={() => {
                      addToCart(selectedProduct);
                      setShowProductModal(false);
                    }}
                    disabled={processing}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCart} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Your Cart
              </Text>
              <TouchableOpacity onPress={() => setShowCart(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cart.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>🛒</Text>
                  <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '600' }}>Your cart is empty</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Start shopping to add items</Text>
                </View>
              ) : (
                <>
                  {cart.map((item) => (
                    <View key={item.id} style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{formatCurrency(item.price)} x {item.quantity}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#F3F4F6',
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600', width: 20, textAlign: 'center' }}>
                          {item.quantity || 1}
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#F3F4F6',
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} activeOpacity={0.7}>
                          <CloseIcon color="#DC2626" size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View style={{
                    backgroundColor: 'rgba(3, 42, 36, 0.02)',
                    padding: 12,
                    borderRadius: 10,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Subtotal</Text>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(getCartTotal())}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Delivery</Text>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(500)}</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      marginTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700' }}>Total</Text>
                      <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>{formatCurrency(getCartTotal() + 500)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#032A24',
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                    onPress={handleCheckout}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Checkout</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Order Summary
              </Text>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cart.map((item) => (
                <View key={item.id} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.name} x{item.quantity}</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </Text>
                </View>
              ))}

              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 12,
                borderRadius: 10,
                marginTop: 12,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Subtotal</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(getCartTotal())}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Delivery</Text>
                  <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(500)}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  marginTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700' }}>Total</Text>
                  <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>{formatCurrency(getCartTotal() + 500)}</Text>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowCheckoutModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: processing ? 0.5 : 1,
                  }}
                  onPress={confirmOrder}
                  disabled={processing}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Place Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#032A24',
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              margin: -24,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                Order Placed!
              </Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="rgba(255,255,255,0.6)" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🎉</Text>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700' }}>Order Confirmed!</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Order #{orderNumber}</Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  Your order has been placed successfully.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#032A24',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowOrderHistory(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>View Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowSuccessModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Continue Shopping</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {success ? (
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
          left: 20,
          backgroundColor: '#032A24',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#032A24',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckIcon color="#C9A44B" size={18} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')} activeOpacity={0.7} style={{ padding: 4 }}>
            <CloseIcon color="rgba(255,255,255,0.5)" size={18} />
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Ecommerce;