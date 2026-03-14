import { View } from 'react-native';

import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text } from 'react-native-paper';

import { getDb } from '@/db';
import { userPreferences } from '@/db/local-schema';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { UserLevel } from '@/types/onboarding';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  const devBypass = () => {
    const userId = 'dev-trial-user';
    // Trial mode → skip Google login
    useAuthStore.getState().enterTrialMode();
    useAuthStore.getState().setAgeVerified(true);
    useAuthStore.getState().setConsentGiven(true);
    // Set a mock user so Learn screen queries (SR queue, user level) are enabled
    useAuthStore.getState().setUser({ id: userId } as User);
    // Set level to PreIntermediate → swipeUp enabled
    useOnboardingStore.getState().selectGoal('conversation');
    useOnboardingStore.getState().selectLevelManually(UserLevel.PreIntermediate);
    useOnboardingStore.getState().completeOnboarding();
    // Write user_preferences to SQLite so fetchUserLevel returns PreIntermediate
    try {
      const db = getDb();
      db.insert(userPreferences)
        .values({ userId, learningGoal: 'conversation', level: UserLevel.PreIntermediate })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: { level: UserLevel.PreIntermediate, learningGoal: 'conversation' },
        })
        .run();
    } catch {
      // DB may not be ready yet — non-blocking for dev bypass
    }
  };

  return (
    <View className="flex-1 bg-nature-tint">
      <View className="flex-1 items-center justify-center px-xl">
        {/* App branding */}
        <View className="mb-2xl items-center">
          <Text variant="displaySmall" style={{ fontWeight: '700', textAlign: 'center' }}>
            SenWords
          </Text>
          <View className="mt-sm">
            <Text
              variant="titleMedium"
              style={{ textAlign: 'center', color: '#4A4E54', lineHeight: 28 }}>
              {t('welcome.tagline')}
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        <View className="w-full px-lg">
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/age-verification' as Href)}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 12 }}>
            {t('welcome.startButton')}
          </Button>
        </View>

        {/* DEV ONLY: Skip to Learn screen */}
        {__DEV__ && (
          <View className="mt-lg w-full px-lg">
            <Button
              mode="outlined"
              onPress={devBypass}
              contentStyle={{ paddingVertical: 4 }}
              style={{ borderRadius: 12, borderColor: '#ccc' }}
              labelStyle={{ fontSize: 12, color: '#999' }}>
              DEV: Skip to Learn
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
