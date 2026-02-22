import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';

import { hapticTapSuccess } from '@/services/haptics';
import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { WordFamilyWithMembers } from '@/types/vocabulary';

interface WordFamilySheetProps {
  data: WordFamilyWithMembers;
  currentCardId: number;
  onClose: () => void;
}

/**
 * Bottom sheet displaying word family members.
 * Shows all forms of a word family with definitions.
 */
export function WordFamilySheet({ data, currentCardId, onClose }: WordFamilySheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useAppTheme();
  const { t } = useTranslation();
  const deviceTier = useAppStore((s) => s.deviceTier);

  // Fire haptic on initial mount (sheet open)
  useEffect(() => {
    hapticTapSuccess();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderItem = useCallback(
    ({ item }: { item: WordFamilyWithMembers['members'][number] }) => {
      const isCurrent = item.cardId === currentCardId;
      const definition = item.card?.definition ?? t('wordFamily.noDefinition');

      return (
        <View
          testID="word-family-member"
          accessibilityLabel={t('accessibility.wordFamilyMemberItem', {
            word: item.wordText,
            partOfSpeech: item.partOfSpeech,
          })}
          style={[styles.memberRow, isCurrent && { backgroundColor: theme.colors.nature.tint }]}>
          <Text style={[styles.wordText, { color: theme.colors.onSurface }]}>{item.wordText}</Text>
          <Text style={[styles.posText, { color: theme.colors.onSurfaceVariant }]}>
            {item.partOfSpeech}
          </Text>
          <Text
            style={[styles.definitionText, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}>
            {definition}
          </Text>
        </View>
      );
    },
    [currentCardId, t, theme]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['40%', '70%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      animateOnMount={deviceTier !== 'budget'}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}>
      <View style={[styles.header, { borderBottomColor: theme.colors.onSurfaceVariant + '33' }]}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('wordFamily.sheetTitle')}
        </Text>
        <Text style={[styles.rootWord, { color: theme.colors.nature.accent }]}>
          {data.family.rootWord}
        </Text>
      </View>

      <BottomSheetFlatList<WordFamilyWithMembers['members'][number]>
        data={data.members}
        keyExtractor={(item: WordFamilyWithMembers['members'][number]) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent', // overridden by dynamic style
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rootWord: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  wordText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  posText: {
    fontSize: 12,
    fontStyle: 'italic',
    width: 60,
  },
  definitionText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
});
