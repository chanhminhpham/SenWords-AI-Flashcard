module.exports = function (api) {
  api.cache(true);
  const plugins = ['react-native-worklets/plugin', ['inline-import', { extensions: ['.sql'] }]];

  return {
    // Use overrides to conditionally apply NativeWind.
    // __test-utils__/ mock files must NOT get NativeWind transform —
    // otherwise React.createElement inside mocks triggers a circular
    // dependency with the react-native-css-interop moduleNameMapper.
    overrides: [
      {
        test: /\/__test-utils__\//,
        presets: ['babel-preset-expo'],
        plugins,
      },
      {
        exclude: /\/__test-utils__\//,
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
        plugins,
      },
    ],
  };
};
