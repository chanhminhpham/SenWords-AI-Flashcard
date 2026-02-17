/* eslint-disable @typescript-eslint/no-require-imports, import/first */

// Mock NativeWind CSS import (must be before _layout import)
jest.mock('../../global.css', () => ({}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component: unknown) => component,
  captureException: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn().mockReturnValue([true, null]),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-router', () => {
  const RN = require('react-native');
  return {
    Stack: ({ children }: { children?: unknown }) =>
      require('react').createElement(RN.View, { testID: 'stack-navigator' }, children),
    useRouter: () => ({ replace: jest.fn() }),
    useSegments: () => ['(auth)'],
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('@/config/env', () => ({
  ENV: { SENTRY_DSN: '' },
  validateEnv: jest.fn(),
}));

jest.mock('@/db/use-database', () => ({
  useDatabase: jest.fn().mockReturnValue({ success: true, error: undefined }),
}));

jest.mock('@/services/dictionary/dictionary.service', () => ({
  loadDictionary: jest.fn().mockResolvedValue({ success: true, count: 100 }),
}));

jest.mock('@tanstack/react-query', () => {
  const RN = require('react-native');
  return {
    QueryClient: jest.fn().mockImplementation(() => ({})),
    QueryClientProvider: ({ children }: { children: unknown }) =>
      require('react').createElement(RN.View, { testID: 'query-provider' }, children),
  };
});

jest.mock('@/hooks/use-device-tier', () => ({
  useDeviceTier: jest.fn(),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = {
      session: null,
      loading: false,
      initializeAuth: jest.fn(),
    };
    return selector(state);
  }),
}));

jest.mock('react-native-paper', () => {
  const RN = require('react-native');
  return {
    PaperProvider: ({ children, theme }: { children: unknown; theme: { dark: boolean } }) =>
      require('react').createElement(
        RN.View,
        {
          testID: 'paper-provider',
          accessibilityHint: JSON.stringify({ dark: theme?.dark }),
        },
        children
      ),
    MD3LightTheme: { colors: {} },
    MD3DarkTheme: { colors: {} },
    configureFonts: () => ({}),
  };
});

import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import RootLayout from '../../app/_layout';

// Capture module-level calls before any clearAllMocks
let modulePreventAutoHideAsyncCalled = false;
beforeAll(() => {
  modulePreventAutoHideAsyncCalled =
    (SplashScreen.preventAutoHideAsync as jest.Mock).mock.calls.length > 0;
});

describe('RootLayout - Theme Integration (8.5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFonts as jest.Mock).mockReturnValue([true, null]);
  });

  it('provides light theme when colorScheme is light', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { getByTestId } = render(<RootLayout />);
    const provider = getByTestId('paper-provider');
    const hint = JSON.parse(provider.props.accessibilityHint);
    expect(hint.dark).toBe(false);
  });

  it('provides dark theme when colorScheme is dark', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { getByTestId } = render(<RootLayout />);
    const provider = getByTestId('paper-provider');
    const hint = JSON.parse(provider.props.accessibilityHint);
    expect(hint.dark).toBe(true);
  });
});

describe('RootLayout - Font Loading (8.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  });

  it('calls useFonts with 5 Nunito Sans variants including 500Medium', () => {
    (useFonts as jest.Mock).mockReturnValue([true, null]);
    render(<RootLayout />);
    expect(useFonts).toHaveBeenCalledWith(
      expect.objectContaining({
        NunitoSans_300Light: expect.anything(),
        NunitoSans_400Regular: expect.anything(),
        NunitoSans_500Medium: expect.anything(),
        NunitoSans_600SemiBold: expect.anything(),
        NunitoSans_700Bold: expect.anything(),
      })
    );
  });

  it('renders null while fonts are loading', () => {
    (useFonts as jest.Mock).mockReturnValue([false, null]);
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeNull();
  });

  it('hides splash screen when fonts are loaded and auth is ready', () => {
    (useFonts as jest.Mock).mockReturnValue([true, null]);
    render(<RootLayout />);
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('hides splash screen and reports error on font failure', () => {
    const fontError = new Error('Font load failed');
    (useFonts as jest.Mock).mockReturnValue([false, fontError]);
    render(<RootLayout />);
    const Sentry = require('@sentry/react-native');
    expect(Sentry.captureException).toHaveBeenCalledWith(fontError, {
      tags: { module: 'font-loading' },
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('still renders UI on font error (does not crash)', () => {
    (useFonts as jest.Mock).mockReturnValue([false, new Error('fail')]);
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('paper-provider')).toBeTruthy();
  });
});

describe('RootLayout - Smoke Test (8.7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    (useFonts as jest.Mock).mockReturnValue([true, null]);
  });

  it('renders PaperProvider wrapping content', () => {
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('paper-provider')).toBeTruthy();
  });

  it('calls preventAutoHideAsync at module level', () => {
    expect(modulePreventAutoHideAsyncCalled).toBe(true);
  });
});
