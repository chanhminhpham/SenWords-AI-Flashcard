import { View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/theme';

// Expo Router requires default export for route files
export default function ProgressScreen() {
  const theme = useAppTheme();

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: theme.colors.background }}>
      <MaterialCommunityIcons name="map-marker-path" size={48} color={theme.colors.primary} />
      <Text variant="headlineSmall" style={{ marginTop: 16, color: theme.colors.onBackground }}>
        Hành trình
      </Text>
      <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
        Đang phát triển...
      </Text>
    </View>
  );
}
