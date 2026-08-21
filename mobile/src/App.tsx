import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';

console.log('>>> App loaded (no ErrorUtils)');

// ============================================================
// AppContent Component — Uses InteractionManager for tracking
// ============================================================
const AppContent = () => {
  const { resetInactivityTimer } = useAuth();

  // Reset timer on any user interaction using native event
  useEffect(() => {
    const subscription = resetInactivityTimer;
    // Return cleanup
    return () => {};
  }, [resetInactivityTimer]);

  return (
    <View 
      style={{ flex: 1 }}
      // Use onStartShouldSetResponder instead of TouchableWithoutFeedback
      // This is more performant on real devices
      onStartShouldSetResponder={() => {
        resetInactivityTimer();
        return false;
      }}
    >
      <AppNavigator />
    </View>
  );
};

// ============================================================
// Main App Component
// ============================================================
export default function App() {
  console.log('[src/App] rendering real App');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#032A24' }}>
      <StatusBar style="light" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaView>
  );
}