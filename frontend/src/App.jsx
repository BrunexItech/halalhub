import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Components
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import VendorDashboard from './components/VendorDashboard';
import Wallet from './components/Wallet';
import Zakat from './components/Zakat';
import Sadaqa from './components/Sadaqa';
import P2P from './components/P2P';
import Takaful from './components/Takaful';
import Pension from './components/Pension';
import SelectMosque from './components/SelectMosque';
import MosqueDetails from './components/MosqueDetails';
import ImamProfile from './components/ImamProfile';
import MosqueFinder from './components/MosqueFinder';
import Utilities from './components/Utilities';
import HalalStay from './components/HalalStay';
import Hajj from './components/Hajj';
import Hearse from './components/Hearse';
import Ecommerce from './components/Ecommerce';
import Restaurants from './components/Restaurants';
import Wills from './components/Wills';
import Kadhis from './components/Kadhis';
import About from './components/About';
import KYCStatus from './components/KYCStatus';
import AdminPanel from './components/AdminPanel';
import ChatBot from './components/ChatBot';
import PaymentModal from './components/PaymentModal';

// Registration Components
import RegisterRole from './components/RegisterRole';
import ClientRegister from './components/ClientRegister';
import VendorRegister from './components/VendorRegister';

// Scroll to top component
const ScrollToTop = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
  
  return children;
};

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

  const getDashboard = () => {
    if (user?.role === 'vendor') {
      return <VendorDashboard user={user} />;
    }
    return <Dashboard user={user} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1769AA] to-[#2F80C0]">
        <div className="text-center animate-pulse">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-3xl font-bold text-white">H</span>
            </div>
          </div>
          <div className="font-arabic text-4xl text-white/90">هَلَال هَبْ</div>
          <div className="font-heading text-2xl text-white/80 mt-1">HalalHub</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <div className="mt-4 text-sm text-white/50 tracking-widest uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<AuthScreen onLogin={handleLogin} />} />
          <Route path="/register/role" element={<RegisterRole />} />
          <Route path="/register/client" element={<ClientRegister />} />
          <Route path="/register/vendor" element={<VendorRegister />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <ScrollToTop>
        <div className="min-h-screen bg-[#F1F7FC]">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="pt-20 px-0 md:px-0 lg:px-0 max-w-full mx-auto pb-12">
            <Routes>
              <Route path="/" element={getDashboard()} />
              <Route path="/dashboard" element={getDashboard()} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/zakat" element={<Zakat />} />
              <Route path="/sadaqa" element={<Sadaqa />} />
              <Route path="/p2p" element={<P2P />} />
              <Route path="/takaful" element={<Takaful />} />
              
              {/* Imam Support Routes */}
              <Route path="/pension" element={<Pension />} />
              <Route path="/select-mosque" element={<SelectMosque />} />
              <Route path="/mosque/:id" element={<MosqueDetails />} />
              <Route path="/imam/:id" element={<ImamProfile />} />
              
              {/* Independent Mosque Finder */}
              <Route path="/mosque-finder" element={<MosqueFinder />} />
              
              <Route path="/utilities" element={<Utilities />} />
              <Route path="/halalstay" element={<HalalStay />} />
              <Route path="/hajj" element={<Hajj />} />
              <Route path="/hearse" element={<Hearse />} />
              <Route path="/ecommerce" element={<Ecommerce />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/wills" element={<Wills />} />
              <Route path="/kadhis" element={<Kadhis />} />
              <Route path="/about" element={<About />} />
              <Route path="/kyc-status" element={<KYCStatus />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <ChatBot />
          <PaymentModal />
        </div>
      </ScrollToTop>
    </Router>
  );
}

export default App;