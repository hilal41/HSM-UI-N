import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { BloodTypesApiService } from '../../../core/api/blood-types-api.service';
import { PatientsApiService } from '../../../core/api/patients-api.service';
import type { BloodTypeOption, Patient, PatientImportResult } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { ModuleAccessService } from '../../../core/services/module-access.service';
import { MenuPermissionService } from '../../../core/services/menu-permission.service';
import { PatientLabHistoryDialogComponent } from '../../laboratory/patient-lab-history/patient-lab-history-dialog.component';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import {
  caretAfterDigitIndex,
  completedAgeYmdFromDate,
  dateOfBirthFromAgeYmdDate,
  digitIndexBeforeCaret,
  digitsOnlyAgeYmd,
  formatAgeYmdAutoFromDigits,
  formatAgeYmdForInput,
  formatLocalDateIso,
  parseAgeYmdFromUserInput,
  parseIsoToLocalDate,
} from '../../../shared/utils/patient-age-dob.util';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-patients-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    PatientLabHistoryDialogComponent,
  ],
  templateUrl: './patients.page.html',
  styleUrl: './patients.page.scss',
})
export class PatientsPage implements OnInit {
  private readonly api = inject(PatientsApiService);
  private readonly bloodTypesApi = inject(BloodTypesApiService);
  private readonly session = inject(AuthSessionService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly moduleAccess = inject(ModuleAccessService);
  readonly menuPerms = inject(MenuPermissionService);
  readonly labHistoryDialog = viewChild(PatientLabHistoryDialogComponent);
  private readonly patientImportInput = viewChild<ElementRef<HTMLInputElement>>('patientImport');
  readonly showLabHistory = this.moduleAccess.hasLaboratory;

  rows: Patient[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  get canCreatePatient(): boolean {
    return this.menuPerms.can('clinical.patients', 'create');
  }

  exportingExcel = false;
  importingExcel = false;

  dialogOpen = false;
  saving = false;
  editingId: number | null = null;

  formPatientNumber = '';
  formFirstName = '';
  formLastName = '';
  /** Calendar date of birth; synced with age years / months / days. */
  formDob: Date | null = null;
  formAgeYmdText = '';
  private syncingDobAge = false;
  readonly maxDobDate = new Date();
  formGender = 'Male';
  formBloodTypeId: number | null = null;
  bloodTypeOptions: BloodTypeOption[] = [];
  formPhone = '';
  formEmail = '';
  formAddress = '';
  formCity = '';
  formState = '';
  formZip = '';
  formEmerName = '';
  formEmerPhone = '';
  formEmerRel = '';
  formInsProvider = '';
  formInsPolicy = '';
  formPatientPictureBase64: string | null = null;
  formStatus = 'Active';

  readonly genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];
  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  onFormDobChange(): void {
    if (this.syncingDobAge) return;
    if (!this.formDob) {
      this.formAgeYmdText = '';
      return;
    }
    if (this.formDob.getTime() >= Date.now()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Date of birth must be before today.',
      });
      this.formDob = null;
      this.formAgeYmdText = '';
      return;
    }
    this.syncingDobAge = true;
    const a = completedAgeYmdFromDate(this.formDob);
    this.formAgeYmdText = formatAgeYmdForInput(a);
    this.syncingDobAge = false;
  }

  onFormAgeYmdInput(ev: Event): void {
    if (this.syncingDobAge) return;
    const el = ev.target as HTMLInputElement;
    const caret = el.selectionStart ?? el.value.length;
    const digitIdx = digitIndexBeforeCaret(el.value, caret);
    const formatted = formatAgeYmdAutoFromDigits(digitsOnlyAgeYmd(el.value));
    this.formAgeYmdText = formatted;
    const pos = caretAfterDigitIndex(formatted, digitIdx);
    queueMicrotask(() => {
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* ignore */
      }
    });
    this.syncFormAgeFromField();
  }

  private syncFormAgeFromField(): void {
    if (this.syncingDobAge) return;
    const t = this.formAgeYmdText.trim();
    if (!t) {
      this.syncingDobAge = true;
      this.formDob = null;
      this.syncingDobAge = false;
      this.cdr.markForCheck();
      return;
    }
    const parsed = parseAgeYmdFromUserInput(this.formAgeYmdText);
    if (!parsed) {
      this.cdr.markForCheck();
      return;
    }
    if (parsed.years + parsed.months + parsed.days === 0) {
      this.syncingDobAge = true;
      this.formDob = null;
      this.syncingDobAge = false;
      this.cdr.markForCheck();
      return;
    }
    this.syncingDobAge = true;
    this.formDob = dateOfBirthFromAgeYmdDate(parsed.years, parsed.months, parsed.days);
    this.syncingDobAge = false;
    this.cdr.markForCheck();
  }

  onFormAgeYmdBlur(): void {
    if (this.syncingDobAge) return;
    const t = this.formAgeYmdText.trim();
    if (!t) return;
    const parsed = parseAgeYmdFromUserInput(this.formAgeYmdText);
    if (parsed && parsed.years + parsed.months + parsed.days > 0) {
      this.syncingDobAge = true;
      this.formAgeYmdText = formatAgeYmdForInput(parsed);
      this.syncingDobAge = false;
      this.cdr.markForCheck();
      return;
    }
    this.messages.add({
      severity: 'warn',
      summary: 'Age',
      detail: 'Use years, months, and days like 45-6-12 or 45 (years only).',
    });
    this.syncingDobAge = true;
    this.formAgeYmdText = this.formDob ? formatAgeYmdForInput(completedAgeYmdFromDate(this.formDob)) : '';
    this.syncingDobAge = false;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.moduleAccess.load();
    this.bloodTypesApi.getAll().subscribe({
      next: (list) => {
        this.bloodTypeOptions = list;
        this.cdr.markForCheck();
      },
      error: () => {
        this.bloodTypeOptions = [];
        this.messages.add({
          severity: 'error',
          summary: 'Blood types',
          detail: 'Unable to load blood type options.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.tablePageSize = rows;
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
          this.errorMessage = 'Unable to load patients.';
          this.cdr.markForCheck();
        },
      });
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
          a.download = `patients-${stamp}.xlsx`;
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
    this.patientImportInput()?.nativeElement.click();
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
        detail: 'Sign in with a hospital user to import patients.',
      });
      return;
    }

    this.importingExcel = true;
    this.api
      .importExcel(file)
      .pipe(finalize(() => (this.importingExcel = false)))
      .subscribe({
        next: (res: PatientImportResult) => {
          const detail = `Created ${res.created}, updated ${res.updated}, failed ${res.failed}.`;
          this.messages.add({
            severity: res.failed > 0 ? 'warn' : 'success',
            summary: 'Import finished',
            detail,
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

  openCreate(): void {
    this.editingId = null;
    this.formPatientNumber = '';
    this.formFirstName = '';
    this.formLastName = '';
    this.formDob = null;
    this.formAgeYmdText = '';
    this.formGender = 'Male';
    this.formBloodTypeId = null;
    this.formPhone = '';
    this.formEmail = '';
    this.formAddress = '';
    this.formCity = '';
    this.formState = '';
    this.formZip = '';
    this.formEmerName = '';
    this.formEmerPhone = '';
    this.formEmerRel = '';
    this.formInsProvider = '';
    this.formInsPolicy = '';
    this.formPatientPictureBase64 = null;
    this.formStatus = 'Active';
    this.dialogOpen = true;
  }

  openEdit(row: Patient): void {
    this.editingId = row.id;
    this.formPatientNumber = row.patientNumber;
    this.formFirstName = row.firstName;
    this.formLastName = row.lastName;
    if (row.dateOfBirth) {
      this.syncingDobAge = true;
      this.formDob = parseIsoToLocalDate(row.dateOfBirth);
      if (this.formDob) {
        const a = completedAgeYmdFromDate(this.formDob);
        this.formAgeYmdText = formatAgeYmdForInput(a);
      } else {
        this.formAgeYmdText = '';
      }
      this.syncingDobAge = false;
    } else {
      this.formDob = null;
      this.formAgeYmdText = '';
    }
    this.formGender = row.gender;
    this.formBloodTypeId = row.bloodTypeId ?? null;
    this.formPhone = row.phone ?? '';
    this.formEmail = row.email ?? '';
    this.formAddress = row.address ?? '';
    this.formCity = row.city ?? '';
    this.formState = row.state ?? '';
    this.formZip = row.zipCode ?? '';
    this.formEmerName = row.emergencyContactName ?? '';
    this.formEmerPhone = row.emergencyContactPhone ?? '';
    this.formEmerRel = row.emergencyContactRelation ?? '';
    this.formInsProvider = row.insuranceProvider ?? '';
    this.formInsPolicy = row.insurancePolicyNumber ?? '';
    this.formPatientPictureBase64 = row.patientPictureBase64 ?? null;
    this.formStatus = row.status;
    this.dialogOpen = true;
  }

  onPatientPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.formPatientPictureBase64 = typeof reader.result === 'string' ? reader.result : null;
      this.cdr.markForCheck();
    };
    reader.onerror = () => {
      this.messages.add({
        severity: 'error',
        summary: 'Picture',
        detail: 'Could not read selected image.',
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearPatientPicture(): void {
    this.formPatientPictureBase64 = null;
    this.cdr.markForCheck();
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  save(): void {
    if (!this.formDob) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Select date of birth (or enter age).',
      });
      return;
    }
    if (this.formDob.getTime() >= Date.now()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Date of birth must be before today.',
      });
      return;
    }
    if (
      !this.formFirstName.trim() ||
      !this.formLastName.trim() ||
      !this.formGender ||
      !this.formPhone.trim()
    ) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Fill required fields including phone.' });
      return;
    }
    const dob = formatLocalDateIso(this.formDob);
    this.saving = true;
    if (this.editingId == null) {
      this.api
        .create({
          firstName: this.formFirstName.trim(),
          lastName: this.formLastName.trim(),
          dateOfBirth: dob,
          gender: this.formGender,
          ...(this.formBloodTypeId != null ? { bloodTypeId: this.formBloodTypeId } : {}),
          phone: this.formPhone.trim(),
          email: this.formEmail.trim() || null,
          address: this.formAddress.trim() || null,
          city: this.formCity.trim() || null,
          state: this.formState.trim() || null,
          zipCode: this.formZip.trim() || null,
          emergencyContactName: this.formEmerName.trim() || null,
          emergencyContactPhone: this.formEmerPhone.trim() || null,
          emergencyContactRelation: this.formEmerRel.trim() || null,
          insuranceProvider: this.formInsProvider.trim() || null,
          insurancePolicyNumber: this.formInsPolicy.trim() || null,
          patientPictureBase64: this.formPatientPictureBase64,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Patient saved.' });
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
          patientNumber: this.formPatientNumber.trim(),
          firstName: this.formFirstName.trim(),
          lastName: this.formLastName.trim(),
          dateOfBirth: dob,
          gender: this.formGender,
          clearBloodType: this.formBloodTypeId == null,
          ...(this.formBloodTypeId != null ? { bloodTypeId: this.formBloodTypeId } : {}),
          phone: this.formPhone.trim(),
          email: this.formEmail.trim() || null,
          address: this.formAddress.trim() || null,
          city: this.formCity.trim() || null,
          state: this.formState.trim() || null,
          zipCode: this.formZip.trim() || null,
          emergencyContactName: this.formEmerName.trim() || null,
          emergencyContactPhone: this.formEmerPhone.trim() || null,
          emergencyContactRelation: this.formEmerRel.trim() || null,
          insuranceProvider: this.formInsProvider.trim() || null,
          insurancePolicyNumber: this.formInsPolicy.trim() || null,
          patientPictureBase64: this.formPatientPictureBase64,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Patient saved.' });
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

  confirmDelete(row: Patient): void {
    this.confirm.confirm({
      message: `Delete patient ${row.firstName} ${row.lastName}?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Patient removed.' });
            this.reloadTable();
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' });
          },
        });
      },
    });
  }

  openLabHistory(row: Patient): void {
    this.labHistoryDialog()?.open(row);
  }
}
