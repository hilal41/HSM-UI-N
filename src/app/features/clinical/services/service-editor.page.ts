import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize, of, switchMap } from 'rxjs';
import { ClinicalServicesApiService } from '../../../core/api/clinical-services-api.service';
import { ClinicalDepartmentsApiService } from '../../../core/api/clinical-departments-api.service';
import { DoctorsApiService } from '../../../core/api/doctors-api.service';
import { ServiceCategoriesApiService } from '../../../core/api/service-categories-api.service';
import type { Department, SaveLabTestParameterRequest } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { newClientId } from '../../../shared/utils/client-id.util';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { CLINICAL_CONSULTANCY_TYPE_OPTIONS } from './clinical-consultancy-types';

interface LabParamRow {
  key: string;
  code: string;
  name: string;
  unit: string;
  referenceRange: string;
  criticalLow: number | null;
  criticalHigh: number | null;
  sortOrder: number;
}

@Component({
  selector: 'app-service-editor-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    MessageModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    DatePickerModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './service-editor.page.html',
  styleUrl: './service-editor.page.scss',
})
export class ServiceEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ClinicalServicesApiService);
  private readonly categoriesApi = inject(ServiceCategoriesApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly departmentsApi = inject(ClinicalDepartmentsApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);

  readonly consultancyTypeOptions = CLINICAL_CONSULTANCY_TYPE_OPTIONS;

  loading = true;
  saving = false;
  loadError: string | null = null;
  editingId: number | null = null;

  categoryOptions: { label: string; value: number }[] = [];
  doctorOptions: { label: string; value: number }[] = [];
  departmentOptions: { label: string; value: number }[] = [];

  formCode = '';
  formTitle = '';
  formConsultancyType = 'OPD';
  formCategoryId: number | null = null;
  formDiscount = 0;
  formPrice = 0;
  formDoctorId: number | null = null;
  formDoctorShare = 0;
  formClearDoctor = false;
  formReportingTime: Date | null = null;
  formClearReportingTime = false;
  formCptCode = '';
  formDepartmentId: number | null = null;
  formClearDepartment = false;
  formDurationMinutes: number | null = null;
  formClearDurationMinutes = false;

  formSampleType = '';
  formLabUnit = '';
  formLabReferenceRange = '';
  formTurnaroundHours: number | null = null;
  formCriticalLow: number | null = null;
  formCriticalHigh: number | null = null;
  formMethod = '';
  formInstrument = '';
  formSampleVolume = '';
  formPreparationInstructions = '';
  formFastingRequired = false;
  formHomeCollection = false;
  formOutsourcedLab = '';
  formLabCptCode = '';
  formLoincCode = '';
  labParamRows: LabParamRow[] = [];

  get isCreateMode(): boolean {
    return this.editingId == null;
  }

  get isTestService(): boolean {
    return this.formConsultancyType === 'Test';
  }

  get consultancyTypeLabel(): string {
    return (
      this.consultancyTypeOptions.find((o) => o.value === this.formConsultancyType)?.label ??
      this.formConsultancyType
    );
  }

  get pageTitle(): string {
    return this.isCreateMode ? 'New Service' : 'Edit Service';
  }

  get pageSubtitle(): string {
    return 'OPD, IPD, lab tests, and other billable services';
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.editingId = idParam != null && /^\d+$/.test(idParam) ? Number(idParam) : null;

    this.loading = true;
    this.loadError = null;

    this.categoriesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        this.categoryOptions = res.items.map((c) => ({ label: c.name, value: c.id }));
        if (this.isCreateMode && this.formCategoryId == null) {
          this.formCategoryId = this.categoryOptions[0]?.value ?? null;
        }
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Categories',
          detail: 'Unable to load service categories.',
        });
      },
    });

    this.doctorsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        this.doctorOptions = res.items.map((d) => ({
          label: `${d.firstName} ${d.lastName} (${d.doctorNumber})`,
          value: d.id,
        }));
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Doctors',
          detail: 'Unable to load doctors for assignment.',
        });
      },
    });

    this.departmentsApi.getAll().subscribe({
      next: (list: Department[]) => {
        this.departmentOptions = list.map((d) => ({ label: d.name, value: d.id }));
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Departments',
          detail: 'Unable to load clinical departments.',
        });
      },
    });

    if (this.editingId == null) {
      this.loading = false;
      return;
    }

    this.api
      .getById(this.editingId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (row) => {
          this.formCode = row.code;
          this.formTitle = row.title;
          this.formConsultancyType = row.consultancyType || 'OPD';
          this.formCategoryId = row.serviceCategoryId;
          this.formDiscount = row.discount;
          this.formPrice = row.price;
          this.formDoctorId = row.doctorId ?? null;
          this.formDoctorShare = row.doctorShare;
          this.formClearDoctor = false;
          this.formReportingTime = row.reportingTime ? new Date(row.reportingTime) : null;
          this.formClearReportingTime = false;
          this.formCptCode = row.cptCode ?? '';
          this.formDepartmentId = row.departmentId ?? null;
          this.formClearDepartment = false;
          this.formDurationMinutes = row.durationMinutes ?? null;
          this.formClearDurationMinutes = false;
          if (this.formConsultancyType === 'Test') {
            this.loadLabProfile(this.editingId!);
          }
        },
        error: () => {
          this.loadError = 'Could not load service.';
        },
      });
  }

  addParamRow(): void {
    this.labParamRows = [
      ...this.labParamRows,
      {
        key: newClientId(),
        code: '',
        name: '',
        unit: '',
        referenceRange: '',
        criticalLow: null,
        criticalHigh: null,
        sortOrder: this.labParamRows.length + 1,
      },
    ];
  }

  removeParamRow(key: string): void {
    this.labParamRows = this.labParamRows.filter((r) => r.key !== key);
  }

  loadCbcTemplate(): void {
    this.formSampleType = 'Blood';
    this.labParamRows = [
      { key: newClientId(), code: 'HB', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '12-16', criticalLow: null, criticalHigh: null, sortOrder: 1 },
      { key: newClientId(), code: 'HCT', name: 'Hematocrit (HCT)', unit: '%', referenceRange: '36-48', criticalLow: null, criticalHigh: null, sortOrder: 2 },
      { key: newClientId(), code: 'RBC', name: 'Red Blood Cell Count (RBC)', unit: '10^6/uL', referenceRange: '4.2-5.4', criticalLow: null, criticalHigh: null, sortOrder: 3 },
      { key: newClientId(), code: 'WBC', name: 'White Blood Cell Count (WBC)', unit: '10^9/L', referenceRange: '4.0-10.0', criticalLow: null, criticalHigh: null, sortOrder: 4 },
      { key: newClientId(), code: 'PLT', name: 'Platelet Count (PLT)', unit: '10^9/L', referenceRange: '150-400', criticalLow: null, criticalHigh: null, sortOrder: 5 },
      { key: newClientId(), code: 'MCV', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', referenceRange: '80-100', criticalLow: null, criticalHigh: null, sortOrder: 6 },
      { key: newClientId(), code: 'MCH', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', referenceRange: '27-33', criticalLow: null, criticalHigh: null, sortOrder: 7 },
    ];
  }

  save(): void {
    if (!this.formCode.trim() || !this.formTitle.trim() || !this.formConsultancyType || this.formCategoryId == null) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Code, title, consultancy type, and category are required.',
      });
      return;
    }

    if (this.isTestService && this.labParamRows.some((r) => !r.code.trim() || !r.name.trim())) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Each lab parameter needs a code and name.',
      });
      return;
    }

    this.saving = true;
    const request$ =
      this.editingId == null
        ? this.api.create({
            code: this.formCode.trim(),
            title: this.formTitle.trim(),
            consultancyType: this.formConsultancyType,
            serviceCategoryId: this.formCategoryId,
            discount: this.formDiscount,
            price: this.formPrice,
            doctorShare: this.isTestService ? 0 : this.formDoctorShare,
            cptCode: this.formCptCode.trim() || null,
            departmentId: this.formDepartmentId,
            durationMinutes:
              this.formDurationMinutes != null && this.formDurationMinutes > 0
                ? this.formDurationMinutes
                : null,
            ...(this.isTestService
              ? { reportingTime: this.toReportingTimeIso() }
              : { doctorId: this.formDoctorId }),
            createdBy: this.session.user()?.id,
          })
        : this.api.update(this.editingId, {
            code: this.formCode.trim(),
            title: this.formTitle.trim(),
            consultancyType: this.formConsultancyType,
            serviceCategoryId: this.formCategoryId,
            discount: this.formDiscount,
            price: this.formPrice,
            cptCode: this.formCptCode.trim() || null,
            departmentId: this.formClearDepartment ? null : this.formDepartmentId,
            clearDepartment: this.formClearDepartment,
            durationMinutes: this.formClearDurationMinutes
              ? null
              : this.formDurationMinutes != null && this.formDurationMinutes > 0
                ? this.formDurationMinutes
                : null,
            clearDurationMinutes: this.formClearDurationMinutes,
            ...(this.isTestService
              ? {
                  reportingTime: this.formClearReportingTime ? null : this.toReportingTimeIso(),
                  clearReportingTime: this.formClearReportingTime,
                }
              : {
                  doctorId: this.formClearDoctor ? null : this.formDoctorId,
                  clearDoctor: this.formClearDoctor,
                  doctorShare: this.formDoctorShare,
                }),
          });

    request$
      .pipe(
        switchMap((saved) => {
          if (!this.isTestService) {
            return of(saved);
          }
          return this.api.saveLabProfile(saved.id, {
            sampleType: this.formSampleType.trim() || null,
            unit: this.formLabUnit.trim() || null,
            referenceRange: this.formLabReferenceRange.trim() || null,
            turnaroundHours: this.formTurnaroundHours != null && this.formTurnaroundHours > 0 ? this.formTurnaroundHours : null,
            criticalLow: this.formCriticalLow,
            criticalHigh: this.formCriticalHigh,
            method: this.formMethod.trim() || null,
            instrument: this.formInstrument.trim() || null,
            departmentId: this.formClearDepartment ? null : this.formDepartmentId,
            sampleVolume: this.formSampleVolume.trim() || null,
            preparationInstructions: this.formPreparationInstructions.trim() || null,
            fastingRequired: this.formFastingRequired,
            homeCollection: this.formHomeCollection,
            outsourcedLab: this.formOutsourcedLab.trim() || null,
            cptCode: this.formLabCptCode.trim() || null,
            loincCode: this.formLoincCode.trim() || null,
            parameters: this.buildParamPayload(),
          });
        }),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Service saved.' });
          void this.router.navigate(['/app/clinical/services']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: err?.error?.message ?? 'Could not save service.',
          });
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/app/clinical/services']);
  }

  private loadLabProfile(serviceId: number): void {
    this.api.getLabProfile(serviceId).subscribe({
      next: (profile) => {
        this.formSampleType = profile.sampleType ?? '';
        this.formLabUnit = profile.unit ?? '';
        this.formLabReferenceRange = profile.referenceRange ?? '';
        this.formTurnaroundHours = profile.turnaroundHours ?? null;
        this.formCriticalLow = profile.criticalLow ?? null;
        this.formCriticalHigh = profile.criticalHigh ?? null;
        this.formMethod = profile.method ?? '';
        this.formInstrument = profile.instrument ?? '';
        this.formSampleVolume = profile.sampleVolume ?? '';
        this.formPreparationInstructions = profile.preparationInstructions ?? '';
        this.formFastingRequired = profile.fastingRequired ?? false;
        this.formHomeCollection = profile.homeCollection ?? false;
        this.formOutsourcedLab = profile.outsourcedLab ?? '';
        this.formLabCptCode = profile.cptCode ?? '';
        this.formLoincCode = profile.loincCode ?? '';
        this.labParamRows = profile.parameters.map((p) => ({
          key: newClientId(),
          code: p.code,
          name: p.name,
          unit: p.unit ?? '',
          referenceRange: p.referenceRange ?? '',
          criticalLow: p.criticalLow ?? null,
          criticalHigh: p.criticalHigh ?? null,
          sortOrder: p.sortOrder,
        }));
      },
      error: () => {
        this.labParamRows = [];
      },
    });
  }

  private buildParamPayload(): SaveLabTestParameterRequest[] {
    return this.labParamRows
      .filter((r) => r.code.trim() && r.name.trim())
      .map((r, i) => ({
        code: r.code.trim(),
        name: r.name.trim(),
        unit: r.unit.trim() || null,
        referenceRange: r.referenceRange.trim() || null,
        criticalLow: r.criticalLow,
        criticalHigh: r.criticalHigh,
        sortOrder: r.sortOrder > 0 ? r.sortOrder : i + 1,
        isActive: true,
      }));
  }

  private toReportingTimeIso(): string | null {
    if (!this.formReportingTime) return null;
    return this.formReportingTime.toISOString();
  }
}
