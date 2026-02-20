import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import {
  getLevelLabelKey,
  getFeatureUnlockState,
  getEncouragementKey,
} from '@/constants/onboarding';
import { saveOnboardingResult } from '@/services/onboarding/onboarding.service';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAppTheme } from '@/theme/use-app-theme';

export default function LevelResultScreen() {
  const [saving, setSaving] = useState(false);
  const theme = useAppTheme();
  const { t } = useTranslation();

  const determinedLevel = useOnboardingStore((s) => s.determinedLevel);
  const selectedGoal = useOnboardingStore((s) => s.selectedGoal);
  const manualLevelSelected = useOnboardingStore((s) => s.manualLevelSelected);
  const placementResponses = useOnboardingStore((s) => s.placementResponses);
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

    setSaving(false);
    // Navigate to first learning session (Story 1.8)
    // completeOnboarding() will be called after first session + celebration
    router.replace('/(auth)/first-session' as Href);
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

  const levelLabel = t(getLevelLabelKey(determinedLevel));
  const featureUnlock = getFeatureUnlockState(determinedLevel);

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark" testID="level-result-screen">
      <View style={styles.content}>
        {/* Lotus bloom animation */}
        <Animated.View
          testID="lotus-animation"
          accessibilityLabel={t('accessibility.lotusAnimation')}
          style={[styles.lotusContainer, animatedStyle]}>
          <Text style={styles.lotusEmoji}>🪷</Text>
        </Animated.View>

        {/* Level badge */}
        <View testID="level-badge" accessibilityRole="header">
          <Text
            variant="headlineSmall"
            style={[styles.levelText, { color: theme.colors.onSurface }]}>
            {t('levelResult.levelPrefix')}
          </Text>
          <Text
            variant="headlineSmall"
            style={[styles.levelText, { color: theme.colors.onSurface }]}
            testID="level-name">
            {levelLabel}
          </Text>
        </View>

        {/* Summary */}
        <View testID="result-summary" style={styles.summaryRow}>
          {manualLevelSelected ? (
            <Text
              variant="bodyLarge"
              style={[styles.summary, { color: theme.colors.onSurfaceVariant }]}>
              {t('levelResult.manualSummary')}
            </Text>
          ) : (
            <>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('levelResult.summaryPrefix')}{' '}
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}
                testID="score-count">
                {`${correctCount}/10`}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {' '}
                {t('levelResult.summarySuffix')}
              </Text>
            </>
          )}
        </View>

        {/* Encouragement */}
        <Text
          variant="bodyMedium"
          style={[styles.encouragement, { color: theme.colors.nature.accent }]}
          testID="encouragement">
          {t(getEncouragementKey(determinedLevel))}
        </Text>

        {/* Feature unlock summary */}
        <View style={styles.featureList} testID="feature-unlock-list">
          <Text
            variant="bodySmall"
            style={[styles.featureHeader, { color: theme.colors.onSurfaceVariant }]}>
            {t('levelResult.featureUnlock')}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('levelResult.featureSwipe')}
          </Text>
          {featureUnlock.swipeUpEnabled && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('levelResult.featureSwipeUp')}
            </Text>
          )}
          {featureUnlock.largerFonts && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('levelResult.featureLargerFonts')}
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
          {t('levelResult.startButton')}
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
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
