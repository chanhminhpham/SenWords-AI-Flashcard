// Stub for react-native-css-interop — prevents NativeWind CSS interop crash in tests.
// The real module accesses AccessibilityInfo.isReduceMotionEnabled during init,
// which is undefined in the jest-expo test environment.
//
// This mock handles ALL sub-paths via moduleNameMapper:
//   "^react-native-css-interop(.*)$" → this file
// It must provide createInteropElement (used by NativeWind babel transform)
// and the JSX runtime functions (jsx, jsxs, Fragment).
const React = require('react');
const reactJsx = require('react/jsx-runtime');

module.exports = {
  ...reactJsx,
  createInteropElement: React.createElement,
  cssInterop: function () {},
  remapProps: function () {},
};
