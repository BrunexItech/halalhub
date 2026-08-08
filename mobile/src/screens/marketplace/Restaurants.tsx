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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { clientService, cartService } from '../../api/client';

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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading restaurants...</Text>
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
          {/* Hero Banner */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Halal Dining
                  </Text>
                  <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                  <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>Premium Halal Restaurants</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Discover Halal Restaurants</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                  Explore the finest halal-certified restaurants across Kenya. From local cuisine to international flavors, every meal is prepared with care and authenticity.
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.2)',
                  }}>
                    <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>{restaurants.length} Halal Restaurants</Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.2)',
                  }}>
                    <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>100% Halal Certified</Text>
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 48, opacity: 0.8 }}>🍽️</Text>
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
                onPress={() => { setError(''); fetchRestaurants(); }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Filters */}
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
                  placeholder="Search restaurants..."
                />
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  County
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
                    value={selectedCounty}
                    onChangeText={(text) => setSelectedCounty(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Cuisine
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
                    value={selectedCuisine}
                    onChangeText={(text) => setSelectedCuisine(text)}
                    placeholder="All"
                  />
                </View>
              </View>
              <View style={{ flex: 0.7, minWidth: 100 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Min Rating
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
                    value={String(minRating)}
                    onChangeText={(text) => setMinRating(parseFloat(text) || 0)}
                    placeholder="0"
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
              <Text style={{ color: '#6B7280', fontSize: 14 }}>{filteredRestaurants.length} restaurants found</Text>
            </View>
          </View>

          {/* Restaurants Grid */}
          {filteredRestaurants.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E8EEF4',
            }}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>🍽️</Text>
              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>No restaurants found</Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <View key={restaurant.id} style={{
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
              }}>
                <Image
                  source={{ uri: restaurant.cover_image || restaurant.logo_url || 'https://via.placeholder.com/400x200/0B342B/fff?text=Restaurant' }}
                  style={{ width: '100%', height: 160 }}
                  resizeMode="cover"
                />
                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                        {restaurant.business_name || restaurant.fullname}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>{restaurant.business_type || 'Restaurant'} · {restaurant.county || restaurant.location}</Text>
                    </View>
                    <Text style={{ color: '#C9A44B', fontSize: 14, fontWeight: '600' }}>
                      {getStars(restaurant.rating)} {restaurant.rating}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    <View style={{
                      backgroundColor: '#D1FAE5',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}>
                      <Text style={{ color: '#3FAF73', fontSize: 11, fontWeight: '500' }}>Halal</Text>
                    </View>
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>{restaurant.county || 'Kenya'}</Text>
                    </View>
                    {restaurant.delivery_fee === 0 && (
                      <View style={{
                        backgroundColor: '#D1FAE5',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}>
                        <Text style={{ color: '#3FAF73', fontSize: 11, fontWeight: '500' }}>Free Delivery</Text>
                      </View>
                    )}
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#F4F5F1',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                        {getPriceRangeDisplay(restaurant.price_range)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>🕐</Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>{restaurant.delivery_time}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                        }}
                        onPress={() => handleViewMenu(restaurant)}
                      >
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>Menu</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: restaurant.is_active !== false ? '#0B342B' : '#F4F5F1',
                          opacity: restaurant.is_active !== false ? 1 : 0.6,
                          shadowColor: restaurant.is_active !== false ? '#0B342B' : 'transparent',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: restaurant.is_active !== false ? 0.2 : 0,
                          shadowRadius: 8,
                          elevation: restaurant.is_active !== false ? 4 : 0,
                        }}
                        onPress={() => handleOrderNow(restaurant)}
                        disabled={restaurant.is_active === false}
                      >
                        <Text style={{
                          color: restaurant.is_active !== false ? '#FFFFFF' : '#6B7280',
                          fontSize: 13,
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
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={showMenuModal} transparent animationType="fade">
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
              <View>
                <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>
                  {selectedRestaurant?.business_name || selectedRestaurant?.fullname}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                  {selectedRestaurant?.location || selectedRestaurant?.county || 'Menu'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {menuItems.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>No menu items available</Text>
                </View>
              ) : (
                <>
                  {[...new Set(menuItems.map((item) => item.category))].map((category) => (
                    <View key={category} style={{ marginBottom: 16 }}>
                      <Text style={{
                        color: '#1F2937',
                        fontSize: 15,
                        fontWeight: '700',
                        borderBottomWidth: 2,
                        borderBottomColor: '#0B342B',
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
                          borderColor: '#E8EEF4',
                          flexDirection: 'row',
                          gap: 10,
                        }}>
                          <Image
                            source={{ uri: item.image || 'https://via.placeholder.com/80x80/0B342B/fff?text=Menu' }}
                            style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: '#E8EEF4' }}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 13 }} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '700' }}>{formatCurrency(item.price)}</Text>
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#0B342B',
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 6,
                                }}
                                onPress={() => addToCart(item)}
                              >
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}

                  {cart.length > 0 && (
                    <View style={{
                      backgroundColor: '#FAFAF7',
                      padding: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      marginTop: 8,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Your Order</Text>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{cart.length} items</Text>
                      </View>
                      {cart.map((item) => (
                        <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.name} x{item.quantity}</Text>
                          <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }}>
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
                        borderTopColor: '#E8EEF4',
                      }}>
                        <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>Total:</Text>
                        <Text style={{ color: '#0B342B', fontSize: 15, fontWeight: '700' }}>{formatCurrency(getCartTotal())}</Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#0B342B',
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: 'center',
                          marginTop: 10,
                          shadowColor: '#0B342B',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                        onPress={() => {
                          setShowMenuModal(false);
                          setShowOrderModal(true);
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Proceed to Checkout</Text>
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
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Place Order</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{
                backgroundColor: '#FAFAF7',
                padding: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E8EEF4',
                marginBottom: 12,
              }}>
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>
                  {selectedRestaurant?.business_name || selectedRestaurant?.fullname}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  {selectedRestaurant?.location || selectedRestaurant?.address || 'Nairobi'}
                </Text>
              </View>

              {cart.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Your cart is empty.</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0B342B',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                    onPress={() => {
                      setShowOrderModal(false);
                      setShowMenuModal(true);
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>View Menu</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {cart.map((item) => (
                    <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F4F5F1' }}>
                      <Text style={{ color: '#1F2937', fontSize: 14 }}>{item.name} x{item.quantity}</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{formatCurrency(item.price * item.quantity)}</Text>
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
                      <Text style={{ color: '#6B7280', fontSize: 14 }}>Delivery Fee</Text>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                        {selectedRestaurant?.delivery_fee === 0 ? 'FREE' : formatCurrency(selectedRestaurant?.delivery_fee || 0)}
                      </Text>
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
                      <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>
                        {formatCurrency(getCartTotal() + (selectedRestaurant?.delivery_fee || 0))}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Delivery Type</Text>
                      <View style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}>
                        <TextInput
                          style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                          value={orderData.deliveryType}
                          onChangeText={(text) => setOrderData({ ...orderData, deliveryType: text })}
                          placeholder="delivery"
                        />
                      </View>
                    </View>
                    {orderData.deliveryType === 'delivery' && (
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Delivery Address</Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FAFAF7',
                            borderWidth: 1,
                            borderColor: '#E8EEF4',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            color: '#1F2937',
                            fontSize: 14,
                          }}
                          value={orderData.deliveryAddress}
                          onChangeText={(text) => setOrderData({ ...orderData, deliveryAddress: text })}
                          placeholder="Enter your address"
                        />
                      </View>
                    )}
                    <View>
                      <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Special Instructions</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          color: '#1F2937',
                          fontSize: 14,
                          minHeight: 50,
                          textAlignVertical: 'top',
                        }}
                        value={orderData.specialInstructions}
                        onChangeText={(text) => setOrderData({ ...orderData, specialInstructions: text })}
                        placeholder="Any special requests..."
                        multiline
                      />
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
                      onPress={() => setShowOrderModal(false)}
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
                      onPress={handlePlaceOrder}
                      disabled={processing}
                    >
                      {processing ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Placing Order...</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Place Order</Text>
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
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(11, 52, 43, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(11, 52, 43, 0.2)',
                }}>
                  <Text style={{ color: '#0B342B', fontSize: 32 }}>✓</Text>
                </View>
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', marginTop: 8 }}>
                  Your order has been placed!
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4, textAlign: 'center', lineHeight: 20 }}>
                  {selectedRestaurant?.business_name || selectedRestaurant?.fullname} is preparing your order.
                  You will receive a confirmation message shortly.
                </Text>
              </View>

              <TouchableOpacity
                style={{
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
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
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

export default Restaurants;