/** @jsxImportSource react */
/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('react-native-gesture-handler', () => require('@/__test-utils__/gesture-handler-mock'));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn((selector: (s: { shouldReduceMotion: () => boolean }) => unknown) =>
    selector({ shouldReduceMotion: () => false })
  ),
}));

jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

import { render } from '@testing-library/react-native';

import { PlacementSwipeCard } from './PlacementSwipeCard';

describe('PlacementSwipeCard', () => {
  const mockWord = {
    id: 'pw-01',
    word: 'cat',
    translation: 'con mèo',
    difficulty: 0.1,
  };
  const mockOnSwipe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders word and translation', () => {
    const { getByText } = render(<PlacementSwipeCard word={mockWord} onSwipe={mockOnSwipe} />);
    expect(getByText('cat')).toBeTruthy();
    expect(getByText('con mèo')).toBeTruthy();
  });

  it('renders with testID', () => {
    const { getByTestId } = render(<PlacementSwipeCard word={mockWord} onSwipe={mockOnSwipe} />);
    expect(getByTestId('placement-swipe-card')).toBeTruthy();
  });

  it('renders know and dont-know overlays', () => {
    const { getByTestId } = render(<PlacementSwipeCard word={mockWord} onSwipe={mockOnSwipe} />);
    expect(getByTestId('know-overlay')).toBeTruthy();
    expect(getByTestId('dont-know-overlay')).toBeTruthy();
  });
});
