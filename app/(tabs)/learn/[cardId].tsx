// FlashcardDetail Screen — Depth exploration view (Story 2.2)
// Hybrid card-expand transition: standard = interpolation, budget = FadeIn
import { useEffect } from 'react';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { FlashcardDetail } from '@/components/features/flashcard/FlashcardDetail';
import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';

const SWIPE_DOWN_THRESHOLD_PX = 100;

// Expo Router requires default export for route files
export default function FlashcardDetailScreen() {
  const { cardId, originX, originY, originW, originH } = useLocalSearchParams<{
    cardId: string;
    originX?: string;
    originY?: string;
    originW?: string;
    originH?: string;
  }>();

  const numericId = Number(cardId);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());
  const deviceTier = useAppStore((s) => s.deviceTier);
  const theme = useAppTheme();
  const { t } = useTranslation();

  // ─── Standard tier: card-expand interpolation ─────────
  const hasOrigin = originX != null && originY != null && originW != null && originH != null;
  const isStandardExpand = deviceTier === 'standard' && hasOrigin && !reduceMotion;

  const progress = useSharedValue(isStandardExpand ? 0 : 1);

  useEffect(() => {
    if (isStandardExpand) {
      progress.value = withTiming(1, {
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
      });
    }
  }, [isStandardExpand, progress]);

  const expandStyle = useAnimatedStyle(() => {
    if (!isStandardExpand) return {};

    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: interpolate(progress.value, [0, 1], [Number(originW), screenW]),
      height: interpolate(progress.value, [0, 1], [Number(originH), screenH]),
      transform: [
        { translateX: interpolate(progress.value, [0, 1], [Number(originX), 0]) },
        { translateY: interpolate(progress.value, [0, 1], [Number(originY), 0]) },
      ],
      borderRadius: interpolate(progress.value, [0, 1], [16, 0]),
      overflow: 'hidden' as const,
    };
  });

  // ─── Back navigation ──────────────────────────────────
  const goBack = () => {
    router.back();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY(15) // require 15px drag before activating — lets taps pass through to children
    .onEnd((e) => {
      if (e.translationY > SWIPE_DOWN_THRESHOLD_PX) {
        runOnJS(goBack)();
      }
    });

  // ─── Invalid card ID guard ────────────────────────────
  if (isNaN(numericId) || numericId <= 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('detail.cardNotFound')}</Text>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────
  const content = (
    <View testID="flashcard-detail-screen" style={styles.fill}>
      {/* Back button — Pressable wrapper needed because GestureDetector steals icon onPress */}
      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={goBack}
        hitSlop={12}
        accessible={true}
        accessibilityLabel={t('detail.back')}
        accessibilityRole="button">
        <MaterialCommunityIcons name="arrow-left" size={28} color={theme.colors.onSurface} />
      </Pressable>

      <FlashcardDetail cardId={numericId} />
    </View>
  );

  // ─── Reduce motion: instant render ────────────────────
  if (reduceMotion) {
    return (
      <GestureDetector gesture={panGesture}>
        <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>{content}</View>
      </GestureDetector>
    );
  }

  // ─── Standard tier: card-expand interpolation ─────────
  if (isStandardExpand) {
    return (
      <GestureDetector gesture={panGesture}>
        <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
          <Animated.View style={[styles.fill, expandStyle]} exiting={FadeOut.duration(200)}>
            {content}
          </Animated.View>
        </View>
      </GestureDetector>
    );
  }

  // ─── Budget tier: FadeIn ──────────────────────────────
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(200)}>
        {content}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
