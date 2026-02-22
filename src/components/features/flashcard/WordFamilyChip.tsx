import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useWordFamily } from '@/hooks/use-word-family';
import { useAppTheme } from '@/theme/use-app-theme';

import { WordFamilySheet } from './WordFamilySheet';

interface WordFamilyChipProps {
  cardId: number;
}

/**
 * Subtle "Gia dinh tu" chip on flashcards.
 * Renders null when no family data or still loading.
 * Tapping opens the WordFamilySheet bottom sheet.
 */
export function WordFamilyChip({ cardId }: WordFamilyChipProps) {
  const { data, isLoading } = useWordFamily(cardId);
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading || !data) {
    return null;
  }

  const handlePress = () => {
    setSheetOpen(true);
  };

  const handleClose = () => {
    setSheetOpen(false);
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

      {sheetOpen && <WordFamilySheet data={data} currentCardId={cardId} onClose={handleClose} />}
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
