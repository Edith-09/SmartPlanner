import { Tabs } from 'expo-router';

import { useAppTheme } from '@/hooks/useAppTheme';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Plan', headerTitle: 'Plan' }} />
      <Tabs.Screen
        name="favorites"
        options={{ title: 'Favorites', headerTitle: 'Favorites' }}
      />
      <Tabs.Screen name="reports" options={{ title: 'Reports', headerTitle: 'Reports' }} />
    </Tabs>
  );
}
