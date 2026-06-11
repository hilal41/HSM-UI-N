import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { ServiceCategoriesApiService } from '../../../core/api/service-categories-api.service';
import type { ServiceCategory } from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-service-categories-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './service-categories.page.html',
})
export class ServiceCategoriesPage {
  private readonly api = inject(ServiceCategoriesApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: ServiceCategory[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;

  dialogOpen = false;
  saving = false;
  editingId: number | null = null;
  formCode = '';
  formName = '';

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
          this.errorMessage = 'Unable to load service categories.';
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
    this.formCode = '';
    this.formName = '';
    this.dialogOpen = true;
  }

  openEdit(row: ServiceCategory): void {
    this.editingId = row.id;
    this.formCode = row.code;
    this.formName = row.name;
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
        .create({ code: this.formCode.trim(), name: this.formName.trim() })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Category saved.' });
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
        .update(this.editingId, { code: this.formCode.trim(), name: this.formName.trim() })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Category saved.' });
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

  confirmDelete(row: ServiceCategory): void {
    this.confirm.confirm({
      message: `Delete category "${row.name}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Category removed.' });
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
