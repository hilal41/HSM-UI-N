import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { TooltipModule } from 'primeng/tooltip';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BranchesApiService } from '../../../core/api/branches-api.service';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import type { Branch, Hospital } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuPermissionService } from '../../../core/services/menu-permission.service';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-hospitals-page',
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
    TooltipModule,
  ],
  templateUrl: './hospitals.page.html',
  styleUrl: './hospitals.page.scss',
})
export class HospitalsPage implements OnInit {
  private readonly api = inject(HospitalsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly menuPerms = inject(MenuPermissionService);
  readonly isPlatformUser = this.session.isPlatformUser;
  readonly canWriteHospital = computed(
    () => this.isPlatformUser() && this.menuPerms.can('admin.hospitals', 'create'),
  );
  /** Developer-controlled flag: hospital users may only manage branches when their hospital allows it. */
  private readonly hospitalAllowsBranchManagement = signal(true);
  readonly canWriteBranches = computed(() => {
    const hasMenuPermission =
      this.menuPerms.can('admin.branches', 'create') ||
      this.menuPerms.can('admin.branches', 'edit') ||
      this.menuPerms.can('admin.branches', 'delete');
    if (this.isPlatformUser()) return hasMenuPermission;
    return hasMenuPermission && this.hospitalAllowsBranchManagement();
  });

  rows: Hospital[] = [];
  filteredRows: Hospital[] = [];
  loading = false;
  errorMessage: string | null = null;
  expandedRows: { [key: string]: boolean } = {};
  search = '';
  statusFilter: string | null = null;

  get hasActiveFilter(): boolean {
    return this.search.trim().length > 0 || this.statusFilter != null;
  }

  get showPaginator(): boolean {
    return showCrudPaginator(this.filteredRows.length, 10);
  }

  readonly statusFilterOptions = [
    { label: 'All statuses', value: null },
    { label: 'Active', value: 'Active' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  branchMap: Record<number, Branch[]> = {};
  branchCountMap: Record<number, number> = {};
  loadingBranchIds: number[] = [];

  dialogOpen = false;
  editing: Branch | null = null;
  dialogHospitalId: number | null = null;
  dialogHospitalName = '';
  saving = false;

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
    this.load();
  }

  licensedMenuCount(row: Hospital): number {
    return row.enabledMenus?.filter((m) => m.route).length ?? 0;
  }

  branchCount(hospitalId: number): number {
    return this.branchCountMap[hospitalId] ?? this.branchMap[hospitalId]?.length ?? 0;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.rows = data;
          if (!this.isPlatformUser()) {
            this.hospitalAllowsBranchManagement.set(
              data.some((h) => h.allowHospitalBranchManagement === true),
            );
          }
          this.applyFilters();
          this.preloadBranchesAndExpand(data);
        },
        error: () => (this.errorMessage = 'Unable to load hospitals.'),
      });
  }

  applyFilters(): void {
    const q = this.search.trim().toLowerCase();
    this.filteredRows = this.rows.filter((h) => {
      if (this.statusFilter && h.status !== this.statusFilter) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        String(h.id).includes(q)
      );
    });
  }

  private preloadBranchesAndExpand(hospitals: Hospital[]): void {
    if (hospitals.length === 0) return;

    const requests = hospitals.map((h) =>
      this.branchesApi.getAll(undefined, h.id).pipe(catchError(() => of([] as Branch[]))),
    );

    forkJoin(requests).subscribe((lists) => {
      const nextMap: Record<number, Branch[]> = { ...this.branchMap };
      const nextCounts: Record<number, number> = { ...this.branchCountMap };
      const expanded: { [key: string]: boolean } = {};

      hospitals.forEach((h, i) => {
        const branches = lists[i] ?? [];
        nextMap[h.id] = branches;
        nextCounts[h.id] = branches.length;
        expanded[String(h.id)] = true;
      });

      this.branchMap = nextMap;
      this.branchCountMap = nextCounts;
      this.expandedRows = expanded;
    });
  }

  openCreate(): void {
    void this.router.navigate(['/app/admin/hospitals/new']);
  }

  openEdit(row: Hospital): void {
    void this.router.navigate(['/app/admin/hospitals/edit', row.id]);
  }

  openMenus(row: Hospital): void {
    void this.router.navigate(['/app/admin/hospitals', row.id, 'menus']);
  }

  confirmDeleteHospital(row: Hospital): void {
    this.confirm.confirm({
      message: `Soft-delete hospital "${row.name}"? Staff will lose access immediately. Clinical data is retained and not permanently erased.`,
      header: 'Delete hospital',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Delete hospital',
      accept: () => {
        this.api.softDelete(row.id).subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Hospital soft-deleted. Staff access is locked.',
            });
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Delete failed.',
            });
          },
        });
      },
    });
  }

  hospitalStatusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    if (status === 'Active') return 'success';
    if (status === 'Suspended') return 'warn';
    return 'secondary';
  }

  onHospitalExpand(event: { data: Hospital }): void {
    const id = event.data.id;
    if (!(id in this.branchMap)) {
      this.loadBranches(id);
    }
  }

  loadBranches(hospitalId: number): void {
    this.loadingBranchIds = [...this.loadingBranchIds, hospitalId];
    this.branchesApi
      .getAll(undefined, hospitalId)
      .pipe(
        finalize(() => {
          this.loadingBranchIds = this.loadingBranchIds.filter((id) => id !== hospitalId);
        }),
      )
      .subscribe({
        next: (branches) => {
          this.branchMap = { ...this.branchMap, [hospitalId]: branches };
          this.branchCountMap = { ...this.branchCountMap, [hospitalId]: branches.length };
        },
        error: () => {
          this.branchMap = { ...this.branchMap, [hospitalId]: [] };
          this.branchCountMap = { ...this.branchCountMap, [hospitalId]: 0 };
        },
      });
  }

  branchesOf(hospitalId: number): Branch[] {
    const list = this.branchMap[hospitalId];
    return Array.isArray(list) ? list : [];
  }

  isLoadingBranches(hospitalId: number): boolean {
    return this.loadingBranchIds.includes(hospitalId);
  }

  openCreateBranch(hospital: Hospital): void {
    this.editing = null;
    this.dialogHospitalId = hospital.id;
    this.dialogHospitalName = hospital.name;
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
    this.dialogOpen = true;
  }

  openEditBranch(row: Branch, hospitalName?: string): void {
    this.editing = row;
    this.dialogHospitalId = row.hospitalId;
    this.dialogHospitalName = hospitalName ?? '';
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
    this.dialogOpen = true;
  }

  get isTemporarilyClosed(): boolean {
    return this.formStatus === 'Temporarily Closed';
  }

  saveBranch(): void {
    if (!this.formName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required.' });
      return;
    }
    if (this.isTemporarilyClosed && !this.formClosureReason.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Closure reason is required when temporarily closed.',
      });
      return;
    }
    this.saving = true;

    if (this.editing == null) {
      if (!this.formCode.trim()) {
        this.saving = false;
        this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
        return;
      }
      this.branchesApi
        .create({
          hospitalId: this.dialogHospitalId,
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
            if (this.dialogHospitalId != null) this.loadBranches(this.dialogHospitalId);
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
      this.branchesApi
        .update(this.editing.id, {
          name: this.formName.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          status: this.formStatus,
          timeZoneId: this.formTimeZoneId || 'UTC',
          currencyCode: this.formCurrencyCode || 'USD',
          countryCode: this.formCountryCode.trim().toUpperCase() || null,
          closureReason: this.isTemporarilyClosed ? this.formClosureReason.trim() || null : null,
          reopenDate:
            this.isTemporarilyClosed && this.formReopenDate
              ? this.formReopenDate.toISOString()
              : null,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Branch updated.' });
            this.dialogOpen = false;
            if (this.dialogHospitalId != null) this.loadBranches(this.dialogHospitalId);
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

  confirmDeleteBranch(row: Branch): void {
    if (row.isMain) {
      this.messages.add({
        severity: 'warn',
        summary: 'Protected',
        detail: 'The main branch cannot be deleted.',
      });
      return;
    }
    this.confirm.confirm({
      message: `Delete branch "${row.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.branchesApi.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Removed', detail: 'Branch removed.' });
            if (row.hospitalId != null) this.loadBranches(row.hospitalId);
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Delete failed.',
            });
          },
        });
      },
    });
  }

  branchStatusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    if (status === 'Active') return 'success';
    if (status === 'Temporarily Closed') return 'warn';
    return 'secondary';
  }
}
