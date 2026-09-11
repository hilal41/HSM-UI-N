import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { PhrmyBatch, PhrmyStockRow } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-pharmacy-stock-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
  ],
  templateUrl: './stock.page.html',
})
export class PharmacyStockPage {
  private readonly api = inject(PharmacyApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: PhrmyStockRow[] = [];
  totalCount = 0;
  loading = false;
  searchInput = '';
  lowStockOnly = false;
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  batches: PhrmyBatch[] = [];
  batchesOpen = false;
  selectedMedicineName = '';
  adjustOpen = false;
  adjustBatchId: number | null = null;
  adjustQty = 0;
  adjustReason = '';
  adjusting = false;

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.tablePageSize = rows;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.loading = true;
    this.api
      .getStock({
        page,
        pageSize: rows,
        search: this.searchInput.trim() || undefined,
        lowStockOnly: this.lowStockOnly,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () =>
          this.messages.add({ severity: 'error', summary: 'Stock', detail: 'Could not load stock.' }),
      });
  }

  openBatches(row: PhrmyStockRow): void {
    this.selectedMedicineName = row.medicineName;
    this.api.getBatches(row.medicineId).subscribe({
      next: (batches) => {
        this.batches = batches;
        this.batchesOpen = true;
        this.cdr.markForCheck();
      },
    });
  }

  openAdjust(batch: PhrmyBatch): void {
    this.adjustBatchId = batch.id;
    this.adjustQty = 0;
    this.adjustReason = '';
    this.adjustOpen = true;
  }

  saveAdjust(): void {
    if (this.adjustBatchId == null || !this.adjustReason.trim() || this.adjustQty === 0) return;
    this.adjusting = true;
    this.api
      .adjustStock({ batchId: this.adjustBatchId, qtyDelta: this.adjustQty, reason: this.adjustReason.trim() })
      .pipe(finalize(() => (this.adjusting = false)))
      .subscribe({
        next: () => {
          this.adjustOpen = false;
          this.batchesOpen = false;
          this.messages.add({ severity: 'success', summary: 'Stock', detail: 'Adjusted.' });
          this.onLazyLoad({ first: 0, rows: this.pageSize });
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Stock',
            detail: err?.error?.message ?? 'Adjustment failed.',
          }),
      });
  }
}
