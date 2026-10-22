import type { Animal } from '@/types';
import { today } from '@/data';

/** Age from date of birth relative to the sample data's "today": "8 mo" / "4.6 yr". */
export function ageLabel(dob: string): string {
  const y = Math.max(0, (new Date(today).getTime() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yr`;
}

/** Next sequential system ID (A001, A002, …) that doesn't collide with existing animals. */
export function nextAnimalId(animals: Animal[]): string {
  const max = animals.reduce((m, a) => {
    const n = Number(a.id.replace(/^A/, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `A${String(max + 1).padStart(3, '0')}`;
}

/** True when another animal already uses this ear tag (case-insensitive). */
export function earTagTaken(animals: Animal[], earTag: string, exceptId?: string): boolean {
  const tag = earTag.trim().toLowerCase();
  return animals.some((a) => a.id !== exceptId && a.earTag.toLowerCase() === tag);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-10" or "2026-10-12" → "October 2026" */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return y && m ? `${MONTHS_LONG[m - 1]} ${y}` : iso;
}

/** The `count` months up to and including the month of `iso`, newest first, as "YYYY-MM". */
export function recentMonths(iso: string, count: number): string[] {
  const [y, m] = iso.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

/** "2026-10-28" → "28 Oct" */
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return m && d ? `${d} ${MONTHS[m - 1]}` : iso;
}

/** Basic YYYY-MM-DD check for the free-text date fields. */
export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}
