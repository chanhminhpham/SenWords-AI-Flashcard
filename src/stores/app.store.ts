import { create } from 'zustand';

import type { DeviceTier } from '@/config/device-tiers.config';

interface AppState {
  deviceTier: DeviceTier;
  systemReduceMotion: boolean;
  /** null = no user override, true = force reduce, false = force enable */
  userAnimationOverride: boolean | null;

  setDeviceTier: (tier: DeviceTier) => void;
  setSystemReduceMotion: (enabled: boolean) => void;
  setUserAnimationOverride: (override: boolean | null) => void;

  /**
   * 3-signal priority for reduce motion:
   * 1. System AccessibilityInfo (always respected)
   * 2. User manual override in Settings -> Performance
   * 3. Device tier auto-detect (budget = reduce)
   */
  shouldReduceMotion: () => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  deviceTier: 'standard',
  systemReduceMotion: false,
  userAnimationOverride: null,

  setDeviceTier: (tier) => set({ deviceTier: tier }),
  setSystemReduceMotion: (enabled) => set({ systemReduceMotion: enabled }),
  setUserAnimationOverride: (override) =>
    set({ userAnimationOverride: override }),

  shouldReduceMotion: () => {
    const { systemReduceMotion, userAnimationOverride, deviceTier } = get();

    // Priority 1: System accessibility always wins
    if (systemReduceMotion) return true;

    // Priority 2: User manual override
    if (userAnimationOverride !== null) return userAnimationOverride;

    // Priority 3: Device tier auto-detect
    return deviceTier === 'budget';
  },
}));

/** Standalone utility for reading reduce-motion outside React components */
export function shouldReduceAnimations(): boolean {
  return useAppStore.getState().shouldReduceMotion();
}
