/* eslint-disable @typescript-eslint/no-require-imports, import/first */
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/theme/use-app-theme', () => require('../../../src/__test-utils__/theme-mock'));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import { useOnboardingStore } from '@/stores/onboarding.store';

import GoalSelectionScreen from '../../../app/(auth)/goal-selection';

function renderScreen() {
  return render(
    <PaperProvider>
      <GoalSelectionScreen />
    </PaperProvider>
  );
}

describe('GoalSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().resetOnboarding();
  });

  it('renders 6 goal cards', () => {
    renderScreen();
    expect(screen.getByTestId('goal-card-ielts')).toBeTruthy();
    expect(screen.getByTestId('goal-card-business')).toBeTruthy();
    expect(screen.getByTestId('goal-card-travel')).toBeTruthy();
    expect(screen.getByTestId('goal-card-reading')).toBeTruthy();
    expect(screen.getByTestId('goal-card-movies')).toBeTruthy();
    expect(screen.getByTestId('goal-card-conversation')).toBeTruthy();
  });

  it('renders title in Vietnamese', () => {
    renderScreen();
    expect(screen.getByText('Bạn muốn học tiếng Anh để làm gì?')).toBeTruthy();
  });

  it('renders skip button', () => {
    renderScreen();
    expect(screen.getByTestId('skip-button')).toBeTruthy();
  });

  it('renders manual level selection link', () => {
    renderScreen();
    expect(screen.getByTestId('manual-level-button')).toBeTruthy();
  });

  it('navigates to placement test on skip', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('skip-button'));
    expect(router.push).toHaveBeenCalledWith('/(auth)/placement-test');
    expect(useOnboardingStore.getState().selectedGoal).toBe('conversation');
  });

  it('selects a goal and navigates on continue', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('goal-card-ielts'));
    fireEvent.press(screen.getByTestId('continue-button'));
    expect(router.push).toHaveBeenCalledWith('/(auth)/placement-test');
    expect(useOnboardingStore.getState().selectedGoal).toBe('ielts');
  });

  it('shows level picker when manual level button pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('manual-level-button'));
    expect(screen.getByTestId('level-picker-screen')).toBeTruthy();
    expect(screen.getByText('Chọn trình độ của bạn')).toBeTruthy();
  });

  it('shows 4 level options in level picker', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('manual-level-button'));
    expect(screen.getByTestId('level-card-0')).toBeTruthy();
    expect(screen.getByTestId('level-card-1')).toBeTruthy();
    expect(screen.getByTestId('level-card-2')).toBeTruthy();
    expect(screen.getByTestId('level-card-3')).toBeTruthy();
  });

  it('navigates to level-result on manual level confirm', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('manual-level-button'));
    fireEvent.press(screen.getByTestId('level-card-2'));
    fireEvent.press(screen.getByTestId('confirm-level-button'));
    expect(router.push).toHaveBeenCalledWith('/(auth)/level-result');
    expect(useOnboardingStore.getState().determinedLevel).toBe(2);
    expect(useOnboardingStore.getState().manualLevelSelected).toBe(true);
  });

  it('can go back to goals from level picker', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('manual-level-button'));
    expect(screen.getByTestId('level-picker-screen')).toBeTruthy();
    fireEvent.press(screen.getByTestId('back-to-goals-button'));
    expect(screen.getByTestId('goal-selection-screen')).toBeTruthy();
  });
});
