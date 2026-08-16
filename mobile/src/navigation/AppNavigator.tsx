import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import AuthScreen from '../screens/auth/AuthScreen';
import RegisterRole from '../screens/auth/RegisterRole';
import ClientRegister from '../screens/auth/ClientRegister';
import VendorRegister from '../screens/auth/VendorRegister';
import LeaderRegister from '../screens/auth/LeaderRegister';

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

// Profile & Common
import About from '../screens/profile/About';
import More from '../screens/profile/More';
import ChatBot from '../screens/common/ChatBot';
import LeaderPublicProfile from '../screens/common/LeaderPublicProfile';
import TermsScreen from '../screens/common/TermsScreen';
import PrivacyScreen from '../screens/common/PrivacyScreen';

// Support
import SupportScreen from '../screens/support/SupportScreen';

// Service List
import ServiceList from '../screens/services/ServiceList';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// Lazy load VideoCall to avoid WebRTC native module at startup
// ============================================================
const VideoCallScreen = (props: any) => {
  const VideoCall = require('../screens/common/VideoCall').default;
  return <VideoCall {...props} />;
};
// ============================================================

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Auth" component={AuthScreen} />
    <Stack.Screen name="RegisterRole" component={RegisterRole} />
    <Stack.Screen name="ClientRegister" component={ClientRegister} />
    <Stack.Screen name="VendorRegister" component={VendorRegister} />
    <Stack.Screen name="LeaderRegister" component={LeaderRegister} />
  </Stack.Navigator>
);

// SVG Icons for Bottom Tabs
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={focused ? '#C9A44B' : '#6B7280'} strokeWidth="1.5">
    <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </Svg>
);

const ServicesIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={focused ? '#C9A44B' : '#6B7280'} strokeWidth="1.5">
    <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </Svg>
);

const WalletIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={focused ? '#C9A44B' : '#6B7280'} strokeWidth="1.5">
    <Path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </Svg>
);

const MoreIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={focused ? '#C9A44B' : '#6B7280'} strokeWidth="1.5">
    <Path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </Svg>
);

const VendorIcon = ({ focused }: { focused: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={focused ? '#C9A44B' : '#6B7280'} strokeWidth="1.5">
    <Path d="M21 13.5a1.5 1.5 0 01-1.5 1.5h-6a1.5 1.5 0 01-1.5-1.5m-6-1.5l-2-1.5m10 1.5l-4-3m4 3l-3 1.5m-5-2.5h3m-3 0l2 2m0 0h4m-4 0l-4 3m8-3v-2m-4 3v-1.5m-4 3l2-2M20 6v1.5m0 0L18 9m2-1.5L20 12" />
  </Svg>
);

// ==================== DASHBOARD STACK ====================
const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={Dashboard} />
      <Stack.Screen name="Zakat" component={Zakat} />
      <Stack.Screen name="Sadaqa" component={Sadaqa} />
      <Stack.Screen name="Takaful" component={Takaful} />
      <Stack.Screen name="Pension" component={Pension} />
      <Stack.Screen name="LeaderDashboard" component={LeaderDashboard} />
      <Stack.Screen name="Hajj" component={Hajj} />
      <Stack.Screen name="Hearse" component={Hearse} />
      <Stack.Screen name="Wills" component={Wills} />
      <Stack.Screen name="Utilities" component={Utilities} />
      <Stack.Screen name="HalalStay" component={HalalStay} />
      <Stack.Screen name="MosqueFinder" component={MosqueFinder} />
      <Stack.Screen name="Kadhis" component={Kadhis} />
      <Stack.Screen name="KadhiDashboard" component={KadhiDashboard} />
      <Stack.Screen name="Ecommerce" component={Ecommerce} />
      <Stack.Screen name="Restaurants" component={Restaurants} />
      <Stack.Screen name="ChatBot" component={ChatBot} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="LeaderPublicProfile" component={LeaderPublicProfile} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
};

// ==================== VENDOR DASHBOARD STACK ====================
const VendorDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VendorDashboardMain" component={VendorDashboard} />
      <Stack.Screen name="Zakat" component={Zakat} />
      <Stack.Screen name="Sadaqa" component={Sadaqa} />
      <Stack.Screen name="Takaful" component={Takaful} />
      <Stack.Screen name="Pension" component={Pension} />
      <Stack.Screen name="Hajj" component={Hajj} />
      <Stack.Screen name="Hearse" component={Hearse} />
      <Stack.Screen name="Wills" component={Wills} />
      <Stack.Screen name="Utilities" component={Utilities} />
      <Stack.Screen name="HalalStay" component={HalalStay} />
      <Stack.Screen name="MosqueFinder" component={MosqueFinder} />
      <Stack.Screen name="Kadhis" component={Kadhis} />
      <Stack.Screen name="Ecommerce" component={Ecommerce} />
      <Stack.Screen name="Restaurants" component={Restaurants} />
      <Stack.Screen name="ChatBot" component={ChatBot} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="LeaderPublicProfile" component={LeaderPublicProfile} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="WalletMain" component={Wallet} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
};

