import { resolveBranchTimeZone } from './branch-calendar-date.util';

export interface DoctorAvailabilitySlot {
  day: number; // 0 = Sunday, matches Date.getDay() / JS weekday
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface DoctorAvailabilityDay {
  day: number;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
}

export const DOCTOR_AVAILABILITY_DAYS: DoctorAvailabilityDay[] = [
  { day: 1, label: 'Monday', enabled: false, start: '09:00', end: '17:00' },
  { day: 2, label: 'Tuesday', enabled: false, start: '09:00', end: '17:00' },
  { day: 3, label: 'Wednesday', enabled: false, start: '09:00', end: '17:00' },
  { day: 4, label: 'Thursday', enabled: false, start: '09:00', end: '17:00' },
  { day: 5, label: 'Friday', enabled: false, start: '09:00', end: '17:00' },
  { day: 6, label: 'Saturday', enabled: false, start: '09:00', end: '14:00' },
  { day: 0, label: 'Sunday', enabled: false, start: '09:00', end: '14:00' },
];

/** Monday-first order for summaries and chips. */
export const DOCTOR_WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const DAY_SHORT_LABELS = new Map<number, string>(
  DOCTOR_AVAILABILITY_DAYS.map((d) => [d.day, d.label.slice(0, 3)]),
);

const WEEKDAY_TO_JS_DAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface AvailabilityScheduleLine {
  daysLabel: string;
  timeLabel: string;
}

export interface DoctorAvailabilityView {
  kind: 'always' | 'structured' | 'legacy';
  compactSummary: string;
  dayAbbrevs: string[];
  scheduleLines: AvailabilityScheduleLine[];
  legacyText?: string;
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function createDefaultAvailabilityDays(): DoctorAvailabilityDay[] {
  return DOCTOR_AVAILABILITY_DAYS.map((d) => ({ ...d }));
}

export function parseDoctorAvailabilitySlots(raw: string | null | undefined): DoctorAvailabilitySlot[] | null {
  const value = raw?.trim();
  if (!value || !value.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;
    const slots: DoctorAvailabilitySlot[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const day = row['day'];
      const start = row['start'];
      const end = row['end'];
      if (
        typeof day === 'number' &&
        Number.isInteger(day) &&
        day >= 0 &&
        day <= 6 &&
        typeof start === 'string' &&
        typeof end === 'string' &&
        timePattern.test(start) &&
        timePattern.test(end)
      ) {
        slots.push({ day, start, end });
      }
    }
    return slots;
  } catch {
    return null;
  }
}

export function availabilityDaysFromRaw(raw: string | null | undefined): DoctorAvailabilityDay[] {
  const days = createDefaultAvailabilityDays();
  const slots = parseDoctorAvailabilitySlots(raw);
  if (!slots) return days;
  for (const slot of slots) {
    const day = days.find((d) => d.day === slot.day);
    if (!day) continue;
    day.enabled = true;
    day.start = slot.start;
    day.end = slot.end;
  }
  return days;
}

export function serializeAvailabilityDays(days: DoctorAvailabilityDay[]): string | null {
  const slots = days
    .filter((d) => d.enabled && timePattern.test(d.start) && timePattern.test(d.end))
    .map((d) => ({ day: d.day, start: d.start, end: d.end }));
  return slots.length > 0 ? JSON.stringify(slots) : null;
}

/**
 * Weekday (0=Sun) and minutes-from-midnight for `at` in an IANA zone.
 * Defaults to Asia/Karachi when timeZoneId is empty (clinic default).
 */
export function zonedWeekdayAndMinutes(
  at: Date,
  timeZoneId?: string | null,
): { day: number; minuteOfDay: number } {
  const timeZone = resolveBranchTimeZone(timeZoneId);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);

    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
    let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    if (hour === 24) {
      hour = 0;
    }

    const day = WEEKDAY_TO_JS_DAY[weekday];
    if (day == null || Number.isNaN(hour) || Number.isNaN(minute)) {
      return { day: at.getDay(), minuteOfDay: at.getHours() * 60 + at.getMinutes() };
    }
    return { day, minuteOfDay: hour * 60 + minute };
  } catch {
    return { day: at.getDay(), minuteOfDay: at.getHours() * 60 + at.getMinutes() };
  }
}

/**
 * Whether the doctor's structured weekly schedule covers `at` in the given clinic timezone.
 * Empty / legacy availability → always available.
 * @param timeZoneId IANA id (e.g. Asia/Karachi); defaults to branch default Asia/Karachi
 */
