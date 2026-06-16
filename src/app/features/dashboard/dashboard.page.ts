import { ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardChartsComponent } from './components/dashboard-charts.component';
import { DashboardFinancialReportComponent } from './components/dashboard-financial-report.component';
import { DashboardQuickLinksComponent } from './components/dashboard-quick-links.component';
import { DashboardRecentVisitsComponent } from './components/dashboard-recent-visits.component';
import { DashboardStatCardsComponent } from './components/dashboard-stat-cards.component';
import { DashboardDataService } from './dashboard-data.service';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    DatePipe,
    SkeletonModule,
    DashboardStatCardsComponent,
    DashboardFinancialReportComponent,
    DashboardChartsComponent,
    DashboardRecentVisitsComponent,
    DashboardQuickLinksComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  readonly data = inject(DashboardDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  readonly linkPlaceholders = [0, 1, 2, 3, 4, 5];
  readonly financialPlaceholders = [0, 1, 2, 3, 4];
  readonly today = new Date();

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('branchRequired') === '1') {
        this.messages.add({
          severity: 'warn',
          summary: 'Branch required',
          detail: 'Select your active branch using the switcher in the header before opening clinical pages.',
          life: 8000,
        });
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { branchRequired: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
    this.data.loadWelcome();
  }
}
