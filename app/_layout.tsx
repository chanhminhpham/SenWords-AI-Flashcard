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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

import { ENV, validateEnv } from '@/config/env';
import { useDeviceTier } from '@/hooks/use-device-tier';
import { senWordDarkTheme } from '@/theme/dark-theme';
import { senWordLightTheme } from '@/theme/sen-word-theme';

// (1) Sentry.init first so validateEnv() crashes are reported
Sentry.init({
  dsn: ENV.SENTRY_DSN,
  enabled: ENV.SENTRY_DSN.length > 0,
});

// (2) Validate env (sync, module scope)
validateEnv();

// (3) Prevent splash screen auto-hide until fonts are loaded
SplashScreen.preventAutoHideAsync();

// Expo Router requires default export for route files
function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? senWordDarkTheme : senWordLightTheme;
  useDeviceTier();

  const [fontsLoaded, fontError] = useFonts({
    NunitoSans_300Light,
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) {
        Sentry.captureException(fontError, {
          tags: { module: 'font-loading' },
        });
      }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <Stack />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </PaperProvider>
  );
}

export default Sentry.wrap(RootLayout);
