import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useWordFamily } from '@/hooks/use-word-family';
import { useAppTheme } from '@/theme/use-app-theme';
import type { WordFamilyWithMembers } from '@/types/vocabulary';

interface WordFamilyChipProps {
  cardId: number;
  /** Called when user taps the chip — parent should open the sheet */
  onOpenSheet?: (data: WordFamilyWithMembers) => void;
}

/**
 * Subtle "Gia dinh tu" chip on flashcards.
 * Renders null when no family data or still loading.
 * Tapping calls onOpenSheet — the sheet must be rendered at the screen
 * level (outside the card's overflow:hidden Animated.View).
 */
export function WordFamilyChip({ cardId, onOpenSheet }: WordFamilyChipProps) {
  const { data, isLoading } = useWordFamily(cardId);
  const { t } = useTranslation();
  const theme = useAppTheme();

  if (isLoading || !data) {
    return null;
  }

  const handlePress = () => {
    onOpenSheet?.(data);
  };

  return (
    <View style={styles.container}>
      <Chip
        testID="word-family-chip"
        mode="outlined"
        compact
        onPress={handlePress}
        accessibilityLabel={t('wordFamily.chipLabel')}
        accessibilityHint={t('accessibility.wordFamilyChipHint')}
        accessibilityRole="button"
        style={[styles.chip, { borderColor: theme.colors.nature.accent }]}
        textStyle={[styles.chipText, { color: theme.colors.nature.accent }]}>
        {t('wordFamily.chipLabel')}
      </Chip>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: 'center',
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
  },
});
