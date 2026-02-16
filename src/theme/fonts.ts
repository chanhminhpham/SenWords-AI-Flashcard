import { configureFonts } from 'react-native-paper';

/**
 * Shared font configuration for Paper themes.
 * Maps Nunito Sans font files to MD3 typescale weight variants.
 */

const baseFont = { fontFamily: 'NunitoSans_400Regular' } as const;

/**
 * Per-variant font mapping so Paper renders correct weights.
 * React Native requires explicit font file → weight mapping for custom fonts.
 */
export const paperFonts = configureFonts({
  config: {
    displayLarge: { ...baseFont, fontFamily: 'NunitoSans_700Bold' },
    displayMedium: { ...baseFont, fontFamily: 'NunitoSans_700Bold' },
    displaySmall: { ...baseFont, fontFamily: 'NunitoSans_700Bold' },
    headlineLarge: { ...baseFont, fontFamily: 'NunitoSans_700Bold' },
    headlineMedium: { ...baseFont, fontFamily: 'NunitoSans_600SemiBold' },
    headlineSmall: { ...baseFont, fontFamily: 'NunitoSans_600SemiBold' },
    titleLarge: { ...baseFont, fontFamily: 'NunitoSans_700Bold' },
    titleMedium: { ...baseFont, fontFamily: 'NunitoSans_600SemiBold' },
    titleSmall: { ...baseFont, fontFamily: 'NunitoSans_500Medium' },
    bodyLarge: baseFont,
    bodyMedium: baseFont,
    bodySmall: { ...baseFont, fontFamily: 'NunitoSans_300Light' },
    labelLarge: { ...baseFont, fontFamily: 'NunitoSans_600SemiBold' },
    labelMedium: { ...baseFont, fontFamily: 'NunitoSans_500Medium' },
    labelSmall: { ...baseFont, fontFamily: 'NunitoSans_500Medium' },
  },
});
