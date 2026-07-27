import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('halalhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========================================
// AUTH SERVICE
// ========================================
export const authService = {
  // Client Registration
  registerClient: (data) => api.post('/auth/register-client', data),
  // Vendor Registration
  registerVendor: (data) => api.post('/auth/register-vendor', data),
  // Imam Registration
  registerImam: (data) => api.post('/auth/register-imam', data),
  // Login
  loginStep1: (phone) => api.post('/auth/login-step1', { phone }),
  loginStep2: (data) => api.post('/auth/login-step2', data),
  // Registration OTP
  sendRegistrationOtp: (data) => api.post('/auth/send-registration-otp', data),
  verifyRegistrationOtp: (data) => api.post('/auth/verify-registration-otp', data),
  // Get current user
  getMe: () => api.get('/auth/me'),
};

// ========================================
// ADMIN SERVICE
// ========================================
export const adminService = {
  login: (data) => api.post('/admin/login', data),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  // Vendor management
  getPendingVendors: () => api.get('/admin/pending-vendors'),
  getVendors: (params) => api.get('/admin/vendors', { params }),
  verifyVendor: (id, data) => api.put(`/admin/vendors/${id}/verify`, data),
  // Imam management
  getPendingImams: () => api.get('/admin/pending-imams'),
  getImams: (params) => api.get('/admin/imams', { params }),
  verifyImam: (id, data) => api.put(`/admin/imams/${id}/verify`, data),
  // Transactions & Orders
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getOverview: () => api.get('/admin/overview'),
};

// ========================================
// VENDOR SERVICE
// ========================================
export const vendorService = {
  // Dashboard
  getStats: () => api.get('/vendor/dashboard-stats'),
  getProfile: () => api.get('/vendor/profile'),
  updateProfile: (data) => api.post('/vendor/profile', data),
  // Products
  getProducts: () => api.get('/vendor/products'),
  createProduct: (data) => api.post('/vendor/products', data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),
  // Orders
  getOrders: (params) => api.get('/vendor/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/vendor/orders/${id}`, data),
  // Bookings (HalalStay)
  getBookings: (params) => api.get('/vendor/bookings', { params }),
  updateBookingStatus: (id, data) => api.put(`/vendor/bookings/${id}`, data),
  // Listings (HalalStay)
  getListings: () => api.get('/vendor/listings'),
  createListing: (data) => api.post('/vendor/listings', data),
  updateListing: (id, data) => api.put(`/vendor/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/vendor/listings/${id}`),
  // Earnings
  getEarnings: () => api.get('/vendor/earnings'),
  // Reviews
  getReviews: () => api.get('/vendor/reviews'),
};

// ========================================
// IMAM SERVICE
// ========================================
export const imamService = {
  // Dashboard
  getStats: () => api.get('/imam/dashboard-stats'),
  getProfile: () => api.get('/imam/profile'),
  updateProfile: (data) => api.post('/imam/profile', data),
  // Pension
  getPension: () => api.get('/imam/pension'),
  getPensionHistory: (params) => api.get('/imam/pension/history', { params }),
  // Supporters
  getSupporters: () => api.get('/imam/supporters'),
  // Notifications
  getNotifications: (params) => api.get('/imam/notifications', { params }),
  getUnreadCount: () => api.get('/imam/notifications/unread-count'),
  // Public profile
  getPublicProfile: (id) => api.get(`/imam/public/${id}`),
};

// ========================================
// CLIENT SERVICE
// ========================================
export const clientService = {
  // Vendors
  getVendors: (params) => api.get('/client/vendors', { params }),
  getVendorById: (id) => api.get(`/client/vendors/${id}`),
  // Products
  getProducts: (params) => api.get('/client/products', { params }),
  getProductById: (id) => api.get(`/client/products/${id}`),
  // Listings (HalalStay)
  getListings: (params) => api.get('/client/listings', { params }),
  getListingById: (id) => api.get(`/client/listings/${id}`),
  getListingAvailability: (id, params) => api.get(`/client/listings/${id}/availability`, { params }),
  // Bookings
  createBooking: (data) => api.post('/client/bookings', data),
  getBookings: () => api.get('/client/bookings'),
  cancelBooking: (id) => api.put(`/client/bookings/${id}/cancel`),
  // Orders (Ecommerce)
  createOrder: (data) => api.post('/client/orders', data),
  getOrders: () => api.get('/client/orders'),
  // Imams
  getImams: (params) => api.get('/client/imams', { params }),
  getImamById: (id) => api.get(`/client/imams/${id}`),
  supportImam: (data) => api.post('/client/support-imam', data),
  getSupportedImams: () => api.get('/client/supported-imams'),
  // Mosques
  getMosques: (params) => api.get('/client/mosques', { params }),
  // Menu Items (Restaurants)
  getMenuItems: (params) => api.get('/client/menu-items', { params }),
};

// ========================================
// WALLET SERVICE
// ========================================
export const walletService = {
  getBalance: () => api.get('/wallet/balance'),
  topup: (data) => api.post('/wallet/topup', data),
};

// ========================================
// M-PESA SERVICE
// ========================================
export const mpesaService = {
  stkPush: (data) => api.post('/mpesa/stk-push', data),
  checkStatus: (checkoutId) => api.get(`/mpesa/status/${checkoutId}`),
};

// ========================================
// ZAKAT SERVICE
// ========================================
export const zakatService = {
  calculate: (data) => api.post('/zakat/calculate', data),
  getZakatDue: () => api.get('/zakat/due'),
  pay: (data) => api.post('/zakat/pay', data),
  getHistory: () => api.get('/zakat/history'),
};

// ========================================
// SADAQA SERVICE
// ========================================
export const sadaqaService = {
  getCampaigns: () => api.get('/sadaqa/campaigns'),
  donate: (data) => api.post('/sadaqa/donate', data),
  getDonationHistory: () => api.get('/sadaqa/history'),
  getImpactStats: () => api.get('/sadaqa/stats'),
};

// ========================================
// P2P SERVICE
// ========================================
export const p2pService = {
  // Search users
  searchUsers: (query) => api.get(`/p2p/users?q=${encodeURIComponent(query)}`),
  // Get user by ID
  getUserById: (id) => api.get(`/p2p/users/${id}`),
  // Get balance
  getBalance: () => api.get('/p2p/balance'),
  // Send transfer
  transfer: (data) => api.post('/p2p/transfer', data),
  // Get transaction history
  getTransactions: (limit = 50) => api.get(`/p2p/transactions?limit=${limit}`),
  // Get transaction by reference
  getTransactionByRef: (reference) => api.get(`/p2p/transactions/${reference}`),
  // Get stats
  getStats: () => api.get('/p2p/stats'),
  // Legacy loan endpoints (keep for backward compatibility if needed)
  getLoans: () => api.get('/p2p/loans'),
  getLoanRequests: () => api.get('/p2p/loan-requests'),
  getMyLoans: () => api.get('/p2p/my-loans'),
  apply: (data) => api.post('/p2p/apply', data),
  fundLoan: (data) => api.post('/p2p/fund', data),
  repayLoan: (data) => api.post('/p2p/repay', data),
};

// ========================================
// TAKAFUL SERVICE
// ========================================
export const takafulService = {
  // Plans
  getPlans: () => api.get('/takaful/plans'),
  // Policy
  getPolicy: () => api.get('/takaful/policy'),
  // Enroll
  enroll: (data) => api.post('/takaful/enroll', data),
  // Family members
  getFamilyMembers: () => api.get('/takaful/family'),
  addFamilyMember: (data) => api.post('/takaful/family', data),
  removeFamilyMember: (id) => api.delete(`/takaful/family/${id}`),
  // Claims
  getClaims: () => api.get('/takaful/claims'),
  getClaimById: (id) => api.get(`/takaful/claims/${id}`),
  submitClaim: (data) => api.post('/takaful/claims', data),
  // Pool stats
  getPoolStats: () => api.get('/takaful/pool-stats'),
  // Contributions
  getContributions: () => api.get('/takaful/contributions'),
};

// ========================================
// PENSION SERVICE (Imam Retirement Support)
// ========================================
export const pensionService = {
  // Get public stats (imams, mosques, communities, contributors)
  getStats: () => api.get('/pension/stats'),
  // Get all mosques (with search and filter)
  getMosques: (params) => api.get('/pension/mosques', { params }),
  // Get mosque details with imams
  getMosqueById: (id) => api.get(`/pension/mosques/${id}`),
  // Get imam profile (public)
  getImamProfile: (id) => api.get(`/pension/imams/${id}`),
  // Record contribution to imam's pension
  contribute: (data) => api.post('/pension/contribute', data),
  // Get user's contribution history
  getContributions: (params) => api.get('/pension/contributions', { params }),
};

// ========================================
// MOSQUE SERVICE
// ========================================
export const mosqueService = {
  // Get all mosques
  getAll: (params) => api.get('/mosque', { params }),
  // Get mosque by ID
  getById: (id) => api.get(`/mosque/${id}`),
  // Add mosque (vendor/admin)
  add: (data) => api.post('/mosque/add', data),
  // Update mosque (vendor/admin)
  update: (id, data) => api.put(`/mosque/${id}`, data),
  // Delete mosque (admin)
  delete: (id) => api.delete(`/mosque/${id}`),
  // Get stats
  getStats: () => api.get('/mosque/stats/count'),
  // Get counties with mosques
  getCounties: () => api.get('/mosque/counties/list'),
};

// ========================================
// TRANSACTION SERVICE
// ========================================
export const transactionService = {
  getRecent: (limit = 5) => api.get(`/transactions/recent?limit=${limit}`),
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  getWalletTransactions: () => api.get('/transactions/wallet'),
};

// ========================================
// PENSION SERVICE (Legacy - keep for compatibility)
// ========================================
export const pensionServiceLegacy = {
  getPensionData: () => api.get('/pension'),
  enroll: (data) => api.post('/pension/enroll', data),
  getContributions: () => api.get('/pension/contributions'),
  getBeneficiaries: () => api.get('/pension/beneficiaries'),
  addBeneficiary: (data) => api.post('/pension/beneficiaries', data),
};

// ========================================
// UTILITY SERVICE
// ========================================
export const utilityService = {
  getUtilities: () => api.get('/utilities'),
  getPaymentHistory: () => api.get('/utilities/history'),
  payBill: (data) => api.post('/utilities/pay', data),
  getFavorites: () => api.get('/utilities/favorites'),
  addFavorite: (utilityId) => api.post('/utilities/favorites', { utilityId }),
};

// ========================================
// HALALSTAY SERVICE
// ========================================
export const halalstayService = {
  getProperties: () => api.get('/halalstay/properties'),
  getPropertyById: (id) => api.get(`/halalstay/properties/${id}`),
  createBooking: (data) => api.post('/halalstay/bookings', data),
  getMyBookings: () => api.get('/halalstay/bookings'),
  cancelBooking: (id) => api.delete(`/halalstay/bookings/${id}`),
  getWishlist: () => api.get('/halalstay/wishlist'),
  addToWishlist: (propertyId) => api.post('/halalstay/wishlist', { propertyId }),
};

// ========================================
// HAJJ SERVICE
// ========================================
export const hajjService = {
  getPackages: () => api.get('/hajj/packages'),
  getPackageById: (id) => api.get(`/hajj/packages/${id}`),
  bookPackage: (data) => api.post('/hajj/book', data),
  getBookings: () => api.get('/hajj/bookings'),
};

// ========================================
// HEARSE SERVICE
// ========================================
export const hearseService = {
  getProviders: () => api.get('/hearse/providers'),
  requestService: (data) => api.post('/hearse/request', data),
  getRequests: () => api.get('/hearse/requests'),
};

// ========================================
// WILL SERVICE
// ========================================
export const willService = {
  createWill: (data) => api.post('/wills', data),
  getWills: () => api.get('/wills'),
  getWillById: (id) => api.get(`/wills/${id}`),
  updateWill: (id, data) => api.put(`/wills/${id}`, data),
  calculateInheritance: (data) => api.post('/wills/calculate-inheritance', data),
};

// ========================================
// KADHI SERVICE
// ========================================
export const kadhiService = {
  // Get all kadhis with filters
  getKadhis: (params) => api.get('/kadhis', { params }),
  // Get kadhi by ID
  getKadhiById: (id) => api.get(`/kadhis/${id}`),
  // Get kadhi statistics
  getKadhiStats: () => api.get('/kadhis/stats/summary'),
  // Get counties with kadhis
  getCounties: () => api.get('/kadhis/counties/list'),
  // Create kadhi (admin only)
  createKadhi: (data) => api.post('/kadhis', data),
  // Update kadhi (admin only)
  updateKadhi: (id, data) => api.put(`/kadhis/${id}`, data),
  // Delete kadhi (admin only)
  deleteKadhi: (id) => api.delete(`/kadhis/${id}`),
};

// ========================================
// BOOKING SERVICE (Consultation Bookings)
// ========================================
export const bookingService = {
  // Get all bookings for user
  getBookings: (params) => api.get('/bookings', { params }),
  // Get booking by ID
  getBookingById: (id) => api.get(`/bookings/${id}`),
  // Create a new booking
  createBooking: (data) => api.post('/bookings', data),
  // Update a booking
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  // Cancel a booking
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  // Get booking by room name
  getBookingByRoom: (roomName) => api.get(`/bookings/room/${roomName}`),
  // Get booking statistics
  getBookingStats: () => api.get('/bookings/stats/summary'),
};

// ========================================
// KADHI SERVICE (Legacy - keep for compatibility)
// ========================================
export const kadhiServiceLegacy = {
  getKadhis: () => api.get('/kadhis'),
  getKadhiById: (id) => api.get(`/kadhis/${id}`),
  getReviews: (kadhiId) => api.get(`/kadhis/${kadhiId}/reviews`),
  addReview: (data) => api.post('/kadhis/reviews', data),
};

// ========================================
// MOSQUE SERVICE (Legacy - keep for compatibility)
// ========================================
export const mosqueServiceLegacy = {
  getMosques: () => api.get('/mosques'),
  getMosqueById: (id) => api.get(`/mosques/${id}`),
  getFavorites: () => api.get('/mosques/favorites'),
  addFavorite: (mosqueId) => api.post('/mosques/favorites', { mosqueId }),
  removeFavorite: (mosqueId) => api.delete(`/mosques/favorites/${mosqueId}`),
  addReview: (data) => api.post('/mosques/reviews', data),
  getJummahTimes: (mosqueId) => api.get(`/mosques/${mosqueId}/jummah`),
};

// ========================================
// PRAYER SERVICE
// ========================================
export const prayerService = {
  getPrayerTimes: (lat, lng) => api.get(`/prayer/times?lat=${lat}&lng=${lng}`),
  getCityPrayerTimes: (city) => api.get(`/prayer/times/${city}`),
};

// ========================================
// RESTAURANT SERVICE
// ========================================
export const restaurantService = {
  getRestaurants: () => api.get('/restaurants'),
  getRestaurantById: (id) => api.get(`/restaurants/${id}`),
  getMenu: (restaurantId) => api.get(`/restaurants/${restaurantId}/menu`),
  getReviews: (restaurantId) => api.get(`/restaurants/${restaurantId}/reviews`),
  addReview: (data) => api.post('/restaurants/reviews', data),
  placeOrder: (data) => api.post('/restaurants/order', data),
};

// ========================================
// KYC SERVICE
// ========================================
export const kycService = {
  getApplications: () => api.get('/kyc/applications'),
  createApplication: (data) => api.post('/kyc/applications', data),
  getApplicationById: (id) => api.get(`/kyc/applications/${id}`),
  uploadDocuments: (id, data) => api.post(`/kyc/applications/${id}/documents`, data),
  resubmitApplication: (id) => api.post(`/kyc/applications/${id}/resubmit`),
  getStatus: () => api.get('/kyc/status'),
};

// ========================================
// DONATION SERVICE
// ========================================
export const donationService = {
  donateToMosque: (data) => api.post('/donations/mosque', data),
  getDonationHistory: () => api.get('/donations/history'),
  getMosqueDonations: (mosqueId) => api.get(`/donations/mosque/${mosqueId}`),
};

// ========================================
// PDF SERVICE (For Will Downloads)
// ========================================
export const pdfService = {
  generateWill: (data) => api.post('/pdf/will', data),
  generateReceipt: (data) => api.post('/pdf/receipt', data),
  generateInvoice: (data) => api.post('/pdf/invoice', data),
  download: (filename) => api.get(`/pdf/download/${filename}`, { responseType: 'blob' }),
};

// ========================================
// ECOMMERCE SERVICE (Legacy - keep for compatibility)
// ========================================
export const ecommerceService = {
  getProducts: () => api.get('/client/products'),
  getProductById: (id) => api.get(`/client/products/${id}`),
  getWishlist: () => api.get('/client/wishlist'),
  addToWishlist: (productId) => api.post('/client/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/client/wishlist/${productId}`),
};

// ========================================
// PRODUCT SERVICE (Legacy - keep for compatibility)
// ========================================
export const productService = {
  getProducts: () => api.get('/client/products'),
  getProductById: (id) => api.get(`/client/products/${id}`),
  getVendorProducts: () => api.get('/vendor/products'),
  getCategories: () => api.get('/client/products/categories'),
};

// ========================================
// CART SERVICE
// ========================================
export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart', { productId, quantity }),
  removeFromCart: (productId) => api.delete(`/cart/${productId}`),
  updateQuantity: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  clearCart: () => api.delete('/cart'),
};

// ========================================
// PAYMENT SERVICE
// ========================================
export const paymentService = {
  processPayment: (data) => api.post('/payments', data),
  checkStatus: (checkoutId) => api.get(`/payments/status/${checkoutId}`),
  payPension: (data) => api.post('/payments/pension', data),
  paySadaqa: (data) => api.post('/payments/sadaqa', data),
};

// ========================================
// ORDER SERVICE (Legacy - keep for compatibility)
// ========================================
export const orderService = {
  getOrders: () => api.get('/client/orders'),
  getOrderById: (id) => api.get(`/client/orders/${id}`),
  createOrder: (data) => api.post('/client/orders', data),
  updateOrderStatus: (id, status) => api.put(`/vendor/orders/${id}`, { status }),
  getVendorOrders: () => api.get('/vendor/orders'),
  getMyOrders: () => api.get('/client/orders'),
};

export default api;