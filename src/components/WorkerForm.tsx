import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '@/store';
import { Button, Modal, Input, Select } from '@/components/NativeUI';
import { colors, spacing, font, weight } from '@/theme';
import type { TeamMember, UserRole } from '@/types';

/** Add a new worker (no `member`) or edit / remove an existing one. */
export function WorkerForm({ open, onClose, member }: { open: boolean; onClose: () => void; member?: TeamMember | null }) {
  const { saveTeamMember, removeTeamMember } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Farm Worker');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Fill the form each time it opens
  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? '');
    setRole(member?.role ?? 'Farm Worker');
    setPhone(member?.phone ?? '+263 ');
    setSalary(member?.monthlySalary ? String(member.monthlySalary) : '');
    setErrors({});
    setConfirmRemove(false);
  }, [open, member]);

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter the worker’s name';
    if (salary && !(Number(salary) > 0)) errs.salary = 'Enter a number, or leave it empty';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    saveTeamMember({
      id: member?.id,
      name: name.trim(),
      role,
      // The field starts with the country code; on its own that means "no number"
      phone: /^\+?\d{0,4}$/.test(phone.trim()) ? '' : phone.trim(),
      monthlySalary: salary ? Number(salary) : undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? 'Edit worker' : 'Add worker'}
      footer={
        confirmRemove ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.confirm}>Remove {member?.name} from the team? Their past salary payments are kept.</Text>
            <View style={styles.row}>
              <Button variant="outline" onPress={() => setConfirmRemove(false)} style={{ flex: 1 }}>
                Keep
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  if (member) removeTeamMember(member.id);
                  onClose();
                }}
                style={{ flex: 1 }}
              >
                Remove
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>
              {member ? 'Save' : 'Add worker'}
            </Button>
          </View>
        )
      }
    >
      <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Tafadzwa Ncube" required error={errors.name} />
      <Select
        label="Role"
        value={role}
        onSelect={(v) => setRole(v as UserRole)}
        options={[
          { value: 'Farm Worker', label: 'Farm Worker' },
          { value: 'Farm Manager', label: 'Farm Manager' },
        ]}
        required
      />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+263 77 123 4567" optional />
      <Input
        label="Usual monthly pay (USD)"
        value={salary}
        onChangeText={setSalary}
        keyboardType="numeric"
        placeholder="e.g. 200"
        optional
        error={errors.salary}
      />
      {member && !confirmRemove && (
        <TouchableOpacity onPress={() => setConfirmRemove(true)} style={styles.removeLink}>
          <Text style={styles.removeText}>Remove from team</Text>
        </TouchableOpacity>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirm: {
    fontSize: font.body,
    color: colors.charcoal700,
    textAlign: 'center',
  },
  removeLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  removeText: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.rust500,
  },
});
