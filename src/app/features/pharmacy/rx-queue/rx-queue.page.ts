import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { PhrmyRxQueueItem } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-pharmacy-rx-queue-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './rx-queue.page.html',
})
export class PharmacyRxQueuePage {
  private readonly api = inject(PharmacyApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: PhrmyRxQueueItem[] = [];
  totalCount = 0;
  loading = false;
  searchInput = '';
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    this.tablePageSize = rows;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.loading = true;
    this.api
      .getRxQueue({ page, pageSize: rows, search: this.searchInput.trim() || undefined })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () =>
          this.messages.add({ severity: 'error', summary: 'Rx queue', detail: 'Could not load queue.' }),
      });
  }

  dispense(row: PhrmyRxQueueItem): void {
    void this.router.navigate(['/app/pharmacy/dispense'], {
      queryParams: {
        checkupId: row.checkupId,
        visitId: row.patientVisitId,
        patientId: row.patientId,
      },
    });
  }
}
