import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Legend, MonthGrid } from '@/components/month-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useMonthGrid } from '@/hooks/useMonthGrid';
import { useStreak } from '@/hooks/useStreak';
import { formatMonth } from '@/lib/format';

export default function HistoryScreen() {
  const streak = useStreak();
  const { month, cells, canGoNext, goPrev, goNext } = useMonthGrid();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View>
            <ThemedText type="title">{streak?.streak ?? 0} day streak</ThemedText>
            <ThemedText themeColor="textSecondary">
              {streak?.graceRemaining ?? 2} grace {streak?.graceRemaining === 1 ? 'day' : 'days'} left this month
            </ThemedText>
          </View>

          <View style={styles.monthHeader}>
            <Pressable onPress={goPrev} hitSlop={12}>
              <ThemedText type="subtitle">‹</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{formatMonth(month)}</ThemedText>
            <Pressable onPress={goNext} disabled={!canGoNext} hitSlop={12} style={{ opacity: canGoNext ? 1 : 0.25 }}>
              <ThemedText type="subtitle">›</ThemedText>
            </Pressable>
          </View>

          <MonthGrid cells={cells} />
          <Legend />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four, paddingBottom: BottomTabInset + Spacing.four },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
