import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import { useApp } from '@/store';
import { useTabBarSpace } from '@/components/NativeTabBar';
import { today } from '@/data';
import { Button, EmptyState, Select, Modal, Input } from '@/components/NativeUI';
import { screen, ScreenTitle, IconButton, ChipRow, ActionSheet } from '@/components/Layout';
import type { Animal, Species, Sex } from '@/types';
import { nextAnimalId, earTagTaken, ageLabel } from '@/utils';
import { animalStatusColor } from '@/status';

type SpeciesChip = 'all' | Species;

const PHOTO_SIZE = 116;
type SortKey = 'id' | 'weight' | 'age' | 'earTag' | 'name';

function AnimalCard({ animal, onOpen }: { animal: Animal; onOpen: () => void }) {
  const inactive = animal.status !== 'Active';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onOpen} style={styles.card}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: animal.photo }} style={styles.photo} resizeMode="cover" />
        {inactive && (
          <View style={[styles.statusBadge, { backgroundColor: animalStatusColor[animal.status] }]}>
            <Text style={styles.statusBadgeText}>{animal.status}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {animal.name || animal.id}
        </Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel} numberOfLines={1}>
            {animal.earTag} · {animal.sex}
          </Text>
          <Text style={styles.cardValue}>{animal.breed}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardStrong}>{animal.currentWeight} kg</Text>
          <Text style={styles.cardMeta}>{ageLabel(animal.dateOfBirth)}</Text>
        </View>
        <Button variant="primary" size="sm" fullWidth onPress={onOpen} style={styles.cardButton}>
          View profile
        </Button>
      </View>
    </TouchableOpacity>
  );
}

