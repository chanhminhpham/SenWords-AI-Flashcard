import { senWordDarkTheme } from '@/theme/dark-theme';

describe('senWordDarkTheme', () => {
  it('is a dark theme', () => {
    expect(senWordDarkTheme.dark).toBe(true);
  });

  it('has dark nature colors', () => {
    expect(senWordDarkTheme.colors.nature.accent).toBe('#3DAA72');
  });

  it('has dark background (deep forest, not pure black)', () => {
    expect(senWordDarkTheme.colors.background).toBe('#1A2318');
  });

  it('has dark surface for cards', () => {
    expect(senWordDarkTheme.colors.surface).toBe('#243028');
  });

  it('has dark feedback colors with adequate contrast', () => {
    expect(senWordDarkTheme.colors.feedback.know).toBe('#3DAA72');
    expect(senWordDarkTheme.colors.feedback.info).toBe('#6BB5F0');
    expect(senWordDarkTheme.colors.feedback.dontKnow).toBe('#F0B848');
    expect(senWordDarkTheme.colors.feedback.error).toBe('#FF8A80');
  });

  it('has dark depth layer colors', () => {
    expect(senWordDarkTheme.colors.depth.layer1).toBe('#3DAA72');
    expect(senWordDarkTheme.colors.depth.layer2).toBe('#6BB5F0');
    expect(senWordDarkTheme.colors.depth.layer3).toBe('#B99ADE');
    expect(senWordDarkTheme.colors.depth.layer4).toBe('#F0B848');
  });

  it('has light text on dark background', () => {
    expect(senWordDarkTheme.colors.onBackground).toBe('#E8F4ED');
    expect(senWordDarkTheme.colors.onSurface).toBe('#E8F4ED');
  });

  it('maps MD3 primary to dark nature accent', () => {
    expect(senWordDarkTheme.colors.primary).toBe('#3DAA72');
  });

  it('has same spacing tokens as light theme', () => {
    expect(senWordDarkTheme.spacing.xs).toBe(4);
    expect(senWordDarkTheme.spacing.md).toBe(16);
    expect(senWordDarkTheme.spacing.swipeThreshold.placement).toBe(40);
  });

  it('has same animation tokens as light theme', () => {
    expect(senWordDarkTheme.animation.spring.bounceBack.damping).toBe(15);
    expect(senWordDarkTheme.animation.timing.fast.duration).toBe(150);
  });
});
