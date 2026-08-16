import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Components
import StatsGrid from './components/StatsGrid';
import PendingTab from './tabs/PendingTab';
import UsersTab from './tabs/UsersTab';
import TransactionsTab from './tabs/TransactionsTab';
import ZakatTab from './tabs/ZakatTab';
import SadaqaTab from './tabs/SadaqaTab';
import HearseTab from './tabs/HearseTab';
import ButcheryTab from './tabs/ButcheryTab';
import HajjTab from './tabs/HajjTab';
import PensionTab from './tabs/PensionTab';
import TakafulTab from './tabs/TakafulTab';
import ModalsWrapper from './components/ModalsWrapper';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('pending');
  const [activeUserTab, setActiveUserTab] = useState('all');
  
  // Data State
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKYC, setFilterKYC] = useState('All');
  const [filterLeaderType, setFilterLeaderType] = useState('All');
  
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingLeaders, setPendingLeaders] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('All');
  const [txStatusFilter, setTxStatusFilter] = useState('All');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [txStats, setTxStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });
  
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    videoBookings: 0
  });
  
  // Zakat State
  const [zakatPayments, setZakatPayments] = useState([]);
  const [zakatRecipients, setZakatRecipients] = useState([]);
  const [zakatPool, setZakatPool] = useState({ zakatBalance: 0, totalDisbursed: 0 });
  const [loadingZakat, setLoadingZakat] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    bank_name: '',
    bank_account: '',
    mpesa_number: ''
  });
  const [loadingRecipientForm, setLoadingRecipientForm] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseForm, setDisburseForm] = useState({
    recipientId: '',
    amount: '',
    type: 'zakat',
    notes: ''
  });
  const [loadingDisburse, setLoadingDisburse] = useState(false);
  
  // Sadaqa State
  const [sadaqaDonations, setSadaqaDonations] = useState([]);
  const [sadaqaCampaigns, setSadaqaCampaigns] = useState([]);
  const [sadaqaPool, setSadaqaPool] = useState({ sadaqaBalance: 0, totalDisbursed: 0 });
  const [loadingSadaqa, setLoadingSadaqa] = useState(false);
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    organization: '',
    target: '',
    category: '',
    location: '',
    image_url: '',
    end_date: '',
    featured: false
  });
  const [loadingCampaignForm, setLoadingCampaignForm] = useState(false);
  
  // Hearse State
  const [hearseRequests, setHearseRequests] = useState([]);
  const [hearseProviders, setHearseProviders] = useState([]);
  const [loadingHearse, setLoadingHearse] = useState(false);
  const [hearseRequestFilter, setHearseRequestFilter] = useState('all');
  const [hearseProviderFilter, setHearseProviderFilter] = useState('all');
  const [hearseStats, setHearseStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    requestId: '',
    providerId: '',
    notes: ''
  });
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [hearseSubTab, setHearseSubTab] = useState('requests');
  
  // Butchery State
  const [butcheryVendors, setButcheryVendors] = useState([]);
  const [butcheryProducts, setButcheryProducts] = useState([]);
  const [butcheryStats, setButcheryStats] = useState({
    totalButchers: 0,
    activeButchers: 0,
    pendingButchers: 0,
    totalMeatProducts: 0,
    activeMeatProducts: 0
  });
  const [loadingButchery, setLoadingButchery] = useState(false);
  const [butcheryVendorFilter, setButcheryVendorFilter] = useState('all');
  const [butcheryProductFilter, setButcheryProductFilter] = useState('all');
  const [butcheryMeatTypeFilter, setButcheryMeatTypeFilter] = useState('all');
  const [butcherySubTab, setButcherySubTab] = useState('vendors');
  
  // Hajj State
  const [hajjPackages, setHajjPackages] = useState([]);
  const [hajjBookings, setHajjBookings] = useState([]);
  const [hajjStats, setHajjStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    inactivePackages: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0
  });
  const [loadingHajj, setLoadingHajj] = useState(false);
  const [hajjPackageFilter, setHajjPackageFilter] = useState('all');
  const [hajjBookingFilter, setHajjBookingFilter] = useState('all');
  const [hajjTypeFilter, setHajjTypeFilter] = useState('all');
  const [hajjSubTab, setHajjSubTab] = useState('packages');
  const [showHajjBookingModal, setShowHajjBookingModal] = useState(false);
  const [selectedHajjBooking, setSelectedHajjBooking] = useState(null);

  // Pension State
  const [pensionWithdrawals, setPensionWithdrawals] = useState([]);
  const [pensionStats, setPensionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0
  });
  const [loadingPension, setLoadingPension] = useState(false);
  const [pensionFilter, setPensionFilter] = useState('all');

  // Takaful State
  const [takafulClaims, setTakafulClaims] = useState([]);
  const [takafulPlans, setTakafulPlans] = useState([]);
  const [takafulClaimStats, setTakafulClaimStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAmount: 0,
    approvedAmount: 0
  });
  const [loadingTakaful, setLoadingTakaful] = useState(false);
  const [takafulSubTab, setTakafulSubTab] = useState('claims');
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    type: '',
    coverage: '',
    monthlyCost: '',
    annualCost: '',
    maxCoverage: '',
    benefits: [],
    isActive: true
  });
  const [loadingPlanForm, setLoadingPlanForm] = useState(false);
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Constants
  const zakatCategories = [
    'mosque', 'orphan', 'needy', 'debt', 'emergency', 'education', 'health', 'general'
  ];
  const sadaqaCategories = [
    'orphan', 'masjid', 'water', 'education', 'medical', 'emergency', 'imam', 'community'
  ];
  const LEADER_TYPES = [
    'islamic_scholar',
    'imam',
    'adhan_caller',
    'ustadh',
    'ustadha',
    'kadhi'
  ];
  const LEADER_TYPE_LABELS = {
    'islamic_scholar': 'Islamic Scholar',
    'imam': 'Imam',
    'adhan_caller': 'Adhan Caller',
    'ustadh': 'Ustadh',
    'ustadha': 'Ustadha',
    'kadhi': 'Kadhi'
  };

  // ==================== HELPER FUNCTIONS ====================
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'verified': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Verified' },
      'pending': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
      'rejected': { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
      'active': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
      'inactive': { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Inactive' },
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
      'success': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Success' },
      'failed': { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
      'cancelled': { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Cancelled' },
      'confirmed': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Confirmed' },
      'assigned': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Assigned' },
      'in_progress': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'In Progress' },
      'approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Approved' }
    };
    return statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-500', label: status || 'N/A' };
  };

  const getRoleBadge = (role) => {
    const roles = {
      'vendor': 'bg-amber-50 text-amber-700',
      'admin': 'bg-red-50 text-red-700',
      'client': 'bg-blue-50 text-blue-700',
      'leader': 'bg-purple-50 text-purple-700',
      'imam': 'bg-purple-50 text-purple-700'
    };
    return roles[role] || 'bg-gray-50 text-gray-500';
  };

  const getLeaderTypeLabel = (type) => {
    return LEADER_TYPE_LABELS[type] || type;
  };

  const getLeaderUserId = (leader) => {
    if (leader.user_id) return leader.user_id;
    if (leader.id && leader.id.startsWith('lprof-')) {
      return leader.user_id || leader.id;
    }
    return leader.id;
  };

  const getVendorUserId = (vendor) => {
    if (vendor.user_id) return vendor.user_id;
    return vendor.id;
  };

  const getCurrentUsers = () => {
    switch(activeUserTab) {
      case 'clients': return clients;
      case 'vendors': return vendors;
      case 'leaders': return leaders;
      case 'admins': return admins;
      default: return allUsers;
    }
  };

  const getCurrentUserCount = () => {
    switch(activeUserTab) {
      case 'clients': return clients.length;
      case 'vendors': return vendors.length;
      case 'leaders': return leaders.length;
      case 'admins': return admins.length;
      default: return allUsers.length;
    }
  };

  const filteredUsers = getCurrentUsers().filter(user => {
    const matchesSearch = 
      (user.fullname || user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || '').includes(searchQuery);
    const matchesKYC = filterKYC === 'All' || (user.kycstatus || 'pending') === filterKYC;
    return matchesSearch && matchesKYC;
  });

  const filteredPendingLeaders = pendingLeaders.filter(leader => {
    if (filterLeaderType === 'All') return true;
    return leader.leader_type === filterLeaderType;
  });

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      (tx.id || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
      (tx.user_name || tx.user_id || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
      (tx.reference || '').toLowerCase().includes(txSearchQuery.toLowerCase());
    const matchesType = txTypeFilter === 'All' || tx.type === txTypeFilter;
    const matchesStatus = txStatusFilter === 'All' || tx.status === txStatusFilter;
    
    let matchesDate = true;
    if (txDateFrom) {
      const txDate = new Date(tx.created_at || tx.createdAt || tx.date);
      const fromDate = new Date(txDateFrom);
      matchesDate = matchesDate && txDate >= fromDate;
    }
    if (txDateTo) {
      const txDate = new Date(tx.created_at || tx.createdAt || tx.date);
      const toDate = new Date(txDateTo);
      matchesDate = matchesDate && txDate <= toDate;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const filteredHearseRequests = hearseRequests.filter(req => {
    if (hearseRequestFilter === 'all') return true;
    return req.status === hearseRequestFilter;
  });

  const filteredHearseProviders = hearseProviders.filter(prov => {
    if (hearseProviderFilter === 'all') return true;
    if (hearseProviderFilter === 'verified') {
      return prov.is_verified && prov.verification_status === 'approved';
    }
    if (hearseProviderFilter === 'pending') {
      return prov.verification_status === 'pending';
    }
    if (hearseProviderFilter === 'rejected') {
      return prov.verification_status === 'rejected';
    }
    return true;
  });

  const filteredPensionWithdrawals = pensionWithdrawals.filter(w => {
    if (pensionFilter === 'all') return true;
    return w.status === pensionFilter;
  });

  const filteredButcheryVendors = butcheryVendors.filter(vendor => {
    if (butcheryVendorFilter === 'all') return true;
    return vendor.vendor_status === butcheryVendorFilter;
  });

  const filteredButcheryProducts = butcheryProducts.filter(product => {
    const matchesMeatType = butcheryMeatTypeFilter === 'all' || product.meat_type === butcheryMeatTypeFilter;
    const matchesStatus = butcheryProductFilter === 'all' || 
      (butcheryProductFilter === 'active' ? product.is_active : !product.is_active);
    return matchesMeatType && matchesStatus;
  });

  const filteredHajjPackages = hajjPackages.filter(pkg => {
    const matchesStatus = hajjPackageFilter === 'all' || 
      (hajjPackageFilter === 'active' ? pkg.is_active : !pkg.is_active);
    const matchesType = hajjTypeFilter === 'all' || pkg.type === hajjTypeFilter;
    return matchesStatus && matchesType;
  });

  const filteredHajjBookings = hajjBookings.filter(booking => {
    if (hajjBookingFilter === 'all') return true;
    return booking.status === hajjBookingFilter;
  });

  // ==================== DATA FETCHING ====================

  const fetchData = async () => {
    setLoadingData(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users?limit=500`, config),
        axios.get(`${API_BASE}/admin/stats`, config)
      ]);
      
      const allUsersData = usersRes.data.users || [];
      setAllUsers(allUsersData);
      setStats(statsRes.data || {});
      
      setClients(allUsersData.filter(u => u.role === 'client'));
      setVendors(allUsersData.filter(u => u.role === 'vendor'));
      
      const leaderUsers = allUsersData.filter(u => u.role === 'leader' || u.role === 'imam');
      setLeaders(leaderUsers);
      
      setAdmins(allUsersData.filter(u => u.role === 'admin'));
      setUsers(allUsersData);
      
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPendingApplications = async () => {
    setLoadingPending(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [vendorsRes, leadersRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/pending-vendors`, config),
        axios.get(`${API_BASE}/admin/pending-leaders`, config)
      ]);
      setPendingVendors(vendorsRes.data.vendors || []);
      setPendingLeaders(leadersRes.data.leaders || []);
    } catch (err) {
      console.error('Failed to fetch pending applications:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/admin/transactions?limit=200`, config);
      const txData = response.data.transactions || [];
      setTransactions(txData);
      
      const completed = txData.filter(t => t.status === 'completed' || t.status === 'success');
      const pending = txData.filter(t => t.status === 'pending');
      const failed = txData.filter(t => t.status === 'failed' || t.status === 'cancelled');
      const totalAmount = completed.reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
      
      setTxStats({
        total: txData.length,
        completed: completed.length,
        pending: pending.length,
        failed: failed.length,
        totalAmount: totalAmount
      });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchConsultationStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/admin/consultations/stats`, config);
      if (response.data.success) {
        setConsultationStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch consultation stats:', err);
    }
  };

  const fetchZakatData = async () => {
    setLoadingZakat(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [paymentsRes, recipientsRes, poolRes] = await Promise.all([
        axios.get(`${API_BASE}/zakat/admin/payments`, config),
        axios.get(`${API_BASE}/zakat/admin/recipients`, config),
        axios.get(`${API_BASE}/zakat/admin/pool`, config)
      ]);
      
      if (paymentsRes.data.success) {
        setZakatPayments(paymentsRes.data.payments || []);
      }
      if (recipientsRes.data.success) {
        setZakatRecipients(recipientsRes.data.recipients || []);
      }
      if (poolRes.data.success) {
        setZakatPool(poolRes.data.pool);
      }
    } catch (err) {
      console.error('Failed to fetch Zakat data:', err);
    } finally {
      setLoadingZakat(false);
    }
  };

  const fetchSadaqaData = async () => {
    setLoadingSadaqa(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [donationsRes, campaignsRes, poolRes] = await Promise.all([
        axios.get(`${API_BASE}/sadaqa/admin/donations`, config),
        axios.get(`${API_BASE}/sadaqa/campaigns`, config),
        axios.get(`${API_BASE}/sadaqa/admin/pool`, config)
      ]);
      
      if (donationsRes.data.success) {
        setSadaqaDonations(donationsRes.data.donations || []);
      }
      if (campaignsRes.data.success) {
        setSadaqaCampaigns(campaignsRes.data.campaigns || []);
      }
      if (poolRes.data.success) {
        setSadaqaPool(poolRes.data.pool);
      }
    } catch (err) {
      console.error('Failed to fetch Sadaqa data:', err);
    } finally {
      setLoadingSadaqa(false);
    }
  };

  const fetchHearseData = async () => {
    setLoadingHearse(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [requestsRes, providersRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/hearse/requests?limit=200`, config),
        axios.get(`${API_BASE}/admin/hearse/providers?limit=200`, config)
      ]);
      
      if (requestsRes.data.success) {
        const requests = requestsRes.data.requests || [];
        setHearseRequests(requests);
        
        const pending = requests.filter(r => r.status === 'pending');
        const assigned = requests.filter(r => r.status === 'assigned');
        const inProgress = requests.filter(r => r.status === 'in_progress');
        const completed = requests.filter(r => r.status === 'completed');
        
        setHearseStats({
          total: requests.length,
          pending: pending.length,
          assigned: assigned.length,
          inProgress: inProgress.length,
          completed: completed.length
        });
      }
      
      if (providersRes.data.success) {
        setHearseProviders(providersRes.data.providers || []);
      }
    } catch (err) {
      console.error('Failed to fetch hearse data:', err);
    } finally {
      setLoadingHearse(false);
    }
  };

  const fetchButcheryData = async () => {
    setLoadingButchery(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [vendorsRes, productsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/butchery/vendors?limit=200`, config),
        axios.get(`${API_BASE}/admin/butchery/products?limit=200`, config),
        axios.get(`${API_BASE}/admin/butchery/stats`, config)
      ]);
      
      if (vendorsRes.data.success) {
        setButcheryVendors(vendorsRes.data.vendors || []);
      }
      if (productsRes.data.success) {
        setButcheryProducts(productsRes.data.products || []);
      }
      if (statsRes.data.success) {
        setButcheryStats(statsRes.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to fetch butchery data:', err);
    } finally {
      setLoadingButchery(false);
    }
  };

  const fetchHajjData = async () => {
    setLoadingHajj(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [packagesRes, bookingsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/hajj/packages?limit=200`, config),
        axios.get(`${API_BASE}/admin/hajj/bookings?limit=200`, config),
        axios.get(`${API_BASE}/admin/hajj/stats`, config)
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
      console.error('Failed to fetch Hajj data:', err);
    } finally {
      setLoadingHajj(false);
    }
  };

  const fetchPensionData = async () => {
    setLoadingPension(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const withdrawalsRes = await axios.get(`${API_BASE}/pension/admin/withdrawals?limit=200`, config);
      
      if (withdrawalsRes.data.success) {
        const withdrawals = withdrawalsRes.data.withdrawals || [];
        setPensionWithdrawals(withdrawals);
        
        const pending = withdrawals.filter(w => w.status === 'pending');
        const approved = withdrawals.filter(w => w.status === 'approved');
        const rejected = withdrawals.filter(w => w.status === 'rejected');
        const pendingAmount = pending.reduce((sum, w) => sum + (parseInt(w.amount) || 0), 0);
        const approvedAmount = approved.reduce((sum, w) => sum + (parseInt(w.amount) || 0), 0);
        const rejectedAmount = rejected.reduce((sum, w) => sum + (parseInt(w.amount) || 0), 0);
        
        setPensionStats({
          total: withdrawals.length,
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          pendingAmount: pendingAmount,
          approvedAmount: approvedAmount,
          rejectedAmount: rejectedAmount
        });
      }
    } catch (err) {
      console.error('Failed to fetch pension data:', err);
    } finally {
      setLoadingPension(false);
    }
  };

  const fetchTakafulData = async () => {
    setLoadingTakaful(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [pendingRes, plansRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/takaful/admin/claims/pending`, config),
        axios.get(`${API_BASE}/takaful/admin/plans`, config),
        axios.get(`${API_BASE}/takaful/admin/claims/stats`, config)
      ]);
      
      if (pendingRes.data.success) {
        setTakafulClaims(pendingRes.data.claims || []);
      }
      if (plansRes.data.success) {
        setTakafulPlans(plansRes.data.plans || []);
      }
      if (statsRes.data.success) {
        setTakafulClaimStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch takaful data:', err);
    } finally {
      setLoadingTakaful(false);
    }
  };

  // ==================== ACTION FUNCTIONS ====================

  const updateKYCStatus = async (userId, status) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/users/${userId}/kyc`, 
        { kycStatus: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalMessage(`KYC status updated to ${status}`);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      await fetchData();
      await fetchPendingApplications();
    } catch (err) {
      setError('Failed to update KYC status');
      console.error('KYC update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveVendor = async (vendor) => {
    const userId = getVendorUserId(vendor);
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/vendors/${userId}/verify`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalMessage('Vendor approved successfully!');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to approve vendor');
      console.error('Approve vendor error:', err);
    } finally {
      setLoading(false);
    }
  };

  const rejectVendor = async (vendor) => {
    const userId = getVendorUserId(vendor);
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/vendors/${userId}/verify`,
        { status: 'rejected', admin_notes: 'Application rejected by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalMessage('Vendor rejected');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to reject vendor');
      console.error('Reject vendor error:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveLeader = async (leader) => {
    const userId = getLeaderUserId(leader);
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/leaders/${userId}/verify`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalMessage('Leader approved successfully!');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to approve leader');
      console.error('Approve leader error:', err);
    } finally {
      setLoading(false);
    }
  };

  const rejectLeader = async (leader) => {
    const userId = getLeaderUserId(leader);
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/leaders/${userId}/verify`,
        { status: 'rejected', admin_notes: 'Application rejected by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalMessage('Leader rejected');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to reject leader');
      console.error('Reject leader error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/admin/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
      setModalMessage('User deleted successfully');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Zakat Actions
  const handleAddRecipient = async () => {
    setLoadingRecipientForm(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        name: recipientForm.name,
        description: recipientForm.description,
        category: recipientForm.category,
        location: recipientForm.location,
        contact_name: recipientForm.contact_name,
        contact_phone: recipientForm.contact_phone,
        contact_email: recipientForm.contact_email,
        bank_name: recipientForm.bank_name,
        bank_account: recipientForm.bank_account,
        mpesa_number: recipientForm.mpesa_number
      };
      
      if (editingRecipient) {
        await axios.put(`${API_BASE}/zakat/admin/recipients/${editingRecipient.id}`, data, config);
        setModalMessage('Recipient updated successfully');
      } else {
        await axios.post(`${API_BASE}/zakat/admin/recipients`, data, config);
        setModalMessage('Recipient added successfully');
      }
      
      setShowSuccessModal(true);
      setShowAddRecipientModal(false);
      await fetchZakatData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save recipient');
    } finally {
      setLoadingRecipientForm(false);
    }
  };

  const handleDisburse = async () => {
    if (!disburseForm.recipientId || !disburseForm.amount) {
      setError('Please select a recipient and enter amount');
      return;
    }
    
    setLoadingDisburse(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/zakat/admin/disburse`, {
        recipientId: disburseForm.recipientId,
        amount: parseFloat(disburseForm.amount),
        type: disburseForm.type,
        notes: disburseForm.notes
      }, config);
      
      setModalMessage('Disbursement successful');
      setShowSuccessModal(true);
      setShowDisburseModal(false);
      setDisburseForm({ recipientId: '', amount: '', type: 'zakat', notes: '' });
      await fetchZakatData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disburse funds');
    } finally {
      setLoadingDisburse(false);
    }
  };

  // Sadaqa Actions
  const handleAddCampaign = async () => {
    setLoadingCampaignForm(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        name: campaignForm.name,
        description: campaignForm.description,
        organization: campaignForm.organization,
        target: parseFloat(campaignForm.target),
        category: campaignForm.category,
        location: campaignForm.location,
        image_url: campaignForm.image_url,
        end_date: campaignForm.end_date,
        featured: campaignForm.featured
      };
      
      if (editingCampaign) {
        await axios.put(`${API_BASE}/sadaqa/admin/campaigns/${editingCampaign.id}`, data, config);
        setModalMessage('Campaign updated successfully');
      } else {
        await axios.post(`${API_BASE}/sadaqa/admin/campaigns`, data, config);
        setModalMessage('Campaign created successfully');
      }
      
      setShowSuccessModal(true);
      setShowAddCampaignModal(false);
      await fetchSadaqaData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save campaign');
    } finally {
      setLoadingCampaignForm(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/sadaqa/admin/campaigns/${id}`, config);
      setModalMessage('Campaign deleted successfully');
      setShowSuccessModal(true);
      await fetchSadaqaData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to delete campaign');
    }
  };

  // Hearse Actions
  const handleAssignRequest = async () => {
    if (!assignForm.requestId || !assignForm.providerId) {
      setError('Please select a request and provider');
      return;
    }
    
    setLoadingAssign(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/admin/hearse/assign`, {
        requestId: assignForm.requestId,
        providerId: assignForm.providerId,
        notes: assignForm.notes
      }, config);
      
      setModalMessage('Request assigned successfully');
      setShowSuccessModal(true);
      setShowAssignModal(false);
      setAssignForm({ requestId: '', providerId: '', notes: '' });
      await fetchHearseData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign request');
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleVerifyProvider = async (providerId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this provider?`)) return;
    
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/admin/hearse/providers/${providerId}/verify`, 
        { status: status, notes: '' },
        config
      );
      
      setModalMessage(`Provider ${status} successfully`);
      setShowSuccessModal(true);
      await fetchHearseData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to update provider verification');
    } finally {
      setLoading(false);
    }
  };

  // Butchery Actions
  const handleToggleButcheryProduct = async (productId, isActive) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/admin/butchery/products/${productId}/status`, 
        { is_active: !isActive },
        config
      );
      setModalMessage(`Product ${!isActive ? 'activated' : 'deactivated'} successfully`);
      setShowSuccessModal(true);
      await fetchButcheryData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to update product status');
    } finally {
      setLoading(false);
    }
  };

  // Hajj Actions
  const handleToggleHajjPackage = async (packageId, isActive) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/admin/hajj/packages/${packageId}/status`, 
        { is_active: !isActive },
        config
      );
      setModalMessage(`Package ${!isActive ? 'activated' : 'deactivated'} successfully`);
      setShowSuccessModal(true);
      await fetchHajjData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to update package status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHajjBooking = async (bookingId, reason) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/admin/hajj/bookings/${bookingId}/cancel`, 
        { reason: reason || 'Cancelled by admin' },
        config
      );
      setModalMessage('Booking cancelled successfully');
      setShowSuccessModal(true);
      setShowHajjBookingModal(false);
      await fetchHajjData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const viewHajjBooking = (booking) => {
    setSelectedHajjBooking(booking);
    setShowHajjBookingModal(true);
  };

  // Pension Actions
  const approvePensionWithdrawal = async (withdrawalId) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/pension/admin/withdrawals/${withdrawalId}/approve`, {}, config);
      setModalMessage('Withdrawal request approved successfully. Funds have been transferred.');
      setShowSuccessModal(true);
      await fetchPensionData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const rejectPensionWithdrawal = async (withdrawalId) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const reason = window.prompt('Enter reason for rejection:');
      if (reason === null) {
        setLoading(false);
        return;
      }
      await axios.put(`${API_BASE}/pension/admin/withdrawals/${withdrawalId}/reject`, 
        { reason: reason || 'Rejected by admin' },
        config
      );
      setModalMessage('Withdrawal request rejected');
      setShowSuccessModal(true);
      await fetchPensionData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // Takaful Actions
  const approveTakafulClaim = async (claimId) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/takaful/admin/claims/${claimId}/approve`, {}, config);
      setModalMessage('Takaful claim approved and paid successfully');
      setShowSuccessModal(true);
      await fetchTakafulData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve claim');
    } finally {
      setLoading(false);
    }
  };

  const rejectTakafulClaim = async (claimId) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const reason = window.prompt('Enter reason for rejection:');
      if (reason === null) {
        setLoading(false);
        return;
      }
      await axios.put(`${API_BASE}/takaful/admin/claims/${claimId}/reject`, 
        { notes: reason || 'Rejected by admin' },
        config
      );
      setModalMessage('Takaful claim rejected');
      setShowSuccessModal(true);
      await fetchTakafulData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject claim');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      description: '',
      type: '',
      coverage: '',
      monthlyCost: '',
      annualCost: '',
      maxCoverage: '',
      benefits: [],
      isActive: true
    });
    setShowAddPlanModal(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      description: plan.description || '',
      type: plan.type || '',
      coverage: plan.coverage || '',
      monthlyCost: plan.monthlyCost || '',
      annualCost: plan.annualCost || '',
      maxCoverage: plan.maxCoverage || '',
      benefits: plan.benefits || [],
      isActive: plan.isActive !== undefined ? plan.isActive : true
    });
    setShowAddPlanModal(true);
  };

  const handleSavePlan = async () => {
    setLoadingPlanForm(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        name: planForm.name,
        description: planForm.description,
        type: planForm.type,
        coverage: planForm.coverage,
        monthlyCost: parseInt(planForm.monthlyCost),
        annualCost: parseInt(planForm.annualCost),
        maxCoverage: parseInt(planForm.maxCoverage),
        benefits: planForm.benefits,
        isActive: planForm.isActive
      };
      
      if (editingPlan) {
        await axios.put(`${API_BASE}/takaful/admin/plans/${editingPlan.id}`, data, config);
        setModalMessage('Plan updated successfully');
      } else {
        await axios.post(`${API_BASE}/takaful/admin/plans`, data, config);
        setModalMessage('Plan created successfully');
      }
      
      setShowSuccessModal(true);
      setShowAddPlanModal(false);
      await fetchTakafulData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save plan');
    } finally {
      setLoadingPlanForm(false);
    }
  };

  const handleTogglePlanStatus = async (planId, currentStatus) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/takaful/admin/plans/${planId}`, { isActive: !currentStatus }, config);
      setModalMessage(`Plan ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      setShowSuccessModal(true);
      await fetchTakafulData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update plan status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/takaful/admin/plans/${planId}`, config);
      setModalMessage('Plan deleted successfully');
      setShowSuccessModal(true);
      await fetchTakafulData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  // ==================== AUTH FUNCTIONS ====================

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/admin/login`, { email, password });
      localStorage.setItem('admin_token', response.data.token);
      setToken(response.data.token);
      setSuccess('Login successful!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    navigate('/');
  };

  // ==================== USE EFFECTS ====================

  useEffect(() => {
    if (token) {
      fetchData();
      fetchTransactions();
      fetchPendingApplications();
      fetchConsultationStats();
      fetchZakatData();
      fetchSadaqaData();
      fetchHearseData();
      fetchButcheryData();
      fetchHajjData();
      fetchPensionData();
      fetchTakafulData();
    }
  }, [token]);

  // ==================== LOGIN SCREEN ====================

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#032A24] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-[#0B342B] rounded-3xl shadow-2xl shadow-black/30 p-8 border border-[#C9A44B]/30 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#C9A44B]/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-3">
                  <img 
                    src="/itqaan_logo.png" 
                    alt="Itqaan" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <div className="text-[9px] font-medium text-[#C9A44B] tracking-[0.2em] uppercase">Sharia-Compliant Fintech</div>
                <h2 className="text-xl font-bold text-[#F7F6F1] mt-4">Admin Login</h2>
                <p className="text-xs text-[#B7C0BA] mt-1">Secure access · Authorized personnel only</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[#032A24] border border-[#DC2626]/30 rounded-xl flex items-center justify-between text-xs text-[#DC2626]">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="text-[#DC2626]/60 hover:text-[#DC2626] transition">X</button>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-[#032A24] border border-[#3FAF73]/30 rounded-xl text-xs text-[#3FAF73]">
                  {success}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#F7F6F1] uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@halalhub.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#F7F6F1] uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-[#032A24] border border-[#C9A44B]/30 rounded-xl text-[#F7F6F1] text-sm placeholder-[#B7C0BA]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/40 focus:border-[#C9A44B] transition-all duration-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-[#C9A44B] to-[#E1C16B] text-[#032A24] font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-[#C9A44B]/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#032A24]/30 border-t-[#032A24] rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : (
                    'Login as Admin'
                  )}
                </button>

                <div className="text-center">
                  <p className="text-[9px] text-[#C9A44B]/40 tracking-wider">Secure · Encrypted · No Riba</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN DASHBOARD ====================

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">Admin Dashboard</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Manage users, applications, transactions, and platform activities</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition text-sm" 
              onClick={() => { 
                fetchData(); 
                fetchTransactions(); 
                fetchPendingApplications(); 
                fetchConsultationStats(); 
                fetchZakatData(); 
                fetchSadaqaData(); 
                fetchHearseData(); 
                fetchButcheryData(); 
                fetchHajjData(); 
                fetchPensionData(); 
                fetchTakafulData(); 
              }}
            >
              Refresh
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-semibold" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center text-sm text-red-600">
            <span>Error: {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">X</button>
          </div>
        )}

        {/* Stats Grid */}
        <StatsGrid 
          stats={stats}
          clients={clients}
          vendors={vendors}
          leaders={leaders}
          zakatPool={zakatPool}
          sadaqaPool={sadaqaPool}
          consultationStats={consultationStats}
          hearseStats={hearseStats}
          pensionStats={pensionStats}
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'pending' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Pending
            {(pendingVendors.length + pendingLeaders.length) > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingVendors.length + pendingLeaders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('all'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'all'
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('clients'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'clients'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Clients
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('vendors'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'vendors'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Vendors
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('leaders'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'leaders'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Leaders
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('admins'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'admins'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'transactions' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('zakat')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'zakat' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Zakat
          </button>
          <button
            onClick={() => setActiveTab('sadaqa')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'sadaqa' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Sadaqa
          </button>
          <button
            onClick={() => setActiveTab('hearse')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'hearse' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Hearse
            {hearseStats.pending > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {hearseStats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('butchery')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'butchery' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Butchery
            {butcheryStats.pendingButchers > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {butcheryStats.pendingButchers}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('hajj')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'hajj' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Hajj
            {hajjStats.pendingBookings > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {hajjStats.pendingBookings}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pension')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'pension' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Pension
            {pensionStats.pending > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pensionStats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('takaful')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'takaful' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            Takaful
            {takafulClaimStats.pending > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {takafulClaimStats.pending}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'pending' && (
          <PendingTab
            pendingVendors={pendingVendors}
            pendingLeaders={pendingLeaders}
            loadingPending={loadingPending}
            loading={loading}
            filterLeaderType={filterLeaderType}
            setFilterLeaderType={setFilterLeaderType}
            approveVendor={approveVendor}
            rejectVendor={rejectVendor}
            approveLeader={approveLeader}
            rejectLeader={rejectLeader}
            formatDate={formatDate}
            getLeaderTypeLabel={getLeaderTypeLabel}
            LEADER_TYPES={LEADER_TYPES}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            activeUserTab={activeUserTab}
            setActiveUserTab={setActiveUserTab}
            clients={clients}
            vendors={vendors}
            leaders={leaders}
            admins={admins}
            allUsers={allUsers}
            loadingData={loadingData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterKYC={filterKYC}
            setFilterKYC={setFilterKYC}
            filteredUsers={filteredUsers}
            getCurrentUsers={getCurrentUsers}
            getCurrentUserCount={getCurrentUserCount}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
            getRoleBadge={getRoleBadge}
            getLeaderTypeLabel={getLeaderTypeLabel}
            viewUserDetails={viewUserDetails}
            setUserToDelete={setUserToDelete}
            setShowDeleteModal={setShowDeleteModal}
            updateKYCStatus={updateKYCStatus}
            loading={loading}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            loadingTransactions={loadingTransactions}
            txStats={txStats}
            txSearchQuery={txSearchQuery}
            setTxSearchQuery={setTxSearchQuery}
            txTypeFilter={txTypeFilter}
            setTxTypeFilter={setTxTypeFilter}
            txStatusFilter={txStatusFilter}
            setTxStatusFilter={setTxStatusFilter}
            txDateFrom={txDateFrom}
            setTxDateFrom={setTxDateFrom}
            txDateTo={txDateTo}
            setTxDateTo={setTxDateTo}
            filteredTransactions={filteredTransactions}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
          />
        )}

        {activeTab === 'zakat' && (
          <ZakatTab
            loadingZakat={loadingZakat}
            zakatRecipients={zakatRecipients}
            zakatPayments={zakatPayments}
            zakatPool={zakatPool}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            setShowAddRecipientModal={setShowAddRecipientModal}
            setEditingRecipient={setEditingRecipient}
            setRecipientForm={setRecipientForm}
            setShowDisburseModal={setShowDisburseModal}
            setDisburseForm={setDisburseForm}
            zakatCategories={zakatCategories}
          />
        )}

        {activeTab === 'sadaqa' && (
          <SadaqaTab
            loadingSadaqa={loadingSadaqa}
            sadaqaCampaigns={sadaqaCampaigns}
            sadaqaDonations={sadaqaDonations}
            sadaqaPool={sadaqaPool}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            setShowAddCampaignModal={setShowAddCampaignModal}
            setEditingCampaign={setEditingCampaign}
            setCampaignForm={setCampaignForm}
            handleDeleteCampaign={handleDeleteCampaign}
          />
        )}

        {activeTab === 'hearse' && (
          <HearseTab
            hearseStats={hearseStats}
            hearseSubTab={hearseSubTab}
            setHearseSubTab={setHearseSubTab}
            hearseRequestFilter={hearseRequestFilter}
            setHearseRequestFilter={setHearseRequestFilter}
            hearseProviderFilter={hearseProviderFilter}
            setHearseProviderFilter={setHearseProviderFilter}
            filteredHearseRequests={filteredHearseRequests}
            filteredHearseProviders={filteredHearseProviders}
            hearseRequests={hearseRequests}
            hearseProviders={hearseProviders}
            loadingHearse={loadingHearse}
            loading={loading}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            setAssignForm={setAssignForm}
            setShowAssignModal={setShowAssignModal}
            handleVerifyProvider={handleVerifyProvider}
          />
        )}

        {activeTab === 'butchery' && (
          <ButcheryTab
            butcheryStats={butcheryStats}
            butcherySubTab={butcherySubTab}
            setButcherySubTab={setButcherySubTab}
            butcheryVendorFilter={butcheryVendorFilter}
            setButcheryVendorFilter={setButcheryVendorFilter}
            butcheryProductFilter={butcheryProductFilter}
            setButcheryProductFilter={setButcheryProductFilter}
            butcheryMeatTypeFilter={butcheryMeatTypeFilter}
            setButcheryMeatTypeFilter={setButcheryMeatTypeFilter}
            filteredButcheryVendors={filteredButcheryVendors}
            filteredButcheryProducts={filteredButcheryProducts}
            loadingButchery={loadingButchery}
            loading={loading}
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
            approveVendor={approveVendor}
            rejectVendor={rejectVendor}
            handleToggleButcheryProduct={handleToggleButcheryProduct}
          />
        )}

        {activeTab === 'hajj' && (
          <HajjTab
            hajjStats={hajjStats}
            hajjSubTab={hajjSubTab}
            setHajjSubTab={setHajjSubTab}
            hajjPackageFilter={hajjPackageFilter}
            setHajjPackageFilter={setHajjPackageFilter}
            hajjBookingFilter={hajjBookingFilter}
            setHajjBookingFilter={setHajjBookingFilter}
            hajjTypeFilter={hajjTypeFilter}
            setHajjTypeFilter={setHajjTypeFilter}
            filteredHajjPackages={filteredHajjPackages}
            filteredHajjBookings={filteredHajjBookings}
            loadingHajj={loadingHajj}
            loading={loading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            handleToggleHajjPackage={handleToggleHajjPackage}
            handleCancelHajjBooking={handleCancelHajjBooking}
            viewHajjBooking={viewHajjBooking}
          />
        )}

        {activeTab === 'pension' && (
          <PensionTab
            pensionStats={pensionStats}
            pensionFilter={pensionFilter}
            setPensionFilter={setPensionFilter}
            filteredPensionWithdrawals={filteredPensionWithdrawals}
            loadingPension={loadingPension}
            loading={loading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            approvePensionWithdrawal={approvePensionWithdrawal}
            rejectPensionWithdrawal={rejectPensionWithdrawal}
          />
        )}

        {activeTab === 'takaful' && (
          <TakafulTab
            takafulClaimStats={takafulClaimStats}
            takafulClaims={takafulClaims}
            takafulPlans={takafulPlans}
            loadingTakaful={loadingTakaful}
            loading={loading}
            takafulSubTab={takafulSubTab}
            setTakafulSubTab={setTakafulSubTab}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            approveTakafulClaim={approveTakafulClaim}
            rejectTakafulClaim={rejectTakafulClaim}
            handleAddPlan={handleAddPlan}
            handleEditPlan={handleEditPlan}
            handleTogglePlanStatus={handleTogglePlanStatus}
            handleDeletePlan={handleDeletePlan}
          />
        )}
      </div>

      {/* Modals */}
      <ModalsWrapper
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        selectedUser={selectedUser}
        formatCurrency={formatCurrency}
        getRoleBadge={getRoleBadge}
        getStatusBadge={getStatusBadge}
        getLeaderTypeLabel={getLeaderTypeLabel}
        updateKYCStatus={updateKYCStatus}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        userToDelete={userToDelete}
        deleteUser={deleteUser}
        loading={loading}
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        modalMessage={modalMessage}
        showAddRecipientModal={showAddRecipientModal}
        setShowAddRecipientModal={setShowAddRecipientModal}
        recipientForm={recipientForm}
        setRecipientForm={setRecipientForm}
        editingRecipient={editingRecipient}
        handleAddRecipient={handleAddRecipient}
        loadingRecipientForm={loadingRecipientForm}
        zakatCategories={zakatCategories}
        error={error}
        showDisburseModal={showDisburseModal}
        setShowDisburseModal={setShowDisburseModal}
        disburseForm={disburseForm}
        setDisburseForm={setDisburseForm}
        zakatRecipients={zakatRecipients}
        handleDisburse={handleDisburse}
        loadingDisburse={loadingDisburse}
        showAddCampaignModal={showAddCampaignModal}
        setShowAddCampaignModal={setShowAddCampaignModal}
        campaignForm={campaignForm}
        setCampaignForm={setCampaignForm}
        editingCampaign={editingCampaign}
        handleAddCampaign={handleAddCampaign}
        loadingCampaignForm={loadingCampaignForm}
        sadaqaCategories={sadaqaCategories}
        showAssignModal={showAssignModal}
        setShowAssignModal={setShowAssignModal}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        hearseProviders={hearseProviders}
        handleAssignRequest={handleAssignRequest}
        loadingAssign={loadingAssign}
        showHajjBookingModal={showHajjBookingModal}
        setShowHajjBookingModal={setShowHajjBookingModal}
        selectedHajjBooking={selectedHajjBooking}
        handleCancelHajjBooking={handleCancelHajjBooking}
        showAddPlanModal={showAddPlanModal}
        setShowAddPlanModal={setShowAddPlanModal}
        planForm={planForm}
        setPlanForm={setPlanForm}
        editingPlan={editingPlan}
        handleSavePlan={handleSavePlan}
        loadingPlanForm={loadingPlanForm}
      />
    </div>
  );
};

export default AdminPanel;