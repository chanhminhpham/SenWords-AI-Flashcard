/**
 * Mock for BaseSwipeCard used in screen tests.
 * Extracted to .js to avoid NativeWind CSS interop babel transform.
 * Forwards onSwipe via pressable buttons for interaction testing.
 */
const React = require('react');
const RN = require('react-native');

module.exports = {
  BaseSwipeCard: function MockBaseSwipeCard({ card, onSwipe }) {
    return React.createElement(
      RN.View,
      { testID: 'swipe-card' },
      React.createElement(RN.Text, null, card.word),
      onSwipe
        ? React.createElement(RN.Pressable, {
            testID: 'mock-swipe-right',
            onPress: function () {
              onSwipe(card.id, 'right');
            },
          })
        : null,
      onSwipe
        ? React.createElement(RN.Pressable, {
            testID: 'mock-swipe-left',
            onPress: function () {
              onSwipe(card.id, 'left');
            },
          })
        : null
    );
  },
};
