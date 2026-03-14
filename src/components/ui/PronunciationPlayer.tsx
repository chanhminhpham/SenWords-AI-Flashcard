import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { playAudio, playTts, stopCurrentAudio } from '@/services/audio/audio.service';
import { resolveAudioUrl } from '@/services/dictionary/dictionary.service';
import { hapticTabSwitch } from '@/services/haptics';
import { useAppTheme } from '@/theme/use-app-theme';

export interface PronunciationPlayerProps {
  audioUrlUs?: string | null;
  audioUrlUk?: string | null;
  ipa?: string | null;
  word: string;
  compact?: boolean;
  testID?: string;
}

type PlayingState = 'idle' | 'us' | 'uk' | 'tts';

/**
 * PronunciationPlayer — audio playback buttons for US/UK accents with TTS fallback.
 * Shows US/UK buttons when audio URLs available, single TTS button otherwise.
 * Compact mode renders smaller buttons without labels (for BaseSwipeCard).
 */
export const PronunciationPlayer = React.memo(function PronunciationPlayer({
  audioUrlUs,
  audioUrlUk,
  ipa,
  word,
  compact = false,
  testID = 'pronunciation-player',
}: PronunciationPlayerProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [playing, setPlaying] = useState<PlayingState>('idle');
  const cleanupRef = useRef<(() => Promise<void>) | null>(null);
  const ttsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Resolve relative paths to full Supabase Storage URLs
  const resolvedUs = resolveAudioUrl(audioUrlUs);
  const resolvedUk = resolveAudioUrl(audioUrlUk);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
      cleanupRef.current?.();
      stopCurrentAudio();
    };
  }, []);

  const handlePlayAudio = useCallback(async (url: string, accent: 'us' | 'uk') => {
    hapticTabSwitch();
    setPlaying(accent);
    try {
      const cleanup = await playAudio(url, () => {
        if (mountedRef.current) setPlaying('idle');
      });
      cleanupRef.current = cleanup;
    } catch {
      // Playback failed — reset state
      if (mountedRef.current) setPlaying('idle');
    }
  }, []);

  const handlePlayTts = useCallback(() => {
    hapticTabSwitch();
    setPlaying('tts');
    playTts(word);
    // TTS is fire-and-forget, reset after a short delay
    ttsTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setPlaying('idle');
    }, 1500);
  }, [word]);

  const hasUsAudio = !!resolvedUs;
  const hasUkAudio = !!resolvedUk;
  const hasAnyAudio = hasUsAudio || hasUkAudio;

  // Caption text for accessibility (AC#6)
  const captionText =
    playing === 'us'
      ? `[US] ${ipa ?? word}`
      : playing === 'uk'
        ? `[UK] ${ipa ?? word}`
        : playing === 'tts'
          ? `[TTS] ${word}`
          : null;

  const buttonSize = compact ? styles.compactButton : styles.button;
  const iconSize = compact ? 16 : 20;

  // TTS fallback when no audio URLs
  if (!hasAnyAudio) {
    return (
      <View testID={testID}>
        <View style={styles.container}>
          <Pressable
            testID="tts-button"
            onPress={handlePlayTts}
            accessibilityRole="button"
            accessibilityLabel={t('pronunciation.tts')}
            style={[buttonSize, { backgroundColor: theme.colors.nature.tint }]}>
            <Text style={{ fontSize: iconSize }}>🔊</Text>
            {!compact && (
              <Text style={[styles.buttonLabel, { color: theme.colors.nature.accent }]}>
                {t('pronunciation.tts')}
              </Text>
            )}
          </Pressable>
        </View>
        {!compact && captionText && (
          <Text
            testID="pronunciation-caption"
            style={[styles.caption, { color: theme.colors.nature.accent }]}>
            {captionText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View testID={testID}>
      <View style={styles.container}>
        {hasUsAudio && (
          <Pressable
            testID="us-button"
            onPress={() => handlePlayAudio(resolvedUs!, 'us')}
            accessibilityRole="button"
            accessibilityLabel={t('pronunciation.us')}
            style={[
              buttonSize,
              {
                backgroundColor:
                  playing === 'us' ? theme.colors.nature.accent + '20' : theme.colors.nature.tint,
              },
            ]}>
            <Text style={{ fontSize: iconSize }}>🇺🇸</Text>
            {!compact && (
              <Text style={[styles.buttonLabel, { color: theme.colors.nature.accent }]}>
                {playing === 'us' ? '▶' : 'US'}
              </Text>
            )}
          </Pressable>
        )}
        {hasUkAudio && (
          <Pressable
            testID="uk-button"
            onPress={() => handlePlayAudio(resolvedUk!, 'uk')}
            accessibilityRole="button"
            accessibilityLabel={t('pronunciation.uk')}
            style={[
              buttonSize,
              {
                backgroundColor:
                  playing === 'uk' ? theme.colors.nature.accent + '20' : theme.colors.nature.tint,
              },
            ]}>
            <Text style={{ fontSize: iconSize }}>🇬🇧</Text>
            {!compact && (
              <Text style={[styles.buttonLabel, { color: theme.colors.nature.accent }]}>
                {playing === 'uk' ? '▶' : 'UK'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      {!compact && captionText && (
        <Text
          testID="pronunciation-caption"
          style={[styles.caption, { color: theme.colors.nature.accent }]}>
          {captionText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 4,
  },
});
