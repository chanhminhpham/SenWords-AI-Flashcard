const React = require('react');

const BottomSheet = React.forwardRef(function BottomSheet(props, ref) {
  React.useImperativeHandle(ref, () => ({
    snapToIndex: jest.fn(),
    close: jest.fn(),
    expand: jest.fn(),
    collapse: jest.fn(),
    forceClose: jest.fn(),
  }));
  return React.createElement('View', { testID: 'bottom-sheet' }, props.children);
});

module.exports = {
  __esModule: true,
  default: BottomSheet,
  BottomSheetView: (props) => React.createElement('View', null, props.children),
  BottomSheetFlatList: (props) =>
    React.createElement(
      'View',
      { testID: 'bottom-sheet-flatlist' },
      props.data
        ? props.data.map((item, i) =>
            React.createElement(
              'View',
              { key: String(i) },
              props.renderItem ? props.renderItem({ item, index: i }) : null
            )
          )
        : props.children
    ),
  BottomSheetBackdrop: () => React.createElement('View', { testID: 'bottom-sheet-backdrop' }),
  BottomSheetScrollView: (props) => React.createElement('View', null, props.children),
};
