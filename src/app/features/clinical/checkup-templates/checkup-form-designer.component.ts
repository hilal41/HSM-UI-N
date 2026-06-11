import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  CHECKUP_FIELD_TYPE_OPTIONS,
  type CheckupFieldType,
  type CheckupFormDoc,
  type CheckupFormField,
  type CheckupFormSection,
  newEmptyField,
  newEmptySection,
} from './checkup-form-doc.model';

@Component({
  selector: 'app-checkup-form-designer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
  ],
  templateUrl: './checkup-form-designer.component.html',
  styleUrl: './checkup-form-designer.component.scss',
})
export class CheckupFormDesignerComponent {
  readonly doc = input.required<CheckupFormDoc>();
  readonly docChange = output<CheckupFormDoc>();
  /** Shown on the preview “slip” header. */
  readonly templateTitle = input<string>('');

  readonly fieldTypeOptions = CHECKUP_FIELD_TYPE_OPTIONS;

  private emit(next: CheckupFormDoc): void {
    this.docChange.emit({
      version: 2,
      profile: next.profile,
      description: next.description,
      sections: next.sections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined })),
      })),
    });
  }

  addSection(): void {
    const d = this.doc();
    this.emit({ ...d, sections: [...d.sections, newEmptySection()] });
  }

  removeSection(index: number): void {
    const d = this.doc();
    const sections = d.sections.filter((_, i) => i !== index);
    this.emit({ ...d, sections });
  }

  patchSectionTitle(index: number, title: string): void {
    const d = this.doc();
    const sections = d.sections.map((s, i) => (i === index ? { ...s, title } : s));
    this.emit({ ...d, sections });
  }

  addField(sectionIndex: number): void {
    const d = this.doc();
    const sections = d.sections.map((s, i) =>
      i === sectionIndex ? { ...s, fields: [...s.fields, newEmptyField()] } : s,
    );
    this.emit({ ...d, sections });
  }

  removeField(sectionIndex: number, fieldIndex: number): void {
    const d = this.doc();
    const sections = d.sections.map((s, i) =>
      i === sectionIndex ? { ...s, fields: s.fields.filter((_, j) => j !== fieldIndex) } : s,
    );
    this.emit({ ...d, sections });
  }

  patchField(sectionIndex: number, fieldIndex: number, patch: Partial<CheckupFormField>): void {
    const d = this.doc();
    const sections = d.sections.map((s, si) => {
      if (si !== sectionIndex) return s;
      const fields = s.fields.map((f, fi) => (fi === fieldIndex ? { ...f, ...patch } : f));
      return { ...s, fields };
    });
    this.emit({ ...d, sections });
  }

  onFieldTypeChange(sectionIndex: number, fieldIndex: number, type: CheckupFieldType): void {
    const patch: Partial<CheckupFormField> = { type };
    if (type !== 'select' && type !== 'radio') patch.options = undefined;
    if ((type === 'select' || type === 'radio') && !this.doc().sections[sectionIndex]?.fields[fieldIndex]?.options?.length) {
      patch.options = ['Option A', 'Option B'];
    }
    this.patchField(sectionIndex, fieldIndex, patch);
  }

  optionsText(sectionIndex: number, fieldIndex: number): string {
    const f = this.doc().sections[sectionIndex]?.fields[fieldIndex];
    return (f?.options ?? []).join('\n');
  }

  onOptionsTextChange(sectionIndex: number, fieldIndex: number, text: string): void {
    const options = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    this.patchField(sectionIndex, fieldIndex, { options: options.length ? options : undefined });
  }
}
