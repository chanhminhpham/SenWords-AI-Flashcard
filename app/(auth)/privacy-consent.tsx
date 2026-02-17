import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Button, Checkbox, Text } from 'react-native-paper';

import { PRIVACY_POLICY_VI } from '@/constants/privacy-policy';
import { useAuthStore } from '@/stores/auth.store';

export default function PrivacyConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const setConsentGiven = useAuthStore((s) => s.setConsentGiven);

  const handleContinue = () => {
    setConsentGiven(true);
    router.push('/(auth)/login' as Href);
  };

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <View className="flex-1 px-lg pt-2xl">
        <View className="mb-lg">
          <Text variant="headlineMedium" style={{ textAlign: 'center' }}>
            Chính sách Bảo mật
          </Text>
        </View>

        {/* Scrollable privacy policy content */}
        <ScrollView
          className="mb-lg flex-1 rounded-card border border-app-surface p-md dark:border-form-border-default"
          testID="policy-scroll">
          <Text variant="bodyMedium" style={{ lineHeight: 24 }}>
            {PRIVACY_POLICY_VI}
          </Text>
        </ScrollView>

        {/* Consent checkbox */}
        <View className="mb-lg flex-row items-center">
          <Checkbox
            status={agreed ? 'checked' : 'unchecked'}
            onPress={() => setAgreed(!agreed)}
            testID="consent-checkbox"
          />
          <View className="ml-sm flex-1">
            <Text variant="bodyMedium" onPress={() => setAgreed(!agreed)}>
              Tôi đồng ý với Chính sách Bảo mật
            </Text>
          </View>
        </View>

        {/* CTA — disabled until consent given */}
        <View className="mb-2xl px-lg">
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!agreed}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 12 }}
            testID="continue-button">
            Tiếp tục
          </Button>
        </View>
      </View>
    </View>
  );
}
