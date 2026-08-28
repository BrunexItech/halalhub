import React, { useState, useEffect, useRef } from 'react';

const PinModal = ({
  isOpen,
  onClose,
  onVerify,
  loading = false,
  error = '',
  title = 'Enter Your PIN',
  subtitle = 'Enter your 4-digit transaction PIN to continue',
  amount,
  recipient,
  transactionType,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) {
      setPin(['', '', '', '']);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const pinString = pin.join('');
      if (pinString.length === 4) {
        onVerify(pinString);
      }
    }
  };

  const handleSubmit = () => {
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onVerify(pinString);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B342B] rounded-3xl p-6 w-full max-w-[360px] border border-[#C9A44B]/30 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/itqaan_logo.png" 
            alt="Itqaan" 
            className="h-12 w-auto"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#032A24] border border-[#C9A44B]/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-[#F7F6F1] text-xl font-bold">{title}</h3>
          <p className="text-[#B7C0BA] text-sm mt-1">{subtitle}</p>
        </div>

        {/* Transaction Details */}
        {(amount || recipient || transactionType) && (
          <div className="bg-[#032A24] rounded-xl p-3 mb-4 border border-[#C9A44B]/15">
            {transactionType && (
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280] text-xs">Type:</span>
                <span className="text-[#F7F6F1] text-xs font-medium capitalize">
                  {transactionType}
                </span>
              </div>
            )}
            {amount && amount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280] text-xs">Amount:</span>
                <span className="text-[#E1C16B] text-xs font-bold">
                  KES {amount.toLocaleString()}
                </span>
              </div>
            )}
            {recipient && (
              <div className="flex justify-between py-1">
                <span className="text-[#6B7280] text-xs">To:</span>
                <span className="text-[#F7F6F1] text-xs font-medium">
                  {recipient}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-4">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 bg-[#032A24] border rounded-xl text-center text-[#F7F6F1] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#C9A44B]/50 transition-all duration-200"
              style={{
                borderColor: digit ? '#C9A44B' : 'rgba(201, 164, 75, 0.3)',
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[#032A24] border border-[#DC2626]/30 rounded-xl p-2.5 mb-3">
            <p className="text-[#DC2626] text-xs text-center">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            className="flex-1 bg-[#032A24] border border-[#C9A44B]/20 py-3 rounded-xl text-[#B7C0BA] text-sm font-semibold hover:bg-[#032A24]/80 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex-[2] bg-[#C9A44B] py-3 rounded-xl text-[#032A24] text-sm font-bold hover:bg-[#C9A44B]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={loading || pin.join('').length < 4}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#032A24]/30 border-t-[#032A24] rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify PIN'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinModal;