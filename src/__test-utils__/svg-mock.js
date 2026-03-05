// SVG mock for tests — renders host View/Text components with testID for querying.
// babel.config.js excludes __test-utils__/ from NativeWind transforms to avoid CSS interop crash.
const React = require('react');

function createSvgMock(name) {
  const testIDDefault = 'svg-' + name.toLowerCase();
  function MockComponent(props) {
    return React.createElement(
      'View',
      {
        testID: props.testID || testIDDefault,
        accessible: props.accessible,
        accessibilityRole: props.accessibilityRole,
        accessibilityLabel: props.accessibilityLabel,
      },
      props.children
    );
  }
  MockComponent.displayName = name;
  return MockComponent;
}

function SvgTextMock(props) {
  return React.createElement('Text', {}, props.children);
}
SvgTextMock.displayName = 'SvgText';

module.exports = {
  __esModule: true,
  default: createSvgMock('Svg'),
  Svg: createSvgMock('Svg'),
  Circle: createSvgMock('Circle'),
  Line: createSvgMock('Line'),
  Text: SvgTextMock,
  G: createSvgMock('G'),
  Path: createSvgMock('Path'),
  Rect: createSvgMock('Rect'),
};
