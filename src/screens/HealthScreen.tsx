import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, font, weight, icon } from '@/theme';
import { useApp } from '@/store';
import { useTabBarSpace } from '@/components/NativeTabBar';
import { today } from '@/data';
import { Button, Select, Modal, Input, EmptyState, ConfirmDialog } from '@/components/NativeUI';
import {
  screen,
  ScreenTitle,
  IconButton,
  Section,
  ListRow,
  KeyValueRow,
  SegmentedControl,
  BottomBar,
  StatusText,
} from '@/components/Layout';
import type { HealthTask, TaskStatus } from '@/types';
import { formatShortDate, isIsoDate } from '@/utils';
import { taskStatusColor, taskTypeIcon } from '@/status';

const STATUS_ORDER: TaskStatus[] = ['Overdue', 'Due Today', 'Upcoming', 'Completed'];
const SECTION_TITLES: Record<TaskStatus, string> = {
  Overdue: 'Overdue',
  'Due Today': 'Due today',
  Upcoming: 'Upcoming',
  Completed: 'Completed',
};

function TaskRow({ task, first, onPress }: { task: HealthTask; first: boolean; onPress: () => void }) {
  return (
    <ListRow
      first={first}
      onPress={onPress}
      leftIcon={taskTypeIcon[task.type]}
      leftIconColor={taskStatusColor[task.status]}
      title={task.name}
      subtitle={`${formatShortDate(task.scheduledDate)} · ${task.assignedTo}`}
      right={task.priority === 'High' && task.status !== 'Completed' ? <StatusText label="High" color={colors.rust500} /> : undefined}
    />
  );
}

export function HealthScreen() {
  const { healthTasks, navigate } = useApp();
  const tabBarSpace = useTabBarSpace(); // keep content clear of the floating tab bar
  const [view, setView] = useState<'tasks' | 'calendar'>('tasks');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  const workers = useMemo(() => [...new Set(healthTasks.map((t) => t.assignedTo))], [healthTasks]);
  const filtered = useMemo(
    () => healthTasks.filter((t) => (!typeFilter || t.type === typeFilter) && (!assignedFilter || t.assignedTo === assignedFilter)),
    [healthTasks, typeFilter, assignedFilter],
  );

  const count = (s: TaskStatus) => filtered.filter((t) => t.status === s).length;
  const openTask = (id: string) => navigate('healthTaskDetail', { taskId: id });

  return (
    <ScrollView style={screen.container} contentContainerStyle={[screen.content, { paddingBottom: tabBarSpace }]} showsVerticalScrollIndicator={false}>
      <ScreenTitle
        title="Health"
        subtitle={`${count('Overdue')} overdue · ${count('Due Today')} due today · ${count('Upcoming')} upcoming`}
        right={
          <>
            <IconButton
              name="options-outline"
              label="Filter tasks"
              badge={[typeFilter, assignedFilter].filter(Boolean).length}
              onPress={() => setShowFilters(true)}
            />
            <IconButton name="add" label="New task" variant="filled" onPress={() => setShowNewTask(true)} />
          </>
        }
      />

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: 'tasks', label: 'Tasks' },
          { value: 'calendar', label: 'Calendar' },
        ]}
      />

      {view === 'tasks' ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="medkit-outline" size={icon.xl} color={colors.charcoal300} />}
            title="No tasks"
            message="No health tasks match the current filters."
          />
        ) : (
          STATUS_ORDER.map((status) => {
            const tasks = filtered.filter((t) => t.status === status);
            if (tasks.length === 0) return null;
            return (
              <Section key={status} title={SECTION_TITLES[status]}>
                {tasks.map((t, i) => (
                  <TaskRow key={t.id} task={t} first={i === 0} onPress={() => openTask(t.id)} />
                ))}
              </Section>
            );
          })
        )
      ) : (
        <CalendarView tasks={filtered} onOpenTask={openTask} />
      )}

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter tasks"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              variant="outline"
              onPress={() => {
                setTypeFilter('');
                setAssignedFilter('');
              }}
              style={{ flex: 1 }}
            >
              Reset
            </Button>
            <Button variant="primary" onPress={() => setShowFilters(false)} style={{ flex: 1 }}>
              Done
            </Button>
          </View>
        }
      >
        <Select
          label="Type"
          value={typeFilter}
          onSelect={setTypeFilter}
          placeholder="All types"
          options={[
            { value: '', label: 'All types' },
            { value: 'Dipping', label: 'Dipping' },
            { value: 'Vaccination', label: 'Vaccination' },
            { value: 'Treatment', label: 'Treatment' },
            { value: 'Vet Visit', label: 'Vet visit' },
          ]}
        />
        <Select
          label="Assigned to"
          value={assignedFilter}
          onSelect={setAssignedFilter}
          placeholder="Anyone"
          options={[{ value: '', label: 'Anyone' }, ...workers.map((w) => ({ value: w, label: w }))]}
        />
      </Modal>

      <NewTaskForm open={showNewTask} onClose={() => setShowNewTask(false)} />
    </ScrollView>
  );
}

