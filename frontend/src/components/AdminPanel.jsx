import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');
  const [activeUserTab, setActiveUserTab] = useState('all');
  
  // Users state
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [imams, setImams] = useState([]);
  const [kadhis, setKadhis] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKYC, setFilterKYC] = useState('All');
  const [filterSubRole, setFilterSubRole] = useState('All');
  
  // Pending applications
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingImams, setPendingImams] = useState([]);
  const [pendingKadhis, setPendingKadhis] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  
  // Transactions state
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
  
  // Consultation stats
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    videoBookings: 0
  });
  
  // Mosque state
  const [mosques, setMosques] = useState([]);
  const [loadingMosques, setLoadingMosques] = useState(false);
  const [mosqueSearch, setMosqueSearch] = useState('');
  const [mosqueCountyFilter, setMosqueCountyFilter] = useState('All');
  const [counties, setCounties] = useState(['All']);
  const [showAddMosqueModal, setShowAddMosqueModal] = useState(false);
  const [editingMosque, setEditingMosque] = useState(null);
  const [mosqueForm, setMosqueForm] = useState({
    name: '',
    location: '',
    county: '',
    latitude: '',
    longitude: '',
    imam_id: ''
  });
  const [imamOptions, setImamOptions] = useState([]);
  const [loadingMosqueForm, setLoadingMosqueForm] = useState(false);
  
  // Zakat state
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
  
  // Sadaqa state
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
  
  // Hearse state
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
  
  // Butchery state
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
  
  // Hajj state
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

  // ===== PENSION STATE =====
  const [pendingPensionContributions, setPendingPensionContributions] = useState([]);
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

  // ===== TAKAFUL STATE =====
  const [pendingTakafulClaims, setPendingTakafulClaims] = useState([]);
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
  
  const zakatCategories = [
    'mosque', 'orphan', 'needy', 'debt', 'emergency', 'education', 'health', 'general'
  ];
  const sadaqaCategories = [
    'orphan', 'masjid', 'water', 'education', 'medical', 'emergency', 'imam', 'community'
  ];
  
  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchData();
      fetchTransactions();
      fetchPendingApplications();
      fetchConsultationStats();
      fetchMosques();
      fetchCounties();
      fetchImamOptions();
      fetchZakatData();
      fetchSadaqaData();
      fetchHearseData();
      fetchButcheryData();
      fetchHajjData();
      fetchPensionData();
      fetchTakafulData();
    }
  }, [token]);

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
      
      const imamUsers = allUsersData.filter(u => u.role === 'imam');
      setImams(imamUsers);
      setKadhis(imamUsers.filter(u => u.imam_sub_role === 'kadhi'));
      
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
      const [vendorsRes, imamsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/pending-vendors`, config),
        axios.get(`${API_BASE}/admin/pending-imams`, config)
      ]);
      setPendingVendors(vendorsRes.data.vendors || []);
      
      const allPendingImams = imamsRes.data.imams || [];
      setPendingImams(allPendingImams);
      setPendingKadhis(allPendingImams.filter(i => i.sub_role === 'kadhi'));
      
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

  const fetchMosques = async () => {
    setLoadingMosques(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = {};
      if (mosqueSearch) params.search = mosqueSearch;
      if (mosqueCountyFilter !== 'All') params.county = mosqueCountyFilter;
      
      const response = await axios.get(`${API_BASE}/admin/mosques`, { ...config, params });
      if (response.data.success) {
        setMosques(response.data.mosques || []);
      }
    } catch (err) {
      console.error('Failed to fetch mosques:', err);
      setError('Failed to load mosques');
    } finally {
      setLoadingMosques(false);
    }
  };

  const fetchCounties = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const countiesRes = await axios.get(`${API_BASE}/mosque/counties/list`, config);
      if (countiesRes.data.success) {
        setCounties(['All', ...countiesRes.data.counties]);
      }
    } catch (err) {
      console.error('Failed to fetch counties:', err);
    }
  };

  const fetchImamOptions = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/admin/imams?status=approved`, config);
      if (response.data.success) {
        setImamOptions(response.data.imams || []);
      }
    } catch (err) {
      console.error('Failed to fetch imams:', err);
    }
  };

  // ===== PENSION FUNCTIONS =====
  const fetchPensionData = async () => {
    setLoadingPension(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [pendingRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/pension/admin/pending`, config),
        axios.get(`${API_BASE}/pension/admin/stats`, config)
      ]);
      
      if (pendingRes.data.success) {
        setPendingPensionContributions(pendingRes.data.contributions || []);
      }
      if (statsRes.data.success) {
        setPensionStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch pension data:', err);
    } finally {
      setLoadingPension(false);
    }
  };

  const approvePensionContribution = async (contributionId) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/pension/admin/approve/${contributionId}`, {}, config);
      setModalMessage('Pension contribution approved successfully');
      setShowSuccessModal(true);
      await fetchPensionData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve contribution');
    } finally {
      setLoading(false);
    }
  };

  const rejectPensionContribution = async (contributionId) => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/pension/admin/reject/${contributionId}`, { reason: 'Rejected by admin' }, config);
      setModalMessage('Pension contribution rejected');
      setShowSuccessModal(true);
      await fetchPensionData();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject contribution');
    } finally {
      setLoading(false);
    }
  };

  // ===== TAKAFUL FUNCTIONS =====
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
        setPendingTakafulClaims(pendingRes.data.claims || []);
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
      await axios.put(`${API_BASE}/takaful/admin/claims/${claimId}/reject`, { notes: 'Rejected by admin' }, config);
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

  // ===== ZAKAT FUNCTIONS =====
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

  // ===== SADAQA FUNCTIONS =====
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

  // ===== HEARSE FUNCTIONS =====
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

  // ===== BUTCHERY FUNCTIONS =====
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

  const filteredButcheryVendors = butcheryVendors.filter(v => {
    if (butcheryVendorFilter === 'all') return true;
    return v.vendor_status === butcheryVendorFilter;
  });

  const filteredButcheryProducts = butcheryProducts.filter(p => {
    const matchesMeatType = butcheryMeatTypeFilter === 'all' || p.meat_type === butcheryMeatTypeFilter;
    const matchesStatus = butcheryProductFilter === 'all' || 
      (butcheryProductFilter === 'active' && p.is_active) ||
      (butcheryProductFilter === 'inactive' && !p.is_active);
    return matchesMeatType && matchesStatus;
  });

  // ===== HAJJ FUNCTIONS =====
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

  const filteredHajjPackages = hajjPackages.filter(p => {
    const matchesStatus = hajjPackageFilter === 'all' || 
      (hajjPackageFilter === 'active' && p.is_active) ||
      (hajjPackageFilter === 'inactive' && !p.is_active);
    const matchesType = hajjTypeFilter === 'all' || p.type === hajjTypeFilter;
    return matchesStatus && matchesType;
  });

  const filteredHajjBookings = hajjBookings.filter(b => {
    if (hajjBookingFilter === 'all') return true;
    return b.status === hajjBookingFilter;
  });

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

  const getImamUserId = (imam) => {
    if (imam.user_id) return imam.user_id;
    if (imam.id && imam.id.startsWith('imamprof-')) {
      return imam.user_id || imam.id;
    }
    return imam.id;
  };

  const getVendorUserId = (vendor) => {
    if (vendor.user_id) return vendor.user_id;
    return vendor.id;
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

  const approveImam = async (imam) => {
    const userId = getImamUserId(imam);
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/imams/${userId}/verify`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const label = imam.sub_role === 'kadhi' ? 'Kadhi' : 'Imam';
      setModalMessage(`${label} approved successfully!`);
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to approve religious leader');
      console.error('Approve imam error:', err);
    } finally {
      setLoading(false);
    }
  };

  const rejectImam = async (imam) => {
    const userId = getImamUserId(imam);
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/imams/${userId}/verify`,
        { status: 'rejected', admin_notes: 'Application rejected by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const label = imam.sub_role === 'kadhi' ? 'Kadhi' : 'Imam';
      setModalMessage(`${label} rejected`);
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(`Failed to reject ${imam.sub_role === 'kadhi' ? 'kadhi' : 'imam'}`);
      console.error('Reject imam error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== MOSQUE MANAGEMENT FUNCTIONS =====
  const handleAddMosque = () => {
    setEditingMosque(null);
    setMosqueForm({
      name: '',
      location: '',
      county: '',
      latitude: '',
      longitude: '',
      imam_id: ''
    });
    setShowAddMosqueModal(true);
  };

  const handleEditMosque = (mosque) => {
    setEditingMosque(mosque);
    setMosqueForm({
      name: mosque.name || '',
      location: mosque.location || '',
      county: mosque.county || '',
      latitude: mosque.latitude || '',
      longitude: mosque.longitude || '',
      imam_id: mosque.imam_id || ''
    });
    setShowAddMosqueModal(true);
  };

  const handleDeleteMosque = async (mosqueId) => {
    if (!window.confirm('Are you sure you want to delete this mosque?')) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/admin/mosques/${mosqueId}`, config);
      setModalMessage('Mosque deleted successfully');
      setShowSuccessModal(true);
      await fetchMosques();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to delete mosque');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMosque = async () => {
    if (!mosqueForm.name || !mosqueForm.location) {
      setError('Name and location are required');
      return;
    }
    
    setLoadingMosqueForm(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const data = {
        name: mosqueForm.name,
        location: mosqueForm.location,
        county: mosqueForm.county || null,
        latitude: mosqueForm.latitude ? parseFloat(mosqueForm.latitude) : null,
        longitude: mosqueForm.longitude ? parseFloat(mosqueForm.longitude) : null,
        imam_id: mosqueForm.imam_id || null
      };
      
      if (editingMosque) {
        await axios.put(`${API_BASE}/admin/mosques/${editingMosque.id}`, data, config);
        setModalMessage('Mosque updated successfully');
      } else {
        await axios.post(`${API_BASE}/admin/mosques`, data, config);
        setModalMessage('Mosque added successfully');
      }
      
      setShowSuccessModal(true);
      setShowAddMosqueModal(false);
      await fetchMosques();
      await fetchCounties();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save mosque');
    } finally {
      setLoadingMosqueForm(false);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

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
      'imam': 'bg-purple-50 text-purple-700',
      'kadhi': 'bg-indigo-50 text-indigo-700'
    };
    return roles[role] || 'bg-gray-50 text-gray-500';
  };

  const getSubRoleLabel = (subRole) => {
    if (subRole === 'kadhi') return 'Kadhi';
    if (subRole === 'imam') return 'Imam';
    return 'N/A';
  };

  const getCurrentUsers = () => {
    switch(activeUserTab) {
      case 'clients': return clients;
      case 'vendors': return vendors;
      case 'imams': return imams;
      case 'kadhis': return kadhis;
      case 'admins': return admins;
      default: return allUsers;
    }
  };

  const getCurrentUserCount = () => {
    switch(activeUserTab) {
      case 'clients': return clients.length;
      case 'vendors': return vendors.length;
      case 'imams': return imams.length;
      case 'kadhis': return kadhis.length;
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

  const filteredPendingImams = pendingImams.filter(imam => {
    if (filterSubRole === 'All') return true;
    return imam.sub_role === filterSubRole;
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

  // ===== SVG ICONS =====
  const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const VendorIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const ImamIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const KadhiIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const AdminIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const TransactionIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const PendingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const RevenueIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const OrdersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const ConsultationIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const MosqueIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const ZakatIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const SadaqaIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const HearseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const ButcheryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const HajjIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const PensionIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 4v1m0-1c-1.11 0-2.08-.402-2.599-1M12 12c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const TakafulIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  // ===== LOGIN SCREEN =====
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F7FC] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-[#1769AA]/5 p-8 border border-[#E8EEF4]">
            
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#1769AA] flex items-center justify-center">
                  <span className="text-white text-xl font-bold">H</span>
                </div>
                <span className="text-2xl font-bold text-[#1A2A3A]">HalalHub</span>
              </div>
              <p className="text-sm text-[#94A3B8] mt-1">Admin Login</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex justify-between items-center">
                <span>Error: {error}</span>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">X</button>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
                {success}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@halalhub.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>

              <p className="text-center text-xs text-[#94A3B8] tracking-wider">
                Secure access · Authorized personnel only
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ===== ADMIN DASHBOARD =====
  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#1A2A3A]">Admin Dashboard</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Manage users, applications, transactions, and platform activities</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition text-sm" onClick={() => { fetchData(); fetchTransactions(); fetchPendingApplications(); fetchConsultationStats(); fetchMosques(); fetchZakatData(); fetchSadaqaData(); fetchHearseData(); fetchButcheryData(); fetchHajjData(); fetchPensionData(); fetchTakafulData(); }}>
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

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-[#1A2A3A]"><UsersIcon /></div>
            <div className="text-2xl font-heading font-bold text-[#1A2A3A]">{stats.totalUsers || 0}</div>
            <div className="text-xs text-[#94A3B8]">Total Users</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-blue-600"><UserIcon /></div>
            <div className="text-2xl font-heading font-bold text-blue-600">{stats.totalClients || clients.length}</div>
            <div className="text-xs text-[#94A3B8]">Clients</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-amber-600"><VendorIcon /></div>
            <div className="text-2xl font-heading font-bold text-amber-600">{stats.totalVendors || vendors.length}</div>
            <div className="text-xs text-[#94A3B8]">Vendors</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-purple-600"><ImamIcon /></div>
            <div className="text-2xl font-heading font-bold text-purple-600">{stats.totalImams || imams.length}</div>
            <div className="text-xs text-[#94A3B8]">Imams</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-indigo-600"><KadhiIcon /></div>
            <div className="text-2xl font-heading font-bold text-indigo-600">{kadhis.length}</div>
            <div className="text-xs text-[#94A3B8]">Kadhis</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-[#1769AA]"><MosqueIcon /></div>
            <div className="text-2xl font-heading font-bold text-[#1769AA]">{mosques.length}</div>
            <div className="text-xs text-[#94A3B8]">Mosques</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-[#1769AA]"><ZakatIcon /></div>
            <div className="text-2xl font-heading font-bold text-[#1769AA]">{zakatPool.zakatBalance || 0}</div>
            <div className="text-xs text-[#94A3B8]">Zakat Pool</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-emerald-600"><SadaqaIcon /></div>
            <div className="text-2xl font-heading font-bold text-emerald-600">{sadaqaPool.sadaqaBalance || 0}</div>
            <div className="text-xs text-[#94A3B8]">Sadaqa Pool</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-red-600"><PendingIcon /></div>
            <div className="text-2xl font-heading font-bold text-red-600">{stats.pendingKYC || 0}</div>
            <div className="text-xs text-[#94A3B8]">Pending KYC</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-[#1769AA]"><RevenueIcon /></div>
            <div className="text-2xl font-heading font-bold text-[#1769AA]">{formatCurrency(stats.totalRevenue || 0)}</div>
            <div className="text-xs text-[#94A3B8]">Revenue</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-emerald-600"><ConsultationIcon /></div>
            <div className="text-2xl font-heading font-bold text-emerald-600">{consultationStats.total || 0}</div>
            <div className="text-xs text-[#94A3B8]">Consultations</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E8EEF4] shadow-sm text-center hover:shadow-md transition">
            <div className="flex justify-center mb-1 text-[#1769AA]"><HearseIcon /></div>
            <div className="text-2xl font-heading font-bold text-[#1769AA]">{hearseStats.total || 0}</div>
            <div className="text-xs text-[#94A3B8]">Hearse</div>
          </div>
        </div>

        {/* MAIN TABS */}
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
            {(pendingVendors.length + pendingImams.length) > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingVendors.length + pendingImams.length}
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
            <span className="flex items-center gap-1.5"><UsersIcon /><span>All Users</span></span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('clients'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'clients'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><UserIcon /><span>Clients</span></span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('vendors'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'vendors'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><VendorIcon /><span>Vendors</span></span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('imams'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'imams'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><ImamIcon /><span>Imams</span></span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('kadhis'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'kadhis'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><KadhiIcon /><span>Kadhis</span></span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); setActiveUserTab('admins'); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'users' && activeUserTab === 'admins'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><AdminIcon /><span>Admins</span></span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'transactions' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><TransactionIcon /><span>Transactions</span></span>
          </button>
          <button
            onClick={() => setActiveTab('mosques')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'mosques' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><MosqueIcon /><span>Mosques</span></span>
          </button>
          <button
            onClick={() => setActiveTab('zakat')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'zakat' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><ZakatIcon /><span>Zakat</span></span>
          </button>
          <button
            onClick={() => setActiveTab('sadaqa')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'sadaqa' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><SadaqaIcon /><span>Sadaqa</span></span>
          </button>
          <button
            onClick={() => setActiveTab('hearse')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'hearse' 
                ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
            }`}
          >
            <span className="flex items-center gap-1.5"><HearseIcon /><span>Hearse</span></span>
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
            <span className="flex items-center gap-1.5"><ButcheryIcon /><span>Butchery</span></span>
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
            <span className="flex items-center gap-1.5"><HajjIcon /><span>Hajj</span></span>
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
            <span className="flex items-center gap-1.5"><PensionIcon /><span>Pension</span></span>
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
            <span className="flex items-center gap-1.5"><TakafulIcon /><span>Takaful</span></span>
            {takafulClaimStats.pending > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {takafulClaimStats.pending}
              </span>
            )}
          </button>
        </div>

        {/* ===== PENDING APPLICATIONS TAB ===== */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Pending Vendors */}
            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Vendor Applications</h3>
                <span className="text-sm text-[#94A3B8]">{pendingVendors.length} pending</span>
              </div>

              {loadingPending ? (
                <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : pendingVendors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#1A2A3A] font-semibold">No pending vendor applications</p>
                  <p className="text-sm text-[#94A3B8] mt-1">All vendors have been reviewed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#1A2A3A]">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Business</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Location</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Submitted</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVendors.map((vendor) => (
                        <tr key={vendor.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-semibold text-[#1A2A3A]">{vendor.business_name || vendor.fullname}</div>
                              <div className="text-xs text-[#94A3B8]">KRA: {vendor.kra_pin || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-xs">
                              <div className="text-[#1A2A3A]">{vendor.email || 'N/A'}</div>
                              <div className="text-[#94A3B8]">{vendor.phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-[#94A3B8]">{vendor.region || vendor.sub_county || 'N/A'}</td>
                          <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(vendor.createdat)}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button 
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                                onClick={() => approveVendor(vendor)}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button 
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                                onClick={() => rejectVendor(vendor)}
                                disabled={loading}
                              >
                                Reject
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

            {/* Pending Religious Leaders (Imams + Kadhis) */}
            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Religious Leader Applications</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#94A3B8]">{pendingImams.length} pending</span>
                  <select
                    className="px-2 py-1 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={filterSubRole}
                    onChange={(e) => setFilterSubRole(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="imam">Imams</option>
                    <option value="kadhi">Kadhis</option>
                  </select>
                </div>
              </div>

              {loadingPending ? (
                <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : filteredPendingImams.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#1A2A3A] font-semibold">No pending religious leader applications</p>
                  <p className="text-sm text-[#94A3B8] mt-1">All applicants have been reviewed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#1A2A3A]">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Role</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Mosque</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Submitted</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingImams.map((imam) => {
                        const roleLabel = imam.sub_role === 'kadhi' ? 'Kadhi' : 'Imam';
                        const roleColor = imam.sub_role === 'kadhi' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700';
                        return (
                          <tr key={imam.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                            <td className="px-3 py-3">
                              <div>
                                <div className="font-semibold text-[#1A2A3A]">{imam.fullname}</div>
                                <div className="text-xs text-[#94A3B8]">{imam.title || 'Religious Leader'}</div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${roleColor}`}>
                                {roleLabel}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-xs">
                                <div className="text-[#1A2A3A]">{imam.mosque_name || 'N/A'}</div>
                                <div className="text-[#94A3B8]">{imam.mosque_location || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-xs">
                                <div className="text-[#1A2A3A]">{imam.email || 'N/A'}</div>
                                <div className="text-[#94A3B8]">{imam.phone || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(imam.createdat)}</td>
                            <td className="px-3 py-3">
                              <div className="flex gap-2">
                                <button 
                                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                                  onClick={() => approveImam(imam)}
                                  disabled={loading}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                                  onClick={() => rejectImam(imam)}
                                  disabled={loading}
                                >
                                  Reject
                                </button>
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
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">
                {activeUserTab === 'clients' && 'Clients'}
                {activeUserTab === 'vendors' && 'Vendors'}
                {activeUserTab === 'imams' && 'Imams'}
                {activeUserTab === 'kadhis' && 'Kadhis'}
                {activeUserTab === 'admins' && 'Admins'}
                {activeUserTab === 'all' && 'All Users'}
              </h3>
              <span className="text-sm text-[#94A3B8]">{getCurrentUserCount()} users</span>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                value={filterKYC}
                onChange={(e) => setFilterKYC(e.target.value)}
              >
                <option value="All">All KYC</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                <span>Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#1A2A3A] font-semibold">No users found</p>
                <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Contact</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Role</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Balance</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">KYC</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Joined</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const kycStatus = getStatusBadge(user.kycstatus || 'pending');
                      const displayRole = user.role === 'imam' && user.imam_sub_role === 'kadhi' ? 'kadhi' : user.role;
                      return (
                        <tr key={user.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-xs">
                                {(user.fullname || user.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-[#1A2A3A]">{user.fullname || user.fullName || 'Unknown'}</div>
                                <div className="text-xs text-[#94A3B8]">
                                  {displayRole === 'kadhi' ? 'Kadhi' : user.role || 'client'}
                                  {user.role === 'imam' && user.imam_sub_role === 'kadhi' && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px]">K</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <div className="text-xs">
                              <div className="text-[#1A2A3A]">{user.email || 'N/A'}</div>
                              <div className="text-[#94A3B8]">{user.phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getRoleBadge(displayRole)}`}>
                              {displayRole === 'kadhi' ? 'Kadhi' : displayRole || 'client'}
                            </span>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell font-semibold text-[#1A2A3A]">{formatCurrency(user.walletbalance || 0)}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${kycStatus.bg} ${kycStatus.text}`}>
                              {kycStatus.label}
                            </span>
                            {user.kycstatus === 'pending' && (
                              <div className="flex gap-1 mt-1">
                                <button className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-semibold hover:bg-emerald-600 hover:text-white transition" onClick={() => updateKYCStatus(user.id, 'verified')}>Approve</button>
                                <button className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-semibold hover:bg-red-600 hover:text-white transition" onClick={() => updateKYCStatus(user.id, 'rejected')}>Reject</button>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell text-xs text-[#94A3B8]">{formatDate(user.createdAt)}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1">
                              <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition" onClick={() => viewUserDetails(user)} title="View">V</button>
                              <button className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition" onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} title="Delete">D</button>
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

        {/* ===== TRANSACTIONS TAB ===== */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Transactions</h3>
              <span className="text-sm text-[#94A3B8]">{filteredTransactions.length} transactions</span>
            </div>

            {/* Transaction Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="bg-[#F1F7FC] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[#1A2A3A]">{txStats.total}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-emerald-600">{txStats.completed}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Completed</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-amber-600">{txStats.pending}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-red-600">{txStats.failed}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Failed</div>
              </div>
              <div className="bg-[#1769AA]/10 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[#1769AA]">{formatCurrency(txStats.totalAmount)}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Volume</div>
              </div>
            </div>

            {/* Transaction Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
              <input
                type="text"
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                placeholder="Search by ID or user..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
              />
              <select
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
                <option value="transfer">Transfer</option>
                <option value="zakat">Zakat</option>
                <option value="sadaqa">Sadaqa</option>
                <option value="pension">Pension</option>
                <option value="order">Order</option>
                <option value="booking">Booking</option>
                <option value="utility">Utility</option>
                <option value="consultation">Consultation</option>
              </select>
              <select
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
                placeholder="From"
              />
              <input
                type="date"
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
                placeholder="To"
              />
            </div>

            {loadingTransactions ? (
              <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                <span>Loading transactions...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#1A2A3A] font-semibold">No transactions found</p>
                <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">ID</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const statusBadge = getStatusBadge(tx.status);
                      return (
                        <tr key={tx.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                          <td className="px-3 py-3 font-mono text-[10px] text-[#94A3B8]">{tx.id?.slice(0, 12) || 'N/A'}</td>
                          <td className="px-3 py-3">
                            <div className="text-xs">
                              <div className="font-medium text-[#1A2A3A]">{tx.user_name || tx.user_id || 'Unknown'}</div>
                              <div className="text-[#94A3B8]">{tx.phone || ''}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-medium text-[#5A6A7A]">
                              {tx.type || 'unknown'}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(tx.amount || 0)}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell text-xs text-[#94A3B8]">{formatDate(tx.created_at || tx.createdAt || tx.date)}</td>
                          <td className="px-3 py-3 hidden lg:table-cell text-xs text-[#94A3B8] font-mono">{tx.reference || tx.checkout_request_id || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== MOSQUES TAB ===== */}
        {activeTab === 'mosques' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Mosque Management</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#94A3B8]">{mosques.length} mosques</span>
                <button
                  className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                  onClick={handleAddMosque}
                >
                  + Add Mosque
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                placeholder="Search mosques..."
                value={mosqueSearch}
                onChange={(e) => setMosqueSearch(e.target.value)}
              />
              <select
                className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                value={mosqueCountyFilter}
                onChange={(e) => setMosqueCountyFilter(e.target.value)}
              >
                {counties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            {loadingMosques ? (
              <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                <span>Loading mosques...</span>
              </div>
            ) : mosques.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#1A2A3A] font-semibold">No mosques found</p>
                <p className="text-sm text-[#94A3B8] mt-1">Click "Add Mosque" to create one</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Location</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">County</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Imam</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Coordinates</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mosques.map((mosque) => (
                      <tr key={mosque.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-[#1A2A3A]">{mosque.name}</div>
                          {mosque.imam_verified && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Verified</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#94A3B8]">{mosque.location || 'N/A'}</td>
                        <td className="px-3 py-3 text-sm text-[#94A3B8]">{mosque.county || 'N/A'}</td>
                        <td className="px-3 py-3 text-sm text-[#94A3B8]">{mosque.imam_name || 'None'}</td>
                        <td className="px-3 py-3 hidden md:table-cell text-xs text-[#94A3B8]">
                          {mosque.latitude && mosque.longitude ? `${mosque.latitude}, ${mosque.longitude}` : 'Not set'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <button
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                              onClick={() => handleEditMosque(mosque)}
                              title="Edit"
                            >
                              E
                            </button>
                            <button
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                              onClick={() => handleDeleteMosque(mosque.id)}
                              title="Delete"
                            >
                              D
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
        )}

        {/* ===== ZAKAT TAB ===== */}
        {activeTab === 'zakat' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Zakat Management</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#94A3B8]">Pool: {formatCurrency(zakatPool.zakatBalance || 0)}</span>
                <button
                  className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                  onClick={() => {
                    setEditingRecipient(null);
                    setRecipientForm({
                      name: '', description: '', category: '', location: '',
                      contact_name: '', contact_phone: '', contact_email: '',
                      bank_name: '', bank_account: '', mpesa_number: ''
                    });
                    setShowAddRecipientModal(true);
                  }}
                >
                  + Add Recipient
                </button>
                <button
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
                  onClick={() => setShowDisburseModal(true)}
                  disabled={zakatPool.zakatBalance === 0}
                >
                  Disburse
                </button>
              </div>
            </div>

            {/* Recipients List */}
            <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Verified Recipients</h4>
            {loadingZakat ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              </div>
            ) : zakatRecipients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#94A3B8]">No recipients added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Received</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Donors</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zakatRecipients.map((recipient) => (
                      <tr key={recipient.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-[#1A2A3A]">{recipient.name}</div>
                          <div className="text-xs text-[#94A3B8]">{recipient.location || 'N/A'}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                            {recipient.category || 'general'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(recipient.total_received || 0)}</td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{recipient.donor_count || 0}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${recipient.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {recipient.verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                            onClick={() => {
                              setEditingRecipient(recipient);
                              setRecipientForm({
                                name: recipient.name || '',
                                description: recipient.description || '',
                                category: recipient.category || '',
                                location: recipient.location || '',
                                contact_name: recipient.contact_name || '',
                                contact_phone: recipient.contact_phone || '',
                                contact_email: recipient.contact_email || '',
                                bank_name: recipient.bank_name || '',
                                bank_account: recipient.bank_account || '',
                                mpesa_number: recipient.mpesa_number || ''
                              });
                              setShowAddRecipientModal(true);
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payments History */}
            <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Payment History</h4>
            {zakatPayments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#94A3B8]">No Zakat payments yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Recipient</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zakatPayments.slice(0, 20).map((payment) => (
                      <tr key={payment.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2 text-sm text-[#1A2A3A]">{payment.user_name || 'Unknown'}</td>
                        <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(payment.amount)}</td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{payment.recipient_name || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{formatDate(payment.paid_at)}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {payment.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== SADAQA TAB ===== */}
        {activeTab === 'sadaqa' && (
          <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
              <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Sadaqa Management</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#94A3B8]">Pool: {formatCurrency(sadaqaPool.sadaqaBalance || 0)}</span>
                <button
                  className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                  onClick={() => {
                    setEditingCampaign(null);
                    setCampaignForm({
                      name: '', description: '', organization: '', target: '',
                      category: '', location: '', image_url: '', end_date: '', featured: false
                    });
                    setShowAddCampaignModal(true);
                  }}
                >
                  + Add Campaign
                </button>
              </div>
            </div>

            {/* Campaigns List */}
            <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Campaigns</h4>
            {loadingSadaqa ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
              </div>
            ) : sadaqaCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#94A3B8]">No campaigns created yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Organization</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Raised</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Target</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sadaqaCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-[#1A2A3A]">{campaign.name}</div>
                          <div className="text-xs text-[#94A3B8]">{campaign.category}</div>
                        </td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{campaign.organization}</td>
                        <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(campaign.raised || 0)}</td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{formatCurrency(campaign.target || 0)}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                            {campaign.status || 'active'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                              onClick={() => {
                                setEditingCampaign(campaign);
                                setCampaignForm({
                                  name: campaign.name || '',
                                  description: campaign.description || '',
                                  organization: campaign.organization || '',
                                  target: campaign.target || '',
                                  category: campaign.category || '',
                                  location: campaign.location || '',
                                  image_url: campaign.image_url || '',
                                  end_date: campaign.end_date || '',
                                  featured: campaign.featured || false
                                });
                                setShowAddCampaignModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-600 hover:text-white transition"
                              onClick={() => handleDeleteCampaign(campaign.id)}
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

            {/* Donations History */}
            <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Donation History</h4>
            {sadaqaDonations.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#94A3B8]">No Sadaqa donations yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A2A3A]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Campaign</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sadaqaDonations.slice(0, 20).map((donation) => (
                      <tr key={donation.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                        <td className="px-3 py-2 text-sm text-[#1A2A3A]">{donation.user_name || 'Anonymous'}</td>
                        <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(donation.amount)}</td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{donation.campaign_name || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm text-[#94A3B8]">{formatDate(donation.paid_at)}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${donation.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {donation.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== HEARSE TAB ===== */}
        {activeTab === 'hearse' && (
          <div className="space-y-6">
            {/* Hearse Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1A2A3A]">{hearseStats.total}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Requests</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{hearseStats.pending}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{hearseStats.assigned}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Assigned</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{hearseStats.inProgress}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">In Progress</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{hearseStats.completed}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Completed</div>
              </div>
            </div>

            {/* Hearse Sub Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
              <button
                onClick={() => setHearseSubTab('requests')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hearseSubTab === 'requests' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Service Requests
                {hearseStats.pending > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {hearseStats.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setHearseSubTab('providers')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hearseSubTab === 'providers' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Providers
                {hearseProviders.filter(p => p.verification_status === 'pending').length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {hearseProviders.filter(p => p.verification_status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {/* Requests Sub Tab */}
            {hearseSubTab === 'requests' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">Service Requests</h4>
                  <div className="flex items-center gap-3">
                    <select
                      className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={hearseRequestFilter}
                      onChange={(e) => setHearseRequestFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <span className="text-xs text-[#94A3B8]">{filteredHearseRequests.length} requests</span>
                  </div>
                </div>

                {loadingHearse ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading requests...</span>
                  </div>
                ) : filteredHearseRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No requests found</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Reference</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Service</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Pickup</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHearseRequests.map((req) => {
                          const statusBadge = getStatusBadge(req.status);
                          return (
                            <tr key={req.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                              <td className="px-3 py-2 font-mono text-xs text-[#94A3B8]">{req.reference || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <div className="text-xs">
                                  <div className="font-medium text-[#1A2A3A]">{req.user_name || 'Unknown'}</div>
                                  <div className="text-[#94A3B8]">{req.user_phone || ''}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-[#5A6A7A]">{req.service_type || 'N/A'}</td>
                              <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{req.pickup_location || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 hidden lg:table-cell text-xs text-[#94A3B8]">{formatDate(req.createdat)}</td>
                              <td className="px-3 py-2">
                                {req.status === 'pending' && (
                                  <button
                                    className="px-3 py-1.5 bg-[#1769AA] text-white text-xs font-semibold rounded-lg hover:bg-[#2F80C0] transition"
                                    onClick={() => {
                                      setAssignForm({ requestId: req.id, providerId: '', notes: '' });
                                      setShowAssignModal(true);
                                    }}
                                  >
                                    Assign
                                  </button>
                                )}
                                {req.status !== 'pending' && (
                                  <span className="text-xs text-[#94A3B8]">—</span>
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
            )}

            {/* Providers Sub Tab */}
            {hearseSubTab === 'providers' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">Hearse Providers</h4>
                  <div className="flex items-center gap-3">
                    <select
                      className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={hearseProviderFilter}
                      onChange={(e) => setHearseProviderFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <span className="text-xs text-[#94A3B8]">{filteredHearseProviders.length} providers</span>
                  </div>
                </div>

                {loadingHearse ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading providers...</span>
                  </div>
                ) : filteredHearseProviders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No providers found</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Business</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Vehicle</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Service Area</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Verification</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Contact</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHearseProviders.map((provider) => {
                          const verificationBadge = provider.is_verified && provider.verification_status === 'approved' 
                            ? { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Verified' }
                            : provider.verification_status === 'pending'
                            ? { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' }
                            : { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' };
                          return (
                            <tr key={provider.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-semibold text-[#1A2A3A]">{provider.business_name || 'N/A'}</div>
                                  <div className="text-xs text-[#94A3B8]">{provider.vendor_type || 'N/A'}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-xs">
                                  <div className="text-[#1A2A3A]">{provider.vehicle_type || 'N/A'}</div>
                                  <div className="text-[#94A3B8]">{provider.vehicle_registration || 'N/A'}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{provider.service_area || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${verificationBadge.bg} ${verificationBadge.text}`}>
                                  {verificationBadge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 hidden lg:table-cell">
                                <div className="text-xs">
                                  <div className="text-[#1A2A3A]">{provider.phone || 'N/A'}</div>
                                  <div className="text-[#94A3B8]">{provider.email || 'N/A'}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-1">
                                  {provider.verification_status === 'pending' && (
                                    <>
                                      <button
                                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                                        onClick={() => handleVerifyProvider(provider.id, 'approved')}
                                        disabled={loading}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                        onClick={() => handleVerifyProvider(provider.id, 'rejected')}
                                        disabled={loading}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {provider.verification_status !== 'pending' && (
                                    <span className="text-xs text-[#94A3B8]">—</span>
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
          </div>
        )}

        {/* ===== BUTCHERY TAB ===== */}
        {activeTab === 'butchery' && (
          <div className="space-y-6">
            {/* Butchery Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1A2A3A]">{butcheryStats.totalButchers || 0}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Butchers</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{butcheryStats.activeButchers || 0}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Butchers</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{butcheryStats.pendingButchers || 0}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1769AA]">{butcheryStats.totalMeatProducts || 0}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Meat Products</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{butcheryStats.activeMeatProducts || 0}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Products</div>
              </div>
            </div>

            {/* Butchery Sub Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
              <button
                onClick={() => setButcherySubTab('vendors')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  butcherySubTab === 'vendors' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Butchery Vendors
                {butcheryStats.pendingButchers > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {butcheryStats.pendingButchers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setButcherySubTab('products')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  butcherySubTab === 'products' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Meat Products
                {butcheryStats.activeMeatProducts > 0 && (
                  <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5">
                    {butcheryStats.activeMeatProducts}
                  </span>
                )}
              </button>
            </div>

            {/* Butchery Vendors Sub Tab */}
            {butcherySubTab === 'vendors' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">Butchery Vendors</h4>
                  <select
                    className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                    value={butcheryVendorFilter}
                    onChange={(e) => setButcheryVendorFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {loadingButchery ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading vendors...</span>
                  </div>
                ) : filteredButcheryVendors.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No butchery vendors found</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Business</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Location</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Products</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredButcheryVendors.map((vendor) => {
                          const statusBadge = getStatusBadge(vendor.vendor_status);
                          return (
                            <tr key={vendor.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-semibold text-[#1A2A3A]">{vendor.business_name || vendor.fullname}</div>
                                  <div className="text-xs text-[#94A3B8]">{vendor.profile_business_name || ''}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-xs">
                                  <div className="text-[#1A2A3A]">{vendor.email || 'N/A'}</div>
                                  <div className="text-[#94A3B8]">{vendor.phone || 'N/A'}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 hidden md:table-cell text-xs text-[#94A3B8]">{vendor.location || 'N/A'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-[#94A3B8]">{vendor.total_butchery_products || 0}</td>
                              <td className="px-3 py-2">
                                {vendor.vendor_status === 'pending' && (
                                  <div className="flex gap-1">
                                    <button
                                      className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                                      onClick={() => approveVendor(vendor)}
                                      disabled={loading}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                      onClick={() => rejectVendor(vendor)}
                                      disabled={loading}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {vendor.vendor_status !== 'pending' && (
                                  <span className="text-xs text-[#94A3B8]">—</span>
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
            )}

            {/* Butchery Products Sub Tab */}
            {butcherySubTab === 'products' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">Meat Products</h4>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={butcheryMeatTypeFilter}
                      onChange={(e) => setButcheryMeatTypeFilter(e.target.value)}
                    >
                      <option value="all">All Meat Types</option>
                      <option value="beef">Beef</option>
                      <option value="goat">Goat</option>
                      <option value="chicken">Chicken</option>
                      <option value="lamb">Lamb</option>
                      <option value="camel">Camel</option>
                      <option value="fish">Fish</option>
                      <option value="mixed">Mixed</option>
                      <option value="other">Other</option>
                    </select>
                    <select
                      className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={butcheryProductFilter}
                      onChange={(e) => setButcheryProductFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {loadingButchery ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading products...</span>
                  </div>
                ) : filteredButcheryProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No meat products found</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Product</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Vendor</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Meat Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Cut Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Price</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredButcheryProducts.map((product) => {
                          const statusBadge = getStatusBadge(product.is_active ? 'active' : 'inactive');
                          return (
                            <tr key={product.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[#1A2A3A]">{product.name}</div>
                                <div className="text-xs text-[#94A3B8]">{product.category || 'N/A'}</div>
                              </td>
                              <td className="px-3 py-2 text-sm text-[#94A3B8]">{product.vendor_name || 'N/A'}</td>
                              <td className="px-3 py-2 hidden md:table-cell">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                                  {product.meat_type || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-2 hidden lg:table-cell text-xs text-[#94A3B8]">{product.cut_type || 'N/A'}</td>
                              <td className="px-3 py-2 font-semibold text-[#1769AA]">
                                {product.price_per_kg ? formatCurrency(product.price_per_kg) + '/kg' : formatCurrency(product.price)}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className={`px-2 py-1 text-xs rounded hover:text-white transition ${
                                    product.is_active 
                                      ? 'bg-red-50 text-red-600 hover:bg-red-600' 
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600'
                                  }`}
                                  onClick={() => handleToggleButcheryProduct(product.id, product.is_active)}
                                  disabled={loading}
                                >
                                  {product.is_active ? 'Deactivate' : 'Activate'}
                                </button>
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
          </div>
        )}

        {/* ===== HAJJ TAB ===== */}
        {activeTab === 'hajj' && (
          <div className="space-y-6">
            {/* Hajj Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1A2A3A]">{hajjStats.totalPackages}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Packages</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{hajjStats.activePackages}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Packages</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{hajjStats.pendingBookings}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending Bookings</div>
              </div>
              <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(hajjStats.totalRevenue)}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Revenue</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{hajjStats.completedBookings}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Completed</div>
              </div>
            </div>

            {/* Hajj Sub Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
              <button
                onClick={() => setHajjSubTab('packages')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hajjSubTab === 'packages' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Packages
                {hajjStats.totalPackages > 0 && (
                  <span className="ml-2 bg-[#1769AA] text-white text-xs rounded-full px-2 py-0.5">
                    {hajjStats.totalPackages}
                  </span>
                )}
              </button>
              <button
                onClick={() => setHajjSubTab('bookings')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hajjSubTab === 'bookings' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Bookings
                {hajjStats.pendingBookings > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {hajjStats.pendingBookings}
                  </span>
                )}
              </button>
            </div>

            {/* Hajj Packages Sub Tab */}
            {hajjSubTab === 'packages' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">Hajj & Umrah Packages</h4>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={hajjPackageFilter}
                      onChange={(e) => setHajjPackageFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <select
                      className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                      value={hajjTypeFilter}
                      onChange={(e) => setHajjTypeFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="hajj">Hajj</option>
                      <option value="umrah">Umrah</option>
                    </select>
                  </div>
                </div>

                {loadingHajj ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading packages...</span>
                  </div>
                ) : filteredHajjPackages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No packages found</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Vendor</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Price</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden lg:table-cell">Slots</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHajjPackages.map((pkg) => {
                          const statusBadge = getStatusBadge(pkg.is_active ? 'active' : 'inactive');
                          return (
                            <tr key={pkg.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[#1A2A3A]">{pkg.name}</div>
                                <div className="text-xs text-[#94A3B8]">{pkg.duration_days} days</div>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.type === 'hajj' ? 'bg-[#1769AA]/10 text-[#1769AA]' : 'bg-emerald-50 text-emerald-700'}`}>
                                  {pkg.type === 'hajj' ? 'Hajj' : 'Umrah'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-[#94A3B8]">{pkg.vendor_name || 'N/A'}</td>
                              <td className="px-3 py-2 hidden md:table-cell font-semibold text-[#1769AA]">{formatCurrency(pkg.price)}</td>
                              <td className="px-3 py-2 hidden lg:table-cell text-sm text-[#94A3B8]">{pkg.available_slots}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className={`px-2 py-1 text-xs rounded hover:text-white transition ${
                                    pkg.is_active 
                                      ? 'bg-red-50 text-red-600 hover:bg-red-600' 
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600'
                                  }`}
                                  onClick={() => handleToggleHajjPackage(pkg.id, pkg.is_active)}
                                  disabled={loading}
                                >
                                  {pkg.is_active ? 'Deactivate' : 'Activate'}
                                </button>
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

            {/* Hajj Bookings Sub Tab */}
            {hajjSubTab === 'bookings' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h4 className="text-sm font-semibold text-[#1A2A3A]">Hajj & Umrah Bookings</h4>
                  <select
                    className="px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white text-[#1A2A3A] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
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
                  <div className="flex items-center justify-center gap-3 py-12 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading bookings...</span>
                  </div>
                ) : filteredHajjBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No bookings found</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Try adjusting your filter</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Client</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Package</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Pilgrims</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHajjBookings.map((booking) => {
                          const statusBadge = getStatusBadge(booking.status);
                          return (
                            <tr key={booking.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-semibold text-[#1A2A3A]">{booking.client_name || 'Unknown'}</div>
                                  <div className="text-xs text-[#94A3B8]">{booking.client_phone || ''}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-[#94A3B8]">{booking.package_name}</td>
                              <td className="px-3 py-2 hidden md:table-cell text-sm text-[#94A3B8]">{booking.pilgrims}</td>
                              <td className="px-3 py-2 font-semibold text-[#1769AA]">{formatCurrency(booking.total_price)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                  <div className="flex gap-1">
                                    <button
                                      className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded hover:bg-emerald-600 hover:text-white transition"
                                      onClick={() => {
                                        const reason = prompt('Enter reason for confirming:');
                                        if (reason !== null) {
                                          setModalMessage('Booking confirmed');
                                          setShowSuccessModal(true);
                                          setTimeout(() => setShowSuccessModal(false), 3000);
                                        }
                                      }}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                      onClick={() => {
                                        const reason = prompt('Enter reason for cancellation:');
                                        if (reason !== null) {
                                          handleCancelHajjBooking(booking.id, reason);
                                        }
                                      }}
                                      disabled={loading}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                                      onClick={() => viewHajjBooking(booking)}
                                    >
                                      View
                                    </button>
                                  </div>
                                )}
                                {(booking.status === 'cancelled' || booking.status === 'completed') && (
                                  <button
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-600 hover:text-white transition"
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
            )}
          </div>
        )}

        {/* ===== PENSION TAB ===== */}
        {activeTab === 'pension' && (
          <div className="space-y-6">
            {/* Pension Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1A2A3A]">{pensionStats.total}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{pensionStats.pending}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{pensionStats.approved}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{pensionStats.rejected}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Rejected</div>
              </div>
              <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(pensionStats.pendingAmount)}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending Amount</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(pensionStats.approvedAmount)}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved Amount</div>
              </div>
            </div>

            {/* Pension Contributions Table */}
            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Pension Contributions</h3>
                <span className="text-sm text-[#94A3B8]">{pendingPensionContributions.length} pending</span>
              </div>

              {loadingPension ? (
                <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : pendingPensionContributions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#1A2A3A] font-semibold">No pending pension contributions</p>
                  <p className="text-sm text-[#94A3B8] mt-1">All contributions have been processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#1A2A3A]">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Supporter</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Imam</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Payment Method</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPensionContributions.map((contribution) => (
                        <tr key={contribution.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-semibold text-[#1A2A3A]">{contribution.user_name || 'Unknown'}</div>
                              <div className="text-xs text-[#94A3B8]">{contribution.user_phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-semibold text-[#1A2A3A]">{contribution.imam_name || 'Unknown'}</div>
                              <div className="text-xs text-[#94A3B8]">{contribution.imam_phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-[#1769AA]">{formatCurrency(contribution.amount)}</td>
                          <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(contribution.contribution_date)}</td>
                          <td className="px-3 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                              {contribution.payment_method || 'wallet'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button 
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                                onClick={() => approvePensionContribution(contribution.id)}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button 
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                                onClick={() => rejectPensionContribution(contribution.id)}
                                disabled={loading}
                              >
                                Reject
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
          </div>
        )}

        {/* ===== TAKAFUL TAB ===== */}
        {activeTab === 'takaful' && (
          <div className="space-y-6">
            {/* Takaful Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="bg-[#F1F7FC] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1A2A3A]">{takafulClaimStats.total}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Total Claims</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{takafulClaimStats.pending}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{takafulClaimStats.approved}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{takafulClaimStats.rejected}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Rejected</div>
              </div>
              <div className="bg-[#1769AA]/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1769AA]">{formatCurrency(takafulClaimStats.pendingAmount)}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Pending Amount</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(takafulClaimStats.approvedAmount)}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Approved Amount</div>
              </div>
            </div>

            {/* Takaful Sub Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-[#E8EEF4] shadow-sm">
              <button
                onClick={() => setTakafulSubTab('claims')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  takafulSubTab === 'claims' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Claims
                {takafulClaimStats.pending > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {takafulClaimStats.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTakafulSubTab('plans')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  takafulSubTab === 'plans' 
                    ? 'bg-[#1769AA] text-white shadow-md shadow-[#1769AA]/20' 
                    : 'text-[#5A6A7A] hover:bg-[#F1F7FC] hover:text-[#1A2A3A]'
                }`}
              >
                Plans
                {takafulPlans.length > 0 && (
                  <span className="ml-2 bg-[#1769AA] text-white text-xs rounded-full px-2 py-0.5">
                    {takafulPlans.length}
                  </span>
                )}
              </button>
            </div>

            {/* Takaful Claims Sub Tab */}
            {takafulSubTab === 'claims' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Takaful Claims</h3>
                  <span className="text-sm text-[#94A3B8]">{pendingTakafulClaims.length} pending</span>
                </div>

                {loadingTakaful ? (
                  <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : pendingTakafulClaims.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No pending Takaful claims</p>
                    <p className="text-sm text-[#94A3B8] mt-1">All claims have been processed</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">User</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Amount</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Plan</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Date</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingTakafulClaims.map((claim) => (
                          <tr key={claim.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                            <td className="px-3 py-3">
                              <div>
                                <div className="font-semibold text-[#1A2A3A]">{claim.user?.name || 'Unknown'}</div>
                                <div className="text-xs text-[#94A3B8]">{claim.user?.phone || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                                {claim.type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-semibold text-[#1769AA]">{formatCurrency(claim.amount)}</td>
                            <td className="px-3 py-3 text-sm text-[#94A3B8]">{claim.policy?.planName || 'N/A'}</td>
                            <td className="px-3 py-3 text-xs text-[#94A3B8]">{formatDate(claim.submittedAt)}</td>
                            <td className="px-3 py-3">
                              <div className="flex gap-2">
                                <button 
                                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                                  onClick={() => approveTakafulClaim(claim.id)}
                                  disabled={loading}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                                  onClick={() => rejectTakafulClaim(claim.id)}
                                  disabled={loading}
                                >
                                  Reject
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
            )}

            {/* Takaful Plans Sub Tab */}
            {takafulSubTab === 'plans' && (
              <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-[#F1F7FC]">
                  <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Takaful Plans</h3>
                  <button
                    className="px-4 py-2 bg-[#1769AA] text-white text-sm font-semibold rounded-xl hover:bg-[#2F80C0] transition flex items-center gap-1"
                    onClick={handleAddPlan}
                  >
                    <PlusIcon /> Add Plan
                  </button>
                </div>

                {loadingTakaful ? (
                  <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
                    <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : takafulPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#1A2A3A] font-semibold">No Takaful plans created yet</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Click "Add Plan" to create one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1A2A3A]">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Name</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Type</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Monthly</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Annual</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider hidden md:table-cell">Coverage</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Status</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {takafulPlans.map((plan) => (
                          <tr key={plan.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                            <td className="px-3 py-3">
                              <div>
                                <div className="font-semibold text-[#1A2A3A]">{plan.name}</div>
                                {plan.description && (
                                  <div className="text-xs text-[#94A3B8] line-clamp-1">{plan.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F7FC] text-[#5A6A7A]">
                                {plan.type || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(plan.monthlyCost)}</td>
                            <td className="px-3 py-3 font-semibold text-[#1A2A3A]">{formatCurrency(plan.annualCost)}</td>
                            <td className="px-3 py-3 hidden md:table-cell text-sm text-[#94A3B8]">{formatCurrency(plan.maxCoverage)}</td>
                            <td className="px-3 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1">
                                <button
                                  className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-600 hover:text-white transition"
                                  onClick={() => handleEditPlan(plan)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={`px-2 py-1 text-xs rounded hover:text-white transition ${
                                    plan.isActive 
                                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-600' 
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600'
                                  }`}
                                  onClick={() => handleTogglePlanStatus(plan.id, plan.isActive)}
                                  disabled={loading}
                                >
                                  {plan.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded hover:bg-red-600 hover:text-white transition"
                                  onClick={() => handleDeletePlan(plan.id)}
                                  disabled={loading}
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
            )}
          </div>
        )}
      </div>

      {/* ===== USER DETAIL MODAL ===== */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">User Details</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowUserModal(false)}>X</button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#F1F7FC]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedUser.fullname || selectedUser.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-[#1A2A3A]">{selectedUser.fullname || selectedUser.fullName}</div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getRoleBadge(selectedUser.role)}`}>{selectedUser.role || 'client'}</span>
                  {selectedUser.role === 'imam' && selectedUser.imam_sub_role === 'kadhi' && (
                    <span className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">Kadhi</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-[#1A2A3A]">{selectedUser.email || 'N/A'}</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-medium text-[#1A2A3A]">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Balance</p>
                  <p className="text-sm font-medium text-[#1769AA]">{formatCurrency(selectedUser.walletbalance || 0)}</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">KYC Status</p>
                  <p className={`text-sm font-medium ${getStatusBadge(selectedUser.kycstatus || 'pending').text}`}>
                    {getStatusBadge(selectedUser.kycstatus || 'pending').label}
                  </p>
                </div>
              </div>

              {selectedUser.kycstatus === 'pending' && (
                <div className="flex gap-3 mt-5 pt-5 border-t border-[#F1F7FC]">
                  <button className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition" onClick={() => { updateKYCStatus(selectedUser.id, 'verified'); setShowUserModal(false); }}>Approve KYC</button>
                  <button className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition" onClick={() => { updateKYCStatus(selectedUser.id, 'rejected'); setShowUserModal(false); }}>Reject KYC</button>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#E8EEF4]">
              <button className="w-full py-2.5 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowUserModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-red-600">Confirm Delete</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowDeleteModal(false)}>X</button>
            </div>
            <div className="p-6 text-center">
              <h4 className="text-lg font-bold text-[#1A2A3A]">Delete User?</h4>
              <p className="text-sm text-[#94A3B8] mt-2">Are you sure you want to delete <strong className="text-[#1A2A3A]">{userToDelete.fullname || userToDelete.fullName}</strong>? This action cannot be undone.</p>
            </div>
            <div className="p-6 border-t border-[#E8EEF4] flex gap-3">
              <button className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60" onClick={deleteUser} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MOSQUE MODAL ===== */}
      {showAddMosqueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddMosqueModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingMosque ? 'Edit Mosque' : 'Add New Mosque'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddMosqueModal(false)}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Mosque Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={mosqueForm.name}
                  onChange={(e) => setMosqueForm({ ...mosqueForm, name: e.target.value })}
                  placeholder="Enter mosque name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Location *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={mosqueForm.location}
                  onChange={(e) => setMosqueForm({ ...mosqueForm, location: e.target.value })}
                  placeholder="Street address or area"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">County</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={mosqueForm.county}
                  onChange={(e) => setMosqueForm({ ...mosqueForm, county: e.target.value })}
                >
                  <option value="">Select county</option>
                  {counties.filter(c => c !== 'All').map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={mosqueForm.latitude}
                    onChange={(e) => setMosqueForm({ ...mosqueForm, latitude: e.target.value })}
                    placeholder="-1.2921"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={mosqueForm.longitude}
                    onChange={(e) => setMosqueForm({ ...mosqueForm, longitude: e.target.value })}
                    placeholder="36.8219"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Assigned Imam</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={mosqueForm.imam_id}
                  onChange={(e) => setMosqueForm({ ...mosqueForm, imam_id: e.target.value })}
                >
                  <option value="">None</option>
                  {imamOptions.map(imam => (
                    <option key={imam.id} value={imam.id}>{imam.fullname} ({imam.mosque_name || 'No mosque'})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddMosqueModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleSaveMosque}
                  disabled={loadingMosqueForm || !mosqueForm.name || !mosqueForm.location}
                >
                  {loadingMosqueForm ? 'Saving...' : editingMosque ? 'Update Mosque' : 'Add Mosque'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT ZAKAT RECIPIENT MODAL ===== */}
      {showAddRecipientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddRecipientModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingRecipient ? 'Edit Recipient' : 'Add Recipient Organization'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddRecipientModal(false)}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Organization Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={recipientForm.name}
                  onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                  placeholder="e.g., Islamic Relief Kenya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Category *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={recipientForm.category}
                  onChange={(e) => setRecipientForm({ ...recipientForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {zakatCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={recipientForm.description}
                  onChange={(e) => setRecipientForm({ ...recipientForm, description: e.target.value })}
                  placeholder="Brief description of the organization"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={recipientForm.location}
                  onChange={(e) => setRecipientForm({ ...recipientForm, location: e.target.value })}
                  placeholder="e.g., Nairobi, Kenya"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.contact_name}
                    onChange={(e) => setRecipientForm({ ...recipientForm, contact_name: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Phone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.contact_phone}
                    onChange={(e) => setRecipientForm({ ...recipientForm, contact_phone: e.target.value })}
                    placeholder="+254XXXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={recipientForm.contact_email}
                  onChange={(e) => setRecipientForm({ ...recipientForm, contact_email: e.target.value })}
                  placeholder="contact@organization.org"
                />
              </div>

              <div className="border-t border-[#E8EEF4] pt-4">
                <p className="text-xs text-[#94A3B8] mb-3">Payment Details (Optional)</p>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.bank_name}
                    onChange={(e) => setRecipientForm({ ...recipientForm, bank_name: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Bank Account Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.bank_account}
                    onChange={(e) => setRecipientForm({ ...recipientForm, bank_account: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">M-Pesa Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={recipientForm.mpesa_number}
                    onChange={(e) => setRecipientForm({ ...recipientForm, mpesa_number: e.target.value })}
                    placeholder="+254XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddRecipientModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleAddRecipient}
                  disabled={loadingRecipientForm || !recipientForm.name || !recipientForm.category}
                >
                  {loadingRecipientForm ? 'Saving...' : editingRecipient ? 'Update Recipient' : 'Add Recipient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DISBURSE MODAL ===== */}
      {showDisburseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDisburseModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Disburse Funds</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowDisburseModal(false)}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Recipient *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={disburseForm.recipientId}
                  onChange={(e) => setDisburseForm({ ...disburseForm, recipientId: e.target.value })}
                >
                  <option value="">Select recipient</option>
                  {zakatRecipients.filter(r => r.verified).map(recipient => (
                    <option key={recipient.id} value={recipient.id}>{recipient.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Amount *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, amount: e.target.value })}
                  placeholder="0"
                  min="1"
                />
                <p className="text-xs text-[#94A3B8] mt-1">Available: {formatCurrency(zakatPool.zakatBalance || 0)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Type</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={disburseForm.type}
                  onChange={(e) => setDisburseForm({ ...disburseForm, type: e.target.value })}
                >
                  <option value="zakat">Zakat</option>
                  <option value="sadaqa">Sadaqa</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowDisburseModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleDisburse}
                  disabled={loadingDisburse || !disburseForm.recipientId || !disburseForm.amount}
                >
                  {loadingDisburse ? 'Processing...' : 'Confirm Disbursement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT SADAQA CAMPAIGN MODAL ===== */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddCampaignModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddCampaignModal(false)}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Water Well Project"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Organization *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.organization}
                  onChange={(e) => setCampaignForm({ ...campaignForm, organization: e.target.value })}
                  placeholder="e.g., Muslim Aid Kenya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Category *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={campaignForm.category}
                  onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {sadaqaCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Target Amount *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.target}
                  onChange={(e) => setCampaignForm({ ...campaignForm, target: e.target.value })}
                  placeholder="0"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Brief description of the campaign"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.location}
                  onChange={(e) => setCampaignForm({ ...campaignForm, location: e.target.value })}
                  placeholder="e.g., Garissa, Kenya"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30"
                  checked={campaignForm.featured}
                  onChange={(e) => setCampaignForm({ ...campaignForm, featured: e.target.checked })}
                />
                <label htmlFor="featured" className="text-sm text-[#5A6A7A]">Feature this campaign</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddCampaignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleAddCampaign}
                  disabled={loadingCampaignForm || !campaignForm.name || !campaignForm.organization || !campaignForm.target || !campaignForm.category}
                >
                  {loadingCampaignForm ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ASSIGN HEARSE REQUEST MODAL ===== */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Assign Service Request</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAssignModal(false)}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Select Provider *</label>
                <select
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition appearance-none"
                  value={assignForm.providerId}
                  onChange={(e) => setAssignForm({ ...assignForm, providerId: e.target.value })}
                >
                  <option value="">Select a verified provider</option>
                  {hearseProviders
                    .filter(p => p.is_verified && p.verification_status === 'approved')
                    .map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.business_name} - {provider.vehicle_type || 'N/A'}
                      </option>
                    ))}
                </select>
                {hearseProviders.filter(p => p.is_verified && p.verification_status === 'approved').length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No verified providers available. Please approve providers first.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Notes</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Optional notes for the provider"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleAssignRequest}
                  disabled={loadingAssign || !assignForm.providerId || !assignForm.requestId}
                >
                  {loadingAssign ? 'Assigning...' : 'Assign Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HAJJ BOOKING DETAIL MODAL ===== */}
      {showHajjBookingModal && selectedHajjBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHajjBookingModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">Hajj Booking Details</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowHajjBookingModal(false)}><CloseIcon /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="font-bold text-[#1A2A3A]">{selectedHajjBooking.package_name}</div>
                <div className="text-sm text-[#94A3B8]">{selectedHajjBooking.package_type}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Client</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.client_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Phone</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.client_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Email</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.client_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Pilgrims</span>
                  <span className="font-semibold text-[#1A2A3A]">{selectedHajjBooking.pilgrims}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Total Amount</span>
                  <span className="font-bold text-[#1769AA]">{formatCurrency(selectedHajjBooking.total_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Booking Date</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatDate(selectedHajjBooking.booking_date)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#94A3B8]">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadge(selectedHajjBooking.status).bg} ${getStatusBadge(selectedHajjBooking.status).text}`}>
                    {getStatusBadge(selectedHajjBooking.status).label}
                  </span>
                </div>
              </div>

              {selectedHajjBooking.pilgrim_names && selectedHajjBooking.pilgrim_names.length > 0 && (
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider mb-2">Pilgrim Names</p>
                  <ul className="text-sm text-[#1A2A3A] space-y-1">
                    {selectedHajjBooking.pilgrim_names.map((name, i) => (
                      <li key={i}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedHajjBooking.special_requests && (
                <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                  <strong>Special Requests:</strong> {selectedHajjBooking.special_requests}
                </div>
              )}

              {selectedHajjBooking.status !== 'cancelled' && selectedHajjBooking.status !== 'completed' && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                    onClick={() => {
                      const reason = prompt('Enter reason for confirming:');
                      if (reason !== null) {
                        setModalMessage('Booking confirmed');
                        setShowSuccessModal(true);
                        setTimeout(() => setShowSuccessModal(false), 3000);
                      }
                    }}
                    disabled={processing}
                  >
                    Confirm Booking
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
                    onClick={() => {
                      const reason = prompt('Enter reason for cancellation:');
                      if (reason !== null) {
                        handleCancelHajjBooking(selectedHajjBooking.id, reason);
                      }
                    }}
                    disabled={loading}
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
              <button
                className="w-full px-4 py-2 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition"
                onClick={() => setShowHajjBookingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT TAKAFUL PLAN MODAL ===== */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddPlanModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">
                {editingPlan ? 'Edit Takaful Plan' : 'Add New Takaful Plan'}
              </h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowAddPlanModal(false)}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Plan Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g., Family Takaful Plan"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Type *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.type}
                  onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                  placeholder="e.g., Family, Health, Education"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Coverage</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.coverage}
                  onChange={(e) => setPlanForm({ ...planForm, coverage: e.target.value })}
                  placeholder="e.g., Comprehensive Medical"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition resize-y"
                  rows="2"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Brief description of the plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Monthly Cost (KES) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={planForm.monthlyCost}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyCost: e.target.value })}
                    placeholder="1000"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Annual Cost (KES) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                    value={planForm.annualCost}
                    onChange={(e) => setPlanForm({ ...planForm, annualCost: e.target.value })}
                    placeholder="10000"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Max Coverage (KES) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.maxCoverage}
                  onChange={(e) => setPlanForm({ ...planForm, maxCoverage: e.target.value })}
                  placeholder="500000"
                  min="1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Benefits (comma separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition"
                  value={planForm.benefits.join(', ')}
                  onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value.split(',').map(b => b.trim()).filter(Boolean) })}
                  placeholder="e.g., Outpatient, Inpatient, Maternity"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="planActive"
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769AA] focus:ring-[#1769AA]/30"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                />
                <label htmlFor="planActive" className="text-sm text-[#5A6A7A]">Active</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#F1F7FC]">
                <button
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F1F7FC] text-[#5A6A7A] font-semibold text-sm hover:bg-[#E2E8F0] transition"
                  onClick={() => setShowAddPlanModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-[2] px-6 py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition disabled:opacity-60"
                  onClick={handleSavePlan}
                  disabled={loadingPlanForm || !planForm.name || !planForm.type || !planForm.monthlyCost || !planForm.annualCost || !planForm.maxCoverage}
                >
                  {loadingPlanForm ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] bg-emerald-600 rounded-t-3xl">
              <h3 className="text-xl font-heading font-bold text-white">Success</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-[#1A2A3A] font-medium">{modalMessage}</p>
            </div>
            <div className="p-6 border-t border-[#E8EEF4]">
              <button className="w-full py-3 rounded-xl bg-[#1769AA] text-white font-semibold text-sm hover:bg-[#2F80C0] transition" onClick={() => setShowSuccessModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;