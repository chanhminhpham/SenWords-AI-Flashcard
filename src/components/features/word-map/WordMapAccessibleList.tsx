import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/theme/use-app-theme';
import type { WordMapNode, WordFamilyWithMembers } from '@/types/vocabulary';

// ─── Types ──────────────────────────────────────────────────
interface WordMapAccessibleListProps {
  wordFamilyData: WordFamilyWithMembers;
  nodes: WordMapNode[];
  onNodeTap: (nodeId: string) => void;
}

// ─── Component ──────────────────────────────────────────────
export function WordMapAccessibleList({
  wordFamilyData,
  nodes,
  onNodeTap,
}: WordMapAccessibleListProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();

  const rootWord = wordFamilyData.family.rootWord;
  const memberWords = nodes.filter((n) => n.type !== 'root').map((n) => n.word);

  const connectionText = t('wordMap.a11y.connection', {
    root: rootWord,
    words: memberWords.join(', '),
  });

  return (
    <View testID="word-map-accessible-list" style={styles.container}>
      <Text
        accessibilityRole="header"
        style={[styles.connectionText, { color: theme.colors.onSurface }]}>
        {connectionText}
      </Text>
      <FlatList
        data={nodes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            testID={`accessible-node-${item.id}`}
            accessible={true}
            accessibilityLabel={
              item.cardId
                ? t('wordMap.a11y.nodeSelected', { word: item.word })
                : t('wordMap.a11y.notInDictionary', {
                    word: item.word,
                    pos: item.partOfSpeech ?? '',
                  })
            }
            accessibilityRole="button"
            onPress={() => onNodeTap(item.id)}
            style={[styles.row, { borderBottomColor: theme.colors.surface }]}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    item.type === 'root' ? theme.colors.wordMap.root : theme.colors.wordMap.family,
                },
              ]}
            />
            <View style={styles.rowText}>
              <Text style={[styles.word, { color: theme.colors.onSurface }]}>{item.word}</Text>
              {item.partOfSpeech && (
                <Text style={[styles.pos, { color: theme.colors.onSurfaceVariant }]}>
                  {item.partOfSpeech}
                </Text>
              )}
              {item.formLabel && (
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                  ({item.formLabel})
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  connectionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rowText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  word: {
    fontSize: 16,
    fontWeight: '600',
  },
  pos: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
