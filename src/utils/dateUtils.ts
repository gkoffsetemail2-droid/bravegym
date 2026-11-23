import { DayOfWeek } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const EXTERNAL_LINKS = {
  instagram: 'https://www.instagram.com/bravegymandfitness/',
  whatsapp: 'https://wa.me/6282123884591',
  maps: 'https://www.google.com/maps/place/brave+gym/data=!4m2!3m1!1s0x2e68ef7d7f5be725:0xbcb8f60a49cc6c6c',
};

export const STUDIO_OPEN_HOUR = 6;
export const STUDIO_CLOSE_HOUR = 23;
export const STUDIO_HOURS_24H = '06:00 – 23:00';
export const STUDIO_HOURS_12H = '06:00 AM – 11:00 PM';
export const STUDIO_HOURS_STATUS = 'Open Daily';

export function formatRupiah(amount: number): string {
  return 'Rp' + amount.toLocaleString('id-ID');
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(iso: string): string {
  const dt = parseISODate(iso);
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const dt = parseISODate(iso);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDayOfWeekIndex(dayName: DayOfWeek): number {
  const map: Record<DayOfWeek, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[dayName];
}

export function getNextDateForDay(dayName: DayOfWeek): string {
  const today = new Date();
  const target = getDayOfWeekIndex(dayName);
  const current = today.getDay();
  let diff = target - current;
  if (diff < 0) diff += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return toISODate(result);
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

export function getMonthCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startGrid = getStartOfWeek(firstDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startGrid);
    d.setDate(startGrid.getDate() + i);
    days.push(d);
  }
  return days;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isPastDateTime(dateISO: string, timeHHMM: string): boolean {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = timeHHMM.split(':').map(Number);
  const target = new Date(y, m - 1, d, hh, mm, 0, 0);
  return target.getTime() < Date.now();
}

export function hoursUntilDateTime(dateISO: string, timeHHMM: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = timeHHMM.split(':').map(Number);
  const target = new Date(y, m - 1, d, hh, mm, 0, 0);
  return (target.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function generateSaunaTimeSlots(
  openHour: number,
  closeHour: number,
  slotDurationMin: number
): string[] {
  const slots: string[] = [];
  let cursor = openHour * 60;
  const end = closeHour * 60;
  while (cursor + slotDurationMin <= end) {
    const startStr = minutesToTime(cursor);
    const endStr = minutesToTime(cursor + slotDurationMin);
    slots.push(`${startStr}–${endStr}`);
    cursor += slotDurationMin;
  }
  return slots;
}

export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const num = String(Date.now()).slice(-4);
  return `${prefix}-${num}${rand}`;
}
