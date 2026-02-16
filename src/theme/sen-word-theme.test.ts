import { senWordLightTheme } from '@/theme/sen-word-theme';

describe('senWordLightTheme', () => {
  it('has nature color tokens', () => {
    expect(senWordLightTheme.colors.nature.accent).toBe('#2D8A5E');
    expect(senWordLightTheme.colors.nature.tint).toBe('#E8F4ED');
    expect(senWordLightTheme.colors.nature.warm).toBe('#FFF8F0');
  });

  it('has feedback color tokens', () => {
    expect(senWordLightTheme.colors.feedback.know).toBe('#4ECBA0');
    expect(senWordLightTheme.colors.feedback.dontKnow).toBe('#F5A623');
    expect(senWordLightTheme.colors.feedback.explore).toBe('#9B72CF');
    expect(senWordLightTheme.colors.feedback.info).toBe('#4A9FE5');
    expect(senWordLightTheme.colors.feedback.error).toBe('#E57373');
  });

  it('has depth layer color tokens', () => {
    expect(senWordLightTheme.colors.depth.layer1).toBe('#4ECBA0');
    expect(senWordLightTheme.colors.depth.layer2).toBe('#4A9FE5');
    expect(senWordLightTheme.colors.depth.layer3).toBe('#9B72CF');
    expect(senWordLightTheme.colors.depth.layer4).toBe('#F5A623');
  });

  it('has animation tokens', () => {
    expect(senWordLightTheme.animation.spring.bounceBack).toEqual({
      damping: 15,
      stiffness: 150,
    });
    expect(senWordLightTheme.animation.spring.celebrate).toEqual({
      damping: 12,
      stiffness: 100,
    });
    expect(senWordLightTheme.animation.timing.fast.duration).toBe(150);
    expect(senWordLightTheme.animation.timing.standard.duration).toBe(300);
  });

  it('has spacing tokens', () => {
    expect(senWordLightTheme.spacing.xs).toBe(4);
    expect(senWordLightTheme.spacing.sm).toBe(8);
    expect(senWordLightTheme.spacing.md).toBe(16);
    expect(senWordLightTheme.spacing.lg).toBe(24);
    expect(senWordLightTheme.spacing.xl).toBe(32);
    expect(senWordLightTheme.spacing['2xl']).toBe(48);
  });

  it('has swipe threshold spacing', () => {
    expect(senWordLightTheme.spacing.swipeThreshold.placement).toBe(40);
    expect(senWordLightTheme.spacing.swipeThreshold.learning).toBe(80);
  });

  it('has border radius tokens', () => {
    expect(senWordLightTheme.borderRadius.card).toBe(16);
    expect(senWordLightTheme.borderRadius.button).toBe(12);
    expect(senWordLightTheme.borderRadius.chip).toBe(8);
    expect(senWordLightTheme.borderRadius.bubble).toBe(20);
  });

  it('is a light theme', () => {
    expect(senWordLightTheme.dark).toBe(false);
  });

  it('maps MD3 primary to nature accent', () => {
    expect(senWordLightTheme.colors.primary).toBe('#2D8A5E');
  });
});
