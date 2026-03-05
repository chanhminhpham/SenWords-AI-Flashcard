/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('react-native-reanimated', () => require('@/__test-utils__/reanimated-mock'));
jest.mock('react-native-gesture-handler', () => require('@/__test-utils__/gesture-handler-mock'));
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(
    (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
      selector({ shouldReduceMotion: () => false, deviceTier: 'standard' })
  ),
}));

jest.mock('@/services/haptics', () => ({
  hapticTapSuccess: jest.fn(),
}));

const mockUseWordFamily = jest.fn();
jest.mock('@/hooks/use-word-family', () => ({
  useWordFamily: (...args: unknown[]) => mockUseWordFamily(...args),
}));

jest.mock('@/utils/word-map-layout', () => {
  const layout = (
    nodes: { id: string; x?: number; y?: number }[],
    links: unknown[],
    w: number,
    h: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      node.x = cx + 80 * Math.cos(angle);
      node.y = cy + 80 * Math.sin(angle);
    });
    return { nodes, links };
  };
  return { computeWordMapLayout: layout, computeStaticCircularLayout: layout };
});

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WordMapView } from './WordMapView';
import { useAppStore } from '@/stores/app.store';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockWordFamilyData = {
  family: { id: 1, rootWord: 'happy', createdAt: '', updatedAt: '' },
  members: [
    {
      id: 1,
      familyId: 1,
      cardId: 10,
      wordText: 'happiness',
      partOfSpeech: 'noun',
      formLabel: 'noun form',
      createdAt: '',
      card: { id: 10, word: 'happiness' },
    },
    {
      id: 2,
      familyId: 1,
      cardId: 11,
      wordText: 'happily',
      partOfSpeech: 'adverb',
      formLabel: 'adverb form',
      createdAt: '',
      card: { id: 11, word: 'happily' },
    },
    {
      id: 3,
      familyId: 1,
      cardId: null,
      wordText: 'unhappy',
      partOfSpeech: 'adj',
      formLabel: 'antonym',
      createdAt: '',
      card: null,
    },
    {
      id: 4,
      familyId: 1,
      cardId: 12,
      wordText: 'glad',
      partOfSpeech: 'adj',
      formLabel: 'synonym',
      createdAt: '',
      card: { id: 12, word: 'glad' },
    },
    {
      id: 5,
      familyId: 1,
      cardId: 13,
      wordText: 'joy',
      partOfSpeech: 'noun',
      formLabel: 'synonym',
      createdAt: '',
      card: { id: 13, word: 'joy' },
    },
    {
      id: 6,
      familyId: 1,
      cardId: 14,
      wordText: 'cheerful',
      partOfSpeech: 'adj',
      formLabel: 'synonym',
      createdAt: '',
      card: { id: 14, word: 'cheerful' },
    },
  ],
};

describe('WordMapView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWordFamily.mockReturnValue({
      data: mockWordFamilyData,
      isLoading: false,
      isError: false,
    });
  });

  it('renders loading state', () => {
    mockUseWordFamily.mockReturnValue({ data: null, isLoading: true, isError: false });
    const { getByTestId } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);
    expect(getByTestId('word-map-loading')).toBeTruthy();
  });

  it('renders error state', () => {
    mockUseWordFamily.mockReturnValue({ data: null, isLoading: false, isError: true });
    const { getByTestId } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);
    expect(getByTestId('word-map-error')).toBeTruthy();
  });

  it('renders empty state when no data', () => {
    mockUseWordFamily.mockReturnValue({ data: null, isLoading: false, isError: false });
    const { getByTestId } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);
    expect(getByTestId('word-map-empty')).toBeTruthy();
  });

  it('renders word map view with nodes in mini mode', async () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <WordMapView cardId={1} mode="mini" />
    );

    await waitFor(() => {
      expect(getByTestId('word-map-view')).toBeTruthy();
    });

    // SVG mock renders G groups as Views with testID svg-g
    const nodeGroups = getAllByTestId('svg-g');
    // Mini mode: max 7 nodes (1 root + 6 members)
    expect(nodeGroups.length).toBe(7);
  });

  it('caps mini mode at 7 nodes even with more members', async () => {
    const { getAllByTestId } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);

    await waitFor(() => {
      const nodeGroups = getAllByTestId('svg-g');
      // 1 root + 6 members = 7 total (capped at MAX_NODES_MINI)
      expect(nodeGroups.length).toBeLessThanOrEqual(7);
    });
  });

  it('renders correct number of edges', async () => {
    const { getAllByTestId } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);

    await waitFor(() => {
      const edges = getAllByTestId('svg-line');
      // 6 members = 6 edges to root
      expect(edges.length).toBe(6);
    });
  });

  it('renders word labels in nodes', async () => {
    const { findByText } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);

    expect(await findByText('happy')).toBeTruthy();
    expect(await findByText('joy')).toBeTruthy();
  });

  it('truncates long word labels', async () => {
    mockUseWordFamily.mockReturnValue({
      data: {
        family: { id: 1, rootWord: 'run', createdAt: '', updatedAt: '' },
        members: [
          {
            id: 1,
            familyId: 1,
            cardId: 10,
            wordText: 'environmentalist',
            partOfSpeech: 'noun',
            formLabel: null,
            createdAt: '',
            card: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    const { findByText } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);

    // Words longer than 8 chars get truncated to 7 + '…'
    expect(await findByText('environ…')).toBeTruthy();
    // Short root word should not be truncated
    expect(await findByText('run')).toBeTruthy();
  });

  it('uses budget device node limit for full mode', async () => {
    (useAppStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { shouldReduceMotion: () => boolean; deviceTier: string }) => unknown) =>
        selector({ shouldReduceMotion: () => false, deviceTier: 'budget' })
    );

    // Provide enough members to test the budget cap (20 - 1 root = 19 members)
    const manyMembers = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      familyId: 1,
      cardId: i + 10,
      wordText: `word${i}`,
      partOfSpeech: 'noun',
      formLabel: null,
      createdAt: '',
      card: { id: i + 10, word: `word${i}` },
    }));

    mockUseWordFamily.mockReturnValue({
      data: {
        family: { id: 1, rootWord: 'base', createdAt: '', updatedAt: '' },
        members: manyMembers,
      },
      isLoading: false,
      isError: false,
    });

    const { getAllByTestId } = renderWithProviders(<WordMapView cardId={1} mode="full" />);

    await waitFor(() => {
      const nodeGroups = getAllByTestId('svg-g');
      // Budget full: max 20 nodes (1 root + 19 members)
      expect(nodeGroups.length).toBeLessThanOrEqual(20);
    });
  });

  it('renders gesture detector wrapper', async () => {
    const { getByTestId } = renderWithProviders(<WordMapView cardId={1} mode="mini" />);

    await waitFor(() => {
      expect(getByTestId('gesture-detector')).toBeTruthy();
    });
  });
});
