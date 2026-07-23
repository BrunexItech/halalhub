import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { willService, pdfService } from '../services/api';
// Import jsPDF
import jsPDF from 'jspdf';

const Wills = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // ===== WILL FORM =====
  const [willData, setWillData] = useState({
    fullName: '',
    idNumber: '',
    executorName: '',
    executorPhone: '',
    executorEmail: '',
    assets: '',
    bequests: [{ name: '', relation: '', amount: 0 }],
    witnesses: [
      { name: '', idNumber: '', phone: '' },
      { name: '', idNumber: '', phone: '' }
    ],
    specialInstructions: '',
    dateCreated: new Date().toISOString().split('T')[0]
  });
  
  // ===== HEIRS (Faraidh) =====
  const [heirs, setHeirs] = useState([
    { relation: 'Wife', name: '', share: '1/8', shareDecimal: 0.125 },
    { relation: 'Son', name: '', share: 'Asabah', shareDecimal: 0.5 },
    { relation: 'Daughter', name: '', share: 'Asabah ÷ 2', shareDecimal: 0.25 }
  ]);
  
  // ===== WILLS HISTORY =====
  const [willsHistory, setWillsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [estateValue, setEstateValue] = useState(5000000);
  
  // ===== MODALS =====
  const [showHeirModal, setShowHeirModal] = useState(false);
  const [showBequestModal, setShowBequestModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  
  // ===== PDF REF =====
  const willContentRef = useRef(null);

  // ===== FETCH DATA =====
  useEffect(() => {
    checkAuth();
    fetchWillsHistory();
    setLoading(false);
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('halalhub_token');
    const userData = JSON.parse(localStorage.getItem('halalhub_user') || '{}');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(userData);
      setWillData({
        ...willData,
        fullName: userData.fullName || '',
        executorName: userData.fullName || ''
      });
    }
  };

  const fetchWillsHistory = async () => {
    setLoadingHistory(true);
    try {
      setWillsHistory([
        { id: 1, date: '2024-04-01', status: 'active', version: 'v1' },
        { id: 2, date: '2024-01-15', status: 'draft', version: 'v0.5' }
      ]);
    } catch (err) {
      console.error('History error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ===== HEIR MANAGEMENT =====
  const addHeir = () => {
    setHeirs([...heirs, { relation: '', name: '', share: '', shareDecimal: 0 }]);
  };

  const removeHeir = (index) => {
    if (heirs.length <= 1) {
      setError('You must have at least one heir');
      return;
    }
    setHeirs(heirs.filter((_, i) => i !== index));
  };

  const updateHeir = (index, field, value) => {
    const updated = [...heirs];
    updated[index][field] = value;
    setHeirs(updated);
  };

  // ===== BEQUEST MANAGEMENT =====
  const addBequest = () => {
    setWillData({
      ...willData,
      bequests: [...willData.bequests, { name: '', relation: '', amount: 0 }]
    });
  };

  const removeBequest = (index) => {
    if (willData.bequests.length <= 1) {
      setError('You must have at least one bequest');
      return;
    }
    const updated = [...willData.bequests];
    updated.splice(index, 1);
    setWillData({ ...willData, bequests: updated });
  };

  const updateBequest = (index, field, value) => {
    const updated = [...willData.bequests];
    updated[index][field] = value;
    setWillData({ ...willData, bequests: updated });
  };

  // ===== WITNESS MANAGEMENT =====
  const updateWitness = (index, field, value) => {
    const updated = [...willData.witnesses];
    updated[index][field] = value;
    setWillData({ ...willData, witnesses: updated });
  };

  // ===== WILL OPERATIONS =====
  const handleWillChange = (e) => {
    const { name, value } = e.target;
    setWillData({ ...willData, [name]: value });
    setError('');
  };

  const saveWill = () => {
    if (!willData.fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!willData.executorName) {
      setError('Please enter the executor name');
      return;
    }
    if (!willData.assets) {
      setError('Please list your assets');
      return;
    }
    if (willData.witnesses.some(w => !w.name)) {
      setError('Please enter all witness names');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSaveWill = async () => {
    setProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      await fetchWillsHistory();
      
      setSuccess('Will created and encrypted successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to save will. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ===== PDF GENERATION =====
  const generatePDF = async () => {
    setProcessing(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;
      
      const addWrappedText = (text, x, y, maxWidth) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * 7);
      };
      
      const checkPageBreak = (newY) => {
        if (newY > pageHeight - margin) {
          doc.addPage();
          return margin;
        }
        return newY;
      };
      
      // ===== TITLE =====
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('ISLAMIC WILL (WASIYYAH)', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('بسم الله الرحمن الرحيم', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
      
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('IN THE NAME OF ALLAH, THE MOST GRACIOUS, THE MOST MERCIFUL', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text('This is the last will and testament of:', margin, yPos);
      yPos += 8;
      
      // ===== PERSONAL INFORMATION =====
      doc.setFont('helvetica', 'bold');
      doc.text('Full Name:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(willData.fullName || 'N/A', margin + 50, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'bold');
      doc.text('ID Number:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(willData.idNumber || 'N/A', margin + 50, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Date:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString(), margin + 50, yPos);
      yPos += 12;
      
      // ===== SECTION 1: EXECUTOR =====
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('1. APPOINTMENT OF EXECUTOR (WASI)', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('I hereby appoint the following person as the executor of my will:', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(willData.executorName || 'N/A', margin + 50, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(willData.executorPhone || 'N/A', margin + 50, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(willData.executorEmail || 'N/A', margin + 50, yPos);
      yPos += 12;
      
      // ===== SECTION 2: ASSETS =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('2. ASSETS', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(willData.assets || 'No assets listed.', margin + 2, yPos, pageWidth - margin * 2 - 4);
      yPos += 8;
      
      // ===== SECTION 3: BEQUESTS =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('3. BEQUESTS (Max 1/3 of Estate)', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      const validBequests = willData.bequests.filter(b => b.name);
      if (validBequests.length === 0) {
        doc.text('No bequests specified.', margin, yPos);
        yPos += 8;
      } else {
        validBequests.forEach((b, i) => {
          const text = `${i + 1}. ${b.name} (${b.relation || 'N/A'}) - KES ${(b.amount || 0).toLocaleString()}`;
          yPos = addWrappedText(text, margin + 2, yPos, pageWidth - margin * 2 - 4);
          yPos += 4;
        });
      }
      yPos += 8;
      
      // ===== SECTION 4: HEIRS =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('4. HEIRS (FARAIDH)', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Based on Islamic inheritance law, the estate shall be distributed as follows:', margin, yPos);
      yPos += 8;
      
      const validHeirs = heirs.filter(h => h.relation || h.name);
      validHeirs.forEach((h) => {
        const text = `${h.relation || 'Unknown'}: ${h.name || 'Unnamed'} - ${h.share || 'N/A'}`;
        yPos = addWrappedText(text, margin + 4, yPos, pageWidth - margin * 2 - 8);
        yPos += 4;
      });
      yPos += 4;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Estate Value: KES ${estateValue.toLocaleString()}`, margin, yPos);
      yPos += 12;
      
      // ===== SECTION 5: WITNESSES =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('5. WITNESSES', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('I declare this to be my last will and testament in the presence of the following witnesses:', margin, yPos);
      yPos += 8;
      
      willData.witnesses.forEach((w, i) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`Witness ${i + 1}:`, margin, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Name:', margin + 4, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(w.name || 'N/A', margin + 40, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text('ID:', margin + 4, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(w.idNumber || 'N/A', margin + 40, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Phone:', margin + 4, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(w.phone || 'N/A', margin + 40, yPos);
        yPos += 8;
      });
      
      // ===== SECTION 6: SPECIAL INSTRUCTIONS =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('6. SPECIAL INSTRUCTIONS', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(willData.specialInstructions || 'None', margin + 2, yPos, pageWidth - margin * 2 - 4);
      yPos += 8;
      
      // ===== SECTION 7: ISLAMIC GUIDANCE =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 105, 170);
      doc.text('ISLAMIC GUIDANCE', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'italic');
      doc.text('"And whoever leaves behind a will, it shall be carried out after any debts."', margin, yPos);
      yPos += 6;
      doc.text('— Quran, Surah Al-Baqarah 2:180', margin + 10, yPos);
      yPos += 8;
      
      doc.text('"Verily, Allah has given to each person their rightful share."', margin, yPos);
      yPos += 6;
      doc.text('— Hadith', margin + 10, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('This will is made in accordance with Islamic Sharia law.', margin, yPos);
      yPos += 8;
      
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, margin, yPos);
      yPos += 12;
      
      // ===== SIGNATURES =====
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURES', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Testator: _________________________', margin, yPos);
      yPos += 6;
      doc.text(`Date: _____________________________`, margin, yPos);
      yPos += 10;
      
      doc.text('Witness 1: _________________________', margin, yPos);
      yPos += 6;
      doc.text(`Date: _____________________________`, margin, yPos);
      yPos += 10;
      
      doc.text('Witness 2: _________________________', margin, yPos);
      yPos += 6;
      doc.text(`Date: _____________________________`, margin, yPos);
      yPos += 12;
      
      // ===== FOOTER =====
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text(`© ${new Date().getFullYear()} HalalHub - Islamic Will Services`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      doc.save(`Islamic_Will_${willData.fullName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setSuccess('PDF downloaded successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
      console.error('PDF error:', err);
    } finally {
      setProcessing(false);
    }
  };

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
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 p-8 md:p-12 shadow-lg shadow-[#1769AA]/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Digital Wasiyyah</span>
                <span className="w-px h-4 bg-white/20" />
                <span className="text-xs font-medium text-white/50">Islamic Will</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Create Your Islamic Will
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                A guided process to create your Wasiyyah. Secure, Sharia-compliant, and professionally structured.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#E8C96A] bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                Sharia Compliant
              </span>
              <span className="text-xs font-semibold text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* ===== ERROR ===== */}
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#DC2626]">{error}</span>
            <button 
              className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ===== LEFT COLUMN - WILL FORM ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1A2A3A] mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Full Legal Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="fullName"
                    value={willData.fullName}
                    onChange={handleWillChange}
                    placeholder="As per National ID"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">ID Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="idNumber"
                    value={willData.idNumber}
                    onChange={handleWillChange}
                    placeholder="National ID / Passport"
                  />
                </div>
              </div>
            </div>

            {/* Executor */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1A2A3A] mb-4">Executor (Wasi)</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Executor Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    name="executorName"
                    value={willData.executorName}
                    onChange={handleWillChange}
                    placeholder="Name of trusted executor"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      name="executorPhone"
                      value={willData.executorPhone}
                      onChange={handleWillChange}
                      placeholder="+2547XXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                      name="executorEmail"
                      value={willData.executorEmail}
                      onChange={handleWillChange}
                      placeholder="executor@email.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1A2A3A] mb-4">Assets</h2>
              <div>
                <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">List Your Assets</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
                  name="assets"
                  value={willData.assets}
                  onChange={handleWillChange}
                  rows="4"
                  placeholder="Bank accounts, property, business interests, vehicles, investments, digital assets, personal valuables..."
                />
              </div>
            </div>

            {/* Bequests */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#1A2A3A]">Bequests</h2>
                <button
                  className="text-sm font-semibold text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={addBequest}
                >
                  + Add
                </button>
              </div>
              <p className="text-sm text-[#94A3B8] mb-4">Bequests cannot exceed 1/3 of your estate</p>
              
              <div className="space-y-3">
                {willData.bequests.map((bequest, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[#F1F7FC] rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                        placeholder="Name"
                        value={bequest.name}
                        onChange={(e) => updateBequest(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                        placeholder="Relation"
                        value={bequest.relation}
                        onChange={(e) => updateBequest(index, 'relation', e.target.value)}
                      />
                      <input
                        type="number"
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                        placeholder="Amount (KES)"
                        value={bequest.amount}
                        onChange={(e) => updateBequest(index, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      className="text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                      onClick={() => removeBequest(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Witnesses */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#1A2A3A]">Witnesses</h2>
                <span className="text-xs text-[#94A3B8]">Two witnesses required</span>
              </div>
              
              <div className="space-y-4">
                {willData.witnesses.map((witness, index) => (
                  <div key={index} className="p-4 bg-[#F1F7FC] rounded-lg">
                    <h4 className="text-sm font-semibold text-[#1A2A3A] mb-3">Witness {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                        placeholder="Full Name *"
                        value={witness.name}
                        onChange={(e) => updateWitness(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                        placeholder="ID Number"
                        value={witness.idNumber}
                        onChange={(e) => updateWitness(index, 'idNumber', e.target.value)}
                      />
                      <input
                        type="tel"
                        className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                        placeholder="Phone"
                        value={witness.phone}
                        onChange={(e) => updateWitness(index, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1A2A3A] mb-4">Special Instructions</h2>
              <textarea
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
                name="specialInstructions"
                value={willData.specialInstructions}
                onChange={handleWillChange}
                rows="3"
                placeholder="Any special instructions or wishes..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                className="flex-1 px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20"
                onClick={saveWill}
              >
                Save & Encrypt Will
              </button>
              <button
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-all duration-200"
                onClick={generatePDF}
                disabled={processing}
              >
                {processing ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-6">
            
            {/* Islamic Guidance */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Islamic Guidance</h3>
              <div className="space-y-4">
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    "And whoever leaves behind a will, it shall be carried out after any debts." — Quran 2:180
                  </p>
                </div>
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    "Verily, Allah has given to each person their rightful share." — Hadith
                  </p>
                </div>
                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-[#1A2A3A] mb-1">What is a Wasiyyah?</h4>
                  <p className="text-sm text-[#5A6A7A] leading-relaxed">
                    A Wasiyyah (Islamic will) allows you to allocate up to <strong>1/3</strong> of your estate 
                    to non-heirs, while the remaining <strong>2/3</strong> is distributed according to 
                    <strong> Faraidh</strong> (Islamic inheritance law).
                  </p>
                </div>
              </div>
            </div>

            {/* Faraidh Calculator */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#1A2A3A] mb-3">Faraidh Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">Estate Value (KES)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                    value={estateValue}
                    onChange={(e) => setEstateValue(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#1A2A3A]">Heirs</h4>
                  <button
                    className="text-sm font-semibold text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                    onClick={addHeir}
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-2">
                  {heirs.map((heir, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-[#F1F7FC] rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                          placeholder="Relation"
                          value={heir.relation}
                          onChange={(e) => updateHeir(index, 'relation', e.target.value)}
                        />
                        <input
                          type="text"
                          className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                          placeholder="Name"
                          value={heir.name}
                          onChange={(e) => updateHeir(index, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA]"
                          placeholder="Share"
                          value={heir.share}
                          onChange={(e) => updateHeir(index, 'share', e.target.value)}
                        />
                      </div>
                      <button
                        className="text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                        onClick={() => removeHeir(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-[#F1F7FC] rounded-xl p-4">
                  <div className="flex justify-between text-sm font-semibold text-[#1A2A3A] mb-2">
                    <span>Estimated Distribution</span>
                    <span>Total: {formatCurrency(estateValue)}</span>
                  </div>
                  {heirs.map((heir, index) => {
                    let amount = 0;
                    if (heir.share.includes('/')) {
                      const parts = heir.share.split('/');
                      amount = (parseFloat(parts[0]) / parseFloat(parts[1])) * estateValue;
                    } else if (heir.share === 'Asabah') {
                      amount = estateValue * 0.5;
                    } else if (heir.share.includes('÷')) {
                      amount = (estateValue * 0.5) / 2;
                    }
                    return (
                      <div key={index} className="flex justify-between text-sm py-1 border-b border-[#E2E8F0] last:border-0">
                        <span className="text-[#5A6A7A]">{heir.relation}: {heir.name || 'Unnamed'}</span>
                        <span className="font-medium text-[#1A2A3A]">{heir.share} — {formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Previous Wills */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1A2A3A]">Previous Wills</h3>
                <button 
                  className="text-xs text-[#1769AA] hover:text-[#2F80C0] transition-colors"
                  onClick={fetchWillsHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin" />
                </div>
              ) : willsHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#94A3B8]">No previous wills</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {willsHistory.map((will) => (
                    <div key={will.id} className="flex items-center justify-between p-3 bg-[#F1F7FC] rounded-lg">
                      <div>
                        <div className="font-medium text-[#1A2A3A] text-sm">{will.version}</div>
                        <div className="text-xs text-[#94A3B8]">{formatDate(will.date)}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        will.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {will.status === 'active' ? 'Active' : 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Will</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📜</div>
                <div className="text-lg font-bold text-[#1A2A3A]">Save Your Islamic Will</div>
                <p className="text-sm text-[#94A3B8] mt-1">Your will will be encrypted and stored securely.</p>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Executor</span>
                  <span className="font-semibold text-[#1A2A3A]">{willData.executorName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Bequests</span>
                  <span className="font-semibold text-[#1A2A3A]">{willData.bequests.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Heirs</span>
                  <span className="font-semibold text-[#1A2A3A]">{heirs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Witnesses</span>
                  <span className="font-semibold text-[#1A2A3A]">{willData.witnesses.filter(w => w.name).length}/2</span>
                </div>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmSaveWill}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Will'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Will Saved!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <div className="text-sm text-[#94A3B8]">Your Islamic Will has been created</div>
                <div className="text-lg font-bold text-[#1A2A3A]">Successfully Saved</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] leading-relaxed">
                  Your will is encrypted and stored securely. Share the downloaded file with your lawyer and executor.
                </p>
              </div>

              <button
                className="w-full px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                onClick={generatePDF}
              >
                Download PDF
              </button>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC]">
              <button 
                className="w-full px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS TOAST ===== */}
      {success && (
        <div className="fixed top-6 right-6 z-50 bg-[#1769AA] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#1769AA]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-white/10">
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{success}</span>
          <button 
            className="text-white/60 hover:text-white transition ml-2"
            onClick={() => setSuccess('')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default Wills;