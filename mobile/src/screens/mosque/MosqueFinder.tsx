import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Chase } from 'react-native-animated-spinkit';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ===== PROFESSIONAL SVG ICONS =====
const BackIcon = ({ color = '#032A24', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MosqueIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L3 9L5 9V19H19V9L21 9L12 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <Path d="M8 13H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M10 17H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="12" cy="11" r="1" fill={color} opacity="0.5"/>
  </Svg>
);

const LocationIcon = ({ color = '#C9A44B', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const SearchIcon = ({ color = '#FFFFFF', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#3FAF73', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CurrentLocationIcon = ({ color = '#C9A44B', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" fill={color} stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="2 2"/>
    <Path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const MosqueFinder = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Mosque Finder needs access to your location to find mosques near you.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const buildGoogleMapsUrl = (locationValue: string) => {
    const trimmedLocation = locationValue.trim();
    if (!trimmedLocation) {
      setError('Please enter your location or starting point');
      return null;
    }
    setError('');
    return `https://www.google.com/maps/search/mosque+near+${encodeURIComponent(trimmedLocation)}`;
  };

  const handleSearch = () => {
    const trimmedLocation = location.trim();

    if (!trimmedLocation) {
      setError('Please enter your location or starting point');
      return;
    }

    setIsLoading(true);
    setError('');

    const url = buildGoogleMapsUrl(location);
    if (url) {
      setTimeout(() => {
        Linking.openURL(url);
        setIsLoading(false);
      }, 300);
    } else {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setError('');

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied. Please enter your location manually to find mosques.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsLocating(false);
        // Open Google Maps with current location centered
        const url = `https://www.google.com/maps/@${latitude},${longitude},14z`;
        Linking.openURL(url);
      },
      (error) => {
        console.log('Geolocation error:', error);
        setIsLocating(false);
        // If GPS fails, still open Google Maps so user can type manually
        const url = 'https://www.google.com/maps';
        Linking.openURL(url);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Chase size={36} color="#C9A44B" />
          <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* ===== PREMIUM HEADER ===== */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.15)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{
              position: 'absolute',
              top: 0,
              left: 40,
              right: 40,
              height: 2,
              backgroundColor: '#C9A44B',
              opacity: 0.3,
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  padding: 6,
                  marginRight: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(201, 164, 75, 0.08)',
                }}
              >
                <BackIcon color="#C9A44B" size={22} />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MosqueIcon color="#C9A44B" size={18} />
                  <Text style={{
                    color: '#C9A44B',
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    Mosque Finder
                  </Text>
                </View>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 2,
                }}>
                  Find Mosques Near You
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  letterSpacing: 0.2,
                  marginTop: 1,
                }}>
                  Search · Navigate · Pray
                </Text>
              </View>

              <View style={{ width: 40 }} />
            </View>
          </View>

          {/* ===== SEARCH SECTION ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.06)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 12,
            elevation: 2,
          }}>
            {/* Error Display */}
            {error ? (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#DC2626', fontSize: 13, flex: 1 }}>{error}</Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                  onPress={() => setError('')}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Location Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
                Enter Location or Starting Point <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <View style={{
                  position: 'absolute',
                  left: 14,
                  top: 12,
                  zIndex: 1,
                }}>
                  <LocationIcon color="#9CA3AF" size={18} />
                </View>
                <TextInput
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.08)',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    paddingLeft: 46,
                    color: '#1F2937',
                    fontSize: 14,
                  }}
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Nairobi CBD, Mombasa, Parklands..."
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => setShowRecent(true)}
                  onBlur={() => setTimeout(() => setShowRecent(false), 300)}
                />
                {location ? (
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: 12 }}
                    onPress={() => setLocation('')}
                    activeOpacity={0.7}
                  >
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </Svg>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>
                <Text style={{ color: '#DC2626' }}>*</Text> Required — Enter your starting point to find nearby mosques
              </Text>
            </View>

            {/* Buttons Row */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Find Mosques Button */}
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: '#032A24',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: isLoading || !location.trim() ? 0.5 : 1,
                }}
                onPress={handleSearch}
                disabled={isLoading || !location.trim()}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <SearchIcon color="#FFFFFF" size={18} />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                  {isLoading ? 'Searching...' : 'Find Mosques'}
                </Text>
              </TouchableOpacity>

              {/* Current Location Button */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#032A24',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: isLocating ? 0.5 : 1,
                }}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
                activeOpacity={0.7}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#032A24" />
                ) : (
                  <CurrentLocationIcon color="#032A24" size={20} />
                )}
                <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }}>
                  {isLocating ? 'Locating...' : 'Current Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== FEATURE CARDS ===== */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 20,
          }}>
            {[
              {
                icon: <MosqueIcon color="#C9A44B" size={24} />,
                title: 'Nearby Mosques',
                description: 'Find mosques closest to your current location with accurate directions.',
                bgColor: '#FDFAF0',
                borderColor: 'rgba(201, 164, 75, 0.15)',
              },
              {
                icon: <CurrentLocationIcon color="#032A24" size={24} />,
                title: 'Get Directions',
                description: 'Get real-time navigation to any mosque using Google Maps integration.',
                bgColor: '#F5F8F5',
                borderColor: 'rgba(3, 42, 36, 0.08)',
              },
            ].map((card, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  minWidth: 140,
                  backgroundColor: card.bgColor,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: card.borderColor,
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.04)',
                }}>
                  {card.icon}
                </View>
                <Text style={{
                  color: '#032A24',
                  fontSize: 15,
                  fontWeight: '700',
                  letterSpacing: -0.2,
                  marginBottom: 4,
                }}>
                  {card.title}
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 12,
                  lineHeight: 18,
                }}>
                  {card.description}
                </Text>
              </View>
            ))}
          </View>

          {/* ===== INFO BANNER ===== */}
          <View style={{
            backgroundColor: 'rgba(201, 164, 75, 0.04)',
            borderRadius: 14,
            padding: 14,
            marginTop: 16,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.08)',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#6B7280" strokeWidth="1.5"/>
                <Path d="M12 8V12L14 14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                <Path d="M16 16L21 21" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
              </Svg>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Google Maps</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckIcon color="#3FAF73" size={14} />
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Accurate locations</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LocationIcon color="#6B7280" size={14} />
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Real-time directions</Text>
            </View>
          </View>

          {/* ===== STATS ===== */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 16,
          }}>
            {[
              { value: '1000+', label: 'Mosques', color: '#032A24' },
              { value: '47', label: 'Counties', color: '#C9A44B' },
              { value: '24/7', label: 'Available', color: '#032A24' },
              { value: 'Free', label: 'To Use', color: '#C9A44B' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(3, 42, 36, 0.04)',
                shadowColor: '#032A24',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}>
                <Text style={{ color: item.color, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                  {item.value}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ===== FOOTER ===== */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{
              color: 'rgba(201, 164, 75, 0.2)',
              fontSize: 9,
              letterSpacing: 1,
              fontWeight: '500',
            }}>
              Itqaan · Mosque Finder
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MosqueFinder;