module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { worklets: false }],
      // nativewind/babel removed to avoid worklets
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};