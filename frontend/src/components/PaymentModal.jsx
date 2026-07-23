import React, { useState, useEffect } from 'react';
import { paymentService, walletService } from '../services/api';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  onSuccess, 
  onError,
  description = 'Payment',
  recipient = 'HalalHub'
}) => {
  // ===== STATE =====
  const [step, setStep] = useState('initial'); // initial, processing, polling, success, error
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [checkoutId, setCheckoutId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ===== AUTO-FOCUS =====
  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setPhone('');
      setMessage('');
      setError('');
      setCheckoutId(null);
      setIsPolling(false);
      setLoading(false);
    }
  }, [isOpen]);

  // ===== POLLING FOR PAYMENT STATUS =====
  useEffect(() => {
    if (!checkoutId || !isPolling) return;

    const interval = setInterval(async () => {
      try {
        const res = await paymentService.checkStatus(checkoutId);
        if (res.data.status === 'success') {
          setMessage('✅ Payment successful!');
          setStep('success');
          setIsPolling(false);
          setCheckoutId(null);
          if (onSuccess) onSuccess(res.data);
          clearInterval(interval);
        } else if (res.data.status === 'failed') {
          setMessage('❌ Payment failed. Please try again.');
          setStep('error');
          setIsPolling(false);
          setCheckoutId(null);
          if (onError) onError('Payment failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutId, isPolling, onSuccess, onError]);

  // ===== HANDLERS =====
  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate phone
    let cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }
    
    try {
      const res = await paymentService.stkPush({
        phone: cleanPhone,
        amount: amount,
        description: description,
        recipient: recipient
      });
      
      if (res.data.success) {
        setStep('polling');
        setMessage('📱 Check your phone and enter M-Pesa PIN to complete payment.');
        setCheckoutId(res.data.checkoutId);
        setIsPolling(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setStep('error');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isPolling) {
      setIsPolling(false);
      setCheckoutId(null);
      setMessage('⏹️ Payment cancelled');
      setStep('initial');
    }
    onClose();
  };

  const handleRetry = () => {
    setStep('initial');
    setError('');
    setMessage('');
    setLoading(false);
  };

  const handleDone = () => {
    onClose();
  };

  // ===== FORMAT CURRENCY =====
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ===== RENDER =====
  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={handleCancel}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className="payment-modal-header">
          <h3>💳 Payment</h3>
          <button className="payment-modal-close" onClick={handleCancel}>✕</button>
        </div>

        {/* ===== BODY ===== */}
        <div className="payment-modal-body">
          {/* ===== AMOUNT DISPLAY ===== */}
          <div className="payment-amount">
            <span className="payment-amount-label">Amount to Pay</span>
            <span className="payment-amount-value">{formatCurrency(amount)}</span>
          </div>

          {/* ===== STEP: INITIAL ===== */}
          {step === 'initial' && (
            <form onSubmit={handlePayment} className="payment-form">
              <div className="payment-field">
                <label className="payment-label">📱 M-Pesa Phone Number</label>
                <input
                  type="tel"
                  className="payment-input"
                  placeholder="+2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                />
                <span className="payment-hint">Enter the phone number registered with M-Pesa</span>
              </div>
              
              <div className="payment-details">
                <div className="payment-detail-row">
                  <span>Recipient</span>
                  <span>{recipient}</span>
                </div>
                <div className="payment-detail-row">
                  <span>Description</span>
                  <span>{description}</span>
                </div>
              </div>

              {error && (
                <div className="payment-error">{error}</div>
              )}

              <button 
                type="submit" 
                className="payment-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="payment-loading">
                    <span className="payment-spinner" />
                    Sending Request...
                  </span>
                ) : (
                  '💰 Pay via M-Pesa'
                )}
              </button>
            </form>
          )}

          {/* ===== STEP: POLLING ===== */}
          {step === 'polling' && (
            <div className="payment-polling">
              <div className="payment-polling-icon">⏳</div>
              <div className="payment-polling-title">Waiting for Payment</div>
              <div className="payment-polling-message">{message}</div>
              <div className="payment-polling-spinner" />
              <button 
                className="payment-polling-cancel"
                onClick={() => {
                  setIsPolling(false);
                  setCheckoutId(null);
                  setMessage('⏹️ Payment cancelled');
                  setStep('initial');
                }}
              >
                Cancel Payment
              </button>
            </div>
          )}

          {/* ===== STEP: SUCCESS ===== */}
          {step === 'success' && (
            <div className="payment-success">
              <div className="payment-success-icon">✅</div>
              <div className="payment-success-title">Payment Successful!</div>
              <div className="payment-success-message">{message}</div>
              <div className="payment-success-details">
                <div className="payment-success-row">
                  <span>Amount</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="payment-success-row">
                  <span>Recipient</span>
                  <span>{recipient}</span>
                </div>
                <div className="payment-success-row">
                  <span>Ref</span>
                  <span className="payment-success-ref">PAY-{Date.now().toString().slice(-8)}</span>
                </div>
              </div>
              <button className="payment-success-btn" onClick={handleDone}>
                Done
              </button>
            </div>
          )}

          {/* ===== STEP: ERROR ===== */}
          {step === 'error' && (
            <div className="payment-error-state">
              <div className="payment-error-icon">❌</div>
              <div className="payment-error-title">Payment Failed</div>
              <div className="payment-error-message">{error || message || 'Something went wrong. Please try again.'}</div>
              <div className="payment-error-actions">
                <button className="payment-error-retry" onClick={handleRetry}>
                  🔄 Try Again
                </button>
                <button className="payment-error-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================== */}
        {/* ===== STYLES ===== */}
        {/* ======================================== */}
        <style>{`
          .payment-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            backdrop-filter: blur(8px);
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .payment-modal {
            background: white;
            border-radius: 16px;
            max-width: 420px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .payment-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            background: linear-gradient(135deg, #0B3D2E, #145A40);
            border-radius: 16px 16px 0 0;
          }

          .payment-modal-header h3 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.2rem;
            color: white;
            margin: 0;
          }

          .payment-modal-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.6);
            padding: 4px 8px;
            transition: color 0.2s ease;
          }

          .payment-modal-close:hover {
            color: white;
          }

          .payment-modal-body {
            padding: 20px;
          }

          /* ===== AMOUNT ===== */
          .payment-amount {
            text-align: center;
            padding: 16px;
            background: #F5E8C0;
            border-radius: 10px;
            margin-bottom: 20px;
          }

          .payment-amount-label {
            font-size: 0.75rem;
            color: #6B5C3E;
            display: block;
          }

          .payment-amount-value {
            font-family: 'Cormorant Garamond', serif;
            font-size: 2rem;
            font-weight: 700;
            color: #0B3D2E;
          }

          /* ===== FORM ===== */
          .payment-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .payment-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .payment-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: #6B5C3E;
            letter-spacing: 0.04em;
          }

          .payment-input {
            padding: 12px 14px;
            border: 1.5px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            color: #1C1208;
            background: white;
            outline: none;
            transition: all 0.28s ease;
            width: 100%;
          }

          .payment-input:focus {
            border-color: #0B3D2E;
            box-shadow: 0 0 0 3px rgba(11, 61, 46, 0.08);
          }

          .payment-hint {
            font-size: 0.65rem;
            color: #6B5C3E;
          }

          .payment-details {
            background: rgba(0, 0, 0, 0.02);
            border-radius: 8px;
            padding: 10px 14px;
          }

          .payment-detail-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 0.8rem;
            color: #1C1208;
          }

          .payment-error {
            color: #C0392B;
            font-size: 0.8rem;
            padding: 8px 12px;
            background: rgba(192, 57, 43, 0.06);
            border-radius: 6px;
          }

          .payment-submit-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #C9A84C, #E8C96A);
            border: none;
            border-radius: 8px;
            color: #0B3D2E;
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .payment-submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(201, 168, 76, 0.3);
          }

          .payment-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .payment-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }

          .payment-spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(11, 61, 46, 0.2);
            border-top-color: #0B3D2E;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* ===== POLLING ===== */
          .payment-polling {
            text-align: center;
            padding: 20px 0;
          }

          .payment-polling-icon {
            font-size: 3rem;
            margin-bottom: 8px;
          }

          .payment-polling-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #0B3D2E;
          }

          .payment-polling-message {
            font-size: 0.85rem;
            color: #6B5C3E;
            margin: 4px 0 16px;
          }

          .payment-polling-spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 0, 0, 0.06);
            border-top-color: #C9A84C;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 8px 0;
          }

          .payment-polling-cancel {
            background: none;
            border: none;
            color: #C0392B;
            font-size: 0.8rem;
            text-decoration: underline;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            margin-top: 8px;
          }

          /* ===== SUCCESS ===== */
          .payment-success {
            text-align: center;
            padding: 10px 0;
          }

          .payment-success-icon {
            font-size: 3.5rem;
            margin-bottom: 4px;
          }

          .payment-success-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #27AE60;
          }

          .payment-success-message {
            font-size: 0.85rem;
            color: #6B5C3E;
            margin-bottom: 12px;
          }

          .payment-success-details {
            text-align: left;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
          }

          .payment-success-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 0.8rem;
            color: #1C1208;
          }

          .payment-success-ref {
            font-family: monospace;
            font-size: 0.7rem;
            color: #6B5C3E;
          }

          .payment-success-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #27AE60, #2ECC71);
            border: none;
            border-radius: 8px;
            color: white;
            font-family: 'Outfit', sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .payment-success-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(39, 174, 96, 0.3);
          }

          /* ===== ERROR STATE ===== */
          .payment-error-state {
            text-align: center;
            padding: 10px 0;
          }

          .payment-error-icon {
            font-size: 3rem;
            margin-bottom: 4px;
          }

          .payment-error-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #C0392B;
          }

          .payment-error-message {
            font-size: 0.85rem;
            color: #6B5C3E;
            margin: 4px 0 16px;
          }

          .payment-error-actions {
            display: flex;
            gap: 10px;
          }

          .payment-error-retry {
            flex: 1;
            padding: 10px;
            background: linear-gradient(135deg, #C9A84C, #E8C96A);
            border: none;
            border-radius: 8px;
            color: #0B3D2E;
            font-family: 'Outfit', sans-serif;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .payment-error-retry:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
          }

          .payment-error-cancel {
            flex: 1;
            padding: 10px;
            background: transparent;
            border: 1.5px solid #C0392B;
            border-radius: 8px;
            color: #C0392B;
            font-family: 'Outfit', sans-serif;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .payment-error-cancel:hover {
            background: #C0392B;
            color: white;
          }

          /* ======================================== */
          /* ===== RESPONSIVE ===== */
          /* ======================================== */

          @media (max-width: 480px) {
            .payment-modal {
              max-width: 100%;
              margin: 10px;
            }

            .payment-amount-value {
              font-size: 1.5rem;
            }

            .payment-error-actions {
              flex-direction: column;
            }

            .payment-error-retry,
            .payment-error-cancel {
              width: 100%;
            }

            .payment-success-details {
              padding: 8px;
            }

            .payment-success-row {
              font-size: 0.75rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentModal;