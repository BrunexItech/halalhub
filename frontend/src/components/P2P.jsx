import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const P2P = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('halalhub_token');
  
  // ===== STEP MANAGEMENT =====
  const [currentStep, setCurrentStep] = useState(1);
  const [stepHistory, setStepHistory] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef(null);
  
  // ===== TRANSFER DATA =====
  const [recipient, setRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [transactionRef, setTransactionRef] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
  // ===== VALIDATION =====
  const [errors, setErrors] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // ===== REF FOR SCROLL =====
  const topRef = useRef(null);

  // ===== FETCH BALANCE =====
  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/p2p/balance`, config);
      setAvailableBalance(response.data.balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setAvailableBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // ===== SEARCH USERS =====
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setIsSearching(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE}/p2p/users?q=${encodeURIComponent(query)}`, config);
      setSearchResults(response.data.users || []);
      setShowSearch(true);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ===== SMOOTH STEP TRANSITION =====
  const goToStep = (step) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setStepHistory([...stepHistory, currentStep]);
    setCurrentStep(step);
    setErrors({});
    
    // Smooth scroll to top
    setTimeout(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const goBack = () => {
    if (isTransitioning) return;
    if (stepHistory.length > 0) {
      const previousStep = stepHistory[stepHistory.length - 1];
      setIsTransitioning(true);
      setStepHistory(stepHistory.slice(0, -1));
      setCurrentStep(previousStep);
      setErrors({});
      
      setTimeout(() => {
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    } else {
      setCurrentStep(1);
      setErrors({});
    }
  };

  // ===== HANDLERS =====
  const handleSearchSelect = (user) => {
    setRecipient(user);
    setSearchQuery(user.name);
    setSearchResults([]);
    setShowSearch(false);
    setErrors({});
    setTimeout(() => goToStep(2), 300);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors({ ...errors, amount: null });
      }
    }
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 1 && !recipient) {
      newErrors.recipient = 'Please select a recipient';
    }
    
    if (currentStep === 2) {
      if (!amount || parseFloat(amount) <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (parseFloat(amount) < 50) {
        newErrors.amount = 'Minimum transfer amount is KES 50';
      } else if (parseFloat(amount) > availableBalance) {
        newErrors.amount = 'Insufficient balance';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 3) {
        goToStep(4);
      } else if (currentStep === 1 && recipient) {
        goToStep(2);
      } else if (currentStep === 2) {
        goToStep(3);
      }
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrors({});

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_BASE}/p2p/transfer`, {
        recipient_id: recipient.id,
        amount: parseFloat(amount),
        note: note || ''
      }, config);

      if (response.data.success) {
        setTransactionRef(response.data.reference);
        setAvailableBalance(response.data.new_balance);
        setTransferComplete(true);
        goToStep(5);
      } else {
        setErrors({ confirm: response.data.error || 'Transfer failed. Please try again.' });
      }
    } catch (err) {
      setErrors({ confirm: err.response?.data?.error || 'Transfer failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTransfer = () => {
    setRecipient(null);
    setAmount('');
    setNote('');
    setSearchQuery('');
    setSearchResults([]);
    setTransferComplete(false);
    setTransactionRef(null);
    setErrors({});
    setStepHistory([]);
    setCurrentStep(1);
    fetchBalance();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStepLabel = () => {
    const labels = {
      1: 'Select Recipient',
      2: 'Enter Amount',
      3: 'Add Note',
      4: 'Review Transfer',
      5: 'Complete'
    };
    return labels[currentStep] || '';
  };

  // SVG Icons
  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );

  const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  // ===== RENDER STEPS =====
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2A3A] mb-1">Select Recipient</h2>
        <p className="text-sm text-[#94A3B8]">Search by name, phone number, or email</p>
      </div>

      <div className="relative">
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-3.5 pl-11 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
            placeholder="Search for a user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            <SearchIcon />
          </span>
          {isSearching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-[#1769AA]/20 border-t-[#1769AA] rounded-full animate-spin" />
            </span>
          )}
        </div>

        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8EEF4] rounded-xl shadow-xl max-h-64 overflow-y-auto z-20">
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F1F7FC] transition-colors text-left border-b border-[#F1F7FC] last:border-0"
                onClick={() => handleSearchSelect(user)}
              >
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1A2A3A] text-sm">{user.name}</div>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span>{user.phone}</span>
                    <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSearch && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8EEF4] rounded-xl shadow-xl p-4 text-center z-20">
            <p className="text-sm text-[#94A3B8]">No users found</p>
          </div>
        )}
      </div>

      {recipient && (
        <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4]">
          <div className="flex items-center gap-3">
            {recipient.profile_image ? (
              <img src={recipient.profile_image} alt={recipient.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-lg">
                {getInitials(recipient.name)}
              </div>
            )}
            <div>
              <div className="font-semibold text-[#1A2A3A]">{recipient.name}</div>
              <div className="text-sm text-[#94A3B8]">{recipient.phone}</div>
            </div>
            <button
              className="ml-auto text-sm text-[#94A3B8] hover:text-[#DC2626] transition-colors"
              onClick={() => setRecipient(null)}
            >
              Change
            </button>
          </div>
        </div>
      )}

      {errors.recipient && (
        <p className="text-sm text-[#DC2626]">{errors.recipient}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2A3A] mb-1">Enter Amount</h2>
        <p className="text-sm text-[#94A3B8]">Sending to {recipient?.name}</p>
      </div>

      <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#94A3B8] flex items-center gap-2">
            <WalletIcon /> Available balance
          </span>
          <span className="text-sm font-semibold text-[#1A2A3A]">
            {isLoadingBalance ? (
              <span className="inline-block w-16 h-4 bg-[#E2E8F0] rounded animate-pulse" />
            ) : (
              formatCurrency(availableBalance)
            )}
          </span>
        </div>
      </div>

      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#1A2A3A]">KES</span>
          <input
            type="text"
            className="w-full pl-16 pr-4 py-4 text-3xl font-bold border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            autoFocus
          />
        </div>
        {errors.amount && (
          <p className="text-sm text-[#DC2626] mt-2">{errors.amount}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[1000, 2500, 5000, 10000, 25000].map((val) => (
          <button
            key={val}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              parseFloat(amount) === val
                ? 'bg-[#1769AA] text-white'
                : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
            }`}
            onClick={() => setAmount(val.toString())}
          >
            {formatCurrency(val)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-[#F1F7FC]">
        {recipient?.profile_image ? (
          <img src={recipient.profile_image} alt={recipient.name} className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-sm">
            {recipient ? getInitials(recipient.name) : '??'}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-[#1A2A3A]">{recipient?.name}</div>
          <div className="text-xs text-[#94A3B8]">{recipient?.phone}</div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2A3A] mb-1">Add a Note</h2>
        <p className="text-sm text-[#94A3B8]">Optional · This will be visible to the recipient</p>
      </div>

      <div>
        <textarea
          className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200 resize-y"
          placeholder="Add a note (optional)"
          rows="4"
          value={note}
          onChange={handleNoteChange}
          autoFocus
        />
        <p className="text-xs text-[#94A3B8] mt-2">
          {note.length}/200 characters
        </p>
      </div>

      <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4]">
        <div className="flex items-center gap-3">
          {recipient?.profile_image ? (
            <img src={recipient.profile_image} alt={recipient.name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-sm">
              {recipient ? getInitials(recipient.name) : '??'}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-[#1A2A3A]">{recipient?.name}</div>
            <div className="text-xs text-[#94A3B8]">{recipient?.phone}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-bold text-[#1A2A3A]">{formatCurrency(parseFloat(amount) || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2A3A] mb-1">Review Transfer</h2>
        <p className="text-sm text-[#94A3B8]">Please verify the details before confirming</p>
      </div>

      <div className="bg-[#F1F7FC] rounded-xl p-5 border border-[#E8EEF4] space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#E8EEF4]">
          {recipient?.profile_image ? (
            <img src={recipient.profile_image} alt={recipient.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-lg">
              {recipient ? getInitials(recipient.name) : '??'}
            </div>
          )}
          <div>
            <div className="font-semibold text-[#1A2A3A]">{recipient?.name}</div>
            <div className="text-sm text-[#94A3B8]">{recipient?.phone}</div>
          </div>
        </div>

        <div className="flex justify-between py-2 border-b border-[#E8EEF4]">
          <span className="text-sm text-[#94A3B8]">Amount</span>
          <span className="text-sm font-semibold text-[#1A2A3A]">{formatCurrency(parseFloat(amount) || 0)}</span>
        </div>

        <div className="flex justify-between py-2 border-b border-[#E8EEF4]">
          <span className="text-sm text-[#94A3B8]">Fee</span>
          <span className="text-sm font-semibold text-emerald-600">No fee (0% Riba)</span>
        </div>

        <div className="flex justify-between py-2">
          <span className="text-sm font-semibold text-[#1A2A3A]">Total</span>
          <span className="text-lg font-bold text-[#1A2A3A]">{formatCurrency(parseFloat(amount) || 0)}</span>
        </div>

        {note && (
          <div className="pt-3 border-t border-[#E8EEF4]">
            <span className="text-sm text-[#94A3B8]">Note</span>
            <p className="text-sm text-[#1A2A3A] mt-1">{note}</p>
          </div>
        )}
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <p className="text-sm text-emerald-700 text-center">
          This is a Qard Hasan transfer — 0% interest, no riba. Your reward is with Allah.
        </p>
      </div>

      {errors.confirm && (
        <p className="text-sm text-[#DC2626] text-center">{errors.confirm}</p>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center py-6 space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
        <CheckIcon />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#1A2A3A]">Transfer Complete</h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Your transfer to {recipient?.name} was successful
        </p>
      </div>

      <div className="bg-[#F1F7FC] rounded-xl p-5 border border-[#E8EEF4] max-w-sm mx-auto text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[#94A3B8]">Amount</span>
          <span className="text-sm font-semibold text-[#1A2A3A]">{formatCurrency(parseFloat(amount) || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#94A3B8]">Recipient</span>
          <span className="text-sm font-semibold text-[#1A2A3A]">{recipient?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#94A3B8]">Transaction ID</span>
          <span className="text-sm font-mono text-[#1A2A3A]">{transactionRef}</span>
        </div>
        {note && (
          <div className="flex justify-between">
            <span className="text-sm text-[#94A3B8]">Note</span>
            <span className="text-sm text-[#1A2A3A]">{note}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-[#E8EEF4]">
          <span className="text-sm text-[#94A3B8]">Date</span>
          <span className="text-sm text-[#1A2A3A]">{new Date().toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#94A3B8]">New Balance</span>
          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(availableBalance)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-4">
        <button
          className="px-6 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
          onClick={resetTransfer}
        >
          Make Another Transfer
        </button>
        <button
          className="px-6 py-2.5 bg-white text-[#1A2A3A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-all duration-200"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  // ===== STEP CONTENT WRAPPER WITH SMOOTH TRANSITION =====
  const StepContent = ({ children }) => (
    <div
      ref={contentRef}
      className={`transition-all duration-300 ease-in-out ${
        isTransitioning ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'
      }`}
    >
      {children}
    </div>
  );

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6" ref={topRef}>
      <div className="max-w-2xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {currentStep > 1 && !transferComplete && (
              <button
                className="p-2 hover:bg-[#E8EEF4] rounded-xl transition-colors"
                onClick={goBack}
                disabled={isTransitioning}
              >
                <BackIcon />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#1A2A3A]">P2P Transfer</h1>
              <p className="text-sm text-[#94A3B8]">Send money to another HalalHub user</p>
            </div>
          </div>
        </div>

        {/* ===== PROGRESS ===== */}
        {!transferComplete && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#1769AA]">
                Step {currentStep} of 4
              </span>
              <span className="text-xs text-[#94A3B8]">·</span>
              <span className="text-xs text-[#94A3B8]">{getStepLabel()}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    step < currentStep
                      ? 'bg-[#1769AA]'
                      : step === currentStep
                      ? 'bg-[#1769AA]'
                      : 'bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== RECIPIENT INDICATOR ===== */}
        {currentStep > 1 && !transferComplete && recipient && (
          <div className="mb-4 p-3 bg-white rounded-xl border border-[#E8EEF4] shadow-sm">
            <div className="flex items-center gap-3">
              {recipient?.profile_image ? (
                <img src={recipient.profile_image} alt={recipient.name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1769AA] to-[#2F80C0] flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(recipient?.name)}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-[#1A2A3A]">{recipient?.name}</div>
                <div className="text-xs text-[#94A3B8]">{recipient?.phone}</div>
              </div>
              <button
                className="ml-auto text-xs text-[#94A3B8] hover:text-[#1769AA] transition-colors"
                onClick={() => {
                  setCurrentStep(1);
                  setStepHistory([]);
                }}
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* ===== CARD ===== */}
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-6 md:p-8 overflow-hidden">
          {transferComplete ? (
            <div className="animate-fadeIn">
              {renderStep5()}
            </div>
          ) : (
            <>
              <StepContent>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </StepContent>

              {/* ===== ACTIONS ===== */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-[#F1F7FC]">
                {currentStep > 1 && currentStep < 4 && (
                  <button
                    className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                    onClick={goBack}
                    disabled={isTransitioning}
                  >
                    Back
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    className={`${
                      currentStep > 1 ? 'flex-[2]' : 'flex-1'
                    } px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20 hover:shadow-lg hover:shadow-[#1769AA]/30 disabled:opacity-60 disabled:cursor-not-allowed`}
                    onClick={handleNext}
                    disabled={
                      isTransitioning ||
                      (currentStep === 1 && !recipient) ||
                      (currentStep === 2 && (!amount || parseFloat(amount) <= 0))
                    }
                  >
                    {currentStep === 3 ? 'Review Transfer' : 'Continue'}
                  </button>
                ) : (
                  <button
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                    disabled={isProcessing || isTransitioning}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Confirm Transfer'
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ===== ISLAMIC FOOTER ===== */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#94A3B8] tracking-wider">
            Qard Hasan · 0% Interest · No Riba
          </p>
        </div>
      </div>

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default P2P;