import React, { useState, useEffect, useRef } from 'react';

const ChatBot = () => {
  // ===== STATE =====
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // ===== FAQ DATA =====
  const faqs = [
    {
      keywords: ['hello', 'hi', 'hey', 'assalamu', 'salam'],
      response: "Assalamu Alaykum! 👋 Welcome to HalalHub. How can I help you today? I'm here to assist with:\n\n• 💳 Wallet & Payments\n• ⚖️ Zakat Calculation\n• 🤲 Sadaqa Donations\n• 🛒 Halal Market Shopping\n• 📋 Account & KYC\n• 🏨 HalalStay Bookings"
    },
    {
      keywords: ['balance', 'wallet', 'money'],
      response: "💰 To check your wallet balance:\n\n1. Go to the Dashboard\n2. Click on the 'Wallet' tab\n3. Your balance will be displayed at the top\n\nYou can also add money via M-Pesa directly from the Wallet page."
    },
    {
      keywords: ['zakat', 'calculate', 'calculator'],
      response: "⚖️ To calculate your Zakat:\n\n1. Go to the 'Zakat' page in the sidebar\n2. Enter your:\n   • Cash & Bank Savings\n   • Gold Value\n   • Silver Value\n   • Business Assets\n   • Investments\n   • Liabilities\n\n3. The system will automatically calculate your Zakat due (2.5%)."
    },
    {
      keywords: ['sadaqa', 'donate', 'charity'],
      response: "🤲 To give Sadaqa:\n\n1. Go to the 'Sadaqa' page\n2. Browse active campaigns\n3. Select a campaign you wish to support\n4. Enter your donation amount\n5. Click 'Give Sadaqa — Lillahi Ta'ala'\n\nYour donation will be processed through M-Pesa."
    },
    {
      keywords: ['halalstay', 'book', 'accommodation', 'stay'],
      response: "🏨 To book a HalalStay:\n\n1. Go to the 'HalalStay' page\n2. Search by county or property type\n3. Select your check-in and check-out dates\n4. Choose a property\n5. Click 'Book Now'\n6. Confirm your booking and pay\n\nAll properties are halal-certified and sharia-compliant."
    },
    {
      keywords: ['market', 'ecommerce', 'shop', 'buy', 'product'],
      response: "🛒 To shop on Halal Market:\n\n1. Go to the 'Halal Market' page\n2. Browse products by category or search\n3. Click on a product to view details\n4. Click 'Add to Cart'\n5. Review your cart and checkout\n6. Pay via M-Pesa\n\nAll products are 100% halal-certified."
    },
    {
      keywords: ['p2p', 'loan', 'borrow', 'lend'],
      response: "🤝 For P2P Amanah (Qard Hasan):\n\n• 0% interest loans\n• Browse loan requests\n• Fund a loan or request one\n• Repay through monthly installments\n\nAll loans are interest-free (Riba-free) as per Islamic principles."
    },
    {
      keywords: ['takaful', 'insurance', 'cover'],
      response: "🛡️ Takaful is Islamic insurance based on mutual guarantee:\n\n• Choose a plan (Basic, Family, Business)\n• Monthly contributions (Tabarru' model)\n• Get covered for medical, accidental death, and more\n• Surplus shared among members"
    },
    {
      keywords: ['pension', 'imam', 'retirement'],
      response: "🕌 Imam Pension Scheme:\n\n• Monthly contributions\n• Invested in halal sukuk (0% Riba)\n• Estimated 6% annual return\n• Retirement benefits at age 65\n• Beneficiary coverage for family"
    },
    {
      keywords: ['kyc', 'verify', 'verification', 'id'],
      response: "📋 To complete your KYC verification:\n\n1. Go to the 'KYC Status' page\n2. Upload your:\n   • National ID\n   • Passport photo\n   • Proof of address\n3. Wait for admin approval\n4. You'll receive confirmation via email"
    },
    {
      keywords: ['utilities', 'bill', 'pay', 'electricity', 'water'],
      response: "⚡ To pay utilities:\n\n1. Go to the 'Utilities' page\n2. Select your provider (KPLC, Water, etc.)\n3. Enter your account number\n4. Enter the amount\n5. Click 'Pay Now via M-Pesa'\n6. Confirm payment on your phone"
    },
    {
      keywords: ['hajj', 'umrah', 'pilgrimage'],
      response: "🕋 For Hajj & Umrah services:\n\n• Package information\n• Travel arrangements\n• Visa assistance\n• Accommodation in Makkah & Madinah\n• Transportation\n\nContact our Hajj specialists for more details."
    },
    {
      keywords: ['register', 'signup', 'account', 'create'],
      response: "📝 To create an account:\n\n1. Click 'Sign In / Register' in the top right\n2. Select 'Register' tab\n3. Choose your role: Client or Vendor\n4. Fill in your details\n5. Accept Terms & Conditions\n6. Verify your email and phone\n\nIt's quick and easy!"
    },
    {
      keywords: ['vendor', 'sell', 'business', 'seller'],
      response: "🏪 To become a vendor:\n\n1. Register as a Vendor\n2. Select your business type\n3. Complete your business profile\n4. Add products to your store\n5. Manage orders and inventory\n6. Get paid via wallet\n\nStart selling halal products today!"
    },
    {
      keywords: ['help', 'support', 'contact', 'assist'],
      response: "📧 We're here to help!\n\n• Email: support@halalhub.com\n• Phone: +254 700 000 000\n• WhatsApp: +254 700 000 000\n\nOur support team is available 8am-8pm, Monday-Saturday.\n\nJazakAllah Khair for choosing HalalHub! 🤲"
    },
    {
      keywords: ['thank', 'thanks', 'jazakallah', 'barakallah'],
      response: "JazakAllah Khair! 🤲 It's our pleasure to serve you. May Allah accept your good deeds and increase you in barakah.\n\nIs there anything else I can help you with?"
    }
  ];

  // ===== GREETING MESSAGE =====
  useEffect(() => {
    const greeting = {
      id: Date.now(),
      sender: 'bot',
      text: "Assalamu Alaykum! 👋\n\nWelcome to HalalHub Support. I'm here to help you with:\n\n• 💳 Wallet & Payments\n• ⚖️ Zakat & Sadaqa\n• 🛒 Halal Market\n• 🏨 HalalStay\n• 📋 Account & KYC\n\nAsk me anything about HalalHub!",
      timestamp: new Date().toISOString()
    };
    setMessages([greeting]);
  }, []);

  // ===== SCROLL TO BOTTOM =====
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ===== RESPONSE HANDLER =====
  const getBotResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Check for matching keywords
    for (const faq of faqs) {
      for (const keyword of faq.keywords) {
        if (lowerMsg.includes(keyword)) {
          return faq.response;
        }
      }
    }
    
    // Default response
    return "I'm not sure I understand. 🤔\n\nHere are some things I can help with:\n• 💳 Wallet & Payments\n• ⚖️ Zakat Calculation\n• 🤲 Sadaqa Donations\n• 🛒 Halal Market\n• 🏨 HalalStay\n• 📋 KYC Verification\n• 🏪 Vendor Services\n\nPlease ask about any of these topics!";
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      setIsTyping(false);
      
      // Mark as read if bot responds
      setUnreadCount(0);
    }, 800 + Math.random() * 1000);
  };

  // ===== TOGGLE CHAT =====
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // ===== KEYBOARD SHORTCUT =====
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ===== FORMAT TIME =====
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== QUICK REPLY BUTTONS =====
  const quickReplies = [
    { label: '💳 Wallet', value: 'How do I check my balance?' },
    { label: '⚖️ Zakat', value: 'How do I calculate Zakat?' },
    { label: '🤲 Sadaqa', value: 'How do I give Sadaqa?' },
    { label: '🛒 Market', value: 'How do I shop on Halal Market?' },
    { label: '🏨 HalalStay', value: 'How do I book a stay?' },
    { label: '📋 KYC', value: 'How do I verify my account?' }
  ];

  // ===== MAIN COMPONENT =====
  return (
    <>
      {/* ===== CHAT BUTTON ===== */}
      <button 
        className="chatbot-toggle"
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : (
          <>
            💬
            {unreadCount > 0 && (
              <span className="chatbot-badge">{unreadCount}</span>
            )}
          </>
        )}
      </button>

      {/* ===== CHAT WINDOW ===== */}
      {isOpen && (
        <div className="chatbot-window">
          {/* ===== HEADER ===== */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <div className="chatbot-title">HalalHub Support</div>
                <div className="chatbot-status">
                  <span className="chatbot-dot" />
                  Online
                </div>
              </div>
            </div>
            <button className="chatbot-minimize" onClick={toggleChat}>
              ✕
            </button>
          </div>

          {/* ===== MESSAGES ===== */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chatbot-message ${msg.sender === 'user' ? 'chatbot-message-user' : 'chatbot-message-bot'}`}
              >
                <div className="chatbot-message-content">
                  {msg.sender === 'bot' && (
                    <div className="chatbot-message-avatar">🤖</div>
                  )}
                  <div>
                    <div className="chatbot-message-text">
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="chatbot-message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* ===== TYPING INDICATOR ===== */}
            {isTyping && (
              <div className="chatbot-message chatbot-message-bot">
                <div className="chatbot-message-content">
                  <div className="chatbot-message-avatar">🤖</div>
                  <div>
                    <div className="chatbot-typing">
                      <span className="chatbot-dot-typing" />
                      <span className="chatbot-dot-typing" />
                      <span className="chatbot-dot-typing" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* ===== QUICK REPLIES ===== */}
          <div className="chatbot-quick-replies">
            {quickReplies.map((reply, index) => (
              <button 
                key={index}
                className="chatbot-quick-btn"
                onClick={() => {
                  setInput(reply.value);
                  setTimeout(() => sendMessage(), 100);
                }}
              >
                {reply.label}
              </button>
            ))}
          </div>

          {/* ===== INPUT ===== */}
          <div className="chatbot-input-container">
            <textarea
              className="chatbot-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
            />
            <button 
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>

          {/* ===== FOOTER ===== */}
          <div className="chatbot-footer">
            Powered by HalalHub · Assalamu Alaykum
          </div>
        </div>
      )}

      <style>{`
        /* ======================================== */
        /* ===== CHATBOT STYLES ===== */
        /* ======================================== */

        /* ===== TOGGLE BUTTON ===== */
        .chatbot-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          border: none;
          color: white;
          font-size: 1.6rem;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(11, 61, 46, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatbot-toggle:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 32px rgba(11, 61, 46, 0.5);
        }

        .chatbot-toggle .chatbot-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #C0392B;
          color: white;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===== CHAT WINDOW ===== */
        .chatbot-window {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 380px;
          max-width: 90vw;
          height: 500px;
          max-height: 70vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 48px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 999;
          animation: slideUpChat 0.3s ease;
        }

        @keyframes slideUpChat {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ===== HEADER ===== */
        .chatbot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          color: white;
          flex-shrink: 0;
        }

        .chatbot-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chatbot-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .chatbot-title {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .chatbot-status {
          font-size: 0.65rem;
          opacity: 0.8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .chatbot-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #27AE60;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .chatbot-minimize {
          background: none;
          border: none;
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .chatbot-minimize:hover {
          opacity: 1;
        }

        /* ===== MESSAGES ===== */
        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 18px;
          background: #F9F4EC;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .chatbot-messages::-webkit-scrollbar {
          width: 4px;
        }

        .chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chatbot-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        .chatbot-message {
          display: flex;
          flex-direction: column;
        }

        .chatbot-message-user {
          align-items: flex-end;
        }

        .chatbot-message-bot {
          align-items: flex-start;
        }

        .chatbot-message-content {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 85%;
        }

        .chatbot-message-user .chatbot-message-content {
          flex-direction: row-reverse;
        }

        .chatbot-message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .chatbot-message-text {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
          word-break: break-word;
        }

        .chatbot-message-user .chatbot-message-text {
          background: linear-gradient(135deg, #0B3D2E, #145A40);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chatbot-message-bot .chatbot-message-text {
          background: white;
          color: #1C1208;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .chatbot-message-time {
          font-size: 0.55rem;
          color: #6B5C3E;
          margin-top: 2px;
          padding: 0 4px;
        }

        .chatbot-message-user .chatbot-message-time {
          text-align: right;
        }

        /* ===== TYPING INDICATOR ===== */
        .chatbot-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          background: white;
          border-radius: 12px;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .chatbot-dot-typing {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6B5C3E;
          animation: typing 1.4s ease-in-out infinite;
        }

        .chatbot-dot-typing:nth-child(2) {
          animation-delay: 0.2s;
        }

        .chatbot-dot-typing:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }

        /* ===== QUICK REPLIES ===== */
        .chatbot-quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 10px 18px;
          background: #F9F4EC;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }

        .chatbot-quick-btn {
          padding: 4px 12px;
          border: 1px solid rgba(11, 61, 46, 0.15);
          border-radius: 20px;
          background: white;
          color: #0B3D2E;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Outfit', sans-serif;
          white-space: nowrap;
        }

        .chatbot-quick-btn:hover {
          background: #0B3D2E;
          color: white;
          border-color: #0B3D2E;
          transform: translateY(-1px);
        }

        /* ===== INPUT ===== */
        .chatbot-input-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          background: white;
          flex-shrink: 0;
        }

        .chatbot-input {
          flex: 1;
          border: 1.5px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          padding: 8px 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          color: #1C1208;
          background: #F9F4EC;
          outline: none;
          resize: none;
          min-height: 36px;
          max-height: 80px;
          transition: border-color 0.2s ease;
        }

        .chatbot-input:focus {
          border-color: #0B3D2E;
          box-shadow: 0 0 0 2px rgba(11, 61, 46, 0.06);
        }

        .chatbot-input::placeholder {
          color: #6B5C3E;
          opacity: 0.6;
        }

        .chatbot-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #C9A84C, #E8C96A);
          color: #0B3D2E;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chatbot-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
        }

        .chatbot-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ===== FOOTER ===== */
        .chatbot-footer {
          padding: 6px 18px;
          text-align: center;
          font-size: 0.55rem;
          color: #6B5C3E;
          background: #F9F4EC;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }

        /* ======================================== */
        /* ===== RESPONSIVE ===== */
        /* ======================================== */

        @media (max-width: 600px) {
          .chatbot-window {
            bottom: 80px;
            right: 12px;
            left: 12px;
            width: auto;
            height: 70vh;
            max-height: 70vh;
            border-radius: 12px;
          }

          .chatbot-toggle {
            bottom: 16px;
            right: 16px;
            width: 48px;
            height: 48px;
            font-size: 1.3rem;
          }

          .chatbot-message-content {
            max-width: 92%;
          }

          .chatbot-quick-replies {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding: 8px 14px;
            gap: 4px;
          }

          .chatbot-quick-btn {
            font-size: 0.65rem;
            padding: 3px 10px;
            white-space: nowrap;
          }

          .chatbot-input-container {
            padding: 8px 14px;
          }

          .chatbot-messages {
            padding: 12px 14px;
          }

          .chatbot-header {
            padding: 10px 14px;
          }

          .chatbot-title {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 380px) {
          .chatbot-window {
            bottom: 70px;
            height: 75vh;
            max-height: 75vh;
          }

          .chatbot-message-text {
            font-size: 0.8rem;
            padding: 8px 12px;
          }

          .chatbot-input {
            font-size: 0.8rem;
            padding: 6px 10px;
          }

          .chatbot-send-btn {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
};

export default ChatBot;