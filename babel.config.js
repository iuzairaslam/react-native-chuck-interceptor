// babel.config.js
// Used when this package is consumed directly from source (local plugin / file: reference).
// The consuming React Native app's Metro bundler will transpile these files using
// metro-react-native-babel-preset, so this config is only needed for standalone runs
// (e.g. tests). It must align with what metro-react-native-babel-preset provides.

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
};
