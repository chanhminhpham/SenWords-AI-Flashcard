import * as Device from 'expo-device';
import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import { BUDGET_RAM_THRESHOLD, type DeviceTier } from '@/config/device-tiers.config';
import { useAppStore } from '@/stores/app.store';

/**
 * Detects device tier from RAM and listens for system reduce-motion changes.
 * Call once in root layout to initialize the app store values.
 */
export function useDeviceTier() {
  const setDeviceTier = useAppStore((s) => s.setDeviceTier);
  const setSystemReduceMotion = useAppStore((s) => s.setSystemReduceMotion);

  useEffect(() => {
    // Detect device tier from total RAM
    const totalMemory = Device.totalMemory;
    const tier: DeviceTier =
      totalMemory !== null && totalMemory <= BUDGET_RAM_THRESHOLD ? 'budget' : 'standard';
    setDeviceTier(tier);

    // Read initial system reduce-motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setSystemReduceMotion(enabled);
    });

    // Listen for system reduce-motion changes
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setSystemReduceMotion(enabled);
    });

    return () => {
      subscription.remove();
    };
  }, [setDeviceTier, setSystemReduceMotion]);
}
