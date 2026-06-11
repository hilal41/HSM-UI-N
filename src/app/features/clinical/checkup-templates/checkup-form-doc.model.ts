/** Form document stored in `schemaJson` (never edited as raw text in the UI). */

export type CheckupFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'radio';

export interface CheckupFormField {
  id: string;
  label: string;
  type: CheckupFieldType;
  required?: boolean;
  placeholder?: string;
  /** For select / radio — one option per line or comma-separated in the designer. */
  options?: string[];
}

export interface CheckupFormSection {
  id: string;
  title: string;
  collapsible?: boolean;
  fields: CheckupFormField[];
}

export interface CheckupFormDoc {
  version: number;
  profile?: string;
  description?: string;
  sections: CheckupFormSection[];
}

export const CHECKUP_FIELD_TYPE_OPTIONS: { value: CheckupFieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'number', label: 'Number' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio group' },
];

export function emptyCheckupFormDoc(): CheckupFormDoc {
  return { version: 2, sections: [] };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newEmptySection(): CheckupFormSection {
  return {
    id: newId('sec'),
    title: 'New section',
    collapsible: false,
    fields: [],
  };
}

export function newEmptyField(): CheckupFormField {
  return {
    id: newId('fld'),
    label: 'Question',
    type: 'text',
    required: false,
  };
}

/** Parse API `schemaJson` into a designer document; tolerates v1 library seed shape. */
export function parseCheckupFormDocFromSchemaJson(raw: string | null | undefined): CheckupFormDoc {
  if (raw == null || !String(raw).trim()) return emptyCheckupFormDoc();
  try {
    const o = JSON.parse(String(raw)) as CheckupFormDoc;
    if (!o || typeof o !== 'object') return emptyCheckupFormDoc();
    const sections = Array.isArray(o.sections) ? o.sections : [];
    const normalized: CheckupFormSection[] = sections.map((s: unknown, si: number) => {
      const sec = s as Partial<CheckupFormSection>;
      const fieldsRaw = Array.isArray(sec.fields) ? sec.fields : [];
      const fields: CheckupFormField[] = fieldsRaw.map((f: unknown, fi: number) => {
        const fl = f as Partial<CheckupFormField>;
        const type = (fl.type as CheckupFieldType) ?? 'text';
        const safeType: CheckupFieldType =
          type === 'textarea' ||
          type === 'number' ||
          type === 'checkbox' ||
          type === 'select' ||
          type === 'radio'
            ? type
            : 'text';
        return {
          id: typeof fl.id === 'string' && fl.id ? fl.id : newId('fld'),
          label: typeof fl.label === 'string' ? fl.label : `Field ${fi + 1}`,
          type: safeType,
          required: !!fl.required,
          placeholder: typeof fl.placeholder === 'string' ? fl.placeholder : undefined,
          options: Array.isArray(fl.options) ? fl.options.map(String) : undefined,
        };
      });
      return {
        id: typeof sec.id === 'string' && sec.id ? sec.id : newId('sec'),
        title: typeof sec.title === 'string' ? sec.title : `Section ${si + 1}`,
        collapsible: !!sec.collapsible,
        fields,
      };
    });
    return {
      version: typeof o.version === 'number' ? o.version : 2,
      profile: typeof o.profile === 'string' ? o.profile : undefined,
      description: typeof o.description === 'string' ? o.description : undefined,
      sections: normalized,
    };
  } catch {
    return emptyCheckupFormDoc();
  }
}

export function serializeCheckupFormDoc(doc: CheckupFormDoc): string {
  const out: CheckupFormDoc = {
    version: 2,
    profile: doc.profile,
    description: doc.description,
    sections: doc.sections.map((s) => ({
      id: s.id,
      title: s.title,
      collapsible: s.collapsible,
      fields: s.fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        options:
          f.type === 'select' || f.type === 'radio'
            ? (f.options ?? []).map((x) => String(x).trim()).filter(Boolean)
            : undefined,
      })),
    })),
  };
  return JSON.stringify(out);
}
