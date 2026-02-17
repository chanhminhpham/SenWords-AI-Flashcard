import { View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text } from 'react-native-paper';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-nature-tint">
      <View className="flex-1 items-center justify-center px-xl">
        {/* App branding */}
        <View className="mb-2xl items-center">
          <Text variant="displaySmall" style={{ fontWeight: '700', textAlign: 'center' }}>
            SenWords
          </Text>
          <View className="mt-sm">
            <Text
              variant="titleMedium"
              style={{ textAlign: 'center', color: '#4A4E54', lineHeight: 28 }}>
              {t('welcome.tagline')}
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        <View className="w-full px-lg">
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/age-verification' as Href)}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 12 }}>
            {t('welcome.startButton')}
          </Button>
        </View>
      </View>
    </View>
  );
}
