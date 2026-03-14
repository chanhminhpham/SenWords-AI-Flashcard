import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

let currentSound: Audio.Sound | null = null;

/** Stop and unload any currently playing audio. */
export async function stopCurrentAudio(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Sound may already be unloaded — ignore
    }
    currentSound = null;
  }
  Speech.stop();
}

/**
 * Play audio from a URL. Stops any previous audio first.
 * Calls onComplete when playback finishes (not when it starts).
 * Returns a cleanup function to unload the sound.
 */
export async function playAudio(
  url: string,
  onComplete?: () => void
): Promise<() => Promise<void>> {
  await stopCurrentAudio();

  const { sound } = await Audio.Sound.createAsync({ uri: url });
  currentSound = sound;

  // Listen for playback completion
  sound.setOnPlaybackStatusUpdate((status) => {
    if ('didJustFinish' in status && status.didJustFinish) {
      onComplete?.();
    }
  });

  await sound.playAsync();

  return async () => {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      // Already unloaded
    }
    if (currentSound === sound) {
      currentSound = null;
    }
  };
}

/**
 * Play text-to-speech as fallback when no audio URL is available.
 */
export function playTts(text: string, locale: string = 'en-US'): void {
  Speech.stop();
  Speech.speak(text, { language: locale, rate: 0.8 });
}
