import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const More = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    {
      id: 'about',
      label: 'About Itqaan',
      description: 'Learn more about Itqaan',
      route: 'About',
      icon: (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="#C9A44B"
            strokeWidth="1.6"
          />
          <Path
            d="M12 10V16"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M12 7.5H12.01"
            stroke="#C9A44B"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'support',
      label: 'Support',
      description: 'Get assistance when you need it',
      route: 'Support',
      icon: (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12V16"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M4 13V16C4 17.1046 4.89543 18 6 18H7V12H5C4.44772 12 4 12.4477 4 13Z"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
          <Path
            d="M20 13V16C20 17.1046 19.1046 18 18 18H17V12H19C19.5523 12 20 12.4477 20 13Z"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
          <Path
            d="M12 20H15"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      description: 'Read our terms and conditions',
      route: 'Terms',
      icon: (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4H20V20H4V4Z"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M8 8H16"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M8 12H14"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M8 16H12"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Path
            d="M16 12L18 14L22 10"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      description: 'Review our privacy practices',
      route: 'Privacy',
      icon: (
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L3 7L12 12L21 7L12 2Z"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M3 12L12 17L21 12"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M3 17L12 22L21 17"
            stroke="#C9A44B"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <Path
            d="M12 12V17"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
  ];

  const getInitial = () => {
    const name = user?.fullName?.trim();
    return name ? name.charAt(0).toUpperCase() : 'G';
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#FAFAF7',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 24,
          paddingBottom: 42,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
          }}
        >
          {/* Header */}
          <View
            style={{
              marginBottom: 22,
              paddingHorizontal: 2,
            }}
          >
            <Text
              style={{
                color: '#032A24',
                fontSize: 25,
                fontWeight: '700',
                letterSpacing: -0.4,
              }}
            >
              More
            </Text>

            <Text
              style={{
                color: '#52645E',
                fontSize: 13,
                lineHeight: 19,
                marginTop: 5,
              }}
            >
              Manage your account and access Itqaan services.
            </Text>
          </View>

          {/* Premium Profile Card */}
          <View
            style={{
              backgroundColor: '#032A24',
              borderRadius: 22,
              padding: 20,
              marginBottom: 22,
              borderWidth: 1,
              borderColor: '#134F40',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.16,
              shadowRadius: 18,
              elevation: 5,
              overflow: 'hidden',
            }}
          >
            {/* Decorative top line */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 24,
                right: 24,
                height: 2,
                backgroundColor: '#C9A44B',
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: '#0B342B',
                  borderWidth: 1,
                  borderColor: '#C9A44B',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 25,
                    fontWeight: '700',
                  }}
                >
                  {getInitial()}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: 15,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    letterSpacing: -0.2,
                  }}
                >
                  {user?.fullName || 'Guest'}
                </Text>

                {!!user?.email && (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: '#B9C8C2',
                      fontSize: 12,
                      marginTop: 5,
                    }}
                  >
                    {user.email}
                  </Text>
                )}

                {!!user?.phone && (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: '#B9C8C2',
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {user.phone}
                  </Text>
                )}
              </View>
            </View>

            {/* Profile Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.10)',
                marginVertical: 18,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={{
                    color: '#9FB1AA',
                    fontSize: 9,
                    fontWeight: '700',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  Account type
                </Text>

                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: '600',
                    marginTop: 4,
                  }}
                >
                  {user?.role || 'Client'}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(201,164,75,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(201,164,75,0.35)',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#C9A44B',
                    marginRight: 7,
                  }}
                />

                <Text
                  style={{
                    color: '#E1C16B',
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  Active
                </Text>
              </View>
            </View>
          </View>

          {/* Section Heading */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
              paddingHorizontal: 3,
            }}
          >
            <View
              style={{
                width: 3,
                height: 17,
                borderRadius: 2,
                backgroundColor: '#C9A44B',
                marginRight: 9,
              }}
            />

            <Text
              style={{
                color: '#032A24',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              Account & Support
            </Text>
          </View>

          {/* Menu */}
          <View
            style={{
              backgroundColor: '#0B342B',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#134F40',
              overflow: 'hidden',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 7 },
              shadowOpacity: 0.10,
              shadowRadius: 14,
              elevation: 3,
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.72}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 74,
                  paddingHorizontal: 16,
                  backgroundColor:
                    index % 2 === 0 ? '#0B342B' : '#0D392F',
                  borderBottomWidth:
                    index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.08)',
                }}
                onPress={() => {
                  navigation.navigate(item.route as never);
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    backgroundColor: '#134F40',
                    borderWidth: 1,
                    borderColor: 'rgba(201,164,75,0.24)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </View>

                {/* Text */}
                <View
                  style={{
                    flex: 1,
                    marginLeft: 13,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {item.label}
                  </Text>

                  <Text
                    style={{
                      color: '#AFC0B9',
                      fontSize: 11,
                      marginTop: 4,
                      lineHeight: 15,
                    }}
                  >
                    {item.description}
                  </Text>
                </View>

                {/* Arrow */}
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: 'rgba(201,164,75,0.10)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(201,164,75,0.15)',
                  }}
                >
                  <Svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <Path
                      d="M9 18L15 12L9 6"
                      stroke="#C9A44B"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            activeOpacity={0.72}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 57,
              backgroundColor: '#FFFDFC',
              borderRadius: 18,
              marginTop: 18,
              borderWidth: 1,
              borderColor: '#E5D6B1',
              shadowColor: '#032A24',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 1,
            }}
            onPress={handleLogout}
          >
            <Svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M17 16L21 12L17 8"
                stroke="#B44A43"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M21 12H9"
                stroke="#B44A43"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <Path
                d="M13 16V19C13 20.1046 12.1046 21 11 21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3H11C12.1046 3 13 3.89543 13 4V8"
                stroke="#B44A43"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </Svg>

            <Text
              style={{
                color: '#A9443E',
                fontSize: 14,
                fontWeight: '600',
                marginLeft: 9,
              }}
            >
              Sign out
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View
            style={{
              alignItems: 'center',
              marginTop: 28,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 1,
                  backgroundColor: '#C9A44B',
                  marginRight: 9,
                }}
              />

              <Text
                style={{
                  color: '#C9A44B',
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.8,
                }}
              >
                ITQAAN
              </Text>

              <View
                style={{
                  width: 24,
                  height: 1,
                  backgroundColor: '#C9A44B',
                  marginLeft: 9,
                }}
              />
            </View>

            <Text
              style={{
                color: '#7A8983',
                fontSize: 10,
                fontWeight: '500',
              }}
            >
              Itqaan v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default More;