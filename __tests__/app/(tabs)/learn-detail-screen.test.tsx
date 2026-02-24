/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('react-native-gesture-handler', () => require('@/__test-utils__/gesture-handler-mock'));
jest.mock('react-native-tab-view', () => require('@/__test-utils__/tab-view-mock'));
jest.mock('react-native-pager-view', () => require('@/__test-utils__/pager-view-mock'));
jest.mock('@expo/vector-icons', () => require('@/__test-utils__/vector-icons'));
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode; testID?: string }) =>
      require('react').createElement(View, props, children),
  };
});

const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn().mockReturnValue({ cardId: '42' }),
  router: { back: mockRouterBack, push: jest.fn() },
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => false, deviceTier: 'standard' })
  ),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn((selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'test-user' } })
  ),
}));

jest.mock('@/services/vocabulary/vocabulary.service', () => ({
  fetchCardById: jest.fn().mockReturnValue({
    id: 42,
    word: 'test-word',
    definition: 'test-def',
    partOfSpeech: 'noun',
    ipa: null,
    exampleSentence: null,
    audioUrlAmerican: null,
    audioUrlBritish: null,
    imageUrl: null,
    difficultyLevel: 1,
    topicTags: [],
    createdAt: '2024-01-01',
  }),
  fetchScheduleByCardId: jest.fn().mockReturnValue(null),
}));

jest.mock('@/components/ui/KnowledgeDot', () => ({
  KnowledgeDot: () => {
    const { View } = require('react-native');
    return require('react').createElement(View, { testID: 'knowledge-dot' });
  },
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import FlashcardDetailScreen from '../../../app/(tabs)/learn/[cardId]';

function renderScreen(params?: Record<string, string>) {
  if (params) {
    (useLocalSearchParams as jest.Mock).mockReturnValue(params);
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}>
      <QueryClientProvider client={queryClient}>
        <FlashcardDetailScreen />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

describe('FlashcardDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ cardId: '42' });
  });

  it('renders the detail screen with FlashcardDetail', async () => {
    const { findByTestId } = renderScreen();
    expect(await findByTestId('flashcard-detail-screen')).toBeTruthy();
    expect(await findByTestId('flashcard-detail')).toBeTruthy();
  });

  it('renders back button', async () => {
    const { findByTestId } = renderScreen();
    expect(await findByTestId('icon-arrow-left')).toBeTruthy();
  });

  it('renders GestureDetector wrapper for swipe-down navigation', async () => {
    const { findByTestId } = renderScreen();
    expect(await findByTestId('gesture-detector')).toBeTruthy();
  });

  it('shows error state for invalid cardId', () => {
    const { getByText } = renderScreen({ cardId: 'abc' });
    expect(getByText('Card not found')).toBeTruthy();
  });

  it('shows error state for cardId = 0', () => {
    const { getByText } = renderScreen({ cardId: '0' });
    expect(getByText('Card not found')).toBeTruthy();
  });

  it('shows error state for negative cardId', () => {
    const { getByText } = renderScreen({ cardId: '-1' });
    expect(getByText('Card not found')).toBeTruthy();
  });

  it('renders tab view from FlashcardDetail', async () => {
    const { findByTestId } = renderScreen();
    expect(await findByTestId('tab-view')).toBeTruthy();
  });

  it('uses standard expand animation when origin params provided', async () => {
    const { findByTestId } = renderScreen({
      cardId: '42',
      originX: '20',
      originY: '100',
      originW: '350',
      originH: '200',
    });

    expect(await findByTestId('flashcard-detail-screen')).toBeTruthy();
  });

  it('uses budget animation when no origin params', async () => {
    const { findByTestId } = renderScreen({ cardId: '42' });
    expect(await findByTestId('flashcard-detail-screen')).toBeTruthy();
  });
});
