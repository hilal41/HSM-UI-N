import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { BillingApiService } from '../../../core/api/billing-api.service';
import type { BillingDayEndSummary } from '../../../core/models/api-contracts';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage } from '../../../shared/utils/crud-page.state';
import { DashboardStatCardComponent } from '../../dashboard/components/dashboard-stat-card.component';
import type { DashboardStatCard } from '../../dashboard/dashboard-data.service';

@Component({
  selector: 'app-billing-reports-page',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CurrencyPipe,
    FormsModule,
    SurfacePanelComponent,
    ButtonModule,
    TableModule,
    TagModule,
    DashboardStatCardComponent,
  ],
  templateUrl: './billing-reports.page.html',
  styleUrl: './billing-reports.page.scss',
})
export class BillingReportsPage implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  businessDate = new Date().toISOString().slice(0, 10);
  summary: BillingDayEndSummary | null = null;
  kpiCards: DashboardStatCard[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getDayEnd(this.businessDate)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (s) => {
          this.summary = s;
          this.kpiCards = [
            {
              key: 'cash',
              label: 'Cash',
              value: s.totalCash,
              icon: 'pi pi-wallet',
              hint: 'Cash payments today',
              valueFormat: 'money',
              tone: 'green',
            },
            {
              key: 'noncash',
              label: 'Non-Cash',
              value: s.totalNonCash,
              icon: 'pi pi-credit-card',
              hint: 'Card, bank & other',
              valueFormat: 'money',
              tone: 'blue',
            },
            {
              key: 'total',
              label: 'Total Collected',
              value: s.totalCollected,
              icon: 'pi pi-chart-line',
              hint: 'All methods',
              valueFormat: 'money',
              tone: 'blue',
            },
            {
              key: 'outstanding',
              label: 'Outstanding',
              value: s.outstandingBalance,
              icon: 'pi pi-exclamation-circle',
              hint: 'Unpaid invoice balance',
              valueFormat: 'money',
              tone: 'amber',
            },
          ];
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Reports',
            detail: apiErrorMessage(err, 'Could not load day-end summary.'),
          }),
      });
  }
}
