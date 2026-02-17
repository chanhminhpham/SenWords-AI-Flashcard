// Reusable undo snackbar — 3-second auto-dismiss with undo action
// Used in placement test (Story 1.4) and learning session (Story 1.6+)
import { Snackbar } from 'react-native-paper';

interface UndoSnackbarProps {
  visible: boolean;
  onDismiss: () => void;
  onUndo: () => void;
  message?: string;
  duration?: number;
}

export function UndoSnackbar({
  visible,
  onDismiss,
  onUndo,
  message = 'Đã vuốt',
  duration = 3000,
}: UndoSnackbarProps) {
  return (
    <Snackbar
      testID="undo-snackbar"
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      action={{
        label: 'Hoàn tác',
        onPress: onUndo,
      }}>
      {message}
    </Snackbar>
  );
}
