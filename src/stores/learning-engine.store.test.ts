import { act, renderHook } from '@testing-library/react-native';

import { useLearningEngine } from './learning-engine.store';

import type { VocabularyCard } from '@/types/vocabulary';

const mockCards: VocabularyCard[] = [
  {
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
  },
  {
    id: 2,
    word: 'goodbye',
    definition: 'tạm biệt',
    partOfSpeech: 'n.',
    ipa: null,
    exampleSentence: 'Goodbye, friend!',
    audioUrlAmerican: null,
    audioUrlBritish: null,
    imageUrl: null,
    difficultyLevel: 1,
    topicTags: ['greetings'],
    createdAt: '2024-01-01 00:00:00',
  },
  {
    id: 3,
    word: 'thanks',
    definition: 'cảm ơn',
    partOfSpeech: 'n.',
    ipa: null,
    exampleSentence: 'Thanks for your help!',
    audioUrlAmerican: null,
    audioUrlBritish: null,
    imageUrl: null,
    difficultyLevel: 1,
    topicTags: ['greetings'],
    createdAt: '2024-01-01 00:00:00',
  },
];

describe('useLearningEngine', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useLearningEngine());
    act(() => {
      result.current.resetSession();
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useLearningEngine());

    expect(result.current.queueCards).toEqual([]);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.undoBuffer).toBeNull();
  });

  it('loads queue from TanStack Query data', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    expect(result.current.queueCards).toEqual(mockCards);
    expect(result.current.currentIndex).toBe(0);
  });

  it('gets current card', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    const currentCard = result.current.getCurrentCard();
    expect(currentCard).toEqual(mockCards[0]);
  });

  it('records swipe and advances to next card', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    act(() => {
      result.current.recordSwipe(1, 'right');
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.getCurrentCard()).toEqual(mockCards[1]);
    expect(result.current.undoBuffer).toMatchObject({
      cardId: 1,
      direction: 'right',
    });
  });

  it('sets undo buffer with 3-second timeout', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    act(() => {
      result.current.recordSwipe(1, 'right');
    });

    expect(result.current.undoBuffer).not.toBeNull();

    // Fast-forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.undoBuffer).toBeNull();

    jest.useRealTimers();
  });

  it('undoes last swipe', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    act(() => {
      result.current.recordSwipe(1, 'right');
    });

    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.undoLastSwipe();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.getCurrentCard()).toEqual(mockCards[0]);
    expect(result.current.undoBuffer).toBeNull();
  });

  it('does not undo if buffer is empty', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    const initialIndex = result.current.currentIndex;

    act(() => {
      result.current.undoLastSwipe();
    });

    expect(result.current.currentIndex).toBe(initialIndex);
  });

  it('gets queue progress', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    let progress = result.current.getQueueProgress();
    expect(progress).toEqual({ current: 1, total: 3 });

    act(() => {
      result.current.recordSwipe(1, 'right');
    });

    progress = result.current.getQueueProgress();
    expect(progress).toEqual({ current: 2, total: 3 });

    act(() => {
      result.current.recordSwipe(2, 'right');
    });

    progress = result.current.getQueueProgress();
    expect(progress).toEqual({ current: 3, total: 3 });
  });

  it('returns null when queue is exhausted', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    // Swipe through all cards
    act(() => {
      result.current.recordSwipe(1, 'right');
      result.current.recordSwipe(2, 'right');
      result.current.recordSwipe(3, 'right');
    });

    const currentCard = result.current.getCurrentCard();
    expect(currentCard).toBeNull();
  });

  it('resets session state', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
      result.current.recordSwipe(1, 'right');
    });

    act(() => {
      result.current.resetSession();
    });

    expect(result.current.queueCards).toEqual([]);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.undoBuffer).toBeNull();
  });

  it('clears undo buffer manually', () => {
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
      result.current.recordSwipe(1, 'right');
    });

    expect(result.current.undoBuffer).not.toBeNull();

    act(() => {
      result.current.clearUndoBuffer();
    });

    expect(result.current.undoBuffer).toBeNull();
  });

  it('clears existing timeout when recording new swipe', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useLearningEngine());

    act(() => {
      result.current.loadQueue(mockCards);
    });

    act(() => {
      result.current.recordSwipe(1, 'right');
    });

    const firstUndoBuffer = result.current.undoBuffer;

    act(() => {
      jest.advanceTimersByTime(1000); // 1 second
    });

    act(() => {
      result.current.recordSwipe(2, 'left');
    });

    // First timeout should be cleared, second should still be active
    expect(result.current.undoBuffer).not.toEqual(firstUndoBuffer);
    expect(result.current.undoBuffer?.cardId).toBe(2);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.undoBuffer).toBeNull();

    jest.useRealTimers();
  });
});
