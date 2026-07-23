import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterKYC, setFilterKYC] = useState('All');
  
  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // ===== FETCH DATA =====
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoadingData(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users`, config),
        axios.get(`${API_BASE}/admin/stats`, config)
      ]);
      setUsers(usersRes.data.users || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoadingData(false);
    }
  };

  // ===== AUTHENTICATION =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/admin/login`, {
        email,
        password
      });
      localStorage.setItem('admin_token', response.data.token);
      setToken(response.data.token);
      setSuccess('✅ Login successful!');
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

  // ===== USER MANAGEMENT =====
  const deleteUser = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/admin/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      setModalMessage(`✅ User ${userToDelete.fullname || userToDelete.fullName} deleted successfully`);
      setShowSuccessModal(true);
      await fetchData();
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
      setUsers(users.map(u => 
        u.id === userId ? { ...u, kycstatus: status } : u
      ));
      setModalMessage(`✅ KYC status updated to ${status}`);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      await fetchData();
    } catch (err) {
      setError('Failed to update KYC status');
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // ===== FILTERS =====
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.fullname || user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || '').includes(searchQuery);
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesKYC = filterKYC === 'All' || (user.kycstatus || 'pending') === filterKYC;
    return matchesSearch && matchesRole && matchesKYC;
  });

  // ===== HELPERS =====
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
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'verified': { bg: '#E8F5E9', color: '#1B5E20', icon: '✅', label: 'Verified' },
      'pending': { bg: '#FFF3E0', color: '#E65100', icon: '⏳', label: 'Pending' },
      'rejected': { bg: '#FFEBEE', color: '#B71C1C', icon: '❌', label: 'Rejected' },
      'active': { bg: '#E8F5E9', color: '#1B5E20', icon: '✅', label: 'Active' },
      'inactive': { bg: '#F5F5F5', color: '#616161', icon: '⭕', label: 'Inactive' },
      'suspended': { bg: '#FFEBEE', color: '#B71C1C', icon: '🚫', label: 'Suspended' }
    };
    return statusMap[status] || { bg: '#F5F5F5', color: '#616161', icon: '📌', label: status || 'N/A' };
  };

  const getRoleBadge = (role) => {
    if (role === 'vendor') {
      return <span className="role-badge role-vendor">🏪 Vendor</span>;
    } else if (role === 'admin') {
      return <span className="role-badge role-admin">🛡️ Admin</span>;
    }
    return <span className="role-badge role-client">👤 Client</span>;
  };

  // ===== LOADING STATE =====
  if (!token) {
    return (
      <div className="page-body admin-login-page">
        <div className="page-header">
          <div>
            <div className="page-title">🛡️ Admin Login</div>
            <div className="page-subtitle">Secure access to admin panel</div>
          </div>
        </div>
        <div className="admin-login-card">
          <form onSubmit={handleLogin} className="admin-login-form">
            {error && (
              <div className="login-error">
                <span>⚠️ {error}</span>
                <button onClick={() => setError('')}>✕</button>
              </div>
            )}
            {success && (
              <div className="login-success">
                <span>✅ {success}</span>
              </div>
            )}
            <div className="form-field">
              <label className="form-label">📧 Email</label>
              <input 
                className="form-input" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@halalhub.com"
                required 
              />
            </div>
            <div className="form-field">
              <label className="form-label">🔒 Password</label>
              <input 
                className="form-input" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
              />
            </div>
            <button className="btn btn-gold btn-full login-submit" disabled={loading}>
              {loading ? 'Logging in...' : '🛡️ Login as Admin'}
            </button>
            <div className="login-note">
              🔒 Secure access · Authorized personnel only
            </div>
          </form>
        </div>
        <style>{`
          .admin-login-page {
            max-width: 900px;
            margin: 0 auto;
          }
          .admin-login-card {
            max-width: 400px;
            margin: 40px auto;
            background: white;
            border-radius: 14px;
            padding: 32px;
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .admin-login-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .login-error {
            background: rgba(192,57,43,0.08);
            border: 1px solid #C0392B;
            color: #C0392B;
            padding: 10px 14px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .login-error button {
            background: none;
            border: none;
            color: #C0392B;
            font-size: 1.1rem;
            cursor: pointer;
          }
          .login-success {
            background: rgba(39,174,96,0.08);
            border: 1px solid #27AE60;
            color: #27AE60;
            padding: 10px 14px;
            border-radius: 8px;
          }
          .login-submit {
            padding: 14px;
            font-size: 1rem;
            font-weight: 700;
          }
          .login-note {
            text-align: center;
            font-size: 0.75rem;
            color: #6B5C3E;
          }
          @media (max-width: 480px) {
            .admin-login-card {
              padding: 20px;
              margin: 20px auto;
            }
          }
        `}</style>
      </div>
    );
  }

  // ===== MAIN ADMIN DASHBOARD =====
  return (
    <div className="page-body admin-dashboard">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div>
          <div className="page-title">🛡️ Admin Dashboard</div>
          <div className="page-subtitle">Manage users, KYC, and platform activities</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-sm btn-outline" onClick={fetchData}>
            🔄 Refresh
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="admin-error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ===== STATS GRID ===== */}
      <div className="admin-stats-grid">
        <div className="stat-card stat-card-forest">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalUsers || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.activeUsers || 0}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card stat-card-gold">
          <div className="stat-icon">🏪</div>
          <div className="stat-value">{stats.totalVendors || 0}</div>
          <div className="stat-label">Total Vendors</div>
        </div>
        <div className="stat-card stat-card-red">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pendingKYC || 0}</div>
          <div className="stat-label">Pending KYC</div>
        </div>
        <div className="stat-card stat-card-teal">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue || 0)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalOrders || 0}</div>
          <div className="stat-label">Total Orders</div>
        </div>
      </div>

      {/* ===== USERS SECTION ===== */}
      <div className="admin-users-card">
        <div className="card-header">
          <span className="card-title">👥 Users</span>
          <div className="user-controls">
            <span className="user-count">{filteredUsers.length} users</span>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="admin-filters">
          <div className="filter-field">
            <input
              type="text"
              className="filter-input"
              placeholder="🔍 Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="client">👤 Clients</option>
              <option value="vendor">🏪 Vendors</option>
              <option value="admin">🛡️ Admins</option>
            </select>
          </div>
          <div className="filter-field">
            <select
              className="filter-select"
              value={filterKYC}
              onChange={(e) => setFilterKYC(e.target.value)}
            >
              <option value="All">All KYC</option>
              <option value="verified">✅ Verified</option>
              <option value="pending">⏳ Pending</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        {loadingData ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <span>Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📭</div>
            <div className="admin-empty-title">No users found</div>
            <div className="admin-empty-text">Try adjusting your search or filters</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Balance</th>
                  <th>KYC</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const kycStatus = getStatusBadge(user.kycstatus || 'pending');
                  return (
                    <tr key={user.id} className="admin-table-row">
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {(user.fullname || user.fullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{user.fullname || user.fullName || 'Unknown'}</div>
                            <div className="user-username">@{user.username || 'user'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-contact">
                          <div className="user-email">{user.email || 'N/A'}</div>
                          <div className="user-phone">{user.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td className="user-balance">{formatCurrency(user.walletbalance || 0)}</td>
                      <td>
                        <span className="kyc-badge" style={{
                          background: kycStatus.bg,
                          color: kycStatus.color,
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {kycStatus.icon} {kycStatus.label}
                        </span>
                        {user.kycstatus === 'pending' && (
                          <div className="kyc-actions">
                            <button 
                              className="kyc-btn kyc-approve"
                              onClick={() => updateKYCStatus(user.id, 'verified')}
                              disabled={loading}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="kyc-btn kyc-reject"
                              onClick={() => updateKYCStatus(user.id, 'rejected')}
                              disabled={loading}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="user-joined">{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn action-view"
                            onClick={() => viewUserDetails(user)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button 
                            className="action-btn action-delete"
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            title="Delete User"
                          >
                            🗑️
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

      {/* ======================================== */}
      {/* ===== USER DETAIL MODAL ===== */}
      {/* ======================================== */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 User Details</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-header">
                <div className="user-detail-avatar">
                  {(selectedUser.fullname || selectedUser.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="user-detail-name">{selectedUser.fullname || selectedUser.fullName}</div>
                  <div className="user-detail-role">{getRoleBadge(selectedUser.role)}</div>
                </div>
              </div>
              <div className="user-detail-grid">
                <div className="user-detail-item">
                  <span className="user-detail-label">📧 Email</span>
                  <span className="user-detail-value">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">📱 Phone</span>
                  <span className="user-detail-value">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">💰 Balance</span>
                  <span className="user-detail-value">{formatCurrency(selectedUser.walletbalance || 0)}</span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">📋 KYC Status</span>
                  <span className="user-detail-value">
                    <span className="kyc-badge" style={{
                      background: getStatusBadge(selectedUser.kycstatus || 'pending').bg,
                      color: getStatusBadge(selectedUser.kycstatus || 'pending').color,
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      {getStatusBadge(selectedUser.kycstatus || 'pending').icon} {getStatusBadge(selectedUser.kycstatus || 'pending').label}
                    </span>
                  </span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">📅 Joined</span>
                  <span className="user-detail-value">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="user-detail-item">
                  <span className="user-detail-label">🔄 Status</span>
                  <span className="user-detail-value">
                    <span className="status-badge" style={{
                      background: selectedUser.status === 'active' ? '#E8F5E9' : '#F5F5F5',
                      color: selectedUser.status === 'active' ? '#1B5E20' : '#616161',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      {selectedUser.status === 'active' ? '✅ Active' : '⭕ Inactive'}
                    </span>
                  </span>
                </div>
              </div>
              {selectedUser.kycstatus === 'pending' && (
                <div className="user-detail-kyc-actions">
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      updateKYCStatus(selectedUser.id, 'verified');
                      setShowUserModal(false);
                    }}
                  >
                    ✅ Approve KYC
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      updateKYCStatus(selectedUser.id, 'rejected');
                      setShowUserModal(false);
                    }}
                  >
                    ❌ Reject KYC
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUserModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {/* ======================================== */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="delete-icon">🗑️</div>
              <div className="delete-title">Delete User?</div>
              <div className="delete-message">
                Are you sure you want to delete <strong>{userToDelete.fullname || userToDelete.fullName}</strong>?
                This action cannot be undone.
              </div>
              {error && <div className="delete-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={deleteUser} disabled={loading}>
                {loading ? 'Deleting...' : '🗑️ Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* ===== SUCCESS MODAL ===== */}
      {/* ======================================== */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header success-header">
              <h3>✅ Success</h3>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>✕</button>
            </div>
            <div className="modal-body success-body">
              <div className="success-icon">🎉</div>
              <div className="success-title">{modalMessage}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-gold" onClick={() => setShowSuccessModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ======================================== */
        /* ===== ADMIN DASHBOARD STYLES ===== */
        /* ======================================== */

        .admin-dashboard {
          padding-bottom: 40px;
        }

        /* ===== HEADER ===== */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        .page-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* ===== ERROR BANNER ===== */
        .admin-error-banner {
          background: rgba(192, 57, 43, 0.08);
          border: 1px solid #C0392B;
          color: #C0392B;
          padding: 10px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-error-banner button {
          background: none;
          border: none;
          color: #C0392B;
          font-size: 1.1rem;
          cursor: pointer;
        }

        /* ===== STATS GRID ===== */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .stat-card-forest { border-top: 3px solid #0B3D2E; }
        .stat-card-green { border-top: 3px solid #27AE60; }
        .stat-card-gold { border-top: 3px solid #C9A84C; }
        .stat-card-red { border-top: 3px solid #C0392B; }
        .stat-card-teal { border-top: 3px solid #1A7A55; }
        .stat-card-purple { border-top: 3px solid #9C27B0; }

        .stat-icon {
          font-size: 1.8rem;
          display: block;
          margin-bottom: 4px;
        }

        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #0B3D2E;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #6B5C3E;
          font-weight: 500;
        }

        /* ===== USERS CARD ===== */
        .admin-users-card {
          background: white;
          border-radius: 14px;
          padding: 20px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          flex-wrap: wrap;
          gap: 8px;
        }

        .card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #0B3D2E;
        }

        .user-count {
          font-size: 0.75rem;
          color: #6B5C3E;
        }

        /* ===== FILTERS ===== */
        .admin-filters {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
        }

        .filter-input,
        .filter-select {
          padding: 8px 12px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          color: #1C1208;
          background: white;
          outline: none;
          transition: all 0.28s ease;
          width: 100%;
        }

        .filter-input:focus,
        .filter-select:focus {
          border-color: #0B3D2E;
          box-shadow: 0 0 0 3px rgba(11, 61, 46, 0.08);
        }

        /* ===== TABLE ===== */
        .table-wrapper {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .admin-table thead {
          background: #F9F4EC;
        }

        .admin-table th {
          padding: 12px 14px;
          text-align: left;
          font-weight: 600;
          color: #0B3D2E;
          border-bottom: 2px solid #0B3D2E;
          white-space: nowrap;
        }

        .admin-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .admin-table-row:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        /* ===== USER CELL ===== */
        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 600;
          color: #1C1208;
        }

        .user-username {
          font-size: 0.7rem;
          color: #6B5C3E;
        }

        .user-contact {
          display: flex;
          flex-direction: column;
        }

        .user-email {
          font-size: 0.8rem;
        }

        .user-phone {
          font-size: 0.7rem;
          color: #6B5C3E;
        }

        .user-balance {
          font-weight: 600;
          color: #0B3D2E;
        }

        .user-joined {
          font-size: 0.75rem;
          color: #6B5C3E;
        }

        /* ===== ROLE BADGE ===== */
        .role-badge {
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.65rem;
          font-weight: 600;
          display: inline-block;
        }

        .role-vendor {
          background: rgba(201, 168, 76, 0.15);
          color: #C9A84C;
        }

        .role-admin {
          background: rgba(192, 57, 43, 0.1);
          color: #C0392B;
        }

        .role-client {
          background: rgba(41, 128, 185, 0.1);
          color: #2980B9;
        }

        /* ===== KYC ACTIONS ===== */
        .kyc-actions {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }

        .kyc-btn {
          padding: 2px 8px;
          border: none;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
        }

        .kyc-approve {
          background: #E8F5E9;
          color: #1B5E20;
        }

        .kyc-approve:hover {
          background: #27AE60;
          color: white;
        }

        .kyc-reject {
          background: #FFEBEE;
          color: #B71C1C;
        }

        .kyc-reject:hover {
          background: #C0392B;
          color: white;
        }

        /* ===== ACTION BUTTONS ===== */
        .action-buttons {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-view {
          background: rgba(41, 128, 185, 0.1);
          color: #2980B9;
        }

        .action-view:hover {
          background: #2980B9;
          color: white;
        }

        .action-delete {
          background: rgba(192, 57, 43, 0.1);
          color: #C0392B;
        }

        .action-delete:hover {
          background: #C0392B;
          color: white;
        }

        /* ===== LOADING ===== */
        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #6B5C3E;
        }

        .admin-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-top-color: #C9A84C;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== EMPTY STATE ===== */
        .admin-empty {
          text-align: center;
          padding: 40px 20px;
          color: #6B5C3E;
        }

        .admin-empty-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .admin-empty-title {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .admin-empty-text {
          font-size: 0.8rem;
        }

        /* ======================================== */
        /* ===== MODALS ===== */
        /* ======================================== */

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(8px);
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .modal-header h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          color: #0B3D2E;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #6B5C3E;
          padding: 4px 8px;
          transition: color 0.2s ease;
        }

        .modal-close:hover {
          color: #C0392B;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .modal-footer .btn {
          flex: 1;
          padding: 10px;
          font-size: 0.85rem;
        }

        /* ===== USER DETAIL MODAL ===== */
        .user-detail-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .user-detail-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.5rem;
        }

        .user-detail-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1C1208;
        }

        .user-detail-role {
          margin-top: 2px;
        }

        .user-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .user-detail-item {
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.02);
          padding: 10px;
          border-radius: 8px;
        }

        .user-detail-label {
          font-size: 0.6rem;
          color: #6B5C3E;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .user-detail-value {
          font-size: 0.85rem;
          font-weight: 500;
          color: #1C1208;
          margin-top: 2px;
        }

        .user-detail-kyc-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        /* ===== DELETE MODAL ===== */
        .delete-modal {
          max-width: 400px;
        }

        .delete-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 8px;
        }

        .delete-title {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          color: #C0392B;
        }

        .delete-message {
          text-align: center;
          font-size: 0.85rem;
          color: #6B5C3E;
          margin: 8px 0 16px;
        }

        .delete-error {
          color: #C0392B;
          font-size: 0.8rem;
          padding: 8px;
          background: rgba(192, 57, 43, 0.06);
          border-radius: 6px;
        }

        /* ===== SUCCESS MODAL ===== */
        .success-header {
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          border-radius: 16px 16px 0 0;
        }

        .success-header h3 {
          color: white;
        }

        .success-header .modal-close {
          color: rgba(255, 255, 255, 0.6);
        }

        .success-header .modal-close:hover {
          color: white;
        }

        .success-body {
          text-align: center;
        }

        .success-icon {
          font-size: 3rem;
          margin-bottom: 4px;
        }

        .success-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1C1208;
        }

        /* ======================================== */
        /* ===== RESPONSIVE ===== */
        /* ======================================== */

        @media (max-width: 992px) {
          .admin-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .admin-filters {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .page-header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-filters {
            grid-template-columns: 1fr;
          }

          .user-detail-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            max-width: 100%;
            margin: 10px;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer .btn {
            width: 100%;
          }

          .user-detail-kyc-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .admin-stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .stat-card {
            padding: 12px;
          }

          .stat-value {
            font-size: 1.2rem;
          }

          .admin-table {
            font-size: 0.75rem;
          }

          .admin-table th,
          .admin-table td {
            padding: 8px 10px;
          }

          .user-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }

          .action-btn {
            width: 26px;
            height: 26px;
            font-size: 0.7rem;
          }

          .kyc-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;