import type { MicroStoryHighlightedWord } from '@/types/vocabulary';
import { parseStorySegments } from './story-segment-parser';

describe('parseStorySegments', () => {
  it('returns single plain segment when no highlights', () => {
    const result = parseStorySegments('Hello world', []);
    expect(result).toEqual([{ text: 'Hello world', isHighlighted: false }]);
  });

  it('returns single plain segment when highlights is empty array', () => {
    const result = parseStorySegments('Hello world', []);
    expect(result).toHaveLength(1);
    expect(result[0].isHighlighted).toBe(false);
  });

  it('parses a single highlighted word in the middle', () => {
    const text = 'The cat sat';
    const highlights: MicroStoryHighlightedWord[] = [
      { wordText: 'cat', startIndex: 4, endIndex: 7, definition: 'a feline', partOfSpeech: 'noun' },
    ];

    const result = parseStorySegments(text, highlights);
    expect(result).toEqual([
      { text: 'The ', isHighlighted: false },
      {
        text: 'cat',
        isHighlighted: true,
        word: 'cat',
        definition: 'a feline',
        partOfSpeech: 'noun',
      },
      { text: ' sat', isHighlighted: false },
    ]);
  });

  it('parses multiple highlighted words', () => {
    const text = 'The cat and dog played';
    const highlights: MicroStoryHighlightedWord[] = [
      { wordText: 'cat', startIndex: 4, endIndex: 7, definition: 'feline', partOfSpeech: 'noun' },
      {
        wordText: 'dog',
        startIndex: 12,
        endIndex: 15,
        definition: 'canine',
        partOfSpeech: 'noun',
      },
    ];

    const result = parseStorySegments(text, highlights);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ text: 'The ', isHighlighted: false });
    expect(result[1].isHighlighted).toBe(true);
    expect(result[1].word).toBe('cat');
    expect(result[2]).toEqual({ text: ' and ', isHighlighted: false });
    expect(result[3].isHighlighted).toBe(true);
    expect(result[3].word).toBe('dog');
    expect(result[4]).toEqual({ text: ' played', isHighlighted: false });
  });

  it('handles highlighted word at start of text', () => {
    const text = 'Cat sat on mat';
    const highlights: MicroStoryHighlightedWord[] = [
      { wordText: 'Cat', startIndex: 0, endIndex: 3, definition: 'feline', partOfSpeech: 'noun' },
    ];

    const result = parseStorySegments(text, highlights);
    expect(result[0].isHighlighted).toBe(true);
    expect(result[0].text).toBe('Cat');
    expect(result[1].text).toBe(' sat on mat');
  });

  it('handles highlighted word at end of text', () => {
    const text = 'I see a cat';
    const highlights: MicroStoryHighlightedWord[] = [
      { wordText: 'cat', startIndex: 8, endIndex: 11, definition: 'feline', partOfSpeech: 'noun' },
    ];

    const result = parseStorySegments(text, highlights);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ text: 'I see a ', isHighlighted: false });
    expect(result[1].isHighlighted).toBe(true);
    expect(result[1].text).toBe('cat');
  });

  it('sorts highlights by startIndex regardless of input order', () => {
    const text = 'A big red fox';
    const highlights: MicroStoryHighlightedWord[] = [
      { wordText: 'fox', startIndex: 10, endIndex: 13, definition: 'animal', partOfSpeech: 'noun' },
      { wordText: 'big', startIndex: 2, endIndex: 5, definition: 'large', partOfSpeech: 'adj' },
    ];

    const result = parseStorySegments(text, highlights);
    expect(result[0]).toEqual({ text: 'A ', isHighlighted: false });
    expect(result[1].word).toBe('big');
    expect(result[3].word).toBe('fox');
  });

  it('skips overlapping highlights', () => {
    const text = 'The catfish swam';
    const highlights: MicroStoryHighlightedWord[] = [
      {
        wordText: 'cat',
        startIndex: 4,
        endIndex: 7,
        definition: 'feline',
        partOfSpeech: 'noun',
      },
      {
        wordText: 'catfish',
        startIndex: 4,
        endIndex: 11,
        definition: 'a fish',
        partOfSpeech: 'noun',
      },
    ];

    const result = parseStorySegments(text, highlights);
    // First highlight wins, second is skipped (overlap)
    const highlightedSegments = result.filter((s) => s.isHighlighted);
    expect(highlightedSegments).toHaveLength(1);
    expect(highlightedSegments[0].word).toBe('cat');
  });

  it('skips invalid ranges where endIndex <= startIndex', () => {
    const text = 'Hello world';
    const highlights: MicroStoryHighlightedWord[] = [
      { wordText: 'bad', startIndex: 5, endIndex: 5, definition: '', partOfSpeech: '' },
    ];

    const result = parseStorySegments(text, highlights);
    expect(result).toEqual([{ text: 'Hello world', isHighlighted: false }]);
  });
});
