import { MD3DarkTheme } from 'react-native-paper';
import { Easing } from 'react-native';

import { DARK_COLORS } from '@/theme/colors';
import { paperFonts } from '@/theme/fonts';
import type { SenWordTheme } from '@/theme/sen-word-theme';

// ─── Dark Theme (Nature Night) ──────────────────────────────
export const senWordDarkTheme: SenWordTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 12,
  fonts: paperFonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: DARK_COLORS.nature.accent,
    primaryContainer: DARK_COLORS.primaryContainer,
    secondary: DARK_COLORS.sky.blue,
    secondaryContainer: DARK_COLORS.secondaryContainer,
    tertiary: DARK_COLORS.lotus.pink,
    tertiaryContainer: DARK_COLORS.tertiaryContainer,
    surface: DARK_COLORS.surface,
    background: DARK_COLORS.background,
    error: DARK_COLORS.feedback.error,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: DARK_COLORS.textPrimary,
    onSecondary: '#FFFFFF',
    onSecondaryContainer: DARK_COLORS.textPrimary,
    onTertiary: '#FFFFFF',
    onTertiaryContainer: DARK_COLORS.textPrimary,
    onSurface: DARK_COLORS.textPrimary,
    onSurfaceVariant: DARK_COLORS.onSurfaceVariant,
    onBackground: DARK_COLORS.textPrimary,
    onError: '#1A2318',
    outline: DARK_COLORS.form.borderDefault,
    // Custom color groups
    nature: {
      accent: DARK_COLORS.nature.accent,
      tint: DARK_COLORS.nature.tint,
      warm: DARK_COLORS.nature.warm,
    },
    feedback: {
      know: DARK_COLORS.feedback.know,
      dontKnow: DARK_COLORS.feedback.dontKnow,
      dontKnowText: DARK_COLORS.feedback.dontKnowText,
      explore: DARK_COLORS.feedback.explore,
      info: DARK_COLORS.feedback.info,
      error: DARK_COLORS.feedback.error,
    },
    depth: {
      layer1: DARK_COLORS.depth.layer1,
      layer2: DARK_COLORS.depth.layer2,
      layer3: DARK_COLORS.depth.layer3,
      layer4: DARK_COLORS.depth.layer4,
    },
    sky: {
      blue: DARK_COLORS.sky.blue,
      text: DARK_COLORS.sky.text,
    },
    lotus: {
      pink: DARK_COLORS.lotus.pink,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    swipeThreshold: {
      placement: 40,
      learning: 80,
    },
  },
  animation: {
    scale: 1,
    spring: {
      bounceBack: { damping: 15, stiffness: 150 },
      celebrate: { damping: 12, stiffness: 100 },
    },
    timing: {
      fast: { duration: 150, easing: Easing.out(Easing.ease) },
      standard: { duration: 300, easing: Easing.inOut(Easing.ease) },
    },
  },
  borderRadius: {
    card: 16,
    button: 12,
    chip: 8,
    bubble: 20,
  },
};
