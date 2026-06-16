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
import type { Hospital, Patient } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import {
  PatientRegistrationSlipComponent,
  type PatientRegistrationSlipLineVm,
} from '../../clinical/patient-registration/patient-registration-slip.component';
import {
  LOGO_PLACEMENT_OPTIONS,
  SLIP_ALIGN_OPTIONS,
  SLIP_FONT_OPTIONS,
  SLIP_PRESET_OPTIONS,
  SLIP_SECTION_IDS,
  SLIP_SECTION_LABELS,
  applySlipPresetId,
  type RegistrationSlipTemplate,
  type SlipSectionId,
  cloneRegistrationSlipTemplate,
  defaultRegistrationSlipTemplate,
  parseRegistrationSlipTemplateJson,
  serializeRegistrationSlipTemplate,
} from '../../clinical/patient-registration/registration-slip-template';

/** Tiny placeholder so the designer preview shows logo placement when the hospital has no logo yet. */
const DESIGNER_PREVIEW_LOGO_DATA_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="56" viewBox="0 0 96 56"><rect width="96" height="56" rx="8" fill="#059669"/><text x="48" y="34" text-anchor="middle" fill="#fff" font-size="13" font-family="system-ui,sans-serif">Logo</text></svg>`,
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

const SAMPLE_LINES: PatientRegistrationSlipLineVm[] = [
  {
    serviceTitle: 'General consultation',
    serviceCode: 'CONS-GEN',
    doctorName: 'Dr. Sample',
    servicePrice: 1500,
    serviceDiscount: 100,
    remarks: 'Follow-up in 1 week',
  },
  {
    serviceTitle: 'Blood panel',
    serviceCode: 'LAB-CBC',
    doctorName: 'Dr. Sample',
    servicePrice: 2200,
    serviceDiscount: 0,
    remarks: '',
  },
];

@Component({
  selector: 'app-registration-slip-designer-page',
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
    PatientRegistrationSlipComponent,
  ],
  templateUrl: './registration-slip-designer.page.html',
  styleUrl: './registration-slip-designer.page.scss',
})
export class RegistrationSlipDesignerPage implements OnInit {
  private readonly meApi = inject(MeApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  hospital: Hospital | null = null;
  draft: RegistrationSlipTemplate = defaultRegistrationSlipTemplate();

  readonly samplePatient = SAMPLE_PATIENT;
  readonly sampleLines = SAMPLE_LINES;
  readonly sampleRemarks = 'Sample visit remarks for preview.';
  readonly sampleTotal = SAMPLE_LINES.reduce((s, l) => s + l.servicePrice, 0);
  readonly sampleDiscount = SAMPLE_LINES.reduce((s, l) => s + l.serviceDiscount, 0);
  readonly sampleAge = 33;

  readonly sectionLabels = SLIP_SECTION_LABELS;
  readonly fontOptions = SLIP_FONT_OPTIONS;
  readonly presetOptions = SLIP_PRESET_OPTIONS;
  readonly alignOptions = SLIP_ALIGN_OPTIONS;
  readonly logoPlacementOptions = LOGO_PLACEMENT_OPTIONS;

  ngOnInit(): void {
    this.meApi
      .getMyHospital()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (h) => {
          this.hospital = h;
          this.draft = cloneRegistrationSlipTemplate(
            parseRegistrationSlipTemplateJson(h.registrationSlipTemplateJson),
          );
          this.syncLegacyPagePadding();
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
    if (SLIP_FONT_OPTIONS.some((o) => o.value === v)) {
      return SLIP_FONT_OPTIONS;
    }
    return [{ label: 'Custom (saved)', value: v }, ...SLIP_FONT_OPTIONS];
  }

  /** Hospital passed to the slip preview; uses a placeholder logo only in the designer when needed. */
  get previewHospital(): Hospital | null {
    if (!this.hospital) {
      return null;
    }
    const hasLogo = !!this.hospital.logoBase64?.trim();
    const wantLogo =
      this.draft.hospitalShowLogo &&
      this.draft.logoPlacement !== 'none' &&
      !hasLogo;
    if (!wantLogo) {
      return this.hospital;
    }
    return { ...this.hospital, logoBase64: DESIGNER_PREVIEW_LOGO_DATA_URL };
  }

  applyPreset(presetId: string): void {
    this.draft = cloneRegistrationSlipTemplate(
      applySlipPresetId(presetId, {
        sectionOrder: this.draft.sectionOrder,
        hiddenSections: this.draft.hiddenSections,
      }),
    );
    this.syncLegacyPagePadding();
    this.cdr.markForCheck();
  }

  isPresetActive(id: string): boolean {
    return this.draft.presetId === id;
  }

  private syncLegacyPagePadding(): void {
    const t = this.draft;
    t.pagePaddingMm = Math.round(
      (t.paddingTopMm + t.paddingRightMm + t.paddingBottomMm + t.paddingLeftMm) / 4,
    );
  }

  isSectionShown(id: SlipSectionId): boolean {
    return !this.draft.hiddenSections.includes(id);
  }

  setSectionShown(id: SlipSectionId, shown: boolean): void {
    const hidden = new Set(this.draft.hiddenSections);
    if (shown) {
      hidden.delete(id);
    } else {
      hidden.add(id);
    }
    this.draft.hiddenSections = SLIP_SECTION_IDS.filter((x) => hidden.has(x));
    this.cdr.markForCheck();
  }

  onSectionDrop(event: CdkDragDrop<SlipSectionId[]>): void {
    moveItemInArray(this.draft.sectionOrder, event.previousIndex, event.currentIndex);
    this.draft = { ...this.draft, sectionOrder: [...this.draft.sectionOrder] };
    this.cdr.markForCheck();
  }

  resetDefaults(): void {
    this.draft = defaultRegistrationSlipTemplate();
    this.syncLegacyPagePadding();
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.hospital) {
      return;
    }
    this.syncLegacyPagePadding();
    this.saving = true;
    this.meApi
      .updateMyHospital({
        registrationSlipTemplateJson: serializeRegistrationSlipTemplate(this.draft),
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (h) => {
          this.hospital = h;
          this.draft = cloneRegistrationSlipTemplate(
            parseRegistrationSlipTemplateJson(h.registrationSlipTemplateJson),
          );
          this.syncLegacyPagePadding();
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Registration slip design has been saved for your hospital.',
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: 'Could not save slip design.',
          });
          this.cdr.markForCheck();
        },
      });
  }
}
