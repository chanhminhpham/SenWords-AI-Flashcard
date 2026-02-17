import { View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/theme';

// Expo Router requires default export for route files
export default function ProfileScreen() {
  const theme = useAppTheme();

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: theme.colors.background }}>
      <MaterialCommunityIcons name="account" size={48} color={theme.colors.primary} />
      <Text variant="headlineSmall" style={{ marginTop: 16, color: theme.colors.onBackground }}>
        Tôi
      </Text>
      <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
        Đang phát triển...
      </Text>
    </View>
  );
}
