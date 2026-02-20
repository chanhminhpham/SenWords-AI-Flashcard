// First Session Screen — First 5-card learning session after onboarding (Story 1.8)
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native-paper';

import { BaseSwipeCard } from '@/components/features/flashcard/BaseSwipeCard';
import { UndoSnackbar } from '@/components/ui/UndoSnackbar';
import {
  adjustSchedule,
  FIRST_SESSION_CARD_COUNT,
  logLearningEvent,
  logUndoEvent,
  revertScheduleAdjustment,
  selectFirstSessionWords,
  type ScheduleSnapshot,
} from '@/services/sr/sr.service';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useLearningEngine } from '@/stores/learning-engine.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAppTheme } from '@/theme/use-app-theme';

export default function FirstSessionScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const determinedLevel = useOnboardingStore((s) => s.determinedLevel);
  const selectedGoal = useOnboardingStore((s) => s.selectedGoal);
  const featureUnlock = useOnboardingStore((s) => s.featureUnlock);
  const deviceTier = useAppStore((s) => s.deviceTier);

  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showUndo, setShowUndo] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<ScheduleSnapshot | undefined>();
  const [lastIsFirstReview, setLastIsFirstReview] = useState(false);
  const hasSwipedOnce = useRef(false);
  const knownCountRef = useRef(0);
  const isBeginner = featureUnlock?.largerFonts === true;

  const { loadQueue, recordSwipe, undoLastSwipe, getCurrentCard, getQueueProgress, undoBuffer } =
    useLearningEngine();

  // Load first session words on mount
  useEffect(() => {
    if (determinedLevel === null) return;

    const words = selectFirstSessionWords(determinedLevel, selectedGoal);

    if (words.length === 0) {
      setIsEmpty(true);
      setIsLoading(false);
      return;
    }

    loadQueue(words);
    setIsLoading(false);
  }, [determinedLevel, selectedGoal, loadQueue]);

  const currentCard = getCurrentCard();
  const { current, total } = getQueueProgress();

  // Handle swipe action
  const handleSwipe = useCallback(
    (cardId: number, direction: 'left' | 'right' | 'up') => {
      if (!currentUser?.id) return;

      // Dismiss tooltip on first swipe (standard users)
      if (!hasSwipedOnce.current && !isBeginner) {
        setShowTooltip(false);
      }
      hasSwipedOnce.current = true;

      try {
        recordSwipe(cardId, direction);

        if (direction === 'right') {
          knownCountRef.current += 1;
        }

        if (direction === 'left' || direction === 'right') {
          logLearningEvent(cardId, currentUser.id, direction);

          const scheduleResult = adjustSchedule({
            cardId,
            userId: currentUser.id,
            response: direction === 'right' ? 'know' : 'dontKnow',
          });

          if (scheduleResult.success) {
            setLastSnapshot(scheduleResult.previousState);
            setLastIsFirstReview(scheduleResult.isFirstReview ?? false);
          }
        }

        setShowUndo(true);

        // Check if session complete (after advancing index)
        const nextProgress = current + 1;
        if (nextProgress > FIRST_SESSION_CARD_COUNT || nextProgress > total) {
          // Small delay for last card animation
          setTimeout(() => {
            const allKnown = direction === 'right' && knownCountRef.current >= total;
            router.replace(`/(auth)/celebration?allKnown=${allKnown ? 'true' : 'false'}` as Href);
          }, 400);
        }
      } catch (error) {
        console.error('[FirstSession] Error in handleSwipe:', error);
      }
    },
    [currentUser, recordSwipe, current, total, isBeginner]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!undoBuffer || !currentUser?.id) return;

    try {
      // Track known count revert
      if (undoBuffer.direction === 'right') {
        knownCountRef.current = Math.max(0, knownCountRef.current - 1);
      }

      undoLastSwipe();
      setShowUndo(false);

      if (undoBuffer.direction !== 'up') {
        revertScheduleAdjustment(
          undoBuffer.cardId,
          currentUser.id,
          lastSnapshot,
          lastIsFirstReview
        );
        logUndoEvent(undoBuffer.cardId, currentUser.id);
      }

      setLastSnapshot(undefined);
      setLastIsFirstReview(false);
    } catch (error) {
      console.error('[FirstSession] Error in handleUndo:', error);
    }
  }, [undoBuffer, undoLastSwipe, currentUser, lastSnapshot, lastIsFirstReview]);

  // Dismiss tooltip for beginner (tap)
  const handleTooltipDismiss = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        testID="first-session-loading">
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
          {t('firstSession.loading')}
        </Text>
      </View>
    );
  }

  // Empty guard — no words in DB
  if (isEmpty) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        testID="first-session-empty">
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.error, textAlign: 'center', paddingHorizontal: 32 }}>
          {t('firstSession.emptyError')}
        </Text>
      </View>
    );
  }

  // Session complete (cards exhausted but not yet navigated)
  if (!currentCard) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        testID="first-session-complete">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="first-session-screen">
      {/* Progress counter */}
      <View style={styles.counterContainer}>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
          testID="first-session-counter">
          {t('firstSession.counter', { current, total })}
        </Text>
      </View>

      {/* Flashcard stack */}
      <View style={styles.cardContainer}>
        <BaseSwipeCard
          key={currentCard.id}
          card={currentCard}
          variant="learning"
          onSwipe={handleSwipe}
          allowSwipeUp={false}
          testID="first-session-card"
        />
      </View>

      {/* Tooltip — inline conditional render per story spec */}
      {showTooltip && (
        <Pressable
          style={[
            styles.tooltipOverlay,
            deviceTier === 'budget' ? undefined : styles.tooltipAnimated,
          ]}
          onPress={handleTooltipDismiss}
          accessibilityLabel={t('accessibility.firstSessionTooltip')}
          accessibilityRole="text"
          testID="first-session-tooltip">
          <View style={[styles.tooltipBox, { backgroundColor: theme.colors.inverseSurface }]}>
            <Text
              variant="bodyLarge"
              style={[
                styles.tooltipText,
                { color: theme.colors.inverseOnSurface },
                isBeginner && styles.tooltipTextBeginner,
              ]}>
              {t('firstSession.tooltip')}
            </Text>
            {isBeginner && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.inverseOnSurface, marginTop: 8, opacity: 0.7 }}>
                {t('firstSession.tooltipDismiss')}
              </Text>
            )}
          </View>
        </Pressable>
      )}

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
    top: 60,
    right: 16,
    zIndex: 10,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 20,
  },
  tooltipAnimated: {
    opacity: 0.95,
  },
  tooltipBox: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  tooltipText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  tooltipTextBeginner: {
    fontSize: 18,
  },
});
