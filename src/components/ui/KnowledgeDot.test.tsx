import { render } from '@testing-library/react-native';

import { KnowledgeDot } from './KnowledgeDot';

// Mock theme
// eslint-disable-next-line @typescript-eslint/no-require-imports -- NativeWind v4 limitation: external mock files required
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

describe('KnowledgeDot', () => {
  it('renders empty state with border only', () => {
    const { getByTestId } = render(<KnowledgeDot state="empty" />);
    const dot = getByTestId('knowledge-dot');

    expect(dot).toBeTruthy();
    expect(dot.props.accessibilityLabel).toContain('mới');
  });

  it('renders half state with fill', () => {
    const { getByTestId } = render(<KnowledgeDot state="half" />);
    const dot = getByTestId('knowledge-dot');

    expect(dot).toBeTruthy();
    expect(dot.props.accessibilityLabel).toContain('đang học');
  });

  it('renders full state with fill', () => {
    const { getByTestId } = render(<KnowledgeDot state="full" />);
    const dot = getByTestId('knowledge-dot');

    expect(dot).toBeTruthy();
    expect(dot.props.accessibilityLabel).toContain('thành thạo');
  });

  it('applies custom size', () => {
    const { getByTestId } = render(<KnowledgeDot state="full" size={16} />);
    const dot = getByTestId('knowledge-dot');

    // Style is an array, find the object with width/height
    const sizeStyle = Array.isArray(dot.props.style)
      ? dot.props.style.find((s: unknown) => typeof s === 'object' && s !== null && 'width' in s)
      : dot.props.style;

    expect(sizeStyle).toMatchObject({
      width: 16,
      height: 16,
      borderRadius: 8,
    });
  });

  it('uses custom testID', () => {
    const { getByTestId } = render(<KnowledgeDot state="empty" testID="custom-dot" />);
    const dot = getByTestId('custom-dot');

    expect(dot).toBeTruthy();
  });

  describe('depthLevel prop (AC5)', () => {
    it('renders level 1 as empty amber', () => {
      const { getByTestId } = render(<KnowledgeDot depthLevel={1} />);
      const dot = getByTestId('knowledge-dot');

      expect(dot.props.accessibilityLabel).toContain('mới');
      // Empty = border only, no backgroundColor
      const styles = dot.props.style.flat();
      const hasBorder = styles.some((s: Record<string, unknown>) => s?.borderWidth === 2);
      expect(hasBorder).toBe(true);
    });

    it('renders level 2 as half amber', () => {
      const { getByTestId } = render(<KnowledgeDot depthLevel={2} />);
      const dot = getByTestId('knowledge-dot');

      expect(dot.props.accessibilityLabel).toContain('đang học');
      // Half = filled (has backgroundColor)
      const styles = dot.props.style.flat();
      const hasFill = styles.some((s: Record<string, unknown>) => s?.backgroundColor);
      expect(hasFill).toBe(true);
    });

    it('renders level 3 as half blue', () => {
      const { getByTestId } = render(<KnowledgeDot depthLevel={3} />);
      const dot = getByTestId('knowledge-dot');

      expect(dot.props.accessibilityLabel).toContain('khá');
    });

    it('renders level 4 as full green', () => {
      const { getByTestId } = render(<KnowledgeDot depthLevel={4} />);
      const dot = getByTestId('knowledge-dot');

      expect(dot.props.accessibilityLabel).toContain('thành thạo');
    });

    it('depthLevel overrides state prop', () => {
      const { getByTestId } = render(<KnowledgeDot state="full" depthLevel={1} />);
      const dot = getByTestId('knowledge-dot');

      // depthLevel=1 should show "mới", not "thành thạo" from state="full"
      expect(dot.props.accessibilityLabel).toContain('mới');
    });
  });
});
