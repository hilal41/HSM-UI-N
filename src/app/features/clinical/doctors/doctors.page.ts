import { ChangeDetectorRef, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { ClinicalDepartmentsApiService } from '../../../core/api/clinical-departments-api.service';
import { DoctorsApiService } from '../../../core/api/doctors-api.service';
import type { Department, Doctor, DoctorImportResult } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { DoctorAvailabilityCellComponent } from '../../../shared/components/doctor-availability-cell/doctor-availability-cell.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import {
  apiErrorMessage,
  CrudDialogState,
  CrudListState,
} from '../../../shared/utils/crud-page.state';
import {
  availabilityDaysFromRaw,
  createDefaultAvailabilityDays,
  serializeAvailabilityDays,
  type DoctorAvailabilityDay,
} from '../../../shared/utils/doctor-availability.util';

function parseIsoDateLocal(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toLocalIsoDate(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Component({
  selector: 'app-doctors-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    DoctorAvailabilityCellComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './doctors.page.html',
})
export class DoctorsPage {
  private readonly api = inject(DoctorsApiService);
  private readonly departmentsApi = inject(ClinicalDepartmentsApiService);
  private readonly session = inject(AuthSessionService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly doctorImportInput = viewChild<ElementRef<HTMLInputElement>>('doctorImport');

  readonly list = new CrudListState<Doctor>(20);
  readonly dialog = new CrudDialogState();

  get rows(): Doctor[] {
    return this.list.rows;
  }
  get totalCount(): number {
    return this.list.totalCount;
  }
  get loading(): boolean {
    return this.list.loading;
  }
  get errorMessage(): string | null {
    return this.list.errorMessage;
  }
  get pageSize(): number {
    return this.list.pageSize;
  }
  get dialogOpen(): boolean {
    return this.dialog.open;
  }
  set dialogOpen(v: boolean) {
    this.dialog.open = v;
  }
  get saving(): boolean {
    return this.dialog.saving;
  }
  set saving(v: boolean) {
    this.dialog.saving = v;
  }
  get editingId(): number | null {
    return this.dialog.editingId;
  }
  set editingId(v: number | null) {
    this.dialog.editingId = v;
  }

  exportingExcel = false;
  importingExcel = false;

  departmentOptions: { label: string; value: number }[] = [];

  formDoctorNumber = '';
  formFirstName = '';
  formLastName = '';
  formSpecialization = '';
  formDepartmentId: number | null = null;
  formLicense = '';
  formPhone = '';
  formEmail = '';
  formAvailabilityDays: DoctorAvailabilityDay[] = createDefaultAvailabilityDays();
  formQualification = '';
  formYears: number | null = null;
  formStatus = 'Active';
  formMedicalCouncilRegistration = '';
  formSpecialityCode = '';
  formEmploymentType: string | null = null;
  formJoiningDate: Date | null = null;
  formLeavingDate: Date | null = null;
  formSignatureBase64: string | null = null;

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  readonly employmentTypeOptions = [
    { label: 'Full time', value: 'FullTime' },
    { label: 'Part time', value: 'PartTime' },
    { label: 'Visiting', value: 'Visiting' },
    { label: 'Consultant', value: 'Consultant' },
  ];

  constructor() {
    this.departmentsApi.getAll().subscribe({
      next: (list) =>
        (this.departmentOptions = list.map((d: Department) => ({
          label: d.name,
          value: d.id,
        }))),
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Departments',
          detail: 'Unable to load departments for the doctor form.',
        });
      },
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const { page, pageSize } = this.list.syncLazyEvent(event);
    this.list.beginLoad();
    this.api
      .getPaged({ page, pageSize })
      .pipe(finalize(() => (this.list.loading = false)))
      .subscribe({
        next: (res) => {
          this.list.applySuccess(res.items, res.totalCount);
          this.cdr.markForCheck();
        },
        error: () => {
          this.list.applyError('Unable to load doctors.');
          this.cdr.markForCheck();
        },
      });
  }

  openCreate(): void {
    this.dialog.beginCreate();
    this.formDoctorNumber = '';
    this.formFirstName = '';
    this.formLastName = '';
    this.formSpecialization = '';
    this.formDepartmentId = this.departmentOptions[0]?.value ?? null;
    this.formLicense = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formAvailabilityDays = createDefaultAvailabilityDays();
    this.formQualification = '';
    this.formYears = null;
    this.formStatus = 'Active';
    this.formMedicalCouncilRegistration = '';
    this.formSpecialityCode = '';
    this.formEmploymentType = null;
    this.formJoiningDate = null;
    this.formLeavingDate = null;
    this.formSignatureBase64 = null;
  }

  openEdit(row: Doctor): void {
    this.dialog.beginEdit(row.id);
    this.formDoctorNumber = row.doctorNumber;
    this.formFirstName = row.firstName;
    this.formLastName = row.lastName;
    this.formSpecialization = row.specialization;
    this.formDepartmentId = row.departmentId;
    this.formLicense = row.licenseNumber;
    this.formPhone = row.phone ?? '';
    this.formEmail = row.email ?? '';
    this.formAvailabilityDays = availabilityDaysFromRaw(row.availability);
    this.formQualification = row.qualification ?? '';
    this.formYears = row.yearsOfExperience ?? null;
    this.formStatus = row.status;
    this.formMedicalCouncilRegistration = row.medicalCouncilRegistration ?? '';
    this.formSpecialityCode = row.specialityCode ?? '';
    this.formEmploymentType = row.employmentType ?? null;
    this.formJoiningDate = parseIsoDateLocal(row.joiningDate);
    this.formLeavingDate = parseIsoDateLocal(row.leavingDate);
    this.formSignatureBase64 = row.signatureBase64 ?? row.signatureUrl ?? null;
  }

  onSignatureSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.messages.add({ severity: 'warn', summary: 'Signature', detail: 'Please select an image file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.formSignatureBase64 = typeof reader.result === 'string' ? reader.result : null;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  clearSignature(): void {
    this.formSignatureBase64 = '';
  }

  closeDialog(): void {
    this.dialog.close();
  }

  save(): void {
    const uid = this.session.user()?.id;
    if (this.editingId == null && (uid == null || uid < 1)) {
      this.messages.add({
        severity: 'error',
        summary: 'Session',
        detail: 'Signed-in user id missing; cannot create doctor.',
      });
      return;
    }
    if (
      !this.formDoctorNumber.trim() ||
      !this.formFirstName.trim() ||
      !this.formLastName.trim() ||
      !this.formSpecialization.trim() ||
      this.formDepartmentId == null ||
      !this.formLicense.trim()
    ) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Fill all required fields.' });
      return;
    }
    if (!this.formAvailabilityDays.some((day) => day.enabled)) {
      this.messages.add({
        severity: 'warn',
        summary: 'Availability',
        detail: 'Select at least one available day for this doctor.',
      });
      return;
    }
    this.saving = true;
    const availability = serializeAvailabilityDays(this.formAvailabilityDays);
    if (this.editingId == null) {
      this.api
        .create({
          doctorNumber: this.formDoctorNumber.trim(),
          firstName: this.formFirstName.trim(),
          lastName: this.formLastName.trim(),
          specialization: this.formSpecialization.trim(),
          departmentId: this.formDepartmentId,
          licenseNumber: this.formLicense.trim(),
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          availability: availability ?? '',
          qualification: this.formQualification.trim() || null,
          yearsOfExperience: this.formYears,
          status: this.formStatus,
          medicalCouncilRegistration: this.formMedicalCouncilRegistration.trim() || null,
          specialityCode: this.formSpecialityCode.trim() || null,
          employmentType: this.formEmploymentType || null,
          joiningDate: toLocalIsoDate(this.formJoiningDate),
          leavingDate: toLocalIsoDate(this.formLeavingDate),
          signatureBase64: this.formSignatureBase64 || null,
          createdBy: uid!,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Doctor saved.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorMessage(err, 'Create failed.'),
            });
          },
        });
    } else {
      this.api
        .update(this.editingId, {
          doctorNumber: this.formDoctorNumber.trim(),
          firstName: this.formFirstName.trim(),
          lastName: this.formLastName.trim(),
          specialization: this.formSpecialization.trim(),
          departmentId: this.formDepartmentId,
          licenseNumber: this.formLicense.trim(),
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          availability,
          qualification: this.formQualification.trim() || null,
          yearsOfExperience: this.formYears,
          status: this.formStatus,
          medicalCouncilRegistration: this.formMedicalCouncilRegistration.trim() || null,
          specialityCode: this.formSpecialityCode.trim() || null,
          employmentType: this.formEmploymentType || null,
          joiningDate: toLocalIsoDate(this.formJoiningDate),
          leavingDate: toLocalIsoDate(this.formLeavingDate),
          signatureBase64: this.formSignatureBase64,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Doctor saved.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorMessage(err, 'Update failed.'),
            });
          },
        });
    }
  }

  reloadTable(): void {
    this.list.beginLoad();
    this.api
      .getPaged({ page: 1, pageSize: this.pageSize })
      .pipe(finalize(() => (this.list.loading = false)))
      .subscribe({
        next: (res) => {
          this.list.applySuccess(res.items, res.totalCount);
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck(),
      });
  }

  exportExcel(): void {
    this.exportingExcel = true;
    this.api
      .exportExcel()
      .pipe(finalize(() => (this.exportingExcel = false)))
      .subscribe({
        next: (blob) => {
          const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `doctors-${stamp}.xlsx`;
          a.click();
          URL.revokeObjectURL(url);
          this.messages.add({ severity: 'success', summary: 'Export', detail: 'Excel file downloaded.' });
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: 'Export failed', detail: 'Could not download Excel.' });
          this.cdr.markForCheck();
        },
      });
  }

  openImportPicker(): void {
    this.doctorImportInput()?.nativeElement.click();
  }

  onImportFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const u = this.session.user();
    if (u?.hospitalId == null || u.hospitalId <= 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Hospital required',
        detail: 'Sign in with a hospital user to import doctors.',
      });
      return;
    }

    this.importingExcel = true;
    this.api
      .importExcel(file)
      .pipe(finalize(() => (this.importingExcel = false)))
      .subscribe({
        next: (res: DoctorImportResult) => {
          this.messages.add({
            severity: res.failed > 0 ? 'warn' : 'success',
            summary: 'Import finished',
            detail: `Created ${res.created}, updated ${res.updated}, failed ${res.failed}.`,
          });
          this.reloadTable();
          this.cdr.markForCheck();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Import failed',
            detail: err?.error?.message ?? 'Upload or parse failed.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  confirmDelete(row: Doctor): void {
    this.confirm.confirm({
      message: `Delete doctor ${row.firstName} ${row.lastName}?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Doctor removed.' });
            this.reloadTable();
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' });
          },
        });
      },
    });
  }
}
