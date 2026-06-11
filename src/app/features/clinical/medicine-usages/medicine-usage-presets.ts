/** Default starter rows (UI only). Clicking one fills the Details form; nothing is sent to the API except short code + description after Save. */
export interface MedicineUsagePreset {
  readonly id: 1 | 2 | 3 | 4 | 5;
  readonly name: string;
  readonly blurb: string;
  readonly shortCode: string;
  readonly description: string;
}

export const MEDICINE_USAGE_PRESETS: readonly MedicineUsagePreset[] = [
  {
    id: 1,
    name: 'Once daily',
    blurb: 'One dose per day, any time.',
    shortCode: 'OD',
    description: 'One dose per day, any time.',
  },
  {
    id: 2,
    name: 'Twice daily',
    blurb: 'Morning and evening.',
    shortCode: 'BID',
    description: 'Two doses per day, typically morning and evening.',
  },
  {
    id: 3,
    name: 'Three times daily',
    blurb: 'Spread through waking hours.',
    shortCode: 'TID',
    description: 'Three doses spread through waking hours.',
  },
  {
    id: 4,
    name: 'Four times daily',
    blurb: 'With meals and bedtime.',
    shortCode: 'QID',
    description: 'Four doses, often with meals and at bedtime.',
  },
  {
    id: 5,
    name: 'As needed',
    blurb: 'No fixed daily count.',
    shortCode: 'PRN',
    description: 'Use when required; not on a fixed daily count.',
  },
] as const;

export function medicineUsagePresetById(id: number): MedicineUsagePreset | undefined {
  return MEDICINE_USAGE_PRESETS.find((p) => p.id === id);
}

/** If short code + description match a preset exactly, return its id (for highlighting). */
export function findMatchingMedicineUsagePresetId(shortCode: string, description: string | null | undefined): number | null {
  const code = shortCode.trim().toUpperCase();
  const desc = (description ?? '').trim();
  for (const p of MEDICINE_USAGE_PRESETS) {
    if (p.shortCode.toUpperCase() === code && p.description === desc) {
      return p.id;
    }
  }
  return null;
}
