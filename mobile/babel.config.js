module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { worklets: false }],
    ],
    plugins: [
      'react-native-reanimated/plugin',
      'module:react-native-dotenv',   // <-- ADD THIS LINE
    ],
  };
};