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
  updateKYC: (id, data) => api.put(`/admin/users/${id}/kyc`, data),
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
  // Mosques
  getMosques: (params) => api.get('/admin/mosques', { params }),
  createMosque: (data) => api.post('/admin/mosques', data),
  updateMosque: (id, data) => api.put(`/admin/mosques/${id}`, data),
  deleteMosque: (id) => api.delete(`/admin/mosques/${id}`),
  getMosqueStats: () => api.get('/admin/mosques/stats'),
  // Consultations
  getConsultations: (params) => api.get('/admin/consultations', { params }),
  getConsultationStats: () => api.get('/admin/consultations/stats'),
  // Hearse
  getHearseRequests: (params) => api.get('/admin/hearse/requests', { params }),
  getHearseProviders: (params) => api.get('/admin/hearse/providers', { params }),
  verifyHearseProvider: (id, data) => api.put(`/admin/hearse/providers/${id}/verify`, data),
  assignHearseRequest: (data) => api.post('/admin/hearse/assign', data),
  // Butchery
  getButcheryVendors: (params) => api.get('/admin/butchery/vendors', { params }),
  getButcheryProducts: (params) => api.get('/admin/butchery/products', { params }),
  updateButcheryProductStatus: (id, data) => api.put(`/admin/butchery/products/${id}/status`, data),
  getButcheryStats: () => api.get('/admin/butchery/stats'),
  // Hajj
  getHajjPackages: (params) => api.get('/admin/hajj/packages', { params }),
  getHajjBookings: (params) => api.get('/admin/hajj/bookings', { params }),
  updateHajjPackageStatus: (id, data) => api.put(`/admin/hajj/packages/${id}/status`, data),
  cancelHajjBooking: (id, data) => api.put(`/admin/hajj/bookings/${id}/cancel`, data),
  getHajjStats: () => api.get('/admin/hajj/stats'),
  // Zakat
  getZakatPayments: (params) => api.get('/zakat/admin/payments', { params }),
  getZakatRecipients: (params) => api.get('/zakat/admin/recipients', { params }),
  createZakatRecipient: (data) => api.post('/zakat/admin/recipients', data),
  updateZakatRecipient: (id, data) => api.put(`/zakat/admin/recipients/${id}`, data),
  getZakatPool: () => api.get('/zakat/admin/pool'),
  disburseZakat: (data) => api.post('/zakat/admin/disburse', data),
  // Sadaqa
  getSadaqaDonations: (params) => api.get('/sadaqa/admin/donations', { params }),
  createSadaqaCampaign: (data) => api.post('/sadaqa/admin/campaigns', data),
  updateSadaqaCampaign: (id, data) => api.put(`/sadaqa/admin/campaigns/${id}`, data),
  deleteSadaqaCampaign: (id) => api.delete(`/sadaqa/admin/campaigns/${id}`),
  getSadaqaPool: () => api.get('/sadaqa/admin/pool'),

  // ============================================================
  // PENSION ADMIN FUNCTIONS (NEW)
  // ============================================================
  getPendingPensionContributions: () => api.get('/pension/admin/pending'),
  approvePensionContribution: (id, data) => api.put(`/pension/admin/approve/${id}`, data),
  rejectPensionContribution: (id, data) => api.put(`/pension/admin/reject/${id}`, data),
  getPensionAdminStats: () => api.get('/pension/admin/stats'),

  // ============================================================
  // TAKAFUL ADMIN FUNCTIONS (NEW)
  // ============================================================
  getPendingTakafulClaims: () => api.get('/takaful/admin/claims/pending'),
  approveTakafulClaim: (id, data) => api.put(`/takaful/admin/claims/${id}/approve`, data),
  rejectTakafulClaim: (id, data) => api.put(`/takaful/admin/claims/${id}/reject`, data),
  getTakafulPlans: () => api.get('/takaful/admin/plans'),
  createTakafulPlan: (data) => api.post('/takaful/admin/plans', data),
  updateTakafulPlan: (id, data) => api.put(`/takaful/admin/plans/${id}`, data),
  deleteTakafulPlan: (id) => api.delete(`/takaful/admin/plans/${id}`),
  getTakafulClaimStats: () => api.get('/takaful/admin/claims/stats'),
};

