import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { COMPLETION_SECONDS, FIVE_MINUTES, useSessionTimer } from '@/hooks/useSessionTimer';
import { formatClock } from '@/lib/format';
import { BUCKET_LABELS, type Bucket } from '@/types';

export default function SessionScreen() {
  const params = useLocalSearchParams<{ bucket: Bucket; label?: string }>();
  const bucket = params.bucket;
  const { elapsed, stop, stopping, ready } = useSessionTimer({
    bucket,
    label: params.label ? params.label : null,
  });
  const theme = useTheme();

  // Android's back button would leave the session running in the background.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const progress = Math.min(elapsed / COMPLETION_SECONDS, 1);
  const markerAt = `${(FIVE_MINUTES / COMPLETION_SECONDS) * 100}%` as const;

  let message = 'Stay with it for five minutes.';
  if (elapsed >= COMPLETION_SECONDS) message = 'Session complete. Stop whenever you like.';
  else if (elapsed >= FIVE_MINUTES) message = 'Five minutes done. Keep going.';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">{BUCKET_LABELS[bucket]}</ThemedText>
        {params.label ? <ThemedText themeColor="textSecondary">{params.label}</ThemedText> : null}

        <ThemedText type="title" style={styles.clock}>
          {formatClock(elapsed)}
        </ThemedText>

        <View style={styles.barWrap}>
          <View style={[styles.bar, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[styles.fill, { backgroundColor: theme.text, width: `${progress * 100}%` }]}
            />
          </View>
          <View style={[styles.marker, { left: markerAt, backgroundColor: theme.textSecondary }]} />
          <ThemedText type="small" themeColor="textSecondary" style={[styles.markerLabel, { left: markerAt }]}>
            5 min
          </ThemedText>
        </View>

        <ThemedText themeColor="textSecondary">{message}</ThemedText>

        <Pressable
          onPress={stop}
          disabled={!ready || stopping}
          style={[styles.stop, { backgroundColor: theme.backgroundSelected, opacity: ready && !stopping ? 1 : 0.5 }]}>
          <ThemedText type="smallBold">Stop</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  clock: { fontSize: 72, lineHeight: 80, fontVariant: ['tabular-nums'] },
  barWrap: { width: '100%', height: 36, justifyContent: 'center' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8 },
  marker: { position: 'absolute', top: 4, width: 2, height: 16 },
  markerLabel: { position: 'absolute', top: 20, marginLeft: -16 },
  stop: { marginTop: Spacing.four, paddingVertical: Spacing.three, paddingHorizontal: Spacing.six, borderRadius: Spacing.four },
});
