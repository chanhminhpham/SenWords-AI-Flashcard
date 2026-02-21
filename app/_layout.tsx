// IMPORTANT: Polyfills MUST be imported first, before any other imports
// These polyfill the crypto and URL APIs required by Supabase PKCE auth flow
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
import 'react-native-url-polyfill/auto';

// Initialize Web Crypto polyfill (provides crypto API for PKCE)
polyfillWebCrypto();

/* eslint-disable import/first -- Polyfills must execute before other imports */
import '../global.css';

import { useEffect } from 'react';
import { LogBox, useColorScheme } from 'react-native';

// Disable yellow box warnings in dev builds
LogBox.ignoreAllLogs(true);

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';
import { PaperProvider } from 'react-native-paper';

import { ENV, validateEnv } from '@/config/env';
import { useDatabase } from '@/db/use-database';
import { initI18n } from '@/i18n';
import { useDeviceTier } from '@/hooks/use-device-tier';
import { loadDictionary } from '@/services/dictionary/dictionary.service';
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

// (5) TanStack Query client — module scope so it persists across re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

// Expo Router requires default export for route files
function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? senWordDarkTheme : senWordLightTheme;
  const router = useRouter();
  const segments = useSegments();
  useDeviceTier();
  const { success: dbReady, error: dbError } = useDatabase();

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

  // Load dictionary into SQLite after DB migrations complete
  useEffect(() => {
    if (dbReady) {
      loadDictionary().catch((err) =>
        Sentry.captureException(err, { tags: { module: 'dictionary-loading' } })
      );
    }
  }, [dbReady]);

  // Hide splash when fonts + auth + DB are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading && (dbReady || dbError)) {
      if (fontError) {
        Sentry.captureException(fontError, {
          tags: { module: 'font-loading' },
        });
      }
      if (dbError) {
        Sentry.captureException(dbError, {
          tags: { module: 'database-migration' },
        });
      }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoading, dbReady, dbError]);

  // Auth-based routing
  useEffect(() => {
    if (authLoading || (!fontsLoaded && !fontError) || (!dbReady && !dbError)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // DEBUG: Log routing state
    console.log('[RootLayout] Routing check:', {
      session: !!session,
      trialMode,
      inAuthGroup,
      inTabsGroup,
      onboardingCompleted,
      currentSegment: segments[0],
    });

    // Case 1: Authenticated/trial user who hasn't completed onboarding and is outside auth → go to onboarding
    if ((session || trialMode) && !onboardingCompleted && !inAuthGroup) {
      console.log(
        '[RootLayout] → Redirecting to onboarding (user authenticated but not completed)'
      );
      router.replace('/(auth)/welcome' as Href);
      return;
    }

    // Case 2: Authenticated/trial user who completed onboarding and is in auth → go to tabs
    if ((session || trialMode) && onboardingCompleted && inAuthGroup) {
      console.log('[RootLayout] → Redirecting to tabs (user completed onboarding)');
      router.replace('/(tabs)/home' as Href);
      return;
    }

    // Case 3: Unauthenticated user outside auth → go to welcome
    if (!session && !trialMode && !inAuthGroup) {
      console.log('[RootLayout] → Redirecting to welcome (user not authenticated)');
      router.replace('/(auth)/welcome' as Href);
      return;
    }

    console.log('[RootLayout] No routing action needed');
  }, [
    session,
    trialMode,
    segments,
    authLoading,
    fontsLoaded,
    fontError,
    router,
    onboardingCompleted,
    dbReady,
    dbError,
  ]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18nInstance}>
          <PaperProvider theme={theme}>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </PaperProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
