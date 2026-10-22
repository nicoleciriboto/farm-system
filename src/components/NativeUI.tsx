import React, { useState, type ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import type { AnimalStatus, TaskStatus, SyncState } from '@/types';

// ============= BUTTON =============
interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'amber' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  icon,
  style,
}: ButtonProps) {
  const getBgColor = () => {
    if (disabled) return colors.charcoal100;
    switch (variant) {
      case 'primary': return colors.forest700;
      case 'secondary': return colors.sage100;
      case 'amber': return colors.amber400;
      case 'danger': return colors.rust500;
      case 'outline': case 'ghost': return 'transparent';
      default: return colors.forest700;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.charcoal300;
    switch (variant) {
      case 'primary': case 'danger': return colors.white;
      case 'secondary': return colors.forest800;
      case 'amber': return colors.charcoal900;
      case 'outline': return colors.forest700;
      case 'ghost': return colors.forest700;
      default: return colors.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 7, paddingHorizontal: 12 };
      case 'lg': return { paddingVertical: 14, paddingHorizontal: 20 };
      default: return { paddingVertical: 11, paddingHorizontal: 16 };
    }
  };

  const fontSize = size === 'sm' ? font.body : font.bodyLarge;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        getPadding(),
        {
          backgroundColor: getBgColor(),
          borderColor: variant === 'outline' ? colors.forest700 : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          {typeof children === 'string' || typeof children === 'number' ? (
            <Text style={[styles.buttonText, { color: getTextColor(), fontSize }]}>{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============= CARD =============
export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ============= INPUT =============
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline,
  numberOfLines = 3,
  required,
  optional,
  error,
  readOnly,
}: {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  optional?: boolean;
  error?: string;
  readOnly?: boolean;
}) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={{ color: colors.rust500 }}>*</Text>}
        </Text>
        {optional && <Text style={styles.inputOptional}>Optional</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.charcoal300}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        editable={!readOnly}
        style={[
          styles.inputField,
          multiline && { height: 75, textAlignVertical: 'top' },
          error && { borderColor: colors.rust500 },
          readOnly && { backgroundColor: colors.cream200, color: colors.charcoal500 },
        ]}
      />
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
}

// ============= SELECT PICKER MODAL =============
export function Select({
  label,
  value,
  onSelect,
  options,
  placeholder = 'Select an option',
  required,
  error,
}: {
  label: string;
  value?: string;
  onSelect: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={{ color: colors.rust500 }}>*</Text>}
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        style={[styles.inputField, styles.selectTrigger, error && { borderColor: colors.rust500 }]}
      >
        <Text style={{ fontSize: font.bodyLarge, color: selectedOption ? colors.charcoal800 : colors.charcoal300 }}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={icon.sm} color={colors.charcoal400} />
      </TouchableOpacity>
      {error && <Text style={styles.inputError}>{error}</Text>}

      {/* Dropdown Modal Sheet */}
      <RNModal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.selectSheet, { paddingBottom: spacing.xl + insets.bottom }]}>
            <View style={styles.selectHeader}>
              <Text style={styles.selectTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={icon.lg} color={colors.charcoal600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.selectItem,
                    value === opt.value && { backgroundColor: colors.forest50 },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectItemText,
                      value === opt.value && { color: colors.forest700, fontWeight: weight.semibold },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {value === opt.value && (
                    <Ionicons name="checkmark" size={icon.md} color={colors.forest700} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </RNModal>
    </View>
  );
}

// ============= STATUS BADGES =============
export function StatusBadge({ status }: { status: AnimalStatus }) {
  const badgeConfig: Record<AnimalStatus, { bg: string; text: string; border: string }> = {
    Active: { bg: colors.sage50, text: colors.sage700, border: colors.sage200 },
    Sold: { bg: colors.amber50, text: colors.amber700, border: colors.amber200 },
    Deceased: { bg: colors.charcoal50, text: colors.charcoal500, border: colors.charcoal200 },
    Transferred: { bg: colors.forest50, text: colors.forest700, border: colors.forest100 },
  };
  const cfg = badgeConfig[status] || badgeConfig.Active;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.badgeText, { color: cfg.text }]}>{status}</Text>
    </View>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const taskConfig: Record<TaskStatus, { bg: string; text: string; dot: string; border: string }> = {
    Upcoming: { bg: colors.forest50, text: colors.forest700, dot: colors.forest600, border: colors.forest100 },
    'Due Today': { bg: colors.amber50, text: colors.amber700, dot: colors.amber500, border: colors.amber200 },
    Overdue: { bg: colors.rust50, text: colors.rust500, dot: colors.rust500, border: colors.rust100 },
    Completed: { bg: colors.charcoal50, text: colors.charcoal400, dot: colors.charcoal300, border: colors.charcoal100 },
  };
  const cfg = taskConfig[status] || taskConfig.Upcoming;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{status}</Text>
    </View>
  );
}

