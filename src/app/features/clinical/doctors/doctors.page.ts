import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
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
import type { Department, Doctor } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import {
  availabilityDaysFromRaw,
  availabilitySummary,
  createDefaultAvailabilityDays,
  serializeAvailabilityDays,
  type DoctorAvailabilityDay,
} from '../../../shared/utils/doctor-availability.util';

@Component({
  selector: 'app-doctors-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
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

  rows: Doctor[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;

  departmentOptions: { label: string; value: number }[] = [];
  dialogOpen = false;
  saving = false;
  editingId: number | null = null;

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

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  constructor() {
    this.departmentsApi.getAll().subscribe({
      next: (list) =>
        (this.departmentOptions = list.map((d: Department) => ({
          label: d.name,
          value: d.id,
        }))),
      error: () => {},
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getPaged({ page, pageSize: rows })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load doctors.';
          this.cdr.markForCheck();
        },
      });
  }

  availabilityText(row: Doctor): string {
    return availabilitySummary(row.availability);
  }

  openCreate(): void {
    this.editingId = null;
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
    this.dialogOpen = true;
  }

  openEdit(row: Doctor): void {
    this.editingId = row.id;
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
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
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
          createdBy: uid!,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Doctor saved.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Create failed.',
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
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Doctor saved.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Update failed.',
            });
          },
        });
    }
  }

  reloadTable(): void {
    this.loading = true;
    this.api
      .getPaged({ page: 1, pageSize: this.pageSize })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck(),
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
