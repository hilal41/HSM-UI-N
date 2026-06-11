import { ChangeDetectorRef, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { MedicinesApiService } from '../../../core/api/medicines-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import type {
  CreateMedicineRequest,
  Medicine,
  MedicineImportResult,
  UpdateMedicineRequest,
} from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { MedicineFormDialogComponent } from './medicine-form-dialog.component';

@Component({
  selector: 'app-medicines-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    MedicineFormDialogComponent,
  ],
  templateUrl: './medicines.page.html',
})
export class MedicinesPage {
  private readonly api = inject(MedicinesApiService);
  private readonly session = inject(AuthSessionService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly medImportInput = viewChild<ElementRef<HTMLInputElement>>('medImport');

  rows: Medicine[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;

  dialogOpen = false;
  saving = false;
  editingRow: Medicine | null = null;
  searchInput = '';

  exportingExcel = false;
  importingExcel = false;

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;
    this.loading = true;
    this.errorMessage = null;
    const search = this.searchInput.trim() || undefined;
    this.api
      .getPaged({ page, pageSize: rows, search })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load medicines.';
          this.cdr.markForCheck();
        },
      });
  }

  reloadTable(): void {
    this.loading = true;
    const search = this.searchInput.trim() || undefined;
    this.api
      .getPaged({ page: 1, pageSize: this.pageSize, search })
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

  applySearch(): void {
    this.reloadTable();
  }

  exportExcel(): void {
    this.exportingExcel = true;
    const search = this.searchInput.trim() || undefined;
    this.api
      .exportExcel({ search, activeOnly: false })
      .pipe(finalize(() => (this.exportingExcel = false)))
      .subscribe({
        next: (blob) => {
          const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `medicines-${stamp}.xlsx`;
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
    this.medImportInput()?.nativeElement.click();
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
        detail: 'Sign in with a hospital user to import, or extend this flow with a hospital picker.',
      });
      return;
    }

    const hospitalId = u.hospitalId;
    this.importingExcel = true;
    this.api
      .importExcel(file, hospitalId)
      .pipe(finalize(() => (this.importingExcel = false)))
      .subscribe({
        next: (res: MedicineImportResult) => {
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
    this.editingRow = null;
    this.dialogOpen = true;
  }

  openEdit(row: Medicine): void {
    this.editingRow = { ...row };
    this.dialogOpen = true;
  }

  onMedicineCreate(body: CreateMedicineRequest): void {
    const u = this.session.user();
    const payload: CreateMedicineRequest = { ...body };
    if (u?.hospitalId == null && (payload.hospitalId == null || payload.hospitalId <= 0)) {
      this.messages.add({
        severity: 'warn',
        summary: 'Hospital required',
        detail: 'Sign in with a hospital user, or extend the form with hospital selection for platform users.',
      });
      return;
    }
    this.saving = true;
    this.api
      .create(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Created', detail: 'Medicine saved.' });
          this.dialogOpen = false;
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
  }

  onMedicineUpdate(event: { id: number; body: UpdateMedicineRequest }): void {
    this.saving = true;
    this.api
      .update(event.id, event.body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Medicine saved.' });
          this.dialogOpen = false;
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

  confirmDelete(row: Medicine): void {
    this.confirm.confirm({
      message: `Delete medicine "${row.medicineName}" (${row.code})?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Medicine removed.' });
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
