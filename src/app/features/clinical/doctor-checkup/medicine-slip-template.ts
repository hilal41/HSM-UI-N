/** Stored in Hospital.medicineSlipTemplateJson and used when printing prescription slips. */

import type { SlipPresetOption } from '../../../shared/slip-designer/slip-preset.util';
import { SLIP_CUSTOM_PRESET_ID } from '../../../shared/slip-designer/slip-preset.util';

export const MEDICINE_SLIP_SECTION_IDS = [
  'hospital',
  'header',
  'patient',
  'visit',
  'checkupQuestions',
  'medicines',
  'notes',
  'nextCheckup',
  'footer',
] as const;

export type MedicineSlipSectionId = (typeof MEDICINE_SLIP_SECTION_IDS)[number];

export const MEDICINE_SLIP_SECTION_LABELS: Record<MedicineSlipSectionId, string> = {
  hospital: 'Hospital details',
  header: 'Slip title & date',
  patient: 'Patient details',
  visit: 'Visit details',
  checkupQuestions: 'Checkup & prescription',
  medicines: 'Medicines table',
  notes: 'Prescription notes',
  nextCheckup: 'Next checkup',
  footer: 'Footer / signature line',
};

export const MEDICINE_SLIP_COLUMN_IDS = [
  'medicineName',
  'code',
  'form',
  'strength',
  'usageShortCode',
  'usageDescription',
] as const;

export type MedicineSlipColumnId = (typeof MEDICINE_SLIP_COLUMN_IDS)[number];

export const MEDICINE_SLIP_COLUMN_LABELS: Record<MedicineSlipColumnId, string> = {
  medicineName: 'Medicine name',
  code: 'Code',
  form: 'Form',
  strength: 'Strength',
  usageShortCode: 'Usage short code',
  usageDescription: 'Usage description',
};

export type MedicineSlipHorizontalAlign = 'left' | 'center' | 'right';
export type MedicineSlipLogoPlacement = 'none' | 'inline-start' | 'inline-end' | 'above-center';

export const MEDICINE_SLIP_DEFAULT_PRESET_ID = 'modern-clinical';

export const MEDICINE_SLIP_PRESET_OPTIONS: SlipPresetOption[] = [
  {
    id: 'modern-clinical',
    name: 'Modern Clinical',
    blurb: 'Teal accents, logo left, clean Rx table — recommended for most hospitals.',
    recommended: true,
  },
  {
    id: 'clean-center',
    name: 'Clean Center',
    blurb: 'Centered clinic header with logo above and balanced prescription layout.',
  },
  {
    id: 'professional-formal',
    name: 'Professional Formal',
    blurb: 'Serif letterhead and strong rules for formal prescriptions.',
  },
  {
    id: 'compact-receipt',
    name: 'Compact Receipt',
    blurb: 'Tight receipt-style Rx with essential medicine columns only.',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    blurb: 'Soft muted palette, no grid lines, premium minimal Rx slip.',
  },
];

export const MEDICINE_SLIP_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'System UI', value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { label: 'Segoe UI / Arial', value: '"Segoe UI", Arial, Helvetica, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Calibri / sans', value: 'Calibri, "Segoe UI", Candara, sans-serif' },
  { label: 'Courier (monospace)', value: '"Courier New", Courier, monospace' },
];

