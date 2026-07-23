import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const P2P = () => {
  const navigate = useNavigate();
  
  // ===== STEP MANAGEMENT =====
  const [currentStep, setCurrentStep] = useState(1);
  const [stepHistory, setStepHistory] = useState([]);
  
  // ===== TRANSFER DATA =====
  const [recipient, setRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [transactionRef, setTransactionRef] = useState(null);
  
  // ===== VALIDATION =====
  const [errors, setErrors] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  
  // ===== SINGLE MOCK USER =====
  const mockUser = {
    id: 1,
    name: 'Sharif Kahindi',
    phone: '+254 794 913 318',
    username: '@sharif_k',
    initials: 'SK'
  };

  // ===== AVAILABLE BALANCE =====
  const availableBalance = 150000;

  // ===== EFFECTS =====
  useEffect(() => {
    // Auto-select the user immediately
    setRecipient(mockUser);
    setSearchQuery(mockUser.name);
    setSearchResults([mockUser]);
    
    // Auto-advance to step 2 after a brief moment
    const timer = setTimeout(() => {
      if (currentStep === 1) {
        goToStep(2);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Search effect - still functional but now with only one user
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = [mockUser].filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [searchQuery]);

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

  const goToStep = (step) => {
    setStepHistory([...stepHistory, currentStep]);
    setCurrentStep(step);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (stepHistory.length > 0) {
      const previousStep = stepHistory[stepHistory.length - 1];
      setStepHistory(stepHistory.slice(0, -1));
      setCurrentStep(previousStep);
    } else {
      setCurrentStep(1);
    }
    setErrors({});
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

  const handleConfirm = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const ref = 'P2P-' + Date.now().toString().slice(-8);
      setTransactionRef(ref);
      setIsProcessing(false);
      setTransferComplete(true);
      goToStep(5);
    }, 2000);
  };

  const resetTransfer = () => {
    setRecipient(mockUser);
    setAmount('');
    setNote('');
    setSearchQuery(mockUser.name);
    setSearchResults([mockUser]);
    setTransferComplete(false);
    setTransactionRef(null);
    setErrors({});
    setStepHistory([]);
    setCurrentStep(2); // Skip to step 2 since user is pre-selected
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  // ===== RENDER STEPS =====
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2A3A] mb-1">Select Recipient</h2>
        <p className="text-sm text-[#94A3B8]">Search by name, phone number, or username</p>
      </div>

      <div className="relative">
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-3.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
            placeholder="Search for a user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8EEF4] rounded-xl shadow-xl max-h-64 overflow-y-auto z-20">
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F1F7FC] transition-colors text-left border-b border-[#F1F7FC] last:border-0"
                onClick={() => handleSearchSelect(user)}
              >
                <div className="w-10 h-10 rounded-xl bg-[#1769AA] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1A2A3A] text-sm">{user.name}</div>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span>{user.phone}</span>
                    <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
                    <span>{user.username}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSearch && searchResults.length === 0 && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8EEF4] rounded-xl shadow-xl p-4 text-center z-20">
            <p className="text-sm text-[#94A3B8]">No users found</p>
          </div>
        )}
      </div>

      {recipient && (
        <div className="bg-[#F1F7FC] rounded-xl p-4 border border-[#E8EEF4]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1769AA] flex items-center justify-center text-white font-bold text-lg">
              {recipient.initials}
            </div>
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
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#94A3B8]">Available balance</span>
          <span className="text-sm font-semibold text-[#1A2A3A]">{formatCurrency(availableBalance)}</span>
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
        <div className="w-10 h-10 rounded-xl bg-[#1769AA] flex items-center justify-center text-white font-bold text-sm">
          {recipient?.initials}
        </div>
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
          <div className="w-10 h-10 rounded-xl bg-[#1769AA] flex items-center justify-center text-white font-bold text-sm">
            {recipient?.initials}
          </div>
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
          <div className="w-12 h-12 rounded-xl bg-[#1769AA] flex items-center justify-center text-white font-bold text-lg">
            {recipient?.initials}
          </div>
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
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center py-6 space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
        <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
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

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {currentStep > 1 && !transferComplete && (
              <button
                className="p-2 hover:bg-[#E8EEF4] rounded-xl transition-colors"
                onClick={goBack}
              >
                <svg className="w-5 h-5 text-[#5A6A7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
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
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
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
        {currentStep > 1 && !transferComplete && (
          <div className="mb-4 p-3 bg-white rounded-xl border border-[#E8EEF4] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1769AA] flex items-center justify-center text-white font-bold text-xs">
                {recipient?.initials}
              </div>
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
        <div className="bg-white rounded-2xl border border-[#E8EEF4] shadow-sm p-6 md:p-8">
          {transferComplete ? (
            renderStep5()
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}

              {/* ===== ACTIONS ===== */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-[#F1F7FC]">
                {currentStep > 1 && currentStep < 4 && (
                  <button
                    className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                    onClick={goBack}
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
                    disabled={isProcessing}
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
    </div>
  );
};

export default P2P;