/**
 * Mock for react-native-paper Snackbar used in tab layout tests.
 * Extracted to .js to avoid NativeWind CSS interop babel transform.
 */
const React = require('react');
const RN = require('react-native');

module.exports = {
  Snackbar: function MockSnackbar({ visible, children }) {
    if (!visible) return null;
    return React.createElement(
      RN.View,
      { testID: 'snackbar' },
      React.createElement(RN.Text, null, children)
    );
  },
  useTheme: function () {
    return {};
  },
};
