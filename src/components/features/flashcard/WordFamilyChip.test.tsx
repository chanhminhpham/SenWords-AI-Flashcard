import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { WordFamilyChip } from './WordFamilyChip';

const mockData = {
  family: { id: 10, rootWord: 'environment', createdAt: '', updatedAt: '' },
  members: [
    {
      id: 1,
      familyId: 10,
      cardId: 5,
      wordText: 'environment',
      partOfSpeech: 'noun',
      formLabel: 'base form',
      createdAt: '',
      card: {
        id: 5,
        word: 'environment',
        definition: 'moi truong',
        partOfSpeech: 'noun',
        ipa: null,
        exampleSentence: null,
        audioUrlAmerican: null,
        audioUrlBritish: null,
        imageUrl: null,
        difficultyLevel: 2,
        topicTags: [],
        createdAt: '',
      },
    },
  ],
};

const mockUseWordFamily = jest.fn();

jest.mock('@/hooks/use-word-family', () => ({
  useWordFamily: (...args: unknown[]) => mockUseWordFamily(...args),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/theme/use-app-theme', () => ({
  useAppTheme: () => ({
    colors: {
      nature: { accent: '#2D8A5E', tint: '#E8F5E9' },
      onSurface: '#000',
      onSurfaceVariant: '#666',
      background: '#fff',
    },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('./WordFamilySheet', () => require('@/__test-utils__/word-family-sheet-mock'));

describe('WordFamilyChip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when loading', () => {
    mockUseWordFamily.mockReturnValue({ data: undefined, isLoading: true });

    const { queryByTestId } = render(<WordFamilyChip cardId={5} />);
    expect(queryByTestId('word-family-chip')).toBeNull();
  });

  it('renders null when no family data', () => {
    mockUseWordFamily.mockReturnValue({ data: null, isLoading: false });

    const { queryByTestId } = render(<WordFamilyChip cardId={5} />);
    expect(queryByTestId('word-family-chip')).toBeNull();
  });

  it('renders chip when family data exists', () => {
    mockUseWordFamily.mockReturnValue({ data: mockData, isLoading: false });

    const { getByTestId } = render(<WordFamilyChip cardId={5} />);
    expect(getByTestId('word-family-chip')).toBeTruthy();
  });

  it('opens sheet on press', () => {
    mockUseWordFamily.mockReturnValue({ data: mockData, isLoading: false });

    const { getByTestId, queryByTestId } = render(<WordFamilyChip cardId={5} />);
    expect(queryByTestId('word-family-sheet')).toBeNull();

    fireEvent.press(getByTestId('word-family-chip'));
    expect(getByTestId('word-family-sheet')).toBeTruthy();
  });
});
