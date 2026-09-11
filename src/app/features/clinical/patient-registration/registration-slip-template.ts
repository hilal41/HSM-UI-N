/** Stored in Hospital.registrationSlipTemplateJson (API) and used when printing the slip. */

import type { SlipPresetOption } from '../../../shared/slip-designer/slip-preset.util';
import { SLIP_CUSTOM_PRESET_ID } from '../../../shared/slip-designer/slip-preset.util';

export const SLIP_SECTION_IDS = [
  'hospital',
  'header',
  'patient',
  'services',
  'totals',
  'footer',
] as const;

export type SlipSectionId = (typeof SLIP_SECTION_IDS)[number];

export const SLIP_SECTION_LABELS: Record<SlipSectionId, string> = {
  hospital: 'Hospital details',
  header: 'Slip title & date',
  patient: 'Patient details',
  services: 'Services table',
  totals: 'Visit totals & remarks',
  footer: 'Footer / signature line',
};

export type SlipHorizontalAlign = 'left' | 'center' | 'right';

/** Where the logo sits relative to hospital text (when shown and image exists). */
export type LogoPlacement = 'none' | 'inline-start' | 'inline-end' | 'above-center';

export const SLIP_DEFAULT_PRESET_ID = 'modern-clinical';

/** Five modern preset bundles — pick one, then customize and save. */
export const SLIP_PRESET_OPTIONS: SlipPresetOption[] = [
  {
    id: 'modern-clinical',
    name: 'Modern Clinical',
    blurb: 'Teal accents, logo left, clean grid — recommended for most hospitals.',
    recommended: true,
  },
  {
    id: 'clean-center',
    name: 'Clean Center',
    blurb: 'Centered hospital block, logo above, airy margins for clinic branding.',
  },
  {
    id: 'professional-formal',
    name: 'Professional Formal',
    blurb: 'Serif letterhead, strong rules, formal signature footer.',
  },
  {
    id: 'compact-receipt',
    name: 'Compact Receipt',
    blurb: 'Tight spacing and smaller type — counter or thermal printers.',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    blurb: 'Soft muted palette, no table grid, generous whitespace.',
  },
];

const SLIP_PRESET_PATCHES: Record<string, Partial<RegistrationSlipTemplate>> = {
  'modern-clinical': {
    presetId: 'modern-clinical',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: true,
    logoPlacement: 'inline-start',
    logoMaxHeightPx: 48,
    globalTextScale: 1,
    paddingTopMm: 6,
    paddingRightMm: 6,
    paddingBottomMm: 6,
    paddingLeftMm: 6,
    marginTopMm: 0,
    marginRightMm: 0,
    marginBottomMm: 0,
    marginLeftMm: 0,
    baseFontSizePx: 12,
    titleFontSizePx: 18,
    headingFontSizePx: 10,
    tableFontSizePx: 11,
    lineHeight: 1.35,
    bodyColor: '#0f172a',
    titleColor: '#0f766e',
    mutedColor: '#64748b',
    borderColor: '#e2e8f0',
    showTableGrid: true,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  'clean-center': {
    presetId: 'clean-center',
    hospitalBlockAlign: 'center',
    headerTextAlign: 'center',
    bodySectionsAlign: 'center',
    hospitalShowLogo: true,
    logoPlacement: 'above-center',
    logoMaxHeightPx: 56,
    globalTextScale: 1.04,
    paddingTopMm: 8,
    paddingRightMm: 8,
    paddingBottomMm: 8,
    paddingLeftMm: 8,
    marginTopMm: 1,
    marginRightMm: 1,
    marginBottomMm: 1,
    marginLeftMm: 1,
    baseFontSizePx: 12,
    titleFontSizePx: 22,
    headingFontSizePx: 10,
    tableFontSizePx: 11,
    lineHeight: 1.45,
    bodyColor: '#0f172a',
    titleColor: '#0f172a',
    mutedColor: '#64748b',
    borderColor: '#e2e8f0',
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
    globalTextScale: 1,
    paddingTopMm: 7,
    paddingRightMm: 7,
    paddingBottomMm: 7,
    paddingLeftMm: 7,
    fontFamily: 'Georgia, "Times New Roman", serif',
    borderColor: '#94a3b8',
    bodyColor: '#1e293b',
    titleColor: '#0f172a',
    mutedColor: '#64748b',
    baseFontSizePx: 12,
    titleFontSizePx: 19,
    headingFontSizePx: 10,
    tableFontSizePx: 11,
    showTableGrid: true,
    footerText:
      'This document is issued by the hospital registration desk.\nAuthorized signature: _________________________________',
  },
  'compact-receipt': {
    presetId: 'compact-receipt',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: false,
    logoPlacement: 'none',
    globalTextScale: 0.92,
    paddingTopMm: 3,
    paddingRightMm: 3,
    paddingBottomMm: 3,
    paddingLeftMm: 3,
    baseFontSizePx: 10,
    titleFontSizePx: 14,
    headingFontSizePx: 9,
    tableFontSizePx: 9,
    lineHeight: 1.25,
    showTableGrid: true,
  },
  'minimal-white': {
    presetId: 'minimal-white',
    hospitalBlockAlign: 'left',
    headerTextAlign: 'left',
    bodySectionsAlign: 'left',
    hospitalShowLogo: false,
    logoPlacement: 'none',
    globalTextScale: 1,
    paddingTopMm: 10,
    paddingRightMm: 10,
    paddingBottomMm: 10,
    paddingLeftMm: 10,
    borderColor: '#f1f5f9',
    bodyColor: '#334155',
    titleColor: '#334155',
    mutedColor: '#64748b',
    showTableGrid: false,
    baseFontSizePx: 13,
    titleFontSizePx: 17,
    headingFontSizePx: 9,
    tableFontSizePx: 11,
    lineHeight: 1.5,
  },
};

export const SLIP_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'System UI', value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { label: 'Segoe UI / Arial', value: '"Segoe UI", Arial, Helvetica, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Calibri / sans', value: 'Calibri, "Segoe UI", Candara, sans-serif' },
  { label: 'Courier (monospace)', value: '"Courier New", Courier, monospace' },
];

