import React, { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import { useApp } from '@/store';
import { today } from '@/data';
import { Button, Input, Select } from '@/components/NativeUI';
import { screen, Section, KeyValueRow, SegmentedControl, BottomBar } from '@/components/Layout';
import type { Animal, Species, Sex } from '@/types';
import { nextAnimalId, earTagTaken, isIsoDate } from '@/utils';
import { pickAnimalPhoto, type PhotoSource } from '@/photos';

const presetPhotos: Record<Species, string[]> = {
  Cattle: [
    'https://images.pexels.com/photos/123014/pexels-photo-123014.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/18784702/pexels-photo-18784702.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/28703745/pexels-photo-28703745.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ],
  Goats: [
    'https://images.pexels.com/photos/34565448/pexels-photo-34565448.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/34192054/pexels-photo-34192054.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ],
  Sheep: [
    'https://images.pexels.com/photos/34919072/pexels-photo-34919072.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/17827025/pexels-photo-17827025.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ],
};

const STEPS = ['Identification', 'Origin & location', 'Details', 'Review'];
const NEW = '__new__'; // Select value for "create a new herd / paddock"
const DEFAULT_BREED: Record<Species, string> = { Cattle: 'Tuli', Goats: 'Boer', Sheep: 'Dorper' };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function AddAnimalScreen() {
  const { animals, addAnimal, navigate } = useApp();

  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [savedAnimalId, setSavedAnimalId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  // Form State
  const [animalId, setAnimalId] = useState(() => nextAnimalId(animals));
  const [earTag, setEarTag] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Cattle');
  const [breed, setBreed] = useState('Tuli');
  const [sex, setSex] = useState<Sex>('Female');
  const [dob, setDob] = useState('2024-06-15');
  const [colorMarks, setColorMarks] = useState('Red-brown with white face');
  const [acquisitionSource, setAcquisitionSource] = useState<'Born on Farm' | 'Purchased'>('Born on Farm');
  const [acquisitionDate, setAcquisitionDate] = useState('2024-06-15');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [herd, setHerd] = useState('Breeding Herd A');
  const [location, setLocation] = useState('Paddock 1 — North Field');
  const [newHerd, setNewHerd] = useState(false);
  const [newLocation, setNewLocation] = useState(false);
  const [parentSire, setParentSire] = useState('');
  const [parentDam, setParentDam] = useState('');
  const [initialWeight, setInitialWeight] = useState('320');
  const [photo, setPhoto] = useState(presetPhotos.Cattle[0]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const isOwnPhoto = !Object.values(presetPhotos).flat().includes(photo);

  const handlePickPhoto = async (source: PhotoSource) => {
    setPhotoBusy(true);
    const uri = await pickAnimalPhoto(source);
    setPhotoBusy(false);
    if (uri) setPhoto(uri);
  };
  const [notes, setNotes] = useState('');

  const sires = useMemo(() => animals.filter((a) => a.sex === 'Male' && a.species === species), [animals, species]);
  const dams = useMemo(() => animals.filter((a) => a.sex === 'Female' && a.species === species), [animals, species]);
  const herds = useMemo(() => [...new Set(animals.map((a) => a.herd))], [animals]);
  const locations = useMemo(() => [...new Set(animals.map((a) => a.location))], [animals]);

  const handleSpeciesChange = (s: Species) => {
    setSpecies(s);
    setBreed(DEFAULT_BREED[s]);
    if (!isOwnPhoto) setPhoto(presetPhotos[s][0]); // keep a photo the user took or chose
    setParentSire('');
    setParentDam('');
  };

  const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: '' }));

  const validate = (currentStep: number) => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!earTag.trim()) errs.earTag = 'Ear tag is required';
      else if (earTagTaken(animals, earTag)) errs.earTag = 'This ear tag is already registered';
      if (!breed.trim()) errs.breed = 'Breed is required';
      if (!dob) errs.dob = 'Date of birth is required';
      else if (!isIsoDate(dob)) errs.dob = 'Use the format YYYY-MM-DD';
    } else if (currentStep === 2) {
      if (acquisitionSource === 'Purchased' && !(Number(purchasePrice) > 0)) errs.purchasePrice = 'Enter the purchase price';
      if (!isIsoDate(acquisitionDate)) errs.acquisitionDate = 'Use the format YYYY-MM-DD';
      if (!herd.trim()) errs.herd = 'Herd is required';
      if (!location.trim()) errs.location = 'Paddock is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goTo = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleSave = (addAnother: boolean) => {
    const newAnimal: Animal = {
      id: animalId,
      earTag: earTag.trim() || `CF-${animalId}`,
      name: name.trim() || undefined,
      species,
      breed: breed.trim(),
      sex,
      dateOfBirth: dob,
      colorMarks: colorMarks.trim() || 'Not specified',
      acquisitionSource,
      acquisitionDate,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      herd: herd.trim() || 'Unassigned Herd',
      location: location.trim() || 'Unassigned Location',
      parentSire: parentSire || undefined,
      parentDam: parentDam || undefined,
      currentWeight: Number(initialWeight) || 0,
      photo,
      status: 'Active',
      notes: notes.trim() || undefined,
      weightHistory: Number(initialWeight) > 0 ? [{ date: today, weightKg: Number(initialWeight) }] : [],
      healthRecords: [],
      breeding: { pregnancyStatus: sex === 'Female' ? 'Open' : 'Not Applicable', offspring: [] },
      activities: [
        {
          id: `AC${Date.now()}`,
          type: acquisitionSource === 'Born on Farm' ? 'Birth' : 'Purchase',
          description: `Registered on farm (${acquisitionSource})`,
          date: today,
          icon: acquisitionSource === 'Born on Farm' ? 'baby' : 'tag',
        },
      ],
      pendingSync: true,
    };

    addAnimal(newAnimal);
    setSavedAnimalId(newAnimal.id);
    setSaved(true);

    if (addAnother) {
      resetTimer.current = setTimeout(() => {
        setSaved(false);
        setStep(1);
        setAnimalId(nextAnimalId([newAnimal, ...animals]));
        setEarTag('');
        setName('');
        setPurchasePrice('');
        setInitialWeight('');
        setNotes('');
        setErrors({});
      }, 1200);
    }
  };

  if (saved) {
    return (
      <View style={styles.success}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={icon.xl} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Animal registered</Text>
        <Text style={styles.successSub}>
          {name || animalId} ({earTag}) has been added to your herd.
        </Text>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xxl }}>
          <Button variant="primary" fullWidth onPress={() => navigate('animalProfile', { animalId: savedAnimalId, replace: true })}>
            View profile
          </Button>
          <Button variant="outline" fullWidth onPress={() => navigate('livestock')}>
            Back to livestock
          </Button>
        </View>
      </View>
    );
  }

  const parentLabel = (id: string) => {
    const p = animals.find((a) => a.id === id);
    return p ? `${p.name || p.id} (${p.earTag})` : 'Unknown';
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scrollRef} style={screen.container} contentContainerStyle={screen.content} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <Text style={styles.stepCaption}>
          Step {step} of {STEPS.length}
        </Text>
        <Text style={styles.stepTitle}>{STEPS[step - 1]}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / STEPS.length) * 100}%` }]} />
        </View>

        {step === 1 && (
          <>
            <Field label="Species">
              <SegmentedControl<Species>
                value={species}
                onChange={handleSpeciesChange}
                options={[
                  { value: 'Cattle', label: 'Cattle' },
                  { value: 'Goats', label: 'Goats' },
                  { value: 'Sheep', label: 'Sheep' },
                ]}
              />
            </Field>
            <Field label="Sex">
              <SegmentedControl<Sex>
                value={sex}
                onChange={setSex}
                options={[
                  { value: 'Female', label: 'Female' },
                  { value: 'Male', label: 'Male' },
                ]}
              />
            </Field>
            <Input
              label="Ear tag"
              value={earTag}
              onChangeText={(v) => {
                setEarTag(v);
                clearError('earTag');
              }}
              placeholder="e.g. CF-026"
              required
              error={errors.earTag}
            />
            <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Mhondoro" optional />
            <Input
              label="Breed"
              value={breed}
              onChangeText={(v) => {
                setBreed(v);
                clearError('breed');
              }}
              placeholder="e.g. Tuli, Mashona, Boer, Dorper"
              required
              error={errors.breed}
            />
            <Input
              label="Date of birth"
              value={dob}
              onChangeText={(v) => {
                setDob(v);
                clearError('dob');
              }}
              placeholder="YYYY-MM-DD"
              required
              error={errors.dob}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Origin">
              <SegmentedControl<'Born on Farm' | 'Purchased'>
                value={acquisitionSource}
                onChange={setAcquisitionSource}
                options={[
                  { value: 'Born on Farm', label: 'Born on farm' },
                  { value: 'Purchased', label: 'Purchased' },
                ]}
              />
            </Field>
            <Input
              label={acquisitionSource === 'Purchased' ? 'Purchase date' : 'Date registered'}
              value={acquisitionDate}
              onChangeText={setAcquisitionDate}
              placeholder="YYYY-MM-DD"
              required
              error={errors.acquisitionDate}
            />
            {acquisitionSource === 'Purchased' && (
              <Input
                label="Purchase price (USD)"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="numeric"
                placeholder="e.g. 500"
                required
                error={errors.purchasePrice}
              />
            )}
            <Select
              label="Herd"
              value={newHerd ? NEW : herd}
              onSelect={(v) => {
                setNewHerd(v === NEW);
                setHerd(v === NEW ? '' : v);
                clearError('herd');
              }}
              options={[...herds.map((h) => ({ value: h, label: h })), { value: NEW, label: '+ New herd…' }]}
              required
              error={newHerd ? undefined : errors.herd}
            />
            {newHerd && (
              <Input
                label="New herd name"
                value={herd}
                onChangeText={(v) => {
                  setHerd(v);
                  clearError('herd');
                }}
                placeholder="e.g. Heifer Group"
                required
                error={errors.herd}
              />
            )}
            <Select
              label="Paddock"
              value={newLocation ? NEW : location}
              onSelect={(v) => {
                setNewLocation(v === NEW);
                setLocation(v === NEW ? '' : v);
                clearError('location');
              }}
              options={[...locations.map((l) => ({ value: l, label: l })), { value: NEW, label: '+ New paddock…' }]}
              required
              error={newLocation ? undefined : errors.location}
            />
            {newLocation && (
              <Input
                label="New paddock name"
                value={location}
                onChangeText={(v) => {
                  setLocation(v);
                  clearError('location');
                }}
                placeholder="e.g. Paddock 4 — River Camp"
                required
                error={errors.location}
              />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Photo">
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photoPreviewImg} resizeMode="cover" />
                {photoBusy && (
                  <View style={styles.photoBusy}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                )}
              </View>
              <View style={styles.photoActions}>
                <Button
                  variant="secondary"
                  disabled={photoBusy}
                  onPress={() => handlePickPhoto('camera')}
                  icon={<Ionicons name="camera-outline" size={icon.md} color={colors.forest800} />}
                  style={{ flex: 1 }}
                >
                  Take photo
                </Button>
                <Button
                  variant="secondary"
                  disabled={photoBusy}
                  onPress={() => handlePickPhoto('library')}
                  icon={<Ionicons name="images-outline" size={icon.md} color={colors.forest800} />}
                  style={{ flex: 1 }}
                >
                  Gallery
                </Button>
              </View>
              <Text style={styles.sampleCaption}>Or use a sample photo</Text>
              <View style={styles.photoRow}>
                {presetPhotos[species].map((url) => (
                  <TouchableOpacity
                    key={url}
                    onPress={() => setPhoto(url)}
                    style={[styles.photoOption, photo === url && styles.photoSelected]}
                    accessibilityLabel="Use sample photo"
                  >
                    <Image source={{ uri: url }} style={styles.photoImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
            <Input label="Weight (kg)" value={initialWeight} onChangeText={setInitialWeight} keyboardType="numeric" placeholder="e.g. 320" optional />
            <Input label="Colour & markings" value={colorMarks} onChangeText={setColorMarks} placeholder="e.g. Red-brown with white patch" optional />
            <Select
              label="Sire (father)"
              value={parentSire}
              onSelect={setParentSire}
              placeholder="Unknown"
              options={[{ value: '', label: 'Unknown' }, ...sires.map((s) => ({ value: s.id, label: `${s.name || s.id} (${s.earTag})` }))]}
            />
            <Select
              label="Dam (mother)"
              value={parentDam}
              onSelect={setParentDam}
              placeholder="Unknown"
              options={[{ value: '', label: 'Unknown' }, ...dams.map((d) => ({ value: d.id, label: `${d.name || d.id} (${d.earTag})` }))]}
            />
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Health history, temperament…" optional />
          </>
        )}

        {step === 4 && (
          <>
            <View style={styles.reviewHeader}>
              <Image source={{ uri: photo }} style={styles.reviewPhoto} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{name || animalId}</Text>
                <Text style={styles.reviewMeta}>
                  {earTag} · {breed} · {sex}
                </Text>
              </View>
            </View>
            <Section title="Summary" style={{ marginTop: spacing.lg }}>
              <KeyValueRow first label="System ID" value={animalId} />
              <KeyValueRow label="Born" value={dob} />
              <KeyValueRow label="Origin" value={acquisitionSource === 'Purchased' ? `Purchased · $${purchasePrice}` : 'Born on farm'} />
              <KeyValueRow label="Herd" value={herd} />
              <KeyValueRow label="Paddock" value={location} />
              <KeyValueRow label="Weight" value={initialWeight ? `${initialWeight} kg` : '—'} />
              <KeyValueRow label="Sire" value={parentSire ? parentLabel(parentSire) : 'Unknown'} />
              <KeyValueRow label="Dam" value={parentDam ? parentLabel(parentDam) : 'Unknown'} />
            </Section>
            <TouchableOpacity onPress={() => handleSave(true)} style={styles.addAnother}>
              <Text style={styles.addAnotherText}>Save and add another</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <BottomBar>
        {step > 1 && (
          <Button variant="outline" onPress={() => goTo(step - 1)} style={{ flex: 1 }}>
            Back
          </Button>
        )}
        {step < STEPS.length ? (
          <Button variant="primary" onPress={() => validate(step) && goTo(step + 1)} style={{ flex: 2 }}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onPress={() => handleSave(false)} style={{ flex: 2 }}>
            Save animal
          </Button>
        )}
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  stepCaption: {
    fontSize: font.caption,
    fontWeight: weight.semibold,
    color: colors.charcoal500,
  },
  stepTitle: {
    fontSize: font.titleLarge,
    fontWeight: weight.bold,
    color: colors.charcoal800,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.charcoal100,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.forest700,
  },
  fieldLabel: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.charcoal700,
    marginBottom: spacing.sm,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.charcoal100,
  },
  photoPreviewImg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  photoBusy: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 20, 15, 0.35)',
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sampleCaption: {
    fontSize: font.caption,
    color: colors.charcoal500,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  photoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoOption: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  photoSelected: {
    borderColor: colors.forest700,
  },
  photoImg: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.charcoal100,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reviewPhoto: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.charcoal100,
  },
  reviewName: {
    fontSize: font.title,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  reviewMeta: {
    fontSize: font.body,
    color: colors.charcoal500,
    marginTop: 2,
  },
  addAnother: {
    alignSelf: 'center',
    paddingVertical: spacing.lg,
  },
  addAnotherText: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.forest700,
  },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.cream100,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.forest600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: font.titleLarge,
    fontWeight: weight.bold,
    color: colors.charcoal800,
  },
  successSub: {
    fontSize: font.body,
    color: colors.charcoal500,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
