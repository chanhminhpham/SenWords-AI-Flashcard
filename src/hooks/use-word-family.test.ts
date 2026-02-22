import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useWordFamily } from '@/hooks/use-word-family';

const mockFetchWordFamily = jest.fn();

jest.mock('@/services/dictionary/word-family.service', () => ({
  fetchWordFamily: (...args: unknown[]) => mockFetchWordFamily(...args),
}));

let queryClient: QueryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useWordFamily', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('returns data when family exists', async () => {
    const mockData = {
      family: { id: 10, rootWord: 'test', createdAt: '', updatedAt: '' },
      members: [
        {
          id: 1,
          familyId: 10,
          cardId: 5,
          wordText: 'test',
          partOfSpeech: 'noun',
          formLabel: 'base form',
          createdAt: '',
          card: null,
        },
      ],
    };
    mockFetchWordFamily.mockReturnValue(mockData);

    const { result } = renderHook(() => useWordFamily(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual(mockData);
    expect(mockFetchWordFamily).toHaveBeenCalledWith(5);
  });

  it('returns null data when no family exists', async () => {
    mockFetchWordFamily.mockReturnValue(null);

    const { result } = renderHook(() => useWordFamily(99), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('does not fetch when cardId is 0', async () => {
    const { result } = renderHook(() => useWordFamily(0), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(mockFetchWordFamily).not.toHaveBeenCalled();
  });
});
