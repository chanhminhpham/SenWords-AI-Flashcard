// Tutorial card shown before placement test — demonstrates swipe gestures
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 40;

interface SwipeTutorialCardProps {
  onComplete: () => void;
}

export function SwipeTutorialCard({ onComplete }: SwipeTutorialCardProps) {
  const translateX = useSharedValue(0);
  const handX = useSharedValue(0);
  const [practiced, setPracticed] = useState(false);
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());
  const theme = useAppTheme();

  // Animate hand icon hint (left-right sway)
  useEffect(() => {
    if (reduceMotion) return;
    handX.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(-40, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [handX, reduceMotion]);

  const handlePracticeComplete = useCallback(() => {
    setPracticed(true);
    // Small delay so user sees the card fly away
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD || e.translationX < -SWIPE_THRESHOLD) {
        const direction = e.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        translateX.value = reduceMotion ? direction : withSpring(direction, { damping: 20 });
        runOnJS(handlePracticeComplete)();
      } else {
        translateX.value = reduceMotion ? 0 : withSpring(0, { damping: 20 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedHandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: handX.value }],
  }));

  if (practiced) return null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID="swipe-tutorial-card"
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.nature.tint,
            borderColor: theme.colors.nature.accent,
          },
          animatedCardStyle,
        ]}>
        <View style={styles.content}>
          <Animated.View style={animatedHandStyle}>
            <Text style={styles.handIcon} testID="hand-icon">
              👆
            </Text>
          </Animated.View>
          <Text style={[styles.instruction, { color: theme.colors.onSurface }]}>
            Vuốt phải nếu bạn BIẾT từ này, vuốt trái nếu CHƯA BIẾT
          </Text>
          <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            Hãy thử vuốt thẻ này!
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
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  handIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
