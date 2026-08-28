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
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { vendorService } from '../../api/client';
import * as ImagePicker from 'react-native-image-picker';
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

const DashboardIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const StoreIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 9L6 5H18L19 9M5 9H19M5 9L3 11V13H21V11L19 9M5 9V13M19 9V13M5 13H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V13Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M9 13V20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M15 13V20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const BoxIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 7L12 12L4 7M12 12L12 21M12 12L12 21M12 12L20 7M4 7L12 2L20 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const OrderIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M2 3H4L8 15H20L22 7H6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MoneyIcon = ({ color = '#3FAF73', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 8V16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#DC2626', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 7V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#FFFFFF', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronUpIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PlusIcon = ({ color = '#FFFFFF', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 8V16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const EditIcon = ({ color = '#FFFFFF', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20H21M16.5 3.5L20.5 7.5M3 17L9 11L13 15L7 21L3 21L3 17Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const RefreshIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 4V10H17M1 20V14H7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M20.49 9C19.09 5.38 15.39 3 11 3C5.97 3 2 7.03 2 12C2 16.97 5.97 21 11 21C14.69 21 17.9 18.89 19.47 15.79" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const UserIcon = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M5.5 20C5.5 16.6863 8.18629 14 11.5 14H12.5C15.8137 14 18.5 16.6863 18.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const LocationIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const ImageIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5"/>
    <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M21 15L16 10L5 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const VendorDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Collapsible sections
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [listingsExpanded, setListingsExpanded] = useState(true);
  const [menuExpanded, setMenuExpanded] = useState(true);

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

  const toggleOrders = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrdersExpanded(!ordersExpanded);
  };

  const toggleProducts = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProductsExpanded(!productsExpanded);
  };

  const toggleListings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setListingsExpanded(!listingsExpanded);
  };

  const toggleMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuExpanded(!menuExpanded);
  };

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

  // ============================================================
  // UPLOAD IMAGE HELPER - Uploads image to server and returns URL
  // ============================================================
  const uploadImageToServer = async (uri: string): Promise<string> => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: uri,
        type: type,
        name: filename,
      } as any);

      const response = await vendorService.uploadImage(formData);
      return response.data.url || response.data.imageUrl || response.data.path;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image to server');
    }
  };

  // ============================================================
  // IMAGE PICKER FUNCTIONS - Uploads images to server
  // ============================================================
  const pickImagesForProduct = async () => {
    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 5 },
      async (response) => {
        if (!response.didCancel && response.assets) {
          setUploadingImage(true);
          setError('');
          try {
            const uploadedUrls = [];
            for (const asset of response.assets) {
              const url = await uploadImageToServer(asset.uri);
              uploadedUrls.push(url);
            }
            setNewProduct({ ...newProduct, images: uploadedUrls });
            setSuccess(`${uploadedUrls.length} image(s) uploaded successfully!`);
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.message || 'Failed to upload images');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    );
  };

  const pickImagesForListing = async () => {
    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 5 },
      async (response) => {
        if (!response.didCancel && response.assets) {
          setUploadingImage(true);
          setError('');
          try {
            const uploadedUrls = [];
            for (const asset of response.assets) {
              const url = await uploadImageToServer(asset.uri);
              uploadedUrls.push(url);
            }
            setNewListing({ ...newListing, images: uploadedUrls });
            setSuccess(`${uploadedUrls.length} image(s) uploaded successfully!`);
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.message || 'Failed to upload images');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    );
  };

  const pickImageForMenuItem = async () => {
    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1 },
      async (response) => {
        if (!response.didCancel && response.assets) {
          setUploadingImage(true);
          setError('');
          try {
            const url = await uploadImageToServer(response.assets[0].uri);
            setNewMenuItem({ ...newMenuItem, image: url });
            setSuccess('Image uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.message || 'Failed to upload image');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    );
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
      setSuccess(`Order updated to ${status}`);
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
          <ActivityIndicator size="large" color="#032A24" />
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
        contentContainerStyle={{
          paddingTop: 16,
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
                  <DashboardIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Dashboard
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  {businessInfo.business_name || 'Vendor Dashboard'}
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Manage your business and orders
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

          {/* ===== BUSINESS INFO ROW ===== */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <View style={{
                backgroundColor: 'rgba(3, 42, 36, 0.06)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
                <StoreIcon color="#6B7280" size={14} />
                <Text style={{ color: '#6B7280', fontSize: 12, textTransform: 'capitalize' }}>
                  {businessInfo.business_type || 'Business'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <LocationIcon color="#6B7280" size={12} />
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{businessInfo.location || 'Location not set'}</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: businessInfo.is_active ? 'rgba(63, 175, 115, 0.06)' : 'rgba(220, 38, 38, 0.06)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: businessInfo.is_active ? 'rgba(63, 175, 115, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                gap: 4,
              }}>
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                }} />
                <Text style={{
                  color: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                  fontSize: 11,
                  fontWeight: '500',
                }}>
                  {businessInfo.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: businessInfo.is_active ? 'rgba(220, 38, 38, 0.06)' : 'rgba(63, 175, 115, 0.06)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: businessInfo.is_active ? 'rgba(220, 38, 38, 0.08)' : 'rgba(63, 175, 115, 0.08)',
                }}
                onPress={toggleBusinessStatus}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: businessInfo.is_active ? '#DC2626' : '#3FAF73',
                  fontSize: 11,
                  fontWeight: '500',
                }}>
                  {businessInfo.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                }}
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <RefreshIcon color="#6B7280" size={14} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== SUCCESS/ERROR TOASTS ===== */}
          {success ? (
            <View style={{
              backgroundColor: 'rgba(63, 175, 115, 0.04)',
              borderWidth: 1,
              borderColor: 'rgba(63, 175, 115, 0.08)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#3FAF73', fontSize: 13, flex: 1 }}>{success}</Text>
              <TouchableOpacity onPress={() => setSuccess('')} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={16} />
              </TouchableOpacity>
            </View>
          ) : null}

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
                onPress={() => setError('')}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ===== STATS GRID ===== */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {[
              { label: getTabLabel(), value: stats.totalProducts || stats.totalListings || stats.totalMenuItems || 0, icon: <BoxIcon color="#032A24" size={16} /> },
              { label: 'Orders', value: stats.totalOrders || 0, icon: <OrderIcon color="#032A24" size={16} /> },
              { label: 'Earnings', value: formatCurrency(earnings.total_earnings), icon: <MoneyIcon color="#3FAF73" size={16} /> },
              { label: 'Rating', value: stats.rating || 0, icon: <StarIcon color="#C9A44B" size={14} /> },
              { label: 'Pending', value: stats.pendingOrders || 0, icon: <ClockIcon color="#DC2626" size={14} /> },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
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
                <View style={{ marginBottom: 2 }}>{item.icon}</View>
                <Text style={{
                  color: '#032A24',
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: -0.2,
                }}>
                  {typeof item.value === 'number' ? item.value : item.value}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 10 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* ===== HALALSTAY STATS ===== */}
          {businessInfo.business_type === 'halalstay' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Total Listings', value: stats.totalListings || 0, icon: <StoreIcon color="#032A24" size={14} /> },
                { label: 'Total Rooms', value: stats.totalRooms || 0, icon: <BoxIcon color="#032A24" size={14} /> },
                { label: 'Available', value: stats.availableRooms || 0, icon: <CheckIcon color="#3FAF73" size={12} /> },
              ].map((item, index) => (
                <View key={index} style={{
                  flex: 1,
                  minWidth: 60,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  <View style={{ marginBottom: 2 }}>{item.icon}</View>
                  <Text style={{ color: '#032A24', fontSize: 16, fontWeight: '700' }}>{item.value}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 10 }}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* ===== TABS ===== */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.04)',
            marginBottom: 16,
          }}>
            {['overview', 'items', 'orders', 'profile'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === tab ? '#032A24' : 'transparent',
                  margin: 2,
                }}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
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

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' ? (
            <View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {[
                  { label: `Add ${getTabLabel().slice(0, -1)}`, action: () => {
                    if (businessInfo.business_type === 'halalstay') setShowAddListing(true);
                    else if (businessInfo.business_type === 'restaurant') setShowAddMenuItem(true);
                    else setShowAddProduct(true);
                  }, icon: <PlusIcon color="#FFFFFF" size={14} />, color: '#032A24' },
                  { label: 'View Orders', action: () => setActiveTab('orders'), icon: <OrderIcon color="#032A24" size={14} />, color: '#FFFFFF' },
                  { label: 'Edit Profile', action: () => setShowEditProfile(true), icon: <EditIcon color="#032A24" size={14} />, color: '#FFFFFF' },
                ].map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      flex: 1,
                      minWidth: 70,
                      backgroundColor: item.color,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: item.color === '#FFFFFF' ? 1 : 0,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      shadowColor: item.color === '#032A24' ? '#032A24' : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: item.color === '#032A24' ? 0.08 : 0,
                      shadowRadius: 12,
                      elevation: item.color === '#032A24' ? 2 : 0,
                    }}
                    onPress={item.action}
                    activeOpacity={0.7}
                  >
                    <View style={{ marginBottom: 2 }}>{item.icon}</View>
                    <Text style={{
                      color: item.color === '#032A24' ? '#FFFFFF' : '#032A24',
                      fontSize: 11,
                      fontWeight: '500',
                      textAlign: 'center',
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ===== COLLAPSIBLE RECENT ORDERS ===== */}
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
                overflow: 'hidden',
              }}>
                <TouchableOpacity
                  onPress={toggleOrders}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 3,
                      height: 16,
                      backgroundColor: '#C9A44B',
                      borderRadius: 2,
                    }} />
                    <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                      Recent Orders
                    </Text>
                    <Text style={{ color: '#8B8A86', fontSize: 12 }}>
                      {orders.length} orders
                    </Text>
                  </View>
                  {ordersExpanded ? (
                    <ChevronUpIcon color="#6B7280" size={18} />
                  ) : (
                    <ChevronDownIcon color="#6B7280" size={18} />
                  )}
                </TouchableOpacity>

                {ordersExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    {orders.length === 0 ? (
                      <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                        No orders yet.
                      </Text>
                    ) : (
                      orders.slice(0, 5).map((order, index) => {
                        const badge = getStatusBadge(order.status);
                        return (
                          <View key={order.id} style={{
                            paddingVertical: 10,
                            borderBottomWidth: index < orders.slice(0, 5).length - 1 ? 1 : 0,
                            borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                          }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View>
                                <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                                  {order.order_type === 'booking' ? '🏨' : '🛒'} {order.id}
                                </Text>
                                <Text style={{ color: '#6B7280', fontSize: 12 }}>{order.customer_name || 'Customer'}</Text>
                              </View>
                              <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>
                                {formatCurrency(order.total_amount)}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                              <View style={{
                                backgroundColor: badge.bg,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}>
                                <Text style={{ color: badge.text, fontSize: 10, fontWeight: '500' }}>
                                  {order.status || 'pending'}
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                                {['pending', 'processing', 'shipped', 'completed', 'cancelled', 'confirmed'].map((status) => (
                                  <TouchableOpacity
                                    key={status}
                                    style={{
                                      backgroundColor: order.status === status ? '#032A24' : '#F3F4F6',
                                      paddingHorizontal: 6,
                                      paddingVertical: 3,
                                      borderRadius: 4,
                                    }}
                                    onPress={() => updateOrderStatus(order.id, status)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={{
                                      color: order.status === status ? '#FFFFFF' : '#6B7280',
                                      fontSize: 9,
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
                )}
              </View>
            </View>
          ) : null}

          {/* ===== ITEMS TAB ===== */}
          {activeTab === 'items' ? (
            <View>
              {businessInfo.business_type === 'halalstay' ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Your Listings</Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#032A24',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onPress={() => setShowAddListing(true)}
                      activeOpacity={0.7}
                    >
                      <PlusIcon color="#FFFFFF" size={12} />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  {listings.length === 0 ? (
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 32,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>No listings yet. Add your first property!</Text>
                    </View>
                  ) : (
                    listings.map((listing) => (
                      <View key={listing.id} style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                        overflow: 'hidden',
                      }}>
                        <Image
                          source={{ uri: listing.images?.[0] || 'https://via.placeholder.com/400x200/032A24/C9A44B?text=Listing' }}
                          style={{ width: '100%', height: 160 }}
                          resizeMode="cover"
                        />
                        <View style={{ padding: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>{listing.title}</Text>
                              <Text style={{ color: '#6B7280', fontSize: 13 }}>{listing.location}</Text>
                            </View>
                            <View style={{
                              backgroundColor: listing.is_active ? 'rgba(63, 175, 115, 0.06)' : 'rgba(220, 38, 38, 0.06)',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: listing.is_active ? 'rgba(63, 175, 115, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                            }}>
                              <Text style={{
                                color: listing.is_active ? '#3FAF73' : '#DC2626',
                                fontSize: 10,
                                fontWeight: '500',
                              }}>
                                {listing.is_active ? 'Active' : 'Inactive'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700' }}>
                              {formatCurrency(listing.price_per_night)}/night
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 13 }}>{listing.bedrooms} beds</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ color: '#6B7280', fontSize: 12 }}>
                              Rooms: {listing.available_rooms}/{listing.total_rooms}
                            </Text>
                            <Text style={{ color: '#6B7280', fontSize: 12 }}>
                              Min stay: {listing.min_stay} night(s)
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{
                              backgroundColor: 'rgba(220, 38, 38, 0.06)',
                              paddingVertical: 6,
                              borderRadius: 6,
                              alignItems: 'center',
                              marginTop: 8,
                              borderWidth: 1,
                              borderColor: 'rgba(220, 38, 38, 0.08)',
                            }}
                            onPress={() => deleteListing(listing.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '500' }}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : businessInfo.business_type === 'restaurant' ? (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Menu Items</Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#032A24',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onPress={() => setShowAddMenuItem(true)}
                      activeOpacity={0.7}
                    >
                      <PlusIcon color="#FFFFFF" size={12} />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  {menuItems.length === 0 ? (
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      padding: 32,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>No menu items yet. Add your first dish!</Text>
                    </View>
                  ) : (
                    menuItems.map((item) => (
                      <View key={item.id} style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.04)',
                      }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                            <Text style={{ color: '#6B7280', fontSize: 13 }}>{item.category}</Text>
                            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{item.description}</Text>
                          </View>
                          <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700' }}>
                            {formatCurrency(item.price)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(3, 42, 36, 0.04)' }}>
                          <Text style={{
                            color: item.is_available ? '#3FAF73' : '#DC2626',
                            fontSize: 12,
                            fontWeight: '500',
                          }}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </Text>
                          <TouchableOpacity onPress={() => deleteMenuItem(item.id)} activeOpacity={0.7}>
                            <Text style={{ color: '#DC2626', fontSize: 12 }}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>
                      {isButchery ? 'Meat Products' : 'Your Products'}
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#032A24',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onPress={() => setShowAddProduct(true)}
                      activeOpacity={0.7}
                    >
                      <PlusIcon color="#FFFFFF" size={12} />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
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
                      borderColor: 'rgba(3, 42, 36, 0.04)',
                    }}>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>
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
                          borderColor: 'rgba(3, 42, 36, 0.04)',
                          overflow: 'hidden',
                        }}>
                          <Image
                            source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400x200/032A24/C9A44B?text=Product' }}
                            style={{ width: '100%', height: 160 }}
                            resizeMode="cover"
                          />
                          <View style={{ padding: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>{product.name}</Text>
                                <Text style={{ color: '#6B7280', fontSize: 13 }}>{product.category}</Text>
                                {isButchery && product.meat_type && (
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    <View style={{
                                      backgroundColor: 'rgba(3, 42, 36, 0.04)',
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 6,
                                      borderWidth: 1,
                                      borderColor: 'rgba(3, 42, 36, 0.04)',
                                    }}>
                                      <Text style={{ color: '#6B7280', fontSize: 10 }}>{product.meat_type}</Text>
                                    </View>
                                    {product.cut_type && product.cut_type !== 'whole' && (
                                      <View style={{
                                        backgroundColor: 'rgba(3, 42, 36, 0.04)',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: 'rgba(3, 42, 36, 0.04)',
                                      }}>
                                        <Text style={{ color: '#6B7280', fontSize: 10 }}>{product.cut_type}</Text>
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                              <View style={{
                                backgroundColor: badge.bg,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: 'rgba(0,0,0,0.04)',
                              }}>
                                <Text style={{ color: badge.text, fontSize: 10, fontWeight: '500' }}>
                                  {product.status || 'Active'}
                                </Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                              <View>
                                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '700' }}>
                                  {isButchery && product.price_per_kg ? formatCurrency(product.price_per_kg) + '/kg' : formatCurrency(product.price)}
                                </Text>
                                {isButchery && product.price && product.price > 0 && product.price !== product.price_per_kg && (
                                  <Text style={{ color: '#6B7280', fontSize: 12, marginLeft: 4 }}>
                                    ({formatCurrency(product.price)})
                                  </Text>
                                )}
                              </View>
                              <Text style={{ color: '#6B7280', fontSize: 13 }}>
                                {isButchery && product.stock_kg ? `${product.stock_kg} kg` : `Stock: ${product.stock || 0}`}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={{
                                backgroundColor: 'rgba(220, 38, 38, 0.06)',
                                paddingVertical: 6,
                                borderRadius: 6,
                                alignItems: 'center',
                                marginTop: 8,
                                borderWidth: 1,
                                borderColor: 'rgba(220, 38, 38, 0.08)',
                              }}
                              onPress={() => deleteProduct(product.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '500' }}>Delete</Text>
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

          {/* ===== ORDERS TAB ===== */}
          {activeTab === 'orders' ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 8,
              elevation: 1,
            }}>
              <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600', marginBottom: 12 }}>
                All Orders
              </Text>
              {orders.length === 0 ? (
                <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>
                  No orders yet.
                </Text>
              ) : (
                orders.map((order, index) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <View key={order.id} style={{
                      paddingVertical: 12,
                      borderBottomWidth: index < orders.length - 1 ? 1 : 0,
                      borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                            {order.order_type === 'booking' ? '🏨' : '🛒'} {order.id}
                          </Text>
                          <Text style={{ color: '#6B7280', fontSize: 12 }}>{order.customer_name || 'Customer'}</Text>
                        </View>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>
                          {formatCurrency(order.total_amount)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <View style={{
                          backgroundColor: badge.bg,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ color: badge.text, fontSize: 10, fontWeight: '500' }}>
                            {order.status || 'pending'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                          {['pending', 'processing', 'shipped', 'completed', 'cancelled', 'confirmed'].map((status) => (
                            <TouchableOpacity
                              key={status}
                              style={{
                                backgroundColor: order.status === status ? '#032A24' : '#F3F4F6',
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                borderRadius: 4,
                              }}
                              onPress={() => updateOrderStatus(order.id, status)}
                              activeOpacity={0.7}
                            >
                              <Text style={{
                                color: order.status === status ? '#FFFFFF' : '#6B7280',
                                fontSize: 9,
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

          {/* ===== PROFILE TAB ===== */}
          {activeTab === 'profile' ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.06)',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 8,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#032A24', fontSize: 15, fontWeight: '600' }}>Business Profile</Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#032A24',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onPress={() => setShowEditProfile(true)}
                  activeOpacity={0.7}
                >
                  <EditIcon color="#FFFFFF" size={12} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Business Name
                </Text>
                <Text style={{ color: '#032A24', fontSize: 14, backgroundColor: '#FAFAF7', padding: 10, borderRadius: 8 }}>
                  {businessInfo.business_name || profile?.business_name || ''}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Business Type
                </Text>
                <Text style={{ color: '#032A24', fontSize: 14, backgroundColor: '#FAFAF7', padding: 10, borderRadius: 8, textTransform: 'capitalize' }}>
                  {businessInfo.business_type || ''}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Location
                </Text>
                <Text style={{ color: '#032A24', fontSize: 14, backgroundColor: '#FAFAF7', padding: 10, borderRadius: 8 }}>
                  {businessInfo.location || ''}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <Text style={{ color: '#032A24', fontSize: 14, backgroundColor: '#FAFAF7', padding: 10, borderRadius: 8, minHeight: 60 }}>
                  {businessInfo.description || ''}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>Phone</Text>
                  <Text style={{ color: '#032A24', fontSize: 14, backgroundColor: '#FAFAF7', padding: 10, borderRadius: 8 }}>
                    {businessInfo.phone || ''}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>Email</Text>
                  <Text style={{ color: '#032A24', fontSize: 14, backgroundColor: '#FAFAF7', padding: 10, borderRadius: 8 }}>
                    {businessInfo.email || ''}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(3, 42, 36, 0.04)' }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: businessInfo.is_active ? 'rgba(63, 175, 115, 0.06)' : 'rgba(220, 38, 38, 0.06)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: businessInfo.is_active ? 'rgba(63, 175, 115, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                  gap: 6,
                }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                  }} />
                  <Text style={{
                    color: businessInfo.is_active ? '#3FAF73' : '#DC2626',
                    fontSize: 12,
                    fontWeight: '500',
                  }}>
                    {businessInfo.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Vendor Dashboard
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== MODALS ===== */}

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="fade">
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
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Business Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={businessInfo.business_name}
                  onChangeText={(text) => setBusinessInfo({ ...businessInfo, business_name: text })}
                  placeholder="Business name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Phone
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={businessInfo.phone}
                  onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
                  placeholder="+254 7XX XXX XXX"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Location *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={businessInfo.location}
                  onChangeText={(text) => setBusinessInfo({ ...businessInfo, location: text })}
                  placeholder="City, County"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  value={businessInfo.description}
                  onChangeText={(text) => setBusinessInfo({ ...businessInfo, description: text })}
                  placeholder="Describe your business"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>Email</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={businessInfo.email}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
                    placeholder="business@email.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>Website</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={businessInfo.website}
                    onChangeText={(text) => setBusinessInfo({ ...businessInfo, website: text })}
                    placeholder="https://example.com"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {error ? (
                <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setShowEditProfile(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#032A24', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={saveProfileUpdate}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== ADD PRODUCT MODAL WITH IMAGE UPLOAD ===== */}
      <Modal visible={showAddProduct} transparent animationType="fade">
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
                {isButchery ? 'Add Meat Product' : 'Add Product'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddProduct(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                  placeholder="Product name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Category *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newProduct.category}
                  onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
                  placeholder="Category"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* ===== IMAGE PICKER FOR PRODUCTS ===== */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Product Images
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    padding: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={pickImagesForProduct}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#032A24" />
                  ) : (
                    <>
                      <ImageIcon color="#6B7280" size={20} />
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>
                        {newProduct.images.length > 0 ? `${newProduct.images.length} images uploaded` : 'Pick & Upload Images'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {newProduct.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {newProduct.images.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                        }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
              </View>

              {isButchery ? (
                <>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Meat Type *
                      </Text>
                      <View style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.06)',
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}>
                        <TextInput
                          style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                          value={newProduct.meat_type}
                          onChangeText={(text) => setNewProduct({ ...newProduct, meat_type: text })}
                          placeholder="beef"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Cut Type
                      </Text>
                      <View style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.06)',
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}>
                        <TextInput
                          style={{ color: '#1F2937', fontSize: 14, padding: 0 }}
                          value={newProduct.cut_type}
                          onChangeText={(text) => setNewProduct({ ...newProduct, cut_type: text })}
                          placeholder="whole"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Price (KES) *
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={newProduct.price}
                        onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Price Per Kg
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={newProduct.price_per_kg}
                        onChangeText={(text) => setNewProduct({ ...newProduct, price_per_kg: text })}
                        placeholder="Optional"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Stock (units)
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={newProduct.stock}
                        onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                        Stock (kg)
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: '#FAFAF7',
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                          borderRadius: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          color: '#1F2937',
                          fontSize: 14,
                        }}
                        value={newProduct.stock_kg}
                        onChangeText={(text) => setNewProduct({ ...newProduct, stock_kg: text })}
                        placeholder="Optional"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Price (KES) *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.06)',
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 14,
                      }}
                      value={newProduct.price}
                      onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                      Stock
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#FAFAF7',
                        borderWidth: 1,
                        borderColor: 'rgba(3, 42, 36, 0.06)',
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        color: '#1F2937',
                        fontSize: 14,
                      }}
                      value={newProduct.stock}
                      onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                  placeholder="Description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Unit
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newProduct.unit}
                  onChangeText={(text) => setNewProduct({ ...newProduct, unit: text })}
                  placeholder="piece"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {error ? (
                <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setShowAddProduct(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#032A24', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={handleAddProduct}
                  disabled={processing || uploadingImage || newProduct.images.length === 0}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                      {isButchery ? 'Add Meat' : 'Add Product'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== ADD LISTING MODAL WITH IMAGE UPLOAD ===== */}
      <Modal visible={showAddListing} transparent animationType="fade">
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
                Add Listing
              </Text>
              <TouchableOpacity onPress={() => setShowAddListing(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Title *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newListing.title}
                  onChangeText={(text) => setNewListing({ ...newListing, title: text })}
                  placeholder="Property title"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Location *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newListing.location}
                  onChangeText={(text) => setNewListing({ ...newListing, location: text })}
                  placeholder="City, County"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* ===== IMAGE PICKER FOR LISTINGS ===== */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Property Images
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    padding: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={pickImagesForListing}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#032A24" />
                  ) : (
                    <>
                      <ImageIcon color="#6B7280" size={20} />
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>
                        {newListing.images.length > 0 ? `${newListing.images.length} images uploaded` : 'Pick & Upload Images'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {newListing.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {newListing.images.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: 'rgba(3, 42, 36, 0.06)',
                        }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Price Per Night (KES) *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newListing.price_per_night}
                  onChangeText={(text) => setNewListing({ ...newListing, price_per_night: text })}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Bedrooms
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(newListing.bedrooms)}
                    onChangeText={(text) => setNewListing({ ...newListing, bedrooms: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Bathrooms
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(newListing.bathrooms)}
                    onChangeText={(text) => setNewListing({ ...newListing, bathrooms: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                  value={newListing.description}
                  onChangeText={(text) => setNewListing({ ...newListing, description: text })}
                  placeholder="Property description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Total Rooms
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(newListing.total_rooms)}
                    onChangeText={(text) => setNewListing({ ...newListing, total_rooms: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Min Stay (Nights)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(newListing.min_stay)}
                    onChangeText={(text) => setNewListing({ ...newListing, min_stay: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Max Advance (Days)
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(newListing.max_advance_days)}
                    onChangeText={(text) => setNewListing({ ...newListing, max_advance_days: parseInt(text) || 90 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                    Max Guests/Room
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAFAF7',
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: '#1F2937',
                      fontSize: 14,
                    }}
                    value={String(newListing.max_guests_per_room)}
                    onChangeText={(text) => setNewListing({ ...newListing, max_guests_per_room: parseInt(text) || 2 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {error ? (
                <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setShowAddListing(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#032A24', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={handleAddListing}
                  disabled={processing || uploadingImage || newListing.images.length === 0}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Add Listing</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== ADD MENU ITEM MODAL WITH IMAGE UPLOAD ===== */}
      <Modal visible={showAddMenuItem} transparent animationType="fade">
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
                Add Menu Item
              </Text>
              <TouchableOpacity onPress={() => setShowAddMenuItem(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <CloseIcon color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Name *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newMenuItem.name}
                  onChangeText={(text) => setNewMenuItem({ ...newMenuItem, name: text })}
                  placeholder="Dish name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Category *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newMenuItem.category}
                  onChangeText={(text) => setNewMenuItem({ ...newMenuItem, category: text })}
                  placeholder="e.g., Appetizer, Main, Dessert"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* ===== IMAGE PICKER FOR MENU ITEMS ===== */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Item Image
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    padding: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={pickImageForMenuItem}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#032A24" />
                  ) : (
                    <>
                      <ImageIcon color="#6B7280" size={20} />
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>
                        {newMenuItem.image ? 'Image uploaded' : 'Pick & Upload Image'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {newMenuItem.image ? (
                  <Image
                    source={{ uri: newMenuItem.image }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(3, 42, 36, 0.06)',
                    }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Price (KES) *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={newMenuItem.price}
                  onChangeText={(text) => setNewMenuItem({ ...newMenuItem, price: text })}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.06)',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#1F2937',
                    fontSize: 14,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                  value={newMenuItem.description}
                  onChangeText={(text) => setNewMenuItem({ ...newMenuItem, description: text })}
                  placeholder="Description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              {error ? (
                <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setShowAddMenuItem(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#032A24', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={handleAddMenuItem}
                  disabled={processing || uploadingImage || !newMenuItem.image}
                  activeOpacity={0.7}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Add Item</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default VendorDashboard;