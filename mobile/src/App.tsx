import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';

console.log('>>> App loaded (no ErrorUtils)');

export default function App() {
  console.log('[src/App] rendering real App');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
      <StatusBar style="light" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaView>
  );
}