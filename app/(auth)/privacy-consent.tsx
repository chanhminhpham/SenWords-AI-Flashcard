import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Text } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';

export default function PrivacyConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const setConsentGiven = useAuthStore((s) => s.setConsentGiven);
  const { t } = useTranslation();

  const handleContinue = () => {
    setConsentGiven(true);
    router.push('/(auth)/login' as Href);
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View className="flex-1 px-lg pt-2xl">
        <View className="mb-lg">
          <Text variant="headlineMedium" style={{ textAlign: 'center' }}>
            {t('privacyConsent.title')}
          </Text>
        </View>

        {/* Scrollable privacy policy content */}
        <ScrollView
          className="mb-lg flex-1 rounded-card border border-app-surface p-md dark:border-form-border-default"
          testID="policy-scroll">
          <Text variant="bodyMedium" style={{ lineHeight: 24 }}>
            {t('privacyPolicy.fullText')}
          </Text>
        </ScrollView>

        {/* Consent checkbox */}
        <Pressable
          testID="consent-checkbox"
          onPress={() => setAgreed(!agreed)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          className="mb-lg flex-row items-center">
          <View pointerEvents="none">
            <Checkbox status={agreed ? 'checked' : 'unchecked'} />
          </View>
          <View className="ml-sm flex-1">
            <Text variant="bodyMedium">{t('privacyConsent.agreeCheckbox')}</Text>
          </View>
        </Pressable>

        {/* CTA — disabled until consent given */}
        <View className="mb-2xl px-lg">
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!agreed}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 12 }}
            testID="continue-button">
            {t('privacyConsent.continueButton')}
          </Button>
        </View>
      </View>
    </View>
  );
}
