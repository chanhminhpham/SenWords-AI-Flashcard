import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

// Expo Router requires default export for route files
export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Text className="text-xl font-bold">This screen does not exist.</Text>
      <Link href="/" className="mt-4">
        <Text className="text-base text-blue-600">Go to home screen</Text>
      </Link>
    </View>
  );
}
