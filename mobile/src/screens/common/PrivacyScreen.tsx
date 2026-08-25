import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PrivacyContent from '../../components/common/PrivacyContent';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PrivacyScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#032A24',
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(201, 164, 75, 0.2)',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
          }}
        >
          <Text style={{ color: '#C9A44B', fontSize: 16, fontWeight: '600' }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: '#F7F6F1',
            fontSize: 18,
            fontWeight: '700',
            flex: 1,
          }}
        >
          Privacy Policy
        </Text>
      </View>

      {/* Content with Loading State */}
      {loading ? (
        <LoadingSpinner fullScreen={false} message="Loading privacy policy..." />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            paddingBottom: 40,
          }}
        >
          <PrivacyContent />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PrivacyScreen;