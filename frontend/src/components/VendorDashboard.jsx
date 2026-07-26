import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VendorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('halalhub_token');
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // State
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
    is_active: true
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
    availableRooms: 0
  });
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [earnings, setEarnings] = useState({
    total_earnings: 0,
    pending_earnings: 0,
    monthly_earnings: 0,
    completed_orders: 0
  });

  // Modal states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showBlockDatesModal, setShowBlockDatesModal] = useState(false);
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  
  // Inventory states
  const [inventoryData, setInventoryData] = useState({
    total_rooms: 1,
    available_rooms: 1,
    min_stay: 1,
    max_advance_days: 90,
    max_guests_per_room: 2
  });
  
  // Block dates states
  const [blockDatesData, setBlockDatesData] = useState({
    dates: [],
    is_blocked: true
  });
  const [blockedDatesList, setBlockedDatesList] = useState([]);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  
  // Cancel booking states
  const [cancelReason, setCancelReason] = useState('');
  
  // New item states
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
    is_active: true
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
    max_guests_per_room: 2
  });
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    is_available: true,
    image: ''
  });

  // Image upload states
  const fileInputRef = useRef(null);
  const [imageUploadType, setImageUploadType] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // ===== FETCH DATA =====
  useEffect(() => {
    if (token) {
      fetchVendorData();
    }
  }, [token]);

  const fetchVendorData = async () => {
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [statsRes, profileRes, productsRes, ordersRes, listingsRes, menuRes, earningsRes] = await Promise.all([
        axios.get(`${API_BASE}/vendor/dashboard-stats`, config),
        axios.get(`${API_BASE}/vendor/profile`, config),
        axios.get(`${API_BASE}/vendor/products`, config),
        axios.get(`${API_BASE}/vendor/orders?limit=10`, config),
        axios.get(`${API_BASE}/vendor/listings`, config),
        axios.get(`${API_BASE}/vendor/menu-items`, config),
        axios.get(`${API_BASE}/vendor/earnings`, config)
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
          is_active: vendorProfile.profile_active !== false
        });
      }
      
    } catch (err) {
      console.error('Error fetching vendor data:', err);
      setError('Failed to load vendor data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // ===== IMAGE UPLOAD =====
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', imageUploadType);

    try {
      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      const response = await axios.post(`${API_BASE}/vendor/upload-image`, formData, config);
      
      const imageUrl = response.data.imageUrl;
      
      handleImageUrlSet(imageUrl);
      
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
      fileInputRef.current.value = '';
    }
  };

  const handleImageUrlSet = (imageUrl) => {
    if (imageUploadType === 'logo') {
      setBusinessInfo({ ...businessInfo, logo_url: imageUrl });
    } else if (imageUploadType === 'cover') {
      setBusinessInfo({ ...businessInfo, cover_image: imageUrl });
    } else if (imageUploadType === 'product') {
      setNewProduct({ ...newProduct, images: [...(newProduct.images || []), imageUrl] });
    } else if (imageUploadType === 'listing') {
      setNewListing({ ...newListing, images: [...(newListing.images || []), imageUrl] });
    } else if (imageUploadType === 'menu') {
      setNewMenuItem({ ...newMenuItem, image: imageUrl });
    }
  };

  const triggerImageUpload = (type) => {
    setImageUploadType(type);
    fileInputRef.current.click();
  };

  const handleImageUrlInput = (type, value) => {
    setImageUploadType(type);
    if (type === 'logo') {
      setBusinessInfo({ ...businessInfo, logo_url: value });
    } else if (type === 'cover') {
      setBusinessInfo({ ...businessInfo, cover_image: value });
    } else if (type === 'product') {
      setNewProduct({ ...newProduct, images: [...(newProduct.images || []), value] });
    } else if (type === 'listing') {
      setNewListing({ ...newListing, images: [...(newListing.images || []), value] });
    } else if (type === 'menu') {
      setNewMenuItem({ ...newMenuItem, image: value });
    }
  };

  const removeImage = (type, index) => {
    if (type === 'product') {
      const newImages = [...newProduct.images];
      newImages.splice(index, 1);
      setNewProduct({ ...newProduct, images: newImages });
    } else if (type === 'listing') {
      const newImages = [...newListing.images];
      newImages.splice(index, 1);
      setNewListing({ ...newListing, images: newImages });
    } else if (type === 'logo') {
      setBusinessInfo({ ...businessInfo, logo_url: '' });
    } else if (type === 'cover') {
      setBusinessInfo({ ...businessInfo, cover_image: '' });
    } else if (type === 'menu') {
      setNewMenuItem({ ...newMenuItem, image: '' });
    }
  };

  // ===== BUSINESS SETUP =====
  const [showEditProfile, setShowEditProfile] = useState(false);

  const saveProfileUpdate = async () => {
    if (!businessInfo.location) {
      setError('Location is required');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/vendor/profile`, businessInfo, config);
      
      setShowEditProfile(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 5000);
      await fetchVendorData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleBusinessStatus = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/vendor/profile/toggle-status`, 
        { is_active: !businessInfo.is_active }, 
        config
      );
      setBusinessInfo({ ...businessInfo, is_active: !businessInfo.is_active });
      setSuccess(`Business ${businessInfo.is_active ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to toggle business status');
    }
  };

  // ===== INVENTORY MANAGEMENT =====
  const openInventoryModal = (listing) => {
    setSelectedListing(listing);
    setInventoryData({
      total_rooms: listing.total_rooms || 1,
      available_rooms: listing.available_rooms || 1,
      min_stay: listing.min_stay || 1,
      max_advance_days: listing.max_advance_days || 90,
      max_guests_per_room: listing.max_guests_per_room || 2
    });
    setShowInventoryModal(true);
  };

  const updateInventory = async () => {
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/vendor/listings/${selectedListing.id}/inventory`, inventoryData, config);
      setShowInventoryModal(false);
      setSuccess('Inventory updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update inventory');
    } finally {
      setProcessing(false);
    }
  };

  // ===== DATE BLOCKING =====
  const openBlockDatesModal = (listing) => {
    setSelectedListing(listing);
    setDateRangeStart('');
    setDateRangeEnd('');
    setBlockedDatesList([]);
    fetchBlockedDates(listing.id);
    setShowBlockDatesModal(true);
  };

  const fetchBlockedDates = async (listingId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/vendor/listings/${listingId}/blocked-dates`, config);
      console.log('Blocked dates response:', response.data);
      if (response.data && response.data.blockedDates) {
        setBlockedDatesList(response.data.blockedDates);
      } else if (response.data && response.data.allDates) {
        const blocked = response.data.allDates.filter(date => !date.is_available);
        setBlockedDatesList(blocked);
      } else {
        setBlockedDatesList([]);
      }
    } catch (err) {
      console.error('Error fetching blocked dates:', err);
      setBlockedDatesList([]);
    }
  };

  const blockDates = async () => {
    if (!dateRangeStart || !dateRangeEnd) {
      setError('Please select start and end dates');
      return;
    }

    const start = new Date(dateRangeStart);
    const end = new Date(dateRangeEnd);
    const dates = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/vendor/listings/${selectedListing.id}/block-dates`, {
        dates: dates,
        is_blocked: true
      }, config);
      console.log('Block dates response:', response.data);
      setDateRangeStart('');
      setDateRangeEnd('');
      setSuccess(`Dates blocked successfully! ${dates.length} date(s) blocked.`);
      setTimeout(() => setSuccess(''), 3000);
      await fetchBlockedDates(selectedListing.id);
      await fetchVendorData();
    } catch (err) {
      console.error('Block dates error:', err);
      setError(err.response?.data?.error || 'Failed to block dates');
    } finally {
      setProcessing(false);
    }
  };

  const unblockDate = async (date) => {
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/vendor/listings/${selectedListing.id}/block-dates`, {
        dates: [date],
        is_blocked: false
      }, config);
      console.log('Unblock date response:', response.data);
      setSuccess('Date unblocked successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchBlockedDates(selectedListing.id);
      await fetchVendorData();
    } catch (err) {
      console.error('Unblock date error:', err);
      setError(err.response?.data?.error || 'Failed to unblock date');
    } finally {
      setProcessing(false);
    }
  };

  // ===== CANCEL BOOKING =====
  const openCancelBookingModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelBookingModal(true);
  };

  const confirmCancelBooking = async () => {
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/vendor/cancel-booking/${selectedBooking.id}`, {
        reason: cancelReason || 'No reason provided'
      }, config);
      setShowCancelBookingModal(false);
      setSuccess('Booking cancelled successfully. Room availability restored.');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setProcessing(false);
    }
  };

  // ===== PRODUCT MANAGEMENT =====
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/vendor/products`, {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0
      }, config);
      
      setShowAddProduct(false);
      resetNewProduct();
      setSuccess('Product added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
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
      is_active: true
    });
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/vendor/products/${productId}`, config);
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // ===== LISTING MANAGEMENT =====
  const handleAddListing = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/vendor/listings`, {
        ...newListing,
        price_per_night: parseFloat(newListing.price_per_night),
        total_rooms: parseInt(newListing.total_rooms) || 1,
        min_stay: parseInt(newListing.min_stay) || 1,
        max_advance_days: parseInt(newListing.max_advance_days) || 90,
        max_guests_per_room: parseInt(newListing.max_guests_per_room) || 2
      }, config);
      
      setShowAddListing(false);
      resetNewListing();
      setSuccess('Listing added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add listing');
    } finally {
      setLoading(false);
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
      max_guests_per_room: 2
    });
  };

  const deleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/vendor/listings/${listingId}`, config);
      setSuccess('Listing deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError('Failed to delete listing');
    } finally {
      setLoading(false);
    }
  };

  // ===== MENU ITEM MANAGEMENT =====
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/vendor/menu-items`, {
        ...newMenuItem,
        price: parseFloat(newMenuItem.price)
      }, config);
      
      setShowAddMenuItem(false);
      resetNewMenuItem();
      setSuccess('Menu item added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  const resetNewMenuItem = () => {
    setNewMenuItem({
      name: '',
      description: '',
      category: '',
      price: '',
      is_available: true,
      image: ''
    });
  };

  const deleteMenuItem = async (menuItemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/vendor/menu-items/${menuItemId}`, config);
      setSuccess('Menu item deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError('Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  // ===== ORDER MANAGEMENT =====
  const updateOrderStatus = async (orderId, status) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/vendor/orders/${orderId}`, { status }, config);
      setSuccess(`Order ${orderId} updated to ${status}`);
      setTimeout(() => setSuccess(''), 3000);
      await fetchVendorData();
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'processing': 'bg-blue-50 text-blue-700 border-blue-200',
      'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'low stock': 'bg-red-50 text-red-700 border-red-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200',
      'shipped': 'bg-blue-50 text-blue-700 border-blue-200',
      'delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getBusinessTypeIcon = (type) => {
    const icons = {
      'halalmarket': '🛒',
      'halalstay': '🏨',
      'restaurant': '🍽️'
    };
    return icons[type] || '🏪';
  };

  const getTabLabel = () => {
    const type = businessInfo.business_type;
    const labels = {
      'halalmarket': 'Products',
      'halalstay': 'Listings',
      'restaurant': 'Menu Items'
    };
    return labels[type] || 'Items';
  };

  // SVG Icons
  const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const UploadIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const InventoryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const CancelIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile?.profile_id) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-[#E8EEF4] shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-[#1769AA]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#1769AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1A2A3A]">No Business Profile Found</h2>
          <p className="text-sm text-[#94A3B8] mt-2">Please complete your business registration first.</p>
          <button className="mt-6 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition" onClick={() => navigate('/register/vendor')}>
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">
              {businessInfo.business_name || profile?.business_name || 'Vendor Dashboard'}
            </h1>
            <p className="text-sm text-[#94A3B8] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{getBusinessTypeIcon(businessInfo.business_type)}</span>
              <span className="capitalize">{businessInfo.business_type || 'Business'}</span>
              <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
              <span>{businessInfo.location || 'Manage your business'}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${businessInfo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${businessInfo.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {businessInfo.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${businessInfo.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              onClick={toggleBusinessStatus}
            >
              {businessInfo.is_active ? 'Deactivate Business' : 'Activate Business'}
            </button>
            <button 
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition"
              onClick={fetchVendorData}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center text-sm text-red-600">
            <span>{error}</span>
            <button onClick={() => { setError(''); fetchVendorData(); }} className="text-red-400 hover:text-red-600"><CloseIcon /></button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">📦</div>
            <div className="text-xl font-heading font-bold text-[#1A2A3A]">{stats.totalProducts || stats.totalListings || stats.totalMenuItems || 0}</div>
            <div className="text-xs text-[#94A3B8]">{getTabLabel()}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">🛒</div>
            <div className="text-xl font-heading font-bold text-[#1A2A3A]">{stats.totalOrders || 0}</div>
            <div className="text-xs text-[#94A3B8]">Orders</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xl font-heading font-bold text-emerald-600">{formatCurrency(earnings.total_earnings)}</div>
            <div className="text-xs text-[#94A3B8]">Earnings</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xl font-heading font-bold text-amber-600">{stats.rating || 0}</div>
            <div className="text-xs text-[#94A3B8]">Rating</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-xl font-heading font-bold text-red-600">{stats.pendingOrders || 0}</div>
            <div className="text-xs text-[#94A3B8]">Pending Orders</div>
          </div>
        </div>

        {businessInfo.business_type === 'halalstay' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-1">🏠</div>
              <div className="text-xl font-heading font-bold text-[#1A2A3A]">{stats.totalListings}</div>
              <div className="text-xs text-[#94A3B8]">Total Listings</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-1">🛏️</div>
              <div className="text-xl font-heading font-bold text-[#1769AA]">{stats.totalRooms}</div>
              <div className="text-xs text-[#94A3B8]">Total Rooms</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-xl font-heading font-bold text-emerald-600">{stats.availableRooms}</div>
              <div className="text-xs text-[#94A3B8]">Available Rooms</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'items' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            {getTabLabel()}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'orders' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Profile
          </button>
          {businessInfo.business_type === 'halalstay' && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'inventory' 
                  ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                  : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
              }`}
            >
              Inventory
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition cursor-pointer"
                onClick={() => setActiveTab('items')}
              >
                <div className="text-2xl mb-1">➕</div>
                <div className="text-sm font-semibold text-[#1A2A3A]">Add {getTabLabel().slice(0, -1)}</div>
              </button>
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition cursor-pointer"
                onClick={() => setActiveTab('orders')}
              >
                <div className="text-2xl mb-1">📋</div>
                <div className="text-sm font-semibold text-[#1A2A3A]">View Orders</div>
              </button>
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition cursor-pointer"
                onClick={() => setActiveTab('profile')}
              >
                <div className="text-2xl mb-1">✏️</div>
                <div className="text-sm font-semibold text-[#1A2A3A]">Edit Profile</div>
              </button>
              {businessInfo.business_type === 'halalstay' && (
                <button 
                  className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#1769AA] transition cursor-pointer"
                  onClick={() => setActiveTab('inventory')}
                >
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-semibold text-[#1A2A3A]">Manage Inventory</div>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A] mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-6 text-[#94A3B8]">No orders yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F1F7FC]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const badge = getStatusBadge(order.status);
                        const isBooking = order.order_type === 'booking';
                        const itemDisplay = isBooking 
  ? order.items || 'Stay' 
  : order.items && typeof order.items === 'object' && !Array.isArray(order.items)
    ? order.items.name || JSON.stringify(order.items)
    : Array.isArray(order.items) 
      ? order.items.map(item => item.name).join(', ')
      : order.items || 'No items';
                        return (
                          <tr key={order.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition">
                            <td className="px-4 py-3 font-semibold text-[#1A2A3A]">
                              {isBooking ? '🏨' : '🛒'} {order.id}
                            </td>
                            <td className="px-4 py-3 text-[#1A2A3A]">{order.customer_name || 'Customer'}</td>
                            <td className="px-4 py-3 text-[#94A3B8] hidden md:table-cell">
                              {itemDisplay}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(order.total_amount)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge}`}>
                                {order.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <select 
                                className="px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                                value={order.status || 'pending'}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="confirmed">Confirmed</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            {businessInfo.business_type === 'halalstay' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Your Listings</h3>
                  <button className="px-4 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition flex items-center gap-2" onClick={() => setShowAddListing(true)}>
                    <PlusIcon /> Add Listing
                  </button>
                </div>
                {listings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#E8EEF4]">
                    <p className="text-[#94A3B8]">No listings yet. Add your first property!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-md transition">
                        <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${listing.images?.[0] || 'https://via.placeholder.com/400x200/1769AA/fff?text=Listing'})` }}>
                          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold ${listing.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {listing.available_rooms === 0 && (
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                              Fully Booked
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-[#1A2A3A]">{listing.title}</h4>
                          <p className="text-xs text-[#94A3B8] mt-0.5">{listing.location}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-[#1769AA]">{formatCurrency(listing.price_per_night)}/night</span>
                            <span className="text-xs text-[#94A3B8]">{listing.bedrooms} beds</span>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-[#94A3B8]">
                            <span>Rooms: {listing.available_rooms}/{listing.total_rooms}</span>
                            <span>Min stay: {listing.min_stay} night(s)</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-[#94A3B8]">
                            <span>Max guests per room: {listing.max_guests_per_room || 2}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <button className="py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-600 hover:text-white transition flex items-center justify-center gap-1" onClick={() => openInventoryModal(listing)}>
                              <InventoryIcon /> Rooms
                            </button>
                            <button className="py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-semibold hover:bg-amber-600 hover:text-white transition flex items-center justify-center gap-1" onClick={() => openBlockDatesModal(listing)}>
                              <CalendarIcon /> Block Dates
                            </button>
                          </div>
                          <button className="mt-2 w-full py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white transition flex items-center justify-center" onClick={() => deleteListing(listing.id)}>
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : businessInfo.business_type === 'restaurant' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Menu Items</h3>
                  <button className="px-4 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition flex items-center gap-2" onClick={() => setShowAddMenuItem(true)}>
                    <PlusIcon /> Add Menu Item
                  </button>
                </div>
                {menuItems.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#E8EEF4]">
                    <p className="text-[#94A3B8]">No menu items yet. Add your first dish!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm hover:shadow-md transition">
                        <div className="h-32 bg-cover bg-center rounded-xl mb-3" style={{ backgroundImage: `url(${item.image || 'https://via.placeholder.com/400x200/1769AA/fff?text=Menu+Item'})` }} />
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-[#1A2A3A]">{item.name}</h4>
                            <p className="text-xs text-[#94A3B8]">{item.category}</p>
                            <p className="text-sm text-[#94A3B8] mt-1 line-clamp-2">{item.description}</p>
                          </div>
                          <span className="font-bold text-[#1769AA]">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F7FC]">
                          <span className={`text-xs font-medium ${item.is_available ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                          <button className="text-red-500 hover:text-red-700 transition" onClick={() => deleteMenuItem(item.id)}>
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Your Products</h3>
                  <button className="px-4 py-2.5 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition flex items-center gap-2" onClick={() => setShowAddProduct(true)}>
                    <PlusIcon /> Add Product
                  </button>
                </div>
                {products.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#E8EEF4]">
                    <p className="text-[#94A3B8]">No products yet. Add your first product!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => {
                      const badge = getStatusBadge(product.status || 'active');
                      return (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-md transition">
                          <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${product.images?.[0] || 'https://via.placeholder.com/400x200/1769AA/fff?text=Product'})` }}>
                            <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge}`}>
                              {product.status || 'Active'}
                            </span>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-[#1A2A3A]">{product.name}</h4>
                            <p className="text-xs text-[#94A3B8] mt-0.5">{product.category}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-[#1769AA]">{formatCurrency(product.price)}</span>
                              <span className="text-xs text-[#94A3B8]">Stock: {product.stock || 0}</span>
                            </div>
                            <button className="mt-2 w-full py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white transition flex items-center justify-center" onClick={() => deleteProduct(product.id)}>
                              <DeleteIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A] mb-4">All Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F1F7FC]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      const isBooking = order.order_type === 'booking';
                      const itemDisplay = isBooking ? order.items || 'Stay' : order.items || `${order.items?.length || 0} items`;
                      return (
                        <tr key={order.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition">
                          <td className="px-4 py-3 font-semibold text-[#1A2A3A]">
                            {isBooking ? '🏨' : '🛒'} {order.id}
                          </td>
                          <td className="px-4 py-3 text-[#1A2A3A]">{order.customer_name || 'Customer'}</td>
                          <td className="px-4 py-3 text-[#94A3B8] hidden md:table-cell">
  {isBooking ? (
    <div>
      <div>{order.items || 'Stay'}</div>
      <div className="text-xs">{formatDate(order.check_in)} → {formatDate(order.check_out)}</div>
      <div className="text-xs">{order.guests} guests</div>
    </div>
  ) : (
    <div>
      {order.items && typeof order.items === 'object' && !Array.isArray(order.items) 
        ? order.items.name || JSON.stringify(order.items)
        : Array.isArray(order.items) 
          ? order.items.map(item => item.name).join(', ')
          : order.items || 'No items'}
    </div>
  )}
</td>
                          <td className="px-4 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(order.total_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge}`}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <select 
                                className="px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                                value={order.status || 'pending'}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="confirmed">Confirmed</option>
                              </select>
                              {isBooking && order.status !== 'cancelled' && order.status !== 'completed' && (
                                <button
                                  className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white transition"
                                  onClick={() => openCancelBookingModal(order)}
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Business Profile</h3>
              <button className="px-4 py-2 rounded-xl bg-[#1769AA] text-white text-sm font-semibold hover:bg-[#2F80C0] transition flex items-center gap-2" onClick={() => setShowEditProfile(true)}>
                <EditIcon /> Edit Profile
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Business Name</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm" value={businessInfo.business_name || profile?.business_name || ''} disabled />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Business Type</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm capitalize" value={businessInfo.business_type || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Location</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm" value={businessInfo.location || ''} disabled />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">County</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm" value={businessInfo.county || ''} disabled />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Description</label>
              <textarea className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm resize-y" rows="3" value={businessInfo.description || ''} disabled />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Phone</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm" value={businessInfo.phone || ''} disabled />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Email</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-gray-50 text-[#1A2A3A] text-sm" value={businessInfo.email || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Logo</label>
                {businessInfo.logo_url ? (
                  <img src={businessInfo.logo_url} alt="Logo" className="h-20 w-auto object-contain rounded-lg border border-[#E8EEF4]" />
                ) : (
                  <p className="text-sm text-[#94A3B8]">No logo uploaded</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Cover Image</label>
                {businessInfo.cover_image ? (
                  <img src={businessInfo.cover_image} alt="Cover" className="h-20 w-full object-cover rounded-lg border border-[#E8EEF4]" />
                ) : (
                  <p className="text-sm text-[#94A3B8]">No cover image uploaded</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F1F7FC]">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${businessInfo.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full ${businessInfo.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {businessInfo.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && businessInfo.business_type === 'halalstay' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <h3 className="text-lg font-heading font-bold text-[#1A2A3A] mb-4">Room Inventory Management</h3>
            <div className="grid grid-cols-1 gap-4">
              {listings.map((listing) => (
                <div key={listing.id} className="border border-[#E8EEF4] rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[#1A2A3A]">{listing.title}</h4>
                      <p className="text-sm text-[#94A3B8]">{listing.location}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span>Total Rooms: <strong className="text-[#1A2A3A]">{listing.total_rooms}</strong></span>
                        <span>Available: <strong className="text-emerald-600">{listing.available_rooms}</strong></span>
                        <span>Booked: <strong className="text-amber-600">{listing.total_rooms - listing.available_rooms}</strong></span>
                        <span>Min Stay: <strong className="text-[#1A2A3A]">{listing.min_stay} night(s)</strong></span>
                        <span>Max Guests/Room: <strong className="text-[#1A2A3A]">{listing.max_guests_per_room || 2}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-[#1769AA] text-white text-xs font-semibold hover:bg-[#2F80C0] transition flex items-center gap-1" onClick={() => openInventoryModal(listing)}>
                        <InventoryIcon /> Manage Rooms
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-semibold hover:bg-amber-600 hover:text-white transition flex items-center gap-1" onClick={() => openBlockDatesModal(listing)}>
                        <CalendarIcon /> Block Dates
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {listings.length === 0 && (
                <div className="text-center py-8 text-[#94A3B8]">No listings found. Create a listing first.</div>
              )}
            </div>
          </div>
        )}

        {/* ===== INVENTORY MODAL ===== */}
        {showInventoryModal && selectedListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowInventoryModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Manage Inventory</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowInventoryModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Total Rooms</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={inventoryData.total_rooms}
                    onChange={(e) => setInventoryData({...inventoryData, total_rooms: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Available Rooms</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={inventoryData.available_rooms}
                    onChange={(e) => setInventoryData({...inventoryData, available_rooms: parseInt(e.target.value) || 0})}
                    min="0"
                    max={inventoryData.total_rooms}
                  />
                  <p className="text-xs text-[#94A3B8] mt-1">Cannot exceed total rooms</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Minimum Stay (Nights)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={inventoryData.min_stay}
                    onChange={(e) => setInventoryData({...inventoryData, min_stay: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Max Advance Booking (Days)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={inventoryData.max_advance_days}
                    onChange={(e) => setInventoryData({...inventoryData, max_advance_days: parseInt(e.target.value) || 30})}
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Max Guests Per Room</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={inventoryData.max_guests_per_room}
                    onChange={(e) => setInventoryData({...inventoryData, max_guests_per_room: parseInt(e.target.value) || 2})}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-[#94A3B8] mt-1">Maximum number of people allowed per room</p>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowInventoryModal(false)}>Cancel</button>
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-60" onClick={updateInventory} disabled={processing}>
                    {processing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== BLOCK DATES MODAL ===== */}
        {showBlockDatesModal && selectedListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBlockDatesModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Block Dates</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowBlockDatesModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                  Block dates when rooms are unavailable (maintenance, holidays, etc.)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      min={dateRangeStart}
                    />
                  </div>
                </div>
                <button 
                  className="w-full px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60"
                  onClick={blockDates}
                  disabled={processing || !dateRangeStart || !dateRangeEnd}
                >
                  {processing ? 'Blocking...' : 'Block Dates'}
                </button>

                <div className="mt-4 pt-4 border-t border-[#E8EEF4]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A] mb-2">Blocked Dates</h4>
                  {blockedDatesList.length === 0 ? (
                    <p className="text-sm text-[#94A3B8]">No blocked dates</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {blockedDatesList.map((item) => (
                        <span key={item.date} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-200">
                          {formatDate(item.date)}
                          <button className="text-red-400 hover:text-red-600 transition" onClick={() => unblockDate(item.date)}>
                            <CancelIcon />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              </div>
            </div>
          </div>
        )}

        {/* ===== CANCEL BOOKING MODAL ===== */}
        {showCancelBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCancelBookingModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Cancel Booking</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowCancelBookingModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  This will cancel the booking and restore room availability.
                </div>
                <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Customer</span><span className="font-semibold text-[#1A2A3A]">{selectedBooking.customer_name}</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Property</span><span className="font-semibold text-[#1A2A3A]">{selectedBooking.listing_title}</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Amount</span><span className="font-semibold text-[#1A2A3A]">{formatCurrency(selectedBooking.total_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Status</span><span className="font-semibold text-amber-600">{selectedBooking.status}</span></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Reason for Cancellation</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 resize-y"
                    rows="2"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Optional reason for cancellation"
                  />
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowCancelBookingModal(false)}>Keep Booking</button>
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60" onClick={confirmCancelBooking} disabled={processing}>
                    {processing ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== EDIT PROFILE MODAL ===== */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditProfile(false)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Edit Business Profile</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowEditProfile(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveProfileUpdate(); }} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Business Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={businessInfo.business_name}
                      onChange={(e) => setBusinessInfo({...businessInfo, business_name: e.target.value})}
                      placeholder="Business name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Location *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={businessInfo.location}
                      onChange={(e) => setBusinessInfo({...businessInfo, location: e.target.value})}
                      placeholder="City, County"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">County</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={businessInfo.county}
                      onChange={(e) => setBusinessInfo({...businessInfo, county: e.target.value})}
                      placeholder="County"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 resize-y"
                    rows="3"
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                    placeholder="Describe your business"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                      placeholder="business@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Website</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Logo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                        value={businessInfo.logo_url}
                        onChange={(e) => setBusinessInfo({...businessInfo, logo_url: e.target.value})}
                        placeholder="Logo URL"
                      />
                      <button type="button" className="px-3 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E2E8F0] transition" onClick={() => { setImageUploadType('logo'); fileInputRef.current.click(); }}>
                        <UploadIcon />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Cover Image</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                        value={businessInfo.cover_image}
                        onChange={(e) => setBusinessInfo({...businessInfo, cover_image: e.target.value})}
                        placeholder="Cover URL"
                      />
                      <button type="button" className="px-3 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E2E8F0] transition" onClick={() => { setImageUploadType('cover'); fileInputRef.current.click(); }}>
                        <UploadIcon />
                      </button>
                    </div>
                  </div>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowEditProfile(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-60" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== ADD PRODUCT MODAL ===== */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddProduct(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Add Product</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddProduct(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Name *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Category *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Price (KES) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Stock</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 resize-y" rows="2" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Images</label>
                  <div className="flex flex-wrap gap-2">
                    {newProduct.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={img} alt={`Product ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity" onClick={() => removeImage('product', i)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center cursor-pointer hover:border-[#1769AA] hover:text-[#1769AA] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('product'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[10px] text-[#94A3B8] group-hover:text-[#1769AA]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      placeholder="Or paste image URL"
                      onBlur={(e) => {
                        if (e.target.value) {
                          handleImageUrlInput('product', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30" checked={newProduct.is_halal} onChange={(e) => setNewProduct({...newProduct, is_halal: e.target.checked})} />
                  <label className="text-sm text-[#5A6A7A]">Halal Certified</label>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowAddProduct(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-60" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== ADD LISTING MODAL ===== */}
        {showAddListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddListing(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Add Listing</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddListing(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddListing} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Title *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newListing.title} onChange={(e) => setNewListing({...newListing, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Location *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newListing.location} onChange={(e) => setNewListing({...newListing, location: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Price Per Night (KES) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newListing.price_per_night} onChange={(e) => setNewListing({...newListing, price_per_night: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Bedrooms</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newListing.bedrooms} onChange={(e) => setNewListing({...newListing, bedrooms: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Bathrooms</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newListing.bathrooms} onChange={(e) => setNewListing({...newListing, bathrooms: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 resize-y" rows="2" value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Total Rooms</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newListing.total_rooms} onChange={(e) => setNewListing({...newListing, total_rooms: e.target.value})} min="1" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Min Stay (Nights)</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newListing.min_stay} onChange={(e) => setNewListing({...newListing, min_stay: e.target.value})} min="1" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Max Advance (Days)</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newListing.max_advance_days} onChange={(e) => setNewListing({...newListing, max_advance_days: e.target.value})} min="1" max="365" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Max Guests/Room</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm" value={newListing.max_guests_per_room} onChange={(e) => setNewListing({...newListing, max_guests_per_room: e.target.value})} min="1" max="10" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Images</label>
                  <div className="flex flex-wrap gap-2">
                    {newListing.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={img} alt={`Listing ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity" onClick={() => removeImage('listing', i)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center cursor-pointer hover:border-[#1769AA] hover:text-[#1769AA] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('listing'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[10px] text-[#94A3B8] group-hover:text-[#1769AA]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      placeholder="Or paste image URL"
                      onBlur={(e) => {
                        if (e.target.value) {
                          handleImageUrlInput('listing', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowAddListing(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-60" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== ADD MENU ITEM MODAL ===== */}
        {showAddMenuItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddMenuItem(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Add Menu Item</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddMenuItem(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddMenuItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Name *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newMenuItem.name} onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Category *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newMenuItem.category} onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Price (KES) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30" value={newMenuItem.price} onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Image</label>
                  <div className="flex flex-wrap gap-2">
                    {newMenuItem.image && (
                      <div className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={newMenuItem.image} alt="Menu Item" className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity" onClick={() => removeImage('menu', 0)}>
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center cursor-pointer hover:border-[#1769AA] hover:text-[#1769AA] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('menu'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[10px] text-[#94A3B8] group-hover:text-[#1769AA]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      placeholder="Or paste image URL"
                      onBlur={(e) => {
                        if (e.target.value) {
                          handleImageUrlInput('menu', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 resize-y" rows="2" value={newMenuItem.description} onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30" checked={newMenuItem.is_available} onChange={(e) => setNewMenuItem({...newMenuItem, is_available: e.target.checked})} />
                  <label className="text-sm text-[#5A6A7A]">Available</label>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowAddMenuItem(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm shadow-md shadow-[#1769AA]/20 hover:bg-[#2F80C0] transition disabled:opacity-60" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Menu Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

export default VendorDashboard;