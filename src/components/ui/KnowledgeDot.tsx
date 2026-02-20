// KnowledgeDot — Depth indicator for vocabulary cards (Story 1.6 → 1.7)
// Shows learning progress across 4 depth levels
import { View, StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type DepthState = 'empty' | 'half' | 'full';

interface KnowledgeDotProps {
  /** Legacy state prop (backward compatible) */
  state?: DepthState;
  /** Depth level 1-4 from sr_schedule (overrides state when provided) */
  depthLevel?: number;
  size?: number;
  testID?: string;
}

/**
 * Maps depth level (1-4) to visual state and color.
 *
 * Level 1 "Mới": empty circle ○ — amber
 * Level 2 "Đang học": half circle ◐ — amber
 * Level 3 "Khá": half circle ◐ — blue
 * Level 4 "Thành thạo": full circle ● — green
 */
function depthToVisual(
  depth: number,
  colors: { layer1: string; layer2: string; layer4: string }
): { shape: DepthState; color: string } {
  switch (depth) {
    case 4:
      return { shape: 'full', color: colors.layer1 }; // Green
    case 3:
      return { shape: 'half', color: colors.layer2 }; // Blue
    case 2:
      return { shape: 'half', color: colors.layer4 }; // Amber
    default:
      return { shape: 'empty', color: colors.layer4 }; // Amber
  }
}

const DEPTH_LABELS: Record<number, string> = {
  1: 'mới',
  2: 'đang học',
  3: 'khá',
  4: 'thành thạo',
};

/**
 * Visual indicator of vocabulary mastery level.
 *
 * Accepts either a legacy `state` prop or a numeric `depthLevel` (1-4).
 * When `depthLevel` is provided, it takes precedence.
 */
export function KnowledgeDot({
  state,
  depthLevel,
  size = 8,
  testID = 'knowledge-dot',
}: KnowledgeDotProps) {
  const theme = useAppTheme();

  let shape: DepthState;
  let color: string;

  if (depthLevel != null) {
    const visual = depthToVisual(depthLevel, theme.colors.depth);
    shape = visual.shape;
    color = visual.color;
  } else {
    // Legacy state-based rendering
    shape = state ?? 'empty';
    switch (shape) {
      case 'full':
        color = theme.colors.depth.layer1;
        break;
      case 'half':
        color = theme.colors.depth.layer2;
        break;
      default:
        color = theme.colors.depth.layer4;
    }
  }

  const label =
    depthLevel != null
      ? `Trạng thái học: ${DEPTH_LABELS[depthLevel] ?? 'mới'}`
      : `Trạng thái học: ${shape === 'empty' ? 'mới' : shape === 'half' ? 'đang học' : 'thành thạo'}`;

  const borderStyle = shape === 'empty' ? { borderWidth: 2, borderColor: color } : {};
  const fillStyle = shape !== 'empty' ? { backgroundColor: color } : {};

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityLabel={label}
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
