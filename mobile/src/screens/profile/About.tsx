import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Professional SVG Icons
const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShieldIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L5 7V12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12V7L12 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TargetIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="12" r="2" fill={color}/>
  </Svg>
);

const GlobeIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M2 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M12 2C14.5 5.5 14.5 18.5 12 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M12 2C9.5 5.5 9.5 18.5 12 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const HeartIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const StarIcon = ({ color = '#C9A44B', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </Svg>
);

const About = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const ecosystemServices = [
    { name: 'Digital Wallet', description: 'Secure daily transactions' },
    { name: 'Zakat', description: 'Calculate and pay Zakat' },
    { name: 'Sadaqa', description: 'Give voluntary charity' },
    { name: 'Takaful', description: 'Islamic mutual insurance' },
    { name: 'Pension', description: 'Retirement support for leaders' },
    { name: 'HalalStay', description: 'Halal-friendly accommodation' },
    { name: 'Hajj & Umrah', description: 'Complete pilgrimage services' },
    { name: 'Digital Wills', description: 'Islamic estate planning' },
    { name: 'Mosque Finder', description: 'Discover mosques near you' },
    { name: 'Utilities', description: 'Pay your utility bills' },
    { name: 'Funeral Services', description: 'Islamic funeral assistance' },
  ];

  const values = [
    {
      title: 'Trust',
      description: 'Built on a foundation of integrity and reliability. Every interaction is designed to earn and maintain your confidence.',
    },
    {
      title: 'Transparency',
      description: 'Clear communication about services, fees, and processes. No hidden terms or unexpected surprises.',
    },
    {
      title: 'Community',
      description: 'Technology designed to connect, support, and strengthen the Ummah. We grow together.',
    },
    {
      title: 'Responsibility',
      description: 'Financial and digital services designed thoughtfully, with care for their impact on individuals and communities.',
    },
    {
      title: 'Accessibility',
      description: 'Important services should be easier for Muslims to access, regardless of where they are.',
    },
    {
      title: 'Innovation',
      description: 'Islamic values and modern technology working together responsibly to serve the community better.',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Premium Navigation Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(3, 42, 36, 0.04)',
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{
                padding: 8,
                marginRight: 12,
                marginLeft: -8,
                borderRadius: 10,
              }}
            >
              <BackIcon color="#032A24" size={24} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#032A24',
                fontSize: 18,
                fontWeight: '600',
                letterSpacing: -0.3,
              }}>
                About Itqaan
              </Text>
              <Text style={{
                color: '#8B8A86',
                fontSize: 12,
                letterSpacing: 0.2,
              }}>
                Islamic Digital Ecosystem
              </Text>
            </View>

            {/* Gold accent dot */}
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#C9A44B',
              opacity: 0.4,
            }} />
          </View>

          {/* Hero Section */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 20,
            padding: 24,
            marginBottom: 28,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            {/* Decorative elements */}
            <View style={{ position: 'absolute', top: -60, right: -60, width: 160, height: 160, backgroundColor: 'rgba(201, 164, 75, 0.03)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -40, left: -40, width: 100, height: 100, backgroundColor: 'rgba(201, 164, 75, 0.03)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    backgroundColor: 'rgba(201, 164, 75, 0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.2)',
                  }}>
                    <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                      Islamic Digital Ecosystem
                    </Text>
                  </View>
                </View>

                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 26,
                  fontWeight: '700',
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }}>
                  Technology That Serves
                </Text>
                <Text style={{
                  color: '#C9A44B',
                  fontSize: 18,
                  fontWeight: '600',
                  letterSpacing: -0.3,
                  marginBottom: 12,
                }}>
                  Faith, Community & Everyday Life
                </Text>

                <Text style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  lineHeight: 22,
                  maxWidth: 500,
                }}>
                  Itqaan is a complete Islamic digital ecosystem designed to help Muslims access
                  trusted financial services, charitable solutions, travel experiences, and everyday
                  digital tools in one connected platform.
                </Text>
              </View>

              {/* Logo Badge */}
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                backgroundColor: 'rgba(201, 164, 75, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.2)',
              }}>
                <Image
                  source={require('../../../assets/itqaan_logo.png')}
                  style={{ height: 40, width: 40 }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* Why Itqaan Exists */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                marginBottom: 8,
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                  Why Itqaan Exists
                </Text>
              </View>
              <Text style={{
                color: '#032A24',
                fontSize: 22,
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: -0.3,
                marginBottom: 6,
              }}>
                The Muslim Digital Experience Should Not Be Fragmented
              </Text>
              <View style={{
                width: 40,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 1,
                marginBottom: 12,
              }} />
              <Text style={{
                color: '#6B7280',
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 22,
                maxWidth: 500,
              }}>
                Muslims today often rely on many disconnected platforms for payments, giving, travel,
                community support, and everyday services. Itqaan brings these essential services
                together into one connected ecosystem designed around Islamic values.
              </Text>
            </View>
          </View>

          {/* Mission, Vision, Purpose */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
            {[
              { icon: ShieldIcon, title: 'Our Mission', desc: 'To build technology that respects Islamic values, connects communities, and makes essential services more accessible to Muslims everywhere.' },
              { icon: TargetIcon, title: 'Our Vision', desc: 'A world where Muslims can access trusted, meaningful, and Sharia-conscious digital services through one connected ecosystem.' },
              { icon: HeartIcon, title: 'Our Purpose', desc: 'Technology is the tool. The purpose is to make meaningful services more accessible, transparent, and connected for the Muslim community.' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 18,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.08)',
                }}>
                  <item.icon color="#C9A44B" size={20} />
                </View>
                <Text style={{
                  color: '#032A24',
                  fontSize: 15,
                  fontWeight: '600',
                  marginBottom: 4,
                  letterSpacing: -0.2,
                }}>
                  {item.title}
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 12,
                  lineHeight: 18,
                }}>
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* Ecosystem */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ marginBottom: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: 6,
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                    One Connected Platform
                  </Text>
                </View>
                <Text style={{
                  color: '#032A24',
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}>
                  The Itqaan Ecosystem
                </Text>
                <View style={{
                  width: 40,
                  height: 2,
                  backgroundColor: '#C9A44B',
                  borderRadius: 1,
                  marginTop: 6,
                }} />
                <Text style={{
                  color: '#6B7280',
                  fontSize: 14,
                  textAlign: 'center',
                  marginTop: 8,
                  maxWidth: 400,
                }}>
                  All the services you need, designed for the Muslim community, in one trusted place.
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              {ecosystemServices.map((service, index) => (
                <View key={index} style={{
                  flex: 1,
                  minWidth: 100,
                  maxWidth: (width - 40 - 20) / 3,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                  alignItems: 'center',
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.02,
                  shadowRadius: 4,
                  elevation: 1,
                }}>
                  <Text style={{
                    color: '#032A24',
                    fontSize: 11,
                    fontWeight: '600',
                    textAlign: 'center',
                    letterSpacing: 0.1,
                  }}>
                    {service.name}
                  </Text>
                  <Text style={{
                    color: '#8B8A86',
                    fontSize: 9,
                    textAlign: 'center',
                    marginTop: 2,
                  }}>
                    {service.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Values */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ marginBottom: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: 6,
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                    Guided by Principles
                  </Text>
                </View>
                <Text style={{
                  color: '#032A24',
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}>
                  Our Values
                </Text>
                <View style={{
                  width: 40,
                  height: 2,
                  backgroundColor: '#C9A44B',
                  borderRadius: 1,
                  marginTop: 6,
                }} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {values.map((value, index) => (
                <View key={index} style={{
                  flex: 1,
                  minWidth: 150,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.06)',
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <StarIcon color="#C9A44B" size={14} />
                    <Text style={{
                      color: '#032A24',
                      fontSize: 14,
                      fontWeight: '600',
                      letterSpacing: -0.2,
                    }}>
                      {value.title}
                    </Text>
                  </View>
                  <Text style={{
                    color: '#6B7280',
                    fontSize: 12,
                    lineHeight: 18,
                  }}>
                    {value.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sharia-Conscious Design */}
          <View style={{
            backgroundColor: 'rgba(201, 164, 75, 0.04)',
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.1)',
            marginBottom: 28,
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.08)',
              }}>
                <ShieldIcon color="#C9A44B" size={22} />
              </View>
              <Text style={{
                color: '#032A24',
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: -0.2,
              }}>
                Designed with Islamic Principles in Mind
              </Text>
              <Text style={{
                color: '#6B7280',
                fontSize: 13,
                textAlign: 'center',
                marginTop: 4,
                lineHeight: 20,
                maxWidth: 500,
              }}>
                Itqaan is built to be Sharia-conscious, transparent, and responsible. Every service is
                designed with care for Islamic values, encouraging users to consult qualified professionals
                for specific religious or legal guidance when needed.
              </Text>
            </View>
          </View>

          {/* Global Community */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                alignSelf: 'flex-start',
                marginBottom: 6,
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                  For Muslims Worldwide
                </Text>
              </View>
              <Text style={{
                color: '#032A24',
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.3,
                marginBottom: 4,
              }}>
                A Global Community
              </Text>
              <View style={{
                width: 40,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 1,
                marginBottom: 10,
              }} />
              <Text style={{
                color: '#6B7280',
                fontSize: 14,
                lineHeight: 22,
              }}>
                Itqaan is not limited by borders. Muslims around the world have different cultures,
                languages, and needs. Our platform is designed to serve Muslims across different regions
                while respecting local realities.
              </Text>
            </View>

            <View style={{
              flex: 1,
              minWidth: 160,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.06)',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 8,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Community Members', value: '10K+' },
                  { label: 'Countries', value: '8+' },
                  { label: 'Services', value: '12+' },
                  { label: 'Satisfaction', value: '98%', color: '#3FAF73' },
                ].map((item, index) => (
                  <View key={index} style={{
                    flex: 1,
                    minWidth: 60,
                    backgroundColor: '#FAFAF7',
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.04)',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: item.color || '#032A24',
                      fontSize: 18,
                      fontWeight: '700',
                      letterSpacing: -0.3,
                    }}>
                      {item.value}
                    </Text>
                    <Text style={{
                      color: '#6B7280',
                      fontSize: 10,
                      textAlign: 'center',
                      marginTop: 2,
                    }}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* What Makes Us Different */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 8,
            elevation: 1,
            marginBottom: 28,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                marginBottom: 6,
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                  What Makes Us Different
                </Text>
              </View>
              <Text style={{
                color: '#032A24',
                fontSize: 20,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}>
                Built for the Muslim Community
              </Text>
              <View style={{
                width: 40,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 1,
                marginTop: 6,
              }} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: '#FAFAF7',
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
              }}>
                <Text style={{
                  color: '#032A24',
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 4,
                }}>
                  Not a Generic Platform
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 12,
                  lineHeight: 18,
                }}>
                  Itqaan is designed around the needs and values of the Muslim community from the beginning — not a generic platform with Islamic features added later.
                </Text>
              </View>
              <View style={{
                flex: 1,
                minWidth: 160,
                backgroundColor: '#FAFAF7',
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.06)',
              }}>
                <Text style={{
                  color: '#032A24',
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 4,
                }}>
                  Connected Ecosystem
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 12,
                  lineHeight: 18,
                }}>
                  Unlike disconnected services, Itqaan brings financial tools, charitable solutions, travel services, and everyday digital experiences into one trusted platform.
                </Text>
              </View>
            </View>
          </View>

          {/* The Future */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.12)',
            alignItems: 'center',
            marginBottom: 28,
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(201, 164, 75, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.1)',
            }}>
              <GlobeIcon color="#C9A44B" size={22} />
            </View>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: '700',
              letterSpacing: -0.2,
            }}>
              Continuously Evolving
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              textAlign: 'center',
              marginTop: 4,
              maxWidth: 400,
              lineHeight: 20,
            }}>
              The ecosystem grows as the needs of the community grow. Itqaan is committed to
              expanding its services, reaching more communities, and building trusted partnerships
              across the globe.
            </Text>
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.3)',
              fontSize: 10,
              letterSpacing: 1.5,
              fontWeight: '500',
            }}>
              Built with purpose. Guided by faith. Serving the Ummah.
            </Text>
            <Image
              source={require('../../../assets/itqaan_logo.png')}
              style={{ height: 14, width: 44, marginTop: 8, opacity: 0.15 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;