// ---------- New task form ----------
function NewTaskForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addHealthTask, team, animals } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<HealthTask['type']>('Vaccination');
  const [date, setDate] = useState(today);
  const [assignedTo, setAssignedTo] = useState('');
  const [target, setTarget] = useState('All animals');
  const [priority, setPriority] = useState<HealthTask['priority']>('Medium');
  const [recurring, setRecurring] = useState('no');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const active = animals.filter((a) => a.status === 'Active');
  const herds = [...new Set(active.map((a) => a.herd))];
  // "Applies to" choices, each with the number of active animals it covers
  const targets = [
    { value: 'All animals', count: active.length },
    ...(['Cattle', 'Goats', 'Sheep'] as const).map((s) => ({ value: `All ${s}`, count: active.filter((a) => a.species === s).length })),
    ...herds.map((h) => ({ value: h, count: active.filter((a) => a.herd === h).length })),
  ].filter((t) => t.count > 0);

  useEffect(() => {
    if (!open) return;
    setName('');
    setType('Vaccination');
    setDate(today);
    setAssignedTo(team.find((m) => m.role === 'Farm Manager')?.name ?? team[0]?.name ?? '');
    setTarget('All animals');
    setPriority('Medium');
    setRecurring('no');
    setNotes('');
    setErrors({});
  }, [open, team]);

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Describe the task, e.g. Anthrax vaccination';
    if (!isIsoDate(date)) errs.date = 'Use the format YYYY-MM-DD';
    if (!assignedTo) errs.assigned = 'Choose who will do it';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const count = targets.find((t) => t.value === target)?.count ?? 0;
    addHealthTask({
      name: name.trim(),
      type,
      scheduledDate: date,
      assignedTo,
      herdOrAnimals: `${target} (${count} ${count === 1 ? 'animal' : 'animals'})`,
      priority,
      recurring: recurring === 'yes',
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New health task"
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>
            Add task
          </Button>
        </View>
      }
    >
      <Input label="Task" value={name} onChangeText={setName} placeholder="e.g. Anthrax vaccination" required error={errors.name} />
      <Select
        label="Type"
        value={type}
        onSelect={(v) => setType(v as HealthTask['type'])}
        options={[
          { value: 'Vaccination', label: 'Vaccination' },
          { value: 'Dipping', label: 'Dipping' },
          { value: 'Treatment', label: 'Treatment / deworming' },
          { value: 'Vet Visit', label: 'Vet visit' },
        ]}
        required
      />
      <Input label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" required error={errors.date} />
      <Select
        label="Applies to"
        value={target}
        onSelect={setTarget}
        options={targets.map((t) => ({ value: t.value, label: `${t.value} (${t.count})` }))}
        required
      />
      <Select
        label="Assigned to"
        value={assignedTo}
        onSelect={setAssignedTo}
        placeholder="Choose a person"
        options={team.map((m) => ({ value: m.name, label: `${m.name} (${m.role})` }))}
        required
        error={errors.assigned}
      />
      <Select
        label="Priority"
        value={priority}
        onSelect={(v) => setPriority(v as HealthTask['priority'])}
        options={[
          { value: 'High', label: 'High' },
          { value: 'Medium', label: 'Medium' },
          { value: 'Low', label: 'Low' },
        ]}
      />
      <Select
        label="Repeats"
        value={recurring}
        onSelect={setRecurring}
        options={[
          { value: 'no', label: 'One-off' },
          { value: 'yes', label: 'Recurring' },
        ]}
      />
      <Input label="Instructions" value={notes} onChangeText={setNotes} multiline placeholder="Product, dosage, which paddock…" optional />
    </Modal>
  );
}


