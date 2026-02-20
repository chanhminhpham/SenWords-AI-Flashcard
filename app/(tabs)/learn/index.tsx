// Learn Screen — Core learning loop with flashcard swipe interaction (Story 1.6 → 1.7)
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native-paper';

import { useTranslation } from 'react-i18next';

import { BaseSwipeCard } from '@/components/features/flashcard/BaseSwipeCard';
import { UndoSnackbar } from '@/components/ui/UndoSnackbar';
import { useAuthStore } from '@/stores/auth.store';
import { useLearningEngine } from '@/stores/learning-engine.store';
import { useAppTheme } from '@/theme';
import {
  adjustSchedule,
  logLearningEvent,
  logUndoEvent,
  revertScheduleAdjustment,
  fetchSRQueue,
  BURNOUT_WARNING_THRESHOLD,
  type ScheduleSnapshot,
} from '@/services/sr/sr.service';

/**
 * Learn Screen — Core flashcard swipe interaction.
 *
 * Features:
 * - Load SR queue from SQLite (pre-cached, offline-first)
 * - Display flashcards in stack (2 visible, 3rd lazy-loaded)
 * - Swipe right (know) / left (don't know) gesture handling
 * - Undo functionality (3-second window)
 * - Queue info: "N từ cần ôn (~X phút)" (AC3)
 * - Burnout warning when > 80 cards due (AC6)
 * - Empty state when queue exhausted
 */
export default function LearnScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);

  const [showUndo, setShowUndo] = useState(false);
  // F10: Only the most recent snapshot is stored. The undo buffer in
  // learning-engine.store enforces single-undo (3-second window, one action),
  // so multiple rapid swipes safely overwrite this — only the latest is undoable.
  const [lastSnapshot, setLastSnapshot] = useState<ScheduleSnapshot | undefined>();
  const [lastIsFirstReview, setLastIsFirstReview] = useState(false);
  // F1: Use ref instead of state to avoid infinite re-render loop
  const prefetchedRef = useRef<Set<number>>(new Set());

  const { loadQueue, recordSwipe, undoLastSwipe, getCurrentCard, getQueueProgress, undoBuffer } =
    useLearningEngine();

  // Fetch SR queue from SQLite via real SM-2 queue logic
  const { data: srQueueResult, isLoading } = useQuery({
    queryKey: ['learning', 'queue', currentUser?.id],
    queryFn: () => fetchSRQueue(currentUser?.id ?? ''),
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load queue into store when data arrives
  useEffect(() => {
    if (srQueueResult && srQueueResult.cards.length > 0) {
      loadQueue(srQueueResult.cards);

      // Prefetch first 3 card images (if they have images)
      srQueueResult.cards.slice(0, 3).forEach((card) => {
        if (card.exampleSentence && !prefetchedRef.current.has(card.id)) {
          prefetchedRef.current.add(card.id);
        }
      });
    }
  }, [srQueueResult, loadQueue]);

  const currentCard = getCurrentCard();
  const { current, total } = getQueueProgress();

  // Handle swipe action
  const handleSwipe = useCallback(
    (cardId: number, direction: 'left' | 'right' | 'up') => {
      if (!currentUser?.id) return;

      try {
        // Record swipe in store (advances to next card, sets undo buffer)
        recordSwipe(cardId, direction);

        // F9: Only log CARD_REVIEWED events for left/right (actual reviews).
        // Swipe-up is a peek/explore gesture — not a review action.
        if (direction === 'left' || direction === 'right') {
          // Log event to SQLite
          const eventResult = logLearningEvent(cardId, currentUser.id, direction);
          if (!eventResult.success) {
            console.error('[Learn] Failed to log event:', eventResult.error);
          }

          // Adjust SR schedule via SM-2 algorithm
          const scheduleResult = adjustSchedule({
            cardId,
            userId: currentUser.id,
            response: direction === 'right' ? 'know' : 'dontKnow',
          });

          if (scheduleResult.success) {
            // Store snapshot for undo
            setLastSnapshot(scheduleResult.previousState);
            setLastIsFirstReview(scheduleResult.isFirstReview ?? false);
          } else {
            console.error('[Learn] Failed to adjust schedule:', scheduleResult.error);
          }
        }

        // Show undo snackbar
        setShowUndo(true);
      } catch (error) {
        console.error('[Learn] Unexpected error in handleSwipe:', error);
        setShowUndo(true);
      }
    },
    [currentUser, recordSwipe]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!undoBuffer || !currentUser?.id) return;

    try {
      // Revert UI state first (immediate feedback)
      undoLastSwipe();
      setShowUndo(false);

      // Revert SR schedule + log compensating event (F2)
      if (undoBuffer.direction !== 'up') {
        const revertResult = revertScheduleAdjustment(
          undoBuffer.cardId,
          currentUser.id,
          lastSnapshot,
          lastIsFirstReview
        );

        if (!revertResult.success) {
          console.error('[Learn] Failed to revert schedule:', revertResult.error);
        }

        // F2: Log compensating event to keep learning_events consistent
        logUndoEvent(undoBuffer.cardId, currentUser.id);
      }

      setLastSnapshot(undefined);
      setLastIsFirstReview(false);
    } catch (error) {
      console.error('[Learn] Unexpected error in handleUndo:', error);
    }
  }, [undoBuffer, undoLastSwipe, currentUser, lastSnapshot, lastIsFirstReview]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('learn.loading', 'Đang tải...')}
        </Text>
      </View>
    );
  }

  // Empty state — no cards to review
  if (!currentCard) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={64}
          color={theme.colors.feedback.know}
        />
        <Text
          variant="headlineSmall"
          style={{ marginTop: 16, color: theme.colors.onBackground, textAlign: 'center' }}>
          {t('learn.empty', 'Bạn đã ôn hết! 🌿')}
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            marginTop: 8,
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}>
          {t('learn.emptySubtitle', 'Nghỉ ngơi, gặp lại sau')}
        </Text>
      </View>
    );
  }

  const showWarning = srQueueResult != null && srQueueResult.totalDue >= BURNOUT_WARNING_THRESHOLD;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Queue info header */}
      <View style={styles.headerContainer}>
        {srQueueResult && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('learn.queueInfo', 'Hôm nay bạn có {{count}} từ cần ôn (~{{minutes}} phút)', {
              count: srQueueResult.dueCount + srQueueResult.newCount,
              minutes: srQueueResult.estimatedMinutes,
            })}
          </Text>
        )}
        {showWarning && (
          <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
            {t('learn.queueWarning')}
          </Text>
        )}
      </View>

      {/* Progress counter */}
      <View style={styles.counterContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('learn.counter', '{{current}}/{{total}} từ hôm nay', { current, total })}
        </Text>
      </View>

      {/* Flashcard stack */}
      <View style={styles.cardContainer}>
        <BaseSwipeCard
          card={currentCard}
          variant="learning"
          onSwipe={handleSwipe}
          allowSwipeUp={false}
        />
      </View>

      {/* Undo snackbar */}
      <UndoSnackbar visible={showUndo} onDismiss={() => setShowUndo(false)} onUndo={handleUndo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  counterContainer: {
    position: 'absolute',
    top: 56,
    right: 16,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
