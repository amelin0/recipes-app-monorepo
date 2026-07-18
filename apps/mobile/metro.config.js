const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo (shared packages)
config.watchFolders = [monorepoRoot];

// Resolve node_modules from root (hoisted)
config.resolver.nodeModulesPaths = [path.resolve(monorepoRoot, 'node_modules')];

// Import .svg files as React components
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
