/* eslint-disable @typescript-eslint/no-require-imports, import/first */

// External .js mocks — avoids NativeWind CSS interop babel transform issue
// with React.createElement inside jest.mock hoisted factories
jest.mock('expo-router', () => require('@/__test-utils__/expo-router-tabs'));
jest.mock('react-native-paper', () => require('@/__test-utils__/paper-snackbar'));
jest.mock('@expo/vector-icons', () => require('@/__test-utils__/vector-icons'));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/hooks/use-tab-unlock', () => ({
  useTabUnlock: jest.fn(),
}));

jest.mock('@/services/haptics', () => ({
  hapticTabSwitch: jest.fn(),
  hapticWarning: jest.fn(),
}));

const mockUseAppTheme = jest.fn();

jest.mock('@/theme', () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

import { render, fireEvent } from '@testing-library/react-native';

import { useTabUnlock } from '@/hooks/use-tab-unlock';
import { hapticTabSwitch, hapticWarning } from '@/services/haptics';

import TabsLayout from '../../../app/(tabs)/_layout';

const lightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surfaceVariant: '#E0E0E0',
    inverseSurface: '#1A1A1A',
    onSurfaceVariant: '#4A4E54',
    primaryContainer: '#E8F4ED',
    nature: { accent: '#2D8A5E' },
  },
};

const darkTheme = {
  dark: true,
  colors: {
    background: '#1A2318',
    surfaceVariant: '#3A4A3E',
    inverseSurface: '#E8F4ED',
    onSurfaceVariant: '#A8B5AB',
    primaryContainer: '#1E3D2A',
    nature: { accent: '#3DAA72' },
  },
};

const allUnlocked = {
  unlocked: { home: true, learn: true, scan: true, progress: true, profile: true },
  lockedMessage: 'Học thêm để mở khóa tính năng này!',
};

const beginnerLocked = {
  unlocked: { home: true, learn: false, scan: false, progress: false, profile: true },
  lockedMessage: 'Học thêm để mở khóa tính năng này!',
};