export interface RegistrationSlipTemplate {
  version: 1;
  /** Last selected built-in preset id, or "custom" after manual edits. */
  presetId: string;
  sectionOrder: SlipSectionId[];
  hiddenSections: SlipSectionId[];
  slipTitle: string;
  hospitalShowName: boolean;
  hospitalShowCode: boolean;
  hospitalShowAddress: boolean;
  hospitalShowPhone: boolean;
  hospitalShowEmail: boolean;
  hospitalShowLogo: boolean;
  logoPlacement: LogoPlacement;
  logoMaxHeightPx: number;
  hospitalBlockAlign: SlipHorizontalAlign;
  headerTextAlign: SlipHorizontalAlign;
  bodySectionsAlign: SlipHorizontalAlign;
  paddingTopMm: number;
  paddingRightMm: number;
  paddingBottomMm: number;
  paddingLeftMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  /** Multiplier applied to all font sizes (0.75–1.35). */
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
  /** @deprecated Use padding*Mm; kept for JSON backward compatibility. */
  pagePaddingMm: number;
  footerText: string;
  showTableGrid: boolean;
}

const DEFAULT_FOOTER =
  'This slip is generated from the registration screen.\nSignature: _________________________________';

function clampNum(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function parseHexColor(v: unknown, fallback: string): string {
  if (typeof v !== 'string') {
    return fallback;
  }
  const s = v.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s)) {
    return s;
  }
  return fallback;
}

function pickAlign(v: unknown, fallback: SlipHorizontalAlign): SlipHorizontalAlign {
  if (v === 'left' || v === 'center' || v === 'right') {
    return v;
  }
  return fallback;
}

function pickLogoPlacement(v: unknown, fallback: LogoPlacement): LogoPlacement {
  if (v === 'none' || v === 'inline-start' || v === 'inline-end' || v === 'above-center') {
    return v;
  }
  // legacy / invalid
  if (v === 'left') {
    return 'inline-start';
  }
  if (v === 'right') {
    return 'inline-end';
  }
  return fallback;
}

function pickPresetId(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) {
    return SLIP_CUSTOM_PRESET_ID;
  }
  const id = v.trim().slice(0, 40);
  return SLIP_PRESET_OPTIONS.some((p) => p.id === id) ? id : SLIP_CUSTOM_PRESET_ID;
}

function baseRegistrationSlipTemplate(): RegistrationSlipTemplate {
  const pad = 6;
  return {
    version: 1,
    presetId: SLIP_DEFAULT_PRESET_ID,
    sectionOrder: [...SLIP_SECTION_IDS],
    hiddenSections: [],
    slipTitle: 'Patient registration slip',
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
    fontFamily: SLIP_FONT_OPTIONS[0].value,
    baseFontSizePx: 12,
    titleFontSizePx: 18,
    headingFontSizePx: 10,
    tableFontSizePx: 11,
    lineHeight: 1.35,
    bodyColor: '#0f172a',
    titleColor: '#042f2e',
    mutedColor: '#64748b',
    borderColor: '#e2e8f0',
    pagePaddingMm: pad,
    footerText: DEFAULT_FOOTER,
    showTableGrid: true,
  };
}

export function defaultRegistrationSlipTemplate(): RegistrationSlipTemplate {
  return applySlipPresetId(SLIP_DEFAULT_PRESET_ID);
}

