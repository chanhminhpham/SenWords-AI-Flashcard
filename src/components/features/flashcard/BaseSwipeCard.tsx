// BaseSwipeCard — GOLDEN FILE for all swipeable flashcard interactions (Story 1.6)
// Sets pattern template for gesture handling, animations, and state management
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTranslation } from 'react-i18next';

import { KnowledgeDot } from '@/components/ui/KnowledgeDot';
import { hapticSwipeComplete } from '@/services/haptics';
import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { VocabularyCard } from '@/types/vocabulary';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80; // 80px threshold per Story 1.6 spec
const BOUNCE_DISTANCE = 20; // Visual feedback for disabled gestures

/** Map difficultyLevel (0-6) → CEFR label */
const CEFR_LABELS: Record<number, string> = {
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'B2',
  5: 'C1',
  6: 'C2',
};

export type SwipeDirection = 'right' | 'left' | 'up';

export interface BaseSwipeCardProps {
  card: VocabularyCard;
  variant: 'learning' | 'preview' | 'detail';
  onSwipe: (cardId: number, direction: SwipeDirection) => void;
  allowSwipeUp?: boolean; // Progressive unlock: false for Beginner level
  depthLevel?: number; // SR depth level (1-4), from sr_schedule
  testID?: string;
}

/**
 * BaseSwipeCard — Core swipeable flashcard component (GOLDEN FILE).
 *
 * Features:
 * - Right swipe (know): Green tint + haptic feedback
 * - Left swipe (don't know): Amber tint + haptic feedback
 * - Up swipe: Disabled for Beginner level (bounce back)
 * - Device tier awareness: Simplified animations on budget devices
 * - Reduce motion support
 * - Accessibility compliant (44x44pt touch targets, Vietnamese labels)
 *
 * Established patterns (DO NOT deviate):
 * - Gesture Handler v2 Pan gesture with runOnJS
 * - Reanimated 3 shared values + useAnimatedStyle
 * - Native driver for 60fps performance
 * - Overlay opacity interpolation for visual feedback
 */
