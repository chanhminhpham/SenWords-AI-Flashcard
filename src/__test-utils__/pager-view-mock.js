// Shared react-native-pager-view mock for tests (plain JS)
const React = require('react');
const { View } = require('react-native');

const PagerView = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement(View, { ...props, ref }, children)
);
PagerView.displayName = 'PagerView';

module.exports = {
  __esModule: true,
  default: PagerView,
};
