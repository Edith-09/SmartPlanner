import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, TextField, Toast } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { REPORT_LABELS } from '@/services/reports/reportsStorage';
import type { Coordinate, IncidentType } from '@/types/domain';

interface ReportFormProps {
  location: Coordinate | null;
  onSubmit: (input: {
    type: IncidentType;
    note: string;
    location: Coordinate;
  }) => { ok: boolean; reason?: 'rate-limit' };
}

const incidentTypes: IncidentType[] = ['crash', 'roadwork', 'hazard', 'closure', 'other'];

export function ReportForm({ location, onSubmit }: ReportFormProps) {
  const { colors } = useAppTheme();
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  const submit = (): void => {
    if (!selectedType || !location) {
      return;
    }
    const result = onSubmit({ type: selectedType, note, location });
    if (!result.ok) {
      setFeedback({
        message: 'You can send up to 5 reports per hour. Please try again later.',
        tone: 'error',
      });
      return;
    }
    setSelectedType(null);
    setNote('');
    setFeedback({ message: 'Report submitted. Thank you!', tone: 'success' });
  };

  return (
    <Card accessibilityLabel="Report an incident">
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Report an incident</Text>
        <View accessibilityLabel="Incident type" style={styles.chips}>
          {incidentTypes.map((type) => (
            <Chip
              key={type}
              label={REPORT_LABELS[type]}
              selected={selectedType === type}
              accessibilityLabel={`Report type ${REPORT_LABELS[type]}`}
              onPress={() => setSelectedType(type)}
            />
          ))}
        </View>
        <TextField
          label="Note (optional)"
          placeholder="Add details that may help others"
          helperText="Keep notes brief and useful."
          value={note}
          onChangeText={setNote}
          maxLength={120}
          multiline
          accessibilityLabel="Optional report note"
        />
        <Button
          title="Submit report"
          onPress={submit}
          disabled={!selectedType || !location}
          accessibilityLabel="Submit traffic report"
        />
        {feedback && (
          <Toast
            message={feedback.message}
            visible
            tone={feedback.tone}
            accessibilityLabel={feedback.message}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});