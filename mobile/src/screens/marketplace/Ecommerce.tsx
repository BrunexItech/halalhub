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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { clientService, cartService } from '../../api/client';

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
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: '700' }}>
                {isButcheryMode ? 'Halal Butchery' : 'Halal Market'}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
                {isButcheryMode
                  ? 'Fresh halal-certified meat from trusted butchers'
                  : 'Shop halal-certified products from trusted vendors'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {isAuthenticated && (
                <View style={{
                  backgroundColor: '#D1FAE5',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3FAF73' }} />
                  <Text style={{ color: '#3FAF73', fontSize: 13, fontWeight: '500' }}>{user?.fullName || 'Guest'}</Text>
                </View>
              )}
              <TouchableOpacity
                style={{
                  position: 'relative',
                  backgroundColor: '#0B342B',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => setShowCart(true)}
              >
                <Text style={{ fontSize: 16 }}>🛒</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Cart</Text>
                {cart.length > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#DC2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{getCartItemCount()}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {!isAuthenticated ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#1F2937',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                  }}
                  onPress={() => navigation.navigate('RegisterRole' as never)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Sign In / Register</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}
                  onPress={() => setShowOrderHistory(!showOrderHistory)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Orders</Text>
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
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                onPress={() => { setError(''); fetchProducts(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Hero */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  marginBottom: 6,
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>
                    {isButcheryMode ? 'Halal Butchery' : 'Welcome to Halal Market'}
                  </Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
                  {isButcheryMode ? 'Fresh Halal Meat' : 'Shop with Peace of Mind'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 }}>
                  {isButcheryMode
                    ? '100% halal-certified meat from trusted butchers'
                    : '100% halal-certified products from trusted sellers.'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{filteredProducts.length} Products</Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12 }}>100% Halal Certified</Text>
                  </View>
                  {isButcheryMode && (
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 12 }}>Fresh Meat</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 48, opacity: 0.8 }}>{isButcheryMode ? '🥩' : '🛍️'}</Text>
            </View>
          </View>

          {/* Search & Filter */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 140 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Search
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    paddingLeft: 36,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={isButcheryMode ? 'Search meat products...' : 'Search products...'}
                />
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Category
                </Text>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={selectedCategory}
                    onChangeText={(text) => setSelectedCategory(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Vendor
                </Text>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={selectedVendor}
                    onChangeText={(text) => setSelectedVendor(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Price
                </Text>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={selectedPriceRange}
                    onChangeText={(text) => setSelectedPriceRange(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Sort
                </Text>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                  <TextInput
                    style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                    value={sortBy}
                    onChangeText={(text) => setSortBy(text)}
                    placeholder="Popular"
                  />
                </View>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#F4F5F1',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>{filteredProducts.length} products found</Text>
              <TouchableOpacity onPress={fetchProducts}>
                <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '500' }}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8EEF4',
            }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>No products found</Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Try adjusting your search or filters</Text>
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
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                  onPress={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                >
                  <Image
                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400x300/0B342B/fff?text=Product' }}
                    style={{ width: '100%', height: 180 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>by {product.vendor_name || product.business_name || 'Vendor'}</Text>
                        <Text style={{ color: '#C9A44B', fontSize: 13, marginTop: 2 }}>
                          {getStars(product.rating)} {product.rating}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleWishlist(product.id)}>
                        <Text style={{ fontSize: 20, color: isInWishlist ? '#DC2626' : '#6B7280' }}>
                          {isInWishlist ? '❤️' : '🤍'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      <View style={{
                        backgroundColor: '#D1FAE5',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 11, fontWeight: '500' }}>✓ Halal</Text>
                      </View>
                      <View style={{
                        backgroundColor: '#FAFAF7',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>{product.category}</Text>
                      </View>
                      {isButchery && product.meat_type && (
                        <View style={{
                          backgroundColor: '#FAFAF7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}>
                          <Text style={{ color: '#6B7280', fontSize: 11 }}>{product.meat_type}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#F4F5F1',
                    }}>
                      <View>
                        {isButchery && product.price_per_kg ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#0B342B', fontSize: 18, fontWeight: '700' }}>{formatCurrency(product.price_per_kg)}</Text>
                            <Text style={{ color: '#6B7280', fontSize: 13 }}>/kg</Text>
                            {product.price && product.price > 0 && product.price !== product.price_per_kg && (
                              <Text style={{ color: '#6B7280', fontSize: 13, textDecorationLine: 'line-through', marginLeft: 6 }}>
                                {formatCurrency(product.price)}
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={{ color: '#0B342B', fontSize: 18, fontWeight: '700' }}>{formatCurrency(product.price)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#0B342B',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          opacity: processing ? 0.6 : 1,
                          shadowColor: '#0B342B',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                        onPress={() => addToCart(product)}
                        disabled={processing}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    {isButchery && product.stock_kg && (
                      <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>Stock: {product.stock_kg} kg</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Order History */}
          {isAuthenticated && showOrderHistory && (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#E8EEF4',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Order History</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FAFAF7',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                  onPress={() => setShowOrderHistory(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Close</Text>
                </TouchableOpacity>
              </View>

              {loadingOrders ? (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color="#C9A44B" />
                </View>
              ) : orders.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 32, marginBottom: 4 }}>📭</Text>
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '600' }}>No orders yet</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Start shopping to see your orders here</Text>
                </View>
              ) : (
                orders.slice(0, 5).map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <View key={order.id} style={{
                      backgroundColor: '#FAFAF7',
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      marginBottom: 6,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}>
                      <View>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>#{order.id}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>{order.items?.length || 0} items</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700' }}>{formatCurrency(order.total_amount)}</Text>
                        <View style={{
                          backgroundColor: badge.bg,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: 'rgba(0,0,0,0.05)',
                        }}>
                          <Text style={{ color: badge.text, fontSize: 11, fontWeight: '500', textTransform: 'capitalize' }}>
                            {order.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Stats */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Halal Products', value: products.length },
              { label: 'Categories', value: categories.length - 1 },
              { label: 'Halal Certified', value: '100%', color: '#3FAF73' },
              { label: 'Trusted Sellers', value: '✓', color: '#C9A44B' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 70,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{
                  color: item.color || '#1F2937',
                  fontSize: 18,
                  fontWeight: '700',
                }}>
                  {item.value}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 11, textAlign: 'center' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Product Detail Modal */}
      <Modal visible={showProductModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Product Details</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Image
                source={{ uri: selectedProduct?.images?.[0] || 'https://via.placeholder.com/400x300/0B342B/fff?text=Product' }}
                style={{ width: '100%', height: 200, borderRadius: 12 }}
                resizeMode="cover"
              />

              <View style={{ marginTop: 12 }}>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>{selectedProduct?.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 14 }}>{getStars(selectedProduct?.rating)} {selectedProduct?.rating}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>({selectedProduct?.reviews || 0} reviews)</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>by {selectedProduct?.vendor_name || 'Vendor'}</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {(selectedProduct?.tags || []).map((tag: string, i: number) => (
                    <View key={i} style={{
                      backgroundColor: '#FAFAF7',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 10, lineHeight: 20 }}>
                  {selectedProduct?.description}
                </Text>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: '#F4F5F1',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 24, fontWeight: '700' }}>{formatCurrency(selectedProduct?.price)}</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0B342B',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8,
                      opacity: processing ? 0.6 : 1,
                      shadowColor: '#0B342B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => {
                      addToCart(selectedProduct);
                      setShowProductModal(false);
                    }}
                    disabled={processing}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCart} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Your Cart</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cart.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>🛒</Text>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Your cart is empty</Text>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Start shopping to add items</Text>
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
                      borderBottomColor: '#F4F5F1',
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>{formatCurrency(item.price)} x {item.quantity}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#F4F5F1',
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                        >
                          <Text style={{ color: '#6B7280', fontSize: 16 }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', width: 24, textAlign: 'center' }}>
                          {item.quantity || 1}
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#F4F5F1',
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        >
                          <Text style={{ color: '#6B7280', fontSize: 16 }}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                          <Text style={{ color: '#DC2626', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View style={{
                    backgroundColor: '#FAFAF7',
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>Subtotal</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatCurrency(getCartTotal())}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>Delivery</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatCurrency(500)}</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      marginTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: '#E8EEF4',
                    }}>
                      <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Total</Text>
                      <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(getCartTotal() + 500)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0B342B',
                      paddingVertical: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginTop: 12,
                      shadowColor: '#0B342B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={handleCheckout}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Checkout</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Order Summary</Text>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cart.map((item) => (
                <View key={item.id} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F4F5F1',
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 14 }}>{item.name} x{item.quantity}</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </Text>
                </View>
              ))}

              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                marginTop: 12,
                borderWidth: 1,
                borderColor: '#E8EEF4',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Subtotal</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatCurrency(getCartTotal())}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Delivery</Text>
                  <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatCurrency(500)}</Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  marginTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: '#E8EEF4',
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>Total</Text>
                  <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>{formatCurrency(getCartTotal() + 500)}</Text>
                </View>
              </View>

              {error ? <Text style={{ color: '#DC2626', fontSize: 13, marginTop: 8 }}>{error}</Text> : null}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowCheckoutModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: processing ? 0.6 : 1,
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={confirmOrder}
                  disabled={processing}
                >
                  {processing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Place Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
          }}>
            <View style={{
              backgroundColor: '#0B342B',
              padding: 16,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: -20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Order Placed!</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🎉</Text>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Order Confirmed!</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Order #{orderNumber}</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  Your order has been placed successfully.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#0B342B',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    shadowColor: '#0B342B',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowOrderHistory(true);
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>View Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F4F5F1',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Continue Shopping</Text>
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
          top: 60,
          right: 16,
          left: 16,
          backgroundColor: '#0B342B',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#0B342B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#C9A44B', fontSize: 16 }}>✓</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500', flex: 1 }}>{success}</Text>
          </View>
          <TouchableOpacity onPress={() => setSuccess('')}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default Ecommerce;