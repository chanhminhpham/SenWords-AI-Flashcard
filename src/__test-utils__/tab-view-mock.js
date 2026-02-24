// Shared react-native-tab-view mock for tests (plain JS to avoid NativeWind CSS interop)
const React = require('react');
const { View, Text } = require('react-native');

module.exports = {
  TabView: ({ renderScene, navigationState, renderTabBar, onIndexChange }) => {
    const scene = renderScene({
      route: navigationState.routes[navigationState.index],
      jumpTo: (key) => {
        const idx = navigationState.routes.findIndex((r) => r.key === key);
        if (idx >= 0 && onIndexChange) onIndexChange(idx);
      },
    });
    const tabBar = renderTabBar
      ? renderTabBar({
          navigationState,
          jumpTo: (key) => {
            const idx = navigationState.routes.findIndex((r) => r.key === key);
            if (idx >= 0 && onIndexChange) onIndexChange(idx);
          },
        })
      : null;
    return React.createElement(View, { testID: 'tab-view' }, tabBar, scene);
  },
  TabBar: ({ navigationState }) => {
    return React.createElement(
      View,
      { testID: 'tab-bar', accessibilityRole: 'tablist' },
      navigationState.routes.map((route) =>
        React.createElement(
          Text,
          { key: route.key, testID: `tab-${route.key}`, accessibilityRole: 'tab' },
          route.title
        )
      )
    );
  },
  SceneMap: (scenes) => {
    return ({ route }) => {
      const Scene = scenes[route.key];
      return Scene
        ? React.createElement(View, { testID: `scene-${route.key}` }, React.createElement(Scene))
        : null;
    };
  },
};
