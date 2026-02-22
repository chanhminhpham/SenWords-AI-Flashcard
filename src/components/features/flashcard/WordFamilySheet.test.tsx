import { render } from '@testing-library/react-native';
import React from 'react';

import { WordFamilySheet } from './WordFamilySheet';
import type { WordFamilyWithMembers } from '@/types/vocabulary';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@gorhom/bottom-sheet', () => require('@/__test-utils__/bottom-sheet-mock'));

jest.mock('@/services/haptics', () => ({
  hapticTapSuccess: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params?.word) return `${params.word}, ${params.partOfSpeech}`;
      return key;
    },
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

jest.mock('@/stores/app.store', () => ({
  useAppStore: (selector: (s: { deviceTier: string }) => unknown) =>
    selector({ deviceTier: 'standard' }),
}));

const mockData: WordFamilyWithMembers = {
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
    {
      id: 2,
      familyId: 10,
      cardId: null,
      wordText: 'environmental',
      partOfSpeech: 'adjective',
      formLabel: 'derived',
      createdAt: '',
      card: null,
    },
  ],
};

describe('WordFamilySheet', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the bottom sheet with family data', () => {
    const { getByTestId, getAllByTestId } = render(
      <WordFamilySheet data={mockData} currentCardId={5} onClose={onClose} />
    );

    expect(getByTestId('bottom-sheet')).toBeTruthy();
    expect(getAllByTestId('word-family-member')).toHaveLength(2);
  });

  it('fires haptic on mount', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { hapticTapSuccess } = require('@/services/haptics');

    render(<WordFamilySheet data={mockData} currentCardId={5} onClose={onClose} />);

    expect(hapticTapSuccess).toHaveBeenCalled();
  });

  it('shows noDefinition key for members without a linked card', () => {
    const { getAllByTestId, getByText } = render(
      <WordFamilySheet data={mockData} currentCardId={5} onClose={onClose} />
    );

    const members = getAllByTestId('word-family-member');
    expect(members[1]).toBeTruthy();
    // The i18n mock returns the key as-is; noDefinition key should appear
    expect(getByText('wordFamily.noDefinition')).toBeTruthy();
  });
});
