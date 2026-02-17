/* eslint-disable @typescript-eslint/no-require-imports, import/first */
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn((selector: (s: { shouldReduceMotion: () => boolean }) => unknown) =>
    selector({ shouldReduceMotion: () => false })
  ),
}));

jest.mock('@/theme/use-app-theme', () => require('../../../src/__test-utils__/theme-mock'));

// Mock child components with external JS files (avoids NativeWind CSS interop in .tsx)
jest.mock('@/components/features/onboarding/SwipeTutorialCard', () =>
  require('../../../src/__test-utils__/swipe-tutorial-card-mock')
);
jest.mock('@/components/features/onboarding/PlacementSwipeCard', () =>
  require('../../../src/__test-utils__/placement-swipe-card-mock')
);
jest.mock('@/components/ui/UndoSnackbar', () =>
  require('../../../src/__test-utils__/undo-snackbar-mock')
);

import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { PLACEMENT_WORDS } from '@/constants/placement-test-words';
import { useOnboardingStore } from '@/stores/onboarding.store';

import PlacementTestScreen from '../../../app/(auth)/placement-test';

describe('PlacementTestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().resetOnboarding();
  });

  it('renders placement test screen', () => {
    render(<PlacementTestScreen />);
    expect(screen.getByTestId('placement-test-screen')).toBeTruthy();
  });

  it('shows tutorial card first', () => {
    render(<PlacementTestScreen />);
    expect(screen.getByTestId('swipe-tutorial-card')).toBeTruthy();
  });

  it('shows tutorial label as progress during tutorial', () => {
    render(<PlacementTestScreen />);
    expect(screen.getByText('placementTest.tutorialLabel')).toBeTruthy();
  });

  it('shows placement card after completing tutorial', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    expect(screen.getByTestId('placement-swipe-card')).toBeTruthy();
    expect(screen.getByText(PLACEMENT_WORDS[0].word)).toBeTruthy();
  });

  it('displays progress counter after tutorial', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    expect(screen.getByText('1 / 10')).toBeTruthy();
  });

  it('advances to next card on swipe', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    fireEvent.press(screen.getByTestId('swipe-know'));
    expect(screen.getByText(PLACEMENT_WORDS[1].word)).toBeTruthy();
    expect(screen.getByText('2 / 10')).toBeTruthy();
  });

  it('records swipe in onboarding store', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    fireEvent.press(screen.getByTestId('swipe-know'));

    const responses = useOnboardingStore.getState().placementResponses;
    expect(responses).toHaveLength(1);
    expect(responses[0]).toEqual({ wordId: PLACEMENT_WORDS[0].id, response: 'know' });
  });

  it('shows undo snackbar after swipe', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    fireEvent.press(screen.getByTestId('swipe-know'));
    expect(screen.getByTestId('undo-snackbar')).toBeTruthy();
  });

  it('undoes last swipe and goes back to previous card', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    fireEvent.press(screen.getByTestId('swipe-know'));
    expect(screen.getByText(PLACEMENT_WORDS[1].word)).toBeTruthy();

    fireEvent.press(screen.getByTestId('undo-button'));
    expect(screen.getByText(PLACEMENT_WORDS[0].word)).toBeTruthy();
    expect(screen.getByText('1 / 10')).toBeTruthy();
  });

  it('navigates to level-result after all 10 cards', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    for (let i = 0; i < 10; i++) {
      fireEvent.press(screen.getByTestId(i % 2 === 0 ? 'swipe-know' : 'swipe-dont-know'));
    }
    expect(router.push).toHaveBeenCalledWith('/(auth)/level-result');
  });

  it('calculates level after completing all cards', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    for (let i = 0; i < 10; i++) {
      fireEvent.press(screen.getByTestId('swipe-know'));
    }
    expect(useOnboardingStore.getState().determinedLevel).not.toBeNull();
  });

  it('shows swipe direction hints after tutorial', () => {
    render(<PlacementTestScreen />);
    fireEvent.press(screen.getByTestId('complete-tutorial'));
    expect(screen.getByText('placementTest.hintLeft')).toBeTruthy();
    expect(screen.getByText('placementTest.hintRight')).toBeTruthy();
  });
});
