/**
 * Mock for expo-router Tabs component used in tab layout tests.
 * Extracted to .js to avoid NativeWind CSS interop babel transform
 * injecting _ReactNativeCSSInterop into jest.mock hoisted factories.
 */
const React = require('react');
const RN = require('react-native');

function MockTabs({ children }) {
  const screens = React.Children.toArray(children);
  return React.createElement(
    RN.View,
    { testID: 'tabs-navigator' },
    screens.map((screen) => {
      const { name, options } = screen.props;
      if (!options || !options.tabBarButton) return null;

      const icon = options.tabBarIcon
        ? options.tabBarIcon({ color: '#000', size: 24, focused: false })
        : null;
      const label = options.tabBarLabel
        ? options.tabBarLabel({ color: '#000', focused: false })
        : null;
      const content = React.createElement(RN.View, { testID: 'tab-content-' + name }, icon, label);

      return React.createElement(
        React.Fragment,
        { key: name },
        options.tabBarButton({
          onPress: function () {},
          onLongPress: null,
          children: content,
          style: { flex: 1 },
          accessibilityRole: 'tab',
          accessibilityState: { selected: name === 'home' },
          testID: 'tab-button-' + name,
        })
      );
    })
  );
}

MockTabs.Screen = function MockScreen() {
  return null;
};

module.exports = { Tabs: MockTabs };
