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

export type SwipeDirection = 'right' | 'left' | 'up';

export interface BaseSwipeCardProps {
  card: VocabularyCard;
  variant: 'learning' | 'preview' | 'detail';
  onSwipe: (cardId: number, direction: SwipeDirection) => void;
  allowSwipeUp?: boolean; // Progressive unlock: false for Beginner level
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
          {/* KnowledgeDot */}
          <View style={styles.dotContainer}>
            {/* TODO Story 1.7: Derive state from card.masteryLevel or SR schedule accuracy */}
            <KnowledgeDot state="empty" size={8} />
          </View>

          {/* Word (headword) */}
          <Text style={[styles.word, { color: theme.colors.onSurface }]}>{card.word}</Text>

          {/* Definition (Vietnamese) */}
          <Text style={[styles.definition, { color: theme.colors.onSurfaceVariant }]}>
            {card.definition}
          </Text>

          {/* Part of Speech */}
          {card.partOfSpeech && (
            <Text style={[styles.partOfSpeech, { color: theme.colors.onSurfaceVariant }]}>
              ({card.partOfSpeech})
            </Text>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.85,
    minHeight: 280,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 280, // Ensure minimum touch target size
  },
  dotContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  word: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  definition: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  partOfSpeech: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
