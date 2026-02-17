import { View } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import type { SSOProvider } from '@/services/supabase/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const dateOfBirth = useAuthStore((s) => s.dateOfBirth);
  const signIn = useAuthStore((s) => s.signInWithProvider);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSSO = async (provider: SSOProvider) => {
    clearError();

    if (!dateOfBirth) return;

    try {
      const success = await signIn(provider, {
        dateOfBirth,
        privacyConsent: true,
      });

      if (success) {
        router.replace('/(tabs)' as Href);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { module: 'auth', provider } });
    }
  };

  const enterTrialMode = useAuthStore((s) => s.enterTrialMode);

  const handleSkip = () => {
    enterTrialMode();
    router.replace('/(tabs)' as Href);
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View className="flex-1 items-center justify-center px-xl">
        <View className="mb-2xl">
          <Text variant="headlineMedium" style={{ textAlign: 'center' }}>
            Đăng nhập
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" testID="loading-indicator" />
        ) : (
          <View className="w-full gap-3">
            {/* Google SSO */}
            <Button
              mode="contained"
              onPress={() => handleSSO('google')}
              contentStyle={{ paddingVertical: 8 }}
              style={{ borderRadius: 12 }}
              icon="google"
              testID="google-button">
              Đăng nhập bằng Google
            </Button>

            {/* Facebook SSO */}
            <Button
              mode="contained"
              onPress={() => handleSSO('facebook')}
              contentStyle={{ paddingVertical: 8 }}
              style={{ borderRadius: 12 }}
              icon="facebook"
              testID="facebook-button">
              Đăng nhập bằng Facebook
            </Button>

            {/* Apple SSO */}
            <Button
              mode="contained"
              onPress={() => handleSSO('apple')}
              contentStyle={{ paddingVertical: 8 }}
              style={{ borderRadius: 12 }}
              icon="apple"
              testID="apple-button">
              Đăng nhập bằng Apple
            </Button>

            {/* Error display */}
            {error ? (
              <View className="mt-md">
                <Text
                  variant="bodyMedium"
                  style={{ textAlign: 'center', color: '#E57373' }}
                  testID="error-message">
                  Không kết nối được. Thử lại nhé!
                </Text>
              </View>
            ) : null}

            {/* Skip / Trial mode */}
            <View className="mt-lg">
              <Button mode="text" onPress={handleSkip} testID="skip-button">
                Dùng thử không đăng nhập
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
