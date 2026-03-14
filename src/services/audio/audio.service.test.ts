import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

import { playAudio, playTts, stopCurrentAudio } from './audio.service';

const mockSound = {
  playAsync: jest.fn().mockResolvedValue({}),
  stopAsync: jest.fn().mockResolvedValue({}),
  unloadAsync: jest.fn().mockResolvedValue({}),
  setOnPlaybackStatusUpdate: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });
});

describe('playAudio', () => {
  it('creates sound from URL and plays it', async () => {
    await playAudio('https://example.com/word_us.mp3');

    expect(Audio.Sound.createAsync).toHaveBeenCalledWith({
      uri: 'https://example.com/word_us.mp3',
    });
    expect(mockSound.playAsync).toHaveBeenCalled();
  });

  it('stops previous audio before playing new', async () => {
    await playAudio('https://example.com/first.mp3');
    jest.clearAllMocks();
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });

    await playAudio('https://example.com/second.mp3');

    expect(mockSound.stopAsync).toHaveBeenCalled();
    expect(mockSound.unloadAsync).toHaveBeenCalled();
    expect(mockSound.playAsync).toHaveBeenCalled();
  });

  it('registers onComplete callback via setOnPlaybackStatusUpdate', async () => {
    const onComplete = jest.fn();
    await playAudio('https://example.com/word.mp3', onComplete);

    expect(mockSound.setOnPlaybackStatusUpdate).toHaveBeenCalled();

    // Simulate playback finishing
    const statusCallback = mockSound.setOnPlaybackStatusUpdate.mock.calls[0][0];
    statusCallback({ didJustFinish: true });
    expect(onComplete).toHaveBeenCalled();
  });

  it('returns a cleanup function that unloads the sound', async () => {
    const cleanup = await playAudio('https://example.com/word.mp3');
    jest.clearAllMocks();

    await cleanup();

    expect(mockSound.stopAsync).toHaveBeenCalled();
    expect(mockSound.unloadAsync).toHaveBeenCalled();
  });
});

describe('playTts', () => {
  it('calls Speech.speak with correct params', () => {
    playTts('hello', 'en-US');

    expect(Speech.stop).toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith('hello', {
      language: 'en-US',
      rate: 0.8,
    });
  });

  it('uses en-US as default locale', () => {
    playTts('world');

    expect(Speech.speak).toHaveBeenCalledWith('world', {
      language: 'en-US',
      rate: 0.8,
    });
  });
});

describe('stopCurrentAudio', () => {
  it('stops and unloads current sound', async () => {
    await playAudio('https://example.com/word.mp3');
    jest.clearAllMocks();

    await stopCurrentAudio();

    expect(mockSound.stopAsync).toHaveBeenCalled();
    expect(mockSound.unloadAsync).toHaveBeenCalled();
    expect(Speech.stop).toHaveBeenCalled();
  });

  it('handles no current sound gracefully', async () => {
    await expect(stopCurrentAudio()).resolves.not.toThrow();
  });
});
