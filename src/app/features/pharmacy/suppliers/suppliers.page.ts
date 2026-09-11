import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { PhrmySupplier, PhrmySupplierRequest } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-pharmacy-suppliers-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToggleSwitchModule,
    TagModule,
  ],
  templateUrl: './suppliers.page.html',
})
export class PharmacySuppliersPage {
  private readonly api = inject(PharmacyApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: PhrmySupplier[] = [];
  totalCount = 0;
  loading = false;
  searchInput = '';
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  get hasActiveFilter(): boolean {
    return this.searchInput.trim().length > 0;
  }

  dialogOpen = false;
  saving = false;
  editing: PhrmySupplier | null = null;
  form: PhrmySupplierRequest = this.emptyForm();

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.tablePageSize = rows;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.loading = true;
    this.api
      .getSuppliers({ page, pageSize: rows, search: this.searchInput.trim() || undefined })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () =>
          this.messages.add({ severity: 'error', summary: 'Suppliers', detail: 'Could not load suppliers.' }),
      });
  }

  openCreate(): void {
    this.editing = null;
    this.form = this.emptyForm();
    this.dialogOpen = true;
  }

  openEdit(row: PhrmySupplier): void {
    this.editing = row;
    this.form = {
      code: row.code,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      isActive: row.isActive,
    };
    this.dialogOpen = true;
  }

  save(): void {
    this.saving = true;
    const req$ = this.editing
      ? this.api.updateSupplier(this.editing.id, this.form)
      : this.api.createSupplier(this.form);
    req$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.dialogOpen = false;
        this.messages.add({ severity: 'success', summary: 'Suppliers', detail: 'Saved.' });
        this.onLazyLoad({ first: 0, rows: this.pageSize });
      },
      error: (err) =>
        this.messages.add({
          severity: 'error',
          summary: 'Suppliers',
          detail: err?.error?.message ?? 'Save failed.',
        }),
    });
  }

  remove(row: PhrmySupplier): void {
    this.confirm.confirm({
      message: `Delete supplier ${row.name}?`,
      accept: () =>
        this.api.deleteSupplier(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Suppliers', detail: 'Deleted.' });
            this.onLazyLoad({ first: 0, rows: this.pageSize });
          },
        }),
    });
  }

  private emptyForm(): PhrmySupplierRequest {
    return { code: '', name: '', phone: null, email: null, address: null, isActive: true };
  }
}