export const MEDICINE_SLIP_ALIGN_OPTIONS: { label: string; value: MedicineSlipHorizontalAlign }[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

export const MEDICINE_SLIP_LOGO_PLACEMENT_OPTIONS: {
  label: string;
  value: MedicineSlipLogoPlacement;
}[] = [
  { label: 'No logo on slip', value: 'none' },
  { label: 'Logo left (inline with text)', value: 'inline-start' },
  { label: 'Logo right (inline with text)', value: 'inline-end' },
  { label: 'Logo above (centered)', value: 'above-center' },
];

export interface MedicineSlipTemplate {
  version: 1;
  presetId: string;
  sectionOrder: MedicineSlipSectionId[];
  hiddenSections: MedicineSlipSectionId[];
  visibleMedicineColumns: MedicineSlipColumnId[];
  slipTitle: string;
  hospitalShowName: boolean;
  hospitalShowCode: boolean;
  hospitalShowAddress: boolean;
  hospitalShowPhone: boolean;
  hospitalShowEmail: boolean;
  hospitalShowLogo: boolean;
  logoPlacement: MedicineSlipLogoPlacement;
  logoMaxHeightPx: number;
  hospitalBlockAlign: MedicineSlipHorizontalAlign;
  headerTextAlign: MedicineSlipHorizontalAlign;
  bodySectionsAlign: MedicineSlipHorizontalAlign;
  paddingTopMm: number;
  paddingRightMm: number;
  paddingBottomMm: number;
  paddingLeftMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  globalTextScale: number;
  fontFamily: string;
  baseFontSizePx: number;
  titleFontSizePx: number;
  headingFontSizePx: number;
  tableFontSizePx: number;
  lineHeight: number;
  bodyColor: string;
  titleColor: string;
  mutedColor: string;
  borderColor: string;
  footerText: string;
  showTableGrid: boolean;
}

const DEFAULT_FOOTER = 'Doctor signature: _________________________________';

const PRESET_PATCHES: Record<string, Partial<MedicineSlipTemplate>> = {
  'modern-clinical': {
    presetId: 'modern-clinical',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: true,
    logoPlacement: 'inline-start',
    logoMaxHeightPx: 48,
    paddingTopMm: 6,
    paddingRightMm: 6,
    paddingBottomMm: 6,
    paddingLeftMm: 6,
    baseFontSizePx: 12,
    titleFontSizePx: 18,
    headingFontSizePx: 10,
    tableFontSizePx: 11,
    bodyColor: '#0f172a',
    titleColor: '#0f766e',
    mutedColor: '#64748b',
    borderColor: '#e2e8f0',
    showTableGrid: true,
  },
  'clean-center': {
    presetId: 'clean-center',
    hospitalBlockAlign: 'center',
    headerTextAlign: 'center',
    bodySectionsAlign: 'left',
    hospitalShowLogo: true,
    logoPlacement: 'above-center',
    logoMaxHeightPx: 56,
    paddingTopMm: 8,
    paddingRightMm: 8,
    paddingBottomMm: 8,
    paddingLeftMm: 8,
    globalTextScale: 1.04,
    lineHeight: 1.45,
    showTableGrid: true,
  },
  'professional-formal': {
    presetId: 'professional-formal',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: true,
    logoPlacement: 'inline-start',
    logoMaxHeightPx: 48,
    fontFamily: 'Georgia, "Times New Roman", serif',
    borderColor: '#94a3b8',
    showTableGrid: true,
    footerText: 'Doctor signature: _________________________________',
  },
  'compact-receipt': {
    presetId: 'compact-receipt',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: false,
    logoPlacement: 'none',
    globalTextScale: 0.9,
    paddingTopMm: 3,
    paddingRightMm: 3,
    paddingBottomMm: 3,
    paddingLeftMm: 3,
    baseFontSizePx: 10,
    titleFontSizePx: 14,
    headingFontSizePx: 9,
    tableFontSizePx: 9,
    lineHeight: 1.25,
    visibleMedicineColumns: ['medicineName', 'strength', 'usageShortCode'],
    showTableGrid: true,
  },
  'minimal-white': {
    presetId: 'minimal-white',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: false,
    logoPlacement: 'none',
    paddingTopMm: 10,
    paddingRightMm: 10,
    paddingBottomMm: 10,
    paddingLeftMm: 10,
    borderColor: '#f1f5f9',
    bodyColor: '#334155',
    titleColor: '#334155',
    mutedColor: '#64748b',
    showTableGrid: false,
    lineHeight: 1.5,
  },
};

function clampNum(n: unknown, min: number, max: number, fallback: number): number {
  return typeof n === 'number' && !Number.isNaN(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function parseHexColor(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  return /^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

function pickAlign(v: unknown, fallback: MedicineSlipHorizontalAlign): MedicineSlipHorizontalAlign {
  return v === 'left' || v === 'center' || v === 'right' ? v : fallback;
}

function pickLogoPlacement(v: unknown, fallback: MedicineSlipLogoPlacement): MedicineSlipLogoPlacement {
  if (v === 'none' || v === 'inline-start' || v === 'inline-end' || v === 'above-center') return v;
  if (v === 'left') return 'inline-start';
  if (v === 'right') return 'inline-end';
  return fallback;
}

function pickPresetId(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) return SLIP_CUSTOM_PRESET_ID;
  const id = v.trim().slice(0, 40);
  return MEDICINE_SLIP_PRESET_OPTIONS.some((p) => p.id === id) ? id : SLIP_CUSTOM_PRESET_ID;
}

function pickFontFamily(v: unknown, fallback: string): string {
  if (typeof v !== 'string' || !v.trim()) return fallback;
  const t = v.trim();
  return t.length > 400 ? fallback : t;
}

function isSectionId(v: string): v is MedicineSlipSectionId {
  return (MEDICINE_SLIP_SECTION_IDS as readonly string[]).includes(v);
}

function isColumnId(v: string): v is MedicineSlipColumnId {
  return (MEDICINE_SLIP_COLUMN_IDS as readonly string[]).includes(v);
}

function normalizeSectionOrder(order: unknown): MedicineSlipSectionId[] {
  const next: MedicineSlipSectionId[] = [];
  if (Array.isArray(order)) {
    for (const id of order) {
      if (typeof id === 'string' && isSectionId(id) && !next.includes(id)) next.push(id);
    }
  }
  for (const id of MEDICINE_SLIP_SECTION_IDS) {
    if (!next.includes(id)) {
      const defaultIndex = MEDICINE_SLIP_SECTION_IDS.indexOf(id);
      const previousDefault = MEDICINE_SLIP_SECTION_IDS.slice(0, defaultIndex)
        .reverse()
        .find((prev) => next.includes(prev));
      const insertAt = previousDefault == null ? next.length : next.indexOf(previousDefault) + 1;
      next.splice(insertAt, 0, id);
    }
  }
  return next;
}

function normalizeHidden(raw: unknown): MedicineSlipSectionId[] {
  if (!Array.isArray(raw)) return [];
  const out: MedicineSlipSectionId[] = [];
  for (const id of raw) {
    if (typeof id === 'string' && isSectionId(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

function normalizeColumns(raw: unknown): MedicineSlipColumnId[] {
  const out: MedicineSlipColumnId[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === 'string' && isColumnId(id) && !out.includes(id)) out.push(id);
    }
  }
  return out.length > 0 ? out : [...MEDICINE_SLIP_COLUMN_IDS];
}

function baseMedicineSlipTemplate(): MedicineSlipTemplate {
  const pad = 6;
  return {
    version: 1,
    presetId: MEDICINE_SLIP_DEFAULT_PRESET_ID,
    sectionOrder: [...MEDICINE_SLIP_SECTION_IDS],
    hiddenSections: [],
    visibleMedicineColumns: [...MEDICINE_SLIP_COLUMN_IDS],
    slipTitle: 'Medicine slip',
    hospitalShowName: true,
    hospitalShowCode: true,
    hospitalShowAddress: true,
    hospitalShowPhone: true,
    hospitalShowEmail: true,
    hospitalShowLogo: false,
    logoPlacement: 'none',
    logoMaxHeightPx: 48,
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    paddingTopMm: pad,
    paddingRightMm: pad,
    paddingBottomMm: pad,
    paddingLeftMm: pad,
    marginTopMm: 0,
    marginRightMm: 0,
    marginBottomMm: 0,
    marginLeftMm: 0,
    globalTextScale: 1,
    fontFamily: MEDICINE_SLIP_FONT_OPTIONS[0].value,
    baseFontSizePx: 12,
    titleFontSizePx: 18,
    headingFontSizePx: 10,
    tableFontSizePx: 11,
    lineHeight: 1.35,
    bodyColor: '#0f172a',
    titleColor: '#042f2e',
    mutedColor: '#64748b',
    borderColor: '#e2e8f0',
    footerText: DEFAULT_FOOTER,
    showTableGrid: true,
  };
}

export function defaultMedicineSlipTemplate(): MedicineSlipTemplate {
  return applyMedicineSlipPresetId(MEDICINE_SLIP_DEFAULT_PRESET_ID);
}

export function applyMedicineSlipPresetId(
  presetId: string,
  current?: Partial<Pick<MedicineSlipTemplate, 'sectionOrder' | 'hiddenSections' | 'visibleMedicineColumns'>>,
): MedicineSlipTemplate {
  const d = baseMedicineSlipTemplate();
  const patch = PRESET_PATCHES[presetId];
  const known = !!patch;
  return {
    ...d,
    ...(known ? patch : {}),
    presetId: known ? presetId : MEDICINE_SLIP_DEFAULT_PRESET_ID,
    sectionOrder: current?.sectionOrder ? [...current.sectionOrder] : d.sectionOrder,
    hiddenSections: current?.hiddenSections ? [...current.hiddenSections] : d.hiddenSections,
    visibleMedicineColumns: current?.visibleMedicineColumns
      ? [...current.visibleMedicineColumns]
      : (patch?.visibleMedicineColumns ?? d.visibleMedicineColumns),
  };
}

export function parseMedicineSlipTemplateJson(json: string | null | undefined): MedicineSlipTemplate {
  const base = baseMedicineSlipTemplate();
  if (!json?.trim()) return base;
  try {
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return base;
    const o = raw as Record<string, unknown>;
    const st = o['slipTitle'];
    const ft = o['footerText'];
    return {
      version: 1,
      presetId: pickPresetId(o['presetId']),
      sectionOrder: normalizeSectionOrder(o['sectionOrder']),
      hiddenSections: normalizeHidden(o['hiddenSections']),
      visibleMedicineColumns: normalizeColumns(o['visibleMedicineColumns']),
      slipTitle: typeof st === 'string' && st.trim() ? st.trim().slice(0, 200) : base.slipTitle,
      hospitalShowName: typeof o['hospitalShowName'] === 'boolean' ? o['hospitalShowName'] : true,
      hospitalShowCode: typeof o['hospitalShowCode'] === 'boolean' ? o['hospitalShowCode'] : true,
      hospitalShowAddress:
        typeof o['hospitalShowAddress'] === 'boolean' ? o['hospitalShowAddress'] : true,
      hospitalShowPhone: typeof o['hospitalShowPhone'] === 'boolean' ? o['hospitalShowPhone'] : true,
      hospitalShowEmail: typeof o['hospitalShowEmail'] === 'boolean' ? o['hospitalShowEmail'] : true,
      hospitalShowLogo: typeof o['hospitalShowLogo'] === 'boolean' ? o['hospitalShowLogo'] : false,
      logoPlacement: pickLogoPlacement(o['logoPlacement'], base.logoPlacement),
      logoMaxHeightPx: clampNum(o['logoMaxHeightPx'], 24, 120, base.logoMaxHeightPx),
      hospitalBlockAlign: pickAlign(o['hospitalBlockAlign'], base.hospitalBlockAlign),
      headerTextAlign: pickAlign(o['headerTextAlign'], base.headerTextAlign),
      bodySectionsAlign: pickAlign(o['bodySectionsAlign'], base.bodySectionsAlign),
      paddingTopMm: clampNum(o['paddingTopMm'], 0, 20, base.paddingTopMm),
      paddingRightMm: clampNum(o['paddingRightMm'], 0, 20, base.paddingRightMm),
      paddingBottomMm: clampNum(o['paddingBottomMm'], 0, 20, base.paddingBottomMm),
      paddingLeftMm: clampNum(o['paddingLeftMm'], 0, 20, base.paddingLeftMm),
      marginTopMm: clampNum(o['marginTopMm'], 0, 16, base.marginTopMm),
      marginRightMm: clampNum(o['marginRightMm'], 0, 16, base.marginRightMm),
      marginBottomMm: clampNum(o['marginBottomMm'], 0, 16, base.marginBottomMm),
      marginLeftMm: clampNum(o['marginLeftMm'], 0, 16, base.marginLeftMm),
      globalTextScale: clampNum(o['globalTextScale'], 0.75, 1.35, base.globalTextScale),
      fontFamily: pickFontFamily(o['fontFamily'], base.fontFamily),
      baseFontSizePx: clampNum(o['baseFontSizePx'], 8, 22, base.baseFontSizePx),
      titleFontSizePx: clampNum(o['titleFontSizePx'], 10, 32, base.titleFontSizePx),
      headingFontSizePx: clampNum(o['headingFontSizePx'], 8, 18, base.headingFontSizePx),
      tableFontSizePx: clampNum(o['tableFontSizePx'], 8, 18, base.tableFontSizePx),
      lineHeight: clampNum(o['lineHeight'], 1, 2.2, base.lineHeight),
      bodyColor: parseHexColor(o['bodyColor'], base.bodyColor),
      titleColor: parseHexColor(o['titleColor'], base.titleColor),
      mutedColor: parseHexColor(o['mutedColor'], base.mutedColor),
      borderColor: parseHexColor(o['borderColor'], base.borderColor),
      footerText:
        typeof ft === 'string' && ft.trim().length > 0 ? ft.trim().slice(0, 2000) : base.footerText,
      showTableGrid: typeof o['showTableGrid'] === 'boolean' ? o['showTableGrid'] : true,
    };
  } catch {
    return base;
  }
}

export function serializeMedicineSlipTemplate(t: MedicineSlipTemplate): string {
  return JSON.stringify(t);
}

export function visibleMedicineSlipSectionOrder(t: MedicineSlipTemplate): MedicineSlipSectionId[] {
  return t.sectionOrder.filter((id) => !t.hiddenSections.includes(id));
}

export function cloneMedicineSlipTemplate(t: MedicineSlipTemplate): MedicineSlipTemplate {
  return JSON.parse(JSON.stringify(t)) as MedicineSlipTemplate;
}
