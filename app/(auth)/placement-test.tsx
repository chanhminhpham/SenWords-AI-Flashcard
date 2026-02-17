import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Text } from 'react-native-paper';

import { PlacementSwipeCard } from '@/components/features/onboarding/PlacementSwipeCard';
import { SwipeTutorialCard } from '@/components/features/onboarding/SwipeTutorialCard';
import { UndoSnackbar } from '@/components/ui/UndoSnackbar';
import { PLACEMENT_WORD_COUNT, PLACEMENT_WORDS } from '@/constants/placement-test-words';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { SwipeResponse } from '@/types/onboarding';

export default function PlacementTestScreen() {
  const [tutorialDone, setTutorialDone] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUndo, setShowUndo] = useState(false);
  const theme = useAppTheme();

  const recordSwipe = useOnboardingStore((s) => s.recordSwipe);
  const undoLastSwipe = useOnboardingStore((s) => s.undoLastSwipe);
  const calculateLevel = useOnboardingStore((s) => s.calculateLevel);

  const handleTutorialComplete = useCallback(() => {
    setTutorialDone(true);
  }, []);

  const handleSwipe = useCallback(
    (wordId: string, response: SwipeResponse) => {
      recordSwipe(wordId, response);
      const nextIndex = currentIndex + 1;

      if (nextIndex >= PLACEMENT_WORD_COUNT) {
        calculateLevel();
        router.push('/(auth)/level-result' as Href);
      } else {
        setCurrentIndex(nextIndex);
        setShowUndo(true);
      }
    },
    [currentIndex, recordSwipe, calculateLevel]
  );

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      undoLastSwipe();
      setCurrentIndex((prev) => prev - 1);
      setShowUndo(false);
    }
  }, [currentIndex, undoLastSwipe]);

  const currentWord = PLACEMENT_WORDS[currentIndex];
  const isComplete = currentIndex >= PLACEMENT_WORD_COUNT;

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark" testID="placement-test-screen">
      {/* Header with progress */}
      <View style={styles.header}>
        <Text variant="titleMedium" testID="progress-counter">
          {tutorialDone
            ? `${currentIndex + (isComplete ? 0 : 1)} / ${PLACEMENT_WORD_COUNT}`
            : 'Hướng dẫn'}
        </Text>
      </View>

      {/* Card area */}
      <View style={styles.cardContainer}>
        {!tutorialDone ? (
          <SwipeTutorialCard onComplete={handleTutorialComplete} />
        ) : currentWord && !isComplete ? (
          <PlacementSwipeCard key={currentWord.id} word={currentWord} onSwipe={handleSwipe} />
        ) : null}
      </View>

      {/* Swipe hints */}
      {tutorialDone && !isComplete && (
        <View style={styles.hints}>
          <Text style={[styles.hintLeft, { color: theme.colors.feedback.dontKnowText }]}>
            ← Chưa biết
          </Text>
          <Text style={[styles.hintRight, { color: theme.colors.feedback.know }]}>Biết →</Text>
        </View>
      )}

      {/* Undo snackbar */}
      <UndoSnackbar
        visible={showUndo && tutorialDone}
        onDismiss={() => setShowUndo(false)}
        onUndo={handleUndo}
        message="Đã vuốt"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  hintLeft: {
    fontSize: 14,
  },
  hintRight: {
    fontSize: 14,
  },
});
