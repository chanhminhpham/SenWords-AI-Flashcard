import { render } from '@testing-library/react-native';

import { KnowledgeDot } from './KnowledgeDot';

// Mock theme
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
});
