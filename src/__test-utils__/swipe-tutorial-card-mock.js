// Mock SwipeTutorialCard for interaction testing (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View, TouchableOpacity, Text } = require('react-native');

module.exports = {
  SwipeTutorialCard: ({ onComplete }) =>
    React.createElement(
      View,
      { testID: 'swipe-tutorial-card' },
      React.createElement(
        TouchableOpacity,
        { testID: 'complete-tutorial', onPress: onComplete },
        React.createElement(Text, null, 'Complete')
      )
    ),
};
