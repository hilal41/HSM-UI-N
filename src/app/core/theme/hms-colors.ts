/**
 * HMS palette — keep in sync with :root tokens in styles.css.
 * Primary = hospital blue; success = clinical green (status only).
 */
export const HMS_COLORS = {
  surface: '#ffffff',
  canvas: '#f8fafc',
  primary: '#2563eb',
  primaryBright: '#3b82f6',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  nav: '#1e3a8a',
  success: '#059669',
  successBright: '#10b981',
  successHover: '#047857',
  successLight: '#ecfdf5',
  warnLight: '#fffbeb',
  warn: '#b45309',
  dangerLight: '#fef2f2',
  danger: '#b91c1c',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  border: '#e8eef6',
  borderInput: '#cbd5e1',
  /** Module accents — stat tiles, chart series */
  accentClinical: '#2563eb',
  accentLab: '#7c3aed',
  accentPharmacy: '#059669',
  accentBilling: '#d97706',
  accentAdmin: '#64748b',
  /** Dashboard charts — primary series (brand blue) and secondary (neutral gray). */
  chartPrimary: 'rgba(37, 99, 235, 0.85)',
  chartPrimaryBar: 'rgba(37, 99, 235, 0.75)',
  chartSecondary: 'rgba(148, 163, 184, 0.55)',
  chartSuccess: 'rgba(5, 150, 105, 0.85)',
  chartLab: 'rgba(124, 58, 237, 0.85)',
  chartPharmacy: 'rgba(5, 150, 105, 0.75)',
  chartBilling: 'rgba(217, 119, 6, 0.85)',
} as const;