// ---------- Month calendar (sample data is anchored to October 2026) ----------
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalendarView({ tasks, onOpenTask }: { tasks: HealthTask[]; onOpenTask: (id: string) => void }) {
  const [year, month] = today.split('-').map(Number);
  const monthKey = today.slice(0, 7);
  const [selected, setSelected] = useState(today);

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const keyFor = (d: number) => `${monthKey}-${String(d).padStart(2, '0')}`;
  const dayTasks = tasks.filter((t) => t.scheduledDate === selected);
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <>
      <Section title={monthName}>
        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={styles.dayCell} />;
              const key = keyFor(d);
              const items = tasks.filter((t) => t.scheduledDate === key);
              const isSelected = key === selected;
              const isToday = key === today;
              // Dot colour = most urgent task that day
              const worst = STATUS_ORDER.find((s) => items.some((t) => t.status === s));
              return (
                <TouchableOpacity key={i} style={styles.dayCell} onPress={() => setSelected(key)}>
                  <View style={[styles.dayCircle, isSelected && styles.daySelected, !isSelected && isToday && styles.dayToday]}>
                    <Text style={[styles.dayText, isSelected && { color: colors.white, fontWeight: weight.semibold }]}>{d}</Text>
                  </View>
                  <View style={[styles.dayDot, worst && { backgroundColor: taskStatusColor[worst] }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Section>

      <Section title={selected === today ? 'Today' : formatShortDate(selected)}>
        {dayTasks.length === 0 ? (
          <ListRow first title="No tasks scheduled" chevron={false} />
        ) : (
          dayTasks.map((t, i) => <TaskRow key={t.id} task={t} first={i === 0} onPress={() => onOpenTask(t.id)} />)
        )}
      </Section>
    </>
  );
}

// ---------- Task detail ----------
export function HealthTaskDetailScreen() {
  const { healthTasks, selectedTaskId, animals, completeHealthTask, deleteHealthTask, goBack } = useApp();
  const task = healthTasks.find((t) => t.id === selectedTaskId) || healthTasks[0];

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [actualDate, setActualDate] = useState(today);
  const [product, setProduct] = useState('Triatix Pour-on');
  const [dosage, setDosage] = useState('15ml per 100kg');
  const [notes, setNotes] = useState('Administered to all active stock without complications.');
  // null = untouched, which means "all active animals"
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[] | null>(null);

  if (!task) return null;

  const activeAnimals = animals.filter((a) => a.status === 'Active');
  const selected = selectedAnimalIds ?? activeAnimals.map((a) => a.id);
  const allSelected = selected.length === activeAnimals.length;
  const isOpen = task.status !== 'Completed';

  const toggle = (id: string) =>
    setSelectedAnimalIds(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const handleSave = () => {
    completeHealthTask(task.id, { date: actualDate, product, dosage, notes, animalIds: selected });
    setShowCompleteModal(false);
    goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={screen.container} contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailIcon}>
          <Ionicons name={taskTypeIcon[task.type]} size={icon.lg} color={taskStatusColor[task.status]} />
        </View>
        <Text style={styles.detailTitle}>{task.name}</Text>
        <StatusText label={task.status} color={taskStatusColor[task.status]} />

        <Section title="Details">
          <KeyValueRow first label="Scheduled" value={formatShortDate(task.scheduledDate)} />
          <KeyValueRow label="Applies to" value={task.herdOrAnimals} />
          <KeyValueRow label="Assigned to" value={task.assignedTo} />
          <KeyValueRow label="Priority" value={task.priority} valueColor={task.priority === 'High' ? colors.rust500 : undefined} />
          <KeyValueRow label="Repeats" value={task.recurring ? 'Yes' : 'No'} />
        </Section>

        <Section title="Instructions">
          <Text style={styles.paragraph}>{task.notes || 'No instructions added.'}</Text>
        </Section>

        {isOpen && (
          <Section
            title={`Animals (${selected.length} of ${activeAnimals.length})`}
            action={allSelected ? 'Select none' : 'Select all'}
            onAction={() => setSelectedAnimalIds(allSelected ? [] : activeAnimals.map((a) => a.id))}
          >
            {activeAnimals.map((a, i) => {
              const checked = selected.includes(a.id);
              return (
                <ListRow
                  key={a.id}
                  first={i === 0}
                  chevron={false}
                  onPress={() => toggle(a.id)}
                  left={
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={icon.md}
                      color={checked ? colors.forest700 : colors.charcoal300}
                    />
                  }
                  title={a.name || a.id}
                  subtitle={`${a.earTag} · ${a.herd}`}
                />
              );
            })}
          </Section>
        )}

        <Section>
          <ListRow
            first
            leftIcon="trash-outline"
            leftIconColor={colors.rust500}
            title="Delete task"
            titleColor={colors.rust500}
            chevron={false}
            onPress={() => setShowDelete(true)}
          />
        </Section>
        <ConfirmDialog
          open={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={() => {
            setShowDelete(false);
            deleteHealthTask(task.id);
            goBack();
          }}
          title="Delete this task?"
          message="The task is removed from the schedule. Treatments already saved on animals are kept."
          confirmLabel="Delete"
        />
      </ScrollView>

      {isOpen ? (
        <BottomBar>
          <Button variant="primary" disabled={selected.length === 0} onPress={() => setShowCompleteModal(true)} style={{ flex: 1 }}>
            Mark as completed
          </Button>
        </BottomBar>
      ) : (
        <BottomBar>
          <View style={styles.completedNote}>
            <Ionicons name="checkmark-circle" size={icon.md} color={colors.forest600} />
            <Text style={styles.completedText}>Completed and recorded on each animal</Text>
          </View>
        </BottomBar>
      )}

      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete task"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={() => setShowCompleteModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>
              {`Save to ${selected.length} animals`}
            </Button>
          </View>
        }
      >
        <Input label="Date completed" value={actualDate} onChangeText={setActualDate} placeholder="YYYY-MM-DD" required />
        <Input label="Product / medication" value={product} onChangeText={setProduct} required />
        <Input label="Dosage" value={dosage} onChangeText={setDosage} required />
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    padding: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: font.caption,
    fontWeight: weight.semibold,
    color: colors.charcoal400,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: colors.forest700,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.forest700,
  },
  dayText: {
    fontSize: font.body,
    color: colors.charcoal700,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.charcoal200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: font.titleLarge,
    fontWeight: weight.bold,
    color: colors.charcoal800,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: font.body,
    lineHeight: 20,
    color: colors.charcoal600,
    padding: spacing.lg,
  },
  completedNote: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  completedText: {
    fontSize: font.body,
    color: colors.charcoal600,
  },
});
