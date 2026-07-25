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
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKYC, setFilterKYC] = useState('All');
  
  // Pending applications
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingImams, setPendingImams] = useState([]);
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
      setImams(allUsersData.filter(u => u.role === 'imam'));
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
      setPendingImams(imamsRes.data.imams || []);
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

  // Get the actual user ID for imam approval
  const getImamUserId = (imam) => {
    if (imam.user_id) return imam.user_id;
    if (imam.id && imam.id.startsWith('imamprof-')) {
      return imam.user_id || imam.id;
    }
    return imam.id;
  };

  // Get the actual user ID for vendor approval
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
      setModalMessage('Imam approved successfully!');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to approve imam');
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
      setModalMessage('Imam rejected');
      setShowSuccessModal(true);
      await fetchData();
      await fetchPendingApplications();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError('Failed to reject imam');
      console.error('Reject imam error:', err);
    } finally {
      setLoading(false);
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
    };
    return statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-500', label: status || 'N/A' };
  };

  const getRoleBadge = (role) => {
    const roles = {
      'vendor': 'bg-amber-50 text-amber-700',
      'admin': 'bg-red-50 text-red-700',
      'client': 'bg-blue-50 text-blue-700',
      'imam': 'bg-purple-50 text-purple-700'
    };
    return roles[role] || 'bg-gray-50 text-gray-500';
  };

  const getCurrentUsers = () => {
    switch(activeUserTab) {
      case 'clients': return clients;
      case 'vendors': return vendors;
      case 'imams': return imams;
      case 'admins': return admins;
      default: return allUsers;
    }
  };

  const getCurrentUserCount = () => {
    switch(activeUserTab) {
      case 'clients': return clients.length;
      case 'vendors': return vendors.length;
      case 'imams': return imams.length;
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

  // SVG Icons
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
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
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
            <button className="px-4 py-2.5 rounded-xl bg-white border border-[#E8EEF4] text-[#5A6A7A] hover:bg-[#F1F7FC] transition text-sm" onClick={() => { fetchData(); fetchTransactions(); fetchPendingApplications(); }}>
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
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
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
            <div className="flex justify-center mb-1 text-emerald-600"><OrdersIcon /></div>
            <div className="text-2xl font-heading font-bold text-emerald-600">{pendingVendors.length + pendingImams.length}</div>
            <div className="text-xs text-[#94A3B8]">Pending Apps</div>
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
            Pending Applications
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
                  <div className="text-4xl mb-2">No pending vendor applications</div>
                  <p className="text-[#1A2A3A] font-semibold">All vendors have been reviewed</p>
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

            {/* Pending Imams */}
            <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#F1F7FC]">
                <h3 className="text-lg font-heading font-bold text-[#1A2A3A]">Pending Imam Applications</h3>
                <span className="text-sm text-[#94A3B8]">{pendingImams.length} pending</span>
              </div>

              {loadingPending ? (
                <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : pendingImams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">No pending imam applications</div>
                  <p className="text-[#1A2A3A] font-semibold">All imams have been reviewed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#1A2A3A]">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Imam</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Mosque</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Contact</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Submitted</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingImams.map((imam) => (
                        <tr key={imam.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-semibold text-[#1A2A3A]">{imam.fullname}</div>
                              <div className="text-xs text-[#94A3B8]">{imam.title || 'Imam'}</div>
                            </div>
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
                      ))}
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
                <div className="text-4xl mb-2">No users found</div>
                <p className="text-[#1A2A3A] font-semibold">Try adjusting your search or filters</p>
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
                      return (
                        <tr key={user.id} className="border-b border-[#F1F7FC] hover:bg-[#F8FAFC] transition">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-xs">
                                {(user.fullname || user.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-[#1A2A3A]">{user.fullname || user.fullName || 'Unknown'}</div>
                                <div className="text-xs text-[#94A3B8]">{user.role || 'client'}</div>
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
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getRoleBadge(user.role)}`}>
                              {user.role || 'client'}
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
                              <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition" onClick={() => viewUserDetails(user)} title="View">View</button>
                              <button className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition" onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} title="Delete">Delete</button>
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
                <div className="text-4xl mb-2">No transactions found</div>
                <p className="text-[#1A2A3A] font-semibold">Try adjusting your search or filters</p>
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
      </div>

      {/* ===== USER DETAIL MODAL ===== */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold text-[#1A2A3A]">User Details</h3>
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#F1F7FC]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedUser.fullname || selectedUser.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-[#1A2A3A]">{selectedUser.fullname || selectedUser.fullName}</div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getRoleBadge(selectedUser.role)}`}>{selectedUser.role || 'client'}</span>
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
              <button className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="p-6 text-center">
              <div className="text-5xl mb-3">Delete User?</div>
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

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E8EEF4] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EEF4] bg-emerald-600 rounded-t-3xl">
              <h3 className="text-xl font-heading font-bold text-white">Success</h3>
            </div>
            <div className="p-6 text-center">
              <div className="text-5xl mb-3">Success</div>
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