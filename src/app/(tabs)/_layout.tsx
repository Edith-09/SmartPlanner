import { Text } from 'react-native';
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
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan',
          headerTitle: 'Plan',
          tabBarAccessibilityLabel: 'Plan tab',
          tabBarIcon: ({ focused, color, size }) => (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ color, fontSize: size, textAlign: 'center' }}
            >
              {focused ? '🗺' : '🗺️'}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          headerTitle: 'Favorites',
          tabBarAccessibilityLabel: 'Favorites tab',
          tabBarIcon: ({ focused, color, size }) => (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ color, fontSize: size, textAlign: 'center' }}
            >
              {focused ? '★' : '☆'}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          headerTitle: 'Reports',
          tabBarAccessibilityLabel: 'Reports tab',
          tabBarIcon: ({ focused, color, size }) => (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{ color, fontSize: size, textAlign: 'center' }}
            >
              {focused ? '⚠' : '⚠︎'}
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
