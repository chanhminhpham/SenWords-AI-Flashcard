/* eslint-disable @typescript-eslint/no-require-imports, import/first */
jest.mock('react-native-reanimated', () => require('../../../src/__test-utils__/reanimated-mock'));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn((selector: (s: { shouldReduceMotion: () => boolean }) => unknown) =>
    selector({ shouldReduceMotion: () => true })
  ),
}));

jest.mock('@/services/onboarding/onboarding.service', () => ({
  saveOnboardingResult: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/theme/use-app-theme', () => require('../../../src/__test-utils__/theme-mock'));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { UserLevel } from '@/types/onboarding';

import LevelResultScreen from '../../../app/(auth)/level-result';

function renderScreen() {
  return render(
    <PaperProvider>
      <LevelResultScreen />
    </PaperProvider>
  );
}

describe('LevelResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().resetOnboarding();
    useAuthStore.setState({ user: { id: 'user-123' } as never });
  });

  it('shows loading when no level determined', () => {
    renderScreen();
    expect(screen.getByTestId('level-result-loading')).toBeTruthy();
  });

  it('displays level badge after placement test', () => {
    // Simulate placement test completion
    useOnboardingStore.getState().selectGoal('ielts');
    for (let i = 0; i < 7; i++) {
      useOnboardingStore.getState().recordSwipe(`pw-${i}`, 'know');
    }
    for (let i = 7; i < 10; i++) {
      useOnboardingStore.getState().recordSwipe(`pw-${i}`, 'dontKnow');
    }
    useOnboardingStore.getState().calculateLevel();

    renderScreen();
    expect(screen.getByTestId('level-result-screen')).toBeTruthy();
    expect(screen.getByTestId('level-badge')).toBeTruthy();
    expect(screen.getByText(/Trung cấp/)).toBeTruthy();
  });

  it('shows correct count summary for placement test', () => {
    for (let i = 0; i < 5; i++) {
      useOnboardingStore.getState().recordSwipe(`pw-${i}`, 'know');
    }
    for (let i = 5; i < 10; i++) {
      useOnboardingStore.getState().recordSwipe(`pw-${i}`, 'dontKnow');
    }
    useOnboardingStore.getState().calculateLevel();

    renderScreen();
    expect(screen.getByText('Bạn biết 5/10 từ')).toBeTruthy();
  });

  it('shows manual selection summary', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.UpperIntermediate);

    renderScreen();
    expect(screen.getByText('Bạn đã tự chọn trình độ')).toBeTruthy();
  });

  it('shows encouragement message', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);

    renderScreen();
    expect(screen.getByTestId('encouragement')).toBeTruthy();
  });

  it('renders start button', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);

    renderScreen();
    expect(screen.getByTestId('start-button')).toBeTruthy();
  });

  it('navigates to tabs on start', async () => {
    useOnboardingStore.getState().selectGoal('travel');
    useOnboardingStore.getState().selectLevelManually(UserLevel.Intermediate);

    renderScreen();
    fireEvent.press(screen.getByTestId('start-button'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(useOnboardingStore.getState().onboardingCompleted).toBe(true);
  });

  it('renders lotus animation', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);

    renderScreen();
    expect(screen.getByTestId('lotus-animation')).toBeTruthy();
  });

  it('shows feature unlock list', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);

    renderScreen();
    expect(screen.getByTestId('feature-unlock-list')).toBeTruthy();
    expect(screen.getByText('Tính năng mở khóa:')).toBeTruthy();
    expect(screen.getByText('• Vuốt phải/trái để học từ vựng')).toBeTruthy();
  });
});
