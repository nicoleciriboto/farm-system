import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import { useApp } from '@/store';
import { ChipRow, ListRow } from '@/components/Layout';

export function NativeNotificationCenter() {
  const { isNotificationsOpen, setIsNotificationsOpen, navigate } = useApp();
  const [filter, setFilter] = useState<'all' | 'urgent' | 'health' | 'inventory'>('all');
  const insets = useSafeAreaInsets();

  const alerts = [
    {
      id: 'ALT001',
      type: 'urgent',
      title: 'Dipping Overdue: Breeding Herd A',
      message: 'Weekly plunge dip (Triatix) is 1 day overdue for 12 cattle. Critical for tick fever prevention.',
      time: '1h ago',
      read: false,
      action: 'health' as const,
    },
    {
      id: 'ALT002',
      type: 'inventory',
      title: 'Low Stock: Tick Grease Concentrate',
      message: 'Only 3.5L left in store. Reorder threshold is 5.0L. Dip tank needs refilling on Friday.',
      time: '3h ago',
      read: false,
      action: 'operations' as const,
    },
    {
      id: 'ALT003',
      type: 'health',
      title: 'Calving Due Soon: Cow Mhondoro (CF-001)',
      message: 'Expected calving date is 28 Oct (16 days away). Sire: Shumba. Move to maternity paddock.',
      time: '5h ago',
      read: false,
      action: 'livestock' as const,
    },
    {
      id: 'ALT004',
      type: 'health',
      title: 'Vaccination Due: Anthrax Booster',
      message: 'Annual booster scheduled for today. 14 head of cattle in Breeding Herd A.',
      time: '8h ago',
      read: true,
      action: 'health' as const,
    },
    {
      id: 'ALT005',
      type: 'inventory',
      title: 'Low Stock: Oxytetracycline 20% LA',
      message: 'Only 2 bottles remaining (100ml each). Used frequently for tick-borne infection therapy.',
      time: '1d ago',
      read: true,
      action: 'operations' as const,
    },
  ];

  if (!isNotificationsOpen) return null;

  const filtered = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return a.type === 'urgent';
    if (filter === 'health') return a.type === 'health';
    if (filter === 'inventory') return a.type === 'inventory';
    return true;
  });

  return (
    <Modal
      visible={isNotificationsOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => setIsNotificationsOpen(false)}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsNotificationsOpen(false)} />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Alerts</Text>
              <Text style={styles.subTitle}>{alerts.filter((a) => !a.read).length} unread</Text>
            </View>
            <TouchableOpacity onPress={() => setIsNotificationsOpen(false)} hitSlop={10} accessibilityLabel="Close alerts">
              <Ionicons name="close" size={icon.lg} color={colors.charcoal500} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <ChipRow
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'health', label: 'Health' },
                { value: 'inventory', label: 'Stock' },
              ]}
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: spacing.md + insets.bottom }}>
            {filtered.map((item, i) => (
              <ListRow
                key={item.id}
                first={i === 0}
                leftIcon={item.type === 'urgent' ? 'alert-circle' : item.type === 'inventory' ? 'cube-outline' : 'medkit-outline'}
                leftIconColor={item.type === 'urgent' ? colors.rust500 : item.type === 'inventory' ? colors.amber600 : colors.forest700}
                title={item.title}
                subtitle={`${item.time} · ${item.message}`}
                numberOfLines={2}
                right={!item.read ? <View style={styles.unread} /> : undefined}
                onPress={() => {
                  setIsNotificationsOpen(false);
                  if (item.action === 'operations') navigate('operationsSection', { operationsTab: 'inventory' });
                  else navigate(item.action);
                }}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 15, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  subTitle: {
    fontSize: font.caption,
    color: colors.charcoal500,
    marginTop: 2,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.charcoal200,
  },
  unread: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest600,
  },
});
