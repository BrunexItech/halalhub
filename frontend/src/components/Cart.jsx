import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // ===== FETCH CART =====
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      // Mock data - replace with real API
      const mockCart = [
        { 
          id: 1, 
          name: 'Premium Medjool Dates — 1kg', 
          price: 1800, 
          quantity: 2,
          seller: 'Al-Madinah Dates',
          inStock: true
        },
        { 
          id: 2, 
          name: 'Halal Honey — Kenyan Pure', 
          price: 950, 
          quantity: 1,
          seller: 'Baraka Bee Farm',
          inStock: true
        },
        { 
          id: 3, 
          name: 'Premium Abaya — Modest Fashion', 
          price: 4500, 
          quantity: 1,
          seller: 'Haya Designs',
          inStock: true
        }
      ];
      
      setCart(mockCart);
    } catch (err) {
      setError('Failed to load cart. Please refresh.');
      console.error('Cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== CART OPERATIONS =====
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setProcessing(true);
    try {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (err) {
      setError('Failed to update quantity.');
    } finally {
      setProcessing(false);
    }
  };

  const removeFromCart = async (productId) => {
    setProcessing(true);
    try {
      setCart(cart.filter(item => item.id !== productId));
      setSuccess('Item removed from cart.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove item.');
    } finally {
      setProcessing(false);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
    
    setProcessing(true);
    try {
      setCart([]);
      setSuccess('Cart cleared.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to clear cart.');
    } finally {
      setProcessing(false);
    }
  };

  // ===== CHECKOUT =====
  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setShowCheckoutModal(true);
  };

  const confirmOrder = async () => {
    setProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newOrderNumber = 'ORD' + Date.now().toString().slice(-8);
      setOrderNumber(newOrderNumber);
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      setCart([]);
      
      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const continueShopping = () => {
    navigate('/ecommerce');
  };

  // ===== HELPERS =====
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return getSubtotal() > 5000 ? 0 : 500;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1769AA]/10 border-t-[#1769AA] rounded-full animate-spin mx-auto" />
          <p className="text-[#94A3B8] mt-4">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F7FC] p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A2A3A]">Shopping Cart</h1>
            {cart.length > 0 && (
              <p className="text-sm text-[#94A3B8] mt-0.5">{getItemCount()} items · {formatCurrency(getSubtotal())}</p>
            )}
          </div>
          <div className="flex gap-2">
            {cart.length > 0 && (
              <button 
                className="px-4 py-2 text-sm font-medium text-[#5A6A7A] hover:text-[#DC2626] transition-colors"
                onClick={clearCart}
              >
                Clear Cart
              </button>
            )}
            <button 
              className="px-4 py-2 text-sm font-medium text-[#1769AA] hover:text-[#2F80C0] transition-colors"
              onClick={continueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </div>

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

        {/* ===== SUCCESS ===== */}
        {success && (
          <div className="mb-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm text-emerald-600">
            {success}
            <button 
              className="ml-2 text-emerald-400 hover:text-emerald-600 transition-colors"
              onClick={() => setSuccess('')}
            >
              ✕
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          // ===== EMPTY CART =====
          <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-12 text-center">
            <div className="text-5xl text-[#E8EEF4] mb-4">—</div>
            <h2 className="text-xl font-bold text-[#1A2A3A] mb-2">Your cart is empty</h2>
            <p className="text-sm text-[#94A3B8] mb-6">Browse our halal products and add items you love</p>
            <button 
              className="px-6 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
              onClick={continueShopping}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          // ===== CART CONTENT =====
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ===== CART ITEMS ===== */}
            <div className="lg:col-span-2 space-y-3">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Product Info */}
                    <div className="flex-1 min-w-[150px]">
                      <h3 className="font-semibold text-[#1A2A3A] text-sm">{item.name}</h3>
                      <p className="text-xs text-[#94A3B8]">{item.seller}</p>
                      <p className="text-sm font-semibold text-[#1769AA] mt-1">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
                        <button
                          className="w-8 h-8 flex items-center justify-center text-[#5A6A7A] hover:bg-[#F1F7FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={processing || !item.inStock}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-[#1A2A3A]">
                          {item.quantity}
                        </span>
                        <button
                          className="w-8 h-8 flex items-center justify-center text-[#5A6A7A] hover:bg-[#F1F7FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={processing || !item.inStock}
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#1A2A3A]">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        <button
                          className="text-xs text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                          onClick={() => removeFromCart(item.id)}
                          disabled={processing}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== ORDER SUMMARY ===== */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E8EEF4] shadow-sm p-6 sticky top-6">
                <h3 className="text-base font-bold text-[#1A2A3A] mb-4">Order Summary</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5A6A7A]">Subtotal ({getItemCount()} items)</span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5A6A7A]">Delivery Fee</span>
                    <span className="font-semibold text-[#1A2A3A]">
                      {getDeliveryFee() === 0 ? 'FREE' : formatCurrency(getDeliveryFee())}
                    </span>
                  </div>
                  {getDeliveryFee() === 0 && getSubtotal() > 0 && (
                    <div className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-center">
                      Free delivery on orders over KES 5,000
                    </div>
                  )}
                  
                  <div className="border-t border-[#E2E8F0] pt-3 mt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-[#1A2A3A]">Total</span>
                      <span className="text-lg font-bold text-[#1769AA]">{formatCurrency(getTotal())}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="w-full mt-4 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 shadow-md shadow-[#1769AA]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleCheckout}
                  disabled={processing || cart.length === 0}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                <p className="text-[10px] text-[#94A3B8] text-center mt-3">
                  Secure payment · Halal certified
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CHECKOUT MODAL ===== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Order</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowCheckoutModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-[#F1F7FC] pb-2">
                    <span className="text-[#1A2A3A]">{item.name} <span className="text-[#94A3B8]">×{item.quantity}</span></span>
                    <span className="font-semibold text-[#1A2A3A]">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Subtotal</span>
                  <span className="font-semibold text-[#1A2A3A]">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Delivery</span>
                  <span className="font-semibold text-[#1A2A3A]">{getDeliveryFee() === 0 ? 'FREE' : formatCurrency(getDeliveryFee())}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#E2E8F0]">
                  <span className="font-semibold text-[#1A2A3A]">Total</span>
                  <span className="font-bold text-[#1769AA]">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-700 leading-relaxed">
                  Payment will be processed via M-Pesa. A confirmation will be sent to your phone.
                </p>
              </div>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowCheckoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmOrder}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Order'
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
                <h3 className="text-lg font-bold text-white">Order Placed!</h3>
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
                <div className="text-sm text-[#94A3B8]">Your order has been confirmed</div>
                <div className="text-xl font-bold text-[#1A2A3A]">Order #{orderNumber}</div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Items</span>
                  <span className="font-semibold text-[#1A2A3A]">{getItemCount()} products</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Total</span>
                  <span className="font-bold text-[#1769AA]">{formatCurrency(getTotal())}</span>
                </div>
              </div>

              <div className="bg-[#F1F7FC] rounded-xl p-4">
                <p className="text-sm text-[#5A6A7A] italic leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC]">
              <button 
                className="w-full px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/ecommerce');
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;