export function doctorIsAvailableAt(
  raw: string | null | undefined,
  at: Date,
  timeZoneId?: string | null,
): boolean {
  const slots = parseDoctorAvailabilitySlots(raw);
  if (!slots || slots.length === 0) return true;

  const { day: currentDay, minuteOfDay: currentMinute } = zonedWeekdayAndMinutes(at, timeZoneId);
  const previousDay = (currentDay + 6) % 7;

  return slots.some((slot) => {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    if (start == null || end == null) return false;

    if (start === end) return false;
    if (start < end) {
      return slot.day === currentDay && currentMinute >= start && currentMinute < end;
    }

    // Overnight slot, e.g. 20:00-02:00.
    return (
      (slot.day === currentDay && currentMinute >= start) ||
      (slot.day === previousDay && currentMinute < end)
    );
  });
}

export function availabilitySummary(raw: string | null | undefined): string {
  return buildDoctorAvailabilityView(raw).compactSummary;
}

export function availabilityDetailedSummary(raw: string | null | undefined): string {
  const slots = parseDoctorAvailabilitySlots(raw);
  if (!slots || slots.length === 0) return raw?.trim() || 'Always available';
  return slots
    .map((s) => `${DAY_SHORT_LABELS.get(s.day) ?? s.day} ${to12Hour(s.start)}-${to12Hour(s.end)}`)
    .join(', ');
}

export function buildDoctorAvailabilityView(raw: string | null | undefined): DoctorAvailabilityView {
  const trimmed = raw?.trim() ?? '';
  const slots = parseDoctorAvailabilitySlots(raw);

  if (!slots || slots.length === 0) {
    if (!trimmed) {
      return {
        kind: 'always',
        compactSummary: 'Always available',
        dayAbbrevs: [],
        scheduleLines: [],
      };
    }
    return {
      kind: 'legacy',
      compactSummary: truncateLegacyAvailability(trimmed),
      dayAbbrevs: [],
      scheduleLines: [],
      legacyText: trimmed,
    };
  }

  const scheduleLines = buildAvailabilityScheduleLines(slots);
  const dayAbbrevs = DOCTOR_WEEK_DAY_ORDER.filter((day) => slots.some((s) => s.day === day)).map(
    (day) => DAY_SHORT_LABELS.get(day) ?? String(day),
  );

  return {
    kind: 'structured',
    compactSummary: scheduleLines.map((line) => `${line.daysLabel} · ${line.timeLabel}`).join(' · '),
    dayAbbrevs,
    scheduleLines,
  };
}

function buildAvailabilityScheduleLines(slots: DoctorAvailabilitySlot[]): AvailabilityScheduleLine[] {
  const byTime = new Map<string, number[]>();
  for (const slot of slots) {
    const key = `${slot.start}-${slot.end}`;
    const days = byTime.get(key) ?? [];
    days.push(slot.day);
    byTime.set(key, days);
  }

  const lines: AvailabilityScheduleLine[] = [];
  for (const [timeKey, days] of byTime.entries()) {
    const [start, end] = timeKey.split('-');
    lines.push({
      daysLabel: formatAvailabilityDayRange(days),
      timeLabel: `${to12Hour(start)} – ${to12Hour(end)}`,
    });
  }

  return lines.sort(
    (a, b) => weekDaySortIndex(a.daysLabel) - weekDaySortIndex(b.daysLabel),
  );
}

function formatAvailabilityDayRange(days: number[]): string {
  const unique = [...new Set(days)];
  if (unique.length === 7) {
    return 'Daily';
  }

  const sorted = unique.sort((a, b) => weekDayOrderIndex(a) - weekDayOrderIndex(b));
  const parts: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  let prevOrder = weekDayOrderIndex(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    const day = sorted[i];
    const order = weekDayOrderIndex(day);
    if (order === prevOrder + 1) {
      rangeEnd = day;
      prevOrder = order;
      continue;
    }
    parts.push(formatSingleDayRange(rangeStart, rangeEnd));
    rangeStart = day;
    rangeEnd = day;
    prevOrder = order;
  }
  parts.push(formatSingleDayRange(rangeStart, rangeEnd));
  return parts.join(', ');
}

function formatSingleDayRange(start: number, end: number): string {
  const startLabel = DAY_SHORT_LABELS.get(start) ?? String(start);
  if (start === end) {
    return startLabel;
  }
  const endLabel = DAY_SHORT_LABELS.get(end) ?? String(end);
  return `${startLabel}–${endLabel}`;
}

function weekDayOrderIndex(day: number): number {
  return DOCTOR_WEEK_DAY_ORDER.indexOf(day as (typeof DOCTOR_WEEK_DAY_ORDER)[number]);
}

function weekDaySortIndex(daysLabel: string): number {
  if (daysLabel === 'Daily') {
    return 0;
  }
  const first = daysLabel.split(/[,\s–-]+/)[0];
  const day = [...DAY_SHORT_LABELS.entries()].find(([, label]) => label === first)?.[0];
  return day == null ? 99 : weekDayOrderIndex(day);
}

function truncateLegacyAvailability(value: string, max = 48): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function timeToMinutes(value: string): number | null {
  if (!timePattern.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function to12Hour(value: string): string {
  const minutes = timeToMinutes(value);
  if (minutes == null) return value;
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}
