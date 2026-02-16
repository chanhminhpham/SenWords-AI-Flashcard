import { AccessibilityInfo } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import { useDeviceTier } from '@/hooks/use-device-tier';
import { useAppStore } from '@/stores/app.store';

// Mock expo-device with mutable totalMemory
let mockTotalMemory: number | null = 4 * 1024 * 1024 * 1024; // 4GB default
jest.mock('expo-device', () => ({
  get totalMemory() {
    return mockTotalMemory;
  },
}));

// Track AccessibilityInfo listeners
let reduceMotionCallback: ((enabled: boolean) => void) | null = null;
const mockRemove = jest.fn();

jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
jest
  .spyOn(AccessibilityInfo, 'addEventListener')
  .mockImplementation((_eventName: string, handler: unknown) => {
    reduceMotionCallback = handler as (enabled: boolean) => void;
    return { remove: mockRemove } as unknown as ReturnType<
      typeof AccessibilityInfo.addEventListener
    >;
  });

describe('useDeviceTier', () => {
  beforeEach(() => {
    useAppStore.setState({
      deviceTier: 'standard',
      systemReduceMotion: false,
      userAnimationOverride: null,
    });
    reduceMotionCallback = null;
    mockRemove.mockClear();
  });

  it('detects standard device tier for >3GB RAM', () => {
    renderHook(() => useDeviceTier());
    expect(useAppStore.getState().deviceTier).toBe('standard');
  });

  it('reads initial system reduce-motion setting', async () => {
    renderHook(() => useDeviceTier());
    // Wait for the promise to resolve
    await new Promise(process.nextTick);
    expect(useAppStore.getState().systemReduceMotion).toBe(false);
  });

  it('subscribes to reduce-motion changes', () => {
    renderHook(() => useDeviceTier());
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'reduceMotionChanged',
      expect.any(Function)
    );
  });

  it('updates store when system reduce-motion changes', () => {
    renderHook(() => useDeviceTier());
    expect(reduceMotionCallback).not.toBeNull();
    reduceMotionCallback!(true);
    expect(useAppStore.getState().systemReduceMotion).toBe(true);
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useDeviceTier());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('useDeviceTier with budget device', () => {
  beforeEach(() => {
    useAppStore.setState({
      deviceTier: 'standard',
      systemReduceMotion: false,
      userAnimationOverride: null,
    });
    reduceMotionCallback = null;
    mockRemove.mockClear();
  });

  afterEach(() => {
    mockTotalMemory = 4 * 1024 * 1024 * 1024; // reset
  });

  it('detects budget device tier for <=3GB RAM', () => {
    mockTotalMemory = 2 * 1024 * 1024 * 1024; // 2GB = budget
    renderHook(() => useDeviceTier());
    expect(useAppStore.getState().deviceTier).toBe('budget');
  });

  it('detects budget device tier at exactly 3GB threshold', () => {
    mockTotalMemory = 3 * 1024 * 1024 * 1024; // 3GB = budget (<=)
    renderHook(() => useDeviceTier());
    expect(useAppStore.getState().deviceTier).toBe('budget');
  });

  it('treats null totalMemory as standard', () => {
    mockTotalMemory = null;
    renderHook(() => useDeviceTier());
    expect(useAppStore.getState().deviceTier).toBe('standard');
  });
});
