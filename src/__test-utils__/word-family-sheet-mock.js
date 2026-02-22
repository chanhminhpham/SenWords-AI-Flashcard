const React = require('react');
const RN = require('react-native');

module.exports = {
  WordFamilySheet: function MockWordFamilySheet() {
    return React.createElement(RN.View, { testID: 'word-family-sheet' });
  },
};
