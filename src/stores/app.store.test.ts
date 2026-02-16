import { useAppStore, shouldReduceAnimations } from '@/stores/app.store';

describe('app.store', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useAppStore.setState({
      deviceTier: 'standard',
      systemReduceMotion: false,
      userAnimationOverride: null,
    });
  });

  describe('shouldReduceMotion (3-signal priority)', () => {
    it('returns false for standard device with no overrides', () => {
      expect(useAppStore.getState().shouldReduceMotion()).toBe(false);
    });

    it('priority 1: system reduce motion always wins', () => {
      useAppStore.setState({
        systemReduceMotion: true,
        userAnimationOverride: false, // user says "enable animations"
        deviceTier: 'standard',
      });
      expect(useAppStore.getState().shouldReduceMotion()).toBe(true);
    });

    it('priority 2: user override beats device tier', () => {
      useAppStore.setState({
        systemReduceMotion: false,
        userAnimationOverride: true, // user says "reduce"
        deviceTier: 'standard',
      });
      expect(useAppStore.getState().shouldReduceMotion()).toBe(true);
    });

    it('priority 2: user override can enable animations on budget device', () => {
      useAppStore.setState({
        systemReduceMotion: false,
        userAnimationOverride: false, // user says "enable"
        deviceTier: 'budget',
      });
      expect(useAppStore.getState().shouldReduceMotion()).toBe(false);
    });

    it('priority 3: budget device auto-reduces when no overrides', () => {
      useAppStore.setState({
        systemReduceMotion: false,
        userAnimationOverride: null,
        deviceTier: 'budget',
      });
      expect(useAppStore.getState().shouldReduceMotion()).toBe(true);
    });

    it('priority 3: standard device does not reduce when no overrides', () => {
      useAppStore.setState({
        systemReduceMotion: false,
        userAnimationOverride: null,
        deviceTier: 'standard',
      });
      expect(useAppStore.getState().shouldReduceMotion()).toBe(false);
    });
  });

  describe('shouldReduceAnimations utility', () => {
    it('reads from store state', () => {
      useAppStore.setState({ systemReduceMotion: true });
      expect(shouldReduceAnimations()).toBe(true);
    });
  });

  describe('actions', () => {
    it('setDeviceTier updates tier', () => {
      useAppStore.getState().setDeviceTier('budget');
      expect(useAppStore.getState().deviceTier).toBe('budget');
    });

    it('setSystemReduceMotion updates preference', () => {
      useAppStore.getState().setSystemReduceMotion(true);
      expect(useAppStore.getState().systemReduceMotion).toBe(true);
    });

    it('setUserAnimationOverride updates override', () => {
      useAppStore.getState().setUserAnimationOverride(true);
      expect(useAppStore.getState().userAnimationOverride).toBe(true);
    });
  });
});
