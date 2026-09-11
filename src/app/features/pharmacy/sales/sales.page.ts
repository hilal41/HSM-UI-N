import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { PhrmySale } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-pharmacy-sales-page',
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
  ],
  templateUrl: './sales.page.html',
})
export class PharmacySalesPage {
  private readonly api = inject(PharmacyApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: PhrmySale[] = [];
  totalCount = 0;
  loading = false;
  searchInput = '';
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }
  detail: PhrmySale | null = null;
  detailOpen = false;

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.tablePageSize = rows;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.loading = true;
    this.api
      .getSales({ page, pageSize: rows, search: this.searchInput.trim() || undefined })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () =>
          this.messages.add({ severity: 'error', summary: 'Sales', detail: 'Could not load sales.' }),
      });
  }

  openDetail(row: PhrmySale): void {
    this.api.getSale(row.id).subscribe({
      next: (sale) => {
        this.detail = sale;
        this.detailOpen = true;
        this.cdr.markForCheck();
      },
    });
  }
}
