import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://itqaan.co.ke/api';
const IMAGE_BASE = 'https://itqaan.co.ke';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('itqaan_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to fix image URLs
api.interceptors.response.use(
  (response) => {
    const fixImageUrls = (data: any): any => {
      if (!data) return data;
      if (Array.isArray(data)) {
        return data.map(item => fixImageUrls(item));
      }
      if (typeof data === 'object') {
        const result: any = {};
        for (const key in data) {
          const value = data[key];
          // Check if it's an image URL
          if (typeof value === 'string' && 
              (key.includes('image') || key.includes('photo') || key.includes('avatar') || key.includes('logo') || key.includes('url')) &&
              value.includes('38.242.200.152')) {
            result[key] = value.replace('https://38.242.200.152', 'https://itqaan.co.ke');
          } else if (Array.isArray(value) && (key === 'images' || key === 'photos' || key === 'gallery')) {
            result[key] = value.map((img: string) => 
              typeof img === 'string' && img.includes('38.242.200.152') 
                ? img.replace('https://38.242.200.152', 'https://itqaan.co.ke') 
                : img
            );
          } else if (typeof value === 'object') {
            result[key] = fixImageUrls(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      return data;
    };

    if (response.data) {
      response.data = fixImageUrls(response.data);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([
        'itqaan_token',
        'itqaan_user',
        'itqaan_role',
        'itqaan_subrole',
        'itqaan_vendor_type',
        'itqaan_leader_type',
      ]);
    }
    return Promise.reject(error);
  }
);

// Helper function to get full image URL
export const getImageUrl = (path: string) => {
  if (!path) return null;
  // Replace IP with domain if present
  let cleanPath = path.replace('https://38.242.200.152', '');
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/')) {
    return `${IMAGE_BASE}${cleanPath}`;
  }
  return `${IMAGE_BASE}/uploads/${cleanPath}`;
};

export const authService = {
  registerClient: (data) => api.post('/auth/register-client', data),
  registerVendor: (data) => api.post('/auth/register-vendor', data),
  registerLeader: (data) => api.post('/auth/register-leader', data),
  loginStep1: (phone) => api.post('/auth/login-step1', { phone }),
  loginStep2: (data) => api.post('/auth/login-step2', data),
  sendRegistrationOtp: (data) => api.post('/auth/send-registration-otp', data),
  verifyRegistrationOtp: (data) => api.post('/auth/verify-registration-otp', data),
  getMe: () => api.get('/auth/me'),
};

export const leaderService = {
  getStats: () => api.get('/leader/dashboard-stats'),
  getProfile: () => api.get('/leader/profile'),
  updateProfile: (data) => api.post('/leader/profile', data),
  getPension: () => api.get('/leader/pension'),
  getPensionHistory: (params) => api.get('/leader/pension/history', { params }),
  getSupporters: () => api.get('/leader/supporters'),
  getNotifications: (params) => api.get('/leader/notifications', { params }),
  getUnreadCount: () => api.get('/leader/notifications/unread-count'),
  shareLink: () => api.post('/leader/share'),
  requestWithdrawal: (data) => api.post('/leader/pension/withdraw-request', data),
  getWithdrawals: () => api.get('/leader/pension/withdrawals'),
  selfContribute: (data) => api.post('/leader/pension/self-contribute', data),
};

export const adminService = {
  login: (data) => api.post('/admin/login', data),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateKYC: (id, data) => api.put(`/admin/users/${id}/kyc`, data),
  getPendingVendors: () => api.get('/admin/pending-vendors'),
  getVendors: (params) => api.get('/admin/vendors', { params }),
  verifyVendor: (id, data) => api.put(`/admin/vendors/${id}/verify`, data),
  getPendingLeaders: () => api.get('/admin/pending-leaders'),
  getLeaders: (params) => api.get('/admin/leaders', { params }),
  verifyLeader: (id, data) => api.put(`/admin/leaders/${id}/verify`, data),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getOverview: () => api.get('/admin/overview'),
  getMosques: (params) => api.get('/admin/mosques', { params }),
  createMosque: (data) => api.post('/admin/mosques', data),
  updateMosque: (id, data) => api.put(`/admin/mosques/${id}`, data),
  deleteMosque: (id) => api.delete(`/admin/mosques/${id}`),
  getMosqueStats: () => api.get('/admin/mosques/stats'),
  getConsultations: (params) => api.get('/admin/consultations', { params }),
  getConsultationStats: () => api.get('/admin/consultations/stats'),
  getHearseRequests: (params) => api.get('/admin/hearse/requests', { params }),
  getHearseProviders: (params) => api.get('/admin/hearse/providers', { params }),
  verifyHearseProvider: (id, data) => api.put(`/admin/hearse/providers/${id}/verify`, data),
  assignHearseRequest: (data) => api.post('/admin/hearse/assign', data),
  getButcheryVendors: (params) => api.get('/admin/butchery/vendors', { params }),
  getButcheryProducts: (params) => api.get('/admin/butchery/products', { params }),
  updateButcheryProductStatus: (id, data) => api.put(`/admin/butchery/products/${id}/status`, data),
  getButcheryStats: () => api.get('/admin/butchery/stats'),
  getHajjPackages: (params) => api.get('/admin/hajj/packages', { params }),
  getHajjBookings: (params) => api.get('/admin/hajj/bookings', { params }),
  updateHajjPackageStatus: (id, data) => api.put(`/admin/hajj/packages/${id}/status`, data),
  cancelHajjBooking: (id, data) => api.put(`/admin/hajj/bookings/${id}/cancel`, data),
  getHajjStats: () => api.get('/admin/hajj/stats'),
  getZakatPayments: (params) => api.get('/zakat/admin/payments', { params }),
  getZakatRecipients: (params) => api.get('/zakat/admin/recipients', { params }),
  createZakatRecipient: (data) => api.post('/zakat/admin/recipients', data),
  updateZakatRecipient: (id, data) => api.put(`/zakat/admin/recipients/${id}`, data),
  getZakatPool: () => api.get('/zakat/admin/pool'),
  disburseZakat: (data) => api.post('/zakat/admin/disburse', data),
  getSadaqaDonations: (params) => api.get('/sadaqa/admin/donations', { params }),
  createSadaqaCampaign: (data) => api.post('/sadaqa/admin/campaigns', data),
  updateSadaqaCampaign: (id, data) => api.put(`/sadaqa/admin/campaigns/${id}`, data),
  deleteSadaqaCampaign: (id) => api.delete(`/sadaqa/admin/campaigns/${id}`),
  getSadaqaPool: () => api.get('/sadaqa/admin/pool'),
  getPendingPensionContributions: () => api.get('/pension/admin/pending'),
  approvePensionContribution: (id, data) => api.put(`/pension/admin/approve/${id}`, data),
  rejectPensionContribution: (id, data) => api.put(`/pension/admin/reject/${id}`, data),
  getPensionAdminStats: () => api.get('/pension/admin/stats'),
  getPensionWithdrawals: (params) => api.get('/pension/admin/withdrawals', { params }),
  approvePensionWithdrawal: (id, data) => api.put(`/pension/admin/withdrawals/${id}/approve`, data),
  rejectPensionWithdrawal: (id, data) => api.put(`/pension/admin/withdrawals/${id}/reject`, data),
  getPendingTakafulClaims: () => api.get('/takaful/admin/claims/pending'),
  approveTakafulClaim: (id, data) => api.put(`/takaful/admin/claims/${id}/approve`, data),
  rejectTakafulClaim: (id, data) => api.put(`/takaful/admin/claims/${id}/reject`, data),
  getTakafulPlans: () => api.get('/takaful/admin/plans'),
  createTakafulPlan: (data) => api.post('/takaful/admin/plans', data),
  updateTakafulPlan: (id, data) => api.put(`/takaful/admin/plans/${id}`, data),
  deleteTakafulPlan: (id) => api.delete(`/takaful/admin/plans/${id}`),
  getTakafulClaimStats: () => api.get('/takaful/admin/claims/stats'),
};

export const vendorService = {
  getStats: () => api.get('/vendor/dashboard-stats'),
  getProfile: () => api.get('/vendor/profile'),
  updateProfile: (data) => api.post('/vendor/profile', data),
  toggleStatus: (data) => api.put('/vendor/profile/toggle-status', data),
  getProducts: () => api.get('/vendor/products'),
  createProduct: (data) => api.post('/vendor/products', data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),
  getOrders: (params) => api.get('/vendor/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/vendor/orders/${id}`, data),
  getBookings: (params) => api.get('/vendor/bookings', { params }),
  updateBookingStatus: (id, data) => api.put(`/vendor/bookings/${id}`, data),
  cancelBooking: (id, data) => api.put(`/vendor/cancel-booking/${id}`, data),
  getListings: () => api.get('/vendor/listings'),
  createListing: (data) => api.post('/vendor/listings', data),
  updateListing: (id, data) => api.put(`/vendor/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/vendor/listings/${id}`),
  updateInventory: (id, data) => api.put(`/vendor/listings/${id}/inventory`, data),
  blockDates: (id, data) => api.post(`/vendor/listings/${id}/block-dates`, data),
  getBlockedDates: (id, params) => api.get(`/vendor/listings/${id}/blocked-dates`, { params }),
  getEarnings: () => api.get('/vendor/earnings'),
  getReviews: () => api.get('/vendor/reviews'),
  getMenuItems: () => api.get('/vendor/menu-items'),
  createMenuItem: (data) => api.post('/vendor/menu-items', data),
  updateMenuItem: (id, data) => api.put(`/vendor/menu-items/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/vendor/menu-items/${id}`),
  uploadImage: (data) => api.post('/vendor/upload-image', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getHajjPackages: () => api.get('/vendor/hajj/packages'),
  createHajjPackage: (data) => api.post('/vendor/hajj/packages', data),
  updateHajjPackage: (id, data) => api.put(`/vendor/hajj/packages/${id}`, data),
  deleteHajjPackage: (id) => api.delete(`/vendor/hajj/packages/${id}`),
  getHajjBookings: (params) => api.get('/vendor/hajj/bookings', { params }),
  updateHajjBookingStatus: (id, data) => api.put(`/vendor/hajj/bookings/${id}/status`, data),
  getHajjStats: () => api.get('/vendor/hajj/stats'),
};

export const clientService = {
  getVendors: (params) => api.get('/client/vendors', { params }),
  getVendorById: (id) => api.get(`/client/vendors/${id}`),
  getProducts: (params) => api.get('/client/products', { params }),
  getProductById: (id) => api.get(`/client/products/${id}`),
  getListings: (params) => api.get('/client/listings', { params }),
  getListingById: (id) => api.get(`/client/listings/${id}`),
  getListingAvailability: (id, params) => api.get(`/client/listings/${id}/availability`, { params }),
  createBooking: (data) => api.post('/client/bookings', data),
  getBookings: () => api.get('/client/bookings'),
  cancelBooking: (id) => api.put(`/client/bookings/${id}/cancel`),
  createOrder: (data) => api.post('/client/orders', data),
  getOrders: () => api.get('/client/orders'),
  getLeaders: (params) => api.get('/client/leaders', { params }),
  getLeaderById: (id) => api.get(`/client/leaders/${id}`),
  supportLeader: (data) => api.post('/client/support-leader', data),
  getSupportedLeaders: () => api.get('/client/supported-leaders'),
  getConsultationLeaders: (params) => api.get('/client/consultation-leaders', { params }),
  getMosques: (params) => api.get('/client/mosques', { params }),
  getMenuItems: (params) => api.get('/client/menu-items', { params }),
  getHajjPackages: (params) => api.get('/client/hajj/packages', { params }),
  getHajjPackageById: (id) => api.get(`/client/hajj/packages/${id}`),
  createHajjBooking: (data) => api.post('/client/hajj/book', data),
  getHajjBookings: (params) => api.get('/client/hajj/bookings', { params }),
  getHajjBookingById: (id) => api.get(`/client/hajj/bookings/${id}`),
  cancelHajjBooking: (id, data) => api.put(`/client/hajj/bookings/${id}/cancel`, data),
};

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

export const mpesaService = {
  stkPush: (data) => api.post('/mpesa/stk-push', data),
  checkStatus: (checkoutId) => api.get(`/mpesa/status/${checkoutId}`),
  getHistory: (params) => api.get('/mpesa/history', { params }),
};

export const zakatService = {
  calculate: (data) => api.post('/zakat/calculate', data),
  payZakat: (data) => api.post('/zakat/pay', data),
  getHistory: () => api.get('/zakat/history'),
  getSummary: () => api.get('/zakat/summary'),
  getZakatDue: () => api.get('/zakat/due'),
  getRecipients: (params) => api.get('/zakat/recipients', { params }),
  adminGetPayments: (params) => api.get('/zakat/admin/payments', { params }),
  adminGetRecipients: (params) => api.get('/zakat/admin/recipients', { params }),
  adminAddRecipient: (data) => api.post('/zakat/admin/recipients', data),
  adminUpdateRecipient: (id, data) => api.put(`/zakat/admin/recipients/${id}`, data),
  adminGetPool: () => api.get('/zakat/admin/pool'),
  adminDisburse: (data) => api.post('/zakat/admin/disburse', data),
};

export const sadaqaService = {
  getCampaigns: (params) => api.get('/sadaqa/campaigns', { params }),
  getCampaignById: (id) => api.get(`/sadaqa/campaigns/${id}`),
  getCategories: () => api.get('/sadaqa/categories'),
  donate: (data) => api.post('/sadaqa/donate', data),
  getHistory: () => api.get('/sadaqa/history'),
  getSummary: () => api.get('/sadaqa/summary'),
  getImpactStats: () => api.get('/sadaqa/impact'),
  adminGetDonations: (params) => api.get('/sadaqa/admin/donations', { params }),
  adminCreateCampaign: (data) => api.post('/sadaqa/admin/campaigns', data),
  adminUpdateCampaign: (id, data) => api.put(`/sadaqa/admin/campaigns/${id}`, data),
  adminDeleteCampaign: (id) => api.delete(`/sadaqa/admin/campaigns/${id}`),
  adminGetPool: () => api.get('/sadaqa/admin/pool'),
};

export const p2pService = {
  searchUsers: (query) => api.get(`/p2p/users?q=${encodeURIComponent(query)}`),
  getUserById: (id) => api.get(`/p2p/users/${id}`),
  getBalance: () => api.get('/p2p/balance'),
  transfer: (data) => api.post('/p2p/transfer', data),
  getTransactions: (limit = 50) => api.get(`/p2p/transactions?limit=${limit}`),
  getTransactionByRef: (reference) => api.get(`/p2p/transactions/${reference}`),
  getStats: () => api.get('/p2p/stats'),
  sync: () => api.post('/p2p/sync'),
  getLoans: () => api.get('/p2p/loans'),
  getLoanRequests: () => api.get('/p2p/loan-requests'),
  getMyLoans: () => api.get('/p2p/my-loans'),
  apply: (data) => api.post('/p2p/apply', data),
  fundLoan: (data) => api.post('/p2p/fund', data),
  repayLoan: (data) => api.post('/p2p/repay', data),
};

export const takafulService = {
  getPlans: () => api.get('/takaful/plans'),
  getPolicy: () => api.get('/takaful/policy'),
  enroll: (data) => api.post('/takaful/enroll', data),
  getFamilyMembers: () => api.get('/takaful/family'),
  addFamilyMember: (data) => api.post('/takaful/family', data),
  removeFamilyMember: (id) => api.delete(`/takaful/family/${id}`),
  getClaims: () => api.get('/takaful/claims'),
  getClaimById: (id) => api.get(`/takaful/claims/${id}`),
  submitClaim: (data) => api.post('/takaful/claims', data),
  getPoolStats: () => api.get('/takaful/pool-stats'),
  getContributions: () => api.get('/takaful/contributions'),
  payMonthlyContribution: (data) => api.post('/takaful/pay-monthly', data),
};

export const pensionService = {
  getStats: () => api.get('/pension/stats'),
  getLeaders: (params) => api.get('/pension/leaders', { params }),
  getLeader: (id) => api.get(`/pension/leaders/${id}`),
  contribute: (data) => api.post('/pension/contribute', data),
  getContributions: (params) => api.get('/pension/contributions', { params }),
};

export const mosqueService = {
  getAll: (params) => api.get('/mosque', { params }),
  getById: (id) => api.get(`/mosque/${id}`),
  add: (data) => api.post('/mosque/add', data),
  update: (id, data) => api.put(`/mosque/${id}`, data),
  delete: (id) => api.delete(`/mosque/${id}`),
  getStats: () => api.get('/mosque/stats/count'),
  getCounties: () => api.get('/mosque/counties/list'),
};

export const mosqueFinderService = {
  getNearbyMosques: (params) => api.get('/mosque-finder/nearby', { params }),
  getMosqueById: (id) => api.get(`/mosque-finder/${id}`),
  getStats: () => api.get('/mosque-finder/stats/summary'),
  searchMosques: (query, params) => api.get(`/mosque-finder/search/${query}`, { params }),
};

export const transactionService = {
  getRecent: (limit = 5) => api.get(`/transactions/recent?limit=${limit}`),
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  getWalletTransactions: () => api.get('/transactions/wallet'),
};

export const utilityService = {
  getUtilities: () => api.get('/utilities'),
  getPaymentHistory: () => api.get('/utilities/history'),
  payBill: (data) => api.post('/utilities/pay', data),
  getSavedServices: () => api.get('/utilities/saved'),
  addFavorite: (data) => api.post('/utilities/saved', data),
  removeFavorite: (id) => api.delete(`/utilities/saved/${id}`),
};

export const hajjService = {
  getPackages: (params) => api.get('/hajj/packages', { params }),
  getPackageById: (id) => api.get(`/hajj/packages/${id}`),
  bookPackage: (data) => api.post('/hajj/book', data),
  getBookings: (params) => api.get('/hajj/bookings', { params }),
  getBookingById: (id) => api.get(`/hajj/bookings/${id}`),
  cancelBooking: (id, data) => api.put(`/hajj/bookings/${id}/cancel`, data),
};

export const hearseService = {
  createRequest: (data) => api.post('/hearse/requests', data),
  getRequests: (params) => api.get('/hearse/requests', { params }),
  getRequestById: (id) => api.get(`/hearse/requests/${id}`),
  getProviderRequests: (params) => api.get('/hearse/provider/requests', { params }),
  acceptRequest: (id) => api.put(`/hearse/provider/requests/${id}/accept`),
  completeRequest: (id) => api.put(`/hearse/provider/requests/${id}/complete`),
  getProviderStats: () => api.get('/hearse/provider/stats'),
  adminGetRequests: (params) => api.get('/hearse/admin/requests', { params }),
  adminAssignRequest: (data) => api.post('/hearse/admin/assign', data),
  adminGetProviders: (params) => api.get('/hearse/admin/providers', { params }),
  adminVerifyProvider: (id, data) => api.put(`/hearse/admin/providers/${id}/verify`, data),
};

export const willService = {
  createWill: (data) => api.post('/wills', data),
  getWills: () => api.get('/wills'),
  getWillById: (id) => api.get(`/wills/${id}`),
  updateWill: (id, data) => api.put(`/wills/${id}`, data),
  calculateInheritance: (data) => api.post('/wills/calculate-inheritance', data),
};

export const bookingService = {
  getBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  createBooking: (data) => api.post('/bookings', data),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  getBookingByRoom: (roomName) => api.get(`/bookings/room/${roomName}`),
  getBookingStats: () => api.get('/bookings/stats/summary'),
  getLeaderTypes: () => api.get('/leader-consultation/types/list'),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart', { product_id: productId, quantity }),
  removeFromCart: (cartId) => api.delete(`/cart/${cartId}`),
  updateQuantity: (cartId, quantity) => api.put(`/cart/${cartId}`, { quantity }),
  clearCart: () => api.delete('/cart'),
};

export const paymentService = {
  processPayment: (data) => api.post('/payments', data),
  checkStatus: (checkoutId) => api.get(`/payments/status/${checkoutId}`),
  payPension: (data) => api.post('/payments/pension', data),
  paySadaqa: (data) => api.post('/payments/sadaqa', data),
};

export const pdfService = {
  generateWill: (data) => api.post('/pdf/will', data),
  generateReceipt: (data) => api.post('/pdf/receipt', data),
  generateInvoice: (data) => api.post('/pdf/invoice', data),
  download: (filename) => api.get(`/pdf/download/${filename}`, { responseType: 'blob' }),
};

export const kycService = {
  getApplications: () => api.get('/kyc/applications'),
  createApplication: (data) => api.post('/kyc/applications', data),
  getApplicationById: (id) => api.get(`/kyc/applications/${id}`),
  uploadDocuments: (id, data) => api.post(`/kyc/applications/${id}/documents`, data),
  resubmitApplication: (id) => api.post(`/kyc/applications/${id}/resubmit`),
  getStatus: () => api.get('/kyc/status'),
};

export const prayerService = {
  getPrayerTimes: (lat, lng) => api.get(`/prayer/times?lat=${lat}&lng=${lng}`),
  getCityPrayerTimes: (city) => api.get(`/prayer/times/${city}`),
};

// ========================================
// LIVEKIT SERVICE (Video/Audio Streaming)
// ========================================
export const livekitService = {
  getToken: (data) => api.post('/livekit/token', data),
};

export default api;