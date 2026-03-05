import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/theme/use-app-theme';

interface WordTooltipProps {
  word: string;
  definition: string;
  partOfSpeech: string;
  onDismiss: () => void;
}

export const WordTooltip = React.memo(function WordTooltip({
  word,
  definition,
  partOfSpeech,
  onDismiss,
}: WordTooltipProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      testID="word-tooltip-backdrop"
      style={styles.backdrop}
      onPress={onDismiss}
      accessibilityLabel={t('microStory.a11y.dismissTooltip')}
      accessibilityRole="button">
      <View
        testID="word-tooltip"
        accessible={true}
        accessibilityLabel={t('microStory.a11y.tooltip', { word })}
        accessibilityRole="alert"
        style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.word, { color: theme.colors.depth.layer2 }]}>{word}</Text>
          <View style={[styles.posBadge, { backgroundColor: theme.colors.nature.tint }]}>
            <Text style={[styles.posText, { color: theme.colors.nature.accent }]}>
              {partOfSpeech}
            </Text>
          </View>
        </View>
        <Text style={[styles.definition, { color: theme.colors.onSurface }]}>{definition}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  container: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    maxWidth: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  word: {
    fontSize: 16,
    fontWeight: '700',
  },
  posBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  posText: {
    fontSize: 11,
    fontWeight: '600',
  },
  definition: {
    fontSize: 14,
    lineHeight: 20,
  },
});
