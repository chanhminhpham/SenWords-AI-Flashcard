// Global i18n mock for jest — plain .js to avoid NativeWind CSS interop issue
// Registered in package.json jest.setupFiles so ALL tests auto-inherit

const mockT = (key, options) => {
  if (options) {
    // Return key with interpolation values replaced for readability in tests
    return Object.entries(options).reduce((str, [k, v]) => str.replace(`{{${k}}}`, String(v)), key);
  }
  return key;
};

const mockI18n = {
  language: 'vi',
  changeLanguage: () => Promise.resolve(),
  t: mockT,
  exists: () => true,
  use: () => mockI18n,
  init: () => Promise.resolve(),
};

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  }),
  I18nextProvider: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'vi', languageTag: 'vi-VN' }],
  getCalendars: () => [{ calendar: 'gregory' }],
}));

// Mock the i18n init module
jest.mock('@/i18n', () => ({
  initI18n: () => mockI18n,
}));
