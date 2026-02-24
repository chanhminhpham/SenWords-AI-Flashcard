import { Stack } from 'expo-router';

// Expo Router requires default export for route files
export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[cardId]" options={{ animation: 'none' }} />
    </Stack>
  );
}
