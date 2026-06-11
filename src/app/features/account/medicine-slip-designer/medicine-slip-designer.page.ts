import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { MeApiService } from '../../../core/api/me-api.service';
import type {
  CheckupSaveResponse,
  Hospital,
  Patient,
  PatientVisitResponse,
} from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import type { CheckupFormDoc } from '../../clinical/checkup-templates/checkup-form-doc.model';
import { MedicineSlipComponent } from '../../clinical/doctor-checkup/medicine-slip.component';
import {
  MEDICINE_SLIP_ALIGN_OPTIONS,
  MEDICINE_SLIP_COLUMN_IDS,
  MEDICINE_SLIP_COLUMN_LABELS,
  MEDICINE_SLIP_FONT_OPTIONS,
  MEDICINE_SLIP_LOGO_PLACEMENT_OPTIONS,
  MEDICINE_SLIP_PRESET_OPTIONS,
  MEDICINE_SLIP_SECTION_IDS,
  MEDICINE_SLIP_SECTION_LABELS,
  applyMedicineSlipPresetId,
  cloneMedicineSlipTemplate,
  defaultMedicineSlipTemplate,
  parseMedicineSlipTemplateJson,
  serializeMedicineSlipTemplate,
  type MedicineSlipColumnId,
  type MedicineSlipSectionId,
  type MedicineSlipTemplate,
} from '../../clinical/doctor-checkup/medicine-slip-template';

