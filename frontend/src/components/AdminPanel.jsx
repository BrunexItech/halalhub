import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [usersRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users', config),
        axios.get('http://localhost:5000/api/admin/stats', config)
      ]);
      setUsers(usersRes.data.users || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        email,
        password
      });
      localStorage.setItem('admin_token', response.data.token);
      setToken(response.data.token);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted!');
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  if (!token) {
    return (
      <div className="page-body">
        <div className="page-header">
          <div>
            <div className="page-title">🛡️ Admin Login</div>
          </div>
        </div>
        <div className="card" style={{ maxWidth: '400px', margin: '40px auto', width: '100%' }}>
          <form onSubmit={handleLogin}>
            {error && <div style={{ color: '#C0392B', marginBottom: '16px' }}>{error}</div>}
            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-field" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-gold btn-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">🛡️ Admin Dashboard</div>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
      </div>

      <div className="stats-grid">
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, wordBreak: 'break-word' }}>{stats.totalUsers || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Active</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#27AE60', wordBreak: 'break-word' }}>{stats.activeUsers || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: '#6B5C3E' }}>Pending KYC</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#C0392B', wordBreak: 'break-word' }}>{stats.pendingKYC || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">👥 Users</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Balance</th>
                <th>KYC</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ wordBreak: 'break-word' }}>{u.fullname || u.fullName}</td>
                  <td style={{ wordBreak: 'break-word' }}>{u.phone}</td>
                  <td style={{ wordBreak: 'break-word' }}>{u.email}</td>
                  <td style={{ wordBreak: 'break-word' }}>KES {u.walletbalance || 0}</td>
                  <td>
                    <span className={`kyc-status-badge ${u.kycstatus === 'verified' ? 'kyc-verified' : 'kyc-pending'}`}>
                      {u.kycstatus || 'pending'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-red" onClick={() => deleteUser(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;