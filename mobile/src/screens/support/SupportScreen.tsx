import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Chase } from 'react-native-animated-spinkit';

const SupportScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I create an account?',
      answer: 'To create an account, tap on the "Register" button on the login screen. Fill in your personal details including your full name, phone number, email address, and create a secure PIN. Complete the OTP verification to activate your account.',
    },
    {
      id: 2,
      question: 'How do I reset my PIN?',
      answer: 'To reset your PIN, go to the login screen and tap on "Forgot PIN". You will receive an OTP on your registered phone number. Follow the prompts to set a new PIN.',
    },
    {
      id: 3,
      question: 'What is Zakat and how is it calculated?',
      answer: 'Zakat is a mandatory charitable contribution in Islam calculated at 2.5% of your eligible wealth. Our Zakat calculator helps you estimate your Zakat based on your assets, savings, and investments. For definitive rulings, consult a qualified Islamic scholar.',
    },
    {
      id: 4,
      question: 'How does Itqaan Pension work?',
      answer: 'Itqaan Pension is a Shariah-compliant support system for religious leaders. Users can contribute to support their preferred leaders. For detailed information about how the pension works and its benefits, please contact our support team at info@itqaan.co.ke.',
    },
    {
      id: 5,
      question: 'Is the app Shariah-compliant?',
      answer: 'Yes, Itqaan is fully Shariah-compliant. Our services, products, and transactions are reviewed and approved by the Itqaan Shariah Supervisory Committee (ISSC), an independent board of qualified Islamic scholars.',
    },
    {
      id: 6,
      question: 'How do I report an issue?',
      answer: 'You can report any issue by contacting our support team via email at info@itqaan.co.ke or by calling +254790211888. Please provide as much detail as possible so we can assist you promptly.',
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:info@itqaan.co.ke');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+254790211888');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              color: '#032A24',
              fontSize: 24,
              fontWeight: '700',
              letterSpacing: -0.4,
            }}
          >
            Support
          </Text>
          <Text
            style={{
              color: '#6B7280',
              fontSize: 13,
              marginTop: 4,
            }}
          >
            How can we help you?
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Chase size={36} color="#C9A44B" />
            <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            {/* Contact Section */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 1,
              }}
            >
              <Text
                style={{
                  color: '#032A24',
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 12,
                }}
              >
                Contact Us
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(0,0,0,0.05)',
                }}
                onPress={handleEmailPress}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(3, 42, 36, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>✉</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>
                    Email
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    info@itqaan.co.ke
                  </Text>
                </View>
                <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>
                  Tap to open
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                }}
                onPress={handlePhonePress}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(3, 42, 36, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>📞</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>
                    Phone
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    +254790211888
                  </Text>
                </View>
                <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>
                  Tap to call
                </Text>
              </TouchableOpacity>
            </View>

            {/* FAQ Section */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 1,
              }}
            >
              <Text
                style={{
                  color: '#032A24',
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 12,
                }}
              >
                Frequently Asked Questions
              </Text>

              {faqs.map((faq) => (
                <View
                  key={faq.id}
                  style={{
                    borderBottomWidth: faq.id < faqs.length ? 1 : 0,
                    borderBottomColor: 'rgba(0,0,0,0.05)',
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 14,
                    }}
                    onPress={() => toggleFAQ(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: '#032A24',
                        fontSize: 13,
                        fontWeight: '600',
                        flex: 1,
                        marginRight: 12,
                      }}
                    >
                      {faq.question}
                    </Text>
                    <Text
                      style={{
                        color: '#C9A44B',
                        fontSize: 16,
                        fontWeight: '700',
                      }}
                    >
                      {expandedFAQ === faq.id ? '−' : '+'}
                    </Text>
                  </TouchableOpacity>

                  {expandedFAQ === faq.id && (
                    <View
                      style={{
                        paddingBottom: 16,
                        paddingTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: '#6B7280',
                          fontSize: 13,
                          lineHeight: 20,
                        }}
                      >
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Footer */}
            <View
              style={{
                alignItems: 'center',
                marginTop: 24,
              }}
            >
              <Text
                style={{
                  color: '#7A8983',
                  fontSize: 10,
                  fontWeight: '500',
                }}
              >
                Itqaan v1.0.0
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportScreen;