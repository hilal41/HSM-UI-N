import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { ClinicalDepartmentsApiService } from '../../../../core/api/clinical-departments-api.service';
import { WardsApiService } from '../../../../core/api/wards-api.service';
import type { Department, Ward } from '../../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-ipd-wards-page',
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
    SelectModule,
  ],
  templateUrl: './wards.page.html',
})
export class IpdWardsPage implements OnInit {
  private readonly api = inject(WardsApiService);
  private readonly deptApi = inject(ClinicalDepartmentsApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  rows: Ward[] = [];
  departments: Department[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  filterDepartmentId: number | null = null;

  dialogOpen = false;
  editingId: number | null = null;
  formDepartmentId: number | null = null;
  formCode = '';
  formName = '';
  formDescription = '';
  formSortOrder = 0;
  formStatus = 'Active';

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 10);
  }

  ngOnInit(): void {
    this.deptApi.getAll().subscribe({ next: (d) => (this.departments = d) });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getPaged(this.filterDepartmentId ?? undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load wards.'),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formDepartmentId = this.filterDepartmentId ?? this.departments[0]?.id ?? null;
    this.formCode = '';
    this.formName = '';
    this.formDescription = '';
    this.formSortOrder = 0;
    this.formStatus = 'Active';
    this.dialogOpen = true;
  }

  openEdit(row: Ward): void {
    this.editingId = row.id;
    this.formDepartmentId = row.departmentId;
    this.formCode = row.wardCode;
    this.formName = row.name;
    this.formDescription = row.description ?? '';
    this.formSortOrder = row.sortOrder;
    this.formStatus = row.status;
    this.dialogOpen = true;
  }

  save(): void {
    if (!this.formCode.trim() || !this.formName.trim() || this.formDepartmentId == null) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Department, code and name are required.' });
      return;
    }
    this.saving = true;
    const onError = (err: { error?: { message?: string } }) => {
      this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Save failed.' });
    };
    if (this.editingId == null) {
      this.api
        .create({
          departmentId: this.formDepartmentId,
          wardCode: this.formCode.trim(),
          name: this.formName.trim(),
          description: this.formDescription.trim() || null,
          sortOrder: this.formSortOrder,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Ward saved.' });
            this.dialogOpen = false;
            this.load();
          },
          error: onError,
        });
    } else {
      this.api
        .update(this.editingId, {
          wardCode: this.formCode.trim(),
          name: this.formName.trim(),
          description: this.formDescription.trim() || null,
          sortOrder: this.formSortOrder,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Ward saved.' });
            this.dialogOpen = false;
            this.load();
          },
          error: onError,
        });
    }
  }

  confirmDelete(row: Ward): void {
    this.confirm.confirm({
      message: `Delete ward "${row.name}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Ward removed.' });
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Delete failed.' });
          },
        });
      },
    });
  }
}
