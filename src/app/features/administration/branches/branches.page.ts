import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { BranchesApiService } from '../../../core/api/branches-api.service';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import type { Branch } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuPermissionService } from '../../../core/services/menu-permission.service';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-branches-page',
  imports: [
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
    SelectModule,
    TextareaModule,
    DatePickerModule,
    DividerModule,
  ],
  templateUrl: './branches.page.html',
})
export class BranchesPage implements OnInit {
  private readonly api = inject(BranchesApiService);
  private readonly hospitalsApi = inject(HospitalsApiService);
  private readonly meApi = inject(MeApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly menuPerms = inject(MenuPermissionService);
  readonly isPlatformUser = this.session.isPlatformUser;
  readonly hasBranchPermission = computed(
    () =>
      this.menuPerms.can('admin.branches', 'create') ||
      this.menuPerms.can('admin.branches', 'edit') ||
      this.menuPerms.can('admin.branches', 'delete'),
  );
  readonly canWriteBranches = computed(() => {
    if (!this.hasBranchPermission()) return false;
    if (this.isPlatformUser()) return true;
    return this.hospitalAllowsBranchManagement;
  });

  rows: Branch[] = [];
  hospitalOptions: { label: string; value: number }[] = [];
  filterHospitalId: number | null = null;

  get hasActiveFilter(): boolean {
    return this.isPlatformUser() && this.filterHospitalId != null;
  }

  formHospitalId: number | null = null;
  hospitalAllowsBranchManagement = false;

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 10);
  }

  dialogOpen = false;
  editing: Branch | null = null;

  formCode = '';
  formName = '';
  formAddress = '';
  formPhone = '';
  formEmail = '';
  formStatus = 'Active';
  formTimeZoneId = 'UTC';
  formCurrencyCode = 'USD';
  formCountryCode = '';
  formClosureReason = '';
  formReopenDate: Date | null = null;

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Temporarily Closed', value: 'Temporarily Closed' },
  ];

  readonly commonTimeZones = [
    { label: 'UTC', value: 'UTC' },
    { label: 'Asia/Karachi (PKT +5)', value: 'Asia/Karachi' },
    { label: 'Asia/Dubai (GST +4)', value: 'Asia/Dubai' },
    { label: 'Asia/Riyadh (AST +3)', value: 'Asia/Riyadh' },
    { label: 'Asia/Kolkata (IST +5:30)', value: 'Asia/Kolkata' },
    { label: 'Asia/Dhaka (BST +6)', value: 'Asia/Dhaka' },
    { label: 'Asia/Singapore (SGT +8)', value: 'Asia/Singapore' },
    { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
    { label: 'Europe/Berlin (CET +1)', value: 'Europe/Berlin' },
    { label: 'America/New_York (EST -5)', value: 'America/New_York' },
    { label: 'America/Los_Angeles (PST -8)', value: 'America/Los_Angeles' },
    { label: 'Australia/Sydney (AEST +10)', value: 'Australia/Sydney' },
  ];

  readonly commonCurrencies = [
    { label: 'PKR — Pakistani Rupee', value: 'PKR' },
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'AED — UAE Dirham', value: 'AED' },
    { label: 'SAR — Saudi Riyal', value: 'SAR' },
    { label: 'INR — Indian Rupee', value: 'INR' },
    { label: 'BDT — Bangladeshi Taka', value: 'BDT' },
    { label: 'GBP — British Pound', value: 'GBP' },
    { label: 'EUR — Euro', value: 'EUR' },
    { label: 'SGD — Singapore Dollar', value: 'SGD' },
    { label: 'AUD — Australian Dollar', value: 'AUD' },
  ];

  ngOnInit(): void {
    if (this.isPlatformUser()) {
      this.hospitalsApi.getAll().subscribe({
        next: (hospitals) => {
          this.hospitalOptions = hospitals.map((h) => ({ label: `${h.code} — ${h.name}`, value: h.id }));
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Hospitals',
            detail: 'Unable to load hospitals for the branch filter.',
          });
        },
      });
      this.load();
      return;
    }

    this.meApi.getMyHospital().subscribe({
      next: (hospital) => {
        this.hospitalAllowsBranchManagement = hospital.allowHospitalBranchManagement ?? false;
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Hospital',
          detail: 'Unable to load hospital settings.',
        });
      },
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    const hospitalId = this.isPlatformUser() ? (this.filterHospitalId ?? undefined) : undefined;
    this.api
      .getAll(undefined, hospitalId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load branches.'),
      });
  }

  openCreate(): void {
    this.editing = null;
    this.formCode = '';
    this.formName = '';
    this.formAddress = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formStatus = 'Active';
    this.formTimeZoneId = 'UTC';
    this.formCurrencyCode = 'USD';
    this.formCountryCode = '';
    this.formClosureReason = '';
    this.formReopenDate = null;
    this.formHospitalId = this.filterHospitalId;
    this.dialogOpen = true;
  }

  openEdit(row: Branch): void {
    this.editing = row;
    this.formCode = row.code;
    this.formName = row.name;
    this.formAddress = row.address ?? '';
    this.formPhone = row.phone ?? '';
    this.formEmail = row.email ?? '';
    this.formStatus = row.status;
    this.formTimeZoneId = row.timeZoneId ?? 'UTC';
    this.formCurrencyCode = row.currencyCode ?? 'USD';
    this.formCountryCode = row.countryCode ?? '';
    this.formClosureReason = row.closureReason ?? '';
    this.formReopenDate = row.reopenDate ? new Date(row.reopenDate) : null;
    this.formHospitalId = row.hospitalId;
    this.dialogOpen = true;
  }

  get isTemporarilyClosed(): boolean {
    return this.formStatus === 'Temporarily Closed';
  }

  save(): void {
    if (!this.formName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required.' });
      return;
    }
    if (this.isTemporarilyClosed && !this.formClosureReason.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Closure reason is required when temporarily closed.' });
      return;
    }
    this.saving = true;
    if (this.editing == null) {
      if (!this.formCode.trim()) {
        this.saving = false;
        this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
        return;
      }
      if (this.isPlatformUser() && (this.formHospitalId == null || this.formHospitalId <= 0)) {
        this.saving = false;
        this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Select a hospital.' });
        return;
      }
      this.api
        .create({
          hospitalId: this.isPlatformUser() ? this.formHospitalId : undefined,
          code: this.formCode.trim(),
          name: this.formName.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          timeZoneId: this.formTimeZoneId || 'UTC',
          currencyCode: this.formCurrencyCode || 'USD',
          countryCode: this.formCountryCode.trim().toUpperCase() || null,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Branch created.' });
            this.dialogOpen = false;
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Create failed.' });
          },
        });
    } else {
      this.api
        .update(this.editing.id, {
          name: this.formName.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          status: this.formStatus,
          timeZoneId: this.formTimeZoneId || 'UTC',
          currencyCode: this.formCurrencyCode || 'USD',
          countryCode: this.formCountryCode.trim().toUpperCase() || null,
          closureReason: this.isTemporarilyClosed ? (this.formClosureReason.trim() || null) : null,
          reopenDate: this.isTemporarilyClosed && this.formReopenDate
            ? this.formReopenDate.toISOString()
            : null,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Branch updated.' });
            this.dialogOpen = false;
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Update failed.' });
          },
        });
    }
  }

  confirmDelete(row: Branch): void {
    if (row.isMain) {
      this.messages.add({ severity: 'warn', summary: 'Protected', detail: 'The main branch cannot be deleted.' });
      return;
    }
    this.confirm.confirm({
      message: `Deactivate branch "${row.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Removed', detail: 'Branch deactivated.' });
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Delete failed.' });
          },
        });
      },
    });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    if (status === 'Active') return 'success';
    if (status === 'Temporarily Closed') return 'warn';
    return 'secondary';
  }
}
