// Shared React Native Paper mock for tests (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { Text, View, TouchableOpacity } = require('react-native');

module.exports = {
  Text: Text,
  Button: ({ children, onPress, testID }) =>
    React.createElement(TouchableOpacity, { testID, onPress }, children),
  Card: ({ children, testID, onPress }) =>
    React.createElement(TouchableOpacity, { testID, onPress }, children),
  Snackbar: ({ visible, children, action, testID }) =>
    visible
      ? React.createElement(
          View,
          { testID },
          React.createElement(Text, null, children),
          React.createElement(
            TouchableOpacity,
            { testID: 'undo-action', onPress: action?.onPress },
            React.createElement(Text, null, action?.label)
          )
        )
      : null,
  IconButton: ({ testID, onPress, icon }) =>
    React.createElement(
      TouchableOpacity,
      { testID, onPress },
      React.createElement(Text, null, icon)
    ),
  RadioButton: ({ value, status, testID }) =>
    React.createElement(View, { testID, accessibilityValue: { text: `${value}-${status}` } }),
  useTheme: () => ({
    colors: { primary: '#000', surface: '#fff', onSurface: '#000' },
  }),
  PaperProvider: ({ children }) =>
    React.createElement(View, { testID: 'paper-provider' }, children),
};
