import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService, mpesaService, transactionService } from '../services/api';

const Wallet = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('+254');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [checkoutId, setCheckoutId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!checkoutId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await mpesaService.checkStatus(checkoutId);
        if (res.data.status === 'success') {
          setMessage('Payment successful. Wallet updated.');
          setMessageType('success');
          setIsPolling(false);
          setCheckoutId(null);
          await fetchBalance();
          await fetchTransactions();
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setMessage('Payment failed. Please try again.');
          setMessageType('error');
          setIsPolling(false);
          setCheckoutId(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutId, isPolling]);

  const fetchBalance = async () => {
    try {
      const res = await walletService.getBalance();
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await transactionService.getRecent(50);
      const txData = res.data.transactions || [];
      
      // Format transactions for display
      const formattedTx = txData.map(tx => {
        let title = tx.type || 'Transaction';
        let iconType = tx.type || 'default';
        
        switch(tx.type) {
          case 'topup':
            title = 'M-Pesa Top Up';
            iconType = 'topup';
            break;
          case 'utility':
            title = tx.description || 'Utility Payment';
            iconType = 'utility';
            break;
          case 'zakat':
            title = 'Zakat Payment';
            iconType = 'zakat';
            break;
          case 'sadaqa':
            title = 'Sadaqa Donation';
            iconType = 'sadaqa';
            break;
          case 'p2p':
            title = 'P2P Transfer';
            iconType = 'transfer';
            break;
          case 'repayment':
            title = 'Loan Repayment';
            iconType = 'repayment';
            break;
          case 'withdrawal':
            title = 'Withdrawal';
            iconType = 'withdrawal';
            break;
          default:
            title = tx.description || tx.type || 'Transaction';
            iconType = 'default';
        }
        
        const date = tx.createdat || tx.createdAt || tx.paid_at;
        const formattedDate = date ? new Date(date).toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'N/A';
        
        const time = date ? new Date(date).toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit'
        }) : '';
        
        return {
          id: tx.id,
          title: title,
          amount: tx.amount || 0,
          type: iconType,
          status: tx.status || 'completed',
          date: `${formattedDate}, ${time}`,
          reference: tx.reference || tx.transaction_ref
        };
      });
      
      setTransactions(formattedTx);
      setTotalTransactions(formattedTx.length);
      
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleTopup = async () => {
    let cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }
    
    if (!amount || parseFloat(amount) < 10) {
      setMessage('Enter amount (minimum 10 KES)');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Sending payment request to M-Pesa...');
    setMessageType('info');

    try {
      const res = await mpesaService.stkPush({
        phone: cleanPhone,
        amount: parseInt(amount)
      });

      if (res.data.success) {
        setMessage('Check your phone and enter M-Pesa PIN to complete payment.');
        setMessageType('info');
        setCheckoutId(res.data.checkoutId);
        setIsPolling(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Payment failed. Please try again.');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    const icons = {
      'topup': 'T',
      'zakat': 'Z',
      'sadaqa': 'S',
      'repayment': 'R',
      'utility': 'U',
      'payment': 'P',
      'transfer': 'X',
      'withdrawal': 'W',
      'default': '•'
    };
    return icons[type] || icons.default;
  };

  const getTransactionColor = (type) => {
    const colors = {
      'topup': 'bg-[#D1FAE5] text-[#3FAF73]',
      'zakat': 'bg-[#FEF3C7] text-[#D97706]',
      'sadaqa': 'bg-[#F3E8FF] text-[#9333EA]',
      'repayment': 'bg-[#DBEAFE] text-[#3B82F6]',
      'utility': 'bg-[#FFEDD5] text-[#EA580C]',
      'payment': 'bg-[#E0E7FF] text-[#4F46E5]',
      'transfer': 'bg-[#CFFAFE] text-[#0891B2]',
      'withdrawal': 'bg-[#FEE2E2] text-[#DC2626]',
      'default': 'bg-[#F4F5F1] text-[#6B7280]'
    };
    return colors[type] || colors.default;
  };

  const getMessageStyles = () => {
    switch(messageType) {
      case 'success': return 'bg-[#D1FAE5] text-[#3FAF73] border-[#A7F3D0]';
      case 'error': return 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]';
      default: return 'bg-[#DBEAFE] text-[#3B82F6] border-[#BFDBFE]';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-semibold text-[#1F2937]">Wallet</h1>
            <p className="text-[15px] text-[#6B7280] mt-0.5">Manage your HalalHub wallet securely</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#0B342B] bg-[#FAFAF7] px-3 py-1 rounded-full border border-[#E8EEF4]">
              Sharia Compliant
            </span>
            <button 
              className="p-2 bg-white border border-[#E8EEF4] rounded-xl hover:bg-[#FAFAF7] transition-colors"
              onClick={() => { fetchBalance(); fetchTransactions(); }}
            >
              <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden bg-[#0B342B] rounded-2xl p-6 md:p-8 mb-6 shadow-lg shadow-[#0B342B]/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A44B]/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C9A44B]/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[13px] text-[#C9A44B]/60 uppercase tracking-wider font-medium">Total Balance</div>
              <div className="text-[36px] md:text-[40px] font-bold text-white mt-1">
                {formatCurrency(balance)}
              </div>
              <div className="text-[13px] text-[#C9A44B]/40 mt-1">Sharia-Compliant · No Riba</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-[12px] text-[#C9A44B]/50 uppercase tracking-wider font-medium">Status</div>
              <div className="text-[15px] font-semibold text-[#D1FAE5]">Active</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className="px-4 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-colors shadow-md shadow-[#0B342B]/20 text-[15px]"
            onClick={() => document.querySelector('.topup-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Add Money
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1F2937] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-colors text-[15px]"
            onClick={() => navigate('/zakat')}
          >
            Pay Zakat
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1F2937] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-colors text-[15px]"
            onClick={() => navigate('/sadaqa')}
          >
            Give Sadaqa
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1F2937] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-colors text-[15px]"
            onClick={() => navigate('/p2p')}
          >
            P2P Loan
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1F2937] font-medium rounded-xl border border-[#E8EEF4] hover:border-[#0B342B] hover:text-[#0B342B] transition-colors text-[15px]"
            onClick={() => navigate('/utilities')}
          >
            Pay Utilities
          </button>
        </div>

        {/* Top Up Section */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6 mb-6 topup-section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1F2937]">Add Money via M-Pesa</h3>
              <span className="text-[13px] font-medium text-[#3FAF73] bg-[#D1FAE5] px-2 py-0.5 rounded-full">Instant</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2547XXXXXXXX"
                disabled={loading || isPolling}
              />
              <span className="text-[12px] text-[#6B7280] mt-1 block">Registered M-Pesa number</span>
            </div>

            <div>
              <label className="text-[13px] font-medium text-[#6B7280] block mb-1.5">
                Amount (KES)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-[#E8EEF4] rounded-xl bg-white text-[#1F2937] text-[15px] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B342B]/20 focus:border-[#0B342B] transition-all duration-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="10"
                disabled={loading || isPolling}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((val) => (
              <button
                key={val}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  parseFloat(amount) === val 
                    ? 'bg-[#0B342B] text-white shadow-sm' 
                    : 'bg-[#FAFAF7] text-[#6B7280] hover:bg-[#F4F5F1]'
                }`}
                onClick={() => handleQuickAmount(val)}
                disabled={loading || isPolling}
              >
                KES {val.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              className="w-full md:w-auto px-8 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20 text-[15px]"
              onClick={handleTopup}
              disabled={loading || isPolling}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : isPolling ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Waiting for M-Pesa...
                </span>
              ) : (
                'Pay via M-Pesa'
              )}
            </button>

            {isPolling && (
              <button
                className="ml-3 text-[15px] text-[#DC2626] hover:text-[#B91C1C] transition-colors font-medium"
                onClick={() => {
                  setIsPolling(false);
                  setCheckoutId(null);
                  setMessage('Payment cancelled');
                  setMessageType('info');
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {message && (
            <div className={`mt-3 p-3 rounded-xl text-[15px] border ${getMessageStyles()}`}>
              {message}
            </div>
          )}

          <div className="mt-3 text-[12px] text-[#6B7280] text-center">
            Secured by M-Pesa · End-to-end encrypted
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1F2937]">Transaction History</h3>
              <p className="text-[14px] text-[#6B7280]">{totalTransactions} transactions</p>
            </div>
            <button 
              className="p-1.5 text-[#6B7280] hover:text-[#0B342B] transition-colors"
              onClick={fetchTransactions}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loadingTx ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#0B342B]/10 border-t-[#0B342B] rounded-full animate-spin mx-auto" />
              <p className="text-[15px] text-[#6B7280] mt-3">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-[#E8EEF4] mb-3">—</div>
              <h4 className="text-[17px] font-semibold text-[#1F2937]">No transactions yet</h4>
              <p className="text-[15px] text-[#6B7280] mt-1">Your wallet activity will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx, i) => (
                  <div key={tx.id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAFAF7] transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTransactionColor(tx.type)}`}>
                      <span className="text-[15px] font-bold">
                        {getTransactionIcon(tx.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-semibold text-[15px] text-[#1F2937] truncate">
                          {tx.title}
                        </span>
                        <span className={`font-bold text-[15px] whitespace-nowrap ${
                          tx.amount > 0 ? 'text-[#3FAF73]' : 'text-[#DC2626]'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[13px] text-[#6B7280]">
                        <span>{tx.date}</span>
                        {tx.reference && (
                          <span className="text-[12px] font-mono">Ref: {tx.reference}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[12px] font-medium ${
                          tx.status === 'completed' ? 'bg-[#D1FAE5] text-[#3FAF73]' :
                          tx.status === 'pending' ? 'bg-[#FEF3C7] text-[#D97706]' :
                          tx.status === 'processing' ? 'bg-[#DBEAFE] text-[#3B82F6]' :
                          'bg-[#FEE2E2] text-[#DC2626]'
                        }`}>
                          {tx.status === 'completed' ? 'Complete' :
                           tx.status === 'pending' ? 'Pending' :
                           tx.status === 'processing' ? 'Processing' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalTransactions > 10 && (
                <div className="text-center mt-4 pt-4 border-t border-[#F4F5F1]">
                  <button 
                    className="text-[15px] font-medium text-[#0B342B] hover:text-[#032A24] transition-colors"
                    onClick={() => navigate('/wallet/history')}
                  >
                    View All Transactions ({totalTransactions}) →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;