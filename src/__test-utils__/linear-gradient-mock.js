// Shared expo-linear-gradient mock for tests (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View } = require('react-native');

const LinearGradient = React.forwardRef((props, ref) => {
  const { colors, ...rest } = props;
  return React.createElement(View, { ...rest, ref }, props.children);
});
LinearGradient.displayName = 'LinearGradient';

module.exports = { LinearGradient };
