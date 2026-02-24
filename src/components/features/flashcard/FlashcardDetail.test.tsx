/* eslint-disable @typescript-eslint/no-require-imports, import/first */

// Mock dependencies (NativeWind v4 limitation: external mock files required)
jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('react-native-tab-view', () => require('@/__test-utils__/tab-view-mock'));
jest.mock('react-native-pager-view', () => require('@/__test-utils__/pager-view-mock'));
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode; testID?: string }) =>
      require('react').createElement(View, props, children),
  };
});

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

const mockFetchCardById = jest.fn();
const mockFetchScheduleByCardId = jest.fn();

jest.mock('@/services/vocabulary/vocabulary.service', () => ({
  fetchCardById: (...args: unknown[]) => mockFetchCardById(...args),
  fetchScheduleByCardId: (...args: unknown[]) => mockFetchScheduleByCardId(...args),
}));

jest.mock('@/components/ui/KnowledgeDot', () => ({
  KnowledgeDot: ({ depthLevel }: { depthLevel: number }) => {
    const { View, Text } = require('react-native');
    return require('react').createElement(
      View,
      { testID: 'knowledge-dot' },
      require('react').createElement(Text, null, `depth-${depthLevel}`)
    );
  },
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FlashcardDetail } from './FlashcardDetail';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockCard = {
  id: 1,
  word: 'environment',
  definition: 'môi trường',
  partOfSpeech: 'noun',
  ipa: '/ɪnˈvaɪrənmənt/',
  exampleSentence: 'Protect the environment.',
  audioUrlAmerican: null,
  audioUrlBritish: null,
  imageUrl: null,
  difficultyLevel: 3,
  topicTags: ['nature', 'science'],
  createdAt: '2024-01-01 00:00:00',
};

const mockSchedule = {
  id: 1,
  cardId: 1,
  userId: 'test-user',
  depthLevel: 2,
  efactor: 2.5,
  interval: 6,
  repetitions: 3,
  nextReviewDate: '2024-02-01',
  lastReviewDate: '2024-01-25',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-25',
};

describe('FlashcardDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCardById.mockReturnValue(null);
    mockFetchScheduleByCardId.mockReturnValue(null);
  });

  it('renders loading skeleton initially', () => {
    mockFetchCardById.mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = renderWithProviders(<FlashcardDetail cardId={1} />);
    expect(getByTestId('card-header')).toBeTruthy();
  });

  it('renders card header with word and IPA after data loads', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(mockSchedule);

    const { findAllByText, getByTestId } = renderWithProviders(<FlashcardDetail cardId={1} />);

    // Word appears in both header and RecognitionTab
    const wordElements = await findAllByText('environment');
    expect(wordElements.length).toBeGreaterThanOrEqual(1);
    // IPA appears in both header and RecognitionTab
    const ipaElements = await findAllByText('/ɪnˈvaɪrənmənt/');
    expect(ipaElements.length).toBeGreaterThanOrEqual(1);
    expect(getByTestId('knowledge-dot')).toBeTruthy();
  });

  it('renders depth level text in header', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(mockSchedule);

    const { findByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    expect(await findByText('detail.depth')).toBeTruthy();
  });

  it('renders tab bar with 4 tabs', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findByTestId, getByTestId } = renderWithProviders(<FlashcardDetail cardId={1} />);

    await findByTestId('tab-view');
    expect(getByTestId('tab-bar')).toBeTruthy();
    expect(getByTestId('tab-recognition')).toBeTruthy();
    expect(getByTestId('tab-association')).toBeTruthy();
    expect(getByTestId('tab-production')).toBeTruthy();
    expect(getByTestId('tab-application')).toBeTruthy();
  });

  it('defaults to recognition tab (index 0)', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findByTestId } = renderWithProviders(<FlashcardDetail cardId={1} />);

    expect(await findByTestId('recognition-tab')).toBeTruthy();
  });

  it('renders RecognitionTab with word, definition, and POS badge', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findAllByText, findByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    // Word appears in both header and RecognitionTab
    const wordElements = await findAllByText('environment');
    expect(wordElements.length).toBeGreaterThanOrEqual(2);
    expect(await findByText('môi trường')).toBeTruthy();
    expect(await findByText('noun')).toBeTruthy();
  });

  it('renders example sentence in RecognitionTab', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    expect(await findByText('Protect the environment.')).toBeTruthy();
  });

  it('renders CEFR badge (B1 for difficultyLevel 3)', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    expect(await findByText('B1')).toBeTruthy();
  });

  it('renders topic tags in RecognitionTab', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    expect(await findByText('nature')).toBeTruthy();
    expect(await findByText('science')).toBeTruthy();
  });

  it('renders depth progress bar with 4 segments', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(mockSchedule);

    const { findByTestId } = renderWithProviders(<FlashcardDetail cardId={1} />);

    expect(await findByTestId('depth-segment-1')).toBeTruthy();
    expect(await findByTestId('depth-segment-2')).toBeTruthy();
    expect(await findByTestId('depth-segment-3')).toBeTruthy();
    expect(await findByTestId('depth-segment-4')).toBeTruthy();
  });

  it('defaults depthLevel to 1 when no schedule exists', async () => {
    mockFetchCardById.mockReturnValue(mockCard);
    mockFetchScheduleByCardId.mockReturnValue(null);

    const { findByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    // depth-1 comes from KnowledgeDot mock
    expect(await findByText('depth-1')).toBeTruthy();
  });

  it('returns null for RecognitionTab when card is null', () => {
    mockFetchCardById.mockReturnValue(null);

    const { queryByTestId } = renderWithProviders(<FlashcardDetail cardId={999} />);

    expect(queryByTestId('recognition-tab')).toBeNull();
  });

  it('renders IPA in RecognitionTab when available', async () => {
    mockFetchCardById.mockReturnValue(mockCard);

    const { findAllByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    // IPA appears in both header and RecognitionTab
    const ipaElements = await findAllByText('/ɪnˈvaɪrənmənt/');
    expect(ipaElements.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render IPA when null', async () => {
    const cardNoIpa = { ...mockCard, ipa: null };
    mockFetchCardById.mockReturnValue(cardNoIpa);

    const { findAllByText, queryByText } = renderWithProviders(<FlashcardDetail cardId={1} />);

    // Wait for card to load
    await findAllByText('environment');
    expect(queryByText('/ɪnˈvaɪrənmənt/')).toBeNull();
  });
});
