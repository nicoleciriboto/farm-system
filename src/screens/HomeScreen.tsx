import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import { useApp } from '@/store';
import { useTabBarSpace } from '@/components/NativeTabBar';
import { Button, Modal, Input, Select } from '@/components/NativeUI';
import { Section, ListRow, ChipRow, type IoniconName } from '@/components/Layout';
import { farmInfo, currentDate, expectedCalvings, today } from '@/data';
import type { HealthRecord, Species } from '@/types';
import { formatShortDate, ageLabel } from '@/utils';

interface AttentionItem {
  id: string;
  icon: IoniconName;
  tone: 'danger' | 'warning';
  title: string;
  meta: string;
  onPress: () => void;
}

type HerdChip = 'all' | Species;

const MAX_ATTENTION_ROWS = 4;
const HEADER_GREENS = ['#2E6B47', colors.forest800, '#123824'] as const;
const SYNC_LABEL: Record<string, string> = {
  Synced: 'All records synced',
  Offline: 'Offline',
  Pending: 'Changes pending',
  Syncing: 'Syncing…',
  Failed: 'Sync failed',
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function HomeScreen() {
  const { animals, inventory, healthTasks, navigate, syncState, setIsNotificationsOpen, recordTreatment } = useApp();
  const tabBarSpace = useTabBarSpace(); // keep content clear of the floating tab bar
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.64, 280);

  const [herdChip, setHerdChip] = useState<HerdChip>('all');

  // Quick Treatment Modal
  const [showQuickTreatment, setShowQuickTreatment] = useState(false);
  const [treatmentAnimalId, setTreatmentAnimalId] = useState(animals[0]?.id || '');
  const [treatmentType, setTreatmentType] = useState<HealthRecord['type']>('Dipping');
  const [treatmentName, setTreatmentName] = useState('Tick Dip Application');
  const [treatmentProduct, setTreatmentProduct] = useState('Triatix Pour-on');
  const [treatmentDosage, setTreatmentDosage] = useState('15ml');
  const [treatmentOutcome, setTreatmentOutcome] = useState('Completed without incident');

  const active = animals.filter((a) => a.status === 'Active');
  const speciesCounts = (['Cattle', 'Goats', 'Sheep'] as const).map((s) => ({
    label: s,
    count: active.filter((a) => a.species === s).length,
  }));
  const herd = active.filter((a) => herdChip === 'all' || a.species === herdChip);

  // One prioritised list instead of separate counters + cards
  const attention: AttentionItem[] = [
    ...healthTasks
      .filter((t) => t.status === 'Overdue')
      .map((t): AttentionItem => ({
        id: t.id,
        icon: 'alert-circle',
        tone: 'danger',
        title: t.name,
        meta: `Overdue · ${t.assignedTo}`,
        onPress: () => navigate('healthTaskDetail', { taskId: t.id }),
      })),
    ...healthTasks
      .filter((t) => t.status === 'Due Today')
      .map((t): AttentionItem => ({
        id: t.id,
        icon: 'time-outline',
        tone: 'warning',
        title: t.name,
        meta: `Due today · ${t.assignedTo}`,
        onPress: () => navigate('healthTaskDetail', { taskId: t.id }),
      })),
    ...inventory
      .filter((i) => i.quantity <= i.reorderThreshold)
      .map((i): AttentionItem => ({
        id: i.id,
        icon: 'cube-outline',
        tone: 'warning',
        title: `${i.name} running low`,
        meta: `${i.quantity} ${i.unit} left · reorder at ${i.reorderThreshold}`,
        onPress: () => navigate('operationsSection', { operationsTab: 'inventory' }),
      })),
  ];

  const handleSaveTreatment = () => {
    if (!treatmentAnimalId || !treatmentName.trim()) return;
    recordTreatment(treatmentAnimalId, {
      type: treatmentType,
      name: treatmentName.trim(),
      product: treatmentProduct,
      dosage: treatmentDosage,
      date: today,
      administeredBy: farmInfo.owner,
      outcome: treatmentOutcome,
    });
    setShowQuickTreatment(false);
  };

  const firstName = farmInfo.owner.split(' ')[0];
  const initials = farmInfo.owner
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: tabBarSpace }} showsVerticalScrollIndicator={false}>
      {/* ===== Green header (runs up behind the status bar) ===== */}
      <LinearGradient colors={HEADER_GREENS} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {/* Fills the iOS pull-down bounce area so it stays green */}
        <View style={styles.bounceFill} />

        <View style={styles.greetingRow}>
          <TouchableOpacity onPress={() => navigate('settings')} style={styles.avatar} accessibilityLabel="Settings">
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello} numberOfLines={1}>
              {greeting()}, {firstName} · {farmInfo.name}
            </Text>
            <Text style={styles.welcome}>Welcome back!</Text>
          </View>
          <TouchableOpacity onPress={() => setIsNotificationsOpen(true)} style={styles.bell} accessibilityLabel="Alerts">
            <Ionicons name="notifications" size={icon.md} color={colors.white} />
            {attention.length > 0 && <View style={styles.bellDot} />}
          </TouchableOpacity>
        </View>

        {/* Herd summary card */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigate('livestock')} style={styles.summary}>
          <Ionicons name="paw" size={72} color="rgba(255,255,255,0.10)" style={styles.summaryWatermark} />

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={icon.sm} color={colors.white} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {farmInfo.location}
            </Text>
          </View>

          <View style={styles.summaryMain}>
            <View style={styles.countRow}>
              <Text style={styles.count}>{active.length}</Text>
              <Text style={styles.countUnit}>active{'\n'}animals</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryMeta}>{SYNC_LABEL[syncState] ?? syncState}</Text>
              <Text style={styles.summaryDate}>{currentDate}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {speciesCounts.map((s, i) => (
              <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.count}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigate('addAnimal')}>
            <Ionicons name="add" size={icon.md} color={colors.white} />
            <Text style={styles.actionText}>Add animal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowQuickTreatment(true)}>
            <Ionicons name="medkit-outline" size={icon.md} color={colors.white} />
            <Text style={styles.actionText}>Record treatment</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ===== My herd carousel ===== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My herd</Text>
          <TouchableOpacity onPress={() => navigate('livestock')} hitSlop={8}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>
        <ChipRow<HerdChip>
          value={herdChip}
          onChange={setHerdChip}
          options={[
            { value: 'all', label: 'All' },
            { value: 'Cattle', label: 'Cattle' },
            { value: 'Goats', label: 'Goats' },
            { value: 'Sheep', label: 'Sheep' },
          ]}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + spacing.md}
          decelerationRate="fast"
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {herd.map((a) => (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.9}
              onPress={() => navigate('animalProfile', { animalId: a.id })}
              style={[styles.herdCard, { width: cardWidth }]}
            >
              <View style={styles.herdPhotoWrap}>
                <Image source={{ uri: a.photo }} style={styles.herdPhoto} resizeMode="cover" />
                <View style={styles.weightPill}>
                  <Text style={styles.weightText}>{a.currentWeight} kg</Text>
                </View>
              </View>
              <Text style={styles.herdName} numberOfLines={1}>
                {a.name || a.id}
              </Text>
              <Text style={styles.herdMeta} numberOfLines={2}>
                {a.breed} {a.sex.toLowerCase()} · {ageLabel(a.dateOfBirth)} · {a.herd}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ===== Needs attention ===== */}
        <Section title="Needs attention" action="See all" onAction={() => navigate('health')}>
          {attention.length === 0 ? (
            <ListRow first leftIcon="checkmark-circle" leftIconColor={colors.forest600} title="All caught up" chevron={false} />
          ) : (
            attention.slice(0, MAX_ATTENTION_ROWS).map((item, i) => {
              const tint = item.tone === 'danger' ? colors.rust500 : colors.amber600;
              return (
                <ListRow
                  key={item.id}
                  first={i === 0}
                  leftIcon={item.icon}
                  leftIconColor={tint}
                  title={item.title}
                  subtitle={item.meta}
                  subtitleColor={tint}
                  onPress={item.onPress}
                />
              );
            })
          )}
          {attention.length > MAX_ATTENTION_ROWS && (
            <ListRow title={`${attention.length - MAX_ATTENTION_ROWS} more`} titleColor={colors.forest700} onPress={() => navigate('health')} />
          )}
        </Section>

        {/* ===== Upcoming calvings ===== */}
        <Section title="Upcoming calvings">
          {expectedCalvings.map((c, i) => (
            <ListRow
              key={c.id}
              first={i === 0}
              leftIcon="calendar-outline"
              title={c.animalName}
              subtitle={`Due ${formatShortDate(c.dueDate)} · Sire ${c.sire}`}
              right={`${c.daysAway} days`}
              onPress={() => navigate('animalProfile', { animalId: c.animalId })}
            />
          ))}
        </Section>
      </View>

      {/* Quick Treatment Modal */}
      <Modal
        open={showQuickTreatment}
        onClose={() => setShowQuickTreatment(false)}
        title="Record Treatment"
        footer={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="outline" onPress={() => setShowQuickTreatment(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSaveTreatment} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        }
      >
        <Select
          label="Animal"
          value={treatmentAnimalId}
          onSelect={setTreatmentAnimalId}
          options={animals.map((a) => ({
            value: a.id,
            label: `${a.name || a.id} (${a.earTag}) - ${a.species}`,
          }))}
          required
        />

        <Select
          label="Treatment Category"
          value={treatmentType}
          onSelect={(v) => setTreatmentType(v as HealthRecord['type'])}
          options={[
            { value: 'Dipping', label: 'Dipping / Pour-on' },
            { value: 'Vaccination', label: 'Vaccination' },
            { value: 'Treatment', label: 'Clinical Treatment / Deworming' },
            { value: 'Vet Visit', label: 'Veterinary Examination' },
          ]}
          required
        />

        <Input
          label="Treatment / Disease Name"
          value={treatmentName}
          onChangeText={setTreatmentName}
          placeholder="e.g. Tick Dip, Deworming"
          required
        />

        <Input
          label="Medication / Product"
          value={treatmentProduct}
          onChangeText={setTreatmentProduct}
          placeholder="e.g. Triatix, Valbazen"
        />

        <Input
          label="Dosage Administered"
          value={treatmentDosage}
          onChangeText={setTreatmentDosage}
          placeholder="e.g. 15ml PO, 2ml SC"
        />

        <Input
          label="Clinical Notes / Outcome"
          value={treatmentOutcome}
          onChangeText={setTreatmentOutcome}
          placeholder="e.g. Completed without incident"
        />
      </Modal>
    </ScrollView>
  );
}

