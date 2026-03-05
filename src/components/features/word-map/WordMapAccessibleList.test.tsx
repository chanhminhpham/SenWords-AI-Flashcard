/* eslint-disable @typescript-eslint/no-require-imports, import/first */

jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { WordMapAccessibleList } from './WordMapAccessibleList';
import type { WordMapNode, WordFamilyWithMembers } from '@/types/vocabulary';

const mockWordFamilyData: WordFamilyWithMembers = {
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
      card: null as unknown as import('@/types/vocabulary').VocabularyCard,
    },
    {
      id: 2,
      familyId: 1,
      cardId: null,
      wordText: 'unhappy',
      partOfSpeech: 'adj',
      formLabel: 'antonym',
      createdAt: '',
      card: null,
    },
  ],
};

const mockNodes: WordMapNode[] = [
  { id: 'root-1', word: 'happy', type: 'root', cardId: null, x: 150, y: 150 },
  {
    id: 'member-1',
    word: 'happiness',
    type: 'family',
    cardId: 10,
    partOfSpeech: 'noun',
    formLabel: 'noun form',
    x: 200,
    y: 100,
  },
  {
    id: 'member-2',
    word: 'unhappy',
    type: 'family',
    cardId: null,
    partOfSpeech: 'adj',
    formLabel: 'antonym',
    x: 100,
    y: 200,
  },
];

describe('WordMapAccessibleList', () => {
  const mockOnNodeTap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the accessible list container', () => {
    const { getByTestId } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );
    expect(getByTestId('word-map-accessible-list')).toBeTruthy();
  });

  it('renders connection text with root word and member words', () => {
    const { getByText } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );
    // i18n mock returns keys, so check for the key pattern
    expect(getByText('wordMap.a11y.connection')).toBeTruthy();
  });

  it('renders all nodes as tappable rows', () => {
    const { getByTestId } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );
    expect(getByTestId('accessible-node-root-1')).toBeTruthy();
    expect(getByTestId('accessible-node-member-1')).toBeTruthy();
    expect(getByTestId('accessible-node-member-2')).toBeTruthy();
  });

  it('renders word text for each node', () => {
    const { getByText } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );
    expect(getByText('happy')).toBeTruthy();
    expect(getByText('happiness')).toBeTruthy();
    expect(getByText('unhappy')).toBeTruthy();
  });

  it('renders part of speech labels', () => {
    const { getAllByText } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );
    expect(getAllByText('noun').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('adj').length).toBeGreaterThanOrEqual(1);
  });

  it('renders form labels in parentheses', () => {
    const { getByText } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );
    expect(getByText('(noun form)')).toBeTruthy();
    expect(getByText('(antonym)')).toBeTruthy();
  });

  it('calls onNodeTap when a row is pressed', () => {
    const { getByTestId } = render(
      <WordMapAccessibleList
        wordFamilyData={mockWordFamilyData}
        nodes={mockNodes}
        onNodeTap={mockOnNodeTap}
      />
    );

    fireEvent.press(getByTestId('accessible-node-member-1'));
    expect(mockOnNodeTap).toHaveBeenCalledWith('member-1');
  });
});
