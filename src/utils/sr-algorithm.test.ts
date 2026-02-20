import {
  calculateNextReview,
  calculateDepthLevel,
  SM2_DEFAULTS,
  QUALITY_MAPPING,
  type SM2Input,
} from '@/utils/sr-algorithm';

describe('sr-algorithm', () => {
  describe('SM2_DEFAULTS', () => {
    it('has correct default values', () => {
      expect(SM2_DEFAULTS.INITIAL_EASE_FACTOR).toBe(2.5);
      expect(SM2_DEFAULTS.MIN_EASE_FACTOR).toBe(1.3);
      expect(SM2_DEFAULTS.MAX_EASE_FACTOR).toBe(2.5);
    });
  });

  describe('QUALITY_MAPPING', () => {
    it('maps swipe right to quality 4', () => {
      expect(QUALITY_MAPPING.know).toBe(4);
    });

    it('maps swipe left to quality 1', () => {
      expect(QUALITY_MAPPING.dontKnow).toBe(1);
    });
  });

  describe('calculateNextReview', () => {
    describe('first review (reviewCount = 0)', () => {
      it('sets interval to 1 day on correct answer', () => {
        const input: SM2Input = {
          quality: 4,
          previousInterval: 0,
          easeFactor: 2.5,
          reviewCount: 0,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(1);
        expect(result.nextEaseFactor).toBeCloseTo(2.5, 2);
      });

      it('sets interval to 1 day on wrong answer', () => {
        const input: SM2Input = {
          quality: 1,
          previousInterval: 0,
          easeFactor: 2.5,
          reviewCount: 0,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(1);
      });
    });

    describe('second review (reviewCount = 1)', () => {
      it('sets interval to 6 days on correct answer', () => {
        const input: SM2Input = {
          quality: 4,
          previousInterval: 1,
          easeFactor: 2.5,
          reviewCount: 1,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(6);
      });

      it('resets interval to 1 on wrong answer', () => {
        const input: SM2Input = {
          quality: 1,
          previousInterval: 1,
          easeFactor: 2.5,
          reviewCount: 1,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(1);
      });
    });

    describe('subsequent reviews (reviewCount >= 2)', () => {
      it('multiplies interval by ease factor on correct answer', () => {
        const input: SM2Input = {
          quality: 4,
          previousInterval: 6,
          easeFactor: 2.5,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(15); // round(6 * 2.5)
      });

      it('resets interval to 1 on wrong answer', () => {
        const input: SM2Input = {
          quality: 1,
          previousInterval: 15,
          easeFactor: 2.3,
          reviewCount: 5,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(1);
      });
    });

    describe('ease factor adjustment', () => {
      it('maintains ease factor on quality 4', () => {
        const input: SM2Input = {
          quality: 4,
          previousInterval: 6,
          easeFactor: 2.5,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        // EF' = 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02)) = 2.5 + 0.1 - 0.1 = 2.5
        expect(result.nextEaseFactor).toBeCloseTo(2.5, 2);
      });

      it('increases ease factor on quality 5', () => {
        const input: SM2Input = {
          quality: 5,
          previousInterval: 6,
          easeFactor: 2.3,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        // EF' = 2.3 + (0.1 - (5-5) * (0.08 + (5-5) * 0.02)) = 2.3 + 0.1 = 2.4
        expect(result.nextEaseFactor).toBeCloseTo(2.4, 2);
      });

      it('decreases ease factor on quality 3', () => {
        const input: SM2Input = {
          quality: 3,
          previousInterval: 6,
          easeFactor: 2.5,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        // EF' = 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02)) = 2.5 + 0.1 - 0.24 = 2.36
        expect(result.nextEaseFactor).toBeCloseTo(2.36, 2);
      });

      it('decreases ease factor on wrong answer (quality < 3)', () => {
        const input: SM2Input = {
          quality: 1,
          previousInterval: 6,
          easeFactor: 2.5,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        // Wrong answer: easeFactor - 0.2 = 2.3
        expect(result.nextEaseFactor).toBeCloseTo(2.3, 2);
      });

      it('never goes below minimum ease factor (1.3)', () => {
        const input: SM2Input = {
          quality: 0,
          previousInterval: 1,
          easeFactor: 1.3,
          reviewCount: 3,
        };
        const result = calculateNextReview(input);
        expect(result.nextEaseFactor).toBe(1.3);
      });

      it('never exceeds maximum ease factor (2.5)', () => {
        const input: SM2Input = {
          quality: 5,
          previousInterval: 6,
          easeFactor: 2.5,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        // EF' = 2.5 + 0.1 = 2.6, clamped to 2.5
        expect(result.nextEaseFactor).toBe(2.5);
      });
    });

    describe('next review date', () => {
      it('returns a valid ISO date string', () => {
        const input: SM2Input = {
          quality: 4,
          previousInterval: 0,
          easeFactor: 2.5,
          reviewCount: 0,
        };
        const result = calculateNextReview(input);
        expect(() => new Date(result.nextReviewDate)).not.toThrow();
        expect(new Date(result.nextReviewDate).toISOString()).toBe(result.nextReviewDate);
      });

      it('schedules 1 day ahead for interval = 1', () => {
        const before = Date.now();
        const input: SM2Input = {
          quality: 4,
          previousInterval: 0,
          easeFactor: 2.5,
          reviewCount: 0,
        };
        const result = calculateNextReview(input);
        const reviewDate = new Date(result.nextReviewDate).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        // Allow 5 seconds tolerance for test execution time
        expect(reviewDate).toBeGreaterThanOrEqual(before + oneDayMs - 5000);
        expect(reviewDate).toBeLessThanOrEqual(before + oneDayMs + 5000);
      });
    });

    describe('streak progression', () => {
      it('produces increasing intervals on consecutive correct answers', () => {
        let interval = 0;
        let ease = 2.5;
        let reviewCount = 0;
        const intervals: number[] = [];

        for (let i = 0; i < 6; i++) {
          const result = calculateNextReview({
            quality: 4,
            previousInterval: interval,
            easeFactor: ease,
            reviewCount,
          });
          intervals.push(result.nextInterval);
          interval = result.nextInterval;
          ease = result.nextEaseFactor;
          reviewCount++;
        }

        // Expected progression: 1, 6, 15, 38, 95, 238 (approximately)
        expect(intervals[0]).toBe(1);
        expect(intervals[1]).toBe(6);
        expect(intervals[2]).toBeGreaterThanOrEqual(15);

        // Each subsequent interval should be larger
        for (let i = 1; i < intervals.length; i++) {
          expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
        }
      });
    });

    describe('edge cases', () => {
      it('handles quality 0 (complete blackout)', () => {
        const input: SM2Input = {
          quality: 0,
          previousInterval: 30,
          easeFactor: 2.5,
          reviewCount: 10,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(1);
        expect(result.nextEaseFactor).toBeCloseTo(2.3, 2);
      });

      it('handles very high review count', () => {
        const input: SM2Input = {
          quality: 4,
          previousInterval: 365,
          easeFactor: 2.5,
          reviewCount: 100,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBeGreaterThan(365);
        expect(result.nextEaseFactor).toBeCloseTo(2.5, 2);
      });

      it('handles minimum ease factor with correct answer', () => {
        const input: SM2Input = {
          quality: 3,
          previousInterval: 6,
          easeFactor: 1.3,
          reviewCount: 2,
        };
        const result = calculateNextReview(input);
        expect(result.nextInterval).toBe(Math.round(6 * 1.3)); // 8
        expect(result.nextEaseFactor).toBeGreaterThanOrEqual(1.3);
      });
    });
  });

  describe('calculateDepthLevel', () => {
    it('returns level 1 for new card with few reviews', () => {
      expect(calculateDepthLevel({ reviewCount: 1, easeFactor: 2.5, accuracy: 1.0 })).toBe(1);
      expect(calculateDepthLevel({ reviewCount: 2, easeFactor: 2.5, accuracy: 1.0 })).toBe(1);
    });

    it('returns level 2 at 3+ reviews, ease ≥ 2.0, accuracy ≥ 0.6', () => {
      expect(calculateDepthLevel({ reviewCount: 3, easeFactor: 2.0, accuracy: 0.6 })).toBe(2);
      expect(calculateDepthLevel({ reviewCount: 5, easeFactor: 2.1, accuracy: 0.7 })).toBe(2);
    });

    it('returns level 3 at 7+ reviews, ease ≥ 2.2, accuracy ≥ 0.7', () => {
      expect(calculateDepthLevel({ reviewCount: 7, easeFactor: 2.2, accuracy: 0.7 })).toBe(3);
      expect(calculateDepthLevel({ reviewCount: 9, easeFactor: 2.3, accuracy: 0.75 })).toBe(3);
    });

    it('returns level 4 at 10+ reviews, ease ≥ 2.3, accuracy ≥ 0.8', () => {
      expect(calculateDepthLevel({ reviewCount: 10, easeFactor: 2.3, accuracy: 0.8 })).toBe(4);
      expect(calculateDepthLevel({ reviewCount: 20, easeFactor: 2.5, accuracy: 0.95 })).toBe(4);
    });

    it('does not advance to level 2 if ease too low', () => {
      expect(calculateDepthLevel({ reviewCount: 5, easeFactor: 1.9, accuracy: 0.8 })).toBe(1);
    });

    it('does not advance to level 3 if accuracy too low', () => {
      expect(calculateDepthLevel({ reviewCount: 8, easeFactor: 2.3, accuracy: 0.6 })).toBe(2);
    });

    it('does not regress (function returns current level based on state)', () => {
      // A card with 10 reviews but low ease stays at level 2
      expect(calculateDepthLevel({ reviewCount: 10, easeFactor: 2.0, accuracy: 0.65 })).toBe(2);
    });
  });
});
