import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WordMapView } from '@/components/features/word-map/WordMapView';
import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';

// Expo Router requires default export for route files
export default function WordMapScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const deviceTier = useAppStore((s) => s.deviceTier);
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());

  const insets = useSafeAreaInsets();
  const parsedCardId = Number(cardId) || 0;

  // ─── Pinch + Pan zoom ─────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.5), 3.0);
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (reduceMotion || deviceTier === 'budget') {
        scale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
      } else {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View
      testID="word-map-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, paddingTop: insets.top + 12 }]}>
        <Pressable
          testID="word-map-back"
          onPress={() => router.back()}
          accessibilityLabel={t('detail.back')}
          accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('wordMap.screenTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Zoomable word map */}
      <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, composedGesture)}>
        <Animated.View style={[styles.mapContainer, animatedStyle]}>
          <WordMapView cardId={parsedCardId} mode="full" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
  },
  mapContainer: {
    flex: 1,
  },
});
