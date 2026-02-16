import { useTheme } from 'react-native-paper';

import type { SenWordTheme } from '@/theme/sen-word-theme';

/**
 * Typed wrapper around Paper's useTheme for SenWordTheme access.
 * Provides typed access to custom color groups (nature, feedback, depth),
 * spacing tokens, animation tokens, and border radius tokens.
 */
export function useAppTheme() {
  return useTheme<SenWordTheme>();
}
