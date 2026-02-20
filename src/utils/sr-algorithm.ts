/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Pure functions implementing the SuperMemo 2 algorithm.
 * No side effects — all state changes handled by sr.service.ts.
 *
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export const SM2_DEFAULTS = {
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 2.5,
} as const;

export const QUALITY_MAPPING = {
  know: 4, // Swipe right
  dontKnow: 1, // Swipe left
} as const;

export interface SM2Input {
  /** Quality of recall: 0-5 (0 = blackout, 5 = perfect) */
  quality: number;
  /** Previous interval in days */
  previousInterval: number;
  /** Current ease factor (1.3 - 2.5) */
  easeFactor: number;
  /** Number of times previously reviewed */
  reviewCount: number;
}

export interface SM2Result {
  /** Next interval in days */
  nextInterval: number;
  /** Updated ease factor */
  nextEaseFactor: number;
  /** ISO date string for next review */
  nextReviewDate: string;
}

export function calculateNextReview(input: SM2Input): SM2Result {
  const { quality, previousInterval, easeFactor, reviewCount } = input;

  let nextInterval: number;
  let nextEaseFactor: number;

  if (quality < 3) {
    // Wrong answer: reset interval, decrease ease
    nextInterval = 1;
    nextEaseFactor = Math.max(SM2_DEFAULTS.MIN_EASE_FACTOR, easeFactor - 0.2);
  } else {
    // Correct answer: calculate new interval based on review count
    if (reviewCount === 0) {
      nextInterval = 1;
    } else if (reviewCount === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(previousInterval * easeFactor);
    }

    // Update ease factor using SM-2 formula
    nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Clamp ease factor within bounds
    nextEaseFactor = Math.min(
      SM2_DEFAULTS.MAX_EASE_FACTOR,
      Math.max(SM2_DEFAULTS.MIN_EASE_FACTOR, nextEaseFactor)
    );
  }

  // Calculate next review date
  const nextReviewDate = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000).toISOString();

  return { nextInterval, nextEaseFactor, nextReviewDate };
}

// ---------------------------------------------------------------------------
// Depth Level Calculation (AC4)
// ---------------------------------------------------------------------------

export interface DepthInput {
  reviewCount: number;
  easeFactor: number;
  accuracy: number;
}

/**
 * Calculate depth level (1-4) based on review performance.
 *
 * Level 1 "Mới" (Nhận diện): Default — card has been seen
 * Level 2 "Đang học" (Liên kết): 3+ reviews, ease ≥ 2.0, accuracy ≥ 0.6
 * Level 3 "Khá" (Sản xuất): 7+ reviews, ease ≥ 2.2, accuracy ≥ 0.7
 * Level 4 "Thành thạo" (Ứng dụng): 10+ reviews, ease ≥ 2.3, accuracy ≥ 0.8
 */
export function calculateDepthLevel(input: DepthInput): number {
  const { reviewCount, easeFactor, accuracy } = input;

  if (reviewCount >= 10 && easeFactor >= 2.3 && accuracy >= 0.8) return 4;
  if (reviewCount >= 7 && easeFactor >= 2.2 && accuracy >= 0.7) return 3;
  if (reviewCount >= 3 && easeFactor >= 2.0 && accuracy >= 0.6) return 2;
  return 1;
}
