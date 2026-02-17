import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { getLevelLabel, getFeatureUnlockState, LEVEL_ENCOURAGEMENTS } from '@/constants/onboarding';
import { saveOnboardingResult } from '@/services/onboarding/onboarding.service';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAppTheme } from '@/theme/use-app-theme';

export default function LevelResultScreen() {
  const [saving, setSaving] = useState(false);
  const theme = useAppTheme();

  const determinedLevel = useOnboardingStore((s) => s.determinedLevel);
  const selectedGoal = useOnboardingStore((s) => s.selectedGoal);
  const manualLevelSelected = useOnboardingStore((s) => s.manualLevelSelected);
  const placementResponses = useOnboardingStore((s) => s.placementResponses);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const user = useAuthStore((s) => s.user);
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());

  // Lotus bloom animation
  const scale = useSharedValue(reduceMotion ? 1 : 0.3);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 8, stiffness: 80 });
      opacity.value = withSpring(1, { damping: 12, stiffness: 100 });
    }
  }, [scale, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const correctCount = placementResponses.filter((r) => r.response === 'know').length;

  const handleStart = async () => {
    if (determinedLevel === null) return;
    setSaving(true);

    try {
      if (user) {
        const result = await saveOnboardingResult(
          user.id,
          selectedGoal ?? 'conversation',
          determinedLevel
        );
        if (!result.success) {
          Sentry.captureMessage('Onboarding save failed, proceeding with local data', {
            level: 'warning',
            tags: { code: result.error },
          });
        }
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { code: 'ONBOARDING_SAVE_FAILED' },
      });
    }

    completeOnboarding();
    setSaving(false);
    router.replace('/(tabs)' as Href);
  };

  if (determinedLevel === null) {
    return (
      <View
        className="flex-1 items-center justify-center bg-app-bg dark:bg-app-bg-dark"
        testID="level-result-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const levelLabel = getLevelLabel(determinedLevel);
  const encouragement = LEVEL_ENCOURAGEMENTS[determinedLevel];
  const featureUnlock = getFeatureUnlockState(determinedLevel);

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark" testID="level-result-screen">
      <View style={styles.content}>
        {/* Lotus bloom animation */}
        <Animated.View testID="lotus-animation" style={[styles.lotusContainer, animatedStyle]}>
          <Text style={styles.lotusEmoji}>🪷</Text>
        </Animated.View>

        {/* Level badge */}
        <Text
          variant="headlineSmall"
          style={[styles.levelText, { color: theme.colors.onSurface }]}
          testID="level-badge">
          Bạn đang ở: {levelLabel}
        </Text>

        {/* Summary */}
        <Text
          variant="bodyLarge"
          style={[styles.summary, { color: theme.colors.onSurfaceVariant }]}
          testID="result-summary">
          {manualLevelSelected ? 'Bạn đã tự chọn trình độ' : `Bạn biết ${correctCount}/10 từ`}
        </Text>

        {/* Encouragement */}
        <Text
          variant="bodyMedium"
          style={[styles.encouragement, { color: theme.colors.nature.accent }]}
          testID="encouragement">
          {encouragement}
        </Text>

        {/* Feature unlock summary */}
        <View style={styles.featureList} testID="feature-unlock-list">
          <Text
            variant="bodySmall"
            style={[styles.featureHeader, { color: theme.colors.onSurfaceVariant }]}>
            Tính năng mở khóa:
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            • Vuốt phải/trái để học từ vựng
          </Text>
          {featureUnlock.swipeUpEnabled && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              • Vuốt lên để khám phá thêm
            </Text>
          )}
          {featureUnlock.largerFonts && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              • Chữ lớn hơn, giao diện đơn giản
            </Text>
          )}
        </View>

        {/* Start button */}
        <Button
          mode="contained"
          onPress={handleStart}
          loading={saving}
          disabled={saving}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
          testID="start-button">
          Bắt đầu học
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lotusContainer: {
    marginBottom: 32,
  },
  lotusEmoji: {
    fontSize: 80,
  },
  levelText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  summary: {
    textAlign: 'center',
    marginBottom: 8,
  },
  encouragement: {
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  featureList: {
    alignSelf: 'stretch',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  featureHeader: {
    fontWeight: '600',
    marginBottom: 4,
  },
  startButton: {
    borderRadius: 12,
    width: '100%',
  },
  startButtonContent: {
    paddingVertical: 8,
  },
});