function ageYears(dob: string) {
  return Math.max(0, (new Date(today).getTime() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export function LivestockScreen() {
  const { animals, navigate, recordBirth } = useApp();
  const tabBarSpace = useTabBarSpace(); // keep content clear of the floating tab bar

  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState<SpeciesChip>('all');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters (in the filter sheet)
  const [breedFilter, setBreedFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [herdFilter, setHerdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('id');

  // Record birth
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthDamId, setBirthDamId] = useState('');
  const [birthSpecies, setBirthSpecies] = useState<Species>('Cattle');
  const [birthSex, setBirthSex] = useState<Sex>('Female');
  const [birthEarTag, setBirthEarTag] = useState('');
  const [birthName, setBirthName] = useState('');
  const [birthWeight, setBirthWeight] = useState('32');
  const [birthColor, setBirthColor] = useState('Red-brown with star on forehead');
  const [birthErrors, setBirthErrors] = useState<Record<string, string>>({});

  const breeds = useMemo(() => [...new Set(animals.map((a) => a.breed))], [animals]);
  const herds = useMemo(() => [...new Set(animals.map((a) => a.herd))], [animals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return animals
      .filter((a) => {
        const matchSearch =
          !q ||
          a.id.toLowerCase().includes(q) ||
          a.earTag.toLowerCase().includes(q) ||
          (a.name || '').toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q);
        const age = ageYears(a.dateOfBirth);
        const matchAge =
          !ageGroupFilter ||
          (ageGroupFilter === 'young' && age < 1) ||
          (ageGroupFilter === 'yearling' && age >= 1 && age < 2) ||
          (ageGroupFilter === 'adult' && age >= 2);
        return (
          matchSearch &&
          matchAge &&
          (species === 'all' || a.species === species) &&
          (!breedFilter || a.breed === breedFilter) &&
          (!sexFilter || a.sex === sexFilter) &&
          (!herdFilter || a.herd === herdFilter) &&
          (!statusFilter || a.status === statusFilter)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'weight') return b.currentWeight - a.currentWeight;
        if (sortBy === 'age') return new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime();
        if (sortBy === 'earTag') return a.earTag.localeCompare(b.earTag);
        if (sortBy === 'name') return (a.name || a.id).localeCompare(b.name || b.id);
        return a.id.localeCompare(b.id);
      });
  }, [animals, search, species, breedFilter, sexFilter, ageGroupFilter, herdFilter, statusFilter, sortBy]);

  const activeCount = animals.filter((a) => a.status === 'Active').length;
  const advancedFilterCount = [breedFilter, sexFilter, ageGroupFilter, herdFilter, statusFilter].filter(Boolean).length;

  const clearAll = () => {
    setBreedFilter('');
    setSexFilter('');
    setAgeGroupFilter('');
    setHerdFilter('');
    setStatusFilter('');
    setSortBy('id');
    setSpecies('all');
    setSearch('');
  };

  const handleSaveBirth = () => {
    const errs: Record<string, string> = {};
    if (!birthDamId) errs.dam = 'Select the mother';
    if (!birthEarTag.trim()) errs.earTag = 'Ear tag is required';
    else if (earTagTaken(animals, birthEarTag)) errs.earTag = 'This ear tag is already in use';
    if (!(Number(birthWeight) > 0)) errs.weight = 'Enter the birth weight';
    setBirthErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newId = nextAnimalId(animals);
    const dam = animals.find((a) => a.id === birthDamId);

    const newAnimal: Animal = {
      id: newId,
      earTag: birthEarTag.trim(),
      name: birthName || 'Newborn',
      species: birthSpecies,
      breed: dam?.breed || (birthSpecies === 'Cattle' ? 'Tuli' : birthSpecies === 'Goats' ? 'Boer' : 'Dorper'),
      sex: birthSex,
      dateOfBirth: today,
      colorMarks: birthColor,
      acquisitionSource: 'Born on Farm',
      acquisitionDate: today,
      herd: dam?.herd || 'Breeding Herd A',
      location: dam?.location || 'Paddock 1 — North Field',
      parentDam: dam?.id,
      parentSire: dam?.breeding?.sireId,
      currentWeight: Number(birthWeight) || 30,
      photo: 'https://images.pexels.com/photos/18170541/pexels-photo-18170541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      status: 'Active',
      weightHistory: [{ date: today, weightKg: Number(birthWeight) || 30 }],
      healthRecords: [],
      breeding: { pregnancyStatus: 'Open', offspring: [] },
      activities: [
        {
          id: `AC${Date.now()}`,
          type: 'Birth',
          description: `Born on farm to Dam ${dam?.name || dam?.id || 'Unknown'}`,
          date: today,
          icon: 'baby',
        },
      ],
    };

    recordBirth(newAnimal);
    setShowBirthModal(false);
    setBirthDamId('');
    setBirthEarTag('');
    setBirthName('');
    navigate('animalProfile', { animalId: newAnimal.id });
  };

  return (
    <ScrollView
      style={[screen.container, styles.page]}
      contentContainerStyle={[screen.content, { paddingBottom: tabBarSpace }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        title="Livestock"
        subtitle={`${activeCount} active · ${animals.length} registered`}
        right={<IconButton name="add" label="Add" variant="filled" onPress={() => setShowAddSheet(true)} />}
      />

      {/* Search + filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={icon.md} color={colors.charcoal400} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, tag or breed"
            placeholderTextColor={colors.charcoal300}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={icon.md} color={colors.charcoal300} />
            </TouchableOpacity>
          )}
        </View>
        <IconButton name="options-outline" label="Filter and sort" badge={advancedFilterCount} onPress={() => setShowFilters(true)} />
      </View>

      <ChipRow<SpeciesChip>
        value={species}
        onChange={setSpecies}
        options={[
          { value: 'all', label: 'All' },
          { value: 'Cattle', label: 'Cattle' },
          { value: 'Goats', label: 'Goats' },
          { value: 'Sheep', label: 'Sheep' },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="paw-outline" size={icon.xl} color={colors.charcoal300} />}
          title="No animals found"
          message="Nothing matches your search or filters."
          action={
            <Button variant="outline" size="sm" onPress={clearAll}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <View style={styles.cardList}>
          {filtered.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} onOpen={() => navigate('animalProfile', { animalId: animal.id })} />
          ))}
        </View>
      )}

      {/* Add menu */}
      <ActionSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        actions={[
          { label: 'Register an animal', icon: 'add-circle-outline', onPress: () => navigate('addAnimal') },
          { label: 'Record a birth', icon: 'heart-outline', onPress: () => setShowBirthModal(true) },
        ]}
      />

      {/* Filter & sort sheet */}
      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter & sort"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={clearAll} style={{ flex: 1 }}>
              Reset
            </Button>
            <Button variant="primary" onPress={() => setShowFilters(false)} style={{ flex: 1 }}>
              {`Show ${filtered.length}`}
            </Button>
          </View>
        }
      >
        <Select
          label="Sort by"
          value={sortBy}
          onSelect={(v) => setSortBy(v as SortKey)}
          options={[
            { value: 'id', label: 'System ID' },
            { value: 'name', label: 'Name (A–Z)' },
            { value: 'earTag', label: 'Ear tag' },
            { value: 'weight', label: 'Weight (heaviest first)' },
            { value: 'age', label: 'Age (youngest first)' },
          ]}
        />
        <Select
          label="Status"
          value={statusFilter}
          onSelect={setStatusFilter}
          placeholder="Any status"
          options={[
            { value: '', label: 'Any status' },
            { value: 'Active', label: 'Active' },
            { value: 'Sold', label: 'Sold' },
            { value: 'Deceased', label: 'Deceased' },
            { value: 'Transferred', label: 'Transferred' },
          ]}
        />
        <Select
          label="Breed"
          value={breedFilter}
          onSelect={setBreedFilter}
          placeholder="Any breed"
          options={[{ value: '', label: 'Any breed' }, ...breeds.map((b) => ({ value: b, label: b }))]}
        />
        <Select
          label="Sex"
          value={sexFilter}
          onSelect={setSexFilter}
          placeholder="Any sex"
          options={[
            { value: '', label: 'Any sex' },
            { value: 'Female', label: 'Female' },
            { value: 'Male', label: 'Male' },
          ]}
        />
        <Select
          label="Age group"
          value={ageGroupFilter}
          onSelect={setAgeGroupFilter}
          placeholder="Any age"
          options={[
            { value: '', label: 'Any age' },
            { value: 'young', label: 'Under 1 year' },
            { value: 'yearling', label: '1–2 years' },
            { value: 'adult', label: '2 years and over' },
          ]}
        />
        <Select
          label="Herd"
          value={herdFilter}
          onSelect={setHerdFilter}
          placeholder="Any herd"
          options={[{ value: '', label: 'Any herd' }, ...herds.map((h) => ({ value: h, label: h }))]}
        />
      </Modal>

      {/* Record Birth */}
      <Modal
        open={showBirthModal}
        onClose={() => setShowBirthModal(false)}
        title="Record a birth"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={() => setShowBirthModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSaveBirth} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        }
      >
        <Select
          label="Species"
          value={birthSpecies}
          onSelect={(v) => {
            setBirthSpecies(v as Species);
            setBirthDamId(''); // dam list is per species
          }}
          options={[
            { value: 'Cattle', label: 'Cattle (calf)' },
            { value: 'Goats', label: 'Goat (kid)' },
            { value: 'Sheep', label: 'Sheep (lamb)' },
          ]}
          required
        />
        <Select
          label="Mother"
          value={birthDamId}
          onSelect={setBirthDamId}
          placeholder="Select from active females"
          options={animals
            .filter((a) => a.sex === 'Female' && a.species === birthSpecies && a.status === 'Active')
            .map((d) => ({ value: d.id, label: `${d.name || d.id} (${d.earTag}) - ${d.breed}` }))}
          required
          error={birthErrors.dam}
        />
        <Input label="Ear tag" value={birthEarTag} onChangeText={setBirthEarTag} placeholder="e.g. CF-028" required error={birthErrors.earTag} />
        <Select
          label="Sex"
          value={birthSex}
          onSelect={(v) => setBirthSex(v as Sex)}
          options={[
            { value: 'Female', label: 'Female' },
            { value: 'Male', label: 'Male' },
          ]}
          required
        />
        <Input
          label="Birth weight (kg)"
          value={birthWeight}
          onChangeText={setBirthWeight}
          keyboardType="numeric"
          placeholder="32"
          required
          error={birthErrors.weight}
        />
        <Input label="Name" value={birthName} onChangeText={setBirthName} placeholder="e.g. Mufaro Jr." optional />
        <Input label="Colour & markings" value={birthColor} onChangeText={setBirthColor} placeholder="e.g. Red-brown with star on forehead" />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.sage50,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sage200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: font.bodyLarge,
    color: colors.charcoal800,
  },
  cardList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 2,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sage100,
    ...Platform.select({
      ios: {
        shadowColor: colors.forest900,
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  // Fixed size: a percentage height here makes iOS/Android size the photo from its own pixels
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.sage100,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: font.label,
    fontWeight: weight.semibold,
    color: colors.white,
  },
  cardBody: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: font.bodyLarge,
    fontWeight: weight.semibold,
    color: colors.forest700,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardLabel: {
    flexShrink: 1,
    fontSize: font.caption,
    color: colors.charcoal500,
  },
  cardValue: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  cardStrong: {
    fontSize: font.bodyLarge,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  cardMeta: {
    fontSize: font.caption,
    color: colors.charcoal500,
  },
  cardButton: {
    marginTop: 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
});
