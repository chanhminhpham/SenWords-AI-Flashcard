/**
 * Device tier thresholds for performance-adaptive behavior.
 *
 * Budget devices get reduced animations and lower resource limits.
 * System AccessibilityInfo.isReduceMotionEnabled() always takes priority.
 */

export type DeviceTier = 'budget' | 'standard';

/** RAM threshold in bytes: 3GB */
export const BUDGET_RAM_THRESHOLD = 3 * 1024 * 1024 * 1024;

export const DEVICE_TIER_CONFIG = {
  budget: {
    maxMemoryBudgetMB: 150,
    flatListWindowSize: 5,
    flatListMaxToRenderPerBatch: 3,
  },
  standard: {
    maxMemoryBudgetMB: 300,
    flatListWindowSize: 10,
    flatListMaxToRenderPerBatch: 5,
  },
} as const;
