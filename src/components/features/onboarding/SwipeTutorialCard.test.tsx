/** @jsxImportSource react */
/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('react-native-gesture-handler', () => require('@/__test-utils__/gesture-handler-mock'));
jest.mock('react-native-paper', () => require('@/__test-utils__/paper-mock'));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn((selector: (s: { shouldReduceMotion: () => boolean }) => unknown) =>
    selector({ shouldReduceMotion: () => false })
  ),
}));

jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

import { render } from '@testing-library/react-native';

import { SwipeTutorialCard } from './SwipeTutorialCard';

describe('SwipeTutorialCard', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tutorial card with testID', () => {
    const { getByTestId } = render(<SwipeTutorialCard onComplete={mockOnComplete} />);
    expect(getByTestId('swipe-tutorial-card')).toBeTruthy();
  });

  it('shows instruction text in Vietnamese', () => {
    const { getByText } = render(<SwipeTutorialCard onComplete={mockOnComplete} />);
    expect(getByText('Vuốt phải nếu bạn BIẾT từ này, vuốt trái nếu CHƯA BIẾT')).toBeTruthy();
  });

  it('shows practice hint', () => {
    const { getByText } = render(<SwipeTutorialCard onComplete={mockOnComplete} />);
    expect(getByText('Hãy thử vuốt thẻ này!')).toBeTruthy();
  });

  it('renders hand icon', () => {
    const { getByTestId } = render(<SwipeTutorialCard onComplete={mockOnComplete} />);
    expect(getByTestId('hand-icon')).toBeTruthy();
  });
});
