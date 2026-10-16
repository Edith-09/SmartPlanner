import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { QueryProvider } from '@/services/query/QueryProvider';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function RootLayout() {
  const { colors, colorScheme } = useAppTheme();

  return (
    <QueryProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryProvider>
  );
}
