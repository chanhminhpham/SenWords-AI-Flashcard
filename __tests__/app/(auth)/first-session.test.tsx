/* eslint-disable @typescript-eslint/no-require-imports, import/first */
jest.mock('react-native-reanimated', () => require('../../../src/__test-utils__/reanimated-mock'));

jest.mock('@/components/features/flashcard/BaseSwipeCard', () =>
  require('../../../src/__test-utils__/base-swipe-card-mock')
);

jest.mock('@/components/ui/UndoSnackbar', () =>
  require('../../../src/__test-utils__/undo-snackbar-mock')
);

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => true, deviceTier: 'standard' })
  ),
}));

jest.mock('@/theme/use-app-theme', () => require('../../../src/__test-utils__/theme-mock'));

const mockSelectFirstSessionWords = jest.fn();
const mockAdjustSchedule = jest.fn().mockReturnValue({ success: true, isFirstReview: true });
const mockLogLearningEvent = jest.fn().mockReturnValue({ success: true });
const mockLogUndoEvent = jest.fn().mockReturnValue({ success: true });
const mockRevertScheduleAdjustment = jest.fn().mockReturnValue({ success: true });

jest.mock('@/services/sr/sr.service', () => ({
  selectFirstSessionWords: (...args: unknown[]) => mockSelectFirstSessionWords(...args),
  adjustSchedule: (...args: unknown[]) => mockAdjustSchedule(...args),
  logLearningEvent: (...args: unknown[]) => mockLogLearningEvent(...args),
  logUndoEvent: (...args: unknown[]) => mockLogUndoEvent(...args),
  revertScheduleAdjustment: (...args: unknown[]) => mockRevertScheduleAdjustment(...args),
  FIRST_SESSION_CARD_COUNT: 5,
}));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import { router } from 'expo-router';

import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { UserLevel } from '@/types/onboarding';

import FirstSessionScreen from '../../../app/(auth)/first-session';

function makeCard(id: number, word: string) {
  return {
    id,
    word,
    definition: `def-${word}`,
    partOfSpeech: 'noun',
    ipa: null,
    exampleSentence: null,
    audioUrlAmerican: null,
    audioUrlBritish: null,
    imageUrl: null,
    difficultyLevel: 0,
    topicTags: [],
    createdAt: '2026-01-01',
  };
}

function renderScreen() {
  return render(
    <PaperProvider>
      <FirstSessionScreen />
    </PaperProvider>
  );
}

describe('FirstSessionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().resetOnboarding();
    useAuthStore.setState({ user: { id: 'user-123' } as never });
    mockSelectFirstSessionWords.mockReturnValue([]);
  });

  it('shows empty error when no words available', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    mockSelectFirstSessionWords.mockReturnValue([]);

    renderScreen();
    expect(screen.getByTestId('first-session-empty')).toBeTruthy();
    expect(screen.getByText('firstSession.emptyError')).toBeTruthy();
  });

  it('renders card and counter when words available', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    const cards = [
      makeCard(1, 'hello'),
      makeCard(2, 'world'),
      makeCard(3, 'test'),
      makeCard(4, 'word'),
      makeCard(5, 'card'),
    ];
    mockSelectFirstSessionWords.mockReturnValue(cards);

    renderScreen();
    expect(screen.getByTestId('first-session-screen')).toBeTruthy();
    expect(screen.getByTestId('first-session-counter')).toBeTruthy();
    expect(screen.getByTestId('swipe-card')).toBeTruthy();
  });

  it('shows tooltip on initial render', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    const cards = [
      makeCard(1, 'hello'),
      makeCard(2, 'world'),
      makeCard(3, 'a'),
      makeCard(4, 'b'),
      makeCard(5, 'c'),
    ];
    mockSelectFirstSessionWords.mockReturnValue(cards);

    renderScreen();
    expect(screen.getByTestId('first-session-tooltip')).toBeTruthy();
  });

  it('calls selectFirstSessionWords with correct params', () => {
    useOnboardingStore.getState().selectGoal('ielts');
    useOnboardingStore.getState().selectLevelManually(UserLevel.Intermediate);
    mockSelectFirstSessionWords.mockReturnValue([]);

    renderScreen();
    expect(mockSelectFirstSessionWords).toHaveBeenCalledWith(UserLevel.Intermediate, 'ielts');
  });

  it('shows loading when level is null', () => {
    // Don't set level — determinedLevel remains null
    renderScreen();
    expect(screen.getByTestId('first-session-loading')).toBeTruthy();
  });

  // --- AC5: Swipe interaction tests ---

  it('calls adjustSchedule and logLearningEvent on swipe right', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    const cards = [
      makeCard(1, 'hello'),
      makeCard(2, 'world'),
      makeCard(3, 'a'),
      makeCard(4, 'b'),
      makeCard(5, 'c'),
    ];
    mockSelectFirstSessionWords.mockReturnValue(cards);

    renderScreen();
    fireEvent.press(screen.getByTestId('mock-swipe-right'));

    expect(mockLogLearningEvent).toHaveBeenCalledWith(1, 'user-123', 'right');
    expect(mockAdjustSchedule).toHaveBeenCalledWith({
      cardId: 1,
      userId: 'user-123',
      response: 'know',
    });
  });

  it('calls adjustSchedule with dontKnow on swipe left', () => {
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    const cards = [
      makeCard(1, 'hello'),
      makeCard(2, 'world'),
      makeCard(3, 'a'),
      makeCard(4, 'b'),
      makeCard(5, 'c'),
    ];
    mockSelectFirstSessionWords.mockReturnValue(cards);

    renderScreen();
    fireEvent.press(screen.getByTestId('mock-swipe-left'));

    expect(mockLogLearningEvent).toHaveBeenCalledWith(1, 'user-123', 'left');
    expect(mockAdjustSchedule).toHaveBeenCalledWith({
      cardId: 1,
      userId: 'user-123',
      response: 'dontKnow',
    });
  });

  it('navigates to celebration after 5th swipe', () => {
    jest.useFakeTimers();
    useOnboardingStore.getState().selectLevelManually(UserLevel.Beginner);
    const cards = [
      makeCard(1, 'a'),
      makeCard(2, 'b'),
      makeCard(3, 'c'),
      makeCard(4, 'd'),
      makeCard(5, 'e'),
    ];
    mockSelectFirstSessionWords.mockReturnValue(cards);

    const { rerender } = renderScreen();

    // Swipe through all 5 cards — each swipe advances queue, re-render picks up new card
    for (let i = 0; i < 5; i++) {
      const btn = screen.queryByTestId('mock-swipe-right');
      if (btn) fireEvent.press(btn);
      rerender(
        <PaperProvider>
          <FirstSessionScreen />
        </PaperProvider>
      );
    }

    // Advance timer for last-card animation delay (400ms)
    jest.advanceTimersByTime(500);

    expect(router.replace).toHaveBeenCalledWith(expect.stringContaining('/(auth)/celebration'));
    jest.useRealTimers();
  });
});
