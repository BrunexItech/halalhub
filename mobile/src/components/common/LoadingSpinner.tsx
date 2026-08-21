import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  backgroundColor?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  fullScreen = true,
  backgroundColor = '#FAFAF7',
}) => {
  const content = (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Chase size={36} color="#C9A44B" />
      <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>{message}</Text>
    </View>
  );

  if (fullScreen) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
};

export default LoadingSpinner;