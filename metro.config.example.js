/**
 * metro.config.example.js
 *
 * Copy this into your React Native app's metro.config.js (or merge with existing)
 * when using react-native-chuck-interceptor as a LOCAL plugin (file: reference).
 *
 * This tells Metro to:
 *   1. Watch the plugin folder for changes
 *   2. Resolve the plugin's peer deps from YOUR app's node_modules
 *      (prevents "two copies of React" errors)
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   // In your app's package.json:
 *   "dependencies": {
 *     "react-native-chuck-interceptor": "file:../react-native-chuck-interceptor"
 *   }
 *
 *   // Then run:  npm install  (or yarn)
 *   // Then copy + adapt this file as your metro.config.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Absolute path to the react-native-chuck-interceptor package folder
const chuckerRoot = path.resolve(__dirname, '../react-native-chuck-interceptor');

const config = {
  watchFolders: [
    chuckerRoot,
  ],

  resolver: {
    // Make sure the plugin resolves react & react-native from YOUR app,
    // not from inside the plugin's folder (prevents duplicate module issues).
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(chuckerRoot, 'node_modules'),
    ],
    // Ensure .ts and .tsx files are resolved
    sourceExts: ['tsx', 'ts', 'jsx', 'js', 'json'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
