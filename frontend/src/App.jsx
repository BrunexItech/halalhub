import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Components
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import VendorDashboard from './components/VendorDashboard';
import HearseProviderDashboard from './components/HearseProviderDashboard';
import LeaderDashboard from './components/LeaderDashboard';
import KadhiDashboard from './components/KadhiDashboard';
import Wallet from './components/Wallet';
import Zakat from './components/Zakat';
import Sadaqa from './components/Sadaqa';
import P2P from './components/P2P';
import Takaful from './components/Takaful';
import Pension from './components/Pension';
import SelectMosque from './components/SelectMosque';
import MosqueDetails from './components/MosqueDetails';
import LeaderPublicProfile from './components/LeaderPublicProfile';
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
import BankAdmin from './components/BankAdmin';
import ChatBot from './components/ChatBot';
import PaymentModal from './components/PaymentModal';
import VideoCall from './components/VideoCall';

// Registration Components
import RegisterRole from './components/RegisterRole';
import ClientRegister from './components/ClientRegister';
import VendorRegister from './components/VendorRegister';
import LeaderRegister from './components/LeaderRegister';

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
    localStorage.removeItem('halalhub_role');
    localStorage.removeItem('halalhub_subrole');
    localStorage.removeItem('halalhub_vendor_type');
    localStorage.removeItem('halalhub_leader_type');
    setIsAuthenticated(false);
    setUser(null);
  };

  const getDashboard = () => {
    if (user?.role === 'vendor') {
      const vendorType = localStorage.getItem('halalhub_vendor_type');
      if (vendorType === 'hearse') {
        return <HearseProviderDashboard user={user} />;
      }
      return <VendorDashboard user={user} />;
    }
    // All users (client, leader, imam) get the normal dashboard
    return <Dashboard user={user} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B342B] via-[#12342D] to-[#1A4A3D]">
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A44B]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-[#C9A44B]/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-[#C9A44B]/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C9A44B] to-[#B8923D] flex items-center justify-center shadow-2xl shadow-[#C9A44B]/30">
                <span className="text-3xl font-bold text-[#0B342B]">H</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-[#F7F6F1] tracking-tight">
              HalalHub
            </h1>
            <p className="text-sm text-[#C9A44B]/70 mt-2 tracking-widest uppercase font-medium">
              Sharia-Compliant Fintech
            </p>

            <div className="mt-8 w-64 mx-auto">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-[#C9A44B] to-[#B8923D] rounded-full animate-pulse" />
              </div>
              <div className="mt-3 flex justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A44B] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A44B] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A44B] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            <p className="mt-6 text-xs text-white/40 tracking-widest uppercase animate-pulse">
              Loading your experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<AuthScreen onLogin={handleLogin} />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/bank" element={<BankAdmin />} />
          <Route path="/register/role" element={<RegisterRole />} />
          <Route path="/register/client" element={<ClientRegister />} />
          <Route path="/register/vendor" element={<VendorRegister />} />
          <Route path="/register/leader" element={<LeaderRegister />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <ScrollToTop>
        <div className="min-h-screen bg-[#FAFAF7]">
          {location.pathname !== '/admin' && location.pathname !== '/admin/bank' && (
            <Navbar user={user} onLogout={handleLogout} />
          )}
          
          <main className={`pt-14 lg:pt-0 pb-12 min-h-screen ${location.pathname !== '/admin' && location.pathname !== '/admin/bank' ? '' : ''}`}>
            {location.pathname !== '/admin' && location.pathname !== '/admin/bank' ? (
              <div className="lg:pl-60">
                <Routes>
                  <Route path="/" element={getDashboard()} />
                  <Route path="/dashboard" element={getDashboard()} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/zakat" element={<Zakat />} />
                  <Route path="/sadaqa" element={<Sadaqa />} />
                  <Route path="/p2p" element={<P2P />} />
                  <Route path="/takaful" element={<Takaful />} />
                  
                  <Route path="/pension" element={<Pension />} />
                  <Route path="/leader-pension" element={<LeaderDashboard />} />
                  <Route path="/pension/leader/:id" element={<LeaderPublicProfile />} />
                  <Route path="/select-mosque" element={<SelectMosque />} />
                  <Route path="/mosque/:id" element={<MosqueDetails />} />
                  <Route path="/leader-dashboard" element={<LeaderDashboard />} />
                  <Route path="/consultations" element={<KadhiDashboard />} />
                  
                  <Route path="/kadhi-dashboard" element={<KadhiDashboard />} />
                  <Route path="/hearse-provider-dashboard" element={<HearseProviderDashboard />} />
                  <Route path="/mosque-finder" element={<MosqueFinder />} />
                  
                  <Route path="/utilities" element={<Utilities />} />
                  <Route path="/halalstay" element={<HalalStay />} />
                  <Route path="/hajj" element={<Hajj />} />
                  <Route path="/hearse" element={<Hearse />} />
                  
                  {/* Ecommerce Routes - Separate paths for each */}
                  <Route path="/market" element={<Ecommerce category="all" />} />
                  <Route path="/butchery" element={<Ecommerce category="butchery" />} />
                  <Route path="/restaurants" element={<Restaurants />} />
                  
                  <Route path="/wills" element={<Wills />} />
                  <Route path="/kadhis" element={<Kadhis />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/kyc-status" element={<KYCStatus />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin/bank" element={<BankAdmin />} />
                  
                  <Route path="/video-call/:bookingId" element={<VideoCall />} />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            ) : (
              <div className="lg:pl-0">
                <Routes>
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin/bank" element={<BankAdmin />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            )}
          </main>
          
          <ChatBot />
          <PaymentModal />
        </div>
      </ScrollToTop>
    </Router>
  );
}

export default App;