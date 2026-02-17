/** @jsxImportSource react */
/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-paper', () => require('@/__test-utils__/paper-mock'));

import { fireEvent, render } from '@testing-library/react-native';

import { UndoSnackbar } from './UndoSnackbar';

describe('UndoSnackbar', () => {
  const mockOnDismiss = jest.fn();
  const mockOnUndo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    const { getByTestId } = render(
      <UndoSnackbar visible={true} onDismiss={mockOnDismiss} onUndo={mockOnUndo} />
    );
    expect(getByTestId('undo-snackbar')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      <UndoSnackbar visible={false} onDismiss={mockOnDismiss} onUndo={mockOnUndo} />
    );
    expect(queryByTestId('undo-snackbar')).toBeNull();
  });

  it('shows default message', () => {
    const { getByText } = render(
      <UndoSnackbar visible={true} onDismiss={mockOnDismiss} onUndo={mockOnUndo} />
    );
    expect(getByText('components.undoSnackbar.defaultMessage')).toBeTruthy();
  });

  it('shows custom message', () => {
    const { getByText } = render(
      <UndoSnackbar visible={true} onDismiss={mockOnDismiss} onUndo={mockOnUndo} message="Đã xóa" />
    );
    expect(getByText('Đã xóa')).toBeTruthy();
  });

  it('calls onUndo when action pressed', () => {
    const { getByTestId } = render(
      <UndoSnackbar visible={true} onDismiss={mockOnDismiss} onUndo={mockOnUndo} />
    );
    fireEvent.press(getByTestId('undo-action'));
    expect(mockOnUndo).toHaveBeenCalledTimes(1);
  });

  it('shows undo action label', () => {
    const { getByText } = render(
      <UndoSnackbar visible={true} onDismiss={mockOnDismiss} onUndo={mockOnUndo} />
    );
    expect(getByText('components.undoSnackbar.actionLabel')).toBeTruthy();
  });
});
