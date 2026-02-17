// Reusable undo snackbar — 3-second auto-dismiss with undo action
// Used in placement test (Story 1.4) and learning session (Story 1.6+)
import { useTranslation } from 'react-i18next';
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
  message,
  duration = 3000,
}: UndoSnackbarProps) {
  const { t } = useTranslation();

  return (
    <Snackbar
      testID="undo-snackbar"
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      accessibilityLiveRegion="polite"
      action={{
        label: t('components.undoSnackbar.actionLabel'),
        accessibilityLabel: t('accessibility.undoAction'),
        onPress: onUndo,
      }}>
      {message ?? t('components.undoSnackbar.defaultMessage')}
    </Snackbar>
  );
}
