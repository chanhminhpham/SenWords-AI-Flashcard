import * as Haptics from 'expo-haptics';

import { useAppStore } from '@/stores/app.store';

import {
  hapticLevelUp,
  hapticSwipeComplete,
  hapticTabSwitch,
  hapticTapError,
  hapticTapSuccess,
  hapticWarning,
} from './haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({
    systemReduceMotion: false,
    userAnimationOverride: null,
    deviceTier: 'standard',
  });
});

describe('haptic service', () => {
  it('fires light impact on hapticTabSwitch', () => {
    hapticTabSwitch();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('fires medium impact on hapticSwipeComplete', () => {
    hapticSwipeComplete();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
  });

  it('fires success notification on hapticTapSuccess', () => {
    hapticTapSuccess();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('fires error notification on hapticTapError', () => {
    hapticTapError();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it('fires warning notification on hapticWarning', () => {
    hapticWarning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
  });

  it('fires success notification on hapticLevelUp', () => {
    hapticLevelUp();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('does not fire haptic when systemReduceMotion is true', () => {
    useAppStore.setState({ systemReduceMotion: true });
    hapticTabSwitch();
    hapticSwipeComplete();
    hapticTapSuccess();
    hapticTapError();
    hapticWarning();
    hapticLevelUp();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('does not fire haptic when userAnimationOverride is true', () => {
    useAppStore.setState({ userAnimationOverride: true });
    hapticTabSwitch();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('does not fire haptic on budget device tier', () => {
    useAppStore.setState({ deviceTier: 'budget' });
    hapticTabSwitch();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});
