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
import { Chase } from 'react-native-animated-spinkit';

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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Chase size={36} color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>
            Loading...
          </Text>
        </View>
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