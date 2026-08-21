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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { clientService, cartService } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

const RestaurantIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M10 9L12 11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const SearchIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const LocationIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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

const CartIcon = ({ color = '#FFFFFF', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M2 3H4L8 15H20L22 7H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const Restaurants = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [minRating, setMinRating] = useState(0);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [orderData, setOrderData] = useState({
    deliveryType: 'delivery',
    deliveryAddress: '',
    specialInstructions: '',
    phone: '',
  });

  const counties = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Garissa', 'Malindi'];
  const cuisineOptions = ['All', 'Swahili', 'Coastal', 'Somali', 'Ethiopian', 'Indian', 'Kenyan', 'Arabian', 'Turkish'];

  useEffect(() => {
    fetchRestaurants();
    if (user) {
      setOrderData((prev) => ({
        ...prev,
        phone: user.phone || '',
      }));
    }
  }, []);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersExpanded(!filtersExpanded);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientService.getVendors({ business_type: 'restaurant', limit: 100 });
      const restaurantData = response.data.vendors || [];
      setRestaurants(restaurantData);
    } catch (err) {
      console.log('Error fetching restaurants:', err);
      setError('Failed to load restaurants. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMenu = async (restaurantId: string) => {
    try {
      const response = await clientService.getMenuItems({ vendor_id: restaurantId });
      setMenuItems(response.data.menuItems || []);
    } catch (err) {
      console.log('Error fetching menu:', err);
      setError('Failed to load menu.');
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = (r.business_name || r.fullname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = selectedCounty === 'All' || r.county === selectedCounty || r.location === selectedCounty;
    const matchesCuisine = selectedCuisine === 'All' || (r.cuisine && r.cuisine.includes(selectedCuisine));
    const matchesRating = (r.rating || 0) >= minRating;
    return matchesSearch && matchesCounty && matchesCuisine && matchesRating;
  });

  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map((c) =>
      c.id === itemId ? { ...c, quantity } : c
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleViewMenu = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    await fetchMenu(restaurant.id);
    setShowMenuModal(true);
  };

  const handleOrderNow = (restaurant: any) => {
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
      const orderPayload = {
        vendor_id: selectedRestaurant.id,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: getCartTotal(),
        delivery_fee: selectedRestaurant.delivery_fee || 0,
        delivery_address: orderData.deliveryAddress,
        delivery_type: orderData.deliveryType,
        special_instructions: orderData.specialInstructions,
      };

      await clientService.createOrder(orderPayload);

      setShowOrderModal(false);
      setShowSuccessModal(true);
      setCart([]);
      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
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

  const getPriceRangeDisplay = (range: string | number) => {
    if (!range) return '';
    const parts = String(range).split('-');
    if (parts.length === 2) {
      return `${formatCurrency(parseInt(parts[0]))}–${formatCurrency(parseInt(parts[1]))}`;
    }
    return formatCurrency(parseInt(range));
  };

 if (loading) {
  return <LoadingSpinner message="Loading restaurants..." />;
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
                  <RestaurantIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Halal Dining
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Discover Halal Restaurants
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Premium · Authentic · Halal Certified
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
                onPress={() => { setError(''); fetchRestaurants(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ===== COLLAPSIBLE FILTERS ===== */}
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
                  {filteredRestaurants.length} restaurants
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
                        placeholder="Search restaurants..."
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.7, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      County
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
                        value={selectedCounty}
                        onChangeText={(text) => setSelectedCounty(text)}
                        placeholder="All"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.7, minWidth: 90 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Cuisine
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
                        value={selectedCuisine}
                        onChangeText={(text) => setSelectedCuisine(text)}
                        placeholder="All"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 0.6, minWidth: 70 }}>
                    <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Min Rating
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
                        value={String(minRating)}
                        onChangeText={(text) => setMinRating(parseFloat(text) || 0)}
                        placeholder="0"
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
                    <Text style={{ fontWeight: '600', color: '#032A24' }}>{filteredRestaurants.length}</Text> restaurants found
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ===== PREMIUM RESTAURANT CARDS ===== */}
          {filteredRestaurants.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 48,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
            }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🍽️</Text>
              <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '600' }}>No restaurants found</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <View key={restaurant.id} style={{
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
              }}>
                <Image
                  source={{ uri: restaurant.cover_image || restaurant.logo_url || 'https://via.placeholder.com/400x200/032A24/C9A44B?text=Restaurant' }}
                  style={{ width: '100%', height: 170 }}
                  resizeMode="cover"
                />
                
                {/* Status Badge */}
                {restaurant.is_active === false && (
                  <View style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    backgroundColor: 'rgba(220, 38, 38, 0.9)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Closed</Text>
                  </View>
                )}

                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>
                        {restaurant.business_name || restaurant.fullname}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <LocationIcon color="#6B7280" size={12} />
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>{restaurant.county || restaurant.location}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <StarIcon color="#C9A44B" size={12} />
                        <Text style={{ color: '#C9A44B', fontSize: 13, fontWeight: '600' }}>{restaurant.rating || 0}</Text>
                      </View>
                      {restaurant.total_reviews > 0 && (
                        <Text style={{ color: '#8B8A86', fontSize: 10 }}>({restaurant.total_reviews} reviews)</Text>
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
                      <Text style={{ color: '#3FAF73', fontSize: 9, fontWeight: '500' }}>Halal</Text>
                    </View>
                    <View style={{
                      backgroundColor: 'rgba(3, 42, 36, 0.04)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 9 }}>{restaurant.county || 'Kenya'}</Text>
                    </View>
                    {restaurant.delivery_fee === 0 && (
                      <View style={{
                        backgroundColor: 'rgba(63, 175, 115, 0.06)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(63, 175, 115, 0.08)',
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 9, fontWeight: '500' }}>Free Delivery</Text>
                      </View>
                    )}
                    {restaurant.cuisine && (
                      <View style={{
                        backgroundColor: 'rgba(201, 164, 75, 0.06)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(201, 164, 75, 0.06)',
                      }}>
                        <Text style={{ color: '#C9A44B', fontSize: 9 }}>
                          {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
                        </Text>
                      </View>
                    )}
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
                    borderTopColor: 'rgba(3, 42, 36, 0.04)',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <ClockIcon color="#6B7280" size={12} />
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{restaurant.delivery_time}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: '#FAFAF7',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                        }}
                        onPress={() => handleViewMenu(restaurant)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>Menu</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: restaurant.is_active !== false ? '#032A24' : '#F3F4F6',
                          opacity: restaurant.is_active !== false ? 1 : 0.6,
                        }}
                        onPress={() => handleOrderNow(restaurant)}
                        disabled={restaurant.is_active === false}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          color: restaurant.is_active !== false ? '#FFFFFF' : '#6B7280',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {restaurant.is_active !== false ? 'Order' : 'Closed'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Halal Dining
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== MODALS (Preserved with premium styling) ===== */}
      {/* Menu Modal */}
      <Modal visible={showMenuModal} transparent animationType="fade">
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
              <View>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
                  {selectedRestaurant?.business_name || selectedRestaurant?.fullname}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  {selectedRestaurant?.location || selectedRestaurant?.county || 'Menu'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {menuItems.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>No menu items available</Text>
                </View>
              ) : (
                <>
                  {[...new Set(menuItems.map((item) => item.category))].map((category) => (
                    <View key={category} style={{ marginBottom: 14 }}>
                      <Text style={{
                        color: '#032A24',
                        fontSize: 14,
                        fontWeight: '700',
                        borderBottomWidth: 1.5,
                        borderBottomColor: '#C9A44B',
                        paddingBottom: 6,
                        marginBottom: 10,
                      }}>
                        {category}
                      </Text>
                      {menuItems.filter((item) => item.category === category).map((item) => (
                        <View key={item.id} style={{
                          backgroundColor: '#FAFAF7',
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                          flexDirection: 'row',
                          gap: 10,
                        }}>
                          <Image
                            source={{ uri: item.image || 'https://via.placeholder.com/80x80/032A24/C9A44B?text=Menu' }}
                            style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(3, 42, 36, 0.04)' }}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 11 }} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>
                                {formatCurrency(item.price)}
                              </Text>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#032A24',
                                  paddingHorizontal: 10,
                                  paddingVertical: 5,
                                  borderRadius: 6,
                                }}
                                onPress={() => addToCart(item)}
                                activeOpacity={0.7}
                              >
                                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}

                  {cart.length > 0 && (
                    <View style={{
                      backgroundColor: 'rgba(3, 42, 36, 0.02)',
                      padding: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                      marginTop: 8,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>Your Order</Text>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{cart.length} items</Text>
                      </View>
                      {cart.map((item) => (
                        <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>{item.name} x{item.quantity}</Text>
                          <Text style={{ color: '#032A24', fontSize: 12, fontWeight: '500' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </Text>
                        </View>
                      ))}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        marginTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>Total:</Text>
                        <Text style={{ color: '#C9A44B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(getCartTotal())}</Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#032A24',
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: 'center',
                          marginTop: 10,
                        }}
                        onPress={() => {
                          setShowMenuModal(false);
                          setShowOrderModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Proceed to Checkout</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Modal */}
      <Modal visible={showOrderModal} transparent animationType="fade">
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
                Place Order
              </Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.02)',
                padding: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>
                  {selectedRestaurant?.business_name || selectedRestaurant?.fullname}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>
                  {selectedRestaurant?.location || selectedRestaurant?.address || 'Nairobi'}
                </Text>
              </View>

              {cart.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Your cart is empty.</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#032A24',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                    onPress={() => {
                      setShowOrderModal(false);
                      setShowMenuModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>View Menu</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {cart.map((item) => (
                    <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(3, 42, 36, 0.04)' }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.name} x{item.quantity}</Text>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>{formatCurrency(item.price * item.quantity)}</Text>
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
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>Delivery Fee</Text>
                      <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                        {selectedRestaurant?.delivery_fee === 0 ? 'FREE' : formatCurrency(selectedRestaurant?.delivery_fee || 0)}
                      </Text>
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
                      <Text style={{ color: '#C9A44B', fontSize: 15, fontWeight: '700' }}>
                        {formatCurrency(getCartTotal() + (selectedRestaurant?.delivery_fee || 0))}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Delivery Type
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
                          value={orderData.deliveryType}
                          onChangeText={(text) => setOrderData({ ...orderData, deliveryType: text })}
                          placeholder="delivery"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    {orderData.deliveryType === 'delivery' && (
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                          Delivery Address
                        </Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FAFAF7',
                            borderWidth: 1,
                            borderColor: 'rgba(3, 42, 36, 0.06)',
                            borderRadius: 10,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={orderData.deliveryAddress}
                          onChangeText={(text) => setOrderData({ ...orderData, deliveryAddress: text })}
                          placeholder="Enter your address"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    )}
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Special Instructions
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                          minHeight: 50,
                          textAlignVertical: 'top',
                        }}
                        value={orderData.specialInstructions}
                        onChangeText={(text) => setOrderData({ ...orderData, specialInstructions: text })}
                        placeholder="Any special requests..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                      />
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
                      onPress={() => setShowOrderModal(false)}
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
                      onPress={handlePlaceOrder}
                      disabled={processing}
                      activeOpacity={0.7}
                    >
                      {processing ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Placing Order...</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Place Order</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'rgba(63, 175, 115, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(63, 175, 115, 0.12)',
                }}>
                  <CheckIcon color="#3FAF73" size={30} />
                </View>
                <Text style={{ color: '#032A24', fontSize: 18, fontWeight: '700', marginTop: 8 }}>
                  Your order has been placed!
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4, textAlign: 'center', lineHeight: 20 }}>
                  {selectedRestaurant?.business_name || selectedRestaurant?.fullname} is preparing your order.
                  You will receive a confirmation message shortly.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#032A24',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
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

export default Restaurants;