import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
  Pressable,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/** Shared page container + content padding so every screen has the same margins. */
export const screen = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream100 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});

// ============= SCREEN TITLE =============
export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.titleRight}>{right}</View> : null}
    </View>
  );
}

// ============= ICON BUTTON =============
export function IconButton({
  name,
  onPress,
  label,
  badge,
  variant = 'plain',
}: {
  name: IoniconName;
  onPress: () => void;
  label: string;
  badge?: number;
  variant?: 'plain' | 'filled';
}) {
  const filled = variant === 'filled';
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={label}
      style={[styles.iconButton, filled && { backgroundColor: colors.forest700 }]}
    >
      <Ionicons name={name} size={icon.lg} color={filled ? colors.white : colors.charcoal700} />
      {!!badge && (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============= SECTION (title + grouped card) =============
export function Section({
  title,
  action,
  onAction,
  children,
  flush,
  style,
}: {
  title?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  /** true = no card wrapper (for custom content) */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      {(title || action) && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {action && onAction && (
            <TouchableOpacity onPress={onAction} hitSlop={8}>
              <Text style={styles.link}>{action}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {flush ? children : <View style={styles.group}>{children}</View>}
    </View>
  );
}

// ============= LIST ROW =============
export function ListRow({
  title,
  titleColor,
  subtitle,
  subtitleColor,
  leftIcon,
  leftIconColor = colors.forest700,
  left,
  right,
  onPress,
  first,
  chevron = !!onPress,
  numberOfLines = 1,
}: {
  title: string;
  titleColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  leftIcon?: IoniconName;
  leftIconColor?: string;
  /** custom leading element (e.g. thumbnail, checkbox) */
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  /** first row in a group has no divider */
  first?: boolean;
  chevron?: boolean;
  numberOfLines?: number;
}) {
  const content = (
    <>
      {left ?? (leftIcon ? <Ionicons name={leftIcon} size={icon.md} color={leftIconColor} /> : null)}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, titleColor ? { color: titleColor } : null]} numberOfLines={numberOfLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, subtitleColor ? { color: subtitleColor } : null]} numberOfLines={numberOfLines}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {typeof right === 'string' ? <Text style={styles.rowRight}>{right}</Text> : right}
      {chevron && <Ionicons name="chevron-forward" size={icon.sm} color={colors.charcoal300} />}
    </>
  );
  const style = [styles.row, !first && styles.rowDivider];
  return onPress ? (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={style}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={style}>{content}</View>
  );
}

// ============= KEY / VALUE ROW =============
export function KeyValueRow({ label, value, first, valueColor }: { label: string; value: ReactNode; first?: boolean; valueColor?: string }) {
  return (
    <View style={[styles.kvRow, !first && styles.rowDivider]}>
      <Text style={styles.kvLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[styles.kvValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      ) : (
        <View style={{ flex: 1, alignItems: 'flex-end' }}>{value}</View>
      )}
    </View>
  );
}

// ============= SEGMENTED CONTROL =============
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============= FILTER CHIPS =============
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    // flexGrow/flexShrink 0: a horizontal ScrollView inside a vertical one otherwise collapses to 0 height on native
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity key={o.value} onPress={() => onChange(o.value)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ============= ACTION SHEET =============
export interface SheetAction {
  label: string;
  icon: IoniconName;
  onPress: () => void;
  destructive?: boolean;
}

export function ActionSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  const insets = useSafeAreaInsets();
  return (
    <RNModal visible={open} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}>
          {title && <Text style={styles.sheetTitle}>{title}</Text>}
          {actions.map((a, i) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.sheetRow, (i > 0 || !!title) && styles.rowDivider]}
              onPress={() => {
                onClose();
                // iOS can't present a new modal while this one is still animating out
                setTimeout(a.onPress, Platform.OS === 'ios' ? 350 : 0);
              }}
            >
              <Ionicons name={a.icon} size={icon.md} color={a.destructive ? colors.rust500 : colors.forest700} />
              <Text style={[styles.sheetRowText, a.destructive && { color: colors.rust500 }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.sheetRow, styles.sheetCancel]} onPress={onClose}>
            <Text style={[styles.sheetRowText, { textAlign: 'center', flex: 1, color: colors.charcoal500 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
}

// ============= STICKY BOTTOM BAR =============
export function BottomBar({ children }: { children: ReactNode }) {
  return <View style={styles.bottomBar}>{children}</View>;
}

// ============= STATUS TEXT (coloured dot + label) =============
export function StatusText({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.statusText}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: font.titleLarge,
    fontWeight: weight.bold,
    color: colors.charcoal800,
  },
  subtitle: {
    fontSize: font.body,
    color: colors.charcoal500,
    marginTop: 2,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.rust500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    fontSize: font.label,
    fontWeight: weight.semibold,
    color: colors.white,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  link: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.forest700,
  },
  group: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.charcoal200,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.charcoal200,
  },
  rowTitle: {
    fontSize: font.bodyLarge,
    fontWeight: weight.medium,
    color: colors.charcoal800,
  },
  rowSubtitle: {
    fontSize: font.caption,
    color: colors.charcoal500,
    marginTop: 2,
  },
  rowRight: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.charcoal700,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  kvLabel: {
    fontSize: font.body,
    color: colors.charcoal500,
  },
  kvValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: font.body,
    fontWeight: weight.medium,
    color: colors.charcoal800,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.cream300,
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: font.body,
    fontWeight: weight.medium,
    color: colors.charcoal500,
  },
  segmentTextActive: {
    color: colors.charcoal800,
    fontWeight: weight.semibold,
  },
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sage200,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.forest700,
    borderColor: colors.forest700,
  },
  chipText: {
    fontSize: font.body,
    fontWeight: weight.medium,
    color: colors.forest700,
  },
  chipTextActive: {
    color: colors.white,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 20, 15, 0.5)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  sheetTitle: {
    fontSize: font.caption,
    fontWeight: weight.semibold,
    color: colors.charcoal400,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  sheetRowText: {
    fontSize: font.bodyLarge,
    fontWeight: weight.medium,
    color: colors.charcoal800,
  },
  sheetCancel: {
    borderTopWidth: 6,
    borderTopColor: colors.cream100,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.charcoal200,
  },
  statusText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: font.caption,
    fontWeight: weight.semibold,
  },
});
