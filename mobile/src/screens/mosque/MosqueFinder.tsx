import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  Dimensions,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mosqueFinderService } from '../../api/client';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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

const LocationIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.5"/>
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const SearchIcon = ({ color = '#6B7280', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ClockIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 6V12L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CloseIcon = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ color = '#3FAF73', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const NavIcon = ({ color = '#6B7280', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Path d="M12 8V12L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M16 16L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const MosqueFinder = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState('');
  const [mosqueOrCity, setMosqueOrCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const locationInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Load recent searches from AsyncStorage would go here
    // For now, using mock data
    setRecentSearches([
      { location: 'Nairobi CBD', mosque: 'Jamia Mosque' },
      { location: 'Mombasa', mosque: 'All Mosques' },
    ]);
  }, []);

  const saveRecentSearch = (locationVal: string, mosqueVal: string) => {
    const search = {
      location: locationVal,
      mosque: mosqueVal || 'All Mosques',
      timestamp: Date.now(),
    };
    const updated = [
      search,
      ...recentSearches.filter(
        (s) => s.location !== locationVal || s.mosque !== mosqueVal
      ),
    ].slice(0, 5);
    setRecentSearches(updated);
  };

  const buildGoogleMapsUrl = (locationVal: string, mosqueVal: string) => {
    const trimmedLocation = locationVal.trim();
    const trimmedMosque = mosqueVal.trim();

    if (!trimmedLocation) {
      setError('Please enter your location or starting point');
      return null;
    }

    setError('');

    if (trimmedLocation && trimmedMosque) {
      return `https://www.google.com/maps/search/${encodeURIComponent(trimmedMosque)}+near+${encodeURIComponent(trimmedLocation)}`;
    }

    if (trimmedLocation && !trimmedMosque) {
      return `https://www.google.com/maps/search/mosque+near+${encodeURIComponent(trimmedLocation)}`;
    }

    return 'https://www.google.com/maps/search/mosque';
  };

  const handleSearch = () => {
    const trimmedLocation = location.trim();

    if (!trimmedLocation) {
      setError('Please enter your location or starting point');
      locationInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError('');

    const url = buildGoogleMapsUrl(location, mosqueOrCity);

    if (url) {
      saveRecentSearch(trimmedLocation, mosqueOrCity.trim());
      setTimeout(() => {
        Linking.openURL(url);
        setIsLoading(false);
      }, 300);
    } else {
      setIsLoading(false);
    }
  };

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

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setError('');

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission denied. Please enter your location manually.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Get address from coordinates using reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
          .then(response => response.json())
          .then(data => {
            const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(address);
            setIsLocating(false);
            // Auto search after getting location
            setTimeout(() => {
              const url = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},14z`;
              Linking.openURL(url);
            }, 300);
          })
          .catch(() => {
            // Fallback: use coordinates directly
            const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(coords);
            setIsLocating(false);
            setTimeout(() => {
              const url = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},14z`;
              Linking.openURL(url);
            }, 300);
          });
      },
      (error) => {
        console.log('Geolocation error:', error);
        setError('Unable to get your location. Please enter your location manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleKeyPress = () => {
    handleSearch();
  };

  const loadRecentSearch = (search: any) => {
    setLocation(search.location);
    if (search.mosque !== 'All Mosques') {
      setMosqueOrCity(search.mosque);
    } else {
      setMosqueOrCity('');
    }
    setShowRecent(false);
    setTimeout(handleSearch, 100);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <ActivityIndicator size="large" color="#032A24" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>Searching for mosques...</Text>
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

              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(201, 164, 75, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.1)',
              }}>
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#C9A44B',
                  opacity: 0.5,
                }} />
              </View>
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
                Current Location / Starting Point <Text style={{ color: '#DC2626' }}>*</Text>
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
                  ref={locationInputRef}
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
                    <CloseIcon color="#9CA3AF" size={18} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>
                <Text style={{ color: '#DC2626' }}>*</Text> Required — Enter your starting point
              </Text>

              {/* Recent Searches Dropdown */}
              {showRecent && recentSearches.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 76,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(3, 42, 36, 0.06)',
                  borderRadius: 12,
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 6,
                  maxHeight: 180,
                }}>
                  <View style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(3, 42, 36, 0.04)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <ClockIcon color="#6B7280" size={14} />
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '500' }}>Recent Searches</Text>
                  </View>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderBottomWidth: index < recentSearches.length - 1 ? 1 : 0,
                        borderBottomColor: 'rgba(3, 42, 36, 0.03)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                      onPress={() => loadRecentSearch(search)}
                      activeOpacity={0.7}
                    >
                      <LocationIcon color="#6B7280" size={14} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                          {search.location}
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 11 }}>{search.mosque}</Text>
                      </View>
                      <NavIcon color="#6B7280" size={14} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Mosque/City Input */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
                Mosque or City <Text style={{ color: '#9CA3AF', fontWeight: '400' }}>(Optional)</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <View style={{
                  position: 'absolute',
                  left: 14,
                  top: 12,
                  zIndex: 1,
                }}>
                  <MosqueIcon color="#9CA3AF" size={18} />
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
                  value={mosqueOrCity}
                  onChangeText={(text) => {
                    setMosqueOrCity(text);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Jamia Mosque, or leave blank"
                  placeholderTextColor="#9CA3AF"
                />
                {mosqueOrCity ? (
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: 12 }}
                    onPress={() => setMosqueOrCity('')}
                    activeOpacity={0.7}
                  >
                    <CloseIcon color="#9CA3AF" size={18} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 4 }}>
                Leave blank to see <Text style={{ color: '#032A24', fontWeight: '500' }}>all mosques</Text> near your location
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: 120,
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
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Searching...</Text>
                  </>
                ) : (
                  <>
                    <SearchIcon color="#FFFFFF" size={18} />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Find Mosques</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#032A24',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 10,
                  opacity: isLocating ? 0.5 : 1,
                }}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
                activeOpacity={0.7}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#032A24" />
                ) : (
                  <LocationIcon color="#032A24" size={18} />
                )}
                <Text style={{ color: '#032A24', fontSize: 14, fontWeight: '600' }}>
                  {isLocating ? 'Locating...' : 'Use My Location'}
                </Text>
              </TouchableOpacity>
            </View>
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
              <NavIcon color="#6B7280" size={14} />
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