import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/api';
import PinModal from './PinModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [orderSummary, setOrderSummary] = useState({
    itemCount: 0,
    subtotal: 0,
    total: 0
  });

  // ===== PIN MODAL STATE =====
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingOrderData, setPendingOrderData] = useState(null);

  const getTotal = () => {
    return getCartTotal();
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setShowCheckoutModal(true);
  };

  // ===== UPDATED: confirmOrder now shows PIN modal =====
  const confirmOrder = () => {
    if (cart.length === 0) {
      setError('Your cart is empty. Please add items before ordering.');
      return;
    }

    // Get vendor_id from first cart item
    const vendorId = cart[0]?.vendor_id || cart[0]?.vendorId || cart[0]?.vendor?.id;
    
    // Build items array correctly for backend
    const orderItems = cart.map(item => ({
      product_id: item.product_id || item.id,
      name: item.name || item.product_name || 'Product',
      price: item.price || 0,
      quantity: item.quantity || 1
    }));

    const subtotal = getCartTotal();
    const total = getTotal();

    // Store order data and show PIN modal
    setPendingOrderData({
      vendor_id: vendorId,
      items: orderItems,
      subtotal: subtotal,
      delivery_fee: 0,
      total_amount: total,
      delivery_address: 'Nairobi CBD',
      delivery_type: 'delivery',
      special_instructions: '',
      itemCount: getCartItemCount()
    });

    // Store order summary before clearing cart
    setOrderSummary({
      itemCount: getCartItemCount(),
      subtotal: subtotal,
      total: total
    });

    setShowCheckoutModal(false);
    setShowPinModal(true);
    setPinError('');
  };

  // ===== PIN VERIFICATION =====
  const handlePinVerify = async (pin) => {
    setPinLoading(true);
    setPinError('');
    try {
      const token = localStorage.getItem('halalhub_token');
      
      const orderData = {
        ...pendingOrderData,
        pin: pin
      };

      const response = await fetch(`${API_BASE}/client/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Order creation failed');
      }

      const orderDataResponse = await response.json();
      const newOrderNumber = orderDataResponse.orderId || orderDataResponse.orderNumber || 'ORD' + Date.now().toString().slice(-8);
      setOrderNumber(newOrderNumber);

      // Clear cart from database using API
      await cartService.clearCart();

      // Clear local cart state
      setCart([]);

      // Clear cart from localStorage
      localStorage.removeItem('halalhub_cart');

      setShowPinModal(false);
      setPendingOrderData(null);
      setShowSuccessModal(true);
      
      setSuccess('Order placed successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Order error:', err);
      setPinError(err.response?.data?.error || err.message || 'Order failed. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinError('');
    setPendingOrderData(null);
  };

  const continueShopping = () => {
    navigate('/market');
  };

  const clearCart = async () => {
    if (cart.length === 0) return;
    
    try {
      await cartService.clearCart();
      setCart([]);
      localStorage.removeItem('halalhub_cart');
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
    <svg className="w-8 h-8 text-[#0B342B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          backgroundColor: imgUrl ? 'transparent' : '#FAFAF7' 
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
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
            <div>
              <h2 className="text-[22px] font-semibold text-[#1F2937]">Shopping Cart</h2>
              {cart.length > 0 && (
                <p className="text-[14px] text-[#6B7280] mt-0.5">{getCartItemCount()} items · {formatCurrency(getCartTotal())}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button 
                  className="px-3 py-1.5 text-[14px] font-medium text-[#6B7280] hover:text-[#DC2626] transition-colors"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              )}
              <button 
                className="w-8 h-8 rounded-xl hover:bg-[#FAFAF7] transition flex items-center justify-center text-[#6B7280] hover:text-[#1F2937]"
                onClick={onClose}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-white border border-[#DC2626]/20 rounded-xl text-[15px] text-[#DC2626] flex justify-between items-center shadow-sm">
              <span>{error}</span>
              <button className="text-[#DC2626]/60 hover:text-[#DC2626]" onClick={() => setError('')}><CloseIcon /></button>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-4 p-3 bg-white border border-[#3FAF73]/20 rounded-xl text-[15px] text-[#3FAF73] flex justify-between items-center shadow-sm">
              <span>{success}</span>
              <button className="text-[#3FAF73]/60 hover:text-[#3FAF73]" onClick={() => setSuccess('')}><CloseIcon /></button>
            </div>
          )}

          <div className="p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <EmptyCartIcon />
                <h3 className="text-[22px] font-semibold text-[#1F2937] mt-4 mb-2">Your cart is empty</h3>
                <p className="text-[15px] text-[#6B7280] mb-6">Browse our halal products and add items you love</p>
                <button 
                  className="px-6 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                  onClick={continueShopping}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3">
                  {cart.map((item) => {
                    // Use cart_id or id for the update/delete operations
                    const itemId = item.cart_id || item.id;
                    return (
                      <div 
                        key={itemId} 
                        className="bg-[#FAFAF7] rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-[#E8EEF4]"
                      >
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex-1 min-w-[150px]">
                            <div className="flex items-start gap-3">
                              <ProductImage image={item.image || item.images} name={item.name} />
                              <div>
                                <h4 className="font-semibold text-[#1F2937] text-[15px]">{item.name}</h4>
                                <p className="text-[13px] text-[#6B7280]">{item.vendor_name || item.business_name || 'Vendor'}</p>
                                <p className="text-[15px] font-semibold text-[#0B342B] mt-1">
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-auto">
                            <div className="flex items-center border border-[#E8EEF4] rounded-lg overflow-hidden bg-white">
                              <button
                                className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:bg-[#FAFAF7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => updateQuantity(itemId, (item.quantity || 1) - 1)}
                                disabled={localProcessing}
                              >
                                <span className="text-[18px]">-</span>
                              </button>
                              <span className="w-8 text-center text-[15px] font-medium text-[#1F2937]">
                                {item.quantity || 1}
                              </span>
                              <button
                                className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:bg-[#FAFAF7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}
                                disabled={localProcessing}
                              >
                                <span className="text-[18px]">+</span>
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="text-[15px] font-bold text-[#1F2937]">
                                {formatCurrency((item.price || 0) * (item.quantity || 1))}
                              </div>
                              <button
                                className="text-[13px] text-[#6B7280] hover:text-[#DC2626] transition-colors"
                                onClick={() => removeFromCart(itemId)}
                                disabled={localProcessing}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-[#FAFAF7] rounded-xl p-6 sticky top-6 border border-[#E8EEF4]">
                    <h4 className="text-[17px] font-semibold text-[#1F2937] mb-4">Order Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[15px]">
                        <span className="text-[#6B7280]">Subtotal ({getCartItemCount()} items)</span>
                        <span className="font-semibold text-[#1F2937]">{formatCurrency(getCartTotal())}</span>
                      </div>
                      
                      <div className="border-t border-[#E8EEF4] pt-3 mt-2">
                        <div className="flex justify-between">
                          <span className="text-[17px] font-bold text-[#1F2937]">Total</span>
                          <span className="text-[22px] font-bold text-[#0B342B]">{formatCurrency(getTotal())}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="w-full mt-4 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 disabled:opacity-60 disabled:cursor-not-allowed text-[15px]"
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
                      <p className="text-[13px] text-[#DC2626] text-center mt-2">
                        Your cart is empty. Add items to proceed.
                      </p>
                    )}

                    <p className="text-[12px] text-[#6B7280] text-center mt-3">
                      Secure payment · Halal certified
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCheckoutModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#F4F5F1] flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-[22px] font-semibold text-[#1F2937]">Confirm Order</h3>
              <button className="text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={() => setShowCheckoutModal(false)}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#6B7280]">Your cart is empty.</p>
                  <button 
                    className="mt-4 px-6 py-2.5 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-sm text-[15px]"
                    onClick={() => setShowCheckoutModal(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-[15px] border-b border-[#F4F5F1] pb-2">
                        <span className="text-[#1F2937]">{item.name} <span className="text-[#6B7280]">×{item.quantity}</span></span>
                        <span className="font-semibold text-[#1F2937]">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 border border-[#E8EEF4]">
                    <div className="flex justify-between text-[15px]">
                      <span className="text-[#6B7280]">Subtotal</span>
                      <span className="font-semibold text-[#1F2937]">{formatCurrency(getCartTotal())}</span>
                    </div>
                    <div className="flex justify-between text-[17px] font-bold pt-2 border-t border-[#E8EEF4]">
                      <span className="text-[#1F2937]">Total</span>
                      <span className="text-[#0B342B]">{formatCurrency(getTotal())}</span>
                    </div>
                  </div>

                  <div className="bg-[#DBEAFE] rounded-xl p-4 text-center border border-[#BFDBFE]">
                    <p className="text-[15px] text-[#3B82F6] leading-relaxed">
                      Payment will be processed via M-Pesa. A confirmation will be sent to your phone.
                    </p>
                  </div>
                </>
              )}

              {error && <p className="text-[15px] text-[#DC2626]">{error}</p>}
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1] flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button 
                className="flex-1 px-6 py-3 bg-white text-[#6B7280] font-medium rounded-xl border border-[#E8EEF4] hover:bg-[#FAFAF7] transition-all duration-200"
                onClick={() => setShowCheckoutModal(false)}
              >
                Cancel
              </button>
              {cart.length > 0 && (
                <button 
                  className="flex-[2] px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#0B342B]/20"
                  onClick={confirmOrder}
                  disabled={localProcessing || cart.length === 0}
                >
                  {localProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#F4F5F1] bg-[#0B342B] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-[22px] font-semibold text-white">Order Placed!</h3>
                <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowSuccessModal(false)}>
                  <CloseIcon />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-[#0B342B]/10 flex items-center justify-center mx-auto border-4 border-[#0B342B]/20">
                <CheckIcon />
              </div>
              
              <div>
                <div className="text-[15px] text-[#6B7280]">Your order has been confirmed</div>
                <div className="text-[22px] font-bold text-[#1F2937]">Order #{orderNumber}</div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 space-y-2 text-left border border-[#E8EEF4]">
                <div className="flex justify-between text-[15px]">
                  <span className="text-[#6B7280]">Items</span>
                  <span className="font-semibold text-[#1F2937]">{orderSummary.itemCount || getCartItemCount()} products</span>
                </div>
                <div className="flex justify-between text-[17px] font-bold pt-2 border-t border-[#E8EEF4]">
                  <span className="text-[#1F2937]">Total</span>
                  <span className="font-bold text-[#0B342B]">{formatCurrency(orderSummary.total || getTotal())}</span>
                </div>
              </div>

              <div className="bg-[#FAFAF7] rounded-xl p-4 border border-[#E8EEF4]">
                <p className="text-[15px] text-[#6B7280] italic leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes..." — Quran 2:261
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#F4F5F1]">
              <button 
                className="w-full px-6 py-3 bg-[#0B342B] text-white font-medium rounded-xl hover:bg-[#032A24] transition-all duration-200 shadow-md shadow-[#0B342B]/20 text-[15px]"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/market');
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PIN MODAL ===== */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        loading={pinLoading}
        error={pinError}
        title="Confirm Order"
        subtitle="Enter your 4-digit PIN to confirm your order"
        amount={pendingOrderData?.total_amount || 0}
        recipient="Order"
        transactionType="order"
      />
    </>
  );
};

export default Cart;