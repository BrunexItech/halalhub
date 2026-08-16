import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const ServiceList = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const isLeader =
    user?.role === 'leader' ||
    user?.role === 'imam' ||
    user?.role === 'kadhi';

  const services = [
    {
      id: 'zakat',
      label: 'Zakat',
      color: '#C9A44B',
      bgColor: '#FDFAF0',
      route: 'Zakat',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke="#C9A44B" strokeWidth="1.6" />
          <Path
            d="M12 7.5V16.5M9.5 10.5C9.5 9.4 10.4 8.5 11.5 8.5H13C14.1 8.5 15 9.4 15 10.5C15 11.6 14.1 12.5 13 12.5H11C9.9 12.5 9 13.4 9 14.5C9 15.6 9.9 16.5 11 16.5H13"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'sadaqa',
      label: 'Sadaqa',
      color: '#3FAF73',
      bgColor: '#D1FAE5',
      route: 'Sadaqa',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 20.5C12 20.5 4.5 16.2 4.5 10.2C4.5 7.9 6.2 6.2 8.4 6.2C9.9 6.2 11.2 7 12 8.2C12.8 7 14.1 6.2 15.6 6.2C17.8 6.2 19.5 7.9 19.5 10.2C19.5 16.2 12 20.5 12 20.5Z"
            stroke="#3FAF73"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: 'takaful',
      label: 'Takaful',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Takaful',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.5L19 6.5V11.2C19 15.5 16.2 18.9 12 20.5C7.8 18.9 5 15.5 5 11.2V6.5L12 3.5Z"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M9 12L11.2 14.2L15.5 9.8"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: 'pension',
      label: 'Itqaan Pension',
      color: '#D97706',
      bgColor: '#FEF3C7',
      route: isLeader ? 'LeaderDashboard' : 'Pension',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4.5 19.5H19.5"
            stroke="#D97706"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M6 19V9.5M10 19V9.5M14 19V9.5M18 19V9.5"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Path
            d="M3.5 9.5L12 4L20.5 9.5"
            stroke="#D97706"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: 'hajj',
      label: 'Hajj & Umrah',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Hajj',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 19.5H19"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M6.5 19.5V8L12 4.5L17.5 8V19.5"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M9.5 10H14.5V13H9.5V10Z"
            stroke="#0B342B"
            strokeWidth="1.4"
          />
        </Svg>
      ),
    },
    {
      id: 'hearse',
      label: 'Hearse & Shroud',
      color: '#6B7280',
      bgColor: '#F3F4F6',
      route: 'Hearse',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 8.5H16L19.5 12.5V18.5H4V8.5Z"
            stroke="#6B7280"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M16 8.5V12.5H19.5"
            stroke="#6B7280"
            strokeWidth="1.6"
          />
          <Circle cx="8" cy="18.5" r="1.8" stroke="#6B7280" strokeWidth="1.5" />
          <Circle cx="16.5" cy="18.5" r="1.8" stroke="#6B7280" strokeWidth="1.5" />
        </Svg>
      ),
    },
    {
      id: 'wills',
      label: 'Digital Wills',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Wills',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 4.5H14L18 8.5V19.5H6V4.5Z"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M14 4.5V8.5H18"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M9 12H15M9 15H15"
            stroke="#0B342B"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'utilities',
      label: 'Pay Utilities',
      color: '#EA580C',
      bgColor: '#FFEDD5',
      route: 'Utilities',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13.5 3.5L6.5 13H11.5L10.5 20.5L17.5 11H12.5L13.5 3.5Z"
            stroke="#EA580C"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: 'halalstay',
      label: 'HalalStay',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'HalalStay',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 19V10.5L12 4L20 10.5V19"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M7.5 19V14H16.5V19M4 19.5H20"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'market',
      label: 'Halal Market',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Ecommerce',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 7.5H20L18.5 18.5H5.5L4 7.5Z"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M8 7.5L9 4.5H15L16 7.5"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M9 11.5V15.5M15 11.5V15.5"
            stroke="#0B342B"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'butchery',
      label: 'Halal Butchery',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Ecommerce',
      params: { category: 'butchery' },
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.5L8.5 8.5H15.5L12 3.5Z"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M8.5 8.5L6.5 20.5H17.5L15.5 8.5"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M10.5 11.5V17.5"
            stroke="#0B342B"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <Path
            d="M13.5 11.5V17.5"
            stroke="#0B342B"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <Path
            d="M8 13H16"
            stroke="#0B342B"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <Circle cx="7.5" cy="9.5" r="1" fill="#C9A44B" opacity="0.4" />
          <Circle cx="16.5" cy="9.5" r="1" fill="#C9A44B" opacity="0.4" />
        </Svg>
      ),
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Restaurants',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 4V11"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M4.5 4V9C4.5 10.4 5.6 11.5 7 11.5C8.4 11.5 9.5 10.4 9.5 9V4"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M7 11.5V20"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M16.5 4V20"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M16.5 4C14.7 5.2 14 7 14 9.5H19C19 7 18.3 5.2 16.5 4Z"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: 'mosque',
      label: 'Mosque Finder',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'MosqueFinder',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 19.5H19"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M6 19.5V11L12 6L18 11V19.5"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M12 6V3.5"
            stroke="#0B342B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <Path
            d="M10 14H14V19.5H10V14Z"
            stroke="#0B342B"
            strokeWidth="1.4"
          />
        </Svg>
      ),
    },
    {
      id: 'kadhis',
      label: isLeader ? 'Consultations' : 'Dial a Scholar',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.08)',
      route: 'Kadhis',
      icon: (
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="8"
            r="3.2"
            stroke="#0B342B"
            strokeWidth="1.6"
          />
          <Path
            d="M5.5 19.5C6 15.9 8.4 13.5 12 13.5C15.6 13.5 18 15.9 18.5 19.5"
            stroke="#0B342B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
  ];

  // Handle navigation with optional params
  const handleServicePress = (service: any) => {
    if (service.params) {
      navigation.navigate(service.route as never, service.params as never);
    } else {
      navigation.navigate(service.route as never);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#FAFAF7',
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
          }}
        >
          {/* Header */}
          <View
            style={{
              marginBottom: 22,
              paddingHorizontal: 2,
            }}
          >
            <Text
              style={{
                color: '#0B342B',
                fontSize: 26,
                fontWeight: '700',
                letterSpacing: -0.5,
                marginBottom: 7,
              }}
            >
              All Services
            </Text>

            <Text
              style={{
                color: '#66736F',
                fontSize: 14,
                lineHeight: 21,
                fontWeight: '400',
                maxWidth: 330,
              }}
            >
              Everything you need, thoughtfully brought together in one
              place.
            </Text>
          </View>

          {/* Services Container */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#E8E9E5',
              paddingHorizontal: 14,
              paddingTop: 18,
              paddingBottom: 18,

              shadowColor: '#032A24',
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowOpacity: 0.06,
              shadowRadius: 20,
              elevation: 3,
            }}
          >
            {/* Section Label */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 15,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 3,
                  backgroundColor: '#C9A44B',
                  marginRight: 9,
                }}
              />

              <Text
                style={{
                  color: '#0B342B',
                  fontSize: 14,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
              >
                Explore Services
              </Text>
            </View>

            {/* Services Grid */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  activeOpacity={0.78}
                  onPress={() => handleServicePress(service)}
                  style={{
                    width: '31.5%',
                    minHeight: 108,
                    marginBottom: 10,
                    backgroundColor: '#FCFCFA',
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: '#ECEDE8',
                    paddingHorizontal: 7,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',

                    shadowColor: '#032A24',
                    shadowOffset: {
                      width: 0,
                      height: 3,
                    },
                    shadowOpacity: 0.025,
                    shadowRadius: 7,
                    elevation: 1,
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 15,
                      backgroundColor: service.bgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 9,
                    }}
                  >
                    {service.icon}
                  </View>

                  {/* Label */}
                  <Text
                    numberOfLines={2}
                    style={{
                      color: '#263631',
                      fontSize: 11,
                      lineHeight: 15,
                      fontWeight: '600',
                      textAlign: 'center',
                      letterSpacing: -0.05,
                    }}
                  >
                    {service.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Brand Accent */}
            <View
              style={{
                height: 1,
                backgroundColor: '#EEF0EC',
                marginTop: 5,
                marginBottom: 13,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: '#C9A44B',
                  marginRight: 7,
                }}
              />

              <Text
                style={{
                  color: '#89928E',
                  fontSize: 10,
                  fontWeight: '500',
                  letterSpacing: 0.4,
                }}
              >
                ITQAAN · ONE TRUSTED PLATFORM
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServiceList;