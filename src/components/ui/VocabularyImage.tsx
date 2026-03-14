// VocabularyImage — shared image component for flashcard and detail views (Story 2.5)
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { resolveImageUrl } from '@/services/dictionary/dictionary.service';
import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';

export type MediaType = 'image' | 'gif' | 'none';

export interface VocabularyImageProps {
  imageUrl: string | null;
  mediaType: MediaType;
  word: string;
  size: 'card' | 'detail';
  recyclingKey?: string;
  testID?: string;
}

const SIZE_MAP = {
  card: { height: 140 },
  detail: { height: 260 },
} as const;

const PLACEHOLDER_LETTER_SIZE = {
  card: 40,
  detail: 56,
} as const;

export const VocabularyImage = React.memo(function VocabularyImage({
  imageUrl,
  mediaType,
  word,
  size,
  recyclingKey,
  testID = 'vocabulary-image',
}: VocabularyImageProps) {
  const { t } = useTranslation();
  const deviceTier = useAppStore((s) => s.deviceTier);
  const reduceMotion = useAppStore(
    (s) =>
      s.systemReduceMotion ||
      (s.userAnimationOverride !== null ? s.userAnimationOverride : s.deviceTier === 'budget')
  );

  const resolvedUrl = resolveImageUrl(imageUrl);
  const [hasError, setHasError] = React.useState(false);
  React.useEffect(() => setHasError(false), [resolvedUrl]);

  // Card variant: never render images — keep the swipe card clean
  if (size === 'card') return null;

  const dimensions = SIZE_MAP[size];
  const showImage = mediaType !== 'none' && resolvedUrl != null;

  // GIF autoplay: disabled on budget devices or when reduce motion is active
  const shouldAutoplay = mediaType === 'gif' && deviceTier !== 'budget' && !reduceMotion;

  if (!showImage || hasError) {
    return (
      <Placeholder
        word={word}
        size={size}
        height={dimensions.height}
        testID={`${testID}-placeholder`}
      />
    );
  }

  return (
    <View testID={testID} style={[styles.container, { height: dimensions.height }]}>
      <Image
        source={{ uri: resolvedUrl! }}
        contentFit="cover"
        transition={reduceMotion ? 0 : 200}
        cachePolicy="memory-disk"
        recyclingKey={recyclingKey}
        autoplay={shouldAutoplay}
        onError={() => setHasError(true)}
        accessibilityLabel={t('detail.imageAlt', { word })}
        style={styles.image}
      />
    </View>
  );
});

// ─── Placeholder ────────────────────────────────────────────
interface PlaceholderProps {
  word: string;
  size: 'card' | 'detail';
  height: number;
  testID: string;
}

const Placeholder = React.memo(function Placeholder({
  word,
  size,
  height,
  testID,
}: PlaceholderProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const letter = word.length > 0 ? word[0].toUpperCase() : '?';
  const fontSize = PLACEHOLDER_LETTER_SIZE[size];

  return (
    <LinearGradient
      testID={testID}
      colors={[theme.colors.nature.tint, theme.colors.nature.warm] as [string, string]}
      style={[styles.placeholder, { height }]}
      accessibilityLabel={t('detail.imagePlaceholder')}>
      <Text style={[styles.placeholderLetter, { fontSize, color: theme.colors.nature.accent }]}>
        {letter}
      </Text>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLetter: {
    fontWeight: '700',
  },
});
