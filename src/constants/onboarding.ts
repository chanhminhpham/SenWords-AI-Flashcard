// Onboarding constants for Story 1.4: Goal Selection & Placement Test

import type { FeatureUnlockState, LearningGoal, UserLevelValue } from '@/types/onboarding';
import { UserLevel } from '@/types/onboarding';

// ─── Goal Options ──────────────────────────────────────────────

export const GOAL_OPTIONS: readonly LearningGoal[] = [
  {
    id: 'ielts',
    label: 'IELTS',
    icon: 'target',
    description: 'Chuẩn bị kỳ thi',
  },
  {
    id: 'business',
    label: 'Business',
    icon: 'briefcase-outline',
    description: 'Tiếng Anh công sở',
  },
  {
    id: 'travel',
    label: 'Du lịch',
    icon: 'airplane',
    description: 'Giao tiếp khi du lịch',
  },
  {
    id: 'reading',
    label: 'Đọc sách',
    icon: 'book-open-variant',
    description: 'Đọc sách tiếng Anh',
  },
  {
    id: 'movies',
    label: 'Xem phim',
    icon: 'movie-open-outline',
    description: 'Xem phim không phụ đề',
  },
  {
    id: 'conversation',
    label: 'Giao tiếp chung',
    icon: 'chat-outline',
    description: 'Nói tiếng Anh hàng ngày',
  },
] as const;

export const DEFAULT_GOAL_ID = 'conversation' as const;

// ─── Level Thresholds ──────────────────────────────────────────

/**
 * Maps correct answer count (0-10) to user level.
 * 0-3 → Beginner, 4-6 → PreIntermediate, 7-8 → Intermediate, 9-10 → UpperIntermediate
 */
export function calculateLevelFromScore(correctCount: number): UserLevelValue {
  if (correctCount <= 3) return UserLevel.Beginner;
  if (correctCount <= 6) return UserLevel.PreIntermediate;
  if (correctCount <= 8) return UserLevel.Intermediate;
  return UserLevel.UpperIntermediate;
}

// ─── Level Labels (Vietnamese) ─────────────────────────────────

export interface LevelInfo {
  index: UserLevelValue;
  label: string;
  description: string;
}

export const LEVEL_INFO: readonly LevelInfo[] = [
  {
    index: UserLevel.Beginner,
    label: 'Người mới bắt đầu',
    description: 'Mới bắt đầu học tiếng Anh',
  },
  {
    index: UserLevel.PreIntermediate,
    label: 'Trước trung cấp',
    description: 'Hiểu được những điều cơ bản',
  },
  {
    index: UserLevel.Intermediate,
    label: 'Trung cấp',
    description: 'Có thể giao tiếp trong nhiều tình huống',
  },
  {
    index: UserLevel.UpperIntermediate,
    label: 'Trên trung cấp',
    description: 'Hiểu hầu hết nội dung tiếng Anh',
  },
] as const;

export function getLevelLabel(level: UserLevelValue): string {
  return LEVEL_INFO[level]?.label ?? 'Không xác định';
}

// ─── Feature Unlock Map ────────────────────────────────────────

export function getFeatureUnlockState(level: UserLevelValue): FeatureUnlockState {
  return {
    swipeUpEnabled: level >= UserLevel.PreIntermediate,
    largerFonts: level === UserLevel.Beginner,
    minimalUI: level === UserLevel.Beginner,
  };
}

// ─── Encouraging Messages (Vietnamese) ─────────────────────────

export const LEVEL_ENCOURAGEMENTS: Record<UserLevelValue, string> = {
  [UserLevel.Beginner]: 'Bắt đầu từ gốc rễ — nền tảng vững chắc sẽ giúp bạn tiến xa!',
  [UserLevel.PreIntermediate]: 'Bạn đã có nền tảng tốt — hãy tiếp tục phát triển!',
  [UserLevel.Intermediate]: 'Tuyệt vời! Bạn đã nắm được nhiều từ vựng quan trọng!',
  [UserLevel.UpperIntermediate]: 'Ấn tượng! Vốn từ của bạn rất phong phú — hãy thử thách thêm!',
};
