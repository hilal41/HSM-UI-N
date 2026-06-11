/**
 * ISO `yyyy-MM-dd` for a completed age in years: same calendar month/day as `ref`, minus `ageYears` years.
 * Adjusted so the result is strictly before `ref` (matches API "DOB in the past" rule).
 */
export function dateOfBirthFromAge(ageYears: number, ref = new Date()): string {
  const y = ref.getFullYear() - ageYears;
  const m = ref.getMonth();
  const d = ref.getDate();
  let dob = new Date(y, m, d);
  if (dob >= ref) {
    dob = new Date(dob.getTime() - 86400000);
  }
  const ys = dob.getFullYear();
  const ms = String(dob.getMonth() + 1).padStart(2, '0');
  const ds = String(dob.getDate()).padStart(2, '0');
  return `${ys}-${ms}-${ds}`;
}

/** Completed years since `iso` (yyyy-MM-dd) relative to `ref` (birthday not yet reached this year ⇒ one less). */
export function completedAgeFromIsoDateOfBirth(iso: string, ref = new Date()): number {
  const d = parseIsoToLocalDate(iso);
  return d ? completedAgeFromDate(d, ref) : 0;
}

/** Completed years from a calendar date (local date parts). */
export function completedAgeFromDate(dob: Date, ref = new Date()): number {
  if (Number.isNaN(dob.getTime())) return 0;
  let age = ref.getFullYear() - dob.getFullYear();
  const md = ref.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && ref.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
}

export interface AgeYmd {
  years: number;
  months: number;
  days: number;
}

/** Display completed age in one field (years-months-days). */
export function formatAgeYmdForInput(a: AgeYmd): string {
  return `${a.years}-${a.months}-${a.days}`;
}

const MAX_REASONABLE_AGE_YEARS = 150;
const MAX_AGE_DIGITS = 7; // up to 3 + 2 + 2

/** Strip to digits only, max length for age Y-M-D entry. */
export function digitsOnlyAgeYmd(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, MAX_AGE_DIGITS);
}

function partitionAgeDigitsForDisplay(x: string): { y: string; m: string; day: string } {
  if (x.length <= 2) return { y: x, m: '', day: '' };
  if (x.length === 3) {
    const n = parseInt(x, 10);
    if (n <= MAX_REASONABLE_AGE_YEARS) return { y: x, m: '', day: '' };
    return { y: x.slice(0, 2), m: x.slice(2), day: '' };
  }
  for (const yLen of [3, 2, 1] as const) {
    if (x.length < yLen) continue;
    const ys = x.slice(0, yLen);
    const yv = parseInt(ys, 10);
    if (yv > MAX_REASONABLE_AGE_YEARS) continue;
    const rem = x.slice(yLen);
    for (let mLen = Math.min(2, rem.length); mLen >= 1; mLen--) {
      const ms = rem.slice(0, mLen);
      const mv = parseInt(ms, 10);
      if (mv > 11) continue;
      const ds = rem.slice(mLen);
      if (ds.length > 2) continue;
      if (ds.length > 0 && parseInt(ds, 10) > 31) continue;
      return { y: ys, m: ms, day: ds };
    }
  }
  return { y: x.slice(0, 2), m: x.slice(2, 4), day: x.slice(4) };
}

/**
 * Insert hyphens while typing from a digit buffer (e.g. 45612 → 45-6-12).
 */
export function formatAgeYmdAutoFromDigits(digits: string): string {
  const x = digitsOnlyAgeYmd(digits);
  if (!x) return '';
  const { y, m, day } = partitionAgeDigitsForDisplay(x);
  return [y, m, day].filter((p) => p.length > 0).join('-');
}

/** How many digits appear strictly before `caret` in `value`. */
export function digitIndexBeforeCaret(value: string, caret: number): number {
  let n = 0;
  const end = Math.min(Math.max(0, caret), value.length);
  for (let i = 0; i < end; i++) {
    if (/\d/.test(value[i])) n++;
  }
  return n;
}

/** Caret position after the `digitIndex`-th digit in `formatted` (0 = before first digit). */
export function caretAfterDigitIndex(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen === digitIndex) return i + 1;
    }
  }
  return formatted.length;
}

/**
 * Parse a single text value into years / months / days.
 * Accepts e.g. `45`, `45-3-10`, `45/3/10`, `45 3 10`, `45y3m10d` (letters optional).
 * One number ⇒ years only; two ⇒ years and months; three ⇒ years, months, days.
 */
export function parseAgeYmdFromUserInput(raw: string): AgeYmd | null {
  const s = raw.trim();
  if (!s) return null;

  const parts = s
    .split(/[^\d]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return null;

  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || !Number.isInteger(n))) return null;

  let years = 0;
  let months = 0;
  let days = 0;
  if (nums.length >= 3) {
    years = nums[0];
    months = nums[1];
    days = nums[2];
  } else if (nums.length === 2) {
    years = nums[0];
    months = nums[1];
  } else {
    years = nums[0];
  }

  if (years > MAX_REASONABLE_AGE_YEARS) return null;
  return { years, months, days };
}

/** Completed age as years + months + days (calendar) from DOB to `ref`. */
export function completedAgeYmdFromDate(dob: Date, ref = new Date()): AgeYmd {
  const dob0 = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  const ref0 = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (dob0 > ref0) return { years: 0, months: 0, days: 0 };
  let years = ref0.getFullYear() - dob0.getFullYear();
  let months = ref0.getMonth() - dob0.getMonth();
  let days = ref0.getDate() - dob0.getDate();
  if (days < 0) {
    months--;
    days += new Date(ref0.getFullYear(), ref0.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

/** Local calendar DOB from completed age (years, months, days) before `ref` instant. */
export function dateOfBirthFromAgeYmdDate(years: number, months: number, days: number, ref = new Date()): Date {
  const y = Math.max(0, Math.floor(Number(years) || 0));
  const mo = Math.max(0, Math.floor(Number(months) || 0));
  const da = Math.max(0, Math.floor(Number(days) || 0));
  const out = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  out.setFullYear(out.getFullYear() - y);
  out.setMonth(out.getMonth() - mo);
  out.setDate(out.getDate() - da);
  while (out.getTime() >= ref.getTime()) {
    out.setDate(out.getDate() - 1);
  }
  return out;
}

/** Parse `yyyy-MM-dd` or ISO start into local midnight date. */
export function parseIsoToLocalDate(iso: string): Date | null {
  const dayPart = iso.split('T')[0];
  const parts = dayPart.split('-').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [yy, mm, dd] = parts;
  const d = new Date(yy, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `yyyy-MM-dd` from local calendar date (API format). */
export function formatLocalDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
