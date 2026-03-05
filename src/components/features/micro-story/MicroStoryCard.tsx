import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { WordTooltip } from '@/components/features/micro-story/WordTooltip';
import { hapticTabSwitch } from '@/services/haptics';
import { useAppTheme } from '@/theme/use-app-theme';
import type { MicroStory, StorySegment } from '@/types/vocabulary';
import { parseStorySegments } from '@/utils/story-segment-parser';

interface MicroStoryCardProps {
  story: MicroStory;
}

interface ActiveTooltip {
  word: string;
  definition: string;
  partOfSpeech: string;
}

export const MicroStoryCard = React.memo(function MicroStoryCard({ story }: MicroStoryCardProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  const segments = parseStorySegments(
    story.storyText,
    story.highlightedWords as MicroStory['highlightedWords']
  );

  const handleWordPress = useCallback((segment: StorySegment) => {
    hapticTabSwitch();
    setActiveTooltip({
      word: segment.word ?? '',
      definition: segment.definition ?? '',
      partOfSpeech: segment.partOfSpeech ?? '',
    });
  }, []);

  const dismissTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  return (
    <View
      testID="micro-story-card"
      style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.storyText, { color: theme.colors.onSurface }]}>
        {segments.map((segment, index) =>
          segment.isHighlighted ? (
            <Text
              key={index}
              testID={`highlighted-word-${index}`}
              onPress={() => handleWordPress(segment)}
              accessibilityLabel={t('microStory.a11y.wordLink', {
                word: segment.word,
                pos: segment.partOfSpeech,
                definition: segment.definition,
              })}
              accessibilityRole="link"
              style={[styles.highlightedWord, { color: theme.colors.depth.layer2 }]}>
              {segment.text}
            </Text>
          ) : (
            <Text key={index}>{segment.text}</Text>
          )
        )}
      </Text>
      <Text style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        {t('microStory.tapHint')}
      </Text>
      {activeTooltip && (
        <WordTooltip
          word={activeTooltip.word}
          definition={activeTooltip.definition}
          partOfSpeech={activeTooltip.partOfSpeech}
          onDismiss={dismissTooltip}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  storyText: {
    fontSize: 15,
    lineHeight: 24,
  },
  highlightedWord: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
