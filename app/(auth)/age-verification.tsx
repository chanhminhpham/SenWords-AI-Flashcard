import { useState } from 'react';
import { View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text, TextInput } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';

function calculateAge(year: number, month: number, day: number): number {
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day;
}

export default function AgeVerificationScreen() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [rejected, setRejected] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const setAgeVerified = useAuthStore((s) => s.setAgeVerified);

  const handleVerify = () => {
    setError('');
    setRejected(false);

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!d || !m || !y || !isValidDate(y, m, d)) {
      setError(t('ageVerification.errorMessage'));
      return;
    }

    const age = calculateAge(y, m, d);

    if (age < 13) {
      setRejected(true);
      return;
    }

    // Store date of birth for later use in SSO profile save
    const dateOfBirth = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    useAuthStore.setState({ dateOfBirth });
    setAgeVerified(true);
    router.push('/(auth)/privacy-consent' as Href);
  };

  if (rejected) {
    return (
      <View className="flex-1 items-center justify-center bg-app-bg px-xl dark:bg-app-bg-dark">
        <View className="items-center">
          <Text
            variant="titleLarge"
            style={{ textAlign: 'center', lineHeight: 32 }}
            testID="under-13-message">
            {t('ageVerification.rejectedMessage')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg px-xl dark:bg-app-bg-dark">
      <View className="flex-1 justify-center">
        <View className="mb-xl">
          <Text variant="headlineMedium" style={{ textAlign: 'center' }}>
            {t('ageVerification.title')}
          </Text>
          <View className="mt-sm">
            <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#4A4E54' }}>
              {t('ageVerification.subtitle')}
            </Text>
          </View>
        </View>

        {/* Date input fields */}
        <View className="mb-lg flex-row justify-center gap-3">
          <View className="w-20">
            <TextInput
              mode="outlined"
              label={t('ageVerification.dayLabel')}
              value={day}
              onChangeText={(text) => setDay(text.replace(/\D/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
              testID="day-input"
            />
          </View>
          <View className="w-20">
            <TextInput
              mode="outlined"
              label={t('ageVerification.monthLabel')}
              value={month}
              onChangeText={(text) => setMonth(text.replace(/\D/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
              testID="month-input"
            />
          </View>
          <View className="w-28">
            <TextInput
              mode="outlined"
              label={t('ageVerification.yearLabel')}
              value={year}
              onChangeText={(text) => setYear(text.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              testID="year-input"
            />
          </View>
        </View>

        {error ? (
          <View className="mb-md">
            <Text
              variant="bodyMedium"
              style={{ textAlign: 'center', color: '#E57373' }}
              testID="error-message">
              {error}
            </Text>
          </View>
        ) : null}

        <View className="px-lg">
          <Button
            mode="contained"
            onPress={handleVerify}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 12 }}
            testID="verify-button">
            {t('ageVerification.verifyButton')}
          </Button>
        </View>
      </View>
    </View>
  );
}
