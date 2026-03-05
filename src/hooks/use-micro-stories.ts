import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import { fetchMicroStories } from '@/services/dictionary/micro-story.service';

/**
 * TanStack Query hook for micro-story data by word family.
 * Disabled when familyId is falsy (0, undefined, null).
 */
export function useMicroStories(familyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.microStories.byFamilyId(familyId ?? 0),
    queryFn: () => fetchMicroStories(familyId!),
    enabled: !!familyId && familyId > 0,
    staleTime: Infinity, // Micro-story data is static dictionary data
  });
}
