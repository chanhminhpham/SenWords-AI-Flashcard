/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('@expo/vector-icons', () => require('@/__test-utils__/vector-icons'));

jest.mock('@/theme', () => ({
  useAppTheme: () => ({
    colors: {
      background: '#FFFFFF',
      primary: '#2D8A5E',
      onBackground: '#1A1D23',
      onSurfaceVariant: '#4A4E54',
      feedback: {
        know: '#4ECBA0',
      },
    },
  }),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'test-user', email: 'test@example.com' },
  })),
}));

import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomeScreen from '../../../app/(tabs)/home/index';
import LearnScreen from '../../../app/(tabs)/learn/index';
import ScanScreen from '../../../app/(tabs)/scan/index';
import ProgressScreen from '../../../app/(tabs)/progress/index';
import ProfileScreen from '../../../app/(tabs)/profile/index';

const safeAreaMetrics = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 375, height: 812 },
};

function renderScreen(Screen: React.ComponentType) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <PaperProvider>
          <Screen />
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

describe('Placeholder tab screens', () => {
  it('renders Home screen with title', () => {
    const { getByText } = renderScreen(HomeScreen);
    expect(getByText('Học')).toBeTruthy();
    expect(getByText('Đang phát triển...')).toBeTruthy();
  });

  it('renders Learn screen with empty state (no SR queue)', async () => {
    const { findByText } = renderScreen(LearnScreen);
    // Since fetchSRQueue returns empty array, should show empty state
    // i18n mock returns keys, not translations
    const emptyText = await findByText('learn.empty');
    expect(emptyText).toBeTruthy();
  });

  it('renders Scan screen with title', () => {
    const { getByText } = renderScreen(ScanScreen);
    expect(getByText('Scan')).toBeTruthy();
  });

  it('renders Progress screen with title', () => {
    const { getByText } = renderScreen(ProgressScreen);
    expect(getByText('Hành trình')).toBeTruthy();
  });

  it('renders Profile screen with title', () => {
    const { getByText } = renderScreen(ProfileScreen);
    expect(getByText('Tôi')).toBeTruthy();
  });
});
