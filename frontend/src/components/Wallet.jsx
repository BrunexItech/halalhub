import React, { useState, useEffect } from 'react';
import { walletService, mpesaService } from '../services/api';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('+254');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutId, setCheckoutId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    if (!checkoutId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await mpesaService.checkStatus(checkoutId);
        if (res.data.status === 'success') {
          setMessage('✅ Payment successful! Wallet updated.');
          setIsPolling(false);
          setCheckoutId(null);
          await fetchBalance();
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setMessage('❌ Payment failed. Please try again.');
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
      console.error('Failed to fetch balance');
    }
  };

  const handleTopup = async () => {
    // Clean phone number: remove + and spaces
    let cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    
    if (!cleanPhone || cleanPhone.length < 10) {
      setMessage('❌ Please enter a valid phone number');
      return;
    }
    if (!amount || amount < 10) {
      setMessage('❌ Enter amount (min KES 10)');
      return;
    }
    setLoading(true);
    setMessage('⏳ Sending payment request...');

    try {
      const res = await mpesaService.stkPush({
        phone: cleanPhone,
        amount: parseInt(amount)
      });

      if (res.data.success) {
        setMessage('📱 Check your phone and enter PIN to complete payment.');
        setCheckoutId(res.data.checkoutId);
        setIsPolling(true);
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || 'Payment failed'}`);
    }
    setLoading(false);
  };

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <div className="page-title">💳 Wallet</div>
          <div className="page-subtitle">Manage your HalalHub wallet</div>
        </div>
      </div>

      <div className="wallet-card" style={{
        background: 'linear-gradient(135deg, #0B3D2E, #145A40)',
        borderRadius: '22px',
        padding: '28px',
        color: 'white',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>Total Balance</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, wordBreak: 'break-word' }}>
          KES {balance.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Sharia-Compliant · No Riba</div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">⬆️ Add Money via M-Pesa</span>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2547XXXXXXXX"
            />
            <div style={{ fontSize: '0.72rem', color: '#6B5C3E', marginTop: '4px' }}>
              Enter your M-Pesa number (e.g., +2547XXXXXXXX)
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Amount (KES)</label>
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="10"
            />
          </div>

          <button
            className="btn btn-gold btn-full"
            onClick={handleTopup}
            disabled={loading || isPolling}
          >
            {loading ? 'Processing...' : isPolling ? '⏳ Waiting for payment...' : '📱 Pay via M-Pesa'}
          </button>

          {message && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: message.includes('✅') ? 'rgba(39,174,96,0.1)' : 
                         message.includes('❌') ? 'rgba(192,57,43,0.1)' : 
                         'rgba(41,128,185,0.1)',
              color: message.includes('✅') ? '#27AE60' : 
                     message.includes('❌') ? '#C0392B' : 
                     '#2980B9',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;