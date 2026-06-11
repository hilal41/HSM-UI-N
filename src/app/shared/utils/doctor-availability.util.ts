export interface DoctorAvailabilitySlot {
  day: number; // 0 = Sunday, matches Date.getDay()
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

export function doctorIsAvailableAt(raw: string | null | undefined, at: Date): boolean {
  const slots = parseDoctorAvailabilitySlots(raw);
  if (!slots || slots.length === 0) return true;

  const currentDay = at.getDay();
  const currentMinute = at.getHours() * 60 + at.getMinutes();
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
  const slots = parseDoctorAvailabilitySlots(raw);
  if (!slots || slots.length === 0) return raw?.trim() || 'Always available';
  const labels = new Map(DOCTOR_AVAILABILITY_DAYS.map((d) => [d.day, d.label.slice(0, 3)]));
  return slots.map((s) => `${labels.get(s.day) ?? s.day} ${to12Hour(s.start)}-${to12Hour(s.end)}`).join(', ');
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
