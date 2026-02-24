// Learn Screen — Core learning loop with flashcard swipe interaction (Story 1.6 → 2.2)
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native-paper';

import { useTranslation } from 'react-i18next';

import { BaseSwipeCard } from '@/components/features/flashcard/BaseSwipeCard';
import { WordFamilyChip } from '@/components/features/flashcard/WordFamilyChip';
import { WordFamilySheet } from '@/components/features/flashcard/WordFamilySheet';
import { DiscoveryTooltip } from '@/components/ui/DiscoveryTooltip';
import { UndoSnackbar } from '@/components/ui/UndoSnackbar';
import { getFeatureUnlockState } from '@/constants/onboarding';
import { hapticExplore } from '@/services/haptics';
import { fetchUserLevel } from '@/services/vocabulary/vocabulary.service';
import type { WordFamilyWithMembers } from '@/types/vocabulary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
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

// Nature Path gradient: light green → warm → white
const GRADIENT_COLORS = ['#E8F4ED', '#FFF8F0', '#FFFFFF'] as const;
const GRADIENT_LOCATIONS = [0, 0.5, 1] as const;

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
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);

  const [showUndo, setShowUndo] = useState(false);
  const [wordFamilySheet, setWordFamilySheet] = useState<{
    data: WordFamilyWithMembers;
    cardId: number;
  } | null>(null);
  // F10: Only the most recent snapshot is stored. The undo buffer in
  // learning-engine.store enforces single-undo (3-second window, one action),
  // so multiple rapid swipes safely overwrite this — only the latest is undoable.
  const [lastSnapshot, setLastSnapshot] = useState<ScheduleSnapshot | undefined>();
  const [lastIsFirstReview, setLastIsFirstReview] = useState(false);
  // F1: Use ref instead of state to avoid infinite re-render loop
  const prefetchedRef = useRef<Set<number>>(new Set());
  // Story 2.2: Cache card resting bounds for card-expand transition
  const cardBoundsRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const cardViewRef = useRef<View>(null);
  const deviceTier = useAppStore((s) => s.deviceTier);

  const { loadQueue, recordSwipe, undoLastSwipe, getCurrentCard, getQueueProgress, undoBuffer } =
    useLearningEngine();

  // Story 2.2: Fetch user level to determine swipe-up unlock
  const { data: userLevel } = useQuery({
    queryKey: ['user-level', currentUser?.id],
    queryFn: () => fetchUserLevel(currentUser?.id ?? ''),
    enabled: !!currentUser?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const swipeUpEnabled = getFeatureUnlockState(userLevel ?? 0).swipeUpEnabled;

  // Story 2.2: Discovery hint for first-time swipe-up
  const [showSwipeUpHint, setShowSwipeUpHint] = useState(false);

  useEffect(() => {
    if (swipeUpEnabled) {
      AsyncStorage.getItem('hint_swipe_up_shown').then((value) => {
        if (value !== 'true') {
          setShowSwipeUpHint(true);
        }
      });
    }
  }, [swipeUpEnabled]);

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

  // Story 2.2: Handle swipe-up to navigate to detail view
  const handleSwipeUp = useCallback(
    (cardId: number) => {
      hapticExplore();
      if (deviceTier === 'standard') {
        const { x, y, width, height } = cardBoundsRef.current;
        router.push({
          pathname: '/(tabs)/learn/[cardId]',
          params: {
            cardId: String(cardId),
            originX: String(x),
            originY: String(y),
            originW: String(width),
            originH: String(height),
          },
        });
      } else {
        router.push({
          pathname: '/(tabs)/learn/[cardId]',
          params: { cardId: String(cardId) },
        });
      }
    },
    [deviceTier]
  );

  // Handle swipe action
  const handleSwipe = useCallback(
    (cardId: number, direction: 'left' | 'right' | 'up') => {
      if (!currentUser?.id) return;

      // Story 2.2: Swipe-up navigates to detail — don't record as review
      if (direction === 'up') {
        handleSwipeUp(cardId);
        return;
      }

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
    [currentUser, recordSwipe, handleSwipeUp]
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
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        style={styles.container}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('learn.loading', 'Đang tải...')}
        </Text>
      </LinearGradient>
    );
  }

  // Empty state — no cards to review
  if (!currentCard) {
    return (
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        style={styles.container}>
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
      </LinearGradient>
    );
  }

  const showWarning = srQueueResult != null && srQueueResult.totalDue >= BURNOUT_WARNING_THRESHOLD;

  // Progress dots: show up to 9 segments (matching design)
  const dotCount = Math.min(total, 9);

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      locations={GRADIENT_LOCATIONS}
      style={styles.container}>
      {/* Nature Path header: streak badge (left) + progress counter (right) */}
      <View style={[styles.headerRow, { top: insets.top + 8 }]}>
        <View style={[styles.streakBadge, { backgroundColor: theme.colors.nature.tint }]}>
          <Text style={[styles.streakText, { color: theme.colors.nature.accent }]}>
            🌿 {t('learn.streak', '{{days}} ngày', { days: 1 })}
          </Text>
        </View>
        <Text style={[styles.counterText, { color: theme.colors.nature.accent }]}>
          {current}/{total} 🌸
        </Text>
      </View>

      {/* Burnout warning */}
      {showWarning && (
        <View style={[styles.warningContainer, { top: insets.top + 48 }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            {t('learn.queueWarning')}
          </Text>
        </View>
      )}

      {/* Story 2.2: Discovery hint for swipe-up */}
      {showSwipeUpHint && (
        <View style={{ position: 'absolute', top: insets.top + 80, left: 0, right: 0, zIndex: 20 }}>
          <DiscoveryTooltip
            message={t('learn.hint.swipeUp')}
            a11yMessage={t('learn.hint.swipeUpA11y')}
            storageKey="hint_swipe_up_shown"
            visible={showSwipeUpHint}
            onDismiss={() => setShowSwipeUpHint(false)}
          />
        </View>
      )}

      {/* Flashcard stack */}
      <View
        style={styles.cardContainer}
        ref={cardViewRef}
        onLayout={() => {
          cardViewRef.current?.measureInWindow((x, y, width, height) => {
            cardBoundsRef.current = { x, y, width, height };
          });
        }}>
        <BaseSwipeCard
          key={currentCard.id}
          card={currentCard}
          variant="learning"
          onSwipe={handleSwipe}
          allowSwipeUp={swipeUpEnabled}
          renderOverlay={(card) => (
            <WordFamilyChip
              cardId={card.id}
              onOpenSheet={(data) => setWordFamilySheet({ data, cardId: card.id })}
            />
          )}
        />
      </View>

      {/* Progress dots + journey text */}
      <View style={[styles.progressArea, { bottom: insets.bottom + 80 }]}>
        <View style={styles.dotRow}>
          {Array.from({ length: dotCount }, (_, i) => {
            let bg: string;
            if (i < current - 1)
              bg = theme.colors.feedback.know; // completed
            else if (i === current - 1)
              bg = theme.colors.sky.blue; // current
            else bg = '#DDD'; // remaining
            return <View key={i} style={[styles.progressDot, { backgroundColor: bg }]} />;
          })}
        </View>
        <Text style={styles.journeyText}>
          {t('learn.journeyStep', 'Bước {{step}} trên hành trình hôm nay', { step: current })}
        </Text>
      </View>

      {/* Undo snackbar */}
      <UndoSnackbar visible={showUndo} onDismiss={() => setShowUndo(false)} onUndo={handleUndo} />

      {/* Word Family bottom sheet — rendered outside card to avoid overflow:hidden clipping */}
      {wordFamilySheet && (
        <WordFamilySheet
          data={wordFamilySheet.data}
          currentCardId={wordFamilySheet.cardId}
          onClose={() => setWordFamilySheet(null)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  warningContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  journeyText: {
    fontSize: 11,
    color: '#999',
  },
});
