import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => void;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  amount?: number;
  recipient?: string;
  transactionType?: string;
}

const PinModal: React.FC<PinModalProps> = ({
  visible,
  onClose,
  onVerify,
  loading = false,
  error = '',
  title = 'Enter Your PIN',
  subtitle = 'Enter your 4-digit transaction PIN to continue',
  amount,
  recipient,
  transactionType,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setPin(['', '', '', '']);
    }
  }, [visible]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.nativeEvent.key === 'Enter') {
      const pinString = pin.join('');
      if (pinString.length === 4) {
        onVerify(pinString);
      }
    }
  };

  const handleSubmit = () => {
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onVerify(pinString);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <TouchableWithoutFeedback>
            <View style={{
              backgroundColor: '#0B342B',
              borderRadius: 28,
              padding: 24,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.3)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 12,
            }}>
              {/* Logo */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Image
                  source={require('../../../assets/itqaan_logo.png')}
                  style={{ height: 48, width: 160 }}
                  resizeMode="contain"
                />
              </View>

              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Text style={{ fontSize: 28 }}>🔒</Text>
                </View>
                <Text style={{ color: '#F7F6F1', fontSize: 20, fontWeight: '700' }}>
                  {title}
                </Text>
                <Text style={{ color: '#B7C0BA', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                  {subtitle}
                </Text>
              </View>

              {/* Transaction Details */}
              {(amount || recipient || transactionType) && (
                <View style={{
                  backgroundColor: '#032A24',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.15)',
                }}>
                  {transactionType && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Type:</Text>
                      <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '500' }}>
                        {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                      </Text>
                    </View>
                  )}
                  {amount && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Amount:</Text>
                      <Text style={{ color: '#E1C16B', fontSize: 12, fontWeight: '700' }}>
                        KES {amount.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {recipient && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>To:</Text>
                      <Text style={{ color: '#F7F6F1', fontSize: 12, fontWeight: '500' }}>
                        {recipient}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* PIN Input */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => inputRefs.current[index] = el}
                    value={digit}
                    onChangeText={(text) => handleChange(index, text)}
                    onKeyPress={(e) => handleKeyDown(index, e)}
                    style={{
                      width: 52,
                      height: 56,
                      backgroundColor: '#032A24',
                      borderWidth: 1,
                      borderColor: digit ? '#C9A44B' : 'rgba(201, 164, 75, 0.3)',
                      borderRadius: 14,
                      textAlign: 'center',
                      color: '#F7F6F1',
                      fontSize: 22,
                      fontWeight: '700',
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    secureTextEntry
                  />
                ))}
              </View>

              {/* Error Message */}
              {error ? (
                <View style={{
                  backgroundColor: '#032A24',
                  borderWidth: 1,
                  borderColor: 'rgba(220, 38, 38, 0.3)',
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                }}>
                  <Text style={{ color: '#DC2626', fontSize: 12, textAlign: 'center' }}>{error}</Text>
                </View>
              ) : null}

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#032A24',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(201, 164, 75, 0.2)',
                  }}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={{ color: '#B7C0BA', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: '#C9A44B',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: (loading || pin.join('').length < 4) ? 0.6 : 1,
                  }}
                  onPress={handleSubmit}
                  disabled={loading || pin.join('').length < 4}
                >
                  {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#032A24" />
                      <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Verifying...</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#032A24', fontWeight: '700', fontSize: 14 }}>Verify PIN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PinModal;