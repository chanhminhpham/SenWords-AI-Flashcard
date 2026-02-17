// Placement test word bank for Story 1.4
// 10 curated words spanning A1 (easy) to B2 (hard) difficulty

import type { PlacementWord } from '@/types/onboarding';

export const PLACEMENT_WORDS: readonly PlacementWord[] = [
  // A1 — Basic everyday words
  { id: 'pw-01', word: 'cat', translation: 'con mèo', difficulty: 0.1 },
  { id: 'pw-02', word: 'happy', translation: 'vui vẻ', difficulty: 0.15 },
  { id: 'pw-03', word: 'book', translation: 'quyển sách', difficulty: 0.2 },

  // A2 — Common but slightly broader
  { id: 'pw-04', word: 'journey', translation: 'cuộc hành trình', difficulty: 0.35 },
  { id: 'pw-05', word: 'decision', translation: 'quyết định', difficulty: 0.4 },

  // B1 — Intermediate vocabulary
  { id: 'pw-06', word: 'accomplish', translation: 'hoàn thành', difficulty: 0.55 },
  { id: 'pw-07', word: 'influence', translation: 'ảnh hưởng', difficulty: 0.6 },

  // B2 — Upper-intermediate vocabulary
  { id: 'pw-08', word: 'environment', translation: 'môi trường', difficulty: 0.75 },
  { id: 'pw-09', word: 'subsequent', translation: 'tiếp theo sau', difficulty: 0.85 },
  { id: 'pw-10', word: 'ubiquitous', translation: 'có mặt khắp nơi', difficulty: 0.95 },
] as const;

export const PLACEMENT_WORD_COUNT = PLACEMENT_WORDS.length; // 10
