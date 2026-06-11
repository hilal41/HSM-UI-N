import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { PatientVisitsApiService } from '../../../core/api/patient-visits-api.service';
import type { PatientVisitRegisterLogItemResponse } from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

type CheckupStatusFilter = 'unchecked' | 'checked' | 'both';

interface CheckupStatusOption {
  label: string;
  value: CheckupStatusFilter;
}

@Component({
  selector: 'app-doctor-checkup-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './doctor-checkup.page.html',
  styleUrls: ['./doctor-checkup.page.scss'],
})
export class DoctorCheckupPage {
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage: string | null = null;
  searchTerm = '';
  checkupStatusFilter: CheckupStatusFilter = 'both';
  readonly checkupStatusOptions: CheckupStatusOption[] = [
    { label: 'All patients', value: 'both' },
    { label: 'Unchecked only', value: 'unchecked' },
    { label: 'Checked only', value: 'checked' },
  ];
  activeDateFilter: 'today' | 'yesterday' | 'range' = 'today';
  /** Custom range pickers + Apply live in the toolbar row; hidden until user opens them. */
  showDateRangeRow = false;
  fromDate: Date = this.calendarToday();
  toDate: Date = this.calendarToday();
  allOpdRows: PatientVisitRegisterLogItemResponse[] = [];
  rows: PatientVisitRegisterLogItemResponse[] = [];

  constructor() {
    this.loadOpdPatients(this.fromDate, this.toDate);
  }

  loadOpdPatients(from: Date, to: Date): void {
    this.loading = true;
    this.errorMessage = null;
    this.visitsApi
      .getRegisterLog({
        page: 1,
        pageSize: 500,
        consultancyType: 'OPD',
        fromDate: this.toYmd(from),
        toDate: this.toYmd(to),
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.allOpdRows = res.items;
          this.applySearch();
        },
        error: () => {
          this.allOpdRows = [];
          this.rows = [];
          this.errorMessage = 'Unable to load OPD patient checkups.';
          this.cdr.markForCheck();
        },
      });
  }

  openDateRangeRow(): void {
    this.showDateRangeRow = true;
  }

  closeDateRangeRow(): void {
    this.showDateRangeRow = false;
  }

  applyToday(): void {
    const t = this.calendarToday();
    this.activeDateFilter = 'today';
    this.showDateRangeRow = false;
    this.fromDate = new Date(t);
    this.toDate = new Date(t);
    this.loadOpdPatients(this.fromDate, this.toDate);
  }

  applyYesterday(): void {
    const t = this.calendarToday();
    this.activeDateFilter = 'yesterday';
    this.showDateRangeRow = false;
    const y = new Date(t);
    y.setDate(y.getDate() - 1);
    this.fromDate = y;
    this.toDate = new Date(y);
    this.loadOpdPatients(this.fromDate, this.toDate);
  }

  applyRange(): void {
    if (!this.fromDate || !this.toDate) {
      return;
    }
    this.activeDateFilter = 'range';
    if (this.fromDate.getTime() <= this.toDate.getTime()) {
      this.loadOpdPatients(this.fromDate, this.toDate);
      return;
    }
    this.loadOpdPatients(this.toDate, this.fromDate);
  }

  applySearch(): void {
    const s = this.searchTerm.trim().toLowerCase();
    this.rows = this.allOpdRows.filter((x) => this.matchesCheckupStatus(x) && this.matchesSearch(x, s));
    this.cdr.markForCheck();
  }

  private matchesCheckupStatus(row: PatientVisitRegisterLogItemResponse): boolean {
    if (this.checkupStatusFilter === 'checked') return row.hasCheckup === true;
    if (this.checkupStatusFilter === 'unchecked') return row.hasCheckup !== true;
    return true;
  }

  private matchesSearch(row: PatientVisitRegisterLogItemResponse, search: string): boolean {
    if (!search) return true;
    const statusText = row.hasCheckup ? 'checked completed done' : 'unchecked pending';
    return (
      row.patientName.toLowerCase().includes(search) ||
      (row.phone || '').toLowerCase().includes(search) ||
      (row.gender || '').toLowerCase().includes(search) ||
      (row.doctorSummary || '').toLowerCase().includes(search) ||
      (row.serviceSummary1 || '').toLowerCase().includes(search) ||
      (row.serviceSummary2 || '').toLowerCase().includes(search) ||
      statusText.includes(search)
    );
  }

  /** e.g. `2 May 2026, 3:45 pm` (day without leading zero; 12h time when present). */
  formatVisitDate(iso: string): string {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) {
      return iso;
    }
    const day = dt.getDate();
    const month = dt.toLocaleString('en-GB', { month: 'long' });
    const year = dt.getFullYear();
    const datePart = `${day} ${month} ${year}`;
    const timePart = dt.toLocaleString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  }

  private calendarToday(): Date {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  openCheckupSession(row: PatientVisitRegisterLogItemResponse): void {
    void this.router.navigate(['/app/clinical/doctor-checkup/session', row.visitId]);
  }
}
