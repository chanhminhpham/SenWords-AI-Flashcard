import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { PronunciationPlayer } from './PronunciationPlayer';

// Mocks
jest.mock('@/theme/use-app-theme', () => ({
  useAppTheme: () => ({
    colors: {
      nature: { accent: '#2D8A5E', tint: '#E8F5E9' },
    },
  }),
}));

const mockPlayAudio = jest.fn().mockResolvedValue(jest.fn());
const mockPlayTts = jest.fn();
const mockStopCurrentAudio = jest.fn();
jest.mock('@/services/audio/audio.service', () => ({
  playAudio: (...args: unknown[]) => mockPlayAudio(...args),
  playTts: (...args: unknown[]) => mockPlayTts(...args),
  stopCurrentAudio: () => mockStopCurrentAudio(),
}));

jest.mock('@/services/dictionary/dictionary.service', () => ({
  resolveAudioUrl: (url: string | null | undefined) => url ?? null,
}));

const mockHapticTabSwitch = jest.fn();
jest.mock('@/services/haptics', () => ({
  hapticTabSwitch: () => mockHapticTabSwitch(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PronunciationPlayer', () => {
  it('renders US + UK buttons when both URLs provided', () => {
    render(
      <PronunciationPlayer
        audioUrlUs="https://example.com/us.mp3"
        audioUrlUk="https://example.com/uk.mp3"
        word="hello"
      />
    );
    expect(screen.getByTestId('us-button')).toBeTruthy();
    expect(screen.getByTestId('uk-button')).toBeTruthy();
    expect(screen.queryByTestId('tts-button')).toBeNull();
  });

  it('renders TTS fallback when no URLs', () => {
    render(<PronunciationPlayer word="hello" />);
    expect(screen.getByTestId('tts-button')).toBeTruthy();
    expect(screen.queryByTestId('us-button')).toBeNull();
    expect(screen.queryByTestId('uk-button')).toBeNull();
  });

  it('renders only US button when UK URL is null', () => {
    render(<PronunciationPlayer audioUrlUs="https://example.com/us.mp3" word="hello" />);
    expect(screen.getByTestId('us-button')).toBeTruthy();
    expect(screen.queryByTestId('uk-button')).toBeNull();
  });

  it('renders only UK button when US URL is null', () => {
    render(<PronunciationPlayer audioUrlUk="https://example.com/uk.mp3" word="hello" />);
    expect(screen.queryByTestId('us-button')).toBeNull();
    expect(screen.getByTestId('uk-button')).toBeTruthy();
  });

  it('has correct accessibility labels', () => {
    render(
      <PronunciationPlayer
        audioUrlUs="https://example.com/us.mp3"
        audioUrlUk="https://example.com/uk.mp3"
        word="hello"
      />
    );
    expect(screen.getByLabelText('pronunciation.us')).toBeTruthy();
    expect(screen.getByLabelText('pronunciation.uk')).toBeTruthy();
  });

  it('fires haptic on US button press', async () => {
    render(<PronunciationPlayer audioUrlUs="https://example.com/us.mp3" word="hello" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('us-button'));
    });
    expect(mockHapticTabSwitch).toHaveBeenCalled();
  });

  it('fires haptic on TTS button press', () => {
    render(<PronunciationPlayer word="hello" />);
    fireEvent.press(screen.getByTestId('tts-button'));
    expect(mockHapticTabSwitch).toHaveBeenCalled();
  });

  it('calls playAudio with correct URL for US', async () => {
    render(<PronunciationPlayer audioUrlUs="https://example.com/us.mp3" word="hello" />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('us-button'));
    });
    expect(mockPlayAudio).toHaveBeenCalledWith('https://example.com/us.mp3', expect.any(Function));
  });

  it('calls playTts with word for TTS fallback', () => {
    render(<PronunciationPlayer word="hello" />);
    fireEvent.press(screen.getByTestId('tts-button'));
    expect(mockPlayTts).toHaveBeenCalledWith('hello');
  });

  it('renders compact buttons without labels', () => {
    render(
      <PronunciationPlayer
        audioUrlUs="https://example.com/us.mp3"
        audioUrlUk="https://example.com/uk.mp3"
        word="hello"
        compact
      />
    );
    expect(screen.queryByText('US')).toBeNull();
    expect(screen.queryByText('UK')).toBeNull();
  });

  it('cleans up audio on unmount', () => {
    const { unmount } = render(
      <PronunciationPlayer audioUrlUs="https://example.com/us.mp3" word="hello" />
    );
    unmount();
    expect(mockStopCurrentAudio).toHaveBeenCalled();
  });
});
