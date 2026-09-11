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
import { HospitalConfigurationApiService } from '../../../core/api/hospital-configuration-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import type { Hospital, Patient } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { SlipTemplateGalleryComponent } from '../../../shared/slip-designer/slip-template-gallery.component';
import {
  SLIP_CUSTOM_PRESET_ID,
  isKnownPresetId,
  markSlipPresetCustom,
  presetDisplayName,
} from '../../../shared/slip-designer/slip-preset.util';
import {
  PatientRegistrationSlipComponent,
  type PatientRegistrationSlipLineVm,
} from '../../clinical/patient-registration/patient-registration-slip.component';
import {
  LOGO_PLACEMENT_OPTIONS,
  SLIP_ALIGN_OPTIONS,
  SLIP_FONT_OPTIONS,
  SLIP_DEFAULT_PRESET_ID,
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="56" viewBox="0 0 96 56"><rect width="96" height="56" rx="8" fill="#2563eb"/><text x="48" y="34" text-anchor="middle" fill="#fff" font-size="13" font-family="system-ui,sans-serif">Logo</text></svg>`,
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
    SlipTemplateGalleryComponent,
  ],
  templateUrl: './registration-slip-designer.page.html',
  styleUrl: './registration-slip-designer.page.scss',
})
export class RegistrationSlipDesignerPage implements OnInit {
  private readonly meApi = inject(MeApiService);
  private readonly configApi = inject(HospitalConfigurationApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  hospital: Hospital | null = null;
  draft: RegistrationSlipTemplate = defaultRegistrationSlipTemplate();
  /** Last gallery preset applied in this session (for “Based on” when marked custom). */
  basedOnPresetId: string | null = null;

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
          this.basedOnPresetId = isKnownPresetId(this.draft.presetId, this.presetOptions)
            ? this.draft.presetId
            : null;
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
    this.basedOnPresetId = presetId;
    this.draft = cloneRegistrationSlipTemplate(
      applySlipPresetId(presetId, {
        sectionOrder: this.draft.sectionOrder,
        hiddenSections: this.draft.hiddenSections,
      }),
    );
    this.syncLegacyPagePadding();
    this.cdr.markForCheck();
  }

  onManualEdit(): void {
    if (this.draft.presetId !== SLIP_CUSTOM_PRESET_ID && isKnownPresetId(this.draft.presetId, this.presetOptions)) {
      this.basedOnPresetId = this.draft.presetId;
    }
    this.draft = markSlipPresetCustom(this.draft);
    this.cdr.markForCheck();
  }

  get layoutStatusLabel(): string {
    if (this.draft.presetId !== SLIP_CUSTOM_PRESET_ID) {
      return presetDisplayName(this.draft.presetId, this.presetOptions);
    }
    if (this.basedOnPresetId) {
      return `Based on: ${presetDisplayName(this.basedOnPresetId, this.presetOptions)}`;
    }
    return 'Custom layout';
  }

  get galleryActivePresetId(): string {
    if (this.draft.presetId !== SLIP_CUSTOM_PRESET_ID) {
      return this.draft.presetId;
    }
    return this.basedOnPresetId ?? '';
  }

  get canResetToTemplate(): boolean {
    return (
      this.draft.presetId !== SLIP_CUSTOM_PRESET_ID &&
      isKnownPresetId(this.draft.presetId, this.presetOptions)
    );
  }

  resetToTemplate(): void {
    if (!this.canResetToTemplate) {
      return;
    }
    this.applyPreset(this.draft.presetId);
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
    this.onManualEdit();
  }

  onSectionDrop(event: CdkDragDrop<SlipSectionId[]>): void {
    moveItemInArray(this.draft.sectionOrder, event.previousIndex, event.currentIndex);
    this.draft = { ...this.draft, sectionOrder: [...this.draft.sectionOrder] };
    this.onManualEdit();
  }

  resetDefaults(): void {
    this.draft = defaultRegistrationSlipTemplate();
    this.basedOnPresetId = SLIP_DEFAULT_PRESET_ID;
    this.syncLegacyPagePadding();
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.hospital) {
      return;
    }
    this.syncLegacyPagePadding();
    this.saving = true;
    const templateJson = serializeRegistrationSlipTemplate(this.draft);
    this.configApi
      .saveRegistrationSlip(templateJson)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.hospital = { ...this.hospital!, registrationSlipTemplateJson: templateJson };
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Registration slip design has been saved for your hospital.',
          });
          this.cdr.markForCheck();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: err?.error?.message ?? 'Could not save slip design.',
          });
          this.cdr.markForCheck();
        },
      });
  }
}
