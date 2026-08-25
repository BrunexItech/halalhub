export default {
  expo: {
    name: "Itqaan",
    slug: "itqaan",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/itqaan_icon.png",
    userInterfaceStyle: "light",
    plugins: [
      "expo-dev-client",
      "@livekit/react-native-expo-plugin",
      "@config-plugins/react-native-webrtc",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#FAFAF7",
          "image": "./assets/itqaan_logo.png",
          "imageWidth": 220
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.itqaan.app",
      infoPlist: {
        "NSLocationWhenInUseUsageDescription": "Itqaan needs your location to find mosques near you.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Itqaan needs your location to find mosques near you."
      }
    },
    android: {
      package: "com.itqaan.app",
      adaptiveIcon: {
        foregroundImage: "./assets/itqaan_icon.png",
        backgroundColor: "#032A24"
      },
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "MODIFY_AUDIO_SETTINGS",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_CAMERA",
        "FOREGROUND_SERVICE_MICROPHONE",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      API_BASE: "https://itqaan.co.ke/api",
      IMAGE_BASE: "https://itqaan.co.ke",
      LOCATION_API_KEY: "keyPub1569gsvndc123kg9sjhg",
      eas: {
        projectId: "1f9c61c7-5736-4224-bc40-b848a8285ea0"
      }
    },
    owner: "itqaans-team"
  }
};