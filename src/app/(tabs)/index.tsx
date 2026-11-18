import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useToday } from '@/hooks/useToday';
import { BUCKETS, BUCKET_LABELS, type Bucket } from '@/types';

export default function TodayScreen() {
  const router = useRouter();
  const { data, skip, markDone } = useToday();

  function start(bucket: Bucket, label: string | null, taskId?: string) {
    router.push({
      pathname: '/session',
      params: { bucket, ...(label ? { label } : {}), ...(taskId ? { taskId } : {}) },
    });
  }

  // Before the first query finishes there is nothing honest to show.
  if (!data) return <ThemedView style={styles.container} />;

  const { task, pendingCount, totalCount, completedSessions } = data;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText themeColor="textSecondary" style={styles.count}>
          {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'} today
        </ThemedText>

        <View style={styles.center}>
          {task ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Up next
              </ThemedText>
              <ThemedText type="title" style={styles.centerText}>
                {BUCKET_LABELS[task.bucket]}
              </ThemedText>
              {task.label ? (
                <ThemedText type="subtitle" themeColor="textSecondary" style={styles.centerText}>
                  {task.label}
                </ThemedText>
              ) : null}
              <View style={styles.actions}>
                <Button label="Start 5 minutes" onPress={() => start(task.bucket, task.label, task.id)} />
                {task.bucket === 'applications' ? (
                  <Button label="Mark sent" variant="secondary" onPress={markDone} />
                ) : null}
                {pendingCount > 1 ? <Button label="Skip" variant="secondary" onPress={skip} /> : null}
              </View>
            </>
          ) : totalCount > 0 ? (
            <>
              <ThemedText type="title" style={styles.centerText}>
                All done
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                Today&apos;s plan is finished. The rest of the day is earned.
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="subtitle" style={styles.centerText}>
                Nothing planned for today
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                Start a free session:
              </ThemedText>
              <View style={styles.actions}>
                {BUCKETS.map((bucket) => (
                  <Button
                    key={bucket}
                    label={BUCKET_LABELS[bucket]}
                    variant="secondary"
                    onPress={() => start(bucket, null)}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Button label="Plan tomorrow" variant="secondary" onPress={() => router.push('/plan')} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset },
  count: { textAlign: 'center', marginTop: Spacing.three },
  center: { flex: 1, justifyContent: 'center', gap: Spacing.two },
  centerText: { textAlign: 'center' },
  footer: { paddingVertical: Spacing.three },
  actions: { gap: Spacing.two, marginTop: Spacing.four },
});
