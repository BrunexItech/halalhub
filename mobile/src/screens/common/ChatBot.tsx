import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ChatBot = () => {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Assalamu alaykum! Welcome to Itqaan. I\'m your Islamic Finance Assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestions = [
    'What is Itqaan?',
    'How do I pay Zakat?',
    'Tell me about Takaful',
    'Islamic finance basics',
    'How to use HalalStay?',
  ];

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    if (message.includes('zakat')) {
      return 'Zakat is one of the Five Pillars of Islam. It\'s a mandatory charitable contribution calculated as 2.5% of your savings and wealth. You can calculate and pay your Zakat directly through the Itqaan platform. Would you like me to guide you to the Zakat calculator?';
    }

    if (message.includes('takaful') || message.includes('insurance')) {
      return 'Takaful is Islamic insurance based on mutual cooperation. Participants contribute to a pool, and those in need are supported. Itqaan offers family, health, and business Takaful plans. I can show you the available plans if you\'re interested!';
    }

    if (message.includes('halal') && message.includes('stay')) {
      return 'HalalStay is our accommodation booking service. All properties are verified to be halal-friendly, with features like prayer facilities, halal food options, and appropriate privacy. You can browse and book directly through the HalalStay section.';
    }

    if (message.includes('wallet') || message.includes('balance')) {
      return 'Your Itqaan wallet is a secure digital wallet for all transactions. You can top it up via M-Pesa, check your balance, and use it to pay for services like Zakat, Sadaqa, and utility bills. You can find it in the Wallet section.';
    }

    if (message.includes('hajj') || message.includes('umrah')) {
      return 'Hajj and Umrah packages are available through Itqaan. We partner with trusted operators to provide comprehensive packages including visa assistance, accommodation, and spiritual guidance. You can explore packages in the Hajj & Umrah section.';
    }

    if (message.includes('sadaqa')) {
      return 'Sadaqa is voluntary charity that can be given at any time. Itqaan allows you to give Sadaqa to various verified causes including orphan care, mosque projects, and emergency relief. You can browse campaigns in the Sadaqa section.';
    }

    if (message.includes('pension') || message.includes('retirement')) {
      return 'The Itqaan Pension Program helps support religious leaders in their retirement. You can contribute to leaders you wish to support, and they receive funds as a monthly pension. Learn more in the Pension section.';
    }

    if (message.includes('wills') || message.includes('inheritance')) {
      return 'Digital Wills (Wasiyyah) allow you to create a legally valid Islamic will. It\'s a secure way to ensure your assets are distributed according to Islamic inheritance law. You can create your will in the Digital Wills section.';
    }

    if (message.includes('itqaan') || message.includes('what is')) {
      return 'Itqaan is a complete Islamic digital ecosystem that combines financial services, charitable solutions, travel experiences, and everyday digital tools into one connected platform. Our mission is to serve the Muslim community with technology that respects Islamic values.';
    }

    if (message.includes('help') || message.includes('support')) {
      return 'I\'m here to help! You can ask me about any of our services: Zakat, Sadaqa, Takaful, HalalStay, Hajj & Umrah, Digital Wills, Utilities, or Pension. Just type your question and I\'ll do my best to assist you!';
    }

    return 'That\'s a great question! I\'m still learning, but I can help you with our main services: Zakat, Sadaqa, Takaful, HalalStay, Hajj & Umrah, Digital Wills, Utilities, and Pension. If you need specific advice, I recommend speaking with one of our customer support team members. Is there something specific you\'d like to know?';
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setShowSuggestions(false);
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponse,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Floating Button
  if (!isOpen) {
    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#0B342B',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#0B342B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 2,
          borderColor: 'rgba(201, 164, 75, 0.3)',
        }}
        onPress={() => setIsOpen(true)}
      >
        <Text style={{ fontSize: 28 }}>💬</Text>
        <View style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#3FAF73',
          borderWidth: 2,
          borderColor: '#0B342B',
        }} />
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIsOpen(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
      }}>
        <KeyboardAvoidingView
          style={{
            backgroundColor: '#FAFAF7',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
            minHeight: '50%',
          }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(11, 52, 43, 0.08)',
            backgroundColor: '#0B342B',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(201, 164, 75, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View>
                <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '700' }}>Itqaan Assistant</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#3FAF73',
                  }} />
                  <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 11 }}>Online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ paddingHorizontal: 16, paddingTop: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                {message.sender === 'bot' && (
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'rgba(201, 164, 75, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6,
                    marginTop: 4,
                  }}>
                    <Text style={{ fontSize: 14 }}>🤖</Text>
                  </View>
                )}
                <View
                  style={{
                    maxWidth: '75%',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 16,
                    backgroundColor: message.sender === 'user' ? '#0B342B' : '#FFFFFF',
                    borderWidth: message.sender === 'bot' ? 1 : 0,
                    borderColor: message.sender === 'bot' ? 'rgba(11, 52, 43, 0.08)' : 'transparent',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: message.sender === 'bot' ? 1 : 2,
                  }}
                >
                  <Text
                    style={{
                      color: message.sender === 'user' ? '#FFFFFF' : '#1F2937',
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={{
                      color: message.sender === 'user' ? 'rgba(255,255,255,0.5)' : 'rgba(107, 114, 128, 0.6)',
                      fontSize: 10,
                      marginTop: 4,
                      textAlign: 'right',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
                {message.sender === 'user' && (
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: 'rgba(11, 52, 43, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 6,
                    marginTop: 4,
                  }}>
                    <Text style={{ fontSize: 14 }}>👤</Text>
                  </View>
                )}
              </View>
            ))}

            {isTyping && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(201, 164, 75, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 6,
                }}>
                  <Text style={{ fontSize: 14 }}>🤖</Text>
                </View>
                <View style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(11, 52, 43, 0.08)',
                }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#C9A44B',
                      opacity: 0.6,
                    }} />
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#C9A44B',
                      opacity: 0.4,
                      marginLeft: 4,
                    }} />
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#C9A44B',
                      opacity: 0.2,
                      marginLeft: 4,
                    }} />
                  </View>
                </View>
              </View>
            )}

            {showSuggestions && messages.length === 1 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginBottom: 8 }}>
                  Quick suggestions:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={{
                        backgroundColor: '#FFFFFF',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(11, 52, 43, 0.12)',
                      }}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Text style={{ color: '#1F2937', fontSize: 12 }}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: 'rgba(11, 52, 43, 0.08)',
            backgroundColor: '#FFFFFF',
            gap: 8,
          }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: '#FAFAF7',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#1F2937',
                fontSize: 15,
                borderWidth: 1,
                borderColor: 'rgba(11, 52, 43, 0.08)',
              }}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="rgba(107, 114, 128, 0.5)"
              multiline
            />
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#0B342B',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !inputText.trim() ? 0.5 : 1,
                shadowColor: '#0B342B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>➤</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(11, 52, 43, 0.06)',
            backgroundColor: '#FAFAF7',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}>
            <Text style={{
              color: 'rgba(107, 114, 128, 0.5)',
              fontSize: 9,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}>
              Powered by Itqaan · Sharia-Conscious AI
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ChatBot;