import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import * as Sentry from '@sentry/react-native';
import { getLocales } from 'expo-localization';

import en from '@/i18n/en.json';
import vi from '@/i18n/vi.json';

function getDeviceLanguage(): string {
  try {
    const locales = getLocales();
    return locales?.[0]?.languageCode ?? 'vi';
  } catch {
    return 'vi';
  }
}

export function initI18n(): typeof i18next {
  try {
    // eslint-disable-next-line import/no-named-as-default-member
    i18next
      .use(initReactI18next)
      .init({
        resources: {
          vi: { translation: vi },
          en: { translation: en },
        },
        lng: getDeviceLanguage(),
        fallbackLng: 'vi',
        defaultNS: 'translation',
        interpolation: {
          escapeValue: false,
        },
        saveMissing: __DEV__,
        missingKeyHandler: (_lngs, _ns, key) => {
          if (__DEV__) {
            Sentry.captureMessage(`Missing i18n key: ${key}`, { level: 'warning' });
          }
        },
      })
      .catch((err: unknown) => {
        Sentry.captureException(err, { tags: { module: 'i18n' } });
      });
  } catch (err) {
    Sentry.captureException(err, { tags: { module: 'i18n' } });
  }

  return i18next;
}
