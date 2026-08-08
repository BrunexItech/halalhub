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
  const isLeader = user?.role === 'leader' || user?.role === 'imam' || user?.role === 'kadhi';

  const services = [
    {
      id: 'zakat',
      label: 'Zakat',
      color: '#C9A44B',
      bgColor: '#FDFAF0',
      route: 'Zakat',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5">
          <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          <Circle cx="12" cy="12" r="2" />
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
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3FAF73" strokeWidth="1.5">
          <Path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </Svg>
      ),
    },
    {
      id: 'takaful',
      label: 'Takaful',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'Takaful',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5">
          <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          <Path d="M8 12h8" />
        </Svg>
      ),
    },
    {
      id: 'hajj',
      label: 'Hajj & Umrah',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'Hajj',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </Svg>
      ),
    },
    {
      id: 'hearse',
      label: 'Funeral Services',
      color: '#6B7280',
      bgColor: '#F3F4F6',
      route: 'Hearse',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5">
          <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </Svg>
      ),
    },
    {
      id: 'wills',
      label: 'Digital Wills',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'Wills',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="1.5">
          <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <Path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </Svg>
      ),
    },
    {
      id: 'halalstay',
      label: 'HalalStay',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'HalalStay',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </Svg>
      ),
    },
    {
      id: 'market',
      label: 'Halal Market',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'Ecommerce',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </Svg>
      ),
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'Restaurants',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </Svg>
      ),
    },
    {
      id: 'mosque',
      label: 'Mosque Finder',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'MosqueFinder',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </Svg>
      ),
    },
    {
      id: 'kadhis',
      label: isLeader ? 'Consultations' : 'Dial a Scholar',
      color: '#0B342B',
      bgColor: 'rgba(11, 52, 43, 0.1)',
      route: 'Kadhis',
      icon: (
        <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </Svg>
      ),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: '700' }}>
              All Services
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
              Explore all the services Itqaan has to offer
            </Text>
          </View>

          {/* Services Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={{
                  width: '23%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}
                onPress={() => navigation.navigate(service.route as never)}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: service.bgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {service.icon}
                </View>
                <Text style={{
                  color: '#1F2937',
                  fontSize: 9,
                  fontWeight: '500',
                  textAlign: 'center',
                  marginTop: 6,
                }}>
                  {service.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServiceList;