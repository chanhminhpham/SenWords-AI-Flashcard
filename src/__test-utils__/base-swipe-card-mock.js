/**
 * Mock for BaseSwipeCard used in Learn screen tests.
 * Extracted to .js to avoid NativeWind CSS interop babel transform.
 */
const React = require('react');
const RN = require('react-native');

module.exports = {
  BaseSwipeCard: function MockBaseSwipeCard({ card }) {
    return React.createElement(
      RN.View,
      { testID: 'swipe-card' },
      React.createElement(RN.Text, null, card.word)
    );
  },
};
