import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { PhrmyReturn, PhrmySale } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-pharmacy-returns-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
  ],
  templateUrl: './returns.page.html',
})
export class PharmacyReturnsPage {
  private readonly api = inject(PharmacyApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: PhrmyReturn[] = [];
  totalCount = 0;
  loading = false;
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  createOpen = false;
  saleIdInput = '';
  sale: PhrmySale | null = null;
  reason = '';
  returnQtys: Record<number, number> = {};
  saving = false;

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.tablePageSize = rows;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.loading = true;
    this.api
      .getReturns({ page, pageSize: rows })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
      });
  }

  loadSale(): void {
    const id = Number(this.saleIdInput);
    if (!id) return;
    this.api.getSale(id).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.returnQtys = {};
        for (const l of sale.lines) this.returnQtys[l.id] = 0;
        this.cdr.markForCheck();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Returns', detail: 'Sale not found.' }),
    });
  }

  submitReturn(): void {
    if (!this.sale) return;
    const lines = this.sale.lines
      .filter((l) => (this.returnQtys[l.id] ?? 0) > 0)
      .map((l) => ({ saleLineId: l.id, qty: this.returnQtys[l.id] }));
    if (lines.length === 0) return;
    this.saving = true;
    this.api
      .createReturn({ saleId: this.sale.id, reason: this.reason || null, lines })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.createOpen = false;
          this.sale = null;
          this.messages.add({ severity: 'success', summary: 'Returns', detail: 'Return completed.' });
          this.onLazyLoad({ first: 0, rows: this.pageSize });
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Returns',
            detail: err?.error?.message ?? 'Return failed.',
          }),
      });
  }
}
