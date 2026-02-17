import '../global.css';

import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import * as Sentry from '@sentry/react-native';
import {
  NunitoSans_300Light,
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import type { Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { PaperProvider } from 'react-native-paper';

import { ENV, validateEnv } from '@/config/env';
import { initI18n } from '@/i18n';
import { useDeviceTier } from '@/hooks/use-device-tier';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { senWordDarkTheme } from '@/theme/dark-theme';
import { senWordLightTheme } from '@/theme/sen-word-theme';

// (1) Sentry.init first so validateEnv() crashes are reported
Sentry.init({
  dsn: ENV.SENTRY_DSN,
  enabled: ENV.SENTRY_DSN.length > 0,
});

// (2) Validate env (sync, module scope)
validateEnv();

// (3) Initialize i18n (sync, module scope)
const i18nInstance = initI18n();

// (4) Prevent splash screen auto-hide until fonts + auth are ready
SplashScreen.preventAutoHideAsync();

// Expo Router requires default export for route files
function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? senWordDarkTheme : senWordLightTheme;
  const router = useRouter();
  const segments = useSegments();
  useDeviceTier();

  const session = useAuthStore((s) => s.session);
  const trialMode = useAuthStore((s) => s.trialMode);
  const authLoading = useAuthStore((s) => s.loading);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const onboardingCompleted = useOnboardingStore((s) => s.onboardingCompleted);

  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_300Light,
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Hide splash when fonts + auth are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      if (fontError) {
        Sentry.captureException(fontError, {
          tags: { module: 'font-loading' },
        });
      }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoading]);

  // Auth-based routing
  useEffect(() => {
    if (authLoading || (!fontsLoaded && !fontError)) return;

    const inAuthGroup = segments[0] === '(auth)';

    if ((session || trialMode) && inAuthGroup && onboardingCompleted) {
      // Authenticated/trial user who completed onboarding still in auth → go to tabs
      router.replace('/(tabs)' as Href);
    } else if (!session && !trialMode && !inAuthGroup) {
      // Unauthenticated user outside auth → go to welcome
      router.replace('/(auth)/welcome' as Href);
    }
  }, [
    session,
    trialMode,
    segments,
    authLoading,
    fontsLoaded,
    fontError,
    router,
    onboardingCompleted,
  ]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18nInstance}>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </PaperProvider>
    </I18nextProvider>
  );
}

export default Sentry.wrap(RootLayout);
