import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const More = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    {
      id: 'about',
      label: 'About Itqaan',
      icon: (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </Svg>
      ),
      route: 'About',
    },
    {
      id: 'kyc',
      label: 'KYC Status',
      icon: (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </Svg>
      ),
      route: 'KYCStatus',
    },
    {
      id: 'support',
      label: 'Support',
      icon: (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B342B" strokeWidth="1.5">
          <Path d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072 0m0 0L5.636 15.536m0-7.072a5 5 0 017.072 0m0 0L9.879 9.879" />
        </Svg>
      ),
      route: 'ChatBot',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          {/* Profile Header */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#0B342B',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '700' }}>
                  {user?.fullName?.charAt(0) || 'G'}
                </Text>
              </View>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700', marginTop: 10 }}>
                {user?.fullName || 'Guest'}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>
                {user?.email || ''}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>
                {user?.phone || ''}
              </Text>
              <View style={{
                marginTop: 8,
                backgroundColor: '#D1FAE5',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 999,
              }}>
                <Text style={{ color: '#3FAF73', fontSize: 12, fontWeight: '500' }}>
                  {user?.role || 'Client'}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 8,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: '#F4F5F1',
                }}
                onPress={() => {
                  if (item.route === 'KYCStatus') {
                    // KYC Status placeholder
                  } else {
                    navigation.navigate(item.route as never);
                  }
                }}
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'rgba(11, 52, 43, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {item.icon}
                </View>
                <Text style={{
                  flex: 1,
                  color: '#1F2937',
                  fontSize: 15,
                  fontWeight: '500',
                  marginLeft: 12,
                }}>
                  {item.label}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 14,
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#FEE2E2',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
            onPress={handleLogout}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5">
              <Path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </Svg>
            <Text style={{ color: '#DC2626', fontSize: 15, fontWeight: '600', marginLeft: 10 }}>
              Logout
            </Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={{
            color: '#6B7280',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 20,
          }}>
            Itqaan v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default More;