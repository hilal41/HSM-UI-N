import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardChartsComponent } from './components/dashboard-charts.component';
import { DashboardFinancialReportComponent } from './components/dashboard-financial-report.component';
import { DashboardServiceSalesComponent } from './components/dashboard-service-sales.component';
import { DashboardStatCardsComponent } from './components/dashboard-stat-cards.component';
import { DashboardWelcomeComponent } from './components/dashboard-welcome.component';
import { DashboardDataService } from './dashboard-data.service';
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    SkeletonModule,
    DashboardWelcomeComponent,
    DashboardStatCardsComponent,
    DashboardFinancialReportComponent,
    DashboardServiceSalesComponent,
    DashboardChartsComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  readonly data = inject(DashboardDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly today = new Date();

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
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
