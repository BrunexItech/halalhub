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
      'topup': 'bg-emerald-50 text-emerald-600',
      'zakat': 'bg-amber-50 text-amber-600',
      'sadaqa': 'bg-purple-50 text-purple-600',
      'repayment': 'bg-blue-50 text-blue-600',
      'utility': 'bg-orange-50 text-orange-600',
      'payment': 'bg-indigo-50 text-indigo-600',
      'transfer': 'bg-cyan-50 text-cyan-600',
      'withdrawal': 'bg-red-50 text-red-600',
      'default': 'bg-gray-50 text-gray-600'
    };
    return colors[type] || colors.default;
  };

  const getMessageStyles = () => {
    switch(messageType) {
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A2A3A]">Wallet</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Manage your HalalHub wallet securely</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1769AA] bg-[#F1F7FC] px-3 py-1 rounded-full border border-[#E8EEF4]">
              Sharia Compliant
            </span>
            <button 
              className="p-2 bg-white border border-[#E8EEF4] rounded-xl hover:bg-[#F1F7FC] transition-colors"
              onClick={() => { fetchBalance(); fetchTransactions(); }}
            >
              <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1769AA] via-[#2F80C0] to-[#4A9AD9] rounded-2xl p-6 md:p-8 mb-6 shadow-lg shadow-[#1769AA]/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider">Total Balance</div>
              <div className="text-3xl md:text-4xl font-bold text-white mt-1">
                {formatCurrency(balance)}
              </div>
              <div className="text-xs text-white/40 mt-1">Sharia-Compliant · No Riba</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Status</div>
              <div className="text-sm font-semibold text-emerald-300">Active</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className="px-4 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-colors shadow-md shadow-[#1769AA]/20"
            onClick={() => document.querySelector('.topup-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Add Money
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1A2A3A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-colors"
            onClick={() => navigate('/zakat')}
          >
            Pay Zakat
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1A2A3A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-colors"
            onClick={() => navigate('/sadaqa')}
          >
            Give Sadaqa
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1A2A3A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-colors"
            onClick={() => navigate('/p2p')}
          >
            P2P Loan
          </button>
          <button 
            className="px-4 py-2.5 bg-white text-[#1A2A3A] font-semibold rounded-xl border border-[#E8EEF4] hover:border-[#1769AA] hover:text-[#1769AA] transition-colors"
            onClick={() => navigate('/utilities')}
          >
            Pay Utilities
          </button>
        </div>

        {/* Top Up Section */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6 mb-6 topup-section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1A2A3A]">Add Money via M-Pesa</h3>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Instant</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2547XXXXXXXX"
                disabled={loading || isPolling}
              />
              <span className="text-[10px] text-[#94A3B8] mt-1 block">Registered M-Pesa number</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wider block mb-1.5">
                Amount (KES)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#1A2A3A] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30 focus:border-[#1769AA] transition-all duration-200"
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  parseFloat(amount) === val 
                    ? 'bg-[#1769AA] text-white' 
                    : 'bg-[#F1F7FC] text-[#5A6A7A] hover:bg-[#E8EEF4]'
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
              className="w-full md:w-auto px-8 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="ml-3 text-sm text-[#DC2626] hover:text-[#B91C1C] transition-colors"
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
            <div className={`mt-3 p-3 rounded-xl text-sm border ${getMessageStyles()}`}>
              {message}
            </div>
          )}

          <div className="mt-3 text-[10px] text-[#94A3B8] text-center">
            Secured by M-Pesa · End-to-end encrypted
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1A2A3A]">Transaction History</h3>
              <p className="text-xs text-[#94A3B8]">{totalTransactions} transactions</p>
            </div>
            <button 
              className="p-1.5 text-[#94A3B8] hover:text-[#1769AA] transition-colors"
              onClick={fetchTransactions}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loadingTx ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#94A3B8] mt-3">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-[#E8EEF4] mb-3">—</div>
              <h4 className="text-base font-semibold text-[#1A2A3A]">No transactions yet</h4>
              <p className="text-sm text-[#94A3B8] mt-1">Your wallet activity will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx, i) => (
                  <div key={tx.id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTransactionColor(tx.type)}`}>
                      <span className="text-sm font-bold">
                        {getTransactionIcon(tx.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-semibold text-[#1A2A3A] text-sm truncate">
                          {tx.title}
                        </span>
                        <span className={`font-bold text-sm whitespace-nowrap ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-[#DC2626]'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                        <span>{tx.date}</span>
                        {tx.reference && (
                          <span className="text-[10px] font-mono">Ref: {tx.reference}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          tx.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          tx.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                          'bg-red-50 text-red-600'
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
                <div className="text-center mt-4 pt-4 border-t border-[#F1F7FC]">
                  <button 
                    className="text-sm font-semibold text-[#1769AA] hover:text-[#2F80C0] transition-colors"
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