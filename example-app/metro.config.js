const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const { resolve: metroResolve } = require('metro-resolver');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The library lives in the parent folder. Without forced resolution, Metro can
 * load `react` / `react-native` from the repo root as well as from this app,
 * which causes runtime errors (e.g. Modal / RCTModalHostView undefined).
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const appRoot = __dirname;
const libRoot = path.resolve(__dirname, '..');
const appNodeModules = path.resolve(__dirname, 'node_modules');

/** Packages that must resolve to a single copy (the example app's install). */
const FORCE_FROM_APP = new Set([
  'react',
  'react-native',
  'scheduler',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]);

const config = {
  watchFolders: [libRoot],
  resolver: {
    nodeModulesPaths: [
      appNodeModules,
      path.resolve(libRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@iuzairaslam/react-native-chuck-interceptor': libRoot,
    },
    resolveRequest(context, moduleName, platform) {
      if (FORCE_FROM_APP.has(moduleName)) {
        return {
          type: 'sourceFile',
          filePath: require.resolve(moduleName, { paths: [appNodeModules] }),
        };
      }
      return metroResolve(
        {
          ...context,
          resolveRequest: metroResolve,
        },
        moduleName,
        platform,
      );
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(appRoot), config);
