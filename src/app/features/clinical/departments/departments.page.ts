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
import { ClinicalDepartmentsApiService } from '../../../core/api/clinical-departments-api.service';
import type { Department } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-departments-page',
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
  templateUrl: './departments.page.html',
})
export class DepartmentsPage implements OnInit {
  private readonly api = inject(ClinicalDepartmentsApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  rows: Department[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 10);
  }

  dialogOpen = false;
  editingId: number | null = null;

  formCode = '';
  formName = '';
  formHeadDoctorId: number | null = null;
  formDescription = '';
  formTotalBeds = 0;
  formAvailableBeds = 0;
  formStaffCount = 0;
  formStatus = 'Active';

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load departments.'),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formCode = '';
    this.formName = '';
    this.formHeadDoctorId = null;
    this.formDescription = '';
    this.formTotalBeds = 0;
    this.formAvailableBeds = 0;
    this.formStaffCount = 0;
    this.formStatus = 'Active';
    this.dialogOpen = true;
  }

  openEdit(row: Department): void {
    this.editingId = row.id;
    this.formCode = row.departmentCode;
    this.formName = row.name;
    this.formHeadDoctorId = row.headDoctorId ?? null;
    this.formDescription = row.description ?? '';
    this.formTotalBeds = row.totalBeds ?? 0;
    this.formAvailableBeds = row.availableBeds ?? 0;
    this.formStaffCount = row.staffCount ?? 0;
    this.formStatus = row.status;
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  save(): void {
    if (!this.formCode.trim() || !this.formName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code and name are required.' });
      return;
    }
    this.saving = true;
    if (this.editingId == null) {
      this.api
        .create({
          departmentCode: this.formCode.trim(),
          name: this.formName.trim(),
          headDoctorId: this.formHeadDoctorId,
          description: this.formDescription.trim() || null,
          totalBeds: this.formTotalBeds,
          availableBeds: this.formAvailableBeds,
          staffCount: this.formStaffCount,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Department saved.' });
            this.closeDialog();
            this.load();
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
          departmentCode: this.formCode.trim(),
          name: this.formName.trim(),
          headDoctorId: this.formHeadDoctorId,
          description: this.formDescription.trim() || null,
          totalBeds: this.formTotalBeds,
          availableBeds: this.formAvailableBeds,
          staffCount: this.formStaffCount,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Department saved.' });
            this.closeDialog();
            this.load();
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

  confirmDelete(row: Department): void {
    this.confirm.confirm({
      message: `Delete department "${row.name}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Department removed.' });
            this.load();
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' });
          },
        });
      },
    });
  }
}
