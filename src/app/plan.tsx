import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlan, type PlanRows } from '@/hooks/usePlan';
import { useTheme } from '@/hooks/use-theme';
import { BUCKETS, BUCKET_LABELS } from '@/types';

export default function PlanScreen() {
  const { initial, save, cancel } = usePlan();
  if (!initial) return <ThemedView style={styles.container} />;
  return <PlanForm initial={initial} onSave={save} onCancel={cancel} />;
}

// The form is its own component so useState can take `initial` as its starting
// value. useState only reads its argument on the first render, so the form
// would not pick up data that arrives later; rendering it only once the data
// exists sidesteps that.
function PlanForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PlanRows;
  onSave: (rows: PlanRows) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const [rows, setRows] = useState(initial);

  function update(bucket: (typeof BUCKETS)[number], patch: Partial<PlanRows[typeof bucket]>) {
    setRows((prev) => ({ ...prev, [bucket]: { ...prev[bucket], ...patch } }));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Plan tomorrow</ThemedText>
        <ThemedText themeColor="textSecondary">
          Choose tonight. Tomorrow-you just presses Start.
        </ThemedText>

        <View style={styles.rows}>
          {BUCKETS.map((bucket) => (
            <View key={bucket} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.rowTop}>
                <ThemedText type="smallBold">{BUCKET_LABELS[bucket]}</ThemedText>
                <Switch
                  value={rows[bucket].enabled}
                  onValueChange={(enabled) => update(bucket, { enabled })}
                />
              </View>
              {rows[bucket].enabled ? (
                <TextInput
                  value={rows[bucket].label}
                  onChangeText={(label) => update(bucket, { label })}
                  placeholder="Optional label"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button label="Save plan" onPress={() => onSave(rows)} />
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  rows: { gap: Spacing.two, marginTop: Spacing.three },
  row: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 16 },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.three },
});
