import { View, Text } from 'react-native';

// Expo Router requires default export for route files
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">AI Flash Card</Text>
      <Text className="mt-2 text-gray-500">Project initialized successfully</Text>
    </View>
  );
}
