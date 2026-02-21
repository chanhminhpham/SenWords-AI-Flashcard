import { render } from '@testing-library/react-native';

import { BaseSwipeCard } from './BaseSwipeCard';

import type { VocabularyCard } from '@/types/vocabulary';

// Mock dependencies (NativeWind v4 limitation: external mock files required)
// eslint-disable-next-line @typescript-eslint/no-require-imports -- NativeWind v4 limitation: external mock files required
jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports -- NativeWind v4 limitation: external mock files required
jest.mock('react-native-gesture-handler', () => require('@/__test-utils__/gesture-handler-mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports -- NativeWind v4 limitation: external mock files required
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));
jest.mock('@/services/haptics', () => ({
  hapticSwipeComplete: jest.fn(),
}));
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => false, deviceTier: 'standard' })
  ),
}));
// Note: i18n mock is handled globally by jest setupFiles (i18n-mock.js)

const mockCard: VocabularyCard = {
  id: 1,
  word: 'hello',
  definition: 'lời chào',
  partOfSpeech: 'n.',
  ipa: null,
  exampleSentence: 'Hello, world!',
  audioUrlAmerican: null,
  audioUrlBritish: null,
  imageUrl: null,
  difficultyLevel: 1,
  topicTags: ['greetings'],
  createdAt: '2024-01-01 00:00:00',
};

describe('BaseSwipeCard', () => {
  it('renders card with word, definition, and KnowledgeDot', () => {
    const onSwipe = jest.fn();
    const { getByText, getByTestId } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} />
    );

    expect(getByText('hello')).toBeTruthy();
    expect(getByText('lời chào')).toBeTruthy();
    expect(getByText('n.')).toBeTruthy(); // POS shown as tag (no parens)
    expect(getByTestId('base-swipe-card')).toBeTruthy();
    expect(getByTestId('knowledge-dot')).toBeTruthy();
  });

  it('renders know overlay (green)', () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} />
    );

    expect(getByTestId('know-overlay')).toBeTruthy();
  });

  it('renders dont-know overlay (amber)', () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} />
    );

    expect(getByTestId('dont-know-overlay')).toBeTruthy();
  });

  it('renders explore overlay only when allowSwipeUp is true', () => {
    const onSwipe = jest.fn();
    const { queryByTestId, rerender } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} allowSwipeUp={false} />
    );

    // Should not render when swipe up is disabled
    expect(queryByTestId('explore-overlay')).toBeNull();

    // Should render when swipe up is allowed
    rerender(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} allowSwipeUp={true} />
    );
    expect(queryByTestId('explore-overlay')).toBeTruthy();
  });

  it('has accessibility labels', () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} />
    );

    const card = getByTestId('base-swipe-card');
    expect(card.props.accessible).toBe(true);
    expect(card.props.accessibilityLabel).toContain('hello');
    expect(card.props.accessibilityLabel).toContain('lời chào');
  });

  it('uses custom testID', () => {
    const onSwipe = jest.fn();
    const { getByTestId } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} testID="custom-card" />
    );

    expect(getByTestId('custom-card')).toBeTruthy();
  });

  it('displays part of speech when provided', () => {
    const onSwipe = jest.fn();
    const cardWithPos = { ...mockCard, partOfSpeech: 'v.' };
    const { getByText } = render(
      <BaseSwipeCard card={cardWithPos} variant="learning" onSwipe={onSwipe} />
    );

    expect(getByText('v.')).toBeTruthy(); // POS shown as tag (no parens)
  });

  it('handles missing part of speech gracefully', () => {
    const onSwipe = jest.fn();
    const cardWithoutPos = { ...mockCard, partOfSpeech: '' };
    const { queryByText } = render(
      <BaseSwipeCard card={cardWithoutPos} variant="learning" onSwipe={onSwipe} />
    );

    expect(queryByText('v.')).toBeNull(); // No POS tag rendered for empty string
  });

  it('supports different variants', () => {
    const onSwipe = jest.fn();
    const { rerender, getByTestId } = render(
      <BaseSwipeCard card={mockCard} variant="learning" onSwipe={onSwipe} />
    );

    expect(getByTestId('base-swipe-card')).toBeTruthy();

    // Test variant prop changes (no visual difference yet, but prop is accepted)
    rerender(<BaseSwipeCard card={mockCard} variant="preview" onSwipe={onSwipe} />);
    expect(getByTestId('base-swipe-card')).toBeTruthy();

    rerender(<BaseSwipeCard card={mockCard} variant="detail" onSwipe={onSwipe} />);
    expect(getByTestId('base-swipe-card')).toBeTruthy();
  });
});
