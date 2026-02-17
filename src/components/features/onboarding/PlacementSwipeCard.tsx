// Simplified swipe card for placement test (Story 1.4)
// Full BaseSwipeCard with all variants will be created in Story 1.6
import { useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { PlacementWord, SwipeResponse } from '@/types/onboarding';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 40;

interface PlacementSwipeCardProps {
  word: PlacementWord;
  onSwipe: (wordId: string, response: SwipeResponse) => void;
}

export function PlacementSwipeCard({ word, onSwipe }: PlacementSwipeCardProps) {
  const translateX = useSharedValue(0);
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());
  const theme = useAppTheme();

  const handleSwipeComplete = useCallback(
    (direction: SwipeResponse) => {
      onSwipe(word.id, direction);
    },
    [onSwipe, word.id]
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = reduceMotion ? SCREEN_WIDTH : withSpring(SCREEN_WIDTH, { damping: 20 });
        runOnJS(handleSwipeComplete)('know');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = reduceMotion
          ? -SCREEN_WIDTH
          : withSpring(-SCREEN_WIDTH, { damping: 20 });
        runOnJS(handleSwipeComplete)('dontKnow');
      } else {
        translateX.value = reduceMotion ? 0 : withSpring(0, { damping: 20 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15])}deg`,
      },
    ],
  }));

  const knowOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 2], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  }));

  const dontKnowOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 2, 0], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID="placement-swipe-card"
        style={[styles.card, { backgroundColor: theme.colors.background }, animatedStyle]}>
        {/* Know overlay (green) */}
        <Animated.View
          testID="know-overlay"
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.feedback.know },
            knowOverlayStyle,
          ]}
        />
        {/* Don't know overlay (orange) */}
        <Animated.View
          testID="dont-know-overlay"
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.feedback.dontKnow },
            dontKnowOverlayStyle,
          ]}
        />

        <View style={styles.content}>
          <Text style={[styles.word, { color: theme.colors.onSurface }]}>{word.word}</Text>
          <Text style={[styles.translation, { color: theme.colors.onSurfaceVariant }]}>
            {word.translation}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.85,
    minHeight: 220,
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
    opacity: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  translation: {
    fontSize: 16,
  },
});