const WHITE_70 = 'rgba(255,255,255,0.72)';
const GLASS = 'rgba(255,255,255,0.09)';
const GLASS_BORDER = 'rgba(255,255,255,0.14)';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.cream100,
  },
  // ---- header ----
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  bounceFill: {
    position: 'absolute',
    top: -600,
    left: 0,
    right: 0,
    height: 600,
    backgroundColor: HEADER_GREENS[0],
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.forest100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: font.body,
    fontWeight: weight.bold,
    color: colors.forest800,
  },
  hello: {
    fontSize: font.caption,
    color: WHITE_70,
  },
  welcome: {
    fontSize: font.titleLarge,
    fontWeight: weight.semibold,
    color: colors.white,
    marginTop: 1,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber400,
  },
  summary: {
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    borderRadius: 24,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  summaryWatermark: {
    position: 'absolute',
    top: 6,
    right: 10,
    transform: [{ rotate: '-18deg' }],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: 36,
  },
  locationIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: GLASS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flexShrink: 1,
    fontSize: font.body,
    color: colors.white,
  },
  summaryMain: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  count: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: weight.semibold,
    color: colors.white,
  },
  countUnit: {
    fontSize: font.caption,
    lineHeight: 15,
    color: WHITE_70,
    marginBottom: 8,
  },
  summaryMeta: {
    fontSize: font.caption,
    color: WHITE_70,
  },
  summaryDate: {
    fontSize: font.body,
    fontWeight: weight.medium,
    color: colors.white,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GLASS_BORDER,
  },
  stat: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: GLASS_BORDER,
  },
  statLabel: {
    fontSize: font.caption,
    color: WHITE_70,
  },
  statValue: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.white,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.white,
  },
  // ---- body ----
  body: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: font.titleLarge,
    fontWeight: weight.bold,
    color: colors.charcoal800,
  },
  link: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.forest700,
  },
  carousel: {
    // bleed to the screen edges; flexGrow/Shrink 0 stops native from collapsing it
    marginHorizontal: -spacing.lg,
    marginTop: spacing.md,
    flexGrow: 0,
    flexShrink: 0,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  herdCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.sm,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.sage100,
  },
  herdPhotoWrap: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.sage100,
  },
  herdPhoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  weightPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(16, 20, 15, 0.55)',
  },
  weightText: {
    fontSize: font.caption,
    fontWeight: weight.semibold,
    color: colors.white,
  },
  herdName: {
    fontSize: font.title,
    fontWeight: weight.bold,
    color: colors.charcoal800,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  herdMeta: {
    fontSize: font.body,
    lineHeight: 19,
    color: colors.charcoal500,
    marginTop: 4,
    paddingHorizontal: spacing.xs,
  },
});
