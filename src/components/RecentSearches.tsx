import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ListItem } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import type { PlaceSuggestion } from '@/services/places/placesService';

interface RecentSearchesProps {
  onSelect: (place: PlaceSuggestion) => void;
}

export function RecentSearches({ onSelect }: RecentSearchesProps) {
  const { colors } = useAppTheme();
  const { recents, clearRecents } = useRecentSearches();

  if (recents.length === 0) {
    return null;
  }

  return (
    <Card accessibilityLabel="Recent destination searches">
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Recent</Text>
        {recents.map((place, index) => (
          <View key={place.placeId}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
            <ListItem
              title={place.primaryText}
              subtitle={place.secondaryText}
              onPress={() => onSelect(place)}
              accessibilityLabel={`Recent destination ${place.primaryText}, ${place.secondaryText}`}
            />
          </View>
        ))}
        <Button
          title="Clear recent searches"
          variant="secondary"
          onPress={clearRecents}
          accessibilityLabel="Clear recent destination searches"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});