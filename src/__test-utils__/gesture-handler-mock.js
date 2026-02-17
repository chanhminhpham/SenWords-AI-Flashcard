// Shared Gesture Handler mock for tests (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View } = require('react-native');

module.exports = {
  Gesture: {
    Pan: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
  },
  GestureDetector: ({ children }) =>
    React.createElement(View, { testID: 'gesture-detector' }, children),
};
