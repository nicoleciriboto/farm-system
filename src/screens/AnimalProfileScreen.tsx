import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import { useApp } from '@/store';
import { today, farmInfo } from '@/data';
import { Button, Modal, Input, Select } from '@/components/NativeUI';
import { screen, Section, ListRow, KeyValueRow, SegmentedControl, StatusText, type IoniconName } from '@/components/Layout';
import type { ActivityEntry, HealthRecord } from '@/types';
import { earTagTaken, formatShortDate, ageLabel } from '@/utils';
import { animalStatusColor } from '@/status';

type Tab = 'overview' | 'health' | 'weight' | 'breeding';

const activityIcon: Record<ActivityEntry['type'], IoniconName> = {
  Birth: 'heart-outline',
  Vaccination: 'eyedrop-outline',
  Weight: 'speedometer-outline',
  Sale: 'pricetag-outline',
  Treatment: 'medkit-outline',
  Transfer: 'swap-horizontal-outline',
  Death: 'close-circle-outline',
  Purchase: 'cart-outline',
};

/** "2026-10-01" → "1 Oct 2026" */
const longDate = (iso: string) => `${formatShortDate(iso)} ${iso.slice(0, 4)}`;

export function AnimalProfileScreen() {
  const { animals, selectedAnimalId, recordWeight, recordTreatment, updateAnimal, navigate, goBack } = useApp();
  const animal = animals.find((a) => a.id === selectedAnimalId) || animals[0];

  const [tab, setTab] = useState<Tab>('overview');

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentType, setTreatmentType] = useState<HealthRecord['type']>('Treatment');
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentProduct, setTreatmentProduct] = useState('');
  const [treatmentDosage, setTreatmentDosage] = useState('');
  const [treatmentOutcome, setTreatmentOutcome] = useState('Normal clinical response');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEarTag, setEditEarTag] = useState('');
  const [editHerd, setEditHerd] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  if (!animal) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ color: colors.charcoal400, fontSize: font.body }}>Animal not found.</Text>
        <Button variant="primary" size="sm" onPress={goBack} style={{ marginTop: spacing.md }}>
          Go back
        </Button>
      </View>
    );
  }

  const openEdit = () => {
    setEditName(animal.name || '');
    setEditEarTag(animal.earTag);
    setEditHerd(animal.herd);
    setEditLocation(animal.location);
    setEditNotes(animal.notes || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveWeight = () => {
    const w = Number(newWeight);
    if (!(w > 0)) return;
    recordWeight(animal.id, w);
    setShowWeightModal(false);
    setNewWeight('');
    setTab('weight');
  };

  const handleSaveTreatment = () => {
    if (!treatmentName.trim()) return;
    recordTreatment(animal.id, {
      type: treatmentType,
      name: treatmentName.trim(),
      product: treatmentProduct,
      dosage: treatmentDosage,
      date: today,
      administeredBy: farmInfo.owner,
      outcome: treatmentOutcome,
    });
    setShowTreatmentModal(false);
    setTreatmentName('');
    setTreatmentProduct('');
    setTreatmentDosage('');
    setTab('health');
  };

  const handleSaveEdit = () => {
    if (!editEarTag.trim()) return setEditError('Ear tag is required');
    if (earTagTaken(animals, editEarTag, animal.id)) return setEditError('Another animal already uses this ear tag');
    updateAnimal(animal.id, {
      name: editName.trim() || undefined,
      earTag: editEarTag.trim(),
      herd: editHerd.trim() || animal.herd,
      location: editLocation.trim() || animal.location,
      notes: editNotes.trim() || undefined,
    });
    setShowEditModal(false);
  };

  const firstWeight = animal.weightHistory[0];
  const totalGain = firstWeight ? animal.currentWeight - firstWeight.weightKg : 0;
  const parentName = (id?: string, fallback?: string) => {
    const p = animals.find((a) => a.id === id);
    return p ? p.name || p.id : fallback || id || 'Not recorded';
  };

  return (
    <ScrollView style={screen.container} contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: animal.photo }} style={styles.photo} resizeMode="cover" />

      <View style={styles.identity}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{animal.name || animal.id}</Text>
          <Text style={styles.meta}>
            {animal.earTag} · {animal.breed} {animal.species.toLowerCase()}
          </Text>
        </View>
        <StatusText label={animal.status} color={animalStatusColor[animal.status]} />
      </View>

      {/* Key stats */}
      <View style={styles.stats}>
        {[
          { label: 'Age', value: ageLabel(animal.dateOfBirth) },
          { label: 'Weight', value: `${animal.currentWeight} kg` },
          { label: 'Sex', value: animal.sex },
        ].map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {animal.status === 'Active' && (
        <View style={styles.actions}>
          <Button
            variant="secondary"
            onPress={() => setShowWeightModal(true)}
            icon={<Ionicons name="speedometer-outline" size={icon.md} color={colors.forest800} />}
            style={{ flex: 1 }}
          >
            Weigh
          </Button>
          <Button
            variant="secondary"
            onPress={() => setShowTreatmentModal(true)}
            icon={<Ionicons name="medkit-outline" size={icon.md} color={colors.forest800} />}
            style={{ flex: 1 }}
          >
            Treat
          </Button>
        </View>
      )}

      <SegmentedControl
        style={{ marginTop: spacing.xl }}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'health', label: 'Health' },
          { value: 'weight', label: 'Weight' },
          { value: 'breeding', label: 'Breeding' },
        ]}
      />

      {tab === 'overview' && (
        <>
          <Section title="Details" action="Edit" onAction={openEdit}>
            <KeyValueRow first label="System ID" value={animal.id} />
            <KeyValueRow label="Born" value={longDate(animal.dateOfBirth)} />
            <KeyValueRow label="Markings" value={animal.colorMarks} />
            <KeyValueRow label="Origin" value={`${animal.acquisitionSource} · ${formatShortDate(animal.acquisitionDate)}`} />
            <KeyValueRow label="Herd" value={animal.herd} />
            <KeyValueRow label="Paddock" value={animal.location} />
            {animal.notes ? <KeyValueRow label="Notes" value={animal.notes} /> : null}
          </Section>

          <Section title="Activity">
            {animal.activities.length === 0 ? (
              <ListRow first title="No activity yet" chevron={false} />
            ) : (
              animal.activities.map((act, i) => (
                <ListRow
                  key={act.id}
                  first={i === 0}
                  leftIcon={activityIcon[act.type] ?? 'ellipse-outline'}
                  title={act.description}
                  subtitle={longDate(act.date)}
                  numberOfLines={2}
                />
              ))
            )}
          </Section>
        </>
      )}

      {tab === 'health' && (
        <Section title="Treatments">
          {animal.healthRecords.length === 0 ? (
            <ListRow first title="No treatments recorded" chevron={false} />
          ) : (
            animal.healthRecords.map((r, i) => (
              <ListRow
                key={r.id}
                first={i === 0}
                leftIcon="medkit-outline"
                title={r.name}
                subtitle={[longDate(r.date), r.product, r.dosage].filter(Boolean).join(' · ')}
                numberOfLines={2}
              />
            ))
          )}
        </Section>
      )}

      {tab === 'weight' && (
        <>
          <Section title="Summary">
            <KeyValueRow first label="Current weight" value={`${animal.currentWeight} kg`} />
            <KeyValueRow
              label="Gain since first weigh-in"
              value={`${totalGain > 0 ? '+' : ''}${totalGain} kg`}
              valueColor={totalGain < 0 ? colors.rust500 : colors.forest700}
            />
          </Section>
          <Section title="Weigh-ins">
            {[...animal.weightHistory].reverse().map((w, i) => (
              <KeyValueRow key={`${w.date}-${i}`} first={i === 0} label={longDate(w.date)} value={`${w.weightKg} kg`} />
            ))}
          </Section>
        </>
      )}

      {tab === 'breeding' && (
        <>
          <Section title="Parents">
            <KeyValueRow first label="Sire" value={parentName(animal.parentSire, animal.breeding?.sireName)} />
            <KeyValueRow label="Dam" value={parentName(animal.parentDam, animal.breeding?.damName)} />
          </Section>

          {animal.sex === 'Female' && (
            <Section title="Reproduction">
              <KeyValueRow first label="Pregnancy" value={animal.breeding?.pregnancyStatus || 'Open'} />
              {animal.breeding?.expectedCalving ? (
                <KeyValueRow label="Expected calving" value={longDate(animal.breeding.expectedCalving)} valueColor={colors.amber700} />
              ) : null}
            </Section>
          )}

          <Section title={`Offspring (${animal.breeding?.offspring?.length || 0})`}>
            {(animal.breeding?.offspring || []).length === 0 ? (
              <ListRow first title="No offspring recorded" chevron={false} />
            ) : (
              animal.breeding.offspring.map((ch, i) => (
                <ListRow
                  key={ch.id}
                  first={i === 0}
                  leftIcon="heart-outline"
                  title={ch.name}
                  subtitle={`Born ${longDate(ch.date)}`}
                  onPress={animals.some((a) => a.id === ch.id) ? () => navigate('animalProfile', { animalId: ch.id }) : undefined}
                />
              ))
            )}
          </Section>
        </>
      )}

      {/* Record Weight */}
      <Modal
        open={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        title="Record weight"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={() => setShowWeightModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSaveWeight} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        }
      >
        <Input
          label="Weight (kg)"
          value={newWeight}
          onChangeText={setNewWeight}
          keyboardType="numeric"
          placeholder={`Last: ${animal.currentWeight} kg`}
          required
        />
      </Modal>

      {/* Record Treatment */}
      <Modal
        open={showTreatmentModal}
        onClose={() => setShowTreatmentModal(false)}
        title="Record treatment"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={() => setShowTreatmentModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSaveTreatment} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        }
      >
        <Select
          label="Category"
          value={treatmentType}
          onSelect={(v) => setTreatmentType(v as HealthRecord['type'])}
          options={[
            { value: 'Dipping', label: 'Dipping' },
            { value: 'Vaccination', label: 'Vaccination' },
            { value: 'Treatment', label: 'Medical treatment' },
            { value: 'Vet Visit', label: 'Vet examination' },
          ]}
          required
        />
        <Input label="Treatment name" value={treatmentName} onChangeText={setTreatmentName} placeholder="e.g. Tick dip, deworming" required />
        <Input label="Product / drug" value={treatmentProduct} onChangeText={setTreatmentProduct} placeholder="e.g. Triatix, Valbazen" />
        <Input label="Dosage" value={treatmentDosage} onChangeText={setTreatmentDosage} placeholder="e.g. 15ml, 2ml SC" />
        <Input label="Outcome" value={treatmentOutcome} onChangeText={setTreatmentOutcome} placeholder="e.g. Good recovery" />
      </Modal>

      {/* Edit */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit animal"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={() => setShowEditModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSaveEdit} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        }
      >
        <Input label="Name" value={editName} onChangeText={setEditName} placeholder="Animal name" optional />
        <Input label="Ear tag" value={editEarTag} onChangeText={setEditEarTag} placeholder="Ear tag" required error={editError || undefined} />
        <Input label="Herd" value={editHerd} onChangeText={setEditHerd} placeholder="Herd group" required />
        <Input label="Paddock" value={editLocation} onChangeText={setEditLocation} placeholder="Paddock location" required />
        <Input label="Notes" value={editNotes} onChangeText={setEditNotes} multiline placeholder="Notes..." optional />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.charcoal100,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  name: {
    fontSize: font.titleLarge,
    fontWeight: weight.bold,
    color: colors.charcoal800,
  },
  meta: {
    fontSize: font.body,
    color: colors.charcoal500,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.charcoal200,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.charcoal200,
  },
  statValue: {
    fontSize: font.bodyLarge,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  statLabel: {
    fontSize: font.caption,
    color: colors.charcoal500,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