// ========================================
// VENDOR SERVICE
// ========================================
export const vendorService = {
  // Dashboard
  getStats: () => api.get('/vendor/dashboard-stats'),
  getProfile: () => api.get('/vendor/profile'),
  updateProfile: (data) => api.post('/vendor/profile', data),
  toggleStatus: (data) => api.put('/vendor/profile/toggle-status', data),
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
  cancelBooking: (id, data) => api.put(`/vendor/cancel-booking/${id}`, data),
  // Listings (HalalStay)
  getListings: () => api.get('/vendor/listings'),
  createListing: (data) => api.post('/vendor/listings', data),
  updateListing: (id, data) => api.put(`/vendor/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/vendor/listings/${id}`),
  updateInventory: (id, data) => api.put(`/vendor/listings/${id}/inventory`, data),
  blockDates: (id, data) => api.post(`/vendor/listings/${id}/block-dates`, data),
  getBlockedDates: (id, params) => api.get(`/vendor/listings/${id}/blocked-dates`, { params }),
  // Earnings
  getEarnings: () => api.get('/vendor/earnings'),
  // Reviews
  getReviews: () => api.get('/vendor/reviews'),
  // Menu Items
  getMenuItems: () => api.get('/vendor/menu-items'),
  createMenuItem: (data) => api.post('/vendor/menu-items', data),
  updateMenuItem: (id, data) => api.put(`/vendor/menu-items/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/vendor/menu-items/${id}`),
  // Upload Image
  uploadImage: (data) => api.post('/vendor/upload-image', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // ============================================================
  // HAJJ PACKAGE MANAGEMENT (Vendor)
  // ============================================================
  getHajjPackages: () => api.get('/vendor/hajj/packages'),
  createHajjPackage: (data) => api.post('/vendor/hajj/packages', data),
  updateHajjPackage: (id, data) => api.put(`/vendor/hajj/packages/${id}`, data),
  deleteHajjPackage: (id) => api.delete(`/vendor/hajj/packages/${id}`),
  getHajjBookings: (params) => api.get('/vendor/hajj/bookings', { params }),
  getHajjStats: () => api.get('/vendor/hajj/stats'),
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
  // Hajj
  getHajjPackages: (params) => api.get('/client/hajj/packages', { params }),
  getHajjPackageById: (id) => api.get(`/client/hajj/packages/${id}`),
  createHajjBooking: (data) => api.post('/client/hajj/book', data),
  getHajjBookings: (params) => api.get('/client/hajj/bookings', { params }),
  getHajjBookingById: (id) => api.get(`/client/hajj/bookings/${id}`),
  cancelHajjBooking: (id, data) => api.put(`/client/hajj/bookings/${id}/cancel`, data),
};

// ========================================
// WALLET SERVICE
// ========================================
export const walletService = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  getAccount: () => api.get('/wallet/account'),
  deposit: (data) => api.post('/wallet/deposit', data),
  withdraw: (data) => api.post('/wallet/withdraw', data),
  transfer: (data) => api.post('/wallet/transfer', data),
  getStats: () => api.get('/wallet/stats'),
  sync: () => api.post('/wallet/sync'),
  getTransactionByRef: (ref) => api.get(`/wallet/transaction/${ref}`),
};

// ========================================
// M-PESA SERVICE
// ========================================
export const mpesaService = {
  stkPush: (data) => api.post('/mpesa/stk-push', data),
  checkStatus: (checkoutId) => api.get(`/mpesa/status/${checkoutId}`),
  getHistory: (params) => api.get('/mpesa/history', { params }),
};

// ========================================
// ZAKAT SERVICE
// ========================================
export const zakatService = {
  // Calculate Zakat
  calculate: (data) => api.post('/zakat/calculate', data),
  // Pay Zakat
  payZakat: (data) => api.post('/zakat/pay', data),
  // Get Zakat history
  getHistory: () => api.get('/zakat/history'),
  // Get Zakat summary
  getSummary: () => api.get('/zakat/summary'),
  // Get Zakat due for current user
  getZakatDue: () => api.get('/zakat/due'),
  // Get verified recipients
  getRecipients: (params) => api.get('/zakat/recipients', { params }),
  // Admin: Get all Zakat payments
  adminGetPayments: (params) => api.get('/zakat/admin/payments', { params }),
  // Admin: Get all recipients
  adminGetRecipients: (params) => api.get('/zakat/admin/recipients', { params }),
  // Admin: Add recipient
  adminAddRecipient: (data) => api.post('/zakat/admin/recipients', data),
  // Admin: Update recipient
  adminUpdateRecipient: (id, data) => api.put(`/zakat/admin/recipients/${id}`, data),
  // Admin: Get pool balance
  adminGetPool: () => api.get('/zakat/admin/pool'),
  // Admin: Disburse funds
  adminDisburse: (data) => api.post('/zakat/admin/disburse', data),
};

