// KnowledgeDot — Depth indicator for vocabulary cards (Story 1.6)
// Shows learning progress: Empty → Half → Full
import { View, StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type DepthState = 'empty' | 'half' | 'full';

interface KnowledgeDotProps {
  state: DepthState;
  size?: number;
  testID?: string;
}

/**
 * Visual indicator of vocabulary mastery level.
 *
 * States:
 * - Empty ○: New card, no mastery
 * - Half ◐: In progress, some mastery
 * - Full ●: Mastered card
 *
 * Color progression: Amber (#F5A623) → Blue (#4A9FE5) → Green (#4ECBA0)
 */
export function KnowledgeDot({ state, size = 8, testID = 'knowledge-dot' }: KnowledgeDotProps) {
  const theme = useAppTheme();

  const getColor = () => {
    switch (state) {
      case 'empty':
        return theme.colors.depth.layer4; // Amber
      case 'half':
        return theme.colors.depth.layer2; // Blue
      case 'full':
        return theme.colors.depth.layer1; // Green
    }
  };

  const borderStyle = state === 'empty' ? { borderWidth: 2, borderColor: getColor() } : {};
  const fillStyle = state !== 'empty' ? { backgroundColor: getColor() } : {};

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityLabel={`Trạng thái học: ${state === 'empty' ? 'mới' : state === 'half' ? 'đang học' : 'thành thạo'}`}
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2 },
        borderStyle,
        fillStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
