// DiscoveryTooltip — Reusable one-time hint tooltip (Story 2.2)
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppStore } from '@/stores/app.store';
import { useAppTheme } from '@/theme/use-app-theme';

const AUTO_DISMISS_MS = 5000;

interface DiscoveryTooltipProps {
  message: string;
  a11yMessage: string;
  storageKey: string;
  visible: boolean;
  onDismiss: () => void;
  testID?: string;
}

export function DiscoveryTooltip({
  message,
  a11yMessage,
  storageKey,
  visible,
  onDismiss,
  testID = 'discovery-tooltip',
}: DiscoveryTooltipProps) {
  const theme = useAppTheme();
  const reduceMotion = useAppStore((s) => s.shouldReduceMotion());
  const deviceTier = useAppStore((s) => s.deviceTier);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bounce animation (subtle)
  const bounceY = useSharedValue(0);

  useEffect(() => {
    if (visible && !reduceMotion && deviceTier !== 'budget') {
      bounceY.value = withRepeat(
        withSequence(withTiming(-4, { duration: 400 }), withTiming(0, { duration: 400 })),
        -1,
        true
      );
    }
    return () => {
      bounceY.value = 0;
    };
  }, [visible, reduceMotion, deviceTier, bounceY]);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  // Auto-dismiss
  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = useCallback(() => {
    AsyncStorage.setItem(storageKey, 'true');
    onDismiss();
  }, [storageKey, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      testID={testID}
      entering={reduceMotion ? undefined : FadeIn.duration(200)}
      exiting={reduceMotion ? undefined : FadeOut.duration(150)}
      style={styles.wrapper}
      accessible={true}
      accessibilityLabel={a11yMessage}
      accessibilityRole="alert">
      <TouchableOpacity onPress={handleDismiss} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.tooltip,
            { backgroundColor: theme.colors.feedback.info + 'E6' },
            bounceStyle,
          ]}>
          <Text style={[styles.tooltipText, { color: '#FFFFFF' }]}>{message}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'center',
    zIndex: 20,
  },
  tooltip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tooltipText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
