import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import type {
  CheckupSaveResponse,
  Hospital,
  Patient,
  PatientVisitResponse,
} from '../../core/models/api-contracts';
import type { CheckupFormDoc } from '../../features/clinical/checkup-templates/checkup-form-doc.model';
import {
  MedicineSlipComponent,
} from '../../features/clinical/doctor-checkup/medicine-slip.component';
import {
  applyMedicineSlipPresetId,
  type MedicineSlipTemplate,
} from '../../features/clinical/doctor-checkup/medicine-slip-template';
import {
  PatientRegistrationSlipComponent,
  type PatientRegistrationSlipLineVm,
} from '../../features/clinical/patient-registration/patient-registration-slip.component';
import {
  applySlipPresetId,
  type RegistrationSlipTemplate,
} from '../../features/clinical/patient-registration/registration-slip-template';
import type { SlipPresetOption } from './slip-preset.util';

export type SlipGalleryKind = 'registration' | 'medicine';

@Component({
  selector: 'app-slip-template-gallery',
  imports: [ButtonModule, PatientRegistrationSlipComponent, MedicineSlipComponent],
  templateUrl: './slip-template-gallery.component.html',
  styleUrl: './slip-template-gallery.component.scss',
})
export class SlipTemplateGalleryComponent {
  @Input({ required: true }) kind!: SlipGalleryKind;
  @Input({ required: true }) presetOptions: SlipPresetOption[] = [];
  @Input({ required: true }) activePresetId = '';
  @Input({ required: true }) previewHospital: Hospital | null = null;

  @Input() regPatient: Patient | null = null;
  @Input() regLines: PatientRegistrationSlipLineVm[] = [];
  @Input() regRemarks = '';
  @Input() regTotal = 0;
  @Input() regDiscount = 0;
  @Input() regAge = 0;

  @Input() medPatient: Patient | null = null;
  @Input() medVisit: PatientVisitResponse | null = null;
  @Input() medCheckup: CheckupSaveResponse | null = null;
  @Input() medCheckupFormDoc: CheckupFormDoc | null = null;

  @Output() presetApply = new EventEmitter<string>();

  registrationPreview(presetId: string): RegistrationSlipTemplate {
    return applySlipPresetId(presetId);
  }

  medicinePreview(presetId: string): MedicineSlipTemplate {
    return applyMedicineSlipPresetId(presetId);
  }

  isActive(id: string): boolean {
    return this.activePresetId === id;
  }
}
