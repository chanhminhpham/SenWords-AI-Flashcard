import React from 'react';
import { render, screen } from '@testing-library/react-native';

// expo-image and expo-linear-gradient mocked via moduleNameMapper in package.json
jest.mock('react-native-paper', () => require('@/__test-utils__/paper-mock'));
jest.mock('@/theme/use-app-theme', () => require('@/__test-utils__/theme-mock'));

// Mutable mock state — changed per test, no jest.resetModules needed
let mockDeviceTier = 'standard';
let mockSystemReduceMotion = false;

jest.mock('@/stores/app.store', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      get deviceTier() {
        return mockDeviceTier;
      },
      get systemReduceMotion() {
        return mockSystemReduceMotion;
      },
      userAnimationOverride: null,
    }),
}));

import { VocabularyImage } from './VocabularyImage';

describe('VocabularyImage', () => {
  beforeEach(() => {
    mockDeviceTier = 'standard';
    mockSystemReduceMotion = false;
  });

  it('always returns null for card variant (images only in detail view)', () => {
    const { toJSON } = render(
      <VocabularyImage
        imageUrl="https://example.com/image.webp"
        mediaType="image"
        word="apple"
        size="card"
      />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders image in detail variant when imageUrl and mediaType are provided', () => {
    render(
      <VocabularyImage
        imageUrl="https://example.com/image.webp"
        mediaType="image"
        word="apple"
        size="detail"
      />
    );
    expect(screen.getByTestId('vocabulary-image')).toBeTruthy();
    expect(screen.queryByTestId('vocabulary-image-placeholder')).toBeNull();
  });

  it('renders placeholder on detail variant when imageUrl is empty', () => {
    render(<VocabularyImage imageUrl="" mediaType="image" word="cat" size="detail" />);
    expect(screen.getByTestId('vocabulary-image-placeholder')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
  });

  it('uses detail size dimensions', () => {
    render(
      <VocabularyImage
        imageUrl="https://example.com/image.webp"
        mediaType="image"
        word="dog"
        size="detail"
      />
    );
    const container = screen.getByTestId('vocabulary-image');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 260 })])
    );
  });

  it('shows ? for empty word placeholder on detail variant', () => {
    render(<VocabularyImage imageUrl={null} mediaType="none" word="" size="detail" />);
    expect(screen.getByText('?')).toBeTruthy();
  });
});

describe('VocabularyImage — budget device', () => {
  beforeEach(() => {
    mockDeviceTier = 'budget';
    mockSystemReduceMotion = false;
  });

  afterEach(() => {
    mockDeviceTier = 'standard';
  });

  it('renders GIF with autoplay disabled on budget devices', () => {
    render(
      <VocabularyImage
        imageUrl="https://example.com/anim.gif"
        mediaType="gif"
        word="run"
        size="detail"
      />
    );
    const image = screen.getByTestId('expo-image');
    expect(image).toBeTruthy();
    expect(image.props.autoplay).toBe(false);
  });
});

describe('VocabularyImage — reduce motion', () => {
  beforeEach(() => {
    mockDeviceTier = 'standard';
    mockSystemReduceMotion = true;
  });

  afterEach(() => {
    mockSystemReduceMotion = false;
  });

  it('renders GIF with autoplay disabled when reduce motion is true', () => {
    render(
      <VocabularyImage
        imageUrl="https://example.com/anim.gif"
        mediaType="gif"
        word="jump"
        size="detail"
      />
    );
    const image = screen.getByTestId('expo-image');
    expect(image).toBeTruthy();
    expect(image.props.autoplay).toBe(false);
  });
});
