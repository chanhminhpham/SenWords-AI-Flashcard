import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import { fetchWordFamily } from '@/services/dictionary/word-family.service';

/**
 * TanStack Query hook for word family data.
 * Disabled when cardId is falsy (0 or undefined).
 */
export function useWordFamily(cardId: number) {
  return useQuery({
    queryKey: queryKeys.wordFamily.byCardId(cardId),
    queryFn: () => fetchWordFamily(cardId),
    enabled: cardId > 0,
    staleTime: Infinity, // Word family data is static dictionary data
  });
}
