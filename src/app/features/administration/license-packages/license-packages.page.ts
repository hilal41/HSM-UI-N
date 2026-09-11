import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import { MenusApiService } from '../../../core/api/menus-api.service';
import { PlatformApiService } from '../../../core/api/platform-api.service';
import type { MenuPackage } from '../../../core/models/api-contracts';
import { flattenMenuTree } from '../../../shared/components/hospital-menu-picker/hospital-menu.utils';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage, showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-license-packages-page',
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
    InputNumberModule,
    TextareaModule,
    MultiSelectModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './license-packages.page.html',
})
export class LicensePackagesPage implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly menusApi = inject(MenusApiService);
  private readonly hospitalsApi = inject(HospitalsApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  rows: MenuPackage[] = [];
  loading = false;
  errorMessage: string | null = null;

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 10);
  }

  menuOptions: { label: string; value: number }[] = [];
  hospitalOptions: { label: string; value: number }[] = [];

  dialogOpen = false;
  applyDialogOpen = false;
  saving = false;
  editingId: number | null = null;
  applyPackageId: number | null = null;

  formCode = '';
  formName = '';
  formDescription = '';
  formIsActive = true;
  formSortOrder = 0;
  formMenuIds: number[] = [];

  applyHospitalId: number | null = null;
  applyReplaceExisting = true;

  ngOnInit(): void {
    this.load();
    this.menusApi.getTree(true).subscribe({
      next: (tree) => {
        this.menuOptions = flattenMenuTree(tree)
          .filter((m) => !!m.route)
          .map((m) => ({ label: `${m.label} (${m.code})`, value: m.id }));
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Menus',
          detail: 'Unable to load menu tree.',
        });
      },
    });
    this.hospitalsApi.getAll().subscribe({
      next: (list) => {
        this.hospitalOptions = list.map((h) => ({
          label: `${h.name} (${h.code})`,
          value: h.id,
        }));
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Hospitals',
          detail: 'Unable to load hospitals.',
        });
      },
    });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getPackages()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load license packages.'),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formCode = '';
    this.formName = '';
    this.formDescription = '';
    this.formIsActive = true;
    this.formSortOrder = 0;
    this.formMenuIds = [];
    this.dialogOpen = true;
  }

  openEdit(row: MenuPackage): void {
    this.editingId = row.id;
    this.formCode = row.code;
    this.formName = row.name;
    this.formDescription = row.description ?? '';
    this.formIsActive = row.isActive;
    this.formSortOrder = row.sortOrder;
    this.formMenuIds = [...(row.menuIds ?? [])];
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  savePackage(): void {
    if (!this.formName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required.' });
      return;
    }
    if (this.editingId == null && !this.formCode.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
      return;
    }
    if (this.formMenuIds.length === 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Select at least one menu.',
      });
      return;
    }

    this.saving = true;
    if (this.editingId == null) {
      this.api
        .createPackage({
          code: this.formCode.trim().toUpperCase(),
          name: this.formName.trim(),
          description: this.formDescription.trim() || null,
          isActive: this.formIsActive,
          sortOrder: this.formSortOrder,
          menuIds: this.formMenuIds,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Package created.' });
            this.closeDialog();
            this.load();
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
      .updatePackage(this.editingId, {
        name: this.formName.trim(),
        description: this.formDescription.trim() || null,
        isActive: this.formIsActive,
        sortOrder: this.formSortOrder,
        menuIds: this.formMenuIds,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Package updated.' });
          this.closeDialog();
          this.load();
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

  confirmDelete(row: MenuPackage): void {
    this.confirm.confirm({
      message: `Delete package "${row.name}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deletePackage(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Package removed.' });
            this.load();
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

  openApply(row: MenuPackage): void {
    this.applyPackageId = row.id;
    this.applyHospitalId = this.hospitalOptions[0]?.value ?? null;
    this.applyReplaceExisting = true;
    this.applyDialogOpen = true;
  }

  applyToHospital(): void {
    if (this.applyPackageId == null || this.applyHospitalId == null) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Select a hospital.',
      });
      return;
    }
    this.saving = true;
    this.api
      .applyPackage(this.applyPackageId, this.applyHospitalId, {
        replaceExisting: this.applyReplaceExisting,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Applied',
            detail: 'Package applied to hospital.',
          });
          this.applyDialogOpen = false;
        },
        error: (err: unknown) => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: apiErrorMessage(err, 'Apply failed.'),
          });
        },
      });
  }
}
