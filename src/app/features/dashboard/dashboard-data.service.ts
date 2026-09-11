import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, forkJoin, map, of, switchMap, take, tap } from 'rxjs';
import { ClinicalDepartmentsApiService } from '../../core/api/clinical-departments-api.service';
import { MeApiService } from '../../core/api/me-api.service';
import { PatientVisitsApiService } from '../../core/api/patient-visits-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { MenuPermissionService } from '../../core/services/menu-permission.service';
import type { PatientVisitRegisterLogItemResponse } from '../../core/models/api-contracts';
import { SessionBootstrapService } from '../../core/services/session-bootstrap.service';
import {
  resolveReportsRange,
  type ReportsDateRange,
  type ReportsPeriod,
} from '../reports/reports-data.service';

export type DashboardLoadState = 'idle' | 'loading' | 'ready' | 'error';

export type DashboardStatTone = 'blue' | 'green' | 'amber';

export interface DashboardStatCard {
  key: string;
  label: string;
  value: number;
  icon: string;
  hint: string;
  route?: string;
  valueFormat?: 'number' | 'money';
  trend?: { delta: number; label: string };
  tone?: DashboardStatTone;
}

export interface DashboardFinancialTrend {
  labels: string[];
  netValues: number[];
  serviceValues: number[];
  discountValues: number[];
}

export interface DashboardChartData {
  visitTrend: { labels: string[]; values: number[] };
  checkupSplit: { labels: string[]; values: number[] };
  departmentBeds: { labels: string[]; values: number[] };
}

export interface DashboardWelcome {
  displayName: string;
  roleName: string | null;
  hospitalName: string | null;
  hospitalLogoBase64?: string | null;
  hospitalTagline?: string | null;
  branchName?: string | null;
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

function shortDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function buildVisitTrend(items: PatientVisitRegisterLogItemResponse[], days: number): DashboardChartData['visitTrend'] {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, -(days - 1 - i));
    return { key: toYmd(day), label: shortDayLabel(day), count: 0 };
  });
  const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));

  for (const item of items) {
    const key = item.visitDate.slice(0, 10);
    const idx = indexByKey.get(key);
    if (idx != null) {
      buckets[idx].count += 1;
    }
  }

  return {
    labels: buckets.map((b) => b.label),
    values: buckets.map((b) => b.count),
  };
}

function buildCheckupSplit(items: PatientVisitRegisterLogItemResponse[]): DashboardChartData['checkupSplit'] {
  const withCheckup = items.filter((x) => x.hasCheckup).length;
  const pending = Math.max(items.length - withCheckup, 0);
  return {
    labels: ['Checked up', 'Pending'],
    values: [withCheckup, pending],
  };
}

function buildFinancialTrend(
  trend: { date: string; netAmount: number; totalServiceAmount: number; totalDiscount: number }[],
  days: number,
): DashboardFinancialTrend {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, -(days - 1 - i));
    return {
      key: toYmd(day),
      label: shortDayLabel(day),
      netAmount: 0,
      totalServiceAmount: 0,
      totalDiscount: 0,
    };
  });
  const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));

  for (const point of trend) {
    const key = point.date.slice(0, 10);
    const idx = indexByKey.get(key);
    if (idx != null) {
      buckets[idx].netAmount = point.netAmount;
      buckets[idx].totalServiceAmount = point.totalServiceAmount;
      buckets[idx].totalDiscount = point.totalDiscount;
    }
  }

  return {
    labels: buckets.map((b) => b.label),
    netValues: buckets.map((b) => b.netAmount),
    serviceValues: buckets.map((b) => b.totalServiceAmount),
    discountValues: buckets.map((b) => b.totalDiscount),
  };
}

