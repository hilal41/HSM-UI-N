import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import type { CheckupFormDoc, CheckupFormField, CheckupFormSection } from '../checkup-templates/checkup-form-doc.model';
import type { CheckupFieldValue } from './checkup-responses.model';

@Component({
  selector: 'app-doctor-checkup-form',
  imports: [
    FormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    CheckboxModule,
    SelectModule,
    RadioButtonModule,
  ],
  templateUrl: './doctor-checkup-form.component.html',
  styleUrl: './doctor-checkup-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorCheckupFormComponent {
  readonly formDoc = input.required<CheckupFormDoc>();
  readonly fieldValues = model.required<Record<string, CheckupFieldValue>>();

  sections(): CheckupFormSection[] {
    return this.formDoc().sections;
  }

  valueFor(field: CheckupFormField): CheckupFieldValue {
    return this.fieldValues()[field.id];
  }

  setValue(field: CheckupFormField, value: CheckupFieldValue): void {
    this.fieldValues.update((prev) => ({ ...prev, [field.id]: value }));
  }

  selectOptions(field: CheckupFormField): { label: string; value: string }[] {
    return (field.options ?? []).map((o) => ({ label: o, value: o }));
  }

  radioName(field: CheckupFormField): string {
    return `dcf-radio-${field.id}`;
  }
}
