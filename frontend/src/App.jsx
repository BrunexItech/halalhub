import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Wallet from './components/Wallet';
import Zakat from './components/Zakat';
import Sadaqa from './components/Sadaqa';
import P2P from './components/P2P';
import Takaful from './components/Takaful';
import Pension from './components/Pension';
import Utilities from './components/Utilities';
import HalalStay from './components/HalalStay';
import Hajj from './components/Hajj';
import Hearse from './components/Hearse';
import Ecommerce from './components/Ecommerce';
import Restaurants from './components/Restaurants';
import MosqueFinder from './components/MosqueFinder';
import Wills from './components/Wills';
import Kadhis from './components/Kadhis';
import About from './components/About';
import KYCStatus from './components/KYCStatus';
import DevCode from './components/DevCode';
import AdminPanel from './components/AdminPanel';
import ChatBot from './components/ChatBot';
import Cart from './components/Cart';
import PaymentModal from './components/PaymentModal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('halalhub_token');
    if (token) {
      setIsAuthenticated(true);
      const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('halalhub_token', token);
    localStorage.setItem('halalhub_user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('halalhub_token');
    localStorage.removeItem('halalhub_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0B3D2E',
        color: '#C9A84C'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕋</div>
          <div style={{ fontFamily: "'Amiri', serif", fontSize: '2rem' }}>هَلَال هَبْ</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem' }}>HalalHub</div>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.6 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/zakat" element={<Zakat />} />
            <Route path="/sadaqa" element={<Sadaqa />} />
            <Route path="/p2p" element={<P2P />} />
            <Route path="/takaful" element={<Takaful />} />
            <Route path="/pension" element={<Pension />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/halalstay" element={<HalalStay />} />
            <Route path="/hajj" element={<Hajj />} />
            <Route path="/hearse" element={<Hearse />} />
            <Route path="/ecommerce" element={<Ecommerce />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/mosque" element={<MosqueFinder />} />
            <Route path="/wills" element={<Wills />} />
            <Route path="/kadhis" element={<Kadhis />} />
            <Route path="/about" element={<About />} />
            <Route path="/kyc-status" element={<KYCStatus />} />
            <Route path="/devcode" element={<DevCode />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ChatBot />
          <Cart />
          <PaymentModal />
        </div>
      </div>
    </Router>
  );
}

export default App;
