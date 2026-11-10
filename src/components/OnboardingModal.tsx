import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { storage, storageKeys } from '@/services/storage/storage';

const slides = [
  {
    title: 'Check your route',
    description: 'Type a destination and see the live traffic status of your trip before you leave.',
  },
  {
    title: 'See what is ahead',
    description: 'A color-coded map, traffic alerts and alternative routes help you choose the best way.',
  },
  {
    title: 'Help other drivers',
    description: 'Report incidents and see reports from other users along your route.',
  },
] as const;

export function OnboardingModal() {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(() => !storage.getBoolean(storageKeys.hasOnboarded));
  const [slideIndex, setSlideIndex] = useState(0);

  if (!visible) {
    return null;
  }

  const finishOnboarding = (): void => {
    storage.setBoolean(storageKeys.hasOnboarded, true);
    setVisible(false);
  };

  const currentSlide = slides[slideIndex];
  const isLastSlide = slideIndex === slides.length - 1;

  return (
    <Modal
      accessibilityLabel="Smart Transport Planner introduction"
      animationType="fade"
      onRequestClose={finishOnboarding}
      visible={visible}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View accessibilityLabel={`Introduction slide ${slideIndex + 1} of ${slides.length}`} style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {currentSlide.title}
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {currentSlide.description}
          </Text>
        </View>
        <View accessibilityLabel={`Slide ${slideIndex + 1} of ${slides.length}`} style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.title}
              accessibilityLabel={index === slideIndex ? `Current slide ${index + 1}` : undefined}
              accessibilityState={{ selected: index === slideIndex }}
              style={[
                styles.dot,
                { backgroundColor: index === slideIndex ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <View style={styles.button}>
            <Button
              title="Skip"
              variant="secondary"
              onPress={finishOnboarding}
              accessibilityLabel="Skip introduction"
            />
          </View>
          <View style={styles.button}>
            <Button
              title={isLastSlide ? 'Get started' : 'Next'}
              onPress={isLastSlide ? finishOnboarding : () => setSlideIndex(slideIndex + 1)}
              accessibilityLabel={isLastSlide ? 'Get started' : 'Next introduction slide'}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 2,
  },
  copy: {
    gap: theme.spacing.md,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  title: {
    fontSize: theme.typography.display,
    fontWeight: '700',
  },
  description: {
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    borderRadius: theme.radius.pill,
    height: theme.spacing.sm,
    width: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});