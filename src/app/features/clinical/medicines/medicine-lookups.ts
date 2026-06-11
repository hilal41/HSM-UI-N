/** Sentinel for dropdown "Other"; persisted value is the custom text, not this token. */
export const MEDICINE_SELECT_OTHER = '__OTHER__';

export interface MedicineSelectOption {
  label: string;
  value: string;
}

export const MEDICINE_CATEGORY_OPTIONS: readonly MedicineSelectOption[] = [
  { label: 'Analgesic', value: 'Analgesic' },
  { label: 'Antibiotic', value: 'Antibiotic' },
  { label: 'Antiviral', value: 'Antiviral' },
  { label: 'Antifungal', value: 'Antifungal' },
  { label: 'Antihistamine', value: 'Antihistamine' },
  { label: 'Cardiovascular', value: 'Cardiovascular' },
  { label: 'Diabetes', value: 'Diabetes' },
  { label: 'Gastrointestinal', value: 'Gastrointestinal' },
  { label: 'Respiratory', value: 'Respiratory' },
  { label: 'Vitamin / supplement', value: 'Vitamin / supplement' },
  { label: 'Other', value: MEDICINE_SELECT_OTHER },
] as const;

export const MEDICINE_FORM_OPTIONS: readonly MedicineSelectOption[] = [
  { label: 'Tablet', value: 'Tablet' },
  { label: 'Capsule', value: 'Capsule' },
  { label: 'Syrup', value: 'Syrup' },
  { label: 'Suspension', value: 'Suspension' },
  { label: 'Injection', value: 'Injection' },
  { label: 'Drops', value: 'Drops' },
  { label: 'Cream', value: 'Cream' },
  { label: 'Ointment', value: 'Ointment' },
  { label: 'Inhaler', value: 'Inhaler' },
  { label: 'Powder', value: 'Powder' },
  { label: 'Suppository', value: 'Suppository' },
  { label: 'Other', value: MEDICINE_SELECT_OTHER },
] as const;
