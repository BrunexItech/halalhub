import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = ({ 
  cart, 
  setCart, 
  updateQuantity, 
  removeFromCart, 
  getCartTotal, 
  getCartItemCount, 
  handleCheckout, 
  processing, 
  formatCurrency, 
  onClose, 
  showCart,
  isAuthenticated,
  fetchCart
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [localProcessing, setLocalProcessing] = useState(false);

  const getDeliveryFee = () => {
    return getCartTotal() > 5000 ? 0 : 500;
  };

  const getTotal = () => {
    return getCartTotal() + getDeliveryFee();
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setShowCheckoutModal(true);
  };

  const confirmOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty. Please add items before ordering.');
      return;
    }

    setLocalProcessing(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newOrderNumber = 'ORD' + Date.now().toString().slice(-8);
      setOrderNumber(newOrderNumber);
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      setCart([]);
      
      if (fetchCart) {
        await fetchCart();
      }
      
      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally {
      setLocalProcessing(false);
    }
  };

  const continueShopping = () => {
    navigate('/ecommerce');
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
    
    try {
      setCart([]);
      setSuccess('Cart cleared.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to clear cart.');
    }
  };

  // SVG Icons
  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );

  const EmptyCartIcon = () => (
    <svg className="w-20 h-20 text-[#E8EEF4] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const ProductImage = ({ image, name }) => {
    const getImageUrl = () => {
      if (!image) return null;
      if (Array.isArray(image)) return image[0] || null;
      return image;
    };

    const imgUrl = getImageUrl();

    return (
      <div 
        className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0 border border-[#E8EEF4]" 
        style={{ 
          backgroundImage: imgUrl ? `url(${imgUrl})` : 'none', 
          backgroundColor: imgUrl ? 'transparent' : '#F1F7FC' 
        }} 
      />
    );
  };

  if (!showCart) {
    return null;
  }

  return (
    <>
      {/* Cart Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-heading font-bold text-[#1A2A3A]">Shopping Cart</h2>
              {cart.length > 0 && (
                <p className="text-sm text-[#94A3B8] mt-0.5">{getCartItemCount()} items · {formatCurrency(getCartTotal())}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button 
                  className="px-3 py-1.5 text-sm font-medium text-[#5A6A7A] hover:text-[#DC2626] transition-colors"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              )}
              <button 
                className="w-8 h-8 rounded-xl hover:bg-[#F1F7FC] transition flex items-center justify-center text-[#94A3B8] hover:text-[#1A2A3A]"
                onClick={onClose}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex justify-between items-center">
              <span>{error}</span>
              <button className="text-red-400 hover:text-red-600" onClick={() => setError('')}><CloseIcon /></button>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex justify-between items-center">
              <span>{success}</span>
              <button className="text-emerald-400 hover:text-emerald-600" onClick={() => setSuccess('')}><CloseIcon /></button>
            </div>
          )}

          <div className="p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <EmptyCartIcon />
                <h3 className="text-xl font-bold text-[#1A2A3A] mt-4 mb-2">Your cart is empty</h3>
                <p className="text-sm text-[#94A3B8] mb-6">Browse our halal products and add items you love</p>
                <button 
                  className="px-6 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                  onClick={continueShopping}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-[#F8FAFC] rounded-xl p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[150px]">
                          <div className="flex items-start gap-3">
                            <ProductImage image={item.image || item.images} name={item.name} />
                            <div>
                              <h4 className="font-semibold text-[#1A2A3A] text-sm">{item.name}</h4>
                              <p className="text-xs text-[#94A3B8]">{item.vendor_name || item.business_name || 'Vendor'}</p>
                              <p className="text-sm font-semibold text-[#1769AA] mt-1">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                          <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
                            <button
                              className="w-8 h-8 flex items-center justify-center text-[#5A6A7A] hover:bg-[#F1F7FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={localProcessing}
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-[#1A2A3A]">
                              {item.quantity}
                            </span>
                            <button
                              className="w-8 h-8 flex items-center justify-center text-[#5A6A7A] hover:bg-[#F1F7FC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={localProcessing}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-[#1A2A3A]">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                            <button
                              className="text-xs text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                              onClick={() => removeFromCart(item.id)}
                              disabled={localProcessing}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-[#F8FAFC] rounded-xl p-6 sticky top-6">
                    <h4 className="text-base font-bold text-[#1A2A3A] mb-4">Order Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5A6A7A]">Subtotal ({getCartItemCount()} items)</span>
                        <span className="font-semibold text-[#1A2A3A]">{formatCurrency(getCartTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5A6A7A]">Delivery Fee</span>
                        <span className="font-semibold text-[#1A2A3A]">
                          {getDeliveryFee() === 0 ? 'FREE' : formatCurrency(getDeliveryFee())}
                        </span>
                      </div>
                      {getDeliveryFee() === 0 && getCartTotal() > 0 && (
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
                      onClick={handleCheckoutClick}
                      disabled={localProcessing || cart.length === 0}
                    >
                      {localProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        'Proceed to Checkout'
                      )}
                    </button>

                    {cart.length === 0 && (
                      <p className="text-xs text-red-500 text-center mt-2">
                        Your cart is empty. Add items to proceed.
                      </p>
                    )}

                    <p className="text-[10px] text-[#94A3B8] text-center mt-3">
                      Secure payment · Halal certified
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== CHECKOUT MODAL ===== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCheckoutModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#F1F7FC] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-[#1A2A3A]">Confirm Order</h3>
              <button className="text-[#94A3B8] hover:text-[#1A2A3A] transition-colors" onClick={() => setShowCheckoutModal(false)}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#94A3B8]">Your cart is empty.</p>
                  <button 
                    className="mt-4 px-6 py-2.5 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200"
                    onClick={() => setShowCheckoutModal(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm border-b border-[#F1F7FC] pb-2">
                        <span className="text-[#1A2A3A]">{item.name} <span className="text-[#94A3B8]">×{item.quantity}</span></span>
                        <span className="font-semibold text-[#1A2A3A]">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Subtotal</span>
                      <span className="font-semibold text-[#1A2A3A]">{formatCurrency(getCartTotal())}</span>
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
                </>
              )}

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F1F7FC] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#5A6A7A] font-semibold rounded-xl border border-[#E8EEF4] hover:bg-[#F1F7FC] transition-all duration-200"
                onClick={() => setShowCheckoutModal(false)}
              >
                Cancel
              </button>
              {cart.length > 0 && (
                <button 
                  className="flex-[2] px-6 py-3 bg-[#1769AA] text-white font-semibold rounded-xl hover:bg-[#2F80C0] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={confirmOrder}
                  disabled={localProcessing || cart.length === 0}
                >
                  {localProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Confirm Order'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#F1F7FC] bg-[#1769AA] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Order Placed!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                  <CloseIcon />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border-4 border-emerald-200">
                <CheckIcon />
              </div>
              
              <div>
                <div className="text-sm text-[#94A3B8]">Your order has been confirmed</div>
                <div className="text-xl font-bold text-[#1A2A3A]">Order #{orderNumber}</div>
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-[#94A3B8]">Items</span>
                  <span className="font-semibold text-[#1A2A3A]">{getCartItemCount()} products</span>
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
    </>
  );
};

export default Cart;