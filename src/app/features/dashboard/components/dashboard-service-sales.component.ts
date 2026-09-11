import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { catchError, of, tap } from 'rxjs';
import { PatientVisitsApiService } from '../../../core/api/patient-visits-api.service';
import type { ServiceSalesSummaryResponse } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import type { DashboardLoadState } from '../dashboard-data.service';
import { DashboardDataService } from '../dashboard-data.service';
import { DashboardRecentVisitsComponent } from './dashboard-recent-visits.component';

@Component({
  selector: 'app-dashboard-service-sales',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    SelectModule,
    SkeletonModule,
    TagModule,
    DashboardRecentVisitsComponent,
  ],
  templateUrl: './dashboard-service-sales.component.html',
  styleUrl: './dashboard-service-sales.component.scss',
})
export class DashboardServiceSalesComponent implements OnInit {
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly session = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardData = inject(DashboardDataService);

  readonly state = signal<DashboardLoadState>('idle');
  readonly error = signal<string | null>(null);
  readonly summary = signal<ServiceSalesSummaryResponse | null>(null);
  readonly showBranchFilter = signal(false);

  branchFilterOptions: { label: string; value: number | null }[] = [];
  selectedBranchFilter: number | null = null;

  readonly rowSkeletonSlots = [0, 1, 2, 3, 4];

  readonly periodBadge = computed(() => {
    switch (this.dashboardData.reportPeriod()) {
      case 'today':
        return 'Today';
      case 'week':
        return '7 days';
      case 'month':
        return 'Month';
      case 'range':
        return 'Custom';
    }
  });

  constructor() {
    toObservable(this.dashboardData.appliedReportRange)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.dashboardData.canViewVisits()) {
          this.state.set('ready');
          return;
        }
        this.reload();
      });
  }

  ngOnInit(): void {
    if (!this.dashboardData.canViewVisits()) {
      this.state.set('ready');
      return;
    }
    const branches = this.session.branches();
    this.showBranchFilter.set(branches.length > 1 && this.session.activeBranchId() == null);
    if (this.showBranchFilter()) {
      this.branchFilterOptions = [
        { label: 'All branches', value: null },
        ...branches.map((b) => ({ label: b.name, value: b.id })),
      ];
    }
  }

  reload(): void {
    this.state.set('loading');
    this.error.set(null);

    const range = this.dashboardData.appliedReportRange();
    const branchId = this.resolveBranchId();

    this.visitsApi
      .getServiceSalesSummary({
        fromDate: range.fromDate,
        toDate: range.toDate,
        branchId,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error.set('Unable to load service sales.');
          return of(null);
        }),
        tap((result) => {
          if (!result) {
            this.state.set('error');
            return;
          }
          this.summary.set(result);
          this.state.set('ready');
        }),
      )
      .subscribe();
  }

  stagger(index: number): string {
    return `${index * 50}ms`;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
  }

  serviceInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  private resolveBranchId(): number | undefined {
    const active = this.session.activeBranchId();
    if (active != null && active > 0) {
      return active;
    }
    return this.selectedBranchFilter != null && this.selectedBranchFilter > 0
      ? this.selectedBranchFilter
      : undefined;
  }
}
