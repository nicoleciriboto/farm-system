import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '@/store';
import { SyncIndicator, ConfirmDialog } from '@/components/NativeUI';
import { screen, Section, ListRow, KeyValueRow } from '@/components/Layout';
import { farmInfo } from '@/data';
import { WorkerForm } from '@/components/WorkerForm';
import type { TeamMember } from '@/types';
import { colors, radius, font, weight } from '@/theme';

function Initials({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View style={[styles.initials, { width: size, height: size }]}>
      <Text style={styles.initialsText}>
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)}
      </Text>
    </View>
  );
}

export function SettingsScreen() {
  const { syncState, setSyncState, triggerSync, pendingChanges, resetData, team } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [workerFormOpen, setWorkerFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const openWorker = (m: TeamMember | null) => {
    setEditing(m);
    setWorkerFormOpen(true);
  };
  const syncing = syncState === 'Syncing';

  return (
    <ScrollView style={screen.container} contentContainerStyle={[screen.content, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
      <Section title="Farm">
        <ListRow first left={<Initials name={farmInfo.name} />} title={farmInfo.name} subtitle={farmInfo.location} />
        <KeyValueRow label="Owner" value={farmInfo.owner} />
        <KeyValueRow label="Established" value={farmInfo.established} />
        <KeyValueRow label="Phone" value={farmInfo.phone} />
      </Section>

      <Section title="Sync">
        <KeyValueRow first label="Status" value={<SyncIndicator state={syncState} />} />
        <KeyValueRow label="Unsynced changes" value={String(pendingChanges)} />
        <ListRow
          leftIcon="sync-outline"
          title="Sync now"
          onPress={syncing ? undefined : triggerSync}
          chevron={false}
          right={syncing ? <ActivityIndicator size="small" color={colors.forest700} /> : undefined}
        />
        <ListRow
          leftIcon="cloud-offline-outline"
          leftIconColor={colors.charcoal500}
          title="Simulate offline / pending"
          subtitle="Demo only — cycles the sync status"
          chevron={false}
          onPress={() => {
            const cycle: (typeof syncState)[] = ['Synced', 'Offline', 'Pending'];
            setSyncState(cycle[(cycle.indexOf(syncState) + 1) % cycle.length]);
          }}
        />
      </Section>

      <Section title="Team" action="Add worker" onAction={() => openWorker(null)}>
        {team.map((m, i) => (
          <ListRow
            key={m.id}
            first={i === 0}
            left={<Initials name={m.name} size={36} />}
            title={m.name}
            subtitle={[m.role, m.phone, m.monthlySalary ? `$${m.monthlySalary}/month` : ''].filter(Boolean).join(' · ')}
            // The owner comes from the farm profile, so only staff are editable here
            onPress={m.role === 'Farm Owner' ? undefined : () => openWorker(m)}
          />
        ))}
      </Section>
      <WorkerForm open={workerFormOpen} onClose={() => setWorkerFormOpen(false)} member={editing} />

      <Section title="Data">
        <ListRow
          first
          leftIcon="trash-outline"
          leftIconColor={colors.rust500}
          title="Reset sample data"
          titleColor={colors.rust500}
          subtitle="Restore all animals, tasks, stock and records"
          chevron={false}
          onPress={() => setShowResetConfirm(true)}
        />
      </Section>

      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false);
          resetData(); // also returns to Home and shows a toast
        }}
        title="Reset all farm data?"
        message="Everything you've recorded on this device will be replaced with the original sample data. This can't be undone."
        confirmLabel="Reset"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  initials: {
    borderRadius: radius.full,
    backgroundColor: colors.forest700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.white,
  },
});
