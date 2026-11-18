import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Heat, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { GridCell } from '@/lib/grid';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function useHeat() {
  return Heat[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export function MonthGrid({ cells }: { cells: (GridCell | null)[] }) {
  const theme = useTheme();
  const heat = useHeat();

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAYS.map((d, i) => (
          <View key={i} style={styles.slot}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.weekday}>
              {d}
            </ThemedText>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {cells.map((cell, i) => (
          <View key={i} style={styles.slot}>
            {cell ? (
              <View
                style={[
                  styles.square,
                  { backgroundColor: heat[cell.level], opacity: cell.isFuture ? 0.35 : 1 },
                  cell.grace && { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.text },
                  cell.isToday && { borderWidth: 2, borderStyle: 'solid', borderColor: theme.text },
                ]}>
                <ThemedText type="small" themeColor={cell.level >= 2 ? 'background' : 'textSecondary'}>
                  {cell.day}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function Legend() {
  const theme = useTheme();
  const heat = useHeat();
  return (
    <View style={styles.legend}>
      <ThemedText type="small" themeColor="textSecondary">
        Less
      </ThemedText>
      {heat.map((color, i) => (
        <View key={i} style={[styles.swatch, { backgroundColor: color }]} />
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        More
      </ThemedText>
      <View style={[styles.swatch, styles.graceSwatch, { borderColor: theme.text }]} />
      <ThemedText type="small" themeColor="textSecondary">
        Grace day
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  // 100% / 7 columns. Each slot pads its square so squares don't touch.
  slot: { width: `${100 / 7}%`, padding: 2 },
  weekday: { textAlign: 'center' },
  square: { aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  swatch: { width: 14, height: 14, borderRadius: 3 },
  graceSwatch: { borderWidth: 2, borderStyle: 'dashed', marginLeft: Spacing.two },
});
