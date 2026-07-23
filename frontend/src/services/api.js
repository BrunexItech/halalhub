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
  register: (data) => api.post('/auth/register', data),
  registerVendor: (data) => api.post('/auth/register-vendor', data),
  loginStep1: (phone) => api.post('/auth/login-step1', { phone }),
  loginStep2: (data) => api.post('/auth/login-step2', data),
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
  getLoans: () => api.get('/p2p'),
  getLoanRequests: () => api.get('/p2p/requests'),
  getMyLoans: () => api.get('/p2p/my-loans'),
  apply: (data) => api.post('/p2p/apply', data),
  fundLoan: (data) => api.post('/p2p/fund', data),
  repayLoan: (data) => api.post('/p2p/repay', data),
};

// ========================================
// TAKAFUL SERVICE
// ========================================
export const takafulService = {
  getPlans: () => api.get('/takaful/plans'),
  join: (data) => api.post('/takaful/join', data),
  getMyPolicy: () => api.get('/takaful/my-policy'),
  getClaims: () => api.get('/takaful/claims'),
  submitClaim: (data) => api.post('/takaful/claims', data),
  getPoolStats: () => api.get('/takaful/pool-stats'),
  addFamilyMember: (data) => api.post('/takaful/family', data),
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
// ORDER SERVICE
// ========================================
export const orderService = {
  getOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getVendorOrders: () => api.get('/orders/vendor'),
  getMyOrders: () => api.get('/orders/my-orders'),
};

// ========================================
// VENDOR SERVICE
// ========================================
export const vendorService = {
  getStats: () => api.get('/vendor/stats'),
  getProducts: () => api.get('/vendor/products'),
  addProduct: (data) => api.post('/vendor/products', data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),
};

// ========================================
// PRODUCT SERVICE (Ecommerce)
// ========================================
export const productService = {
  getProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  getVendorProducts: () => api.get('/products/vendor'),
  getCategories: () => api.get('/products/categories'),
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
// ECOMMERCE SERVICE
// ========================================
export const ecommerceService = {
  getProducts: () => api.get('/ecommerce/products'),
  getProductById: (id) => api.get(`/ecommerce/products/${id}`),
  getWishlist: () => api.get('/ecommerce/wishlist'),
  addToWishlist: (productId) => api.post('/ecommerce/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/ecommerce/wishlist/${productId}`),
};

// ========================================
// PENSION SERVICE
// ========================================
export const pensionService = {
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
};

// ========================================
// KADHI SERVICE
// ========================================
export const kadhiService = {
  getKadhis: () => api.get('/kadhis'),
  getKadhiById: (id) => api.get(`/kadhis/${id}`),
  getReviews: (kadhiId) => api.get(`/kadhis/${kadhiId}/reviews`),
  addReview: (data) => api.post('/kadhis/reviews', data),
};

// ========================================
// BOOKING SERVICE (Kadhis)
// ========================================
export const bookingService = {
  getBookings: () => api.get('/bookings'),
  createBooking: (data) => api.post('/bookings', data),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
};

// ========================================
// MOSQUE SERVICE
// ========================================
export const mosqueService = {
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
// ADMIN SERVICE
// ========================================
export const adminService = {
  login: (data) => api.post('/admin/login', data),
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateKYC: (id, data) => api.put(`/admin/users/${id}/kyc`, data),
  getStats: () => api.get('/admin/stats'),
  getOrders: () => api.get('/admin/orders'),
  getTransactions: () => api.get('/admin/transactions'),
};

export default api;