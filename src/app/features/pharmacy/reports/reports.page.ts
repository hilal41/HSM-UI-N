import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type {
  PhrmyBatch,
  PhrmySalesReportRow,
  PhrmyStockMovementReportRow,
  PhrmyStockRow,
} from '../../../core/models/api-contracts';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-pharmacy-reports-page',
  imports: [DatePipe, FormsModule, SurfacePanelComponent, TableModule, ButtonModule, InputTextModule],
  templateUrl: './reports.page.html',
})
export class PharmacyReportsPage implements OnInit {
  private readonly api = inject(PharmacyApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  tab: 'expiry' | 'low' | 'sales' | 'movements' = 'expiry';
  expiring: PhrmyBatch[] = [];
  lowStock: PhrmyStockRow[] = [];
  sales: PhrmySalesReportRow[] = [];
  movements: PhrmyStockMovementReportRow[] = [];
  from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.loadExpiry();
  }

  loadExpiry(): void {
    this.tab = 'expiry';
    this.api.getExpiring(90).subscribe({
      next: (rows) => {
        this.expiring = rows;
        this.cdr.markForCheck();
      },
    });
  }

  loadLow(): void {
    this.tab = 'low';
    this.api.getLowStock().subscribe({
      next: (rows) => {
        this.lowStock = rows;
        this.cdr.markForCheck();
      },
    });
  }

  loadSales(): void {
    this.tab = 'sales';
    this.api.getSalesReport(this.from, this.to).subscribe({
      next: (rows) => {
        this.sales = rows;
        this.cdr.markForCheck();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Reports', detail: 'Sales report failed.' }),
    });
  }

  loadMovements(): void {
    this.tab = 'movements';
    this.api.getStockMovements(this.from, this.to).subscribe({
      next: (rows) => {
        this.movements = rows;
        this.cdr.markForCheck();
      },
    });
  }
}