export const SLIP_ALIGN_OPTIONS: { label: string; value: SlipHorizontalAlign }[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

export const LOGO_PLACEMENT_OPTIONS: { label: string; value: LogoPlacement }[] = [
  { label: 'No logo on slip', value: 'none' },
  { label: 'Logo left (inline with text)', value: 'inline-start' },
  { label: 'Logo right (inline with text)', value: 'inline-end' },
  { label: 'Logo above (centered)', value: 'above-center' },
];

/** Apply a built-in preset; keeps current section order & visibility when `current` is passed. */
export function applySlipPresetId(
  presetId: string,
  current?: Pick<RegistrationSlipTemplate, 'sectionOrder' | 'hiddenSections'>,
): RegistrationSlipTemplate {
  const d = baseRegistrationSlipTemplate();
  const patch = SLIP_PRESET_PATCHES[presetId];
  const known = !!patch;
  const p = known ? patch! : {};
  return {
    ...d,
    ...p,
    presetId: known ? presetId : SLIP_DEFAULT_PRESET_ID,
    sectionOrder: current?.sectionOrder ? [...current.sectionOrder] : d.sectionOrder,
    hiddenSections: current?.hiddenSections ? [...current.hiddenSections] : d.hiddenSections,
  };
}

function isSlipSectionId(v: string): v is SlipSectionId {
  return (SLIP_SECTION_IDS as readonly string[]).includes(v);
}

function normalizeSectionOrder(order: unknown): SlipSectionId[] {
  const next: SlipSectionId[] = [];
  if (Array.isArray(order)) {
    for (const id of order) {
      if (typeof id === 'string' && isSlipSectionId(id) && !next.includes(id)) {
        next.push(id);
      }
    }
  }
  for (const id of SLIP_SECTION_IDS) {
    if (!next.includes(id)) {
      next.push(id);
    }
  }
  return next;
}

function normalizeHidden(raw: unknown): SlipSectionId[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: SlipSectionId[] = [];
  for (const id of raw) {
    if (typeof id === 'string' && isSlipSectionId(id) && !out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

function pickFontFamily(v: unknown, fallback: string): string {
  if (typeof v !== 'string' || !v.trim()) {
    return fallback;
  }
  const t = v.trim();
  if (t.length > 400) {
    return fallback;
  }
  return t;
}

export function parseRegistrationSlipTemplateJson(json: string | null | undefined): RegistrationSlipTemplate {
  const base = baseRegistrationSlipTemplate();
  if (!json || !json.trim()) {
    return base;
  }
  try {
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== 'object') {
      return base;
    }
    const o = raw as Record<string, unknown>;
    const sectionOrder = normalizeSectionOrder(o['sectionOrder']);
    const hiddenSections = normalizeHidden(o['hiddenSections']);
    const st = o['slipTitle'];
    const slipTitle =
      typeof st === 'string' && st.trim().length > 0 ? st.trim().slice(0, 200) : base.slipTitle;
    const ft = o['footerText'];
    const footerText =
      typeof ft === 'string' && ft.trim().length > 0
        ? ft.trim().slice(0, 2000)
        : base.footerText;

    const legacyPad = clampNum(o['pagePaddingMm'], 0, 24, base.pagePaddingMm);
    const pt = o['paddingTopMm'];
    const pr = o['paddingRightMm'];
    const pb = o['paddingBottomMm'];
    const pl = o['paddingLeftMm'];
    const paddingTopMm =
      typeof pt === 'number' && !Number.isNaN(pt) ? clampNum(pt, 0, 20, legacyPad) : legacyPad;
    const paddingRightMm =
      typeof pr === 'number' && !Number.isNaN(pr) ? clampNum(pr, 0, 20, legacyPad) : legacyPad;
    const paddingBottomMm =
      typeof pb === 'number' && !Number.isNaN(pb) ? clampNum(pb, 0, 20, legacyPad) : legacyPad;
    const paddingLeftMm =
      typeof pl === 'number' && !Number.isNaN(pl) ? clampNum(pl, 0, 20, legacyPad) : legacyPad;

    return {
      version: 1,
      presetId: pickPresetId(o['presetId']),
      sectionOrder,
      hiddenSections,
      slipTitle,
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
      paddingTopMm,
      paddingRightMm,
      paddingBottomMm,
      paddingLeftMm,
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
      pagePaddingMm: legacyPad,
      footerText,
      showTableGrid: typeof o['showTableGrid'] === 'boolean' ? o['showTableGrid'] : true,
    };
  } catch {
    return base;
  }
}

export function serializeRegistrationSlipTemplate(t: RegistrationSlipTemplate): string {
  return JSON.stringify(t);
}

export function visibleSlipSectionOrder(t: RegistrationSlipTemplate): SlipSectionId[] {
  return t.sectionOrder.filter((id) => !t.hiddenSections.includes(id));
}

export function cloneRegistrationSlipTemplate(t: RegistrationSlipTemplate): RegistrationSlipTemplate {
  return JSON.parse(JSON.stringify(t)) as RegistrationSlipTemplate;
}
