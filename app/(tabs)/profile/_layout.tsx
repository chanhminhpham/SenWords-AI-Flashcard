import { Stack } from 'expo-router';

// Expo Router requires default export for route files
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
