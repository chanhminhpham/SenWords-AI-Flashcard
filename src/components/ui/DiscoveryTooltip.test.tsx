/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => false, deviceTier: 'standard' })
  ),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DiscoveryTooltip } from './DiscoveryTooltip';

describe('DiscoveryTooltip', () => {
  const defaultProps = {
    message: 'Vuốt lên để khám phá',
    a11yMessage: 'Gợi ý: Vuốt lên để xem chi tiết',
    storageKey: 'hint_swipe_up_shown',
    visible: true,
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders when visible is true', () => {
    const { getByTestId } = render(<DiscoveryTooltip {...defaultProps} />);
    expect(getByTestId('discovery-tooltip')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByTestId } = render(<DiscoveryTooltip {...defaultProps} visible={false} />);
    expect(queryByTestId('discovery-tooltip')).toBeNull();
  });

  it('displays the message text', () => {
    const { getByText } = render(<DiscoveryTooltip {...defaultProps} />);
    expect(getByText('Vuốt lên để khám phá')).toBeTruthy();
  });

  it('sets accessibility label for screen readers', () => {
    const { getByTestId } = render(<DiscoveryTooltip {...defaultProps} />);
    const tooltip = getByTestId('discovery-tooltip');
    expect(tooltip.props.accessibilityLabel).toBe('Gợi ý: Vuốt lên để xem chi tiết');
  });

  it('has accessibilityRole="alert"', () => {
    const { getByTestId } = render(<DiscoveryTooltip {...defaultProps} />);
    const tooltip = getByTestId('discovery-tooltip');
    expect(tooltip.props.accessibilityRole).toBe('alert');
  });

  it('persists to AsyncStorage and calls onDismiss when tapped', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(<DiscoveryTooltip {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.press(getByText('Vuốt lên để khám phá'));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('hint_swipe_up_shown', 'true');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 5 seconds', () => {
    const onDismiss = jest.fn();
    render(<DiscoveryTooltip {...defaultProps} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('hint_swipe_up_shown', 'true');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('clears timer on unmount', () => {
    const onDismiss = jest.fn();
    const { unmount } = render(<DiscoveryTooltip {...defaultProps} onDismiss={onDismiss} />);

    unmount();

    jest.advanceTimersByTime(5000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('uses custom testID when provided', () => {
    const { getByTestId } = render(<DiscoveryTooltip {...defaultProps} testID="custom-tooltip" />);
    expect(getByTestId('custom-tooltip')).toBeTruthy();
  });
});
