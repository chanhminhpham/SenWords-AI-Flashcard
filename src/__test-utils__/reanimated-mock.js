// Shared Reanimated 3 mock for tests (plain JS to avoid NativeWind CSS interop)
const { View } = require('react-native');

module.exports = {
  __esModule: true,
  default: {
    View: View,
    createAnimatedComponent: (c) => c,
  },
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => fn(),
  useAnimatedProps: (fn) => fn(),
  withSpring: (v) => v,
  withTiming: (v) => v,
  withRepeat: (v) => v,
  withSequence: (...args) => args[0],
  interpolate: (_v, _i, o) => o[1],
  runOnJS: (fn) => fn,
  Easing: { inOut: (e) => e, cubic: 0, ease: 0 },
  FadeIn: { duration: () => undefined },
  FadeOut: { duration: () => undefined },
};
