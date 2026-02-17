// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude test files and __mocks__ from the production bundle
config.resolver.blockList = [/.*\.test\.[jt]sx?$/, /.*__mocks__\/.*/];

module.exports = withNativeWind(config, { input: './global.css' });