// ==================== SERVICES STACK ====================
const ServicesStack = () => {
  const { user } = useAuth();
  const isLeader = user?.role === 'leader' || user?.role === 'imam' || user?.role === 'kadhi';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServiceListMain" component={ServiceList} />
      <Stack.Screen name="Zakat" component={Zakat} />
      <Stack.Screen name="Sadaqa" component={Sadaqa} />
      <Stack.Screen name="Takaful" component={Takaful} />
      <Stack.Screen name="Pension" component={isLeader ? LeaderDashboard : Pension} />
      <Stack.Screen name="Hajj" component={Hajj} />
      <Stack.Screen name="Hearse" component={Hearse} />
      <Stack.Screen name="Wills" component={Wills} />
      <Stack.Screen name="Utilities" component={Utilities} />
      <Stack.Screen name="HalalStay" component={HalalStay} />
      <Stack.Screen name="MosqueFinder" component={MosqueFinder} />
      <Stack.Screen name="Kadhis" component={isLeader ? KadhiDashboard : Kadhis} />
      <Stack.Screen name="KadhiDashboard" component={KadhiDashboard} />
      <Stack.Screen name="LeaderDashboard" component={LeaderDashboard} />
      <Stack.Screen name="Ecommerce" component={Ecommerce} />
      <Stack.Screen name="Restaurants" component={Restaurants} />
      <Stack.Screen name="ChatBot" component={ChatBot} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="LeaderPublicProfile" component={LeaderPublicProfile} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
};

// ==================== WALLET STACK ====================
const WalletStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={Wallet} />
      <Stack.Screen name="Zakat" component={Zakat} />
      <Stack.Screen name="Sadaqa" component={Sadaqa} />
      <Stack.Screen name="Takaful" component={Takaful} />
      <Stack.Screen name="Pension" component={Pension} />
      <Stack.Screen name="Hajj" component={Hajj} />
      <Stack.Screen name="Hearse" component={Hearse} />
      <Stack.Screen name="Wills" component={Wills} />
      <Stack.Screen name="Utilities" component={Utilities} />
      <Stack.Screen name="HalalStay" component={HalalStay} />
      <Stack.Screen name="MosqueFinder" component={MosqueFinder} />
      <Stack.Screen name="Kadhis" component={Kadhis} />
      <Stack.Screen name="Ecommerce" component={Ecommerce} />
      <Stack.Screen name="Restaurants" component={Restaurants} />
      <Stack.Screen name="ChatBot" component={ChatBot} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="LeaderPublicProfile" component={LeaderPublicProfile} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
};

// ==================== MORE STACK ====================
const MoreStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMain" component={More} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Zakat" component={Zakat} />
      <Stack.Screen name="Sadaqa" component={Sadaqa} />
      <Stack.Screen name="Takaful" component={Takaful} />
      <Stack.Screen name="Pension" component={Pension} />
      <Stack.Screen name="Hajj" component={Hajj} />
      <Stack.Screen name="Hearse" component={Hearse} />
      <Stack.Screen name="Wills" component={Wills} />
      <Stack.Screen name="Utilities" component={Utilities} />
      <Stack.Screen name="HalalStay" component={HalalStay} />
      <Stack.Screen name="MosqueFinder" component={MosqueFinder} />
      <Stack.Screen name="Kadhis" component={Kadhis} />
      <Stack.Screen name="Ecommerce" component={Ecommerce} />
      <Stack.Screen name="Restaurants" component={Restaurants} />
      <Stack.Screen name="ChatBot" component={ChatBot} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="LeaderPublicProfile" component={LeaderPublicProfile} />
      <Stack.Screen name="KadhiDashboard" component={KadhiDashboard} />
      <Stack.Screen name="LeaderDashboard" component={LeaderDashboard} />
    </Stack.Navigator>
  );
};

// ==================== MAIN TABS ====================
const MainTabs = () => {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#032A24',
          borderTopColor: 'rgba(201, 164, 75, 0.18)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#C9A44B',
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
        component={DashboardStack}
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesStack}
        options={{
          tabBarIcon: ({ focused }) => <ServicesIcon focused={focused} />,
          tabBarLabel: 'Services',
        }}
      />
      {isVendor ? (
        <Tab.Screen
          name="Vendor"
          component={VendorDashboardStack}
          options={{
            tabBarIcon: ({ focused }) => <VendorIcon focused={focused} />,
            tabBarLabel: 'Vendor',
          }}
        />
      ) : (
        <Tab.Screen
          name="Wallet"
          component={WalletStack}
          options={{
            tabBarIcon: ({ focused }) => <WalletIcon focused={focused} />,
            tabBarLabel: 'Wallet',
          }}
        />
      )}
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{
          tabBarIcon: ({ focused }) => <MoreIcon focused={focused} />,
          tabBarLabel: 'More',
        }}
      />
    </Tab.Navigator>
  );
};

// ==================== MAIN APP NAVIGATOR ====================
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#032A24', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#C9A44B" />
        <Text style={{ color: 'rgba(201, 164, 75, 0.7)', marginTop: 16, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
          Loading Itqaan
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;