import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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

export const authService = {
  register: (data) => api.post('/auth/register', data),
  loginStep1: (phone) => api.post('/auth/login-step1', { phone }),
  loginStep2: (data) => api.post('/auth/login-step2', data),
};

export const walletService = {
  getBalance: () => api.get('/wallet/balance'),
  topup: (data) => api.post('/wallet/topup', data),
};

export const mpesaService = {
  stkPush: (data) => api.post('/mpesa/stk-push', data),
  checkStatus: (checkoutId) => api.get(`/mpesa/status/${checkoutId}`),
};

export const zakatService = {
  calculate: (data) => api.post('/zakat/calculate', data),
  pay: (data) => api.post('/zakat/pay', data),
};

export const sadaqaService = {
  getCampaigns: () => api.get('/sadaqa/campaigns'),
  donate: (data) => api.post('/sadaqa/donate', data),
};

export const p2pService = {
  getLoans: () => api.get('/p2p'),
  apply: (data) => api.post('/p2p/apply', data),
};

export const takafulService = {
  getPlans: () => api.get('/takaful/plans'),
  join: (data) => api.post('/takaful/join', data),
};

export default api;
