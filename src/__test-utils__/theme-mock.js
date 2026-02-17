// Shared useAppTheme mock for tests (plain JS to avoid NativeWind CSS interop)
// Provides LIGHT_COLORS structure matching src/theme/colors.ts
module.exports = {
  useAppTheme: () => ({
    colors: {
      primary: '#2D8A5E',
      background: '#FFFFFF',
      surface: '#F5F7FA',
      onSurface: '#1A1D23',
      onSurfaceVariant: '#4A4E54',
      nature: {
        accent: '#2D8A5E',
        tint: '#E8F4ED',
        warm: '#FFF8F0',
      },
      sky: {
        blue: '#4A9FE5',
        text: '#2B7ABF',
      },
      lotus: {
        pink: '#E8739E',
      },
      feedback: {
        know: '#4ECBA0',
        dontKnow: '#F5A623',
        dontKnowText: '#C47D0A',
        explore: '#9B72CF',
        info: '#4A9FE5',
        error: '#E57373',
      },
      depth: {
        layer1: '#4ECBA0',
        layer2: '#4A9FE5',
        layer3: '#9B72CF',
        layer4: '#F5A623',
      },
      form: {
        borderDefault: '#D1D5DB',
        borderFocus: '#2D8A5E',
        borderError: '#E57373',
        placeholder: '#9CA3AF',
      },
      secondaryContainer: '#D6EBFA',
      tertiaryContainer: '#FCE4EC',
    },
  }),
};
