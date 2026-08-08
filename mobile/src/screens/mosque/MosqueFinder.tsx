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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mosqueFinderService } from '../../api/client';

const MosqueFinder = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState('');
  const [mosqueOrCity, setMosqueOrCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [error, setError] = useState('');
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

  const handleUseCurrentLocation = () => {
    setIsLoading(true);
    setError('');

    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/search/mosque/@${latitude},${longitude},14z`;
        Linking.openURL(url);
        setIsLoading(false);
      },
      (error) => {
        console.log('Geolocation error:', error);
        setError('Unable to get your location. Please enter your location manually.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
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

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
          {/* Hero Section */}
          <View style={{
            backgroundColor: '#032A24',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -30, left: -30, width: 80, height: 80, backgroundColor: 'rgba(201, 164, 75, 0.05)', borderRadius: 999 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Mosque Finder
                  </Text>
                  <View style={{ width: 1, height: 14, backgroundColor: 'rgba(201, 164, 75, 0.3)' }} />
                  <Text style={{ color: 'rgba(201, 164, 75, 0.6)', fontSize: 12, fontWeight: '500' }}>Google Maps</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Find Mosques Near You</Text>
                <Text style={{ color: 'rgba(183, 192, 186, 0.7)', fontSize: 14, marginTop: 4, maxWidth: 400, lineHeight: 20 }}>
                  Enter your location to find mosques, masjids, and Islamic centers. Get directions instantly.
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(201, 164, 75, 0.2)',
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 12, fontWeight: '600' }}>Search & Navigate</Text>
              </View>
            </View>
          </View>

          {/* Search Section */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: '#E8EEF4',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            {error ? (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}>
                <Text style={{ color: '#DC2626', fontSize: 14 }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
                </View>
                <TouchableOpacity onPress={() => setError('')}>
                  <Text style={{ color: 'rgba(220, 38, 38, 0.6)', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                Current Location / Starting Point <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  ref={locationInputRef}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#E8EEF4',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    paddingLeft: 44,
                    color: '#1F2937',
                    fontSize: 15,
                  }}
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Nairobi CBD, Mombasa, Parklands..."
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                  onFocus={() => setShowRecent(true)}
                  onBlur={() => setTimeout(() => setShowRecent(false), 200)}
                />
                <View style={{ position: 'absolute', left: 14, top: '50%', transform: [{ translateY: -10 }] }}>
                  <Text style={{ fontSize: 18 }}>📍</Text>
                </View>
                {location ? (
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: '50%', transform: [{ translateY: -10 }] }}
                    onPress={() => setLocation('')}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                <Text style={{ color: '#DC2626' }}>*</Text> Required — Enter where you are starting from
              </Text>

              {/* Recent Searches */}
              {showRecent && recentSearches.length > 0 ? (
                <View style={{
                  position: 'absolute',
                  top: 70,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E8EEF4',
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  maxHeight: 180,
                }}>
                  <View style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F4F5F1',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <Text style={{ fontSize: 14 }}>🕐</Text>
                    <Text style={{ color: '#6B7280', fontSize: 11 }}>Recent Searches</Text>
                  </View>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderBottomWidth: index < recentSearches.length - 1 ? 1 : 0,
                        borderBottomColor: '#F4F5F1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onPress={() => loadRecentSearch(search)}
                    >
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                          {search.location}
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 11 }}>{search.mosque}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                Mosque or City <Text style={{ color: '#6B7280', fontWeight: '400', fontSize: 12 }}>(Optional)</Text>
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#E8EEF4',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    paddingLeft: 44,
                    color: '#1F2937',
                    fontSize: 15,
                  }}
                  value={mosqueOrCity}
                  onChangeText={(text) => {
                    setMosqueOrCity(text);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Jamia Mosque, or leave blank to browse all"
                  placeholderTextColor="rgba(107, 114, 128, 0.5)"
                />
                <View style={{ position: 'absolute', left: 14, top: '50%', transform: [{ translateY: -10 }] }}>
                  <Text style={{ fontSize: 18 }}>🕌</Text>
                </View>
                {mosqueOrCity ? (
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: '50%', transform: [{ translateY: -10 }] }}
                    onPress={() => setMosqueOrCity('')}
                  >
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                Leave blank to see <Text style={{ color: '#0B342B', fontWeight: '500' }}>all mosques</Text> near your location
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: 120,
                  backgroundColor: '#0B342B',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: isLoading || !location.trim() ? 0.5 : 1,
                  shadowColor: '#0B342B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleSearch}
                disabled={isLoading || !location.trim()}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Searching...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14 }}>🔍</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Find Mosques</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#0B342B',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  opacity: isLoading ? 0.5 : 1,
                  flexDirection: 'row',
                  gap: 8,
                }}
                onPress={handleUseCurrentLocation}
                disabled={isLoading}
              >
                <Text style={{ fontSize: 16 }}>📡</Text>
                <Text style={{ color: '#0B342B', fontSize: 14, fontWeight: '600' }}>Use My Location</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Banner */}
          <View style={{
            backgroundColor: 'rgba(11, 52, 43, 0.05)',
            borderRadius: 12,
            padding: 14,
            marginTop: 14,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.2)',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>🌐</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Google Maps</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#3FAF73', fontSize: 14 }}>✓</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Accurate locations</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>📍</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Real-time directions</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 14,
          }}>
            {[
              { value: '1000+', label: 'Mosques', color: '#0B342B' },
              { value: '47', label: 'Counties', color: '#C9A44B' },
              { value: '24/7', label: 'Available', color: '#0B342B' },
              { value: 'Free', label: 'To Use', color: '#C9A44B' },
            ].map((item, index) => (
              <View key={index} style={{
                flex: 1,
                minWidth: 60,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E8EEF4',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}>
                <Text style={{ color: item.color, fontSize: 18, fontWeight: '700' }}>{item.value}</Text>
                <Text style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MosqueFinder;