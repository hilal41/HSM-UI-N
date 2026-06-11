import type { CheckupFieldType, CheckupFormDoc, CheckupFormField } from '../checkup-templates/checkup-form-doc.model';

export type CheckupFieldValue = string | number | boolean | null;

export interface CheckupResponsesDoc {
  version: number;
  fields: Record<string, { type: CheckupFieldType; value: CheckupFieldValue }>;
}

export function emptyFieldValues(doc: CheckupFormDoc): Record<string, CheckupFieldValue> {
  const out: Record<string, CheckupFieldValue> = {};
  for (const sec of doc.sections) {
    for (const f of sec.fields) {
      out[f.id] = defaultValueForType(f.type);
    }
  }
  return out;
}

function defaultValueForType(type: CheckupFieldType): CheckupFieldValue {
  if (type === 'checkbox') return false;
  if (type === 'number') return null;
  return '';
}

export function parseCheckupResponsesJson(
  raw: string | null | undefined,
  doc: CheckupFormDoc,
): Record<string, CheckupFieldValue> {
  const base = emptyFieldValues(doc);
  if (raw == null || !String(raw).trim()) return base;
  try {
    const o = JSON.parse(String(raw)) as CheckupResponsesDoc;
    const fields = o?.fields;
    if (!fields || typeof fields !== 'object') return base;
    for (const sec of doc.sections) {
      for (const f of sec.fields) {
        const entry = fields[f.id];
        if (entry == null) continue;
        base[f.id] = coerceValue(f, entry.value);
      }
    }
  } catch {
    /* ignore */
  }
  return base;
}

function coerceValue(field: CheckupFormField, raw: unknown): CheckupFieldValue {
  switch (field.type) {
    case 'checkbox':
      return raw === true || raw === 'true' || raw === 1;
    case 'number': {
      if (raw == null || raw === '') return null;
      const n = typeof raw === 'number' ? raw : Number(raw);
      return Number.isNaN(n) ? null : n;
    }
    default:
      return raw == null ? '' : String(raw);
  }
}

export function serializeCheckupResponses(
  doc: CheckupFormDoc,
  values: Record<string, CheckupFieldValue>,
): string {
  const fields: CheckupResponsesDoc['fields'] = {};
  for (const sec of doc.sections) {
    for (const f of sec.fields) {
      fields[f.id] = { type: f.type, value: values[f.id] ?? defaultValueForType(f.type) };
    }
  }
  const out: CheckupResponsesDoc = { version: 1, fields };
  return JSON.stringify(out);
}
