import { Redirect, Stack, useSegments } from 'expo-router';
import type { Href } from 'expo-router';

import { useAuthStore } from '@/stores/auth.store';

/**
 * Navigation guard: check ageVerified + consentGiven from auth store.
 * Prevents deep link bypass to login screen without completing age + consent flow.
 */
export default function AuthLayout() {
  const ageVerified = useAuthStore((s) => s.ageVerified);
  const consentGiven = useAuthStore((s) => s.consentGiven);
  const segments = useSegments() as string[];

  const currentScreen = segments[segments.length - 1];

  // Guard: login screen requires both age + consent
  if (currentScreen === 'login' && (!ageVerified || !consentGiven)) {
    return <Redirect href={'/(auth)/age-verification' as Href} />;
  }

  // Guard: privacy-consent requires age verification
  if (currentScreen === 'privacy-consent' && !ageVerified) {
    return <Redirect href={'/(auth)/age-verification' as Href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="age-verification" />
      <Stack.Screen name="privacy-consent" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
