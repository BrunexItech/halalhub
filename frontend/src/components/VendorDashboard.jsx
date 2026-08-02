import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorService } from '../services/api';

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

  // ===== HAJJ STATE =====
  const [hajjPackages, setHajjPackages] = useState([]);
  const [hajjBookings, setHajjBookings] = useState([]);
  const [hajjStats, setHajjStats] = useState({
    totalPackages: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    totalRevenue: 0
  });
  const [loadingHajj, setLoadingHajj] = useState(false);
  const [hajjBookingFilter, setHajjBookingFilter] = useState('all');
  
  // Hajj Modal states
  const [showAddHajjPackage, setShowAddHajjPackage] = useState(false);
  const [editingHajjPackage, setEditingHajjPackage] = useState(null);
  const [showHajjBookingModal, setShowHajjBookingModal] = useState(false);
  const [selectedHajjBooking, setSelectedHajjBooking] = useState(null);
  
  const [newHajjPackage, setNewHajjPackage] = useState({
    name: '',
    type: 'hajj',
    description: '',
    duration_days: 14,
    price: '',
    includes: '',
    excludes: '',
    images: [],
    available_slots: 50,
    is_active: true,
    is_featured: false
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
    is_active: true,
    meat_type: 'beef',
    cut_type: 'whole',
    price_per_kg: '',
    stock_kg: ''
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

  // Meat types for butchery
  const meatTypes = [
    { id: 'beef', label: 'Beef' },
    { id: 'goat', label: 'Goat' },
    { id: 'chicken', label: 'Chicken' },
    { id: 'lamb', label: 'Lamb' },
    { id: 'camel', label: 'Camel' },
    { id: 'fish', label: 'Fish' },
    { id: 'mixed', label: 'Mixed' },
    { id: 'other', label: 'Other' }
  ];

  // Cut types for butchery
  const cutTypes = [
    { id: 'whole', label: 'Whole' },
    { id: 'half', label: 'Half' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'minced', label: 'Minced' },
    { id: 'steaks', label: 'Steaks' },
    { id: 'cubes', label: 'Cubes' },
    { id: 'slices', label: 'Slices' },
    { id: 'other', label: 'Other' }
  ];

  // ===== FETCH DATA =====
  useEffect(() => {
    if (token) {
      fetchVendorData();
      fetchHajjData();
    }
  }, [token]);

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
        vendorService.getEarnings()
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

  // ===== HAJJ DATA FETCH =====
  const fetchHajjData = async () => {
    setLoadingHajj(true);
    setError('');
    try {
      const [packagesRes, bookingsRes, statsRes] = await Promise.all([
        vendorService.getHajjPackages(),
        vendorService.getHajjBookings({ limit: 100 }),
        vendorService.getHajjStats()
      ]);
      
      if (packagesRes.data.success) {
        setHajjPackages(packagesRes.data.packages || []);
      }
      if (bookingsRes.data.success) {
        setHajjBookings(bookingsRes.data.bookings || []);
      }
      if (statsRes.data.success) {
        setHajjStats(statsRes.data.stats || {});
      }
    } catch (err) {
      console.error('Error fetching Hajj data:', err);
      setError('Failed to load Hajj data. Please refresh.');
    } finally {
      setLoadingHajj(false);
    }
  };

  // ===== HAJJ PACKAGE MANAGEMENT =====
  const handleAddHajjPackage = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    try {
      const data = {
        name: newHajjPackage.name,
        type: newHajjPackage.type,
        description: newHajjPackage.description,
        duration_days: parseInt(newHajjPackage.duration_days),
        price: parseInt(newHajjPackage.price),
        includes: newHajjPackage.includes.split(',').map(item => item.trim()).filter(Boolean),
        excludes: newHajjPackage.excludes.split(',').map(item => item.trim()).filter(Boolean),
        images: newHajjPackage.images || [],
        available_slots: parseInt(newHajjPackage.available_slots),
        is_active: newHajjPackage.is_active,
        is_featured: newHajjPackage.is_featured
      };

      if (editingHajjPackage) {
        await vendorService.updateHajjPackage(editingHajjPackage.id, data);
        setSuccess('Package updated successfully!');
      } else {
        await vendorService.createHajjPackage(data);
        setSuccess('Package created successfully!');
      }
      
      setShowAddHajjPackage(false);
      resetHajjPackageForm();
      await fetchHajjData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save package');
    } finally {
      setProcessing(false);
    }
  };

  const resetHajjPackageForm = () => {
    setNewHajjPackage({
      name: '',
      type: 'hajj',
      description: '',
      duration_days: 14,
      price: '',
      includes: '',
      excludes: '',
      images: [],
      available_slots: 50,
      is_active: true,
      is_featured: false
    });
    setEditingHajjPackage(null);
  };

  const deleteHajjPackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    setProcessing(true);
    try {
      await vendorService.deleteHajjPackage(packageId);
      setSuccess('Package deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchHajjData();
    } catch (err) {
      setError('Failed to delete package');
    } finally {
      setProcessing(false);
    }
  };

  const editHajjPackage = (pkg) => {
    setEditingHajjPackage(pkg);
    setNewHajjPackage({
      name: pkg.name || '',
      type: pkg.type || 'hajj',
      description: pkg.description || '',
      duration_days: pkg.duration_days || 14,
      price: pkg.price || '',
      includes: (pkg.includes || []).join(', '),
      excludes: (pkg.excludes || []).join(', '),
      images: pkg.images || [],
      available_slots: pkg.available_slots || 50,
      is_active: pkg.is_active !== false,
      is_featured: pkg.is_featured || false
    });
    setShowAddHajjPackage(true);
  };

  const viewHajjBooking = (booking) => {
    setSelectedHajjBooking(booking);
    setShowHajjBookingModal(true);
  };

  const updateHajjBookingStatus = async (bookingId, status) => {
    setProcessing(true);
    try {
      await vendorService.updateHajjBookingStatus?.(bookingId, { status });
      setSuccess(`Booking ${status} successfully`);
      setTimeout(() => setSuccess(''), 3000);
      await fetchHajjData();
      setShowHajjBookingModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update booking status');
    } finally {
      setProcessing(false);
    }
  };

  const filteredHajjBookings = hajjBookings.filter(b => {
    if (hajjBookingFilter === 'all') return true;
    return b.status === hajjBookingFilter;
  });

  // ===== IMAGE UPLOAD =====
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', imageUploadType);

    try {
      const response = await vendorService.uploadImage(formData);
      
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
    } else if (imageUploadType === 'hajj') {
      setNewHajjPackage({ ...newHajjPackage, images: [...(newHajjPackage.images || []), imageUrl] });
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
    } else if (type === 'hajj') {
      setNewHajjPackage({ ...newHajjPackage, images: [...(newHajjPackage.images || []), value] });
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
    } else if (type === 'hajj') {
      const newImages = [...newHajjPackage.images];
      newImages.splice(index, 1);
      setNewHajjPackage({ ...newHajjPackage, images: newImages });
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
      await vendorService.updateProfile(businessInfo);
      
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
      await vendorService.toggleStatus({ is_active: !businessInfo.is_active });
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
      await vendorService.updateInventory(selectedListing.id, inventoryData);
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
      const response = await vendorService.getBlockedDates(listingId);
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
      await vendorService.blockDates(selectedListing.id, {
        dates: dates,
        is_blocked: true
      });
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
      await vendorService.blockDates(selectedListing.id, {
        dates: [date],
        is_blocked: false
      });
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
      await vendorService.cancelBooking(selectedBooking.id, {
        reason: cancelReason || 'No reason provided'
      });
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
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0
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
      is_active: true,
      meat_type: 'beef',
      cut_type: 'whole',
      price_per_kg: '',
      stock_kg: ''
    });
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
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
  };

  // ===== LISTING MANAGEMENT =====
  const handleAddListing = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await vendorService.createListing({
        ...newListing,
        price_per_night: parseFloat(newListing.price_per_night),
        total_rooms: parseInt(newListing.total_rooms) || 1,
        min_stay: parseInt(newListing.min_stay) || 1,
        max_advance_days: parseInt(newListing.max_advance_days) || 90,
        max_guests_per_room: parseInt(newListing.max_guests_per_room) || 2
      });
      
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
      await vendorService.deleteListing(listingId);
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
      await vendorService.createMenuItem({
        ...newMenuItem,
        price: parseFloat(newMenuItem.price)
      });
      
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
      await vendorService.deleteMenuItem(menuItemId);
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
      'pending': 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
      'processing': 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]',
      'completed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'active': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'low stock': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
      'cancelled': 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
      'shipped': 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]',
      'delivered': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]',
      'confirmed': 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]'
    };
    return colors[status?.toLowerCase()] || 'bg-[#F4F5F1] text-[#6B7280] border-[#E8EEF4]';
  };

  const getBusinessTypeIcon = (type) => {
    const icons = {
      'halalmarket': '🛒',
      'halalbutchery': '🥩',
      'halalstay': '🏨',
      'restaurant': '🍽️',
      'hajj': '🕋'
    };
    return icons[type] || '🏪';
  };

  const getTabLabel = () => {
    const type = businessInfo.business_type;
    const labels = {
      'halalmarket': 'Products',
      'halalbutchery': 'Products',
      'halalstay': 'Listings',
      'restaurant': 'Menu Items'
    };
    return labels[type] || 'Items';
  };

  const isButchery = businessInfo.business_type === 'halalbutchery';

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

  const HajjIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile?.profile_id) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-[#E8EEF4] shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-[#1F2937]">No Business Profile Found</h2>
          <p className="text-[15px] text-[#6B7280] mt-2">Please complete your business registration first.</p>
          <button className="mt-6 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition" onClick={() => navigate('/register/vendor')}>
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-semibold text-[#1F2937]">
              {businessInfo.business_name || profile?.business_name || 'Vendor Dashboard'}
            </h1>
            <p className="text-[15px] text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{getBusinessTypeIcon(businessInfo.business_type)}</span>
              <span className="capitalize">{businessInfo.business_type || 'Business'}</span>
              <span className="w-1 h-1 rounded-full bg-[#E8EEF4]" />
              <span>{businessInfo.location || 'Manage your business'}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[13px] font-medium ${businessInfo.is_active ? 'bg-[#D1FAE5] text-[#3FAF73]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${businessInfo.is_active ? 'bg-[#3FAF73]' : 'bg-[#DC2626]'}`} />
                {businessInfo.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition ${businessInfo.is_active ? 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FCA5A5]' : 'bg-[#D1FAE5] text-[#3FAF73] hover:bg-[#A7F3D0]'}`}
              onClick={toggleBusinessStatus}
            >
              {businessInfo.is_active ? 'Deactivate Business' : 'Activate Business'}
            </button>
            <button 
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#6B7280] hover:bg-[#FAFAF7] transition"
              onClick={() => { fetchVendorData(); fetchHajjData(); }}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex justify-between items-center text-[15px] text-[#DC2626] shadow-sm">
            <span>{error}</span>
            <button onClick={() => { setError(''); fetchVendorData(); }} className="text-[#DC2626]/60 hover:text-[#DC2626]"><CloseIcon /></button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-[24px] mb-1">📦</div>
            <div className="text-[20px] font-bold text-[#1F2937]">{stats.totalProducts || stats.totalListings || stats.totalMenuItems || 0}</div>
            <div className="text-[13px] text-[#6B7280]">{getTabLabel()}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-[24px] mb-1">🛒</div>
            <div className="text-[20px] font-bold text-[#1F2937]">{stats.totalOrders || 0}</div>
            <div className="text-[13px] text-[#6B7280]">Orders</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-[24px] mb-1">💰</div>
            <div className="text-[20px] font-bold text-[#3FAF73]">{formatCurrency(earnings.total_earnings)}</div>
            <div className="text-[13px] text-[#6B7280]">Earnings</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-[24px] mb-1">⭐</div>
            <div className="text-[20px] font-bold text-[#C9A44B]">{stats.rating || 0}</div>
            <div className="text-[13px] text-[#6B7280]">Rating</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-[24px] mb-1">⏳</div>
            <div className="text-[20px] font-bold text-[#DC2626]">{stats.pendingOrders || 0}</div>
            <div className="text-[13px] text-[#6B7280]">Pending Orders</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="text-[24px] mb-1">🕋</div>
            <div className="text-[20px] font-bold text-[#0B342B]">{hajjStats.totalPackages || 0}</div>
            <div className="text-[13px] text-[#6B7280]">Hajj Packages</div>
          </div>
        </div>

        {businessInfo.business_type === 'halalstay' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
              <div className="text-[24px] mb-1">🏠</div>
              <div className="text-[20px] font-bold text-[#1F2937]">{stats.totalListings}</div>
              <div className="text-[13px] text-[#6B7280]">Total Listings</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
              <div className="text-[24px] mb-1">🛏️</div>
              <div className="text-[20px] font-bold text-[#0B342B]">{stats.totalRooms}</div>
              <div className="text-[13px] text-[#6B7280]">Total Rooms</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
              <div className="text-[24px] mb-1">✅</div>
              <div className="text-[20px] font-bold text-[#3FAF73]">{stats.availableRooms}</div>
              <div className="text-[13px] text-[#6B7280]">Available Rooms</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' 
                : 'text-[#6B7280] hover:bg-[#FAFAF7] hover:text-[#1F2937]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
              activeTab === 'items' 
                ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' 
                : 'text-[#6B7280] hover:bg-[#FAFAF7] hover:text-[#1F2937]'
            }`}
          >
            {getTabLabel()}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
              activeTab === 'orders' 
                ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' 
                : 'text-[#6B7280] hover:bg-[#FAFAF7] hover:text-[#1F2937]'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
              activeTab === 'profile' 
                ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' 
                : 'text-[#6B7280] hover:bg-[#FAFAF7] hover:text-[#1F2937]'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('hajj')}
            className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
              activeTab === 'hajj' 
                ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' 
                : 'text-[#6B7280] hover:bg-[#FAFAF7] hover:text-[#1F2937]'
            }`}
          >
            <span className="flex items-center gap-1.5"><HajjIcon /><span>Hajj Packages</span></span>
            {hajjStats.pendingBookings > 0 && (
              <span className="ml-2 bg-[#DC2626] text-white text-[12px] rounded-full px-2 py-0.5 font-medium">
                {hajjStats.pendingBookings}
              </span>
            )}
          </button>
          {businessInfo.business_type === 'halalstay' && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                activeTab === 'inventory' 
                  ? 'bg-[#0B342B] text-white shadow-md shadow-[#0B342B]/20' 
                  : 'text-[#6B7280] hover:bg-[#FAFAF7] hover:text-[#1F2937]'
              }`}
            >
              Inventory
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#0B342B] transition cursor-pointer"
                onClick={() => setActiveTab('items')}
              >
                <div className="text-[24px] mb-1">➕</div>
                <div className="text-[14px] font-medium text-[#1F2937]">Add {getTabLabel().slice(0, -1)}</div>
              </button>
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#0B342B] transition cursor-pointer"
                onClick={() => setActiveTab('orders')}
              >
                <div className="text-[24px] mb-1">📋</div>
                <div className="text-[14px] font-medium text-[#1F2937]">View Orders</div>
              </button>
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#0B342B] transition cursor-pointer"
                onClick={() => setActiveTab('profile')}
              >
                <div className="text-[24px] mb-1">✏️</div>
                <div className="text-[14px] font-medium text-[#1F2937]">Edit Profile</div>
              </button>
              <button 
                className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#0B342B] transition cursor-pointer"
                onClick={() => setActiveTab('hajj')}
              >
                <div className="text-[24px] mb-1">🕋</div>
                <div className="text-[14px] font-medium text-[#1F2937]">Manage Hajj Packages</div>
              </button>
              {businessInfo.business_type === 'halalstay' && (
                <button 
                  className="bg-white rounded-2xl p-4 text-center border border-[#E8EEF4] shadow-sm hover:shadow-md hover:border-[#0B342B] transition cursor-pointer"
                  onClick={() => setActiveTab('inventory')}
                >
                  <div className="text-[24px] mb-1">📊</div>
                  <div className="text-[14px] font-medium text-[#1F2937]">Manage Inventory</div>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-6 text-[#6B7280]">No orders yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="border-b border-[#F4F5F1]">
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Order</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Items</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Action</th>
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
                          <tr key={order.id} className="border-b border-[#F4F5F1] hover:bg-[#FAFAF7] transition">
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">
                              {isBooking ? '🏨' : '🛒'} {order.id}
                            </td>
                            <td className="px-4 py-3 text-[#1F2937]">{order.customer_name || 'Customer'}</td>
                            <td className="px-4 py-3 text-[#6B7280] hidden md:table-cell">
                              {itemDisplay}
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatCurrency(order.total_amount)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${badge}`}>
                                {order.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <select 
                                className="px-2 py-1 rounded-lg border border-[#E8EEF4] bg-white text-[13px] font-medium text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
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
                  <h3 className="text-[17px] font-semibold text-[#1F2937]">Your Listings</h3>
                  <button className="px-4 py-2.5 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition flex items-center gap-2" onClick={() => setShowAddListing(true)}>
                    <PlusIcon /> Add Listing
                  </button>
                </div>
                {listings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#E8EEF4]">
                    <p className="text-[#6B7280]">No listings yet. Add your first property!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-md transition">
                        <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${listing.images?.[0] || 'https://via.placeholder.com/400x200/0B342B/fff?text=Listing'})` }}>
                          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[12px] font-medium ${listing.is_active ? 'bg-[#D1FAE5] text-[#3FAF73]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {listing.available_rooms === 0 && (
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                              Fully Booked
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-[#1F2937]">{listing.title}</h4>
                          <p className="text-[13px] text-[#6B7280] mt-0.5">{listing.location}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-[#0B342B]">{formatCurrency(listing.price_per_night)}/night</span>
                            <span className="text-[13px] text-[#6B7280]">{listing.bedrooms} beds</span>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-[13px] text-[#6B7280]">
                            <span>Rooms: {listing.available_rooms}/{listing.total_rooms}</span>
                            <span>Min stay: {listing.min_stay} night(s)</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[13px] text-[#6B7280]">
                            <span>Max guests per room: {listing.max_guests_per_room || 2}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <button className="py-1.5 rounded-lg bg-[#DBEAFE] text-[#3B82F6] text-[13px] font-medium hover:bg-[#3B82F6] hover:text-white transition flex items-center justify-center gap-1" onClick={() => openInventoryModal(listing)}>
                              <InventoryIcon /> Rooms
                            </button>
                            <button className="py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706] text-[13px] font-medium hover:bg-[#D97706] hover:text-white transition flex items-center justify-center gap-1" onClick={() => openBlockDatesModal(listing)}>
                              <CalendarIcon /> Block Dates
                            </button>
                          </div>
                          <button className="mt-2 w-full py-1.5 rounded-lg bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium hover:bg-[#DC2626] hover:text-white transition flex items-center justify-center" onClick={() => deleteListing(listing.id)}>
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
                  <h3 className="text-[17px] font-semibold text-[#1F2937]">Menu Items</h3>
                  <button className="px-4 py-2.5 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition flex items-center gap-2" onClick={() => setShowAddMenuItem(true)}>
                    <PlusIcon /> Add Menu Item
                  </button>
                </div>
                {menuItems.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#E8EEF4]">
                    <p className="text-[#6B7280]">No menu items yet. Add your first dish!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#E8EEF4] shadow-sm hover:shadow-md transition">
                        <div className="h-32 bg-cover bg-center rounded-xl mb-3" style={{ backgroundImage: `url(${item.image || 'https://via.placeholder.com/400x200/0B342B/fff?text=Menu+Item'})` }} />
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-[#1F2937]">{item.name}</h4>
                            <p className="text-[13px] text-[#6B7280]">{item.category}</p>
                            <p className="text-[14px] text-[#6B7280] mt-1 line-clamp-2">{item.description}</p>
                          </div>
                          <span className="font-bold text-[#0B342B]">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4F5F1]">
                          <span className={`text-[13px] font-medium ${item.is_available ? 'text-[#3FAF73]' : 'text-[#DC2626]'}`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                          <button className="text-[#DC2626] hover:text-[#B91C1C] transition" onClick={() => deleteMenuItem(item.id)}>
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
                  <h3 className="text-[17px] font-semibold text-[#1F2937]">
                    {isButchery ? 'Meat Products' : 'Your Products'}
                  </h3>
                  <button className="px-4 py-2.5 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition flex items-center gap-2" onClick={() => setShowAddProduct(true)}>
                    <PlusIcon /> {isButchery ? 'Add Meat Product' : 'Add Product'}
                  </button>
                </div>
                {products.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-[#E8EEF4]">
                    <p className="text-[#6B7280]">{isButchery ? 'No meat products yet. Add your first product!' : 'No products yet. Add your first product!'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => {
                      const badge = getStatusBadge(product.status || 'active');
                      return (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8EEF4] shadow-sm hover:shadow-md transition">
                          <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${product.images?.[0] || 'https://via.placeholder.com/400x200/0B342B/fff?text=Product'})` }}>
                            <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[12px] font-medium ${badge}`}>
                              {product.status || 'Active'}
                            </span>
                            {isButchery && product.meat_type && (
                              <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#0B342B]/90 text-white border border-white/20">
                                {product.meat_type}
                              </span>
                            )}
                            {isButchery && product.cut_type && product.cut_type !== 'whole' && (
                              <span className="absolute bottom-3 left-24 px-2.5 py-1 rounded-full text-[12px] font-medium bg-white/90 text-[#1F2937] border border-white/20">
                                {product.cut_type}
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-[#1F2937]">{product.name}</h4>
                            <p className="text-[13px] text-[#6B7280] mt-0.5">{product.category}</p>
                            {isButchery && product.meat_type && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                                  {product.meat_type}
                                </span>
                                {product.cut_type && product.cut_type !== 'whole' && (
                                  <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#FAFAF7] text-[#6B7280] border border-[#E8EEF4]">
                                    {product.cut_type}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <span className="font-bold text-[#0B342B]">
                                  {isButchery && product.price_per_kg ? formatCurrency(product.price_per_kg) + '/kg' : formatCurrency(product.price)}
                                </span>
                                {isButchery && product.price && product.price > 0 && product.price !== product.price_per_kg && (
                                  <span className="text-[13px] text-[#6B7280] ml-1">({formatCurrency(product.price)})</span>
                                )}
                              </div>
                              <span className="text-[13px] text-[#6B7280]">
                                {isButchery && product.stock_kg ? `${product.stock_kg} kg` : `Stock: ${product.stock || 0}`}
                              </span>
                            </div>
                            <button className="mt-2 w-full py-1.5 rounded-lg bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium hover:bg-[#DC2626] hover:text-white transition flex items-center justify-center" onClick={() => deleteProduct(product.id)}>
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
            <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">All Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="border-b border-[#F4F5F1]">
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Order</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Details</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const badge = getStatusBadge(order.status);
                      const isBooking = order.order_type === 'booking';
                      const itemDisplay = isBooking ? order.items || 'Stay' : order.items || `${order.items?.length || 0} items`;
                      return (
                        <tr key={order.id} className="border-b border-[#F4F5F1] hover:bg-[#FAFAF7] transition">
                          <td className="px-4 py-3 font-semibold text-[#1F2937]">
                            {isBooking ? '🏨' : '🛒'} {order.id}
                          </td>
                          <td className="px-4 py-3 text-[#1F2937]">{order.customer_name || 'Customer'}</td>
                          <td className="px-4 py-3 text-[#6B7280] hidden md:table-cell">
                            {isBooking ? (
                              <div>
                                <div>{order.items || 'Stay'}</div>
                                <div className="text-[13px]">{formatDate(order.check_in)} → {formatDate(order.check_out)}</div>
                                <div className="text-[13px]">{order.guests} guests</div>
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
                          <td className="px-4 py-3 font-semibold text-[#1F2937]">{formatCurrency(order.total_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium ${badge}`}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <select 
                                className="px-2 py-1 rounded-lg border border-[#E8EEF4] bg-white text-[13px] font-medium text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
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
                                  className="px-2 py-1 rounded-lg bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium hover:bg-[#DC2626] hover:text-white transition"
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
              <h3 className="text-[17px] font-semibold text-[#1F2937]">Business Profile</h3>
              <button className="px-4 py-2 rounded-xl bg-[#0B342B] text-white text-[15px] font-medium hover:bg-[#032A24] transition flex items-center gap-2 shadow-sm" onClick={() => setShowEditProfile(true)}>
                <EditIcon /> Edit Profile
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Business Name</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px]" value={businessInfo.business_name || profile?.business_name || ''} disabled />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Business Type</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px] capitalize" value={businessInfo.business_type || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Location</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px]" value={businessInfo.location || ''} disabled />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">County</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px]" value={businessInfo.county || ''} disabled />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Description</label>
              <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px] resize-y" rows="3" value={businessInfo.description || ''} disabled />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Phone</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px]" value={businessInfo.phone || ''} disabled />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Email</label>
                <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-[#F4F5F1] text-[#1F2937] text-[15px]" value={businessInfo.email || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Logo</label>
                {businessInfo.logo_url ? (
                  <img src={businessInfo.logo_url} alt="Logo" className="h-20 w-auto object-contain rounded-lg border border-[#E8EEF4]" />
                ) : (
                  <p className="text-[14px] text-[#6B7280]">No logo uploaded</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Cover Image</label>
                {businessInfo.cover_image ? (
                  <img src={businessInfo.cover_image} alt="Cover" className="h-20 w-full object-cover rounded-lg border border-[#E8EEF4]" />
                ) : (
                  <p className="text-[14px] text-[#6B7280]">No cover image uploaded</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F4F5F1]">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-medium ${businessInfo.is_active ? 'bg-[#D1FAE5] text-[#3FAF73]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                <span className={`w-2 h-2 rounded-full ${businessInfo.is_active ? 'bg-[#3FAF73]' : 'bg-[#DC2626]'}`} />
                {businessInfo.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && businessInfo.business_type === 'halalstay' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Room Inventory Management</h3>
            <div className="grid grid-cols-1 gap-4">
              {listings.map((listing) => (
                <div key={listing.id} className="border border-[#E8EEF4] rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[#1F2937]">{listing.title}</h4>
                      <p className="text-[14px] text-[#6B7280]">{listing.location}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-[14px]">
                        <span>Total Rooms: <strong className="text-[#1F2937]">{listing.total_rooms}</strong></span>
                        <span>Available: <strong className="text-[#3FAF73]">{listing.available_rooms}</strong></span>
                        <span>Booked: <strong className="text-[#D97706]">{listing.total_rooms - listing.available_rooms}</strong></span>
                        <span>Min Stay: <strong className="text-[#1F2937]">{listing.min_stay} night(s)</strong></span>
                        <span>Max Guests/Room: <strong className="text-[#1F2937]">{listing.max_guests_per_room || 2}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-[#0B342B] text-white text-[13px] font-medium hover:bg-[#032A24] transition flex items-center gap-1 shadow-sm" onClick={() => openInventoryModal(listing)}>
                        <InventoryIcon /> Manage Rooms
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706] text-[13px] font-medium hover:bg-[#D97706] hover:text-white transition flex items-center gap-1" onClick={() => openBlockDatesModal(listing)}>
                        <CalendarIcon /> Block Dates
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {listings.length === 0 && (
                <div className="text-center py-8 text-[#6B7280]">No listings found. Create a listing first.</div>
              )}
            </div>
          </div>
        )}

        {/* ===== HAJJ TAB ===== */}
        {activeTab === 'hajj' && (
          <div className="space-y-6">
            {/* Hajj Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[#FAFAF7] rounded-xl p-4 text-center border border-[#E8EEF4]">
                <div className="text-[24px] font-bold text-[#1F2937]">{hajjStats.totalPackages}</div>
                <div className="text-[12px] text-[#6B7280] uppercase tracking-wider">Total Packages</div>
              </div>
              <div className="bg-[#FEF3C7] rounded-xl p-4 text-center border border-[#FDE68A]">
                <div className="text-[24px] font-bold text-[#D97706]">{hajjStats.pendingBookings}</div>
                <div className="text-[12px] text-[#6B7280] uppercase tracking-wider">Pending Bookings</div>
              </div>
              <div className="bg-[#DBEAFE] rounded-xl p-4 text-center border border-[#BFDBFE]">
                <div className="text-[24px] font-bold text-[#3B82F6]">{hajjStats.confirmedBookings}</div>
                <div className="text-[12px] text-[#6B7280] uppercase tracking-wider">Confirmed</div>
              </div>
              <div className="bg-[#D1FAE5] rounded-xl p-4 text-center border border-[#A7F3D0]">
                <div className="text-[24px] font-bold text-[#3FAF73]">{hajjStats.completedBookings}</div>
                <div className="text-[12px] text-[#6B7280] uppercase tracking-wider">Completed</div>
              </div>
              <div className="bg-[#0B342B]/10 rounded-xl p-4 text-center border border-[#0B342B]/20">
                <div className="text-[24px] font-bold text-[#0B342B]">{formatCurrency(hajjStats.totalRevenue)}</div>
                <div className="text-[12px] text-[#6B7280] uppercase tracking-wider">Revenue</div>
              </div>
            </div>

            {/* Packages Section */}
            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F4F5F1]">
                <h4 className="text-[15px] font-semibold text-[#1F2937]">My Hajj Packages</h4>
                <button
                  className="px-4 py-2 bg-[#0B342B] text-white text-[15px] font-medium rounded-xl hover:bg-[#032A24] transition flex items-center gap-2 shadow-sm"
                  onClick={() => {
                    resetHajjPackageForm();
                    setShowAddHajjPackage(true);
                  }}
                >
                  <PlusIcon /> Add Package
                </button>
              </div>

              {loadingHajj ? (
                <div className="flex items-center justify-center gap-3 py-12 text-[#6B7280]">
                  <div className="w-6 h-6 border-2 border-[#0B342B]/20 border-t-[#0B342B] rounded-full animate-spin" />
                  <span>Loading packages...</span>
                </div>
              ) : hajjPackages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#1F2937] font-semibold">No packages created yet</p>
                  <p className="text-[14px] text-[#6B7280] mt-1">Click "Add Package" to create your first Hajj or Umrah package</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="border-b-2 border-[#1F2937]">
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Name</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Price</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Slots</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Bookings</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hajjPackages.map((pkg) => (
                        <tr key={pkg.id} className="border-b border-[#F4F5F1] hover:bg-[#FAFAF7] transition">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-[#1F2937]">{pkg.name}</div>
                            <div className="text-[13px] text-[#6B7280]">{pkg.duration_days} days</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[13px] px-2 py-0.5 rounded-full ${pkg.type === 'hajj' ? 'bg-[#0B342B]/10 text-[#0B342B]' : 'bg-[#D1FAE5] text-[#3FAF73]'}`}>
                              {pkg.type === 'hajj' ? 'Hajj' : 'Umrah'}
                            </span>
                            {pkg.is_featured && (
                              <span className="ml-1 text-[13px] px-2 py-0.5 rounded-full bg-[#C9A44B] text-white">Featured</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#0B342B]">{formatCurrency(pkg.price)}</td>
                          <td className="px-3 py-2 hidden md:table-cell text-[14px] text-[#6B7280]">{pkg.available_slots}</td>
                          <td className="px-3 py-2 hidden lg:table-cell text-[14px] text-[#6B7280]">{pkg.total_bookings || 0}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[13px] px-2 py-0.5 rounded-full ${pkg.is_active ? 'bg-[#D1FAE5] text-[#3FAF73]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button
                                className="px-2 py-1 bg-[#DBEAFE] text-[#3B82F6] text-[13px] rounded hover:bg-[#3B82F6] hover:text-white transition"
                                onClick={() => editHajjPackage(pkg)}
                              >
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 bg-[#FEE2E2] text-[#DC2626] text-[13px] rounded hover:bg-[#DC2626] hover:text-white transition"
                                onClick={() => deleteHajjPackage(pkg.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bookings Section */}
            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F4F5F1]">
                <h4 className="text-[15px] font-semibold text-[#1F2937]">Package Bookings</h4>
                <select
                  className="px-3 py-1.5 text-[13px] border border-[#E8EEF4] rounded-lg bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                  value={hajjBookingFilter}
                  onChange={(e) => setHajjBookingFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {loadingHajj ? (
                <div className="flex items-center justify-center gap-3 py-12 text-[#6B7280]">
                  <div className="w-6 h-6 border-2 border-[#0B342B]/20 border-t-[#0B342B] rounded-full animate-spin" />
                  <span>Loading bookings...</span>
                </div>
              ) : filteredHajjBookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#1F2937] font-semibold">No bookings found</p>
                  <p className="text-[14px] text-[#6B7280] mt-1">Bookings will appear here when clients make reservations</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="border-b-2 border-[#1F2937]">
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Client</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Package</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Pilgrims</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Amount</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHajjBookings.map((booking) => {
                        const statusBadge = getStatusBadge(booking.status);
                        return (
                          <tr key={booking.id} className="border-b border-[#F4F5F1] hover:bg-[#FAFAF7] transition">
                            <td className="px-3 py-2">
                              <div>
                                <div className="font-semibold text-[#1F2937]">{booking.client_name || 'Unknown'}</div>
                                <div className="text-[13px] text-[#6B7280]">{booking.client_phone || ''}</div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-[14px] text-[#6B7280]">{booking.package_name}</td>
                            <td className="px-3 py-2 hidden md:table-cell text-[14px] text-[#6B7280]">{booking.pilgrims}</td>
                            <td className="px-3 py-2 font-semibold text-[#0B342B]">{formatCurrency(booking.total_price)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${statusBadge}`}>
                                {getStatusBadge(booking.status).label}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <div className="flex gap-1">
                                  <button
                                    className="px-2 py-1 bg-[#D1FAE5] text-[#3FAF73] text-[13px] rounded hover:bg-[#3FAF73] hover:text-white transition"
                                    onClick={() => updateHajjBookingStatus(booking.id, 'confirmed')}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    className="px-2 py-1 bg-[#FEE2E2] text-[#DC2626] text-[13px] rounded hover:bg-[#DC2626] hover:text-white transition"
                                    onClick={() => updateHajjBookingStatus(booking.id, 'cancelled')}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="px-2 py-1 bg-[#DBEAFE] text-[#3B82F6] text-[13px] rounded hover:bg-[#3B82F6] hover:text-white transition"
                                    onClick={() => viewHajjBooking(booking)}
                                  >
                                    View
                                  </button>
                                </div>
                              )}
                              {(booking.status === 'cancelled' || booking.status === 'completed') && (
                                <button
                                  className="px-2 py-1 bg-[#DBEAFE] text-[#3B82F6] text-[13px] rounded hover:bg-[#3B82F6] hover:text-white transition"
                                  onClick={() => viewHajjBooking(booking)}
                                >
                                  View
                                </button>
                              )}
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

        {/* ===== HAJJ BOOKING DETAIL MODAL ===== */}
        {showHajjBookingModal && selectedHajjBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHajjBookingModal(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Booking Details</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowHajjBookingModal(false)}><CloseIcon /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="font-bold text-[#1F2937]">{selectedHajjBooking.package_name}</div>
                  <div className="text-[14px] text-[#6B7280]">{selectedHajjBooking.package_type}</div>
                </div>

                <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[#E8EEF4]">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Client</span>
                    <span className="font-semibold text-[#1F2937]">{selectedHajjBooking.client_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Phone</span>
                    <span className="font-semibold text-[#1F2937]">{selectedHajjBooking.client_phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Email</span>
                    <span className="font-semibold text-[#1F2937]">{selectedHajjBooking.client_email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Pilgrims</span>
                    <span className="font-semibold text-[#1F2937]">{selectedHajjBooking.pilgrims}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Total Amount</span>
                    <span className="font-bold text-[#0B342B]">{formatCurrency(selectedHajjBooking.total_price)}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-[#6B7280]">Booking Date</span>
                    <span className="font-semibold text-[#1F2937]">{formatDate(selectedHajjBooking.booking_date)}</span>
                  </div>
                  <div className="flex justify-between text-[15px] pt-2 border-t border-[#E8EEF4]">
                    <span className="text-[#6B7280]">Status</span>
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${getStatusBadge(selectedHajjBooking.status)}`}>
                      {getStatusBadge(selectedHajjBooking.status).label}
                    </span>
                  </div>
                </div>

                {selectedHajjBooking.pilgrim_names && selectedHajjBooking.pilgrim_names.length > 0 && (
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                    <p className="text-[13px] font-medium text-[#6B7280] mb-2">Pilgrim Names</p>
                    <ul className="text-[15px] text-[#1F2937] space-y-1">
                      {selectedHajjBooking.pilgrim_names.map((name, i) => (
                        <li key={i}>• {name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedHajjBooking.special_requests && (
                  <div className="bg-[#FEF3C7] rounded-xl p-3 text-[14px] text-[#D97706] border border-[#FDE68A]">
                    <strong>Special Requests:</strong> {selectedHajjBooking.special_requests}
                  </div>
                )}

                {selectedHajjBooking.status !== 'cancelled' && selectedHajjBooking.status !== 'completed' && (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 bg-[#3FAF73] text-white font-medium rounded-xl hover:bg-[#2D8F5E] transition shadow-sm"
                      onClick={() => {
                        updateHajjBookingStatus(selectedHajjBooking.id, 'confirmed');
                      }}
                      disabled={processing}
                    >
                      Confirm Booking
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-[#DC2626] text-white font-medium rounded-xl hover:bg-[#B91C1C] transition shadow-sm"
                      onClick={() => {
                        updateHajjBookingStatus(selectedHajjBooking.id, 'cancelled');
                      }}
                      disabled={processing}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
                <button
                  className="w-full px-4 py-2 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition shadow-sm"
                  onClick={() => setShowHajjBookingModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== INVENTORY MODAL ===== */}
        {showInventoryModal && selectedListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowInventoryModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Manage Inventory</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowInventoryModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Total Rooms</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={inventoryData.total_rooms}
                    onChange={(e) => setInventoryData({...inventoryData, total_rooms: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Available Rooms</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={inventoryData.available_rooms}
                    onChange={(e) => setInventoryData({...inventoryData, available_rooms: parseInt(e.target.value) || 0})}
                    min="0"
                    max={inventoryData.total_rooms}
                  />
                  <p className="text-[13px] text-[#6B7280] mt-1">Cannot exceed total rooms</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Minimum Stay (Nights)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={inventoryData.min_stay}
                    onChange={(e) => setInventoryData({...inventoryData, min_stay: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Max Advance Booking (Days)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={inventoryData.max_advance_days}
                    onChange={(e) => setInventoryData({...inventoryData, max_advance_days: parseInt(e.target.value) || 30})}
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Max Guests Per Room</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                    value={inventoryData.max_guests_per_room}
                    onChange={(e) => setInventoryData({...inventoryData, max_guests_per_room: parseInt(e.target.value) || 2})}
                    min="1"
                    max="10"
                  />
                  <p className="text-[13px] text-[#6B7280] mt-1">Maximum number of people allowed per room</p>
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowInventoryModal(false)}>Cancel</button>
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition disabled:opacity-60" onClick={updateInventory} disabled={processing}>
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
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Block Dates</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowBlockDatesModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3 text-[15px] text-[#D97706]">
                  Block dates when rooms are unavailable (maintenance, holidays, etc.)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">End Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      min={dateRangeStart}
                    />
                  </div>
                </div>
                <button 
                  className="w-full px-6 py-3 rounded-xl bg-[#DC2626] text-white font-medium text-[15px] hover:bg-[#B91C1C] transition disabled:opacity-60 shadow-sm"
                  onClick={blockDates}
                  disabled={processing || !dateRangeStart || !dateRangeEnd}
                >
                  {processing ? 'Blocking...' : 'Block Dates'}
                </button>

                <div className="mt-4 pt-4 border-t border-[#E8EEF4]">
                  <h4 className="text-[15px] font-semibold text-[#1F2937] mb-2">Blocked Dates</h4>
                  {blockedDatesList.length === 0 ? (
                    <p className="text-[14px] text-[#6B7280]">No blocked dates</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {blockedDatesList.map((item) => (
                        <span key={item.date} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium border border-[#FCA5A5]">
                          {formatDate(item.date)}
                          <button className="text-[#DC2626]/60 hover:text-[#DC2626] transition" onClick={() => unblockDate(item.date)}>
                            <CancelIcon />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
              </div>
            </div>
          </div>
        )}

        {/* ===== CANCEL BOOKING MODAL ===== */}
        {showCancelBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCancelBookingModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Cancel Booking</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowCancelBookingModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl p-3 text-[15px] text-[#DC2626]">
                  This will cancel the booking and restore room availability.
                </div>
                <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 text-[15px] border border-[#E8EEF4]">
                  <div className="flex justify-between"><span className="text-[#6B7280]">Customer</span><span className="font-semibold text-[#1F2937]">{selectedBooking.customer_name}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Property</span><span className="font-semibold text-[#1F2937]">{selectedBooking.listing_title}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Amount</span><span className="font-semibold text-[#1F2937]">{formatCurrency(selectedBooking.total_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B7280]">Status</span><span className="font-semibold text-[#D97706]">{selectedBooking.status}</span></div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Reason for Cancellation</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y"
                    rows="2"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Optional reason for cancellation"
                  />
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowCancelBookingModal(false)}>Keep Booking</button>
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#DC2626] text-white font-medium text-[15px] hover:bg-[#B91C1C] transition disabled:opacity-60 shadow-sm" onClick={confirmCancelBooking} disabled={processing}>
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
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Edit Business Profile</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowEditProfile(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveProfileUpdate(); }} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Business Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={businessInfo.business_name}
                      onChange={(e) => setBusinessInfo({...businessInfo, business_name: e.target.value})}
                      placeholder="Business name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Location *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={businessInfo.location}
                      onChange={(e) => setBusinessInfo({...businessInfo, location: e.target.value})}
                      placeholder="City, County"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">County</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={businessInfo.county}
                      onChange={(e) => setBusinessInfo({...businessInfo, county: e.target.value})}
                      placeholder="County"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Description</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y"
                    rows="3"
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                    placeholder="Describe your business"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                      placeholder="business@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Website</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Logo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                        value={businessInfo.logo_url}
                        onChange={(e) => setBusinessInfo({...businessInfo, logo_url: e.target.value})}
                        placeholder="Logo URL"
                      />
                      <button type="button" className="px-3 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1] transition" onClick={() => { setImageUploadType('logo'); fileInputRef.current.click(); }}>
                        <UploadIcon />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Cover Image</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                        value={businessInfo.cover_image}
                        onChange={(e) => setBusinessInfo({...businessInfo, cover_image: e.target.value})}
                        placeholder="Cover URL"
                      />
                      <button type="button" className="px-3 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1] transition" onClick={() => { setImageUploadType('cover'); fileInputRef.current.click(); }}>
                        <UploadIcon />
                      </button>
                    </div>
                  </div>
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowEditProfile(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition disabled:opacity-60" disabled={loading}>
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
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">
                  {isButchery ? 'Add Meat Product' : 'Add Product'}
                </h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowAddProduct(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Name *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Category *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required />
                </div>

                {isButchery ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Meat Type *</label>
                        <select className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 appearance-none" value={newProduct.meat_type} onChange={(e) => setNewProduct({...newProduct, meat_type: e.target.value})}>
                          {meatTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Cut Type</label>
                        <select className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 appearance-none" value={newProduct.cut_type} onChange={(e) => setNewProduct({...newProduct, cut_type: e.target.value})}>
                          {cutTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Price (KES) *</label>
                        <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Price Per Kg</label>
                        <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newProduct.price_per_kg} onChange={(e) => setNewProduct({...newProduct, price_per_kg: e.target.value})} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Stock (units)</label>
                        <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Stock (kg)</label>
                        <input type="number" step="0.01" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newProduct.stock_kg} onChange={(e) => setNewProduct({...newProduct, stock_kg: e.target.value})} placeholder="Optional" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Price (KES) *</label>
                      <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Stock</label>
                      <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y" rows="2" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Unit</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} placeholder="piece" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Images</label>
                  <div className="flex flex-wrap gap-2">
                    {newProduct.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={img} alt={`Product ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[13px] transition-opacity" onClick={() => removeImage('product', i)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E8EEF4] flex flex-col items-center justify-center cursor-pointer hover:border-[#0B342B] hover:text-[#0B342B] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('product'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[12px] text-[#6B7280] group-hover:text-[#0B342B]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
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
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E8EEF4] text-[#0B342B] focus:ring-[#0B342B]/20" checked={newProduct.is_halal} onChange={(e) => setNewProduct({...newProduct, is_halal: e.target.checked})} />
                  <label className="text-[14px] text-[#6B7280]">Halal Certified</label>
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowAddProduct(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition disabled:opacity-60" disabled={loading}>
                    {loading ? 'Adding...' : isButchery ? 'Add Meat Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== ADD LISTING MODAL ===== */}
        {showAddListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddListing(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Add Listing</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowAddListing(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddListing} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Title *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newListing.title} onChange={(e) => setNewListing({...newListing, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Location *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newListing.location} onChange={(e) => setNewListing({...newListing, location: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Price Per Night (KES) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newListing.price_per_night} onChange={(e) => setNewListing({...newListing, price_per_night: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Bedrooms</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newListing.bedrooms} onChange={(e) => setNewListing({...newListing, bedrooms: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Bathrooms</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newListing.bathrooms} onChange={(e) => setNewListing({...newListing, bathrooms: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y" rows="2" value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Total Rooms</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newListing.total_rooms} onChange={(e) => setNewListing({...newListing, total_rooms: e.target.value})} min="1" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Min Stay (Nights)</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newListing.min_stay} onChange={(e) => setNewListing({...newListing, min_stay: e.target.value})} min="1" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Max Advance (Days)</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newListing.max_advance_days} onChange={(e) => setNewListing({...newListing, max_advance_days: e.target.value})} min="1" max="365" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Max Guests/Room</label>
                    <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newListing.max_guests_per_room} onChange={(e) => setNewListing({...newListing, max_guests_per_room: e.target.value})} min="1" max="10" />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Images</label>
                  <div className="flex flex-wrap gap-2">
                    {newListing.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={img} alt={`Listing ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[13px] transition-opacity" onClick={() => removeImage('listing', i)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E8EEF4] flex flex-col items-center justify-center cursor-pointer hover:border-[#0B342B] hover:text-[#0B342B] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('listing'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[12px] text-[#6B7280] group-hover:text-[#0B342B]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
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
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowAddListing(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition disabled:opacity-60" disabled={loading}>
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
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">Add Menu Item</h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowAddMenuItem(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddMenuItem} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Name *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newMenuItem.name} onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Category *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newMenuItem.category} onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Price (KES) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newMenuItem.price} onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Image</label>
                  <div className="flex flex-wrap gap-2">
                    {newMenuItem.image && (
                      <div className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={newMenuItem.image} alt="Menu Item" className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[13px] transition-opacity" onClick={() => removeImage('menu', 0)}>
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E8EEF4] flex flex-col items-center justify-center cursor-pointer hover:border-[#0B342B] hover:text-[#0B342B] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('menu'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[12px] text-[#6B7280] group-hover:text-[#0B342B]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
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
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y" rows="2" value={newMenuItem.description} onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E8EEF4] text-[#0B342B] focus:ring-[#0B342B]/20" checked={newMenuItem.is_available} onChange={(e) => setNewMenuItem({...newMenuItem, is_available: e.target.checked})} />
                  <label className="text-[14px] text-[#6B7280]">Available</label>
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowAddMenuItem(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition disabled:opacity-60" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Menu Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== ADD HAJJ PACKAGE MODAL ===== */}
        {showAddHajjPackage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddHajjPackage(false)}>
            <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-[22px] font-semibold text-[#1F2937]">
                  {editingHajjPackage ? 'Edit Hajj Package' : 'Add Hajj Package'}
                </h3>
                <button className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]" onClick={() => setShowAddHajjPackage(false)}><CloseIcon /></button>
              </div>
              <form onSubmit={handleAddHajjPackage} className="p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Package Name *</label>
                  <input type="text" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newHajjPackage.name} onChange={(e) => setNewHajjPackage({...newHajjPackage, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Type *</label>
                  <select className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 appearance-none" value={newHajjPackage.type} onChange={(e) => setNewHajjPackage({...newHajjPackage, type: e.target.value})}>
                    <option value="hajj">Hajj</option>
                    <option value="umrah">Umrah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Duration (Days) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newHajjPackage.duration_days} onChange={(e) => setNewHajjPackage({...newHajjPackage, duration_days: e.target.value})} min="1" required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Price (KES per person) *</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20" value={newHajjPackage.price} onChange={(e) => setNewHajjPackage({...newHajjPackage, price: e.target.value})} min="0" required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Available Slots</label>
                  <input type="number" className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px]" value={newHajjPackage.available_slots} onChange={(e) => setNewHajjPackage({...newHajjPackage, available_slots: e.target.value})} min="0" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Description</label>
                  <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y" rows="2" value={newHajjPackage.description} onChange={(e) => setNewHajjPackage({...newHajjPackage, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">What's Included</label>
                  <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y" rows="2" value={newHajjPackage.includes} onChange={(e) => setNewHajjPackage({...newHajjPackage, includes: e.target.value})} placeholder="Flights, Hotel, Visa, Transport (comma separated)" />
                  <p className="text-[13px] text-[#6B7280] mt-1">Separate items with commas</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">What's Excluded</label>
                  <textarea className="w-full px-4 py-3 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 resize-y" rows="2" value={newHajjPackage.excludes} onChange={(e) => setNewHajjPackage({...newHajjPackage, excludes: e.target.value})} placeholder="Personal expenses, Travel insurance (comma separated)" />
                  <p className="text-[13px] text-[#6B7280] mt-1">Separate items with commas</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Images</label>
                  <div className="flex flex-wrap gap-2">
                    {newHajjPackage.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg border border-[#E8EEF4] overflow-hidden group">
                        <img src={img} alt={`Package ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[13px] transition-opacity" onClick={() => removeImage('hajj', i)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-[#E8EEF4] flex flex-col items-center justify-center cursor-pointer hover:border-[#0B342B] hover:text-[#0B342B] transition group">
                      <button type="button" className="flex flex-col items-center gap-1 w-full h-full" onClick={() => { setImageUploadType('hajj'); fileInputRef.current.click(); }}>
                        <PlusIcon />
                        <span className="text-[12px] text-[#6B7280] group-hover:text-[#0B342B]">Upload</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20"
                      placeholder="Or paste image URL"
                      onBlur={(e) => {
                        if (e.target.value) {
                          handleImageUrlInput('hajj', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E8EEF4] text-[#0B342B] focus:ring-[#0B342B]/20" checked={newHajjPackage.is_active} onChange={(e) => setNewHajjPackage({...newHajjPackage, is_active: e.target.checked})} />
                  <label className="text-[14px] text-[#6B7280]">Package is active and visible</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E8EEF4] text-[#0B342B] focus:ring-[#0B342B]/20" checked={newHajjPackage.is_featured} onChange={(e) => setNewHajjPackage({...newHajjPackage, is_featured: e.target.checked})} />
                  <label className="text-[14px] text-[#6B7280]">Feature this package</label>
                </div>
                {error && <div className="p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626]">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 px-6 py-3 rounded-xl bg-[#FAFAF7] text-[#6B7280] font-medium text-[15px] hover:bg-[#F4F5F1] transition" onClick={() => setShowAddHajjPackage(false)}>Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-[#0B342B] text-white font-medium text-[15px] shadow-md shadow-[#0B342B]/20 hover:bg-[#032A24] transition disabled:opacity-60" disabled={processing || !newHajjPackage.name || !newHajjPackage.type || !newHajjPackage.price || !newHajjPackage.duration_days}>
                    {processing ? 'Saving...' : editingHajjPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

export default VendorDashboard;