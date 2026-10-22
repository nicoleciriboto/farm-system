import { colors } from '@/theme';
import type { IoniconName } from '@/components/Layout';
import type { AnimalStatus, HealthTask, TaskStatus } from '@/types';

/** One colour per status, used for the status dot/label and leading icons. */
export const animalStatusColor: Record<AnimalStatus, string> = {
  Active: colors.forest600,
  Sold: colors.amber600,
  Deceased: colors.charcoal400,
  Transferred: colors.sage600,
};

export const taskStatusColor: Record<TaskStatus, string> = {
  Overdue: colors.rust500,
  'Due Today': colors.amber600,
  Upcoming: colors.forest600,
  Completed: colors.charcoal400,
};

export const taskTypeIcon: Record<HealthTask['type'], IoniconName> = {
  Dipping: 'water-outline',
  Vaccination: 'eyedrop-outline',
  Treatment: 'medkit-outline',
  'Vet Visit': 'medical-outline',
};
