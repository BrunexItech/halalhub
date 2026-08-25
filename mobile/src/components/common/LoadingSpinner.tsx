import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

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
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24,
      flex: 1,
    }}>
      {/* Premium Logo + Spinner */}
      <View style={{ 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Outer glow */}
        <View style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(201, 164, 75, 0.08)',
          shadowColor: '#C9A44B',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 30,
          elevation: 8,
        }} />
        
        {/* Animated SVG Spinner */}
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Svg width={64} height={64} viewBox="0 0 64 64">
            {/* Track circle - subtle */}
            <Circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(201, 164, 75, 0.12)"
              strokeWidth="3"
              fill="none"
            />
            
            {/* Animated spinner */}
            <Circle
              cx="32"
              cy="32"
              r="28"
              stroke="#C9A44B"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="45 140"
              strokeDashoffset="10"
            />
          </Svg>
        </Animated.View>

        {/* Center dot */}
        <View style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#C9A44B',
          opacity: 0.3,
        }} />
      </View>

      {/* Premium message */}
      <View style={{ marginTop: 28, alignItems: 'center' }}>
        <Text style={{ 
          color: '#032A24', 
          fontSize: 16, 
          fontWeight: '600',
          letterSpacing: 0.3,
          marginBottom: 4,
        }}>
          {message}
        </Text>
        <Text style={{ 
          color: 'rgba(3, 42, 36, 0.3)', 
          fontSize: 11, 
          fontWeight: '400',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          Itqaan · Islamic Finance
        </Text>
      </View>

      {/* Elegant dots */}
      <View style={{ 
        flexDirection: 'row', 
        gap: 6, 
        marginTop: 20,
        alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#C9A44B',
              opacity: 0.2 + (i * 0.15),
            }}
          />
        ))}
      </View>
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