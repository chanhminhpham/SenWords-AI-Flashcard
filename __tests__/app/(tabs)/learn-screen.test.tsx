/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('@expo/vector-icons', () => require('@/__test-utils__/vector-icons'));

jest.mock('@/theme', () => ({
  useAppTheme: () => ({
    colors: {
      background: '#FFFFFF',
      primary: '#2D8A5E',
      onBackground: '#1A1D23',
      onSurfaceVariant: '#4A4E54',
      error: '#B00020',
      feedback: { know: '#4ECBA0' },
      nature: { accent: '#2D8A5E', tint: '#E8F4ED' },
      sky: { blue: '#4A9FE5' },
    },
  }),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({ user: { id: 'test-user', email: 'test@example.com' } })
  ),
}));

// Mock the learning engine store directly for deterministic rendering
const mockLoadQueue = jest.fn();
const mockRecordSwipe = jest.fn();
const mockUndoLastSwipe = jest.fn();
const mockGetCurrentCard = jest.fn().mockReturnValue(null);
const mockGetQueueProgress = jest.fn().mockReturnValue({ current: 1, total: 0 });

jest.mock('@/stores/learning-engine.store', () => ({
  useLearningEngine: () => ({
    loadQueue: mockLoadQueue,
    recordSwipe: mockRecordSwipe,
    undoLastSwipe: mockUndoLastSwipe,
    getCurrentCard: mockGetCurrentCard,
    getQueueProgress: mockGetQueueProgress,
    undoBuffer: null,
  }),
}));

// Mock SR service — control useQuery via mockFetchSRQueue
const mockFetchSRQueue = jest.fn();

jest.mock('@/services/sr/sr.service', () => ({
  adjustSchedule: jest.fn(() => ({ success: true, isFirstReview: true })),
  logLearningEvent: jest.fn(() => ({ success: true })),
  logUndoEvent: jest.fn(() => ({ success: true })),
  revertScheduleAdjustment: jest.fn(() => ({ success: true })),
  fetchSRQueue: mockFetchSRQueue,
  BURNOUT_WARNING_THRESHOLD: 80,
}));

jest.mock('@/components/features/flashcard/BaseSwipeCard', () =>
  require('@/__test-utils__/base-swipe-card-mock')
);

jest.mock('@/components/ui/UndoSnackbar', () => ({
  UndoSnackbar: () => null,
}));

import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { VocabularyCard } from '@/types/vocabulary';

import LearnScreen from '../../../app/(tabs)/learn/index';

const mockCard: VocabularyCard = {
  id: 1,
  word: 'hello',
  definition: 'xin chào',
  partOfSpeech: 'intj.',
  ipa: null,
  exampleSentence: 'Hello, world!',
  audioUrlAmerican: null,
  audioUrlBritish: null,
  imageUrl: null,
  difficultyLevel: 1,
  topicTags: ['greetings'],
  createdAt: '2024-01-01 00:00:00',
};

function renderLearnScreen() {
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
        <LearnScreen />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

describe('LearnScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSRQueue.mockReset();
    mockGetCurrentCard.mockReturnValue(null);
    mockGetQueueProgress.mockReturnValue({ current: 1, total: 0 });
  });

  it('shows loading state while fetching queue', () => {
    mockFetchSRQueue.mockImplementation(() => new Promise(() => {}));

    const { getByText } = renderLearnScreen();
    expect(getByText('learn.loading')).toBeTruthy();
  });

  it('shows empty state when no cards are due', async () => {
    mockFetchSRQueue.mockResolvedValue({
      cards: [],
      dueCount: 0,
      newCount: 0,
      estimatedMinutes: 0,
      totalDue: 0,
    });

    const { findByText } = renderLearnScreen();
    expect(await findByText('learn.empty')).toBeTruthy();
    expect(await findByText('learn.emptySubtitle')).toBeTruthy();
  });

  it('renders card view with counter after query resolves', async () => {
    mockFetchSRQueue.mockResolvedValue({
      cards: [mockCard],
      dueCount: 1,
      newCount: 0,
      estimatedMinutes: 1,
      totalDue: 1,
    });
    mockGetCurrentCard.mockReturnValue(mockCard);
    mockGetQueueProgress.mockReturnValue({ current: 1, total: 1 });

    const { findByText } = renderLearnScreen();
    // Streak badge is always present when card view renders
    expect(await findByText(/learn\.streak/)).toBeTruthy();
    // Card word renders via BaseSwipeCard mock
    expect(await findByText('hello')).toBeTruthy();
  });

  it('does not show burnout warning when totalDue < threshold', async () => {
    mockFetchSRQueue.mockResolvedValue({
      cards: [mockCard],
      dueCount: 10,
      newCount: 5,
      estimatedMinutes: 2,
      totalDue: 15,
    });
    mockGetCurrentCard.mockReturnValue(mockCard);
    mockGetQueueProgress.mockReturnValue({ current: 1, total: 1 });

    const { findByText, queryByText } = renderLearnScreen();
    await findByText(/learn\.streak/);
    expect(queryByText('learn.queueWarning')).toBeNull();
  });
});
