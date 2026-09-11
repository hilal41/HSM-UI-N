/** Client-side MRN preview (mirrors API MrnFormatHelper). */
export function previewMrn(
  format: string | null | undefined,
  hospitalCode: string,
  mrnPrefix: string | null | undefined,
  sequenceNumber: number,
  now: Date = new Date(),
): string {
  let template = (format ?? '').trim() || '{CODE}-{YYYY}-{#####}';
  const code = (hospitalCode ?? '').trim().toUpperCase();
  const prefix = (mrnPrefix ?? '').trim() ? (mrnPrefix ?? '').trim().toUpperCase() : code;
  const yyyy = String(now.getUTCFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');

  template = template
    .replace(/\{CODE\}/gi, code)
    .replace(/\{PREFIX\}/gi, prefix)
    .replace(/\{YYYY\}/gi, yyyy)
    .replace(/\{YY\}/gi, yy)
    .replace(/\{MM\}/gi, mm)
    .replace(/\{DD\}/gi, dd);

  return template.replace(/\{(#{1,8})\}/g, (_m, hashes: string) =>
    String(sequenceNumber).padStart(hashes.length, '0'),
  );
}

/**
 * NOTE: the option lists below are only for Developer/platform pages (hospital editor,
 * platform user forms). Hospital-admin configuration pages load their choices from the
 * database via the hospital-configuration API — do not import these lists there.
 */
export const HOSPITAL_TYPE_OPTIONS = [
  { label: 'General', value: 'General' },
  { label: 'Specialty', value: 'Specialty' },
  { label: 'Clinic', value: 'Clinic' },
  { label: 'Teaching', value: 'Teaching' },
  { label: 'Other', value: 'Other' },
];

export const HOSPITAL_SIZE_OPTIONS = [
  { label: 'Small', value: 'Small' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Large', value: 'Large' },
  { label: 'Enterprise', value: 'Enterprise' },
];

export const DATE_FORMAT_OPTIONS = [
  { label: 'dd/MM/yyyy', value: 'dd/MM/yyyy' },
  { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
  { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
];

export const TIME_FORMAT_OPTIONS = [
  { label: '24-hour (HH:mm)', value: 'HH:mm' },
  { label: '12-hour (hh:mm a)', value: 'hh:mm a' },
];

export const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Arabic', value: 'ar' },
];

export const CURRENCY_SYMBOL_OPTIONS = [
  { label: 'Rs (Rupee)', value: 'Rs' },
  { label: '$ (Dollar)', value: '$' },
  { label: 'AED', value: 'AED' },
  { label: 'SAR', value: 'SAR' },
  { label: '€ (Euro)', value: '€' },
  { label: '£ (Pound)', value: '£' },
];

export const TIME_ZONE_OPTIONS = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Asia/Karachi (PKT +5)', value: 'Asia/Karachi' },
  { label: 'Asia/Dubai (GST +4)', value: 'Asia/Dubai' },
  { label: 'Asia/Riyadh (AST +3)', value: 'Asia/Riyadh' },
  { label: 'Asia/Kolkata (IST +5:30)', value: 'Asia/Kolkata' },
  { label: 'Asia/Dhaka (BST +6)', value: 'Asia/Dhaka' },
  { label: 'Asia/Singapore (SGT +8)', value: 'Asia/Singapore' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Berlin (CET +1)', value: 'Europe/Berlin' },
  { label: 'America/New_York (EST -5)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST -8)', value: 'America/Los_Angeles' },
  { label: 'Australia/Sydney (AEST +10)', value: 'Australia/Sydney' },
];
