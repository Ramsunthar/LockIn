import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME, initDatabase } from '@/db';
import { useRollover } from '@/hooks/useRollover';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <AppStack />
      </SQLiteProvider>
    </ThemeProvider>
  );
}

// Separate component because useRollover needs the database context, which
// only exists inside <SQLiteProvider>.
function AppStack() {
  const rolloverDone = useRollover();
  if (!rolloverDone) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* No swipe-back: the spec says no navigation away mid-session. */}
      <Stack.Screen name="session" options={{ gestureEnabled: false }} />
      <Stack.Screen name="plan" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
