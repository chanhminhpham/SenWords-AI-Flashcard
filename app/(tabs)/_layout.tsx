import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabUnlock } from '@/hooks/use-tab-unlock';
import type { TabName } from '@/hooks/use-tab-unlock';
import { hapticTabSwitch, hapticWarning } from '@/services/haptics';
import { useAppTheme } from '@/theme';

const SNACKBAR_DURATION = 3000;
const TAB_BAR_HEIGHT = 56;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Tab configuration — order defines tab bar display order */
const TAB_CONFIG: readonly {
  name: TabName;
  label: string;
  icon: IconName;
}[] = [
  { name: 'learn', label: 'Học', icon: 'leaf' },
  { name: 'home', label: 'Từ vựng', icon: 'book-open-page-variant' },
  { name: 'scan', label: 'Scan', icon: 'camera' },
  { name: 'progress', label: 'Hành trình', icon: 'map-marker-path' },
  { name: 'profile', label: 'Tôi', icon: 'account' },
];

/**
 * Custom tab bar button — ADR-2: tabBarButton (not full custom tabBar).
 * Handles haptic feedback on press and intercepts locked tab taps.
 */
function TabButton({
  isLocked,
  onLockedPress,
  lockIconColor,
  activeIndicatorColor,
  onPress,
  onLongPress,
  children,
  style,
  accessibilityRole,
  accessibilityState,
  testID,
}: {
  isLocked: boolean;
  onLockedPress: () => void;
  lockIconColor: string;
  activeIndicatorColor: string;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: 'button' | 'tab';
  accessibilityState?: { selected?: boolean };
  testID?: string;
}) {
  const isActive = accessibilityState?.selected ?? false;

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (isLocked) {
        hapticWarning();
        onLockedPress();
        return;
      }
      hapticTabSwitch();
      onPress?.(e);
    },
    [isLocked, onLockedPress, onPress]
  );

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[
        style,
        isLocked && styles.lockedTab,
        isActive && { backgroundColor: activeIndicatorColor },
      ]}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityHint={isLocked ? 'Tính năng bị khóa. Học thêm để mở khóa.' : undefined}
      testID={testID}>
      {children}
      {isLocked && (
        <View style={styles.lockOverlay} pointerEvents="none">
          <MaterialCommunityIcons name="lock" size={10} color={lockIconColor} />
        </View>
      )}
    </Pressable>
  );
}

// Expo Router requires default export for route files
export default function TabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { unlocked, lockedMessage } = useTabUnlock();
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const showLockedSnackbar = useCallback(() => {
    setSnackbarVisible(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: TAB_BAR_HEIGHT + insets.bottom,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.surfaceVariant,
          },
          tabBarActiveTintColor: theme.colors.nature.accent,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          // TODO: cross-fade 150ms — bottom-tabs v7 instant switch only
        }}>
        {TAB_CONFIG.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarLabel: ({ color }) => (
                <Text style={[styles.tabLabel, { color }]} maxFontSizeMultiplier={1.2}>
                  {tab.label}
                </Text>
              ),
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name={tab.icon} size={size} color={color} />
              ),
              tabBarAccessibilityLabel: tab.label,
              tabBarButton: ({
                onPress,
                onLongPress,
                children,
                style,
                accessibilityRole,
                accessibilityState,
                testID,
              }) => (
                <TabButton
                  isLocked={!unlocked[tab.name]}
                  onLockedPress={showLockedSnackbar}
                  lockIconColor={theme.colors.onSurfaceVariant}
                  activeIndicatorColor={theme.colors.primaryContainer}
                  onPress={onPress}
                  onLongPress={onLongPress ?? undefined}
                  style={style}
                  accessibilityRole={accessibilityRole as 'button' | 'tab'}
                  accessibilityState={accessibilityState as { selected?: boolean }}
                  testID={testID}>
                  {children}
                </TabButton>
              ),
            }}
          />
        ))}
      </Tabs>
      <Snackbar visible={snackbarVisible} onDismiss={hideSnackbar} duration={SNACKBAR_DURATION}>
        {lockedMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockedTab: {
    opacity: 0.5,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 8,
    right: '25%',
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'NunitoSans_500Medium',
  },
});
