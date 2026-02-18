// Learn Screen — Core learning loop with flashcard swipe interaction (Story 1.6)
import { useCallback, useEffect, useState } from 'react';
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
import type { VocabularyCard } from '@/types/vocabulary';

import {
  adjustSchedule,
  logLearningEvent,
  revertScheduleAdjustment,
} from '@/services/sr/sr.service';

/**
 * Fetch SR queue from SQLite (placeholder — will be replaced with actual query in Story 1.7).
 * For now, returns empty array to demonstrate UI flow.
 */
async function fetchSRQueue(userId: string): Promise<VocabularyCard[]> {
  // Placeholder: Story 1.7 will implement actual SR queue fetching
  // For now, return empty array to allow testing UI without database
  console.log('Fetching SR queue for user:', userId);
  return [];
}

/**
 * Learn Screen — Core flashcard swipe interaction.
 *
 * Features:
 * - Load SR queue from SQLite (pre-cached, offline-first)
 * - Display flashcards in stack (2 visible, 3rd lazy-loaded)
 * - Swipe right (know) / left (don't know) gesture handling
 * - Undo functionality (3-second window)
 * - Empty state when queue exhausted
 * - Progress counter: "N/N từ hôm nay"
 */
export default function LearnScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);

  const [showUndo, setShowUndo] = useState(false);
  const [prefetchedImages, setPrefetchedImages] = useState<Set<number>>(new Set());

  const { loadQueue, recordSwipe, undoLastSwipe, getCurrentCard, getQueueProgress, undoBuffer } =
    useLearningEngine();

  // Fetch SR queue from SQLite
  const { data: srQueue, isLoading } = useQuery({
    queryKey: ['learning', 'queue', currentUser?.id],
    queryFn: () => fetchSRQueue(currentUser?.id ?? ''),
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load queue into store when data arrives
  useEffect(() => {
    if (srQueue && srQueue.length > 0) {
      loadQueue(srQueue);

      // Prefetch first 3 card images (if they have images)
      const imagesToPrefetch = srQueue.slice(0, 3).filter((card) => card.exampleSentence);
      imagesToPrefetch.forEach((card) => {
        if (card.exampleSentence && !prefetchedImages.has(card.id)) {
          // Placeholder: In real app, cards would have image URLs
          setPrefetchedImages((prev) => new Set(prev).add(card.id));
        }
      });
    }
  }, [srQueue, loadQueue, prefetchedImages]);

  const currentCard = getCurrentCard();
  const { current, total } = getQueueProgress();

  // Handle swipe action
  const handleSwipe = useCallback(
    async (cardId: number, direction: 'left' | 'right' | 'up') => {
      if (!currentUser?.id) return;

      try {
        // Record swipe in store (advances to next card, sets undo buffer)
        recordSwipe(cardId, direction);

        // Log event to SQLite
        const eventResult = await logLearningEvent(cardId, currentUser.id, direction);
        if (!eventResult.success) {
          console.error('[Learn] Failed to log event:', eventResult.error);
          // Continue anyway - event logging failure shouldn't block learning
        }

        // Adjust SR schedule (Story 1.6 placeholder logic)
        if (direction !== 'up') {
          const scheduleResult = await adjustSchedule({
            cardId,
            userId: currentUser.id,
            response: direction === 'right' ? 'know' : 'dontKnow',
          });

          if (!scheduleResult.success) {
            console.error('[Learn] Failed to adjust schedule:', scheduleResult.error);
            // Continue anyway - schedule failure shouldn't block learning
          }
        }

        // Show undo snackbar
        setShowUndo(true);
      } catch (error) {
        console.error('[Learn] Unexpected error in handleSwipe:', error);
        // Show undo anyway - user can still undo UI state
        setShowUndo(true);
      }
    },
    [currentUser, recordSwipe]
  );

  // Handle undo
  const handleUndo = useCallback(async () => {
    if (!undoBuffer || !currentUser?.id) return;

    try {
      // Revert UI state first (immediate feedback)
      undoLastSwipe();
      setShowUndo(false);

      // Revert SR schedule adjustment in database
      if (undoBuffer.direction !== 'up') {
        const revertResult = await revertScheduleAdjustment(undoBuffer.cardId, currentUser.id);

        if (!revertResult.success) {
          console.error('[Learn] Failed to revert schedule:', revertResult.error);
        }
      }

      // NOTE: learningEvents are immutable for audit trail
      // We don't delete CARD_REVIEWED events, only revert the SR schedule
      // Full undo history tracking will be implemented in Story 1.7
    } catch (error) {
      console.error('[Learn] Unexpected error in handleUndo:', error);
    }
  }, [undoBuffer, undoLastSwipe, currentUser]);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Progress counter */}
      <View style={styles.counterContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('learn.counter', '{{current}}/{{total}} từ hôm nay', { current, total })}
        </Text>
      </View>

      {/* Flashcard stack (currently showing 1 card, will add stack rendering in refactor) */}
      <View style={styles.cardContainer}>
        <BaseSwipeCard
          card={currentCard}
          variant="learning"
          onSwipe={handleSwipe}
          allowSwipeUp={false} // Beginner level: swipe up disabled
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
  counterContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
