// Jest mock for expo-image — external .js file for NativeWind v4 compatibility
const React = require('react');
const { View } = require('react-native');

const Image = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref, testID: props.testID || 'expo-image' })
);
Image.displayName = 'Image';
Image.prefetch = jest.fn().mockResolvedValue(true);
Image.clearDiskCache = jest.fn().mockResolvedValue(undefined);
Image.clearMemoryCache = jest.fn().mockResolvedValue(undefined);
Image.getCachePathAsync = jest.fn().mockResolvedValue(null);

module.exports = { Image };
