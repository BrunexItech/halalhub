import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#FAFAF7',
              marginTop: Platform.OS === 'ios' ? 40 : 20,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View
              style={{
                backgroundColor: '#032A24',
                paddingHorizontal: 20,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(201, 164, 75, 0.2)',
              }}
            >
              <Text style={{ color: '#C9A44B', fontSize: 16, fontWeight: '700' }}>
                {title}
              </Text>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#0B342B',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.2)',
                }}
              >
                <Text style={{ color: '#C9A44B', fontSize: 18, fontWeight: '600' }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content with Loading State */}
            {loading ? (
              <LoadingSpinner fullScreen={false} message="Loading content..." />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingVertical: 24,
                  paddingBottom: 40,
                }}
              >
                {children}
              </ScrollView>
            )}

            {/* Footer */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: 'rgba(201, 164, 75, 0.15)',
                backgroundColor: '#FAFAF7',
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: '#C9A44B',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '700' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default LegalModal;