// Shared Gesture Handler mock for tests (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View } = require('react-native');

// Fluent chainable gesture builder — every method returns the builder itself
function gestureBuilder() {
  const builder = {};
  ['onUpdate', 'onEnd', 'onStart', 'onFinalize', 'minDistance', 'enabled'].forEach(function (m) {
    builder[m] = function () {
      return builder;
    };
  });
  return builder;
}

module.exports = {
  Gesture: {
    Pan: gestureBuilder,
    Tap: gestureBuilder,
    Fling: gestureBuilder,
  },
  GestureDetector: ({ children }) =>
    React.createElement(View, { testID: 'gesture-detector' }, children),
  GestureHandlerRootView: ({ children, ...props }) =>
    React.createElement(View, { testID: 'gesture-root', ...props }, children),
};
