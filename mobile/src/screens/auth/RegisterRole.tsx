import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const RegisterRole = () => {
  const navigation = useNavigation();

  // Professional SVG Icons
  const ClientIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5">
      <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </Svg>
  );

  const VendorIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5">
      <Path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </Svg>
  );

  const LeaderIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5">
      <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </Svg>
  );

  const roles = [
    {
      id: 'client',
      title: 'Client',
      description: 'Access halal products, services, and financial solutions',
      icon: <ClientIcon />,
      bgColor: '#0B342B',
    },
    {
      id: 'vendor',
      title: 'Vendor',
      description: 'Sell halal products and services to the community',
      icon: <VendorIcon />,
      bgColor: '#0B342B',
    },
    {
      id: 'leader',
      title: 'Religious Leader',
      description: 'Register as Imam, Scholar, Ustadh, or Kadhi',
      icon: <LeaderIcon />,
      bgColor: '#0B342B',
    },
  ];

  const handleSelectRole = (roleId: string) => {
    if (roleId === 'client') {
      navigation.navigate('ClientRegister' as never);
    } else if (roleId === 'vendor') {
      navigation.navigate('VendorRegister' as never);
    } else if (roleId === 'leader') {
      navigation.navigate('LeaderRegister' as never);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ maxWidth: 400, width: '100%', alignSelf: 'center' }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image 
              source={require("../../../assets/itqaan_logo.png")}
              style={{ height: 56, width: 180 }}
              resizeMode="contain"
            />
            <Text style={{ 
              color: 'rgba(201, 164, 75, 0.5)', 
              fontSize: 10, 
              letterSpacing: 2, 
              fontWeight: '500',
              marginTop: 4,
              textTransform: 'uppercase',
            }}>
              Sharia-Compliant Fintech
            </Text>
          </View>

          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: '#F7F6F1', 
              fontSize: 22, 
              fontWeight: '700',
              textAlign: 'center',
            }}>
              Choose Your Role
            </Text>
            <Text style={{ 
              color: '#6B7280', 
              fontSize: 13, 
              textAlign: 'center',
              marginTop: 4,
            }}>
              Select how you want to use Itqaan
            </Text>
          </View>

          {/* Role Cards */}
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={{
                backgroundColor: role.bgColor,
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.15)',
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => handleSelectRole(role.id)}
              activeOpacity={0.7}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(201, 164, 75, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                {role.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  color: '#F7F6F1', 
                  fontSize: 15, 
                  fontWeight: '700',
                }}>
                  {role.title}
                </Text>
                <Text style={{ 
                  color: '#6B7280', 
                  fontSize: 12,
                  marginTop: 1,
                }}>
                  {role.description}
                </Text>
              </View>
              <Text style={{ color: 'rgba(201, 164, 75, 0.4)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Back to Login */}
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Auth' as never)}>
              <Text style={{ color: '#6B7280', fontSize: 13 }}>
                Already have an account?{' '}
                <Text style={{ color: '#C9A44B', fontWeight: '600' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterRole;