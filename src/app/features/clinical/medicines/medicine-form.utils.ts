import { MEDICINE_CATEGORY_OPTIONS, MEDICINE_FORM_OPTIONS, MEDICINE_SELECT_OTHER } from './medicine-lookups';

const categoryValues = new Set(MEDICINE_CATEGORY_OPTIONS.map((o) => o.value).filter((v) => v !== MEDICINE_SELECT_OTHER));
const formValues = new Set(MEDICINE_FORM_OPTIONS.map((o) => o.value).filter((v) => v !== MEDICINE_SELECT_OTHER));

/** Map stored DB string to p-select value (preset or OTHER sentinel). */
export function categoryToSelectValue(stored: string): string {
  return categoryValues.has(stored) ? stored : MEDICINE_SELECT_OTHER;
}

export function formToSelectValue(stored: string): string {
  return formValues.has(stored) ? stored : MEDICINE_SELECT_OTHER;
}

/** Resolve final string for API from select + optional custom text when Other. */
export function resolveOtherSelect(selectValue: string, customText: string): string {
  if (selectValue !== MEDICINE_SELECT_OTHER) return selectValue;
  return customText.trim();
}

export function parseIsoDateLocal(iso: string): Date | null {
  if (!iso?.trim()) return null;
  const datePart = iso.trim().slice(0, 10);
  const parts = datePart.split('-').map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
