import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const P2P = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('halalhub_token');
  
  // ===== STEP MANAGEMENT =====
  const [currentStep, setCurrentStep] = useState(1);
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
  const [errors, setErrors] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // ===== REFS =====
  const topRef = useRef(null);
  const searchInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const noteInputRef = useRef(null);

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

  // ===== HANDLERS =====
  const handleSearchSelect = (user) => {
    setRecipient(user);
    setSearchQuery(user.name);
    setSearchResults([]);
    setShowSearch(false);
    setErrors({});
    setCurrentStep(2);
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
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

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!recipient) {
        setErrors({ recipient: 'Please select a recipient.' });
        return;
      }
      setErrors({});
      setCurrentStep(2);
      setTimeout(() => amountInputRef.current?.focus(), 100);
    } else if (currentStep === 2) {
      if (!amount || parseFloat(amount) <= 0) {
        setErrors({ amount: 'Please enter a valid amount.' });
        return;
      }
      if (parseFloat(amount) < 50) {
        setErrors({ amount: 'Minimum transfer amount is KES 50.' });
        return;
      }
      if (parseFloat(amount) > availableBalance) {
        setErrors({ amount: 'Insufficient balance.' });
        return;
      }
      setErrors({});
      setCurrentStep(3);
      setTimeout(() => noteInputRef.current?.focus(), 100);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setErrors({});
      
      setTimeout(() => {
        if (prevStep === 1) {
          searchInputRef.current?.focus();
        } else if (prevStep === 2) {
          amountInputRef.current?.focus();
        } else if (prevStep === 3) {
          noteInputRef.current?.focus();
        }
      }, 100);
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
        setCurrentStep(5);
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
      3: 'Add a Note',
      4: 'Review Transfer',
      5: 'Complete'
    };
    return labels[currentStep] || '';
  };

  // ===== SVG ICONS =====
  const CheckIcon = () => (
    <svg className="w-10 h-10 text-[#3FAF73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );

  const BackIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const NoteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  // ===== STEP RENDERERS =====
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 mb-0.5">
        <div className="w-8 h-8 rounded-lg bg-[#0B342B]/5 flex items-center justify-center">
          <UserIcon />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Select a Recipient</h2>
          <p className="text-xs text-[#6B7280]">Search by name, phone, or email.</p>
        </div>
      </div>

      <div className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full px-3 py-2.5 pl-9 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
            placeholder="Search for a HalalHub user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]/60">
            <SearchIcon />
          </span>
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#C9A44B]/20 border-t-[#C9A44B] rounded-full animate-spin" />
            </span>
          )}
        </div>

        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[rgba(11,52,43,0.1)] rounded-lg shadow-xl shadow-black/5 max-h-56 overflow-y-auto z-20">
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAFAF7] transition-colors text-left border-b border-[rgba(11,52,43,0.06)] last:border-0"
                onClick={() => handleSearchSelect(user)}
              >
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B342B] to-[#12342D] flex items-center justify-center text-[#C9A44B] font-bold text-xs flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1F2937] text-xs">{user.name}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                    <span>{user.phone}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-[#E5E7EB]" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="text-[#0B342B]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSearch && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[rgba(11,52,43,0.1)] rounded-lg shadow-xl shadow-black/5 p-4 text-center z-20">
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-2">
              <UserIcon />
            </div>
            <p className="text-sm font-medium text-[#1F2937]">No users found</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Try searching with a different name or phone number.</p>
          </div>
        )}
      </div>

      {recipient && (
        <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(11,52,43,0.08)]">
          <div className="flex items-center gap-2.5">
            {recipient.profile_image ? (
              <img src={recipient.profile_image} alt={recipient.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B342B] to-[#12342D] flex items-center justify-center text-[#C9A44B] font-bold text-sm">
                {getInitials(recipient.name)}
              </div>
            )}
            <div>
              <div className="font-semibold text-[#1F2937] text-sm">{recipient.name}</div>
              <div className="text-xs text-[#6B7280]">{recipient.phone}</div>
            </div>
            <button
              className="ml-auto text-xs text-[#6B7280] hover:text-[#DC2626] transition-colors font-medium"
              onClick={() => {
                setRecipient(null);
                setSearchQuery('');
              }}
            >
              Change
            </button>
          </div>
        </div>
      )}

      {errors.recipient && (
        <p className="text-xs text-[#DC2626]">{errors.recipient}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 mb-0.5">
        <div className="w-8 h-8 rounded-lg bg-[#0B342B]/5 flex items-center justify-center">
          <WalletIcon />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Enter Amount</h2>
          <p className="text-xs text-[#6B7280]">Sending money to <span className="font-medium text-[#1F2937]">{recipient?.name}</span>.</p>
        </div>
      </div>

      <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(11,52,43,0.08)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6B7280] flex items-center gap-1.5">
            <WalletIcon /> Available balance
          </span>
          <span className="text-xs font-semibold text-[#1F2937]">
            {isLoadingBalance ? (
              <span className="inline-block w-16 h-3 bg-[#E5E7EB] rounded animate-pulse" />
            ) : (
              formatCurrency(availableBalance)
            )}
          </span>
        </div>
      </div>

      <div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-[#1F2937]">KES</span>
          <input
            ref={amountInputRef}
            type="text"
            className="w-full pl-14 pr-3 py-3.5 text-2xl font-bold bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-[#1F2937] placeholder-[#6B7280]/30 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-[#DC2626] mt-1.5">{errors.amount}</p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider mb-1.5">Quick Amounts</p>
        <div className="flex flex-wrap gap-1.5">
          {[1000, 2500, 5000, 10000, 25000].map((val) => (
            <button
              key={val}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                parseFloat(amount) === val
                  ? 'bg-[#0B342B] text-[#F7F6F1] shadow-sm shadow-[#0B342B]/20'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
              onClick={() => {
                setAmount(val.toString());
                if (errors.amount) {
                  setErrors({ ...errors, amount: null });
                }
              }}
            >
              {formatCurrency(val)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-2.5 border-t border-[rgba(11,52,43,0.08)]">
        {recipient?.profile_image ? (
          <img src={recipient.profile_image} alt={recipient.name} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B342B] to-[#12342D] flex items-center justify-center text-[#C9A44B] font-bold text-xs">
            {recipient ? getInitials(recipient.name) : '??'}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-[#1F2937]">{recipient?.name}</div>
          <div className="text-xs text-[#6B7280]">{recipient?.phone}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] text-[#6B7280]">Amount</div>
          <div className="text-sm font-bold text-[#1F2937]">{formatCurrency(parseFloat(amount) || 0)}</div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 mb-0.5">
        <div className="w-8 h-8 rounded-lg bg-[#0B342B]/5 flex items-center justify-center">
          <NoteIcon />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Add a Note (Optional)</h2>
          <p className="text-xs text-[#6B7280]">Your message will be visible to the recipient.</p>
        </div>
      </div>

      <div>
        <textarea
          ref={noteInputRef}
          name="note"
          className="w-full px-3 py-2.5 bg-[#FAFAF7] border border-[rgba(11,52,43,0.12)] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/30 focus:border-[#C9A44B] transition-all duration-200 resize-y min-h-[100px]"
          placeholder="Write a note to the recipient (e.g., For rent payment, Family support, or Business expense)."
          rows="4"
          value={note}
          onChange={handleNoteChange}
        />
        <div className="flex justify-between mt-1.5">
          <p className="text-[10px] text-[#6B7280]">Share a message with the recipient.</p>
          <p className="text-[10px] text-[#6B7280]">{note.length}/200</p>
        </div>
      </div>

      <div className="bg-[#FAFAF7] rounded-lg p-3 border border-[rgba(11,52,43,0.08)]">
        <div className="flex items-center gap-2.5">
          {recipient?.profile_image ? (
            <img src={recipient.profile_image} alt={recipient.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0B342B] to-[#12342D] flex items-center justify-center text-[#C9A44B] font-bold text-xs">
              {recipient ? getInitials(recipient.name) : '??'}
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#1F2937]">{recipient?.name}</div>
            <div className="text-xs text-[#6B7280]">{recipient?.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#6B7280]">Amount</div>
            <div className="text-sm font-bold text-[#1F2937]">{formatCurrency(parseFloat(amount) || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 mb-0.5">
        <div className="w-8 h-8 rounded-lg bg-[#0B342B]/5 flex items-center justify-center">
          <CheckCircleIcon />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#1F2937]">Review Transfer</h2>
          <p className="text-xs text-[#6B7280]">Verify all details before confirming.</p>
        </div>
      </div>

      <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[rgba(11,52,43,0.08)] space-y-3">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[rgba(11,52,43,0.06)]">
          {recipient?.profile_image ? (
            <img src={recipient.profile_image} alt={recipient.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0B342B] to-[#12342D] flex items-center justify-center text-[#C9A44B] font-bold text-sm">
              {recipient ? getInitials(recipient.name) : '??'}
            </div>
          )}
          <div>
            <div className="font-semibold text-[#1F2937] text-sm">{recipient?.name}</div>
            <div className="text-xs text-[#6B7280]">{recipient?.phone}</div>
          </div>
        </div>

        <div className="flex justify-between py-1.5 border-b border-[rgba(11,52,43,0.06)]">
          <span className="text-xs text-[#6B7280]">Amount</span>
          <span className="text-xs font-semibold text-[#1F2937]">{formatCurrency(parseFloat(amount) || 0)}</span>
        </div>

        <div className="flex justify-between py-1.5 border-b border-[rgba(11,52,43,0.06)]">
          <span className="text-xs text-[#6B7280]">Fee</span>
          <span className="text-xs font-semibold text-[#3FAF73]">0% Fee (Qard Hasan)</span>
        </div>

        <div className="flex justify-between py-1.5">
          <span className="text-xs font-semibold text-[#1F2937]">Total</span>
          <span className="text-base font-bold text-[#1F2937]">{formatCurrency(parseFloat(amount) || 0)}</span>
        </div>

        {note && (
          <div className="pt-2.5 border-t border-[rgba(11,52,43,0.06)]">
            <span className="text-xs text-[#6B7280]">Note</span>
            <p className="text-sm text-[#1F2937] mt-0.5">{note}</p>
          </div>
        )}
      </div>

      <div className="bg-[#0B342B]/5 rounded-lg p-3 border border-[rgba(11,52,43,0.1)]">
        <p className="text-xs text-[#0B342B] text-center font-medium">
          Qard Hasan — 0% interest, no riba. Your reward is with Allah.
        </p>
      </div>

      {errors.confirm && (
        <p className="text-xs text-[#DC2626] text-center">{errors.confirm}</p>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center py-4 space-y-5">
      <div className="w-16 h-16 rounded-full bg-[#3FAF73]/10 flex items-center justify-center mx-auto border-4 border-[#3FAF73]/20">
        <CheckIcon />
      </div>

      <div>
        <h2 className="text-lg font-bold text-[#1F2937]">Transfer Complete!</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Your transfer to <span className="font-medium text-[#1F2937]">{recipient?.name}</span> was successful.
        </p>
      </div>

      <div className="bg-[#FAFAF7] rounded-lg p-4 border border-[rgba(11,52,43,0.08)] max-w-sm mx-auto text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-[#6B7280]">Amount</span>
          <span className="text-sm font-bold text-[#1F2937]">{formatCurrency(parseFloat(amount) || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-[#6B7280]">Recipient</span>
          <span className="text-xs font-medium text-[#1F2937]">{recipient?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-[#6B7280]">Transaction ID</span>
          <span className="text-xs font-mono text-[#0B342B]">{transactionRef}</span>
        </div>
        {note && (
          <div className="flex justify-between">
            <span className="text-xs text-[#6B7280]">Note</span>
            <span className="text-xs text-[#1F2937]">{note}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-[rgba(11,52,43,0.06)]">
          <span className="text-xs text-[#6B7280]">Date</span>
          <span className="text-xs text-[#1F2937]">{new Date().toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-[#6B7280]">New Balance</span>
          <span className="text-xs font-bold text-[#3FAF73]">{formatCurrency(availableBalance)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <button
          className="px-6 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] hover:shadow-lg hover:shadow-[#0B342B]/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={resetTransfer}
        >
          Make Another Transfer
        </button>
        <button
          className="px-6 py-2 bg-white text-[#1F2937] font-semibold text-sm rounded-lg border border-[rgba(11,52,43,0.12)] hover:border-[#0B342B] hover:text-[#0B342B] transition-all duration-200"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-[#FAFAF7] p-3 sm:p-4 md:p-5 lg:p-6" ref={topRef}>
      <div className="max-w-2xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="mb-3 sm:mb-5">
          <div className="flex items-center gap-2.5">
            {currentStep > 1 && currentStep < 5 && (
              <button
                className="p-1.5 hover:bg-[#F3F4F6] rounded-lg transition-colors text-[#6B7280] hover:text-[#1F2937]"
                onClick={goToPreviousStep}
              >
                <BackIcon />
              </button>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#1F2937] hidden sm:block">Send Money</h1>
              <p className="text-xs text-[#6B7280] hidden sm:block">Transfer funds to another HalalHub user.</p>
              <h1 className="text-base font-bold text-[#1F2937] sm:hidden">P2P Transfer</h1>
            </div>
          </div>
        </div>

        {/* ===== PROGRESS ===== */}
        {currentStep < 5 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold text-[#0B342B]">
                Step {currentStep} of 4
              </span>
              <span className="text-[10px] text-[#6B7280]">·</span>
              <span className="text-[10px] text-[#6B7280]">{getStepLabel()}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    step < currentStep                      ? 'bg-[#0B342B]'
                      : step === currentStep
                      ? 'bg-[#C9A44B]'
                      : 'bg-[rgba(11,52,43,0.12)]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== RECIPIENT INDICATOR ===== */}
        {currentStep > 1 && currentStep < 5 && recipient && (
          <div className="mb-3 sm:mb-4 p-2.5 bg-white rounded-lg border border-[rgba(11,52,43,0.08)] shadow-sm">
            <div className="flex items-center gap-2.5">
              {recipient?.profile_image ? (
                <img src={recipient.profile_image} alt={recipient.name} className="w-7 h-7 rounded-lg object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0B342B] to-[#12342D] flex items-center justify-center text-[#C9A44B] font-bold text-[10px]">
                  {getInitials(recipient?.name)}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-[#1F2937]">{recipient?.name}</div>
                <div className="text-[10px] text-[#6B7280]">{recipient?.phone}</div>
              </div>
              <button
                className="ml-auto text-[10px] text-[#6B7280] hover:text-[#0B342B] transition-colors font-medium"
                onClick={() => {
                  setCurrentStep(1);
                  setErrors({});
                }}
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* ===== CARD ===== */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[rgba(11,52,43,0.08)] shadow-sm p-4 sm:p-5 md:p-6 overflow-hidden">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* ===== ACTIONS ===== */}
          {currentStep > 0 && currentStep < 4 && (
            <div className="flex gap-2.5 mt-6 pt-5 border-t border-[rgba(11,52,43,0.06)]">
              {currentStep > 1 && (
                <button
                  className="flex-1 px-5 py-2 bg-[#F3F4F6] text-[#6B7280] font-semibold text-sm rounded-lg hover:bg-[#E5E7EB] transition-all duration-200"
                  onClick={goToPreviousStep}
                >
                  Back
                </button>
              )}
              <button
                className={`${
                  currentStep > 1 ? 'flex-[2]' : 'flex-1'
                } px-5 py-2 bg-[#0B342B] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:bg-[#12342D] transition-all duration-200 shadow-md shadow-[#0B342B]/20 hover:shadow-lg hover:shadow-[#0B342B]/30 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
                onClick={goToNextStep}
                disabled={
                  (currentStep === 1 && !recipient) ||
                  (currentStep === 2 && (!amount || parseFloat(amount) <= 0))
                }
              >
                {currentStep === 3 ? 'Review Transfer' : 'Continue'}
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex gap-2.5 mt-6 pt-5 border-t border-[rgba(11,52,43,0.06)]">
              <button
                className="flex-1 px-5 py-2 bg-[#F3F4F6] text-[#6B7280] font-semibold text-sm rounded-lg hover:bg-[#E5E7EB] transition-all duration-200"
                onClick={goToPreviousStep}
              >
                Back
              </button>
              <button
                className="flex-[2] px-5 py-2 bg-gradient-to-r from-[#0B342B] to-[#12342D] text-[#F7F6F1] font-semibold text-sm rounded-lg hover:shadow-lg hover:shadow-[#0B342B]/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Processing...
                  </span>
                ) : (
                  'Confirm Transfer'
                )}
              </button>
            </div>
          )}
        </div>

        {/* ===== ISLAMIC FOOTER ===== */}
        <div className="mt-5 text-center">
          <p className="text-[9px] sm:text-[10px] text-[#6B7280] tracking-wider">
            Qard Hasan · 0% Interest · No Riba
          </p>
        </div>
      </div>
    </div>
  );
};

export default P2P;