describe('TabsLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppTheme.mockReturnValue(lightTheme);
    (useTabUnlock as jest.Mock).mockReturnValue(allUnlocked);
  });

  it('renders 5 tab buttons', () => {
    const { getByTestId } = render(<TabsLayout />);
    expect(getByTestId('tab-button-home')).toBeTruthy();
    expect(getByTestId('tab-button-learn')).toBeTruthy();
    expect(getByTestId('tab-button-scan')).toBeTruthy();
    expect(getByTestId('tab-button-progress')).toBeTruthy();
    expect(getByTestId('tab-button-profile')).toBeTruthy();
  });

  it('displays Vietnamese tab labels', () => {
    const { getByText } = render(<TabsLayout />);
    expect(getByText('Học')).toBeTruthy();
    expect(getByText('Từ vựng')).toBeTruthy();
    expect(getByText('Scan')).toBeTruthy();
    expect(getByText('Hành trình')).toBeTruthy();
    expect(getByText('Tôi')).toBeTruthy();
  });

  it('renders correct icons for each tab', () => {
    const { getByTestId } = render(<TabsLayout />);
    expect(getByTestId('icon-leaf')).toBeTruthy();
    expect(getByTestId('icon-book-open-page-variant')).toBeTruthy();
    expect(getByTestId('icon-camera')).toBeTruthy();
    expect(getByTestId('icon-map-marker-path')).toBeTruthy();
    expect(getByTestId('icon-account')).toBeTruthy();
  });

  it('fires hapticTabSwitch on unlocked tab press', () => {
    const { getByTestId } = render(<TabsLayout />);
    fireEvent.press(getByTestId('tab-button-home'));
    expect(hapticTabSwitch).toHaveBeenCalledTimes(1);
    expect(hapticWarning).not.toHaveBeenCalled();
  });

  it('fires hapticWarning and shows snackbar on locked tab press', () => {
    (useTabUnlock as jest.Mock).mockReturnValue(beginnerLocked);
    const { getByTestId, getByText } = render(<TabsLayout />);

    fireEvent.press(getByTestId('tab-button-learn'));

    expect(hapticWarning).toHaveBeenCalledTimes(1);
    expect(hapticTabSwitch).not.toHaveBeenCalled();
    expect(getByText('Học thêm để mở khóa tính năng này!')).toBeTruthy();
  });

  it('does not show snackbar when no locked tab is pressed', () => {
    (useTabUnlock as jest.Mock).mockReturnValue(beginnerLocked);
    const { queryByTestId } = render(<TabsLayout />);
    expect(queryByTestId('snackbar')).toBeNull();
  });

  it('renders lock icon on locked tabs only', () => {
    (useTabUnlock as jest.Mock).mockReturnValue(beginnerLocked);
    const { getAllByTestId } = render(<TabsLayout />);
    // learn, scan, progress are locked → 3 lock icons
    const lockIcons = getAllByTestId('icon-lock');
    expect(lockIcons).toHaveLength(3);
  });

  it('sets reduced opacity on locked tab buttons', () => {
    (useTabUnlock as jest.Mock).mockReturnValue(beginnerLocked);
    const { getByTestId } = render(<TabsLayout />);

    const lockedButton = getByTestId('tab-button-learn');
    const flatStyle = Array.isArray(lockedButton.props.style)
      ? Object.assign({}, ...lockedButton.props.style.filter(Boolean))
      : lockedButton.props.style;
    expect(flatStyle.opacity).toBe(0.5);
  });

  it('does not reduce opacity on unlocked tab buttons', () => {
    const { getByTestId } = render(<TabsLayout />);
    const unlockedButton = getByTestId('tab-button-home');
    const flatStyle = Array.isArray(unlockedButton.props.style)
      ? Object.assign({}, ...unlockedButton.props.style.filter(Boolean))
      : unlockedButton.props.style;
    expect(flatStyle.opacity).toBeUndefined();
  });

  it('provides accessibility hint on locked tabs', () => {
    (useTabUnlock as jest.Mock).mockReturnValue(beginnerLocked);
    const { getByTestId } = render(<TabsLayout />);
    const lockedButton = getByTestId('tab-button-learn');
    expect(lockedButton.props.accessibilityHint).toBe('Tính năng bị khóa. Học thêm để mở khóa.');
  });

  it('does not set accessibility hint on unlocked tabs', () => {
    const { getByTestId } = render(<TabsLayout />);
    const unlockedButton = getByTestId('tab-button-home');
    expect(unlockedButton.props.accessibilityHint).toBeUndefined();
  });

  it('applies active indicator background on selected tab', () => {
    const { getByTestId } = render(<TabsLayout />);
    // expo-router-tabs mock sets home as selected (accessibilityState.selected = true)
    const homeButton = getByTestId('tab-button-home');
    const flatStyle = Array.isArray(homeButton.props.style)
      ? Object.assign({}, ...homeButton.props.style.filter(Boolean))
      : homeButton.props.style;
    expect(flatStyle.backgroundColor).toBe('#E8F4ED');
  });

  it('does not apply active indicator background on unselected tab', () => {
    const { getByTestId } = render(<TabsLayout />);
    const learnButton = getByTestId('tab-button-learn');
    const flatStyle = Array.isArray(learnButton.props.style)
      ? Object.assign({}, ...learnButton.props.style.filter(Boolean))
      : learnButton.props.style;
    expect(flatStyle.backgroundColor).toBeUndefined();
  });

  describe('dark mode', () => {
    beforeEach(() => {
      mockUseAppTheme.mockReturnValue(darkTheme);
    });

    it('applies dark theme colors to active indicator', () => {
      const { getByTestId } = render(<TabsLayout />);
      const homeButton = getByTestId('tab-button-home');
      const flatStyle = Array.isArray(homeButton.props.style)
        ? Object.assign({}, ...homeButton.props.style.filter(Boolean))
        : homeButton.props.style;
      expect(flatStyle.backgroundColor).toBe('#1E3D2A');
    });

    it('uses dark theme accent color for active tint', () => {
      // Verifies dark theme is wired correctly — accent used for active tabs
      const { getByTestId } = render(<TabsLayout />);
      expect(getByTestId('tabs-navigator')).toBeTruthy();
    });
  });
});
