import * as Haptics from 'expo-haptics';

import { shouldReduceAnimations } from '@/stores/app.store';

/**
 * Centralized haptic feedback service (architecture-specified).
 *
 * MUST be used instead of direct Haptics.* calls — ensures NFR29a
 * compliance (single kill switch via shouldReduceMotion in app.store).
 *
 * Each function checks shouldReduceMotion() BEFORE firing haptic.
 * Safe to call on simulators (expo-haptics is a no-op there).
 */

/** Light impact — tab switch, subtle confirmations */
export function hapticTabSwitch(): void {
  if (shouldReduceAnimations()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium impact — swipe complete, card actions */
export function hapticSwipeComplete(): void {
  if (shouldReduceAnimations()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Success notification — correct answer, level up */
export function hapticTapSuccess(): void {
  if (shouldReduceAnimations()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Error notification — invalid action, form error */
export function hapticTapError(): void {
  if (shouldReduceAnimations()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Warning notification — locked tab tap, limit reached */
export function hapticWarning(): void {
  if (shouldReduceAnimations()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Success notification (strong) — level up celebration */
export function hapticLevelUp(): void {
  if (shouldReduceAnimations()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