// ========================================
// SADAQA SERVICE
// ========================================
export const sadaqaService = {
  // Get all campaigns
  getCampaigns: (params) => api.get('/sadaqa/campaigns', { params }),
  // Get campaign by ID
  getCampaignById: (id) => api.get(`/sadaqa/campaigns/${id}`),
  // Get campaign categories
  getCategories: () => api.get('/sadaqa/categories'),
  // Donate to campaign
  donate: (data) => api.post('/sadaqa/donate', data),
  // Get donation history
  getHistory: () => api.get('/sadaqa/history'),
  // Get donation summary
  getSummary: () => api.get('/sadaqa/summary'),
  // Get impact stats
  getImpactStats: () => api.get('/sadaqa/impact'),
  // Admin: Get all donations
  adminGetDonations: (params) => api.get('/sadaqa/admin/donations', { params }),
  // Admin: Create campaign
  adminCreateCampaign: (data) => api.post('/sadaqa/admin/campaigns', data),
  // Admin: Update campaign
  adminUpdateCampaign: (id, data) => api.put(`/sadaqa/admin/campaigns/${id}`, data),
  // Admin: Delete campaign
  adminDeleteCampaign: (id) => api.delete(`/sadaqa/admin/campaigns/${id}`),
  // Admin: Get pool
  adminGetPool: () => api.get('/sadaqa/admin/pool'),
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
  // Sync balance
  sync: () => api.post('/p2p/sync'),
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
  // Monthly Payment
  payMonthlyContribution: (data) => api.post('/takaful/pay-monthly', data),
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
// MOSQUE FINDER SERVICE (Public Mosque Search)
// ========================================
export const mosqueFinderService = {
  // Get nearby mosques (database + OSM fallback)
  getNearbyMosques: (params) => api.get('/mosque-finder/nearby', { params }),
  // Get mosque by ID
  getMosqueById: (id) => api.get(`/mosque-finder/${id}`),
  // Get mosque statistics
  getStats: () => api.get('/mosque-finder/stats/summary'),
  // Search mosques by name or city
  searchMosques: (query, params) => api.get(`/mosque-finder/search/${query}`, { params }),
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
// UTILITY SERVICE
// ========================================
export const utilityService = {
  getUtilities: () => api.get('/utilities'),
  getPaymentHistory: () => api.get('/utilities/history'),
  payBill: (data) => api.post('/utilities/pay', data),
  getSavedServices: () => api.get('/utilities/saved'),
  addFavorite: (data) => api.post('/utilities/saved', data),
  removeFavorite: (id) => api.delete(`/utilities/saved/${id}`),
};

// ========================================
// HAJJ SERVICE
// ========================================
export const hajjService = {
  getPackages: (params) => api.get('/hajj/packages', { params }),
  getPackageById: (id) => api.get(`/hajj/packages/${id}`),
  bookPackage: (data) => api.post('/hajj/book', data),
  getBookings: (params) => api.get('/hajj/bookings', { params }),
  getBookingById: (id) => api.get(`/hajj/bookings/${id}`),
  cancelBooking: (id, data) => api.put(`/hajj/bookings/${id}/cancel`, data),
};

// ========================================
// HEARSE SERVICE
// ========================================
export const hearseService = {
  // User endpoints
  createRequest: (data) => api.post('/hearse/requests', data),
  getRequests: (params) => api.get('/hearse/requests', { params }),
  getRequestById: (id) => api.get(`/hearse/requests/${id}`),
  // Provider endpoints
  getProviderRequests: (params) => api.get('/hearse/provider/requests', { params }),
  acceptRequest: (id) => api.put(`/hearse/provider/requests/${id}/accept`),
  completeRequest: (id) => api.put(`/hearse/provider/requests/${id}/complete`),
  getProviderStats: () => api.get('/hearse/provider/stats'),
  // Admin endpoints
  adminGetRequests: (params) => api.get('/hearse/admin/requests', { params }),
  adminAssignRequest: (data) => api.post('/hearse/admin/assign', data),
  adminGetProviders: (params) => api.get('/hearse/admin/providers', { params }),
  adminVerifyProvider: (id, data) => api.put(`/hearse/admin/providers/${id}/verify`, data),
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
// PDF SERVICE (For Will Downloads)
// ========================================
export const pdfService = {
  generateWill: (data) => api.post('/pdf/will', data),
  generateReceipt: (data) => api.post('/pdf/receipt', data),
  generateInvoice: (data) => api.post('/pdf/invoice', data),
  download: (filename) => api.get(`/pdf/download/${filename}`, { responseType: 'blob' }),
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
// PRAYER SERVICE
// ========================================
export const prayerService = {
  getPrayerTimes: (lat, lng) => api.get(`/prayer/times?lat=${lat}&lng=${lng}`),
  getCityPrayerTimes: (city) => api.get(`/prayer/times/${city}`),
};

// ========================================
// LEGACY SERVICES (Keep for backward compatibility)
// ========================================
export const ecommerceService = {
  getProducts: () => api.get('/client/products'),
  getProductById: (id) => api.get(`/client/products/${id}`),
  getWishlist: () => api.get('/client/wishlist'),
  addToWishlist: (productId) => api.post('/client/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/client/wishlist/${productId}`),
};

export const productService = {
  getProducts: () => api.get('/client/products'),
  getProductById: (id) => api.get(`/client/products/${id}`),
  getVendorProducts: () => api.get('/vendor/products'),
  getCategories: () => api.get('/client/products/categories'),
};

export const orderService = {
  getOrders: () => api.get('/client/orders'),
  getOrderById: (id) => api.get(`/client/orders/${id}`),
  createOrder: (data) => api.post('/client/orders', data),
  updateOrderStatus: (id, status) => api.put(`/vendor/orders/${id}`, { status }),
  getVendorOrders: () => api.get('/vendor/orders'),
  getMyOrders: () => api.get('/client/orders'),
};

export default api;