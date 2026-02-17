/**
 * Mock for @expo/vector-icons used in tab layout tests.
 * Extracted to .js to avoid NativeWind CSS interop babel transform.
 */
const React = require('react');
const RN = require('react-native');

module.exports = {
  MaterialCommunityIcons: function MockIcon({ name }) {
    return React.createElement(RN.View, { testID: 'icon-' + name });
  },
};
