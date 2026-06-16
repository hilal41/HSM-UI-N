import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PasswordModule } from 'primeng/password';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { BranchesApiService } from '../../../core/api/branches-api.service';
import { ClinicalDepartmentsApiService } from '../../../core/api/clinical-departments-api.service';
import { RolesApiService } from '../../../core/api/roles-api.service';
import { UsersApiService } from '../../../core/api/users-api.service';
import type {
  Department,
  Role,
  UpdateUserRequest,
  User,
  UserDetail,
} from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-users-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    HmsBlockSkeletonComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    ToggleSwitchModule,
    PasswordModule,
    ChipModule,
  ],
  templateUrl: './users.page.html',
})
export class UsersPage {
  private readonly api = inject(UsersApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly departmentsApi = inject(ClinicalDepartmentsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: User[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;

  roleOptions: { label: string; value: number }[] = [];
  departmentOptions: { label: string; value: number }[] = [];
  branchOptions: { label: string; value: number }[] = [];

  dialogOpen = false;
  roleDialogOpen = false;
  deptDialogOpen = false;
  branchDialogOpen = false;
  detailDialogOpen = false;
  detailLoading = false;
  userDetail: UserDetail | null = null;
  saving = false;

  editingId: number | null = null;
  adminUserId: number | null = null;

  formUserName = '';
  formEmail = '';
  formPassword = '';
  formFirstName = '';
  formLastName = '';
  formPhone = '';
  formAddress = '';
  formIsActive = true;
  formRoleId: number | null = null;
  formCreateBranchIds: number[] = [];
  formCreateDefaultBranchId: number | null = null;

  assignRoleId: number | null = null;
  selectedDeptIds: number[] = [];
  selectedBranchIds: number[] = [];
  defaultBranchId: number | null = null;

  constructor() {
    this.rolesApi.getAll().subscribe({
      next: (roles: Role[]) =>
        (this.roleOptions = roles.map((r) => ({ label: r.name, value: r.id }))),
      error: () => {},
    });
    this.departmentsApi.getAll().subscribe({
      next: (list: Department[]) =>
        (this.departmentOptions = list.map((d) => ({ label: d.name, value: d.id }))),
      error: () => {},
    });
    this.branchesApi.getAll('Active').subscribe({
      next: (list) =>
        (this.branchOptions = list.map((b) => ({
          label: b.isMain ? `${b.name} (Main)` : b.name,
          value: b.id,
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
          this.errorMessage = 'Unable to load users.';
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

  openCreate(): void {
    this.editingId = null;
    this.formUserName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formFirstName = '';
    this.formLastName = '';
    this.formPhone = '';
    this.formAddress = '';
    this.formIsActive = true;
    this.formRoleId = this.roleOptions[0]?.value ?? null;
    const mainBranch = this.branchOptions.find((b) => b.label.includes('(Main)'));
    this.formCreateBranchIds = mainBranch ? [mainBranch.value] : this.branchOptions.slice(0, 1).map((b) => b.value);
    this.formCreateDefaultBranchId = this.formCreateBranchIds[0] ?? null;
    this.dialogOpen = true;
  }

  openEdit(row: User): void {
    this.editingId = row.id;
    this.formUserName = row.userName;
    this.formEmail = row.email;
    this.formPassword = '';
    this.formFirstName = row.firstName ?? '';
    this.formLastName = row.lastName ?? '';
    this.formPhone = row.phone ?? '';
    this.formAddress = row.address ?? '';
    this.formIsActive = row.isActive;
    this.formRoleId = row.roleId ?? null;
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  saveUser(): void {
    if (!this.formUserName.trim() || !this.formEmail.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Username and email are required.' });
      return;
    }
    if (this.editingId == null && !this.formPassword.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Password is required for new users.' });
      return;
    }
    this.saving = true;
    if (this.editingId == null) {
      this.api
        .create({
          userName: this.formUserName.trim(),
          email: this.formEmail.trim(),
          password: this.formPassword.trim(),
          firstName: this.formFirstName.trim() || null,
          lastName: this.formLastName.trim() || null,
          phone: this.formPhone.trim() || null,
          address: this.formAddress.trim() || null,
          roleId: this.formRoleId,
          isActive: this.formIsActive,
          branchIds: this.formCreateBranchIds.length ? this.formCreateBranchIds : undefined,
          defaultBranchId: this.formCreateDefaultBranchId,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'User created.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: { error?: unknown }) => {
            const msg =
              typeof err?.error === 'string'
                ? err.error
                : (err?.error as { message?: string })?.message ?? 'Create failed.';
            this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
    } else {
      const body: UpdateUserRequest = {
        userName: this.formUserName.trim(),
        email: this.formEmail.trim(),
        firstName: this.formFirstName.trim() || null,
        lastName: this.formLastName.trim() || null,
        phone: this.formPhone.trim() || null,
        address: this.formAddress.trim() || null,
        isActive: this.formIsActive,
        roleId: this.formRoleId,
      };
      if (this.formPassword.trim()) {
        body.password = this.formPassword.trim();
      }
      this.api
        .update(this.editingId, body)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'User updated.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: { error?: unknown }) => {
            const msg =
              typeof err?.error === 'string'
                ? err.error
                : (err?.error as { message?: string })?.message ?? 'Update failed.';
            this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
    }
  }

  openUserDetail(row: User): void {
    this.userDetail = null;
    this.detailDialogOpen = true;
    this.detailLoading = true;
    this.api
      .getDetail(row.id)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (d) => {
          this.userDetail = d;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'GET /Users/' + row.id + '/detail failed.',
          });
          this.detailDialogOpen = false;
          this.cdr.markForCheck();
        },
      });
  }

  closeUserDetail(): void {
    this.detailDialogOpen = false;
    this.userDetail = null;
  }

  confirmDelete(row: User): void {
    this.confirm.confirm({
      message: `Delete user "${row.userName}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'User removed.' });
            this.reloadTable();
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' });
          },
        });
      },
    });
  }

  openRoleDialog(row: User): void {
    this.adminUserId = row.id;
    this.assignRoleId = row.roleId ?? this.roleOptions[0]?.value ?? null;
    this.roleDialogOpen = true;
  }

  saveRole(): void {
    if (this.adminUserId == null || this.assignRoleId == null) return;
    this.saving = true;
    this.api
      .assignRole(this.adminUserId, { roleId: this.assignRoleId })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Role assigned.' });
          this.roleDialogOpen = false;
          this.reloadTable();
        },
        error: (err: { error?: unknown }) => {
          const msg =
            typeof err?.error === 'string'
              ? err.error
              : (err?.error as { message?: string })?.message ?? 'Assign role failed.';
          this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  openDeptDialog(row: User): void {
    this.adminUserId = row.id;
    this.selectedDeptIds = [];
    this.deptDialogOpen = true;
    this.api.getDepartments(row.id).subscribe({
      next: (depts) => (this.selectedDeptIds = depts.map((d) => d.id)),
      error: () => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not load user departments.' });
        this.deptDialogOpen = false;
      },
    });
  }

  saveDepartments(): void {
    if (this.adminUserId == null) return;
    this.saving = true;
    this.api
      .setDepartments(this.adminUserId, { departmentIds: this.selectedDeptIds })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Departments updated.' });
          this.deptDialogOpen = false;
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: 'Update failed.' });
        },
      });
  }

  openBranchDialog(row: User): void {
    this.adminUserId = row.id;
    this.selectedBranchIds = [];
    this.defaultBranchId = null;
    this.branchDialogOpen = true;
    this.api.getBranches(row.id).subscribe({
      next: (branches) => {
        this.selectedBranchIds = branches.map((b) => b.id);
        this.defaultBranchId = branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? null;
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not load user branches.' });
        this.branchDialogOpen = false;
      },
    });
  }

  get filteredDefaultBranchOptions(): { label: string; value: number }[] {
    return this.branchOptions.filter((o) => this.selectedBranchIds.includes(o.value));
  }

  get filteredCreateDefaultBranchOptions(): { label: string; value: number }[] {
    return this.branchOptions.filter((o) => this.formCreateBranchIds.includes(o.value));
  }

  saveBranches(): void {
    if (this.adminUserId == null) return;
    this.saving = true;
    this.api
      .setBranches(this.adminUserId, {
        branchIds: this.selectedBranchIds,
        defaultBranchId: this.defaultBranchId,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Branches updated.' });
          this.branchDialogOpen = false;
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
