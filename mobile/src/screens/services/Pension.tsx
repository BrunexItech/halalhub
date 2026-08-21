import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { pensionService } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

const Pension = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalLeaders: 0,
    totalSupporters: 0,
    totalContributions: 0,
    pendingContributions: 0,
    typeBreakdown: {},
  });
  const [leaders, setLeaders] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderTypes, setLeaderTypes] = useState<string[]>([]);

  const LEADER_TYPE_LABELS: Record<string, string> = {
    islamic_scholar: 'Islamic Scholar',
    imam: 'Imam',
    adhan_caller: 'Adhan Caller',
    ustadh: 'Ustadh',
    ustadha: 'Ustadha',
    kadhi: 'Kadhi',
  };

  // ===== PREMIUM SVG ICONS =====
  const SearchIcon = () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" />
      <Path d="M21 21l-4.35-4.35" />
    </Svg>
  );

  const UsersIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 00-3-3.87" />
      <Path d="M16 3.13a4 4 0 010 7.75" />
    </Svg>
  );

  const HeartIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </Svg>
  );

  const AwardIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="6" />
      <Path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </Svg>
  );

  const LocationIcon = () => (
    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );

  const UsersSmallIcon = () => (
    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 00-3-3.87" />
      <Path d="M16 3.13a4 4 0 010 7.75" />
    </Svg>
  );

  const BackIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );

  const VerifiedIcon = () => (
    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3FAF73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <Path d="M22 4L12 14.01l-3-3" />
    </Svg>
  );

  const ShieldIcon = () => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A44B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Path d="M9 12l2 2 4-4" />
    </Svg>
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, leadersRes] = await Promise.all([
        pensionService.getStats(),
        pensionService.getLeaders({ limit: 100 }),
      ]);

      setStats(statsRes.data.stats || {
        totalLeaders: 0,
        totalSupporters: 0,
        totalContributions: 0,
        pendingContributions: 0,
        typeBreakdown: {},
      });
      setLeaders(leadersRes.data.leaders || []);

      const types = Object.keys(statsRes.data.stats?.typeBreakdown || {});
      setLeaderTypes(types);
    } catch (err) {
      console.log('Error fetching pension data:', err);
      setError('Unable to load pension data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getLeaderTypeLabel = (type: string) => {
    return LEADER_TYPE_LABELS[type] || type;
  };

  const getInitials = (name: string) => {
    if (!name) return 'LD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredLeaders = leaders.filter((leader) => {
    const matchesType = filterType === 'all' || leader.leader_type === filterType;
    const matchesSearch =
      leader.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getLeaderTypeLabel(leader.leader_type).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

 if (loading) {
  return <LoadingSpinner message="Loading pension program..." />;
}

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF7' }}>
      <StatusBar barStyle="light-content" backgroundColor="#032A24" translucent={false} />
      
      {/* ===== SOPHISTICATED HEADER ===== */}
      <View style={{
        backgroundColor: '#032A24',
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 20,
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          maxWidth: 600, 
          width: '100%', 
          alignSelf: 'center',
        }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{ padding: 4, marginRight: 12 }}
          >
            <BackIcon />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }}>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 17, 
              fontWeight: '600',
              letterSpacing: -0.3,
            }}>
              Pension Program
            </Text>
            <Text style={{ 
              color: 'rgba(255,255,255,0.5)', 
              fontSize: 10, 
              fontWeight: '400',
              letterSpacing: 0.2,
              marginTop: 1,
            }}>
              Supporting religious leaders
            </Text>
          </View>
          
          <View style={{
            backgroundColor: 'rgba(201, 164, 75, 0.08)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.1)',
          }}>
            <Text style={{ color: '#C9A44B', fontSize: 7, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Sharia-Compliant
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ 
          paddingTop: 0, 
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A44B" />}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center', paddingHorizontal: 20 }}>
          
          {/* Error State */}
          {error ? (
            <View style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 12,
              padding: 14,
              marginTop: 20,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#DC2626', fontSize: 12, flex: 1, fontWeight: '400' }}>{error}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 }}
                onPress={fetchData}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ===== PREMIUM HERO SECTION ===== */}
          <View style={{
            backgroundColor: '#0B342B',
            borderRadius: 16,
            padding: 24,
            marginTop: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(201, 164, 75, 0.08)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 24,
            elevation: 6,
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: -60, right: -60, width: 140, height: 140, backgroundColor: 'rgba(201, 164, 75, 0.03)', borderRadius: 999 }} />
            <View style={{ position: 'absolute', bottom: -80, left: -80, width: 180, height: 180, backgroundColor: 'rgba(201, 164, 75, 0.02)', borderRadius: 999 }} />

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(201, 164, 75, 0.08)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(201, 164, 75, 0.1)',
              marginBottom: 14,
              gap: 6,
            }}>
              <ShieldIcon />
              <Text style={{ color: '#C9A44B', fontSize: 8, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Community Welfare
              </Text>
            </View>

            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 22, 
              fontWeight: '700',
              letterSpacing: -0.5,
              marginBottom: 2,
            }}>
              Support Religious Leaders
            </Text>
            <Text style={{ 
              color: '#C9A44B', 
              fontSize: 15, 
              fontWeight: '500',
              marginBottom: 8,
              letterSpacing: -0.2,
            }}>
              Secure Their Future
            </Text>
            <Text style={{ 
              color: 'rgba(183, 192, 186, 0.7)', 
              fontSize: 13, 
              fontWeight: '400',
              lineHeight: 22,
            }}>
              Contribute to the long-term welfare of Islamic Scholars, Imams, 
              Adhan Callers, and more through a community-powered retirement program.
            </Text>
          </View>

          {/* ===== ELEGANT STATS ===== */}
          <View style={{ 
            flexDirection: 'row', 
            gap: 10, 
            marginBottom: 24,
          }}>
            <View style={{ 
              flex: 1, 
              backgroundColor: '#FFFFFF', 
              borderRadius: 12, 
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.04)',
              alignItems: 'center',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(201, 164, 75, 0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <UsersIcon />
              </View>
              <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>{stats.totalLeaders}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '500' }}>Leaders</Text>
            </View>

            <View style={{ 
              flex: 1, 
              backgroundColor: '#FFFFFF', 
              borderRadius: 12, 
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.04)',
              alignItems: 'center',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(201, 164, 75, 0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <HeartIcon />
              </View>
              <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>{stats.totalSupporters}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '500' }}>Supporters</Text>
            </View>

            <View style={{ 
              flex: 1, 
              backgroundColor: '#FFFFFF', 
              borderRadius: 12, 
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.04)',
              alignItems: 'center',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(201, 164, 75, 0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}>
                <AwardIcon />
              </View>
              <Text style={{ color: '#032A24', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                {Object.keys(stats.typeBreakdown || {}).length}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '500' }}>Types</Text>
            </View>
          </View>

          {/* ===== LEADER TYPES PILLS ===== */}
          {stats.typeBreakdown && Object.keys(stats.typeBreakdown).length > 0 && (
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              gap: 6, 
              marginBottom: 20,
            }}>
              {Object.entries(stats.typeBreakdown).map(([type, count]) => (
                <View key={type} style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(201, 164, 75, 0.08)',
                  shadowColor: '#032A24',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.02,
                  shadowRadius: 4,
                  elevation: 1,
                }}>
                  <Text style={{ color: '#032A24', fontSize: 10, fontWeight: '500' }}>
                    {getLeaderTypeLabel(type)} <Text style={{ color: '#9CA3AF', fontWeight: '400' }}>• {String(count)}</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ===== REFINED LEADERS LIST ===== */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(3, 42, 36, 0.04)',
            shadowColor: '#032A24',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 12,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ 
                color: '#032A24', 
                fontSize: 15, 
                fontWeight: '600',
                letterSpacing: -0.2,
              }}>
                Religious Leaders
              </Text>
              <View style={{
                backgroundColor: 'rgba(201, 164, 75, 0.06)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 12,
              }}>
                <Text style={{ color: '#C9A44B', fontSize: 10, fontWeight: '500' }}>
                  {filteredLeaders.length} found
                </Text>
              </View>
            </View>

            {/* Minimal Search */}
            <View style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FAFAF7',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 0,
              borderWidth: 1,
              borderColor: 'rgba(3, 42, 36, 0.04)',
              marginBottom: 16,
            }}>
              <SearchIcon />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  color: '#032A24',
                  fontSize: 13,
                  fontWeight: '400',
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search leaders..."
                placeholderTextColor="rgba(107, 114, 128, 0.3)"
              />
            </View>

            {/* Leaders List */}
            {filteredLeaders.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '400' }}>No leaders found</Text>
                <Text style={{ color: '#D1D5DB', fontSize: 11, fontWeight: '300', marginTop: 4 }}>Try adjusting your search</Text>
              </View>
            ) : (
              filteredLeaders.map((leader) => (
                <TouchableOpacity
                  key={leader.id}
                  style={{
                    backgroundColor: '#FAFAF7',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(3, 42, 36, 0.03)',
                  }}
                  onPress={() => navigation.navigate('LeaderPublicProfile' as never, { id: leader.share_link || leader.id })}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {leader.profile_image ? (
                      <Image
                        source={{ uri: leader.profile_image }}
                        style={{ width: 44, height: 44, borderRadius: 10 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: '#032A24',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                          {getInitials(leader.name)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ color: '#032A24', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                          {leader.name}
                        </Text>
                        {leader.is_verified && (
                          <View style={{
                            backgroundColor: 'rgba(63, 175, 115, 0.06)',
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                          }}>
                            <VerifiedIcon />
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '400' }}>
                        {getLeaderTypeLabel(leader.leader_type)}
                      </Text>
                    </View>

                    <View style={{
                      backgroundColor: 'rgba(201, 164, 75, 0.06)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(201, 164, 75, 0.08)',
                    }}>
                      <Text style={{ color: '#C9A44B', fontSize: 9, fontWeight: '500' }}>View</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 14, 
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(3, 42, 36, 0.03)',
                  }}>
                    {leader.location && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <LocationIcon />
                        <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '400' }} numberOfLines={1}>
                          {leader.location}
                        </Text>
                      </View>
                    )}
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <UsersSmallIcon />
                      <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '400' }}>
                        {leader.total_supporters || 0} supporters
                      </Text>
                    </View>
                  </View>

                  {leader.mosque_name && (
                    <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '300', marginTop: 4 }}>
                      {leader.mosque_name}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ===== MINIMAL FOOTER ===== */}
          <View style={{ 
            marginTop: 28,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: 'rgba(3, 42, 36, 0.04)',
            alignItems: 'center',
          }}>
            <Text style={{ 
              color: '#9CA3AF', 
              fontSize: 9, 
              fontWeight: '400',
              letterSpacing: 0.3,
            }}>
              Itqaan · Sharia-Compliant Pension Program
            </Text>
            <Text style={{ 
              color: '#D1D5DB', 
              fontSize: 8, 
              fontWeight: '300',
              marginTop: 3,
            }}>
              Supporting religious leaders for a better community
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Pension;