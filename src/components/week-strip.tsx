import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useHeat } from '@/components/month-grid';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GridCell } from '@/lib/grid';

/** Twelve narrow week columns, Monday at the top. */
export function WeekStrip({ weeks }: { weeks: (GridCell | null)[][] }) {
  const heat = useHeat();
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">
        Last 12 weeks
      </ThemedText>
      <View style={styles.strip}>
        {weeks.map((week, w) => (
          <View key={w} style={styles.column}>
            {week.map((cell, d) => (
              <View
                key={d}
                style={[
                  styles.square,
                  cell && { backgroundColor: heat[cell.level] },
                  cell?.grace && { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.text },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  strip: { flexDirection: 'row', gap: 3 },
  column: { flex: 1, gap: 3 },
  square: { aspectRatio: 1, borderRadius: 3 },
});
