import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Button, Card, Icon, RadioButton, Text } from 'react-native-paper';

import { DEFAULT_GOAL_ID, GOAL_OPTIONS, LEVEL_INFO } from '@/constants/onboarding';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { LearningGoalId, UserLevelValue } from '@/types/onboarding';

export default function GoalSelectionScreen() {
  const [selectedGoal, setSelectedGoal] = useState<LearningGoalId | null>(null);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<UserLevelValue | null>(null);
  const theme = useAppTheme();

  const selectGoal = useOnboardingStore((s) => s.selectGoal);
  const selectLevelManually = useOnboardingStore((s) => s.selectLevelManually);

  const handleContinue = () => {
    const goalId = selectedGoal ?? DEFAULT_GOAL_ID;
    selectGoal(goalId);
    router.push('/(auth)/placement-test' as Href);
  };

  const handleSkip = () => {
    selectGoal(DEFAULT_GOAL_ID);
    router.push('/(auth)/placement-test' as Href);
  };

  const handleManualLevelSelect = () => {
    setShowLevelPicker(true);
  };

  const handleLevelConfirm = () => {
    if (selectedLevel === null) return;
    const goalId = selectedGoal ?? DEFAULT_GOAL_ID;
    selectGoal(goalId);
    selectLevelManually(selectedLevel);
    router.push('/(auth)/level-result' as Href);
  };

  if (showLevelPicker) {
    return (
      <View className="flex-1 bg-app-bg dark:bg-app-bg-dark" testID="level-picker-screen">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            Chọn trình độ của bạn
          </Text>

          {LEVEL_INFO.map((level) => (
            <Card
              key={level.index}
              testID={`level-card-${level.index}`}
              onPress={() => setSelectedLevel(level.index)}
              style={[
                styles.card,
                selectedLevel === level.index && {
                  borderColor: theme.colors.sky.blue,
                },
              ]}>
              <Card.Content style={styles.cardContent}>
                <RadioButton
                  value={String(level.index)}
                  status={selectedLevel === level.index ? 'checked' : 'unchecked'}
                />
                <View style={styles.cardText}>
                  <Text variant="titleMedium">{level.label}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {level.description}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}

          <Button
            mode="contained"
            onPress={handleLevelConfirm}
            disabled={selectedLevel === null}
            style={styles.continueButton}
            testID="confirm-level-button">
            Xác nhận
          </Button>

          <Button
            mode="text"
            onPress={() => setShowLevelPicker(false)}
            testID="back-to-goals-button">
            Quay lại chọn mục tiêu
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg dark:bg-app-bg-dark" testID="goal-selection-screen">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          Bạn muốn học tiếng Anh để làm gì?
        </Text>

        {GOAL_OPTIONS.map((goal) => (
          <Card
            key={goal.id}
            testID={`goal-card-${goal.id}`}
            onPress={() => setSelectedGoal(goal.id)}
            style={[
              styles.card,
              selectedGoal === goal.id && {
                borderColor: theme.colors.sky.blue,
              },
            ]}>
            <Card.Content style={styles.cardContent}>
              <Icon source={goal.icon} size={28} color={theme.colors.onSurfaceVariant} />
              <View style={styles.cardText}>
                <Text variant="titleMedium">{goal.label}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {goal.description}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedGoal}
          style={styles.continueButton}
          testID="continue-button">
          Tiếp tục
        </Button>

        <Button mode="text" onPress={handleSkip} testID="skip-button">
          Bỏ qua — bắt đầu với Giao tiếp cơ bản
        </Button>

        <Button mode="text" onPress={handleManualLevelSelect} testID="manual-level-button">
          Tôi muốn tự chọn trình độ
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 48,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  cardText: {
    flex: 1,
  },
  continueButton: {
    marginTop: 24,
    borderRadius: 12,
  },
});
