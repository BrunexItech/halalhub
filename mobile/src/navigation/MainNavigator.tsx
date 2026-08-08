import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Dashboard Screens
import Dashboard from '../screens/dashboard/Dashboard';
import VendorDashboard from '../screens/dashboard/VendorDashboard';
import LeaderDashboard from '../screens/dashboard/LeaderDashboard';
import KadhiDashboard from '../screens/dashboard/KadhiDashboard';
import HearseProviderDashboard from '../screens/dashboard/HearseProviderDashboard';

// Wallet
import Wallet from '../screens/wallet/Wallet';

// Services
import Zakat from '../screens/services/Zakat';
import Sadaqa from '../screens/services/Sadaqa';
import Takaful from '../screens/services/Takaful';
import Pension from '../screens/services/Pension';
import Hajj from '../screens/services/Hajj';
import Hearse from '../screens/services/Hearse';
import Wills from '../screens/services/Wills';
import Utilities from '../screens/services/Utilities';
import HalalStay from '../screens/services/HalalStay';

// Mosque
import MosqueFinder from '../screens/mosque/MosqueFinder';
import Kadhis from '../screens/mosque/Kadhis';

// Marketplace
import Ecommerce from '../screens/marketplace/Ecommerce';
import Restaurants from '../screens/marketplace/Restaurants';

// Profile
import KYCStatus from '../screens/profile/KYCStatus';
import About from '../screens/profile/About';

// Common
import LeaderPublicProfile from '../screens/common/LeaderPublicProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Service Stack Navigator
const ServiceStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="ServiceList" component={Zakat} />
    <Stack.Screen name="ZakatDetail" component={Zakat} />
    <Stack.Screen name="SadaqaDetail" component={Sadaqa} />
    <Stack.Screen name="TakafulDetail" component={Takaful} />
    <Stack.Screen name="PensionDetail" component={Pension} />
    <Stack.Screen name="HajjDetail" component={Hajj} />
    <Stack.Screen name="HearseDetail" component={Hearse} />
    <Stack.Screen name="WillsDetail" component={Wills} />
    <Stack.Screen name="UtilitiesDetail" component={Utilities} />
    <Stack.Screen name="HalalStayDetail" component={HalalStay} />
    <Stack.Screen name="MosqueFinderDetail" component={MosqueFinder} />
    <Stack.Screen name="KadhisDetail" component={Kadhis} />
    <Stack.Screen name="EcommerceDetail" component={Ecommerce} />
    <Stack.Screen name="RestaurantsDetail" component={Restaurants} />
  </Stack.Navigator>
);

// Profile Stack Navigator
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="ProfileMain" component={KYCStatus} />
    <Stack.Screen name="AboutDetail" component={About} />
    <Stack.Screen name="LeaderPublicProfile" component={LeaderPublicProfile} />
  </Stack.Navigator>
);

const TabIcon = ({ focused, icon, label }: { focused: boolean; icon: string; label: string }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[
      styles.tabIcon,
      { color: focused ? '#E1C16B' : '#6B7280' }
    ]}>
      {icon}
    </Text>
    <Text style={[
      styles.tabLabel,
      { color: focused ? '#E1C16B' : '#6B7280' }
    ]}>
      {label}
    </Text>
  </View>
);

const MainNavigator = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    if (user?.role === 'vendor') {
      const vendorType = user?.vendorType;
      if (vendorType === 'hearse') {
        return HearseProviderDashboard;
      }
      return VendorDashboard;
    }
    if (user?.role === 'leader' || user?.role === 'imam') {
      return LeaderDashboard;
    }
    if (user?.role === 'kadhi') {
      return KadhiDashboard;
    }
    return Dashboard;
  };

  const DashboardComponent = getDashboardComponent();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#032A24',
          borderTopColor: 'rgba(201, 164, 75, 0.15)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#E1C16B',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.3,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardComponent}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📊" label="Home" />
          ),
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={Wallet}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💰" label="Wallet" />
          ),
        }}
      />

      <Tab.Screen
        name="Services"
        component={ServiceStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🕌" label="Services" />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    fontWeight: '400',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});

export default MainNavigator;
