import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/theme/use-app-theme';

export interface IpaDisplayProps {
  ipa?: string | null;
  ipaUs?: string | null;
  ipaUk?: string | null;
  testID?: string;
}

/**
 * IpaDisplay — shows IPA phonetic transcription.
 * When US and UK IPA differ, both are shown with labels.
 * When identical or only one provided, shows single IPA.
 */
export const IpaDisplay = React.memo(function IpaDisplay({
  ipa,
  ipaUs,
  ipaUk,
  testID = 'ipa-display',
}: IpaDisplayProps) {
  const theme = useAppTheme();

  // Determine what to show
  const usIpa = ipaUs ?? ipa;
  const ukIpa = ipaUk ?? null;
  const showDual = usIpa && ukIpa && usIpa !== ukIpa;

  if (!usIpa && !ukIpa) return null;

  if (showDual) {
    return (
      <View
        testID={testID}
        style={styles.container}
        accessible
        accessibilityLabel={`IPA US: ${usIpa}, UK: ${ukIpa}`}>
        <Text style={[styles.ipaText, { color: theme.colors.nature.accent }]}>US: {usIpa}</Text>
        <Text style={[styles.ipaText, { color: theme.colors.nature.accent }]}>UK: {ukIpa}</Text>
      </View>
    );
  }

  const displayIpa = usIpa ?? ukIpa;
  return (
    <View testID={testID} accessible accessibilityLabel={`IPA: ${displayIpa}`}>
      <Text style={[styles.ipaText, { color: theme.colors.nature.accent }]}>{displayIpa}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  ipaText: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
