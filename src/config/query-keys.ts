/**
 * TanStack Query key conventions: [domain, action, ...params]
 * Centralised here to prevent key collisions and enable targeted invalidation.
 */
export const queryKeys = {
  dictionary: {
    all: ['dictionary'] as const,
    search: (query: string) => ['dictionary', 'search', query] as const,
    word: (word: string) => ['dictionary', 'word', word] as const,
    byDifficulty: (level: number) => ['dictionary', 'byDifficulty', level] as const,
  },
  learning: {
    all: ['learning'] as const,
    events: (userId: string) => ['learning', 'events', userId] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    upcoming: (userId: string) => ['schedule', 'upcoming', userId] as const,
  },
  preferences: {
    all: ['preferences'] as const,
    user: (userId: string) => ['preferences', 'user', userId] as const,
  },
} as const;
