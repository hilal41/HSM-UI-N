import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { MeApiService } from '../../core/api/me-api.service';
import { PatientVisitsApiService } from '../../core/api/patient-visits-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import type {
  FinancialSummaryResponse,
  FinancialTrendPoint,
  PatientVisitRegisterLogItemResponse,
} from '../../core/models/api-contracts';
import type { DashboardStatCard } from '../dashboard/dashboard-data.service';

export type ReportsLoadState = 'idle' | 'loading' | 'ready' | 'error';
export type ReportsPeriod = 'today' | 'week' | 'month' | 'range';

export interface ReportsDateRange {
  fromDate: string;
  toDate: string;
}

export interface ReportsContext {
  hospitalName: string | null;
  periodLabel: string;
  generatedAt: string;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function resolveReportsRange(period: ReportsPeriod, from?: Date | null, to?: Date | null): ReportsDateRange {
  const today = startOfDay(new Date());
  switch (period) {
    case 'today':
      return { fromDate: toYmd(today), toDate: toYmd(today) };
    case 'week': {
      const fromDay = addDays(today, -6);
      return { fromDate: toYmd(fromDay), toDate: toYmd(today) };
    }
    case 'month': {
      const fromDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { fromDate: toYmd(fromDay), toDate: toYmd(today) };
    }
    case 'range': {
      const f = from ? startOfDay(from) : today;
      const t = to ? startOfDay(to) : today;
      const fromDate = toYmd(f <= t ? f : t);
      const toDate = toYmd(f <= t ? t : f);
      return { fromDate, toDate };
    }
  }
}

export function reportsPeriodLabel(period: ReportsPeriod, range: ReportsDateRange): string {
  switch (period) {
    case 'today':
      return 'Daily report';
    case 'week':
      return 'Weekly report';
    case 'month':
      return 'Monthly report';
    case 'range':
      return range.fromDate === range.toDate ? 'Daily report' : 'Custom range report';
  }
}

function buildFinancialCards(summary: FinancialSummaryResponse): DashboardStatCard[] {
  return [
    {
      key: 'service-total',
      label: 'Service charges',
      value: summary.totalServiceAmount,
      icon: 'pi pi-briefcase',
      hint: 'Total billed services',
      valueFormat: 'money',
    },
    {
      key: 'discount-total',
      label: 'Total discount',
      value: summary.totalDiscount,
      icon: 'pi pi-percentage',
      hint: 'Discounts applied',
      valueFormat: 'money',
    },
    {
      key: 'net-total',
      label: 'Net amount',
      value: summary.netAmount,
      icon: 'pi pi-wallet',
      hint: 'After discounts',
      valueFormat: 'money',
    },
    {
      key: 'received-total',
      label: 'Received',
      value: summary.totalReceived,
      icon: 'pi pi-check-circle',
      hint: 'Payments collected',
      valueFormat: 'money',
    },
    {
      key: 'outstanding-total',
      label: 'Outstanding',
      value: summary.outstandingAmount,
      icon: 'pi pi-clock',
      hint: 'Net minus received',
      valueFormat: 'money',
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class ReportsDataService {
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly meApi = inject(MeApiService);
  private readonly session = inject(AuthSessionService);

  readonly branchFilterId = signal<number | null>(null);

  readonly state = signal<ReportsLoadState>('idle');
  readonly error = signal<string | null>(null);
  readonly period = signal<ReportsPeriod>('today');
  readonly range = signal<ReportsDateRange>(resolveReportsRange('today'));
  readonly financial = signal<FinancialSummaryResponse | null>(null);
  readonly financialCards = signal<DashboardStatCard[]>([]);
  readonly trend = signal<FinancialTrendPoint[]>([]);
  readonly visits = signal<PatientVisitRegisterLogItemResponse[]>([]);
  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly context = signal<ReportsContext | null>(null);
  readonly printVisits = signal<PatientVisitRegisterLogItemResponse[]>([]);
  readonly printLoading = signal(false);

  private resolveBranchId(): number | undefined {
    const filter = this.branchFilterId();
    if (filter != null && filter > 0) return filter;
    const active = this.session.activeBranchId();
    return active != null && active > 0 ? active : undefined;
  }

  load(
    period: ReportsPeriod,
    from?: Date | null,
    to?: Date | null,
    page = 1,
    branchId?: number | null,
  ): void {
    const resolved = resolveReportsRange(period, from, to);
    this.period.set(period);
    this.range.set(resolved);
    this.page.set(page);
    if (branchId !== undefined) {
      this.branchFilterId.set(branchId);
    }
    this.state.set('loading');
    this.error.set(null);

    const queryBranchId = this.resolveBranchId();

    forkJoin({
      financial: this.visitsApi.getFinancialSummary({
        fromDate: resolved.fromDate,
        toDate: resolved.toDate,
        branchId: queryBranchId,
      }),
      visits: this.visitsApi.getRegisterLog({
        fromDate: resolved.fromDate,
        toDate: resolved.toDate,
        branchId: queryBranchId,
        page,
        pageSize: this.pageSize(),
      }),
      hospital: this.meApi.getMyHospital().pipe(catchError(() => of(null))),
    })
      .pipe(
        map(({ financial, visits, hospital }) => {
          this.financial.set(financial);
          this.financialCards.set(buildFinancialCards(financial));
          this.trend.set(financial.trend ?? []);
          this.visits.set(visits.items);
          this.totalCount.set(visits.totalCount);
          this.context.set({
            hospitalName: hospital?.name ?? null,
            periodLabel: reportsPeriodLabel(period, resolved),
            generatedAt: new Date().toISOString(),
          });
          return true;
        }),
        catchError(() => {
          this.error.set('Unable to load report data. Check your connection and try again.');
          return of(false);
        }),
        tap((ok) => this.state.set(ok ? 'ready' : 'error')),
      )
      .subscribe();
  }

  loadPage(page: number): void {
    const resolved = this.range();
    this.page.set(page);
    this.state.set('loading');
    this.error.set(null);

    this.visitsApi
      .getRegisterLog({
        fromDate: resolved.fromDate,
        toDate: resolved.toDate,
        branchId: this.resolveBranchId(),
        page,
        pageSize: this.pageSize(),
      })
      .pipe(
        tap((res) => {
          this.visits.set(res.items);
          this.totalCount.set(res.totalCount);
          this.state.set('ready');
        }),
        catchError(() => {
          this.error.set('Unable to load visit rows.');
          this.state.set('error');
          return of(null);
        }),
      )
      .subscribe();
  }

  /** Fetches every visit row in the active range for print output. */
  preparePrint(): void {
    const resolved = this.range();
    const pageSize = 200;
    this.printLoading.set(true);
    this.printVisits.set([]);

    this.visitsApi
      .getRegisterLog({
        fromDate: resolved.fromDate,
        toDate: resolved.toDate,
        branchId: this.resolveBranchId(),
        page: 1,
        pageSize,
      })
      .pipe(
        switchMap((first) => {
          const all = [...first.items];
          const totalPages = first.totalPages ?? 1;
          if (totalPages <= 1) {
            return of(all);
          }
          const branchId = this.resolveBranchId();
          const rest = Array.from({ length: totalPages - 1 }, (_, i) =>
            this.visitsApi.getRegisterLog({
              fromDate: resolved.fromDate,
              toDate: resolved.toDate,
              branchId,
              page: i + 2,
              pageSize,
            }),
          );
          return forkJoin(rest).pipe(map((pages) => pages.reduce((acc, p) => acc.concat(p.items), all)));
        }),
        tap((rows) => {
          this.printVisits.set(rows);
          this.printLoading.set(false);
        }),
        catchError(() => {
          this.printVisits.set(this.visits());
          this.printLoading.set(false);
          return of(null);
        }),
      )
      .subscribe();
  }
}