// ============= SYNC INDICATOR =============
export function SyncIndicator({ state }: { state: SyncState }) {
  const config = {
    Synced: { text: 'Synced', color: colors.forest700, bg: colors.forest50, dot: colors.forest600 },
    Offline: { text: 'Offline', color: colors.charcoal500, bg: colors.charcoal50, dot: colors.charcoal400 },
    Pending: { text: 'Changes pending', color: colors.amber700, bg: colors.amber50, dot: colors.amber500 },
    Syncing: { text: 'Syncing...', color: colors.forest600, bg: colors.forest50, dot: colors.forest500 },
    Failed: { text: 'Sync failed', color: colors.rust500, bg: colors.rust50, dot: colors.rust500 },
  }[state] || { text: state, color: colors.forest700, bg: colors.forest50, dot: colors.forest600 };

  return (
    <View style={[styles.syncBadge, { backgroundColor: config.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
      <Text style={[styles.syncText, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

// ============= SECTION HEADER =============
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <View>{action}</View>}
    </View>
  );
}

// ============= EMPTY STATE =============
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.emptyContainer}>
      {icon && <View style={{ marginBottom: 12 }}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action && <View style={{ marginTop: 14 }}>{action}</View>}
    </View>
  );
}

// ============= PROGRESS BAR =============
export function ProgressBar({
  value,
  max,
  color = colors.forest600,
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  );
}

// ============= MODAL DIALOG =============
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalBackdrop, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} hitSlop={10}>
              <Ionicons name="close" size={icon.md} color={colors.charcoal500} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={{ paddingBottom: footer ? spacing.lg : spacing.lg + insets.bottom }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer && <View style={[styles.modalFooter, { paddingBottom: spacing.md + insets.bottom }]}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

// ============= CONFIRM DIALOG =============
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { justifyContent: 'center', padding: 20 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalContainer, { maxHeight: 300, borderRadius: radius.xl }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={icon.md} color={colors.charcoal500} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: spacing.lg }}>
            <Text style={{ fontSize: font.body, color: colors.charcoal600, lineHeight: 20 }}>{message}</Text>
          </View>
          <View style={[styles.modalFooter, { flexDirection: 'row', gap: 10 }]}>
            <Button variant="outline" size="sm" onPress={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onPress={onConfirm} style={{ flex: 1 }}>
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: weight.semibold,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.charcoal100,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.charcoal700,
    marginBottom: 4,
  },
  inputOptional: {
    fontSize: font.caption,
    color: colors.charcoal400,
  },
  inputField: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.charcoal200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: font.bodyLarge,
    color: colors.charcoal800,
  },
  inputError: {
    fontSize: font.caption,
    color: colors.rust500,
    marginTop: 3,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 15, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.cream50,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal100,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.charcoal100,
    backgroundColor: colors.white,
  },
  selectSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal100,
  },
  selectTitle: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.charcoal50,
  },
  selectItemText: {
    fontSize: font.body,
    color: colors.charcoal700,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: font.caption,
    fontWeight: weight.semibold,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  syncText: {
    fontSize: font.caption,
    fontWeight: weight.semibold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: font.bodyLarge,
    fontWeight: weight.semibold,
    color: colors.charcoal700,
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: font.body,
    color: colors.charcoal400,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.charcoal100,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