const DESIGNER_PREVIEW_LOGO_DATA_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="56" viewBox="0 0 96 56"><rect width="96" height="56" rx="8" fill="#0f766e"/><text x="48" y="34" text-anchor="middle" fill="#fff" font-size="13" font-family="system-ui,sans-serif">Logo</text></svg>`,
  );

const SAMPLE_PATIENT: Patient = {
  id: 0,
  patientNumber: 'PR-0001',
  firstName: 'Ayesha',
  lastName: 'Khan',
  dateOfBirth: '1992-06-15',
  gender: 'Female',
  phone: '+92 300 0000000',
  address: '12 Hospital Road, City',
  status: 'Active',
  createdAt: new Date().toISOString(),
};

const SAMPLE_VISIT: PatientVisitResponse = {
  id: 14,
  hospitalId: 1,
  patientId: 0,
  totalAmount: 1500,
  discountAmount: 0,
  receivedAmount: 1500,
  remarks: 'Sample OPD visit',
  recordedByUserId: null,
  visitDate: new Date().toISOString(),
  isPrinted: false,
  createdAt: new Date().toISOString(),
  details: [],
};

const SAMPLE_CHECKUP: CheckupSaveResponse = {
  id: 101,
  patientVisitId: 14,
  checkupTemplateId: 1,
  responsesJson: JSON.stringify({
    version: 1,
    fields: {
      chestPain: { type: 'text', value: 'Mild chest pain on exertion' },
      dyspnea: { type: 'textarea', value: 'Shortness of breath while walking upstairs' },
      palpitations: { type: 'text', value: 'Occasional at night' },
      bp: { type: 'text', value: '130/85' },
      plan: { type: 'textarea', value: 'Continue medicines, low-salt diet, review reports next visit.' },
    },
  }),
  medicineNotes: 'Take medicine after meals. Drink plenty of water.',
  nextCheckupAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  medicines: [
    {
      id: 1,
      checkupId: 101,
      medicineId: 1,
      medicineUsageId: 1,
      medicineUsageShortCode: 'BID',
      medicineUsageDescription: 'Twice daily',
      medicineName: 'Amoxil',
      code: 'AMX00212',
      form: 'Capsule',
      strength: '500mg',
    },
    {
      id: 2,
      checkupId: 101,
      medicineId: 2,
      medicineUsageId: 2,
      medicineUsageShortCode: 'OD',
      medicineUsageDescription: 'Once daily',
      medicineName: 'Azomax',
      code: 'AZI00434',
      form: 'Tablet',
      strength: '250mg',
    },
  ],
};

const SAMPLE_CHECKUP_FORM_DOC: CheckupFormDoc = {
  version: 2,
  profile: 'Cardiology',
  sections: [
    {
      id: 'cardiac-symptoms',
      title: 'Cardiac symptoms',
      fields: [
        { id: 'chestPain', label: 'Chest pain / pressure', type: 'text' },
        { id: 'dyspnea', label: 'Dyspnea / orthopnea / PND', type: 'textarea' },
        { id: 'palpitations', label: 'Palpitations / syncope', type: 'text' },
      ],
    },
    {
      id: 'plan',
      title: 'Plan',
      fields: [
        { id: 'bp', label: 'BP', type: 'text' },
        { id: 'plan', label: 'Follow up plan', type: 'textarea' },
      ],
    },
  ],
};

@Component({
  selector: 'app-medicine-slip-designer-page',
  imports: [
    FormsModule,
    HmsBlockSkeletonComponent,
    SurfacePanelComponent,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    DragDropModule,
    MedicineSlipComponent,
  ],
  templateUrl: './medicine-slip-designer.page.html',
  styleUrl: './medicine-slip-designer.page.scss',
})
export class MedicineSlipDesignerPage implements OnInit {
  private readonly meApi = inject(MeApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  hospital: Hospital | null = null;
  draft: MedicineSlipTemplate = defaultMedicineSlipTemplate();

  readonly samplePatient = SAMPLE_PATIENT;
  readonly sampleVisit = SAMPLE_VISIT;
  readonly sampleCheckup = SAMPLE_CHECKUP;
  readonly sampleCheckupFormDoc = SAMPLE_CHECKUP_FORM_DOC;
  readonly sectionLabels = MEDICINE_SLIP_SECTION_LABELS;
  readonly columnLabels = MEDICINE_SLIP_COLUMN_LABELS;
  readonly sectionIds = MEDICINE_SLIP_SECTION_IDS;
  readonly columnIds = MEDICINE_SLIP_COLUMN_IDS;
  readonly fontOptions = MEDICINE_SLIP_FONT_OPTIONS;
  readonly presetOptions = MEDICINE_SLIP_PRESET_OPTIONS;
  readonly alignOptions = MEDICINE_SLIP_ALIGN_OPTIONS;
  readonly logoPlacementOptions = MEDICINE_SLIP_LOGO_PLACEMENT_OPTIONS;

  ngOnInit(): void {
    this.meApi
      .getMyHospital()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (h) => {
          this.hospital = h;
          this.draft = cloneMedicineSlipTemplate(
            parseMedicineSlipTemplateJson(h.medicineSlipTemplateJson),
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Hospital',
            detail: 'Could not load your hospital profile.',
          });
        },
      });
  }

  get fontChoices(): { label: string; value: string }[] {
    const v = this.draft.fontFamily;
    return MEDICINE_SLIP_FONT_OPTIONS.some((o) => o.value === v)
      ? MEDICINE_SLIP_FONT_OPTIONS
      : [{ label: 'Custom (saved)', value: v }, ...MEDICINE_SLIP_FONT_OPTIONS];
  }

  get previewHospital(): Hospital | null {
    if (!this.hospital) return null;
    const hasLogo = !!this.hospital.logoBase64?.trim();
    const wantLogo =
      this.draft.hospitalShowLogo &&
      this.draft.logoPlacement !== 'none' &&
      !hasLogo;
    return wantLogo ? { ...this.hospital, logoBase64: DESIGNER_PREVIEW_LOGO_DATA_URL } : this.hospital;
  }

  applyPreset(presetId: string): void {
    this.draft = cloneMedicineSlipTemplate(
      applyMedicineSlipPresetId(presetId, {
        sectionOrder: this.draft.sectionOrder,
        hiddenSections: this.draft.hiddenSections,
        visibleMedicineColumns: this.draft.visibleMedicineColumns,
      }),
    );
    this.cdr.markForCheck();
  }

  isPresetActive(id: string): boolean {
    return this.draft.presetId === id;
  }

  isSectionShown(id: MedicineSlipSectionId): boolean {
    return !this.draft.hiddenSections.includes(id);
  }

  setSectionShown(id: MedicineSlipSectionId, shown: boolean): void {
    const hidden = new Set(this.draft.hiddenSections);
    if (shown) hidden.delete(id);
    else hidden.add(id);
    this.draft.hiddenSections = MEDICINE_SLIP_SECTION_IDS.filter((x) => hidden.has(x));
    this.cdr.markForCheck();
  }

  isColumnShown(id: MedicineSlipColumnId): boolean {
    return this.draft.visibleMedicineColumns.includes(id);
  }

  setColumnShown(id: MedicineSlipColumnId, shown: boolean): void {
    const visible = new Set(this.draft.visibleMedicineColumns);
    if (shown) visible.add(id);
    else visible.delete(id);
    const next = MEDICINE_SLIP_COLUMN_IDS.filter((x) => visible.has(x));
    this.draft.visibleMedicineColumns = next.length > 0 ? next : ['medicineName'];
    this.cdr.markForCheck();
  }

  onSectionDrop(event: CdkDragDrop<MedicineSlipSectionId[]>): void {
    moveItemInArray(this.draft.sectionOrder, event.previousIndex, event.currentIndex);
    this.draft = { ...this.draft, sectionOrder: [...this.draft.sectionOrder] };
    this.cdr.markForCheck();
  }

  resetDefaults(): void {
    this.draft = defaultMedicineSlipTemplate();
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.hospital) return;
    this.saving = true;
    this.meApi
      .updateMyHospital({
        medicineSlipTemplateJson: serializeMedicineSlipTemplate(this.draft),
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (h) => {
          this.hospital = h;
          this.draft = cloneMedicineSlipTemplate(
            parseMedicineSlipTemplateJson(h.medicineSlipTemplateJson),
          );
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Medicine slip design has been saved for your hospital.',
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: 'Could not save medicine slip design.',
          });
          this.cdr.markForCheck();
        },
      });
  }
}
