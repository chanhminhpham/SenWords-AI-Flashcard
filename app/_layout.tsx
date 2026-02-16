import '../global.css';

import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';

import { ENV, validateEnv } from '@/config/env';

// Init Sentry first so validateEnv() crashes are reported
Sentry.init({
  dsn: ENV.SENTRY_DSN,
  enabled: ENV.SENTRY_DSN.length > 0,
});

validateEnv();

// Expo Router requires default export for route files
function RootLayout() {
  return <Stack />;
}

export default Sentry.wrap(RootLayout);
