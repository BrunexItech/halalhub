import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { willService, pdfService } from '../services/api';
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
    { relation: 'Daughter', name: '', share: 'Asabah / 2', shareDecimal: 0.25 }
  ]);
  
  // ===== WILLS HISTORY =====
  const [willsHistory, setWillsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [estateValue, setEstateValue] = useState(5000000);
  const [inheritanceResult, setInheritanceResult] = useState(null);
  
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
      const res = await willService.getWills();
      if (res.data.success) {
        setWillsHistory(res.data.wills || []);
      }
    } catch (err) {
      console.error('History error:', err);
      setWillsHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchWillById = async (id) => {
    try {
      const res = await willService.getWillById(id);
      if (res.data.success) {
        const will = res.data.will;
        setWillData({
          fullName: will.fullName || '',
          idNumber: will.idNumber || '',
          executorName: will.executorName || '',
          executorPhone: will.executorPhone || '',
          executorEmail: will.executorEmail || '',
          assets: will.assets || '',
          bequests: will.bequests || [{ name: '', relation: '', amount: 0 }],
          witnesses: will.witnesses || [
            { name: '', idNumber: '', phone: '' },
            { name: '', idNumber: '', phone: '' }
          ],
          specialInstructions: will.specialInstructions || '',
          dateCreated: will.createdAt ? will.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        if (will.heirs && will.heirs.length > 0) {
          setHeirs(will.heirs);
        }
        setSuccess('Will loaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to load will');
      setTimeout(() => setError(''), 3000);
    }
  };

  // ===== HEIR MANAGEMENT =====
  const addHeir = () => {
    setHeirs([...heirs, { relation: '', name: '', share: '', shareDecimal: 0 }]);
  };

  const removeHeir = (index) => {
    if (heirs.length <= 1) {
      setError('You must have at least one heir');
      setTimeout(() => setError(''), 3000);
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
      setTimeout(() => setError(''), 3000);
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

  const saveWill = async () => {
    if (!willData.fullName) {
      setError('Please enter your full name');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!willData.executorName) {
      setError('Please enter the executor name');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!willData.assets) {
      setError('Please list your assets');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (willData.witnesses.some(w => !w.name)) {
      setError('Please enter all witness names');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSaveWill = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await willService.createWill({
        fullName: willData.fullName,
        idNumber: willData.idNumber,
        executorName: willData.executorName,
        executorPhone: willData.executorPhone,
        executorEmail: willData.executorEmail,
        assets: willData.assets,
        bequests: willData.bequests.filter(b => b.name),
        heirs: heirs.filter(h => h.relation || h.name),
        witnesses: willData.witnesses,
        specialInstructions: willData.specialInstructions,
        status: 'draft'
      });

      if (response.data.success) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        await fetchWillsHistory();
        setSuccess('Will created and encrypted successfully');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save will. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const calculateInheritance = async () => {
    setProcessing(true);
    try {
      const response = await willService.calculateInheritance({
        estate: estateValue,
        heirs: heirs
      });
      if (response.data.success) {
        setInheritanceResult(response.data.data);
        setSuccess('Inheritance calculated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to calculate inheritance');
      setTimeout(() => setError(''), 3000);
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
      
      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
      doc.text('ISLAMIC WILL (WASIYYAH)', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Bismillah ir-Rahman ir-Rahim', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;
      
      doc.setDrawColor(201, 164, 75);
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
      
      // Personal Information
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
      
      // Section 1: Executor
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
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
      
      // Section 2: Assets
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
      doc.text('2. ASSETS', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(willData.assets || 'No assets listed.', margin + 2, yPos, pageWidth - margin * 2 - 4);
      yPos += 8;
      
      // Section 3: Bequests
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
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
      
      // Section 4: Heirs
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
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
      
      // Section 5: Witnesses
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
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
      
      // Section 6: Special Instructions
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
      doc.text('6. SPECIAL INSTRUCTIONS', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(willData.specialInstructions || 'None', margin + 2, yPos, pageWidth - margin * 2 - 4);
      yPos += 8;
      
      // Section 7: Islamic Guidance
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 52, 43);
      doc.text('ISLAMIC GUIDANCE', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'italic');
      doc.text('"And whoever leaves behind a will, it shall be carried out after any debts."', margin, yPos);
      yPos += 6;
      doc.text('Quran, Surah Al-Baqarah 2:180', margin + 10, yPos);
      yPos += 8;
      
      doc.text('"Verily, Allah has given to each person their rightful share."', margin, yPos);
      yPos += 6;
      doc.text('Hadith', margin + 10, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('This will is made in accordance with Islamic Sharia law.', margin, yPos);
      yPos += 8;
      
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, margin, yPos);
      yPos += 12;
      
      // Signatures
      yPos = checkPageBreak(yPos + 10);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNATURES', margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Testator: _________________________', margin, yPos);
      yPos += 6;
      doc.text('Date: _____________________________', margin, yPos);
      yPos += 10;
      
      doc.text('Witness 1: _________________________', margin, yPos);
      yPos += 6;
      doc.text('Date: _____________________________', margin, yPos);
      yPos += 10;
      
      doc.text('Witness 2: _________________________', margin, yPos);
      yPos += 6;
      doc.text('Date: _____________________________', margin, yPos);
      yPos += 12;
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text(`Copyright ${new Date().getFullYear()} HalalHub - Islamic Will Services`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      doc.save(`Islamic_Will_${willData.fullName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setSuccess('PDF downloaded successfully');
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
      <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
          <p className="text-[#6B7280] mt-4 text-[15px]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-[#0B342B] mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 rounded-2xl p-8 md:p-12 shadow-lg shadow-[#0B342B]/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A44B]/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[13px] font-medium text-[#C9A44B] uppercase tracking-wider">Digital Wasiyyah</span>
                <span className="w-px h-4 bg-[#C9A44B]/30" />
                <span className="text-[13px] font-medium text-[#C9A44B]/70">Islamic Will</span>
              </div>
              <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-tight">
                Create Your Islamic Will
              </h1>
              <p className="text-white/70 text-[15px] mt-3 max-w-lg leading-relaxed">
                A guided process to create your Wasiyyah. Secure, Sharia-compliant, and professionally structured.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-semibold text-[#C9A44B] bg-white/10 px-4 py-2 rounded-xl border border-[#C9A44B]/20">
                Sharia Compliant
              </span>
              <span className="text-[13px] font-semibold text-white bg-white/10 px-4 py-2 rounded-xl border border-white/10">
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
          <div className="mb-6 p-4 bg-white border border-[#DC2626]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <span className="text-[15px] text-[#DC2626]">{error}</span>
            <button 
              className="px-5 py-2 bg-[#DC2626] text-white text-[13px] font-medium rounded-xl hover:bg-[#B91C1C] transition-colors"
              onClick={() => setError('')}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ===== LEFT COLUMN - WILL FORM ===== */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h2 className="text-[17px] font-semibold text-[#1F2937] mb-5">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Full Legal Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="fullName"
                    value={willData.fullName}
                    onChange={handleWillChange}
                    placeholder="As per National ID"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">ID Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
              <h2 className="text-[17px] font-semibold text-[#1F2937] mb-5">Executor (Wasi)</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Executor Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    name="executorName"
                    value={willData.executorName}
                    onChange={handleWillChange}
                    placeholder="Name of trusted executor"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                      name="executorPhone"
                      value={willData.executorPhone}
                      onChange={handleWillChange}
                      placeholder="+2547XXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
              <h2 className="text-[17px] font-semibold text-[#1F2937] mb-5">Assets</h2>
              <div>
                <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">List Your Assets</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white resize-y"
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-[17px] font-semibold text-[#1F2937]">Bequests</h2>
                <button
                  className="text-[15px] font-medium text-[#0B342B] hover:text-[#032A24] transition-colors"
                  onClick={addBequest}
                >
                  + Add Bequest
                </button>
              </div>
              <p className="text-[14px] text-[#6B7280] mb-4">Bequests cannot exceed 1/3 of your estate</p>
              
              <div className="space-y-3">
                {willData.bequests.map((bequest, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-[#FAFAF7] rounded-xl border border-[#E8EEF4] flex-wrap md:flex-nowrap">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        placeholder="Name"
                        value={bequest.name}
                        onChange={(e) => updateBequest(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        placeholder="Relation"
                        value={bequest.relation}
                        onChange={(e) => updateBequest(index, 'relation', e.target.value)}
                      />
                      <input
                        type="number"
                        className="px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        placeholder="Amount (KES)"
                        value={bequest.amount}
                        onChange={(e) => updateBequest(index, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      className="text-[#DC2626] hover:text-[#B91C1C] transition-colors flex-shrink-0 text-[18px]"
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-[17px] font-semibold text-[#1F2937]">Witnesses</h2>
                <span className="text-[14px] text-[#6B7280]">Two witnesses required</span>
              </div>
              
              <div className="space-y-4">
                {willData.witnesses.map((witness, index) => (
                  <div key={index} className="p-4 bg-[#FAFAF7] rounded-xl border border-[#E8EEF4]">
                    <h4 className="text-[15px] font-semibold text-[#1F2937] mb-3">Witness {index + 1}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        placeholder="Full Name *"
                        value={witness.name}
                        onChange={(e) => updateWitness(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                        placeholder="ID Number"
                        value={witness.idNumber}
                        onChange={(e) => updateWitness(index, 'idNumber', e.target.value)}
                      />
                      <input
                        type="tel"
                        className="px-3 py-2 border border-[#E8EEF4] rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
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
              <h2 className="text-[17px] font-semibold text-[#1F2937] mb-5">Special Instructions</h2>
              <textarea
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white resize-y"
                name="specialInstructions"
                value={willData.specialInstructions}
                onChange={handleWillChange}
                rows="3"
                placeholder="Any special instructions or wishes..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="flex-1 px-6 py-3.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                onClick={saveWill}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save & Encrypt Will'}
              </button>
              <button
                className="flex-1 px-6 py-3.5 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-all duration-200 text-[15px]"
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
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Islamic Guidance</h3>
              <div className="space-y-4">
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    "And whoever leaves behind a will, it shall be carried out after any debts." — Quran 2:180
                  </p>
                </div>
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    "Verily, Allah has given to each person their rightful share." — Hadith
                  </p>
                </div>
                <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                  <h4 className="text-[15px] font-semibold text-[#1F2937] mb-2">What is a Wasiyyah?</h4>
                  <p className="text-[15px] text-[#6B7280] leading-relaxed">
                    A Wasiyyah (Islamic will) allows you to allocate up to 1/3 of your estate 
                    to non-heirs, while the remaining 2/3 is distributed according to 
                    Faraidh (Islamic inheritance law).
                  </p>
                </div>
              </div>
            </div>

            {/* Faraidh Calculator */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <h3 className="text-[17px] font-semibold text-[#1F2937] mb-4">Faraidh Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">Estate Value (KES)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                    value={estateValue}
                    onChange={(e) => setEstateValue(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[15px] font-medium text-[#1F2937]">Heirs</h4>
                  <button
                    className="text-[15px] font-medium text-[#0B342B] hover:text-[#032A24] transition-colors"
                    onClick={addHeir}
                  >
                    + Add Heir
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {heirs.map((heir, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-[#FAFAF7] rounded-lg border border-[#E8EEF4] flex-wrap">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-[180px]">
                        <input
                          type="text"
                          className="px-2 py-1.5 border border-[#E8EEF4] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                          placeholder="Relation"
                          value={heir.relation}
                          onChange={(e) => updateHeir(index, 'relation', e.target.value)}
                        />
                        <input
                          type="text"
                          className="px-2 py-1.5 border border-[#E8EEF4] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                          placeholder="Name"
                          value={heir.name}
                          onChange={(e) => updateHeir(index, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          className="px-2 py-1.5 border border-[#E8EEF4] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200 bg-white"
                          placeholder="Share"
                          value={heir.share}
                          onChange={(e) => updateHeir(index, 'share', e.target.value)}
                        />
                      </div>
                      <button
                        className="text-[#DC2626] hover:text-[#B91C1C] transition-colors flex-shrink-0 text-[16px]"
                        onClick={() => removeHeir(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 shadow-md shadow-[#0B342B]/20 text-[15px]"
                  onClick={calculateInheritance}
                  disabled={processing}
                >
                  {processing ? 'Calculating...' : 'Calculate Inheritance'}
                </button>

                {inheritanceResult && (
                  <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                    <div className="flex justify-between text-[15px] font-semibold text-[#1F2937] mb-3">
                      <span>Distribution</span>
                      <span>Total: {formatCurrency(inheritanceResult.estate)}</span>
                    </div>
                    {inheritanceResult.distribution.map((item, index) => (
                      <div key={index} className="flex justify-between text-[14px] py-2 border-b border-[#E8EEF4] last:border-0">
                        <span className="text-[#6B7280]">{item.relation}: {item.name}</span>
                        <span className="font-medium text-[#1F2937]">{item.share} — {formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {inheritanceResult.remaining > 0 && (
                      <div className="flex justify-between text-[14px] py-2 border-t border-[#E8EEF4] mt-1 pt-2">
                        <span className="text-[#6B7280]">Remaining (Asabah)</span>
                        <span className="font-medium text-[#0B342B]">{formatCurrency(inheritanceResult.remaining)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Previous Wills */}
            <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-[17px] font-semibold text-[#1F2937]">Previous Wills</h3>
                <button 
                  className="text-[13px] text-[#0B342B] hover:text-[#032A24] transition-colors font-medium"
                  onClick={fetchWillsHistory}
                >
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-8 h-8 border-3 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin" />
                </div>
              ) : willsHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[15px] text-[#6B7280]">No previous wills</p>
                  <p className="text-[13px] text-[#6B7280] mt-1">Create your first will</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {willsHistory.map((will) => (
                    <div 
                      key={will.id} 
                      className="flex flex-wrap items-center justify-between p-3 bg-[#FAFAF7] rounded-lg cursor-pointer hover:border-[#0B342B] border border-transparent transition-all duration-200"
                      onClick={() => fetchWillById(will.id)}
                    >
                      <div>
                        <div className="font-medium text-[15px] text-[#1F2937]">{will.fullName || will.version}</div>
                        <div className="text-[13px] text-[#6B7280]">{formatDate(will.date)}</div>
                        {will.reference && (
                          <div className="text-[12px] text-[#6B7280] font-mono">Ref: {will.reference}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[12px] px-2 py-0.5 rounded-full border font-medium ${
                          will.status === 'active' ? 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]' : 
                          will.status === 'completed' ? 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]' :
                          'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                        }`}>
                          {will.status === 'active' ? 'Active' : 
                           will.status === 'completed' ? 'Completed' : 'Draft'}
                        </span>
                        <span className="text-[12px] text-[#6B7280]">v{will.version || '1'}</span>
                      </div>
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Confirm Will</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors text-[24px]" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📜</div>
                <div className="text-[17px] font-bold text-[#1F2937]">Save Your Islamic Will</div>
                <p className="text-[15px] text-[#6B7280] mt-1">Your will will be encrypted and stored securely.</p>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Executor</span>
                  <span className="font-semibold text-[#1F2937]">{willData.executorName}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Bequests</span>
                  <span className="font-semibold text-[#1F2937]">{willData.bequests.filter(b => b.name).length}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Heirs</span>
                  <span className="font-semibold text-[#1F2937]">{heirs.filter(h => h.relation || h.name).length}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Witnesses</span>
                  <span className="font-semibold text-[#1F2937]">{willData.witnesses.filter(w => w.name).length}/2</span>
                </div>
              </div>

              {error && <p className="text-[15px] text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex flex-col sm:flex-row gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                onClick={confirmSaveWill}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-white">Will Saved</h3>
                <button className="text-white/60 hover:text-white transition-colors text-[24px]" onClick={() => setShowSuccessModal(false)}>
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto border-4 border-[#0B342B]/20">
                <svg className="w-10 h-10 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <div className="text-[15px] text-[#6B7280]">Your Islamic Will has been created</div>
                <div className="text-[22px] font-bold text-[#1F2937]">Successfully Saved</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  Your will is encrypted and stored securely. Share the downloaded file with your lawyer and executor.
                </p>
              </div>

              <button
                className="w-full px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                onClick={generatePDF}
              >
                Download PDF
              </button>
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1]">
              <button 
                className="w-full px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
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
        <div className="fixed top-6 right-6 z-50 bg-[#0B342B] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#0B342B]/30 flex items-center gap-3 animate-slideDown max-w-sm border border-[#C9A44B]/20">
          <svg className="w-5 h-5 text-[#C9A44B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[15px] font-medium">{success}</span>
          <button 
            className="text-white/60 hover:text-white transition ml-2 flex-shrink-0"
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