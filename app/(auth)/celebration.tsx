// Celebration Screen — "Bước chân đầu tiên!" milestone (Story 1.8)
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { getDb } from '@/db';
import { userPreferences } from '@/db/local-schema';
import { hapticTapSuccess } from '@/services/haptics';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAppTheme } from '@/theme/use-app-theme';

const AUTO_DISMISS_MS = 3000;

export default function CelebrationScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { allKnown } = useLocalSearchParams<{ allKnown?: string }>();
  const deviceTier = useAppStore((s) => s.deviceTier);
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());
  const currentUser = useAuthStore((s) => s.user);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const determinedLevel = useOnboardingStore((s) => s.determinedLevel);
  const selectedGoal = useOnboardingStore((s) => s.selectedGoal);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistedRef = useRef(false);

  const isAllKnown = allKnown === 'true';
  const isBudget = deviceTier === 'budget';

  // Animation values
  const celebrationScale = useSharedValue(reduceMotion || isBudget ? 1 : 0.3);
  const celebrationOpacity = useSharedValue(reduceMotion || isBudget ? 1 : 0);
  const textOpacity = useSharedValue(reduceMotion || isBudget ? 1 : 0);

  const navigateToHome = useCallback(() => {
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
    }

    // Persistence sequence (Task 4.2) — run once
    if (!persistedRef.current) {
      persistedRef.current = true;

      // 1. In-memory state
      completeOnboarding();

      // 2. SQLite UPSERT into user_preferences (offline-first)
      if (currentUser?.id && determinedLevel !== null) {
        try {
          const db = getDb();
          const now = new Date().toISOString();
          db.insert(userPreferences)
            .values({
              userId: currentUser.id,
              learningGoal: selectedGoal ?? 'conversation',
              level: determinedLevel,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: userPreferences.userId,
              set: {
                learningGoal: selectedGoal ?? 'conversation',
                level: determinedLevel,
                updatedAt: now,
              },
            })
            .run();
        } catch (err) {
          Sentry.captureException(err, {
            tags: { code: 'ONBOARDING_SQLITE_PERSIST_FAILED' },
          });
        }
      }
      // 3. Supabase write already done in level-result (best-effort)
    }

    router.replace('/(tabs)/home' as Href);
  }, [completeOnboarding, currentUser, determinedLevel, selectedGoal]);

  useEffect(() => {
    // Trigger haptic
    hapticTapSuccess();

    // Start animations (skip for budget/reduce motion)
    if (!reduceMotion && !isBudget) {
      celebrationScale.value = withSpring(1, { damping: 6, stiffness: 100 });
      celebrationOpacity.value = withSpring(1, { damping: 10, stiffness: 100 });
      textOpacity.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    }

    // Auto-dismiss after 3 seconds
    autoDismissRef.current = setTimeout(navigateToHome, AUTO_DISMISS_MS);

    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, [celebrationScale, celebrationOpacity, textOpacity, reduceMotion, isBudget, navigateToHome]);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const celebrationText = isAllKnown
    ? t('firstSession.celebrationAllKnown')
    : t('firstSession.celebrationDefault');

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      onPress={navigateToHome}
      accessibilityLabel={t('accessibility.celebrationMessage')}
      accessibilityRole="alert"
      testID="celebration-screen">
      {/* Celebration emoji/animation */}
      {isBudget || reduceMotion ? (
        <View style={styles.emojiContainer} testID="celebration-static">
          <Text style={styles.celebrationEmoji}>🎉</Text>
        </View>
      ) : (
        <Animated.View
          style={[styles.emojiContainer, celebrationStyle]}
          testID="celebration-animated">
          <Text style={styles.celebrationEmoji}>🎉</Text>
        </Animated.View>
      )}

      {/* Celebration text */}
      {isBudget || reduceMotion ? (
        <View>
          <Text
            variant="headlineMedium"
            style={[styles.celebrationText, { color: theme.colors.onBackground }]}
            testID="celebration-title">
            {celebrationText}
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
            testID="celebration-progress">
            {t('firstSession.progressMessage')}
          </Text>
        </View>
      ) : (
        <Animated.View style={textStyle}>
          <Text
            variant="headlineMedium"
            style={[styles.celebrationText, { color: theme.colors.onBackground }]}
            testID="celebration-title">
            {celebrationText}
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
            testID="celebration-progress">
            {t('firstSession.progressMessage')}
          </Text>
        </Animated.View>
      )}

      {/* Fallback button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={navigateToHome}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
          testID="celebration-continue-button">
          {t('firstSession.continueButton')}
        </Button>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emojiContainer: {
    marginBottom: 24,
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  celebrationText: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
  },
  continueButton: {
    borderRadius: 12,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
});
