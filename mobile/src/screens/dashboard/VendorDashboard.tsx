import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { vendorService } from '../../api/client';

const VendorDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [profile, setProfile] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({
    business_type: '',
    business_name: '',
    description: '',
    location: '',
    county: '',
    website: '',
    phone: '',
    email: '',
    logo_url: '',
    cover_image: '',
    is_active: true,
  });

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalBookings: 0,
    pendingOrders: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    rating: 0,
    totalReviews: 0,
    totalListings: 0,
    totalMenuItems: 0,
    totalRooms: 0,
    availableRooms: 0,
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [earnings, setEarnings] = useState({
    total_earnings: 0,
    pending_earnings: 0,
    monthly_earnings: 0,
    completed_orders: 0,
  });

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    unit: 'piece',
    images: [],
    tags: [],
    is_halal: true,
    is_active: true,
    meat_type: 'beef',
    cut_type: 'whole',
    price_per_kg: '',
    stock_kg: '',
  });

  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    type: 'house',
    location: '',
    county: '',
    price_per_night: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    amenities: [],
    images: [],
    is_halal: true,
    is_active: true,
    total_rooms: 1,
    min_stay: 1,
    max_advance_days: 90,
    max_guests_per_room: 2,
  });

  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    is_available: true,
    image: '',
  });

  const meatTypes = [
    { id: 'beef', label: 'Beef' },
    { id: 'goat', label: 'Goat' },
    { id: 'chicken', label: 'Chicken' },
    { id: 'lamb', label: 'Lamb' },
    { id: 'camel', label: 'Camel' },
    { id: 'fish', label: 'Fish' },
    { id: 'mixed', label: 'Mixed' },
    { id: 'other', label: 'Other' },
  ];

  const cutTypes = [
    { id: 'whole', label: 'Whole' },
    { id: 'half', label: 'Half' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'minced', label: 'Minced' },
    { id: 'steaks', label: 'Steaks' },
    { id: 'cubes', label: 'Cubes' },
    { id: 'slices', label: 'Slices' },
    { id: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, profileRes, productsRes, ordersRes, listingsRes, menuRes, earningsRes] = await Promise.all([
        vendorService.getStats(),
        vendorService.getProfile(),
        vendorService.getProducts(),
        vendorService.getOrders({ limit: 10 }),
        vendorService.getListings(),
        vendorService.getMenuItems(),
        vendorService.getEarnings(),
      ]);

      setStats(statsRes.data.stats || {});
      setProfile(profileRes.data.vendor || null);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setListings(listingsRes.data.listings || []);
      setMenuItems(menuRes.data.menuItems || []);
      setEarnings(earningsRes.data.earnings || {});

      if (profileRes.data.vendor?.profile_id) {
        const vendorProfile = profileRes.data.vendor;
        setBusinessInfo({
          business_type: vendorProfile.business_type || '',
          business_name: vendorProfile.business_name || '',
          description: vendorProfile.description || '',
          location: vendorProfile.location || '',
          county: vendorProfile.county || '',
          website: vendorProfile.website || '',
          phone: vendorProfile.phone || '',
          email: vendorProfile.email || '',
          logo_url: vendorProfile.logo_url || '',
          cover_image: vendorProfile.cover_image || '',
          is_active: vendorProfile.profile_active !== false,
        });
      }
    } catch (err) {
      console.error('Error fetching vendor data:', err);
      setError('Failed to load vendor data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorData();
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FEF3C7',
      processing: '#DBEAFE',
      completed: '#D1FAE5',
      active: '#D1FAE5',
      'low stock': '#FEE2E2',
      cancelled: '#FEE2E2',
      shipped: '#DBEAFE',
      delivered: '#D1FAE5',
      confirmed: '#D1FAE5',
    };
    const textColors: Record<string, string> = {
      pending: '#D97706',
      processing: '#3B82F6',
      completed: '#3FAF73',
      active: '#3FAF73',
      'low stock': '#DC2626',
      cancelled: '#DC2626',
      shipped: '#3B82F6',
      delivered: '#3FAF73',
      confirmed: '#3FAF73',
    };
    return {
      bg: colors[status?.toLowerCase()] || '#F4F5F1',
      text: textColors[status?.toLowerCase()] || '#6B7280',
    };
  };

  const getBusinessTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      halalmarket: '🛒',
      halalbutchery: '🥩',
      halalstay: '🏨',
      restaurant: '🍽️',
      hajj: '🕋',
    };
    return icons[type] || '🏪';
  };

  const getTabLabel = () => {
    const type = businessInfo.business_type;
    const labels: Record<string, string> = {
      halalmarket: 'Products',
      halalbutchery: 'Products',
      halalstay: 'Listings',
      restaurant: 'Menu Items',
    };
    return labels[type] || 'Items';
  };

  const isButchery = businessInfo.business_type === 'halalbutchery';

  const toggleBusinessStatus = async () => {
    try {
      await vendorService.toggleStatus({ is_active: !businessInfo.is_active });
      setBusinessInfo({ ...businessInfo, is_active: !businessInfo.is_active });
      setSuccess(`Business ${businessInfo.is_active ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to toggle business status');
    }
  };

  const saveProfileUpdate = async () => {
    if (!businessInfo.location) {
      setError('Location is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await vendorService.updateProfile(businessInfo);
      setShowEditProfile(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    setProcessing(true);
    setError('');
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
      };

      if (businessInfo.business_type === 'halalbutchery') {
        productData.meat_type = newProduct.meat_type || 'beef';
        productData.cut_type = newProduct.cut_type || 'whole';
        productData.price_per_kg = parseFloat(newProduct.price_per_kg) || 0;
        productData.stock_kg = parseFloat(newProduct.stock_kg) || 0;
      }

      await vendorService.createProduct(productData);
      setShowAddProduct(false);
      resetNewProduct();
      setSuccess('Product added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add product');
    } finally {
      setProcessing(false);
    }
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      unit: 'piece',
      images: [],
      tags: [],
      is_halal: true,
      is_active: true,
      meat_type: 'beef',
      cut_type: 'whole',
      price_per_kg: '',
      stock_kg: '',
    });
  };

  const deleteProduct = async (productId: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await vendorService.deleteProduct(productId);
            setSuccess('Product deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            await fetchVendorData();
          } catch (err) {
            setError('Failed to delete product');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleAddListing = async () => {
    setProcessing(true);
    setError('');
    try {
      await vendorService.createListing({
        ...newListing,
        price_per_night: parseFloat(newListing.price_per_night),
        total_rooms: parseInt(newListing.total_rooms) || 1,
        min_stay: parseInt(newListing.min_stay) || 1,
        max_advance_days: parseInt(newListing.max_advance_days) || 90,
        max_guests_per_room: parseInt(newListing.max_guests_per_room) || 2,
      });

      setShowAddListing(false);
      resetNewListing();
      setSuccess('Listing added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add listing');
    } finally {
      setProcessing(false);
    }
  };

  const resetNewListing = () => {
    setNewListing({
      title: '',
      description: '',
      type: 'house',
      location: '',
      county: '',
      price_per_night: '',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      amenities: [],
      images: [],
      is_halal: true,
      is_active: true,
      total_rooms: 1,
      min_stay: 1,
      max_advance_days: 90,
      max_guests_per_room: 2,
    });
  };

  const deleteListing = async (listingId: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await vendorService.deleteListing(listingId);
            setSuccess('Listing deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            await fetchVendorData();
          } catch (err) {
            setError('Failed to delete listing');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleAddMenuItem = async () => {
    setProcessing(true);
    setError('');
    try {
      await vendorService.createMenuItem({
        ...newMenuItem,
        price: parseFloat(newMenuItem.price),
      });

      setShowAddMenuItem(false);
      resetNewMenuItem();
      setSuccess('Menu item added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add menu item');
    } finally {
      setProcessing(false);
    }
  };

  const resetNewMenuItem = () => {
    setNewMenuItem({
      name: '',
      description: '',
      category: '',
      price: '',
      is_available: true,
      image: '',
    });
  };

  const deleteMenuItem = async (menuItemId: string) => {
    Alert.alert('Delete Menu Item', 'Are you sure you want to delete this menu item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await vendorService.deleteMenuItem(menuItemId);
            setSuccess('Menu item deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            await fetchVendorData();
          } catch (err) {
            setError('Failed to delete menu item');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setLoading(true);
    try {
      await vendorService.updateOrderStatus(orderId, { status });
      setSuccess(`Order ${orderId} updated to ${status}`);
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 15 }}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile?.profile_id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(11, 52, 43, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 40, color: '#0B342B' }}>🏪</Text>
            </View>
            <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
              No Business Profile Found
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 15, textAlign: 'center', marginTop: 8 }}>
              Please complete your business registration first.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#0B342B',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 24,
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => navigation.navigate('VendorRegister' as never)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Complete Registration</Text>
            </TouchableOpacity>
          </View>
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
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: '700' }}>
              {businessInfo.business_name || profile?.business_name || 'Vendor Dashboard'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              <Text style={{ color: '#6B7280', fontSize: 15 }}>{getBusinessTypeIcon(businessInfo.business_type)}</Text>
              <Text style={{ color: '#6B7280', fontSize: 15, marginLeft: 4, textTransform: 'capitalize' }}>
                {businessInfo.business_type || 'Business'}
              </Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#E8EEF4', marginHorizontal: 8 }} />
              <Text style={{ color: '#6B7280', fontSize: 15 }}>{businessInfo.location || 'Manage your business'}</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: businessInfo.is_active ? '#D1FAE5' : '#FEE2E2',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                marginLeft: 8,
              }}>
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                  marginRight: 4,
                }} />
                <Text style={{
                  color: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                  fontSize: 13,
                  fontWeight: '500',
                }}>
                  {businessInfo.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: businessInfo.is_active ? '#FEE2E2' : '#D1FAE5',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
              }}
              onPress={toggleBusinessStatus}
            >
              <Text style={{
                color: businessInfo.is_active ? '#DC2626' : '#3FAF73',
                fontSize: 13,
                fontWeight: '500',
              }}>
                {businessInfo.is_active ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E8EEF4',
              }}
              onPress={onRefresh}
            >
              <Text style={{ color: '#6B7280', fontSize: 16 }}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: 'rgba(220, 38, 38, 0.2)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#DC2626', fontSize: 15 }}>{error}</Text>
            <TouchableOpacity onPress={() => { setError(''); fetchVendorData(); }}>
              <Text style={{ color: 'rgba(220, 38, 38, 0.6)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
          {[
            { label: getTabLabel(), value: stats.totalProducts || stats.totalListings || stats.totalMenuItems || 0, icon: '📦' },
            { label: 'Orders', value: stats.totalOrders || 0, icon: '🛒' },
            { label: 'Earnings', value: formatCurrency(earnings.total_earnings), icon: '💰', color: '#3FAF73' },
            { label: 'Rating', value: stats.rating || 0, icon: '⭐', color: '#C9A44B' },
            { label: 'Pending', value: stats.pendingOrders || 0, icon: '⏳', color: '#DC2626' },
          ].map((item, index) => (
            <View key={index} style={{
              width: '19%',
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
              <Text style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</Text>
              <Text style={{
                color: item.color || '#1F2937',
                fontSize: 16,
                fontWeight: '700',
              }}>
                {typeof item.value === 'number' ? item.value : item.value}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 11 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* HalalStay Stats */}
        {businessInfo.business_type === 'halalstay' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
            {[
              { label: 'Total Listings', value: stats.totalListings || 0, icon: '🏠' },
              { label: 'Total Rooms', value: stats.totalRooms || 0, icon: '🛏️', color: '#0B342B' },
              { label: 'Available', value: stats.availableRooms || 0, icon: '✅', color: '#3FAF73' },
            ].map((item, index) => (
              <View key={index} style={{
                width: '32%',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E8EEF4',
              }}>
                <Text style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</Text>
                <Text style={{ color: item.color || '#1F2937', fontSize: 16, fontWeight: '700' }}>{item.value}</Text>
                <Text style={{ color: '#6B7280', fontSize: 11 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 4,
          borderWidth: 1,
          borderColor: '#E8EEF4',
          marginBottom: 16,
        }}>
          {['overview', 'items', 'orders', 'profile'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: activeTab === tab ? '#0B342B' : 'transparent',
                margin: 2,
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{
                color: activeTab === tab ? '#FFFFFF' : '#6B7280',
                fontSize: 13,
                fontWeight: activeTab === tab ? '600' : '500',
                textTransform: 'capitalize',
              }}>
                {tab === 'items' ? getTabLabel() : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' ? (
          <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
              {[
                { label: `Add ${getTabLabel().slice(0, -1)}`, icon: '➕', action: () => {
                  if (businessInfo.business_type === 'halalstay') setShowAddListing(true);
                  else if (businessInfo.business_type === 'restaurant') setShowAddMenuItem(true);
                  else setShowAddProduct(true);
                }},
                { label: 'View Orders', icon: '📋', action: () => setActiveTab('orders') },
                { label: 'Edit Profile', icon: '✏️', action: () => setShowEditProfile(true) },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: '32%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}
                  onPress={item.action}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</Text>
                  <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Orders */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E8EEF4',
            }}>
              <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600', marginBottom: 12 }}>Recent Orders</Text>
              {orders.length === 0 ? (
                <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
                  No orders yet.
                </Text>
              ) : (
                orders.slice(0, 5).map((order, index) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <View key={order.id} style={{
                      paddingVertical: 10,
                      borderBottomWidth: index < orders.slice(0, 5).length - 1 ? 1 : 0,
                      borderBottomColor: '#F4F5F1',
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                            {order.order_type === 'booking' ? '🏨' : '🛒'} {order.id}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>{order.customer_name || 'Customer'}</Text>
                        </View>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                          {formatCurrency(order.total_amount)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <View style={{
                          backgroundColor: badge.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                        }}>
                          <Text style={{ color: badge.text, fontSize: 12, fontWeight: '500' }}>
                            {order.status || 'pending'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {['pending', 'processing', 'shipped', 'completed', 'cancelled', 'confirmed'].map((status) => (
                            <TouchableOpacity
                              key={status}
                              style={{
                                backgroundColor: order.status === status ? '#0B342B' : '#F4F5F1',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                              onPress={() => updateOrderStatus(order.id, status)}
                            >
                              <Text style={{
                                color: order.status === status ? '#FFFFFF' : '#6B7280',
                                fontSize: 11,
                                fontWeight: order.status === status ? '600' : '400',
                                textTransform: 'capitalize',
                              }}>
                                {status}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : null}

        {/* Items Tab */}
        {activeTab === 'items' ? (
          <View>
            {businessInfo.business_type === 'halalstay' ? (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>Your Listings</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0B342B',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onPress={() => setShowAddListing(true)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16 }}>+</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>Add</Text>
                  </TouchableOpacity>
                </View>
                {listings.length === 0 ? (
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>No listings yet. Add your first property!</Text>
                  </View>
                ) : (
                  listings.map((listing) => (
                    <View key={listing.id} style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      overflow: 'hidden',
                    }}>
                      <Image
                        source={{ uri: listing.images?.[0] || 'https://via.placeholder.com/400x200/0B342B/fff?text=Listing' }}
                        style={{ width: '100%', height: 160 }}
                        resizeMode="cover"
                      />
                      <View style={{ padding: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{listing.title}</Text>
                            <Text style={{ color: '#6B7280', fontSize: 14 }}>{listing.location}</Text>
                          </View>
                          <View style={{
                            backgroundColor: listing.is_active ? '#D1FAE5' : '#FEE2E2',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 999,
                          }}>
                            <Text style={{
                              color: listing.is_active ? '#3FAF73' : '#DC2626',
                              fontSize: 12,
                              fontWeight: '500',
                            }}>
                              {listing.is_active ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>
                            {formatCurrency(listing.price_per_night)}/night
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>{listing.bedrooms} beds</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>
                            Rooms: {listing.available_rooms}/{listing.total_rooms}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>
                            Min stay: {listing.min_stay} night(s)
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#FEE2E2',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 8,
                          }}
                          onPress={() => deleteListing(listing.id)}
                        >
                          <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '500' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : businessInfo.business_type === 'restaurant' ? (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>Menu Items</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0B342B',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onPress={() => setShowAddMenuItem(true)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16 }}>+</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>Add</Text>
                  </TouchableOpacity>
                </View>
                {menuItems.length === 0 ? (
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>No menu items yet. Add your first dish!</Text>
                  </View>
                ) : (
                  menuItems.map((item) => (
                    <View key={item.id} style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>{item.category}</Text>
                          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{item.description}</Text>
                        </View>
                        <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>
                          {formatCurrency(item.price)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F4F5F1' }}>
                        <Text style={{
                          color: item.is_available ? '#3FAF73' : '#DC2626',
                          fontSize: 13,
                          fontWeight: '500',
                        }}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Text>
                        <TouchableOpacity onPress={() => deleteMenuItem(item.id)}>
                          <Text style={{ color: '#DC2626', fontSize: 14 }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>
                    {isButchery ? 'Meat Products' : 'Your Products'}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#0B342B',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onPress={() => setShowAddProduct(true)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16 }}>+</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>
                      {isButchery ? 'Add Meat' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {products.length === 0 ? (
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E8EEF4',
                  }}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>
                      {isButchery ? 'No meat products yet. Add your first product!' : 'No products yet. Add your first product!'}
                    </Text>
                  </View>
                ) : (
                  products.map((product) => {
                    const badge = getStatusBadge(product.status || 'active');
                    return (
                      <View key={product.id} style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        overflow: 'hidden',
                      }}>
                        <Image
                          source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400x200/0B342B/fff?text=Product' }}
                          style={{ width: '100%', height: 160 }}
                          resizeMode="cover"
                        />
                        <View style={{ padding: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{product.name}</Text>
                              <Text style={{ color: '#6B7280', fontSize: 14 }}>{product.category}</Text>
                              {isButchery && product.meat_type && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                  <View style={{
                                    backgroundColor: '#FAFAF7',
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor: '#E8EEF4',
                                  }}>
                                    <Text style={{ color: '#6B7280', fontSize: 12 }}>{product.meat_type}</Text>
                                  </View>
                                  {product.cut_type && product.cut_type !== 'whole' && (
                                    <View style={{
                                      backgroundColor: '#FAFAF7',
                                      paddingHorizontal: 8,
                                      paddingVertical: 2,
                                      borderRadius: 999,
                                      borderWidth: 1,
                                      borderColor: '#E8EEF4',
                                    }}>
                                      <Text style={{ color: '#6B7280', fontSize: 12 }}>{product.cut_type}</Text>
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                            <View style={{
                              backgroundColor: badge.bg,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                            }}>
                              <Text style={{ color: badge.text, fontSize: 12, fontWeight: '500' }}>
                                {product.status || 'Active'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                            <View>
                              <Text style={{ color: '#0B342B', fontSize: 16, fontWeight: '700' }}>
                                {isButchery && product.price_per_kg ? formatCurrency(product.price_per_kg) + '/kg' : formatCurrency(product.price)}
                              </Text>
                              {isButchery && product.price && product.price > 0 && product.price !== product.price_per_kg && (
                                <Text style={{ color: '#6B7280', fontSize: 13, marginLeft: 4 }}>
                                  ({formatCurrency(product.price)})
                                </Text>
                              )}
                            </View>
                            <Text style={{ color: '#6B7280', fontSize: 14 }}>
                              {isButchery && product.stock_kg ? `${product.stock_kg} kg` : `Stock: ${product.stock || 0}`}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#FEE2E2',
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: 'center',
                              marginTop: 8,
                            }}
                            onPress={() => deleteProduct(product.id)}
                          >
                            <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '500' }}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        ) : null}

        {/* Orders Tab */}
        {activeTab === 'orders' ? (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
          }}>
            <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600', marginBottom: 12 }}>All Orders</Text>
            {orders.length === 0 ? (
              <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', paddingVertical: 24 }}>
                No orders yet.
              </Text>
            ) : (
              orders.map((order, index) => {
                const badge = getStatusBadge(order.status);
                return (
                  <View key={order.id} style={{
                    paddingVertical: 12,
                    borderBottomWidth: index < orders.length - 1 ? 1 : 0,
                    borderBottomColor: '#F4F5F1',
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                          {order.order_type === 'booking' ? '🏨' : '🛒'} {order.id}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 13 }}>{order.customer_name || 'Customer'}</Text>
                        {order.order_type === 'booking' ? (
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>
                            {formatDate(order.check_in)} → {formatDate(order.check_out)} | {order.guests} guests
                          </Text>
                        ) : (
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>
                            {order.items && typeof order.items === 'object' && !Array.isArray(order.items)
                              ? order.items.name || JSON.stringify(order.items)
                              : Array.isArray(order.items)
                                ? order.items.map((item: any) => item.name).join(', ')
                                : order.items || 'No items'}
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>
                        {formatCurrency(order.total_amount)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <View style={{
                        backgroundColor: badge.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}>
                        <Text style={{ color: badge.text, fontSize: 12, fontWeight: '500' }}>
                          {order.status || 'pending'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                        {['pending', 'processing', 'shipped', 'completed', 'cancelled', 'confirmed'].map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={{
                              backgroundColor: order.status === status ? '#0B342B' : '#F4F5F1',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}
                            onPress={() => updateOrderStatus(order.id, status)}
                          >
                            <Text style={{
                              color: order.status === status ? '#FFFFFF' : '#6B7280',
                              fontSize: 11,
                              fontWeight: order.status === status ? '600' : '400',
                              textTransform: 'capitalize',
                            }}>
                              {status}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* Profile Tab */}
        {activeTab === 'profile' ? (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 17, fontWeight: '600' }}>Business Profile</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#0B342B',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
                onPress={() => setShowEditProfile(true)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Business Name</Text>
              <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8 }}>
                {businessInfo.business_name || profile?.business_name || ''}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Business Type</Text>
              <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8, textTransform: 'capitalize' }}>
                {businessInfo.business_type || ''}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Location</Text>
              <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8 }}>
                {businessInfo.location || ''}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>County</Text>
              <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8 }}>
                {businessInfo.county || ''}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Description</Text>
              <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8, minHeight: 60 }}>
                {businessInfo.description || ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Phone</Text>
                <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8 }}>
                  {businessInfo.phone || ''}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Email</Text>
                <Text style={{ color: '#1F2937', fontSize: 15, backgroundColor: '#F4F5F1', padding: 10, borderRadius: 8 }}>
                  {businessInfo.email || ''}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F4F5F1' }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: businessInfo.is_active ? '#D1FAE5' : '#FEE2E2',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                  marginRight: 6,
                }} />
                <Text style={{
                  color: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  {businessInfo.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Edit Profile Modal */}
        <Modal visible={showEditProfile} transparent animationType="fade">
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
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                  <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Business Name *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={businessInfo.business_name}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, business_name: text })}
                    placeholder="Business name"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Phone</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={businessInfo.phone}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
                    placeholder="+254 7XX XXX XXX"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Location *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={businessInfo.location}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, location: text })}
                    placeholder="City, County"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>County</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={businessInfo.county}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, county: text })}
                    placeholder="County"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Description</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }}
                    value={businessInfo.description}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, description: text })}
                    placeholder="Describe your business"
                    multiline
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Email</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={businessInfo.email}
                      onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
                      placeholder="business@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Website</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={businessInfo.website}
                      onChangeText={(text) => setBusinessInfo({ ...businessInfo, website: text })}
                      placeholder="https://example.com"
                    />
                  </View>
                </View>

                {error ? (
                  <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#F4F5F1', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setShowEditProfile(false)}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#0B342B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={saveProfileUpdate}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Product Modal */}
        <Modal visible={showAddProduct} transparent animationType="fade">
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
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>
                  {isButchery ? 'Add Meat Product' : 'Add Product'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                  <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Name *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newProduct.name}
                    onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                    placeholder="Product name"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Category *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newProduct.category}
                    onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
                    placeholder="Category"
                  />
                </View>

                {isButchery ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Meat Type *</Text>
                        <View style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}>
                          <TextInput
                            style={{ color: '#1F2937', fontSize: 15, padding: 0 }}
                            value={newProduct.meat_type}
                            onChangeText={(text) => setNewProduct({ ...newProduct, meat_type: text })}
                            placeholder="beef"
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Cut Type</Text>
                        <View style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                        }}>
                          <TextInput
                            style={{ color: '#1F2937', fontSize: 15, padding: 0 }}
                            value={newProduct.cut_type}
                            onChangeText={(text) => setNewProduct({ ...newProduct, cut_type: text })}
                            placeholder="whole"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Price (KES) *</Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#E8EEF4',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            color: '#1F2937',
                            fontSize: 15,
                          }}
                          value={newProduct.price}
                          onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                          placeholder="0"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Price Per Kg</Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#E8EEF4',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            color: '#1F2937',
                            fontSize: 15,
                          }}
                          value={newProduct.price_per_kg}
                          onChangeText={(text) => setNewProduct({ ...newProduct, price_per_kg: text })}
                          placeholder="Optional"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Stock (units)</Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#E8EEF4',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            color: '#1F2937',
                            fontSize: 15,
                          }}
                          value={newProduct.stock}
                          onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                          placeholder="0"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Stock (kg)</Text>
                        <TextInput
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#E8EEF4',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            color: '#1F2937',
                            fontSize: 15,
                          }}
                          value={newProduct.stock_kg}
                          onChangeText={(text) => setNewProduct({ ...newProduct, stock_kg: text })}
                          placeholder="Optional"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Price (KES) *</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 15,
                        }}
                        value={newProduct.price}
                        onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Stock</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#E8EEF4',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 15,
                        }}
                        value={newProduct.stock}
                        onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                  </>
                )}

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Description</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                      minHeight: 60,
                      textAlignVertical: 'top',
                    }}
                    value={newProduct.description}
                    onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                    placeholder="Description"
                    multiline
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Unit</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newProduct.unit}
                    onChangeText={(text) => setNewProduct({ ...newProduct, unit: text })}
                    placeholder="piece"
                  />
                </View>

                {error ? (
                  <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#F4F5F1', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setShowAddProduct(false)}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#0B342B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={handleAddProduct}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                        {isButchery ? 'Add Meat' : 'Add Product'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Listing Modal */}
        <Modal visible={showAddListing} transparent animationType="fade">
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
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Add Listing</Text>
                <TouchableOpacity onPress={() => setShowAddListing(false)}>
                  <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Title *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newListing.title}
                    onChangeText={(text) => setNewListing({ ...newListing, title: text })}
                    placeholder="Property title"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Location *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newListing.location}
                    onChangeText={(text) => setNewListing({ ...newListing, location: text })}
                    placeholder="City, County"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Price Per Night (KES) *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newListing.price_per_night}
                    onChangeText={(text) => setNewListing({ ...newListing, price_per_night: text })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Bedrooms</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={String(newListing.bedrooms)}
                      onChangeText={(text) => setNewListing({ ...newListing, bedrooms: parseInt(text) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Bathrooms</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={String(newListing.bathrooms)}
                      onChangeText={(text) => setNewListing({ ...newListing, bathrooms: parseInt(text) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Description</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                      minHeight: 60,
                      textAlignVertical: 'top',
                    }}
                    value={newListing.description}
                    onChangeText={(text) => setNewListing({ ...newListing, description: text })}
                    placeholder="Property description"
                    multiline
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Total Rooms</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={String(newListing.total_rooms)}
                      onChangeText={(text) => setNewListing({ ...newListing, total_rooms: parseInt(text) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Min Stay (Nights)</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={String(newListing.min_stay)}
                      onChangeText={(text) => setNewListing({ ...newListing, min_stay: parseInt(text) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Max Advance (Days)</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={String(newListing.max_advance_days)}
                      onChangeText={(text) => setNewListing({ ...newListing, max_advance_days: parseInt(text) || 90 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Max Guests/Room</Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#E8EEF4',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 15,
                      }}
                      value={String(newListing.max_guests_per_room)}
                      onChangeText={(text) => setNewListing({ ...newListing, max_guests_per_room: parseInt(text) || 2 })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {error ? (
                  <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#F4F5F1', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setShowAddListing(false)}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#0B342B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={handleAddListing}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add Listing</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Menu Item Modal */}
        <Modal visible={showAddMenuItem} transparent animationType="fade">
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
                <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: '700' }}>Add Menu Item</Text>
                <TouchableOpacity onPress={() => setShowAddMenuItem(false)}>
                  <Text style={{ color: '#6B7280', fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Name *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newMenuItem.name}
                    onChangeText={(text) => setNewMenuItem({ ...newMenuItem, name: text })}
                    placeholder="Dish name"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Category *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newMenuItem.category}
                    onChangeText={(text) => setNewMenuItem({ ...newMenuItem, category: text })}
                    placeholder="e.g., Appetizer, Main, Dessert"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Price (KES) *</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                    }}
                    value={newMenuItem.price}
                    onChangeText={(text) => setNewMenuItem({ ...newMenuItem, price: text })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginBottom: 4 }}>Description</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E8EEF4',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 15,
                      minHeight: 60,
                      textAlignVertical: 'top',
                    }}
                    value={newMenuItem.description}
                    onChangeText={(text) => setNewMenuItem({ ...newMenuItem, description: text })}
                    placeholder="Description"
                    multiline
                  />
                </View>

                {error ? (
                  <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#F4F5F1', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setShowAddMenuItem(false)}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#0B342B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                    onPress={handleAddMenuItem}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Add Item</Text>
                    )}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorDashboard;