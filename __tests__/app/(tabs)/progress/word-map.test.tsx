/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('react-native-gesture-handler', () => require('@/__test-utils__/gesture-handler-mock'));
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));
jest.mock('@expo/vector-icons', () => require('@/__test-utils__/vector-icons'));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn().mockReturnValue({ cardId: '42' }),
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => false, deviceTier: 'standard' })
  ),
}));

jest.mock('@/components/features/word-map/WordMapView', () => ({
  WordMapView: ({ cardId, mode }: { cardId: number; mode: string }) => {
    const { View, Text } = require('react-native');
    return require('react').createElement(
      View,
      { testID: 'word-map-view-mock' },
      require('react').createElement(Text, null, `map-${mode}-${cardId}`)
    );
  },
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import WordMapScreen from '../../../../app/(tabs)/progress/word-map';

describe('WordMapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen container', () => {
    const { getByTestId } = render(<WordMapScreen />);
    expect(getByTestId('word-map-screen')).toBeTruthy();
  });

  it('renders header with title', () => {
    const { getByText } = render(<WordMapScreen />);
    expect(getByText('wordMap.screenTitle')).toBeTruthy();
  });

  it('renders WordMapView in full mode with correct cardId', () => {
    const { getByText } = render(<WordMapScreen />);
    expect(getByText('map-full-42')).toBeTruthy();
  });

  it('back button calls router.back()', () => {
    const { getByTestId } = render(<WordMapScreen />);

    fireEvent.press(getByTestId('word-map-back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders gesture detector for zoom', () => {
    const { getByTestId } = render(<WordMapScreen />);
    expect(getByTestId('gesture-detector')).toBeTruthy();
  });
});
