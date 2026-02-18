// Learning Engine Store — Client-side learning session state (Story 1.6)
// DO NOT duplicate server data here. TanStack Query owns server state (vocabulary, SR schedule).
import { create } from 'zustand';

import type { VocabularyCard } from '@/types/vocabulary';

export interface UndoAction {
  cardId: number;
  direction: 'left' | 'right' | 'up';
  timestamp: number;
}

interface LearningEngineState {
  // Session state (transient, client-only)
  queueCards: VocabularyCard[];
  currentIndex: number;
  undoBuffer: UndoAction | null;
  undoTimeoutId: ReturnType<typeof setTimeout> | null;

  // Actions
  loadQueue: (cards: VocabularyCard[]) => void;
  recordSwipe: (cardId: number, direction: 'left' | 'right' | 'up') => void;
  undoLastSwipe: () => void;
  getCurrentCard: () => VocabularyCard | null;
  getQueueProgress: () => { current: number; total: number };
  resetSession: () => void;
  clearUndoBuffer: () => void;
}

/**
 * Learning Engine Store — Manages client-side learning session state.
 *
 * CRITICAL RULES:
 * - DO NOT store server data (vocabulary cards, SR schedules) permanently here
 * - TanStack Query = source of truth for server data
 * - This store = transient session state only (current card index, undo buffer)
 * - Cards are loaded from TanStack Query cache at session start
 * - Events are logged to SQLite immediately (not stored here)
 */
export const useLearningEngine = create<LearningEngineState>((set, get) => ({
  queueCards: [],
  currentIndex: 0,
  undoBuffer: null,
  undoTimeoutId: null,

  /**
   * Load queue from TanStack Query data at session start.
   * Called once when Learn screen mounts.
   */
  loadQueue: (cards) => {
    set({
      queueCards: cards,
      currentIndex: 0,
      undoBuffer: null,
      undoTimeoutId: null,
    });
  },

  /**
   * Record swipe action — advances to next card and sets undo buffer.
   * Event logging to SQLite happens in UI layer (not store responsibility).
   */
  recordSwipe: (cardId, direction) => {
    const { currentIndex, undoTimeoutId } = get();

    // Clear existing undo timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }

    // Set undo buffer (3-second window)
    const undoAction: UndoAction = {
      cardId,
      direction,
      timestamp: Date.now(),
    };

    const newTimeoutId = setTimeout(() => {
      get().clearUndoBuffer();
    }, 3000);

    set({
      currentIndex: currentIndex + 1,
      undoBuffer: undoAction,
      undoTimeoutId: newTimeoutId,
    });
  },

  /**
   * Undo last swipe — reverts to previous card.
   * Event reversal in SQLite happens in UI layer.
   */
  undoLastSwipe: () => {
    const { undoBuffer, currentIndex, undoTimeoutId } = get();

    if (!undoBuffer) {
      return; // No action to undo
    }

    // Clear timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }

    // Revert index
    set({
      currentIndex: Math.max(0, currentIndex - 1),
      undoBuffer: null,
      undoTimeoutId: null,
    });
  },

  /**
   * Get current card from queue.
   * Returns null if queue is exhausted.
   */
  getCurrentCard: () => {
    const { queueCards, currentIndex } = get();
    return queueCards[currentIndex] ?? null;
  },

  /**
   * Get queue progress for counter display.
   * Example: { current: 3, total: 20 } → "3/20 từ hôm nay"
   */
  getQueueProgress: () => {
    const { currentIndex, queueCards } = get();
    return {
      current: Math.min(currentIndex + 1, queueCards.length),
      total: queueCards.length,
    };
  },

  /**
   * Reset session state (used when exiting Learn screen).
   */
  resetSession: () => {
    const { undoTimeoutId } = get();
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    set({
      queueCards: [],
      currentIndex: 0,
      undoBuffer: null,
      undoTimeoutId: null,
    });
  },

  /**
   * Clear undo buffer (called after 3-second timeout).
   */
  clearUndoBuffer: () => {
    const { undoTimeoutId } = get();
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    set({
      undoBuffer: null,
      undoTimeoutId: null,
    });
  },
}));
