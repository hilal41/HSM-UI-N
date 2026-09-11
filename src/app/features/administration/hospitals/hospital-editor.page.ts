import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, forkJoin } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import { MenusApiService } from '../../../core/api/menus-api.service';
import type { AppMenuTree, RoleMenuPermission } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import {
  DEFAULT_HOSPITAL_MENU_CODES,
  HospitalMenuPickerComponent,
} from '../../../shared/components/hospital-menu-picker/hospital-menu-picker.component';
import {
  countRoutableMenus,
  flattenMenuTree,
} from '../../../shared/components/hospital-menu-picker/hospital-menu.utils';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { apiErrorMessage } from '../../../shared/utils/crud-page.state';
import {
  CURRENCY_SYMBOL_OPTIONS,
  DATE_FORMAT_OPTIONS,
  HOSPITAL_SIZE_OPTIONS,
  HOSPITAL_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  previewMrn,
  TIME_FORMAT_OPTIONS,
  TIME_ZONE_OPTIONS,
} from '../../../shared/utils/hospital-profile.utils';

@Component({
  selector: 'app-hospital-editor-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    HmsBlockSkeletonComponent,
    HospitalMenuPickerComponent,
    MessageModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    PasswordModule,
    TagModule,
    DialogModule,
    TooltipModule,
  ],
  templateUrl: './hospital-editor.page.html',
  styleUrl: './hospital-editor.page.scss',
})
export class HospitalEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(HospitalsApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly menusApi = inject(MenusApiService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  editingId: number | null = null;
  menuTree: AppMenuTree[] = [];
  defaultMenuIds: number[] = [];
  adminExpanded = false;
  formMenuIds: number[] = [];
  mrnNextNumber = 1;

  loading = true;
  saving = false;
  loadError: string | null = null;
  private loadedStatus = 'Active';

  resetPasswordDialogOpen = false;
  resetPasswordSaving = false;
  newAdminPassword = '';
  impersonating = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    address: [''],
    phone: [''],
    email: [''],
    status: ['Active'],
    allowHospitalBranchManagement: [false],
    licenseNumber: [''],
    taxNumber: [''],
    hospitalType: [''],
    hospitalSize: [''],
    currencySymbol: ['Rs'],
    dateFormat: ['dd/MM/yyyy'],
    timeFormat: ['HH:mm'],
    defaultLanguage: ['en'],
    defaultTimeZoneId: ['UTC'],
    mrnFormat: ['{CODE}-{YYYY}-{#####}'],
    mrnPrefix: [''],
    initialRoleName: ['Administrator'],
    adminUserName: [''],
    adminEmail: [''],
    adminPassword: [''],
    adminFirstName: [''],
    adminLastName: [''],
  });

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Suspended', value: 'Suspended' },
  ];

  readonly hospitalTypeOptions = HOSPITAL_TYPE_OPTIONS;
  readonly hospitalSizeOptions = HOSPITAL_SIZE_OPTIONS;
  readonly dateFormatOptions = DATE_FORMAT_OPTIONS;
  readonly timeFormatOptions = TIME_FORMAT_OPTIONS;
  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly currencySymbolOptions = CURRENCY_SYMBOL_OPTIONS;
  readonly timeZoneOptions = TIME_ZONE_OPTIONS;
  readonly mrnTokenHelp =
    'Tokens: {CODE}, {PREFIX}, {YYYY}, {YY}, {MM}, {DD}, {#}…{########}';

  get statusHelp(): string {
    const status = this.form.controls.status.value;
    if (status === 'Active') {
      return 'Active — hospital staff can sign in and use licensed features. Branches remain independently active or closed.';
    }
    if (status === 'Suspended') {
      return 'Suspended — temporary lockout for support or billing issues. All staff are blocked until the hospital is Active again.';
    }
    if (status === 'Inactive') {
      return 'Inactive — hospital is decommissioned for normal use. Staff cannot sign in; clinical data is retained.';
    }
    return 'Choose Active for normal operation, Suspended for a temporary lockout, or Inactive to retire the tenant.';
  }

  get isCreateMode(): boolean {
    return this.editingId == null;
  }

  get selectedMenuCount(): number {
    return countRoutableMenus(this.menuTree, this.formMenuIds);
  }

  get totalRoutableMenus(): number {
    return flattenMenuTree(this.menuTree).filter((m) => m.route).length;
  }

  get hasAdminDraft(): boolean {
    const v = this.form.getRawValue();
    return !!(v.adminUserName.trim() || v.adminEmail.trim());
  }

  get formNamePreview(): string {
    return this.form.controls.name.value.trim();
  }

  get mrnPreview(): string {
    const v = this.form.getRawValue();
    return previewMrn(v.mrnFormat, v.code, v.mrnPrefix, this.mrnNextNumber);
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    if (status === 'Active') return 'success';
    if (status === 'Suspended') return 'warn';
    if (status === 'Inactive') return 'danger';
    return 'secondary';
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.editingId = idParam != null && /^\d+$/.test(idParam) ? Number(idParam) : null;

    if (this.isCreateMode) {
      forkJoin({
        tree: this.menusApi.getTree(true),
      })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: ({ tree }) => {
            this.menuTree = tree;
            this.defaultMenuIds = this.resolveDefaultMenuIds(tree);
            this.formMenuIds = [...this.defaultMenuIds];
          },
          error: () => {
            this.loadError = 'Could not load hospital editor.';
          },
        });
      return;
    }

    this.form.controls.code.disable();
    forkJoin({
      hospital: this.api.getById(this.editingId!),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ hospital }) => {
          this.form.patchValue({
            name: hospital.name,
            code: hospital.code,
            address: hospital.address ?? '',
            phone: hospital.phone ?? '',
            email: hospital.email ?? '',
            status: hospital.status,
            allowHospitalBranchManagement: hospital.allowHospitalBranchManagement ?? false,
            licenseNumber: hospital.licenseNumber ?? '',
            taxNumber: hospital.taxNumber ?? '',
            hospitalType: hospital.hospitalType ?? '',
            hospitalSize: hospital.hospitalSize ?? '',
            currencySymbol: hospital.currencySymbol ?? 'Rs',
            dateFormat: hospital.dateFormat ?? 'dd/MM/yyyy',
            timeFormat: hospital.timeFormat ?? 'HH:mm',
            defaultLanguage: hospital.defaultLanguage ?? 'en',
            defaultTimeZoneId: hospital.defaultTimeZoneId ?? 'UTC',
            mrnFormat: hospital.mrnFormat ?? '{CODE}-{YYYY}-{#####}',
            mrnPrefix: hospital.mrnPrefix ?? '',
          });
          this.mrnNextNumber = hospital.mrnNextNumber && hospital.mrnNextNumber > 0 ? hospital.mrnNextNumber : 1;
          this.loadedStatus = hospital.status;
        },
        error: () => {
          this.loadError = 'Could not load hospital.';
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/app/admin/hospitals']);
  }

  save(): void {
    const v = this.form.getRawValue();
    if (!v.name.trim() || (this.isCreateMode && !v.code.trim())) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Name and code are required.' });
      return;
    }

    if (!this.isCreateMode && v.status !== this.loadedStatus && v.status !== 'Active') {
      this.confirm.confirm({
        message: `Set status to "${v.status}"? All hospital staff will be locked out and branches marked inactive until the hospital is Active again.`,
        header: 'Confirm hospital status',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => this.persist(),
      });
      return;
    }

    this.persist();
  }

  confirmSoftDelete(): void {
    if (this.editingId == null) return;
    this.confirm.confirm({
      message:
        'Soft-delete this hospital? Staff lose access immediately. Clinical records are retained (not hard-deleted).',
      header: 'Delete hospital',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Delete hospital',
      accept: () => {
        this.saving = true;
        this.api
          .softDelete(this.editingId!)
          .pipe(finalize(() => (this.saving = false)))
          .subscribe({
            next: () => {
              this.messages.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Hospital soft-deleted.',
              });
              void this.router.navigate(['/app/admin/hospitals']);
            },
            error: (err: unknown) => {
              this.messages.add({
                severity: 'error',
                summary: 'Error',
                detail: apiErrorMessage(err, 'Delete failed.'),
              });
            },
          });
      },
    });
  }

  private persist(): void {
    this.saving = true;
    const v = this.form.getRawValue();

    if (this.isCreateMode) {
      const adminUserName = v.adminUserName.trim();
      const adminEmail = v.adminEmail.trim();
      const adminPassword = v.adminPassword;
      const adminStarted = !!(adminUserName || adminEmail || adminPassword || v.adminFirstName.trim() || v.adminLastName.trim());
      const hasAdmin = !!(adminUserName && adminEmail && adminPassword);
      const routableSelected = countRoutableMenus(this.menuTree, this.formMenuIds);

      if (routableSelected === 0) {
        this.saving = false;
        this.messages.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Select at least one allowed menu for this hospital.',
        });
        return;
      }

      if (adminStarted && !hasAdmin) {
        this.saving = false;
        this.messages.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'To create an admin, fill username, email, and a password of at least 8 characters — or clear those fields.',
        });
        return;
      }

      if (hasAdmin && adminPassword.length < 8) {
        this.saving = false;
        this.messages.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Admin password must be at least 8 characters.',
        });
        return;
      }

      const menuPermissions: RoleMenuPermission[] = this.formMenuIds.map((menuId) => ({
        menuId,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      }));

      this.api
        .create({
          name: v.name.trim(),
          code: v.code.trim().toUpperCase(),
          address: v.address.trim() || null,
          phone: v.phone.trim() || null,
          email: v.email.trim() || null,
          enabledMenuIds: this.formMenuIds,
          allowHospitalBranchManagement: v.allowHospitalBranchManagement,
          licenseNumber: v.licenseNumber.trim() || null,
          taxNumber: v.taxNumber.trim() || null,
          hospitalType: v.hospitalType.trim() || null,
          hospitalSize: v.hospitalSize.trim() || null,
          currencySymbol: v.currencySymbol.trim() || null,
          dateFormat: v.dateFormat.trim() || null,
          timeFormat: v.timeFormat.trim() || null,
          defaultLanguage: v.defaultLanguage.trim() || null,
          defaultTimeZoneId: v.defaultTimeZoneId.trim() || null,
          mrnFormat: v.mrnFormat.trim() || null,
          mrnPrefix: v.mrnPrefix.trim() || null,
          initialRole: hasAdmin
            ? {
                name: v.initialRoleName.trim() || 'Administrator',
                menuPermissions,
              }
            : null,
          adminUser: hasAdmin
            ? {
                userName: adminUserName,
                email: adminEmail,
                password: adminPassword,
                firstName: v.adminFirstName.trim() || null,
                lastName: v.adminLastName.trim() || null,
              }
            : null,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Hospital created.' });
            void this.router.navigate(['/app/admin/hospitals']);
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorMessage(err, 'Create failed.'),
            });
          },
        });
      return;
    }

    this.api
      .update(this.editingId!, {
        name: v.name.trim(),
        address: v.address.trim() || null,
        phone: v.phone.trim() || null,
        email: v.email.trim() || null,
        status: v.status,
        allowHospitalBranchManagement: v.allowHospitalBranchManagement,
        licenseNumber: v.licenseNumber.trim() || null,
        taxNumber: v.taxNumber.trim() || null,
        hospitalType: v.hospitalType.trim() || null,
        hospitalSize: v.hospitalSize.trim() || null,
        currencySymbol: v.currencySymbol.trim() || null,
        dateFormat: v.dateFormat.trim() || null,
        timeFormat: v.timeFormat.trim() || null,
        defaultLanguage: v.defaultLanguage.trim() || null,
        defaultTimeZoneId: v.defaultTimeZoneId.trim() || null,
        mrnFormat: v.mrnFormat.trim() || null,
        mrnPrefix: v.mrnPrefix.trim() || null,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Hospital updated.' });
          void this.router.navigate(['/app/admin/hospitals']);
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

  private resolveDefaultMenuIds(tree: AppMenuTree[]): number[] {
    const codeToId = new Map<string, number>();
    flattenMenuTree(tree).forEach((menu) => codeToId.set(menu.code, menu.id));
    return DEFAULT_HOSPITAL_MENU_CODES.map((code) => codeToId.get(code)).filter(
      (id): id is number => id != null,
    );
  }

  openResetAdminPassword(): void {
    this.newAdminPassword = '';
    this.resetPasswordDialogOpen = true;
  }

  submitResetAdminPassword(): void {
    if (this.editingId == null) return;
    const password = this.newAdminPassword.trim();
    if (password.length < 8) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'New password must be at least 8 characters.',
      });
      return;
    }
    this.resetPasswordSaving = true;
    this.api
      .resetAdminPassword(this.editingId, { newPassword: password })
      .pipe(finalize(() => (this.resetPasswordSaving = false)))
      .subscribe({
        next: (res) => {
          this.resetPasswordDialogOpen = false;
          this.newAdminPassword = '';
          this.messages.add({
            severity: 'success',
            summary: 'Password reset',
            detail: res.message || `Password updated for ${res.userName}.`,
          });
        },
        error: (err: unknown) => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: apiErrorMessage(err, 'Password reset failed.'),
          });
        },
      });
  }

  impersonateAdministrator(): void {
    if (this.editingId == null) return;
    this.confirm.confirm({
      message:
        'Sign in as this hospital’s administrator? Your Developer session will be replaced until you sign out.',
      header: 'Impersonate administrator',
      icon: 'pi pi-user',
      acceptLabel: 'Impersonate',
      accept: () => {
        this.impersonating = true;
        this.authApi
          .impersonate({ hospitalId: this.editingId! })
          .pipe(finalize(() => (this.impersonating = false)))
          .subscribe({
            next: (res) => {
              this.session.setSession(res);
              this.messages.add({
                severity: 'success',
                summary: 'Impersonating',
                detail: `Signed in as ${res.user.userName}.`,
              });
              void this.router.navigateByUrl('/app/dashboard');
            },
            error: (err: unknown) => {
              this.messages.add({
                severity: 'error',
                summary: 'Error',
                detail: apiErrorMessage(err, 'Impersonation failed.'),
              });
            },
          });
      },
    });
  }
}
