import { PLACEMENT_WORDS, PLACEMENT_WORD_COUNT } from './placement-test-words';

describe('placement-test-words', () => {
  it('contains exactly 10 words', () => {
    expect(PLACEMENT_WORDS).toHaveLength(10);
    expect(PLACEMENT_WORD_COUNT).toBe(10);
  });

  it('each word has required fields', () => {
    for (const word of PLACEMENT_WORDS) {
      expect(word.id).toBeTruthy();
      expect(word.word).toBeTruthy();
      expect(word.translation).toBeTruthy();
      expect(typeof word.difficulty).toBe('number');
      expect(word.difficulty).toBeGreaterThanOrEqual(0);
      expect(word.difficulty).toBeLessThanOrEqual(1);
    }
  });

  it('has unique IDs', () => {
    const ids = PLACEMENT_WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is ordered by ascending difficulty', () => {
    for (let i = 1; i < PLACEMENT_WORDS.length; i++) {
      expect(PLACEMENT_WORDS[i].difficulty).toBeGreaterThanOrEqual(
        PLACEMENT_WORDS[i - 1].difficulty
      );
    }
  });
});
