// Mock UndoSnackbar for interaction testing (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View, TouchableOpacity, Text } = require('react-native');

module.exports = {
  UndoSnackbar: ({ visible, onUndo, message }) =>
    visible
      ? React.createElement(
          View,
          { testID: 'undo-snackbar' },
          React.createElement(Text, null, message || 'Đã vuốt'),
          React.createElement(TouchableOpacity, {
            testID: 'undo-button',
            onPress: onUndo,
          })
        )
      : null,
};
