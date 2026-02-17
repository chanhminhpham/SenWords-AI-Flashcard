// Mock PlacementSwipeCard for interaction testing (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View, TouchableOpacity, Text } = require('react-native');

module.exports = {
  PlacementSwipeCard: ({ word, onSwipe }) =>
    React.createElement(
      View,
      { testID: 'placement-swipe-card' },
      React.createElement(Text, null, word.word),
      React.createElement(TouchableOpacity, {
        testID: 'swipe-know',
        onPress: () => onSwipe(word.id, 'know'),
      }),
      React.createElement(TouchableOpacity, {
        testID: 'swipe-dont-know',
        onPress: () => onSwipe(word.id, 'dontKnow'),
      })
    ),
};
