/* eslint-disable @typescript-eslint/no-require-imports, import/first */
jest.mock('react-native-reanimated', () => require('../../../src/__test-utils__/reanimated-mock'));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn().mockReturnValue({ allKnown: 'false' }),
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => true, deviceTier: 'standard' })
  ),
}));

jest.mock('@/theme/use-app-theme', () => require('../../../src/__test-utils__/theme-mock'));

jest.mock('@/services/haptics', () => ({
  hapticTapSuccess: jest.fn(),
}));

jest.mock('@/db', () => ({
  getDb: () => ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          run: jest.fn(),
        }),
      }),
    }),
  }),
}));

jest.mock('@/db/local-schema', () => ({
  userPreferences: { userId: 'user_id' },
}));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { UserLevel } from '@/types/onboarding';

import CelebrationScreen from '../../../app/(auth)/celebration';

function renderScreen() {
  return render(
    <PaperProvider>
      <CelebrationScreen />
    </PaperProvider>
  );
}

describe('CelebrationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useOnboardingStore.getState().resetOnboarding();
    useOnboardingStore.getState().selectGoal('travel');
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    useAuthStore.setState({ user: { id: 'user-123' } as never });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ allKnown: 'false' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders celebration screen', () => {
    renderScreen();
    expect(screen.getByTestId('celebration-screen')).toBeTruthy();
  });

  it('shows default celebration text', () => {
    renderScreen();
    expect(screen.getByTestId('celebration-title')).toBeTruthy();
    expect(screen.getByText('firstSession.celebrationDefault')).toBeTruthy();
  });

  it('shows allKnown celebration text when all words known', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ allKnown: 'true' });

    renderScreen();
    expect(screen.getByText('firstSession.celebrationAllKnown')).toBeTruthy();
  });

  it('shows progress message', () => {
    renderScreen();
    expect(screen.getByTestId('celebration-progress')).toBeTruthy();
    expect(screen.getByText('firstSession.progressMessage')).toBeTruthy();
  });

  it('shows continue button', () => {
    renderScreen();
    expect(screen.getByTestId('celebration-continue-button')).toBeTruthy();
  });

  it('navigates to home on button press', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('celebration-continue-button'));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('navigates to home on tap anywhere', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('celebration-screen'));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('marks onboarding as completed on navigate', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('celebration-continue-button'));

    expect(useOnboardingStore.getState().onboardingCompleted).toBe(true);
  });

  it('shows static celebration for budget/reduce-motion', () => {
    renderScreen();
    // With shouldReduceMotion=true, it should show static content
    expect(screen.getByTestId('celebration-static')).toBeTruthy();
  });

  it('auto-dismisses after 3 seconds', () => {
    renderScreen();
    expect(router.replace).not.toHaveBeenCalled();

    // Advance past AUTO_DISMISS_MS (3000ms)
    jest.advanceTimersByTime(3000);

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });
});