export function BaseSwipeCard({
  card,
  variant,
  onSwipe,
  allowSwipeUp = false,
  depthLevel = 1,
  testID = 'base-swipe-card',
}: BaseSwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [isComplete, setIsComplete] = useState(false);

  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());
  const deviceTier = useAppStore((s) => s.deviceTier);
  const theme = useAppTheme();
  const { t } = useTranslation();

  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection) => {
      setIsComplete(true);
      hapticSwipeComplete();
      onSwipe(card.id, direction);
    },
    [onSwipe, card.id]
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Allow horizontal movement always
      translateX.value = e.translationX;

      // Vertical movement: only if swipe up is allowed
      if (allowSwipeUp) {
        translateY.value = e.translationY;
      } else {
        // Bounce back for disabled swipe up
        translateY.value = e.translationY < 0 ? Math.max(e.translationY, -BOUNCE_DISTANCE) : 0;
      }
    })
    .onEnd((e) => {
      const isHorizontalSwipe = Math.abs(e.translationX) > Math.abs(e.translationY);

      // Right swipe (know)
      if (e.translationX > SWIPE_THRESHOLD && isHorizontalSwipe) {
        translateX.value = reduceMotion
          ? SCREEN_WIDTH
          : withTiming(SCREEN_WIDTH, { duration: 300 });
        runOnJS(handleSwipeComplete)('right');
        return;
      }

      // Left swipe (don't know)
      if (e.translationX < -SWIPE_THRESHOLD && isHorizontalSwipe) {
        translateX.value = reduceMotion
          ? -SCREEN_WIDTH
          : withTiming(-SCREEN_WIDTH, { duration: 300 });
        runOnJS(handleSwipeComplete)('left');
        return;
      }

      // Up swipe (explore) — only if allowed
      if (e.translationY < -SWIPE_THRESHOLD && !isHorizontalSwipe && allowSwipeUp) {
        translateY.value = reduceMotion
          ? -SCREEN_WIDTH
          : withTiming(-SCREEN_WIDTH, { duration: 300 });
        runOnJS(handleSwipeComplete)('up');
        return;
      }

      // Bounce back to center
      // Budget devices: use timing instead of spring for performance
      if (reduceMotion) {
        translateX.value = 0;
        translateY.value = 0;
      } else if (deviceTier === 'budget') {
        translateX.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(0, { duration: 150 });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    // Budget devices: no rotation, only translate
    const rotation =
      deviceTier === 'budget'
        ? 0
        : interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15]);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const knowOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 2], [0, 0.3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  }));

  const dontKnowOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 2, 0], [0.3, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  }));

  const exploreOverlayStyle = useAnimatedStyle(() => ({
    opacity: allowSwipeUp
      ? interpolate(translateY.value, [-SWIPE_THRESHOLD * 2, 0], [0.3, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0,
  }));

  // Don't render if swipe is complete (card flying off screen)
  if (isComplete) {
    return null;
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID={testID}
        accessible={true}
        accessibilityLabel={`${card.word} — ${card.definition}`}
        accessibilityHint={t('accessibility.swipeCardHint')}
        style={[styles.card, { backgroundColor: theme.colors.background }, animatedCardStyle]}>
        {/* Know overlay (green) */}
        <Animated.View
          testID="know-overlay"
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.feedback.know },
            knowOverlayStyle,
          ]}
        />

        {/* Don't know overlay (amber) */}
        <Animated.View
          testID="dont-know-overlay"
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.feedback.dontKnow },
            dontKnowOverlayStyle,
          ]}
        />

        {/* Explore overlay (purple) — only if swipe up allowed */}
        {allowSwipeUp && (
          <Animated.View
            testID="explore-overlay"
            style={[
              styles.overlay,
              { backgroundColor: theme.colors.feedback.explore },
              exploreOverlayStyle,
            ]}
          />
        )}

        {/* Card content */}
        <View style={styles.content}>
          {/* Depth indicator (top-right) */}
          <View style={styles.dotContainer}>
            <KnowledgeDot depthLevel={depthLevel} size={8} />
            <Text style={[styles.depthLabel, { color: theme.colors.onSurfaceVariant }]}>
              {t('learn.depth', 'Tầng {{level}}', { level: depthLevel })}
            </Text>
          </View>

          {/* IPA pronunciation */}
          {card.ipa && (
            <Text style={[styles.ipa, { color: theme.colors.nature.accent }]}>{card.ipa}</Text>
          )}

          {/* Word (headword) */}
          <Text style={[styles.word, { color: theme.colors.onSurface }]}>{card.word}</Text>

          {/* Definition (Vietnamese) */}
          <Text style={[styles.definition, { color: theme.colors.onSurfaceVariant }]}>
            {card.definition}
          </Text>

          {/* Tags: part of speech + CEFR level */}
          <View style={styles.tagRow}>
            {card.partOfSpeech && (
              <View style={[styles.tag, { backgroundColor: theme.colors.nature.tint }]}>
                <Text style={[styles.tagText, { color: theme.colors.nature.accent }]}>
                  {card.partOfSpeech}
                </Text>
              </View>
            )}
            {card.difficultyLevel != null && card.difficultyLevel > 0 && (
              <View style={[styles.tag, { backgroundColor: theme.colors.nature.warm }]}>
                <Text style={[styles.tagText, { color: theme.colors.feedback.dontKnowText }]}>
                  {CEFR_LABELS[card.difficultyLevel] ?? `L${card.difficultyLevel}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.85,
    minHeight: 320,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECBA0',
    elevation: 4,
    shadowColor: '#2D8A5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 320,
  },
  dotContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  depthLabel: {
    fontSize: 10,
  },
  ipa: {
    fontSize: 13,
    marginBottom: 8,
  },
  word: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  definition: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
