
const { getDefaultConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Ensure Metro treats .epub as an asset so it's bundled in the app
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.concat(['epub']);

module.exports = wrapWithReanimatedMetroConfig(defaultConfig);
