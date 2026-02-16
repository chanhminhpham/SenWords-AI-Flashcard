/**
 * SenWordTheme Color System — Single Source of Truth
 *
 * All color values are defined here and imported by:
 * - Paper themes (sen-word-theme.ts, dark-theme.ts)
 * - tailwind.config.js duplicates these values with a comment reference
 *
 * DO NOT hardcode color hex values elsewhere in the codebase.
 */

// ─── Light Mode ──────────────────────────────────────────────
export const LIGHT_COLORS = {
  nature: {
    accent: '#2D8A5E', // Primary CTA, journey elements
    tint: '#E8F4ED', // Light background, nature feel
    warm: '#FFF8F0', // Warm highlights
  },
  sky: {
    blue: '#4A9FE5', // CTA buttons, active states, progress
    text: '#2B7ABF', // Text links (WCAG AA 4.6:1 on white)
  },
  lotus: {
    pink: '#E8739E', // Celebrations, streak badge
  },
  feedback: {
    know: '#4ECBA0', // Swipe right, correct answer
    dontKnow: '#F5A623', // Swipe left (icon/bg only)
    dontKnowText: '#C47D0A', // Text variant (WCAG AA on white)
    explore: '#9B72CF', // Swipe up, explore purple
    info: '#4A9FE5', // Tooltips, hints
    error: '#E57373', // System errors ONLY
  },
  depth: {
    layer1: '#4ECBA0', // Recognition (green)
    layer2: '#4A9FE5', // Association (blue)
    layer3: '#9B72CF', // Production (purple)
    layer4: '#F5A623', // Application (orange)
  },
  background: '#FFFFFF',
  surface: '#F5F7FA', // Section dividers, inactive areas
  textPrimary: '#1A1D23', // Body text, headings (15.4:1 on white)
  onSurfaceVariant: '#4A4E54',
  // MD3 container tints
  secondaryContainer: '#D6EBFA',
  tertiaryContainer: '#FCE4EC',
  form: {
    borderDefault: '#D1D5DB',
    borderFocus: '#2D8A5E',
    borderError: '#E57373',
    placeholder: '#9CA3AF',
  },
} as const;

// ─── Dark Mode (Nature Night) ────────────────────────────────
export const DARK_COLORS = {
  nature: {
    accent: '#3DAA72', // Brighter for dark bg visibility
    tint: '#E8F4ED', // Body text on dark
    warm: '#FFF8F0',
  },
  sky: {
    blue: '#6BB5F0',
    text: '#6BB5F0',
  },
  lotus: {
    pink: '#F09EBE',
  },
  feedback: {
    know: '#3DAA72', // 5.1:1 contrast
    dontKnow: '#F0B848', // 4.8:1 (AA large text)
    dontKnowText: '#F0B848',
    explore: '#B99ADE',
    info: '#6BB5F0', // 5.6:1 contrast
    error: '#FF8A80', // 4.5:1 vs bg
  },
  depth: {
    layer1: '#3DAA72',
    layer2: '#6BB5F0',
    layer3: '#B99ADE',
    layer4: '#F0B848',
  },
  background: '#1A2318', // Deep forest (NOT pure dark)
  surface: '#243028', // Cards, subtle green tint
  textPrimary: '#E8F4ED', // 12.8:1 contrast
  onSurfaceVariant: '#A8B5AB',
  // MD3 container tints
  primaryContainer: '#1E3D2A',
  secondaryContainer: '#1A3350',
  tertiaryContainer: '#4A2030',
  form: {
    borderDefault: '#3A4A3E',
    borderFocus: '#3DAA72', // 3.2:1 vs bg
    borderError: '#FF8A80', // 4.5:1 vs bg
    placeholder: '#6B7B6F', // 4.0:1
  },
} as const;
