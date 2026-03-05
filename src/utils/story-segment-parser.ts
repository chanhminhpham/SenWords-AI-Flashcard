import type { MicroStoryHighlightedWord, StorySegment } from '@/types/vocabulary';

/**
 * Parse a micro-story text into alternating plain/highlighted segments.
 * Highlights are sorted by startIndex to handle any ordering.
 */
export function parseStorySegments(
  storyText: string,
  highlights: MicroStoryHighlightedWord[]
): StorySegment[] {
  if (!highlights || highlights.length === 0) {
    return [{ text: storyText, isHighlighted: false }];
  }

  const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
  const segments: StorySegment[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    // Skip invalid or overlapping ranges
    if (hl.startIndex < cursor || hl.endIndex <= hl.startIndex) continue;

    // Plain text before highlight
    if (hl.startIndex > cursor) {
      segments.push({ text: storyText.slice(cursor, hl.startIndex), isHighlighted: false });
    }

    // Highlighted word
    segments.push({
      text: storyText.slice(hl.startIndex, hl.endIndex),
      isHighlighted: true,
      word: hl.wordText,
      definition: hl.definition,
      partOfSpeech: hl.partOfSpeech,
    });

    cursor = hl.endIndex;
  }

  // Remaining plain text
  if (cursor < storyText.length) {
    segments.push({ text: storyText.slice(cursor), isHighlighted: false });
  }

  return segments;
}
