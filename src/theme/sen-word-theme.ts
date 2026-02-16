import type { MD3Theme } from 'react-native-paper';
import { MD3LightTheme } from 'react-native-paper';
import { Easing } from 'react-native';

import { LIGHT_COLORS } from '@/theme/colors';
import { paperFonts } from '@/theme/fonts';

// ─── SenWordTheme Interface ─────────────────────────────────
export interface SenWordTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    nature: {
      accent: string;
      tint: string;
      warm: string;
    };
    feedback: {
      know: string;
      dontKnow: string;
      dontKnowText: string;
      explore: string;
      info: string;
      error: string;
    };
    depth: {
      layer1: string;
      layer2: string;
      layer3: string;
      layer4: string;
    };
    sky: {
      blue: string;
      text: string;
    };
    lotus: {
      pink: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    swipeThreshold: {
      placement: number;
      learning: number;
    };
  };
  animation: {
    scale: number;
    defaultAnimationDuration?: number;
    spring: {
      bounceBack: { damping: number; stiffness: number };
      celebrate: { damping: number; stiffness: number };
    };
    timing: {
      fast: { duration: number; easing: (t: number) => number };
      standard: { duration: number; easing: (t: number) => number };
    };
  };
  borderRadius: {
    card: number;
    button: number;
    chip: number;
    bubble: number;
  };
}

// ─── Light Theme ────────────────────────────────────────────
export const senWordLightTheme: SenWordTheme = {
  ...MD3LightTheme,
  dark: false,
  roundness: 12,
  fonts: paperFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: LIGHT_COLORS.nature.accent,
    primaryContainer: LIGHT_COLORS.nature.tint,
    secondary: LIGHT_COLORS.sky.blue,
    secondaryContainer: LIGHT_COLORS.secondaryContainer,
    tertiary: LIGHT_COLORS.lotus.pink,
    tertiaryContainer: LIGHT_COLORS.tertiaryContainer,
    surface: LIGHT_COLORS.surface,
    background: LIGHT_COLORS.background,
    error: LIGHT_COLORS.feedback.error,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: LIGHT_COLORS.textPrimary,
    onSecondary: '#FFFFFF',
    onSecondaryContainer: LIGHT_COLORS.textPrimary,
    onTertiary: '#FFFFFF',
    onTertiaryContainer: LIGHT_COLORS.textPrimary,
    onSurface: LIGHT_COLORS.textPrimary,
    onSurfaceVariant: LIGHT_COLORS.onSurfaceVariant,
    onBackground: LIGHT_COLORS.textPrimary,
    onError: '#FFFFFF',
    // Custom color groups
    nature: {
      accent: LIGHT_COLORS.nature.accent,
      tint: LIGHT_COLORS.nature.tint,
      warm: LIGHT_COLORS.nature.warm,
    },
    feedback: {
      know: LIGHT_COLORS.feedback.know,
      dontKnow: LIGHT_COLORS.feedback.dontKnow,
      dontKnowText: LIGHT_COLORS.feedback.dontKnowText,
      explore: LIGHT_COLORS.feedback.explore,
      info: LIGHT_COLORS.feedback.info,
      error: LIGHT_COLORS.feedback.error,
    },
    depth: {
      layer1: LIGHT_COLORS.depth.layer1,
      layer2: LIGHT_COLORS.depth.layer2,
      layer3: LIGHT_COLORS.depth.layer3,
      layer4: LIGHT_COLORS.depth.layer4,
    },
    sky: {
      blue: LIGHT_COLORS.sky.blue,
      text: LIGHT_COLORS.sky.text,
    },
    lotus: {
      pink: LIGHT_COLORS.lotus.pink,
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
