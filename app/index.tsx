import { Redirect } from 'expo-router';

/**
 * Root index route — redirects to (tabs) group.
 * ADR-4: Keep this file (don't delete) to prevent 404 flash
 * when Expo Router resolves the initial "/" route before
 * auth routing in _layout.tsx takes effect.
 */
// Expo Router requires default export for route files
export default function IndexRedirect() {
  return <Redirect href="/(tabs)/home" />;
}
