import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, of, tap } from 'rxjs';
import { ClinicalDepartmentsApiService } from '../../core/api/clinical-departments-api.service';
import { DoctorsApiService } from '../../core/api/doctors-api.service';
import { MeApiService } from '../../core/api/me-api.service';
import { PatientVisitsApiService } from '../../core/api/patient-visits-api.service';
import { PatientsApiService } from '../../core/api/patients-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';
import type { PatientVisitRegisterLogItemResponse } from '../../core/models/api-contracts';

export type DashboardLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface DashboardStatCard {
  key: string;
  label: string;
  value: number;
  icon: string;
  hint: string;
  route?: string;
  valueFormat?: 'number' | 'money';
  trend?: { delta: number; label: string };
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

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly patientsApi = inject(PatientsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly departmentsApi = inject(ClinicalDepartmentsApiService);
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly meApi = inject(MeApiService);
  private readonly session = inject(AuthSessionService);

  readonly welcomeState = signal<DashboardLoadState>('idle');
  readonly welcome = signal<DashboardWelcome | null>(null);
  readonly welcomeError = signal<string | null>(null);

  readonly summaryState = signal<DashboardLoadState>('idle');
  readonly summaryCards = signal<DashboardStatCard[]>([]);
  readonly summaryError = signal<string | null>(null);

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

  private queryBranchId(): number | undefined {
    const active = this.session.activeBranchId();
    return active != null && active > 0 ? active : undefined;
  }

  loadWelcome(): void {
    if (this.welcomeState() !== 'idle') return;
    this.welcomeState.set('loading');
    this.welcomeError.set(null);

    forkJoin({
      me: this.meApi.getMe(),
      hospital: this.meApi.getMyHospital().pipe(catchError(() => of(null))),
    })
      .pipe(
        map(({ me, hospital }) => {
          const name =
            [me.user.firstName, me.user.lastName].filter(Boolean).join(' ').trim() ||
            me.user.userName;
          return {
            displayName: name,
            roleName: me.roleName ?? me.user.roleName ?? null,
            hospitalName: hospital?.name ?? null,
          } satisfies DashboardWelcome;
        }),
        catchError(() => {
          this.welcomeError.set('Unable to load your profile summary.');
          return of(null);
        }),
        tap((value) => {
          this.welcome.set(value);
          this.welcomeState.set(value ? 'ready' : 'error');
        }),
      )
      .subscribe();
  }

  loadSummary(): void {
    if (this.summaryState() !== 'idle') return;
    this.summaryState.set('loading');
    this.summaryError.set(null);

    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);
    const todayYmd = toYmd(today);
    const yesterdayYmd = toYmd(yesterday);

    forkJoin({
      patients: this.patientsApi.getPaged({ page: 1, pageSize: 1 }),
      doctors: this.doctorsApi.getPaged({ page: 1, pageSize: 1 }),
      departments: this.departmentsApi.getAll(),
      visitsToday: this.visitsApi.getRegisterLog({
        fromDate: todayYmd,
        toDate: todayYmd,
        branchId: this.queryBranchId(),
        page: 1,
        pageSize: 1,
      }),
      visitsYesterday: this.visitsApi.getRegisterLog({
        fromDate: yesterdayYmd,
        toDate: yesterdayYmd,
        branchId: this.queryBranchId(),
        page: 1,
        pageSize: 1,
      }),
    })
      .pipe(
        map(({ patients, doctors, departments, visitsToday, visitsYesterday }) => {
          const todayCount = visitsToday.totalCount;
          const yesterdayCount = visitsYesterday.totalCount;
          const visitDelta = todayCount - yesterdayCount;

          const cards: DashboardStatCard[] = [
            {
              key: 'patients',
              label: 'Patients',
              value: patients.totalCount,
              icon: 'pi pi-users',
              hint: 'Registered patient records',
              route: '/app/clinical/patients',
            },
            {
              key: 'doctors',
              label: 'Doctors',
              value: doctors.totalCount,
              icon: 'pi pi-user',
              hint: 'Active clinical staff',
              route: '/app/clinical/doctors',
            },
            {
              key: 'visits',
              label: 'Visits today',
              value: todayCount,
              icon: 'pi pi-calendar',
              hint: 'Registrations for today',
              trend: {
                delta: visitDelta,
                label: 'vs yesterday',
              },
            },
            {
              key: 'departments',
              label: 'Departments',
              value: departments.length,
              icon: 'pi pi-building',
              hint: 'Clinical units',
              route: '/app/clinical/departments',
            },
          ];
          return cards;
        }),
        catchError(() => {
          this.summaryError.set('Unable to load dashboard statistics.');
          return of([] as DashboardStatCard[]);
        }),
        tap((cards) => {
          this.summaryCards.set(cards);
          this.summaryState.set(cards.length ? 'ready' : 'error');
        }),
      )
      .subscribe();
  }

  loadCharts(): void {
    if (this.chartsState() !== 'idle') return;
    this.chartsState.set('loading');
    this.chartsError.set(null);

    const today = startOfDay(new Date());
    const from = addDays(today, -6);
    const fromYmd = toYmd(from);
    const toYmdValue = toYmd(today);

    forkJoin({
      visits: this.visitsApi.getRegisterLog({
        fromDate: fromYmd,
        toDate: toYmdValue,
        branchId: this.queryBranchId(),
        page: 1,
        pageSize: 500,
      }),
      departments: this.departmentsApi.getAll(),
    })
      .pipe(
        map(({ visits, departments }) => {
          const trend = buildVisitTrend(visits.items, 7);
          const checkupSplit = buildCheckupSplit(visits.items);
          const departmentBeds = {
            labels: departments.map((d) => d.name),
            values: departments.map((d) => d.totalBeds ?? 0),
          };
          return { visitTrend: trend, checkupSplit, departmentBeds } satisfies DashboardChartData;
        }),
        catchError(() => {
          this.chartsError.set('Unable to load chart data.');
          return of(null);
        }),
        tap((data) => {
          this.charts.set(data);
          this.chartsState.set(data ? 'ready' : 'error');
        }),
      )
      .subscribe();
  }

  loadRecentVisits(): void {
    if (this.recentState() !== 'idle') return;
    this.recentState.set('loading');
    this.recentError.set(null);

    const today = startOfDay(new Date());
    const from = addDays(today, -2);

    this.visitsApi
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
          return of({ items: [], totalCount: 0, page: 1, pageSize: 8, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
        }),
        tap((res) => {
          this.recentVisits.set(res.items);
          this.recentTotal.set(res.totalCount);
          this.recentState.set('ready');
        }),
      )
      .subscribe();
  }

  loadFinancial(): void {
    if (this.financialState() !== 'idle') return;
    this.financialState.set('loading');
    this.financialError.set(null);

    const today = startOfDay(new Date());
    const from = addDays(today, -6);

    this.visitsApi
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
        tap((result) => {
          if (!result) {
            this.financialState.set('error');
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
