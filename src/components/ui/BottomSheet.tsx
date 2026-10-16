import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  accessibilityLabel?: string;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  accessibilityLabel,
  children,
}: BottomSheetProps) {
  const { colors } = useAppTheme();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Dismiss dialog"
          accessibilityRole="button"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <View
          accessibilityLabel={accessibilityLabel ?? title ?? 'Bottom sheet'}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {title ? (
            <Text accessibilityRole="header" allowFontScaling style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
          ) : null}
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '90%',
    minHeight: 120,
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: theme.spacing.lg,
    width: 40,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  content: {
    gap: theme.spacing.md,
  },
});
