import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { finalize } from 'rxjs';
import { PatientVisitsApiService } from '../../../core/api/patient-visits-api.service';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import type { PatientVisitRegisterLogItemResponse } from '../../../core/models/api-contracts';

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calendarToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

@Component({
  selector: 'app-patient-register-log-dialog',
  imports: [
    DatePipe,
    FormsModule,
    DialogModule,
    ButtonModule,
    PaginatorModule,
    DatePickerModule,
    CheckboxModule,
    HmsBlockSkeletonComponent,
  ],
  templateUrl: './patient-register-log-dialog.component.html',
  styleUrl: './patient-register-log-dialog.component.scss',
})
export class PatientRegisterLogDialogComponent implements OnChanges {
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** When set, optional filter "current patient only" can use this id. */
  @Input() highlightPatientId: number | null = null;

  fromDate: Date | null = null;
  toDate: Date | null = null;
  limitToCurrentPatient = false;

  /** Date range UI is hidden until the user opens it via More. */
  showAdvancedFilters = false;

  readonly pageSize = 20;

  loading = false;
  rows: PatientVisitRegisterLogItemResponse[] = [];
  totalCount = 0;
  page = 1;
  activeQuickFilter: 'today' | 'yesterday' | 'last7' | 'month' | 'all' = 'today';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.showAdvancedFilters = false;
      this.resetDatesToToday();
      this.activeQuickFilter = 'today';
      this.limitToCurrentPatient = false;
      this.loadPage(1, false);
      return;
    }
    if (changes['highlightPatientId'] && this.visible) {
      this.cdr.markForCheck();
    }
  }

  onVisibleChange(v: boolean): void {
    this.visibleChange.emit(v);
    if (!v) {
      this.rows = [];
      this.totalCount = 0;
      this.showAdvancedFilters = false;
      this.cdr.markForCheck();
    }
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    this.cdr.markForCheck();
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  resetDatesToToday(): void {
    const t = calendarToday();
    this.fromDate = new Date(t);
    this.toDate = new Date(t);
    this.activeQuickFilter = 'today';
    this.cdr.markForCheck();
  }

  applyQuickFilter(kind: 'today' | 'yesterday' | 'last7' | 'month' | 'all'): void {
    const today = calendarToday();
    this.activeQuickFilter = kind;
    switch (kind) {
      case 'today':
        this.fromDate = new Date(today);
        this.toDate = new Date(today);
        break;
      case 'yesterday':
        this.fromDate = addDays(today, -1);
        this.toDate = addDays(today, -1);
        break;
      case 'last7':
        this.fromDate = addDays(today, -6);
        this.toDate = new Date(today);
        break;
      case 'month':
        this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.toDate = new Date(today);
        break;
      case 'all':
        this.fromDate = new Date(2000, 0, 1);
        this.toDate = new Date(today);
        break;
    }
    this.page = 1;
    this.loadPage(1, false);
  }

  applyFilter(): void {
    if (!this.fromDate || !this.toDate) {
      this.messages.add({
        severity: 'warn',
        summary: 'Dates',
        detail: 'Choose both from and to dates.',
      });
      return;
    }
    if (this.fromDate.getTime() > this.toDate.getTime()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Dates',
        detail: 'From date cannot be after to date.',
      });
      return;
    }
    this.page = 1;
    this.activeQuickFilter = 'all';
    this.loadPage(1, true);
  }

  onPageChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize;
    const nextPage = Math.floor((event.first ?? 0) / rows) + 1;
    this.loadPage(nextPage, false);
  }

  isHighlighted(row: PatientVisitRegisterLogItemResponse): boolean {
    return this.highlightPatientId != null && row.patientId === this.highlightPatientId;
  }

  /** Single calendar day selected (for hint text). */
  isSingleDayRange(): boolean {
    return !!(
      this.fromDate &&
      this.toDate &&
      toYmd(this.fromDate) === toYmd(this.toDate)
    );
  }

  private patientIdForQuery(): number | undefined {
    if (this.limitToCurrentPatient && this.highlightPatientId != null && this.highlightPatientId > 0) {
      return this.highlightPatientId;
    }
    return undefined;
  }

  private loadPage(page: number, collapseFiltersAfter = false): void {
    if (!this.fromDate || !this.toDate) {
      return;
    }
    this.loading = true;
    this.visitsApi
      .getRegisterLog({
        fromDate: toYmd(this.fromDate),
        toDate: toYmd(this.toDate),
        patientId: this.patientIdForQuery(),
        page,
        pageSize: this.pageSize,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.page = res.page;
          if (collapseFiltersAfter) {
            this.showAdvancedFilters = false;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.rows = [];
          this.totalCount = 0;
          this.messages.add({
            severity: 'error',
            summary: 'Recent registrations',
            detail: 'Could not load visits for the selected range.',
          });
          this.cdr.markForCheck();
        },
      });
  }
}
