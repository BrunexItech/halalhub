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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
          <ActivityIndicator size="large" color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Hero Section */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -150 }, { translateY: -150 }],
              width: 300,
              height: 300,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.1)',
              borderRadius: 999,
            }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Image
                    source={require('../../../assets/itqaan_logo.png')}
                    style={{ height: 20, width: 60 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    About Itqaan
                  </Text>
                  <View style={{ width: 1, height: 12, backgroundColor: 'rgba(201, 164, 75, 0.2)' }} />
                  <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>Islamic Digital Ecosystem</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                  Technology That Serves
                </Text>
                <Text style={{ color: '#C9A44B', fontSize: 18, fontWeight: '700' }}>
                  Faith, Community & Everyday Life
                </Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 6, maxWidth: 400, lineHeight: 20 }}>
                  Itqaan is a complete Islamic digital ecosystem designed to help Muslims access
                  trusted financial services, charitable solutions, travel experiences, and everyday
                  digital tools in one connected platform.
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#C9A44B',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      shadowColor: '#C9A44B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => navigation.navigate('RegisterRole' as never)}
                  >
                    <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '700' }}>Explore Itqaan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(201, 164, 75, 0.3)',
                    }}
                  >
                    <Text style={{ color: '#F7F6F1', fontSize: 13, fontWeight: '600' }}>Our Mission</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                backgroundColor: '#C9A44B',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#C9A44B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <Image
                  source={require('../../../assets/itqaan_logo.png')}
                  style={{ height: 36, width: 36 }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* Why Itqaan Exists */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Why Itqaan Exists
            </Text>
            <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>
              The Muslim Digital Experience Should Not Be Fragmented
            </Text>
            <View style={{
              width: 48,
              height: 2,
              backgroundColor: '#C9A44B',
              borderRadius: 999,
              marginTop: 8,
            }} />
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, maxWidth: 500 }}>
              Muslims today often rely on many disconnected platforms for payments, giving, travel,
              community support, and everyday services. Itqaan brings these essential services
              together into one connected ecosystem designed around Islamic values.
            </Text>
          </View>

          {/* Mission, Vision, Purpose */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            {[
              { number: '1', title: 'Our Mission', desc: 'To build technology that respects Islamic values, connects communities, and makes essential services more accessible to Muslims everywhere.' },
              { number: '2', title: 'Our Vision', desc: 'A world where Muslims can access trusted, meaningful, and Sharia-conscious digital services through one connected ecosystem.' },
              { number: '3', title: 'Our Purpose', desc: 'Technology is the tool. The purpose is to make meaningful services more accessible, transparent, and connected for the Muslim community.' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 140,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.2)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                  marginBottom: 8,
                }}>
                  <Text style={{ color: '#C9A44B', fontSize: 16, fontWeight: '700' }}>{item.number}</Text>
                </View>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 16 }}>{item.desc}</Text>
              </View>
            ))}
          </View>

          {/* Ecosystem */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                One Connected Platform
              </Text>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 4 }}>The Itqaan Ecosystem</Text>
              <View style={{
                width: 48,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 999,
                marginTop: 8,
              }} />
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 400 }}>
                All the services you need, designed for the Muslim community, in one trusted place.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ecosystemServices.map((service, index) => (
                <View key={index} style={{
                  flex: 1,
                  minWidth: 90,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#1F2937', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{service.name}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 10, textAlign: 'center', marginTop: 2 }}>{service.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Values */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                Guided by Principles
              </Text>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 4 }}>Our Values</Text>
              <View style={{
                width: 48,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 999,
                marginTop: 8,
              }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {values.map((value, index) => (
                <View key={index} style={{
                  flex: 1,
                  minWidth: 140,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={{ color: '#C9A44B', fontSize: 14 }}>★</Text>
                    <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700' }}>{value.title}</Text>
                  </View>
                  <Text style={{ color: '#6B7280', fontSize: 12, lineHeight: 16 }}>{value.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sharia-Conscious Design */}
          <View style={{
            backgroundColor: 'rgba(201, 164, 75, 0.08)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            marginBottom: 20,
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>🛡️</Text>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700' }}>Designed with Islamic Principles in Mind</Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                Itqaan is built to be Sharia-conscious, transparent, and responsible. Every service is
                designed with care for Islamic values, encouraging users to consult qualified professionals
                for specific religious or legal guidance when needed.
              </Text>
            </View>
          </View>

          {/* Global Community */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                For Muslims Worldwide
              </Text>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 4 }}>A Global Community</Text>
              <View style={{
                width: 48,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 999,
                marginTop: 8,
              }} />
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 10, lineHeight: 20 }}>
                Itqaan is not limited by borders. Muslims around the world have different cultures,
                languages, and needs. Our platform is designed to serve Muslims across different regions
                while respecting local realities.
              </Text>
            </View>
            <View style={{
              flex: 1,
              minWidth: 150,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.2)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
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
                    backgroundColor: 'rgba(11, 52, 43, 0.03)',
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.1)',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: item.color || '#0B342B',
                      fontSize: 18,
                      fontWeight: '700',
                    }}>
                      {item.value}
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 10, textAlign: 'center' }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* What Makes Us Different */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
            marginBottom: 20,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                What Makes Us Different
              </Text>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 4 }}>Built for the Muslim Community</Text>
              <View style={{
                width: 48,
                height: 2,
                backgroundColor: '#C9A44B',
                borderRadius: 999,
                marginTop: 8,
              }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{
                flex: 1,
                minWidth: 150,
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.15)',
              }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Not a Generic Platform</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                  Itqaan is designed around the needs and values of the Muslim community from the beginning — not a generic platform with Islamic features added later.
                </Text>
              </View>
              <View style={{
                flex: 1,
                minWidth: 150,
                backgroundColor: '#FAFAF7',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.15)',
              }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Connected Ecosystem</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                  Unlike disconnected services, Itqaan brings financial tools, charitable solutions, travel services, and everyday digital experiences into one trusted platform.
                </Text>
              </View>
            </View>
          </View>

          {/* The Future */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 20, color: '#C9A44B' }}>🌿</Text>
            <Text style={{ color: '#F7F6F1', fontSize: 15, fontWeight: '700', marginTop: 6 }}>Continuously Evolving</Text>
            <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 13, textAlign: 'center', marginTop: 4, maxWidth: 400, lineHeight: 18 }}>
              The ecosystem grows as the needs of the community grow. Itqaan is committed to
              expanding its services, reaching more communities, and building trusted partnerships
              across the globe.
            </Text>
          </View>

          {/* Call to Action */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.3)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{ color: '#F7F6F1', fontSize: 18, fontWeight: '700' }}>Join the Itqaan Community</Text>
            <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, textAlign: 'center', maxWidth: 400, lineHeight: 20 }}>
              Explore the ecosystem and discover how Itqaan can serve your needs.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#C9A44B',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  shadowColor: '#C9A44B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => navigation.navigate('RegisterRole' as never)}
              >
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>Explore the Ecosystem</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.3)',
                }}
                onPress={() => navigation.navigate('Dashboard' as never)}
              >
                <Text style={{ color: '#F7F6F1', fontSize: 14, fontWeight: '600' }}>Discover Itqaan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: 'rgba(201, 164, 75, 0.5)', fontSize: 10, letterSpacing: 1, fontWeight: '500' }}>
              Built with purpose. Guided by faith. Serving the Ummah.
            </Text>
            <Image
              source={require('../../../assets/itqaan_logo.png')}
              style={{ height: 16, width: 50, marginTop: 6, opacity: 0.3 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;