const emptyPaged = {
  items: [] as PatientVisitRegisterLogItemResponse[],
  totalCount: 0,
  page: 1,
  pageSize: 1,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly departmentsApi = inject(ClinicalDepartmentsApiService);
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly meApi = inject(MeApiService);
  private readonly session = inject(AuthSessionService);
  private readonly menuPermissions = inject(MenuPermissionService);
  private readonly bootstrap = inject(SessionBootstrapService);

  private readonly permissionsLoaded$ = toObservable(this.menuPermissions.loaded);

  readonly welcomeState = signal<DashboardLoadState>('idle');
  readonly welcome = signal<DashboardWelcome | null>(null);
  readonly welcomeError = signal<string | null>(null);

  readonly chartsState = signal<DashboardLoadState>('idle');
  readonly charts = signal<DashboardChartData | null>(null);
  readonly chartsError = signal<string | null>(null);

  readonly recentState = signal<DashboardLoadState>('idle');
  readonly recentVisits = signal<PatientVisitRegisterLogItemResponse[]>([]);
  readonly recentTotal = signal(0);
  readonly recentError = signal<string | null>(null);

  readonly financialState = signal<DashboardLoadState>('idle');
  readonly financialCards = signal<DashboardStatCard[]>([]);
  readonly financialTrend = signal<DashboardFinancialTrend | null>(null);
  readonly financialVisitCount = signal(0);
  readonly financialError = signal<string | null>(null);

  /** Shared dashboard period filter (welcome card → service sales / related sections). */
  readonly reportPeriod = signal<ReportsPeriod>('week');
  readonly showReportRangeRow = signal(false);
  readonly reportFromDate = signal<Date | null>(null);
  readonly reportToDate = signal<Date | null>(null);
  readonly appliedReportRange = signal<ReportsDateRange>(resolveReportsRange('week'));

  readonly canViewDepartments = computed(() => this.menuPermissions.can('clinical.departments', 'view'));
  readonly canViewVisits = computed(() => this.menuPermissions.can('clinical.patient-registration', 'view'));
  readonly permissionsLoaded = computed(() => this.menuPermissions.loaded());

  applyReportPeriod(period: ReportsPeriod): void {
    this.reportPeriod.set(period);
    if (period !== 'range') {
      this.showReportRangeRow.set(false);
    }
    this.appliedReportRange.set(
      resolveReportsRange(period, this.reportFromDate(), this.reportToDate()),
    );
  }

  openReportRangeRow(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!this.reportFromDate()) {
      this.reportFromDate.set(new Date(today));
    }
    if (!this.reportToDate()) {
      this.reportToDate.set(new Date(today));
    }
    this.showReportRangeRow.set(true);
    this.reportPeriod.set('range');
  }

  closeReportRangeRow(): void {
    this.showReportRangeRow.set(false);
    if (this.reportPeriod() === 'range') {
      this.applyReportPeriod('week');
    }
  }

  applyReportRange(): void {
    this.reportPeriod.set('range');
    this.appliedReportRange.set(
      resolveReportsRange('range', this.reportFromDate(), this.reportToDate()),
    );
  }

  private queryBranchId(): number | undefined {
    const active = this.session.activeBranchId();
    return active != null && active > 0 ? active : undefined;
  }

  private whenPermissionsReady() {
    return this.permissionsLoaded$.pipe(
      filter((ready) => ready),
      take(1),
    );
  }

  loadWelcome(): void {
    if (this.welcomeState() !== 'idle') return;
    this.welcomeState.set('loading');
    this.welcomeError.set(null);

    forkJoin({
      me: this.bootstrap.ensureLoaded(),
      hospital: this.meApi.getMyHospital().pipe(catchError(() => of(null))),
    })
      .pipe(
        map(({ me, hospital }) => {
          if (!this.menuPermissions.loaded()) {
            this.menuPermissions.load(me.menuPermissions ?? []);
          }
          const name =
            [me.user.firstName, me.user.lastName].filter(Boolean).join(' ').trim() ||
            me.user.userName;
          const branch = this.session.activeBranch();
          return {
            displayName: name,
            roleName: me.roleName ?? me.user.roleName ?? null,
            hospitalName: hospital?.name ?? null,
            hospitalLogoBase64: hospital?.logoBase64?.trim() || null,
            hospitalTagline: hospital?.tagline?.trim() || null,
            branchName: branch?.name ?? null,
          } satisfies DashboardWelcome;
        }),
        catchError(() => {
          this.welcomeError.set('Unable to load your profile summary.');
          if (!this.menuPermissions.loaded()) {
            this.menuPermissions.load([]);
          }
          return of(null);
        }),
        tap((value) => {
          this.welcome.set(value);
          this.welcomeState.set(value ? 'ready' : 'error');
        }),
      )
      .subscribe();
  }

  loadCharts(): void {
    if (this.chartsState() !== 'idle') return;
    this.chartsState.set('loading');
    this.chartsError.set(null);

    this.whenPermissionsReady()
      .pipe(
        switchMap(() => {
          const canVisits = this.canViewVisits();
          const canDepartments = this.canViewDepartments();

          if (!canVisits && !canDepartments) {
            return of(null);
          }

          const today = startOfDay(new Date());
          const from = addDays(today, -6);
          const fromYmd = toYmd(from);
          const toYmdValue = toYmd(today);

          return forkJoin({
            visits: canVisits
              ? this.visitsApi
                  .getRegisterLog({
                    fromDate: fromYmd,
                    toDate: toYmdValue,
                    branchId: this.queryBranchId(),
                    page: 1,
                    pageSize: 50,
                  })
                  .pipe(catchError(() => of({ ...emptyPaged, pageSize: 50 })))
              : of(null),
            departments: canDepartments
              ? this.departmentsApi.getAll().pipe(catchError(() => of([])))
              : of(null),
          }).pipe(
            map(({ visits, departments }) => {
              const visitItems = visits?.items ?? [];
              const trend = canVisits
                ? buildVisitTrend(visitItems, 7)
                : { labels: [] as string[], values: [] as number[] };
              const checkupSplit = canVisits
                ? buildCheckupSplit(visitItems)
                : { labels: [] as string[], values: [] as number[] };
              const departmentBeds = {
                labels: (departments ?? []).map((d) => d.name),
                values: (departments ?? []).map((d) => d.availableBeds ?? 0),
              };
              return { visitTrend: trend, checkupSplit, departmentBeds } satisfies DashboardChartData;
            }),
          );
        }),
        catchError(() => {
          this.chartsError.set('Unable to load chart data.');
          return of(null);
        }),
        tap((data) => {
          this.charts.set(data);
          this.chartsState.set(this.chartsError() ? 'error' : 'ready');
        }),
      )
      .subscribe();
  }

  loadRecentVisits(): void {
    if (this.recentState() !== 'idle') return;
    this.recentState.set('loading');
    this.recentError.set(null);

    this.whenPermissionsReady()
      .pipe(
        switchMap(() => {
          if (!this.canViewVisits()) {
            return of({ ...emptyPaged, pageSize: 8 });
          }

          const today = startOfDay(new Date());
          const from = addDays(today, -2);

          return this.visitsApi
            .getRegisterLog({
              fromDate: toYmd(from),
              toDate: toYmd(today),
              branchId: this.queryBranchId(),
              page: 1,
              pageSize: 8,
            })
            .pipe(
              catchError(() => {
                this.recentError.set('Unable to load recent visits.');
                return of({ ...emptyPaged, pageSize: 8 });
              }),
            );
        }),
        tap((res) => {
          this.recentVisits.set(res.items);
          this.recentTotal.set(res.totalCount);
          this.recentState.set(this.recentError() ? 'error' : 'ready');
        }),
      )
      .subscribe();
  }

  loadFinancial(): void {
    if (this.financialState() !== 'idle') return;
    this.financialState.set('loading');
    this.financialError.set(null);

    this.whenPermissionsReady()
      .pipe(
        switchMap(() => {
          if (!this.canViewVisits()) {
            return of(null);
          }

          const today = startOfDay(new Date());
          const from = addDays(today, -6);

          return this.visitsApi
            .getFinancialSummary({
              fromDate: toYmd(from),
              toDate: toYmd(today),
              branchId: this.queryBranchId(),
            })
            .pipe(
              map((summary) => {
                const cards: DashboardStatCard[] = [
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
                    icon: 'pi pi-money-bill',
                    hint: 'Payments collected',
                    valueFormat: 'money',
                    tone: 'green',
                  },
                  {
                    key: 'outstanding-total',
                    label: 'Outstanding',
                    value: summary.outstandingAmount,
                    icon: 'pi pi-clock',
                    hint: 'Net minus received',
                    valueFormat: 'money',
                    tone: 'amber',
                  },
                ];
                return {
                  cards,
                  trend: buildFinancialTrend(summary.trend, 7),
                  visitCount: summary.visitCount,
                };
              }),
              catchError(() => {
                this.financialError.set('Unable to load financial report.');
                return of(null);
              }),
            );
        }),
        tap((result) => {
          if (!result) {
            this.financialCards.set([]);
            this.financialTrend.set(null);
            this.financialVisitCount.set(0);
            this.financialState.set(this.financialError() ? 'error' : 'ready');
            return;
          }
          this.financialCards.set(result.cards);
          this.financialTrend.set(result.trend);
          this.financialVisitCount.set(result.visitCount);
          this.financialState.set('ready');
        }),
      )
      .subscribe();
  }
}
