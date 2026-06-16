import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SurfacePanelComponent } from '../../shared/components/surface-panel/surface-panel.component';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { DashboardStatCardComponent } from '../dashboard/components/dashboard-stat-card.component';
import {
  ReportsDataService,
  type ReportsPeriod,
} from './reports-data.service';

@Component({
  selector: 'app-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    PaginatorModule,
    TableModule,
    SelectModule,
    SurfacePanelComponent,
    DashboardStatCardComponent,
  ],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPage implements OnInit {
  readonly data = inject(ReportsDataService);
  readonly session = inject(AuthSessionService);

  readonly activePeriod = signal<ReportsPeriod>('today');
  readonly showRangeRow = signal(false);
  readonly showBranchFilter = signal(false);
  branchFilterOptions: { label: string; value: number | null }[] = [];
  selectedBranchFilter: number | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;

  ngOnInit(): void {
    const branches = this.session.branches();
    this.showBranchFilter.set(branches.length > 1 && this.session.activeBranchId() == null);
    if (this.showBranchFilter()) {
      this.branchFilterOptions = [
        { label: 'All branches', value: null },
        ...branches.map((b) => ({ label: b.name, value: b.id })),
      ];
    }
    this.applyPeriod('today');
  }

  onBranchFilterChange(): void {
    this.data.load(this.activePeriod(), this.fromDate, this.toDate, 1, this.selectedBranchFilter);
  }

  applyPeriod(period: ReportsPeriod): void {
    this.activePeriod.set(period);
    if (period !== 'range') {
      this.showRangeRow.set(false);
    }
    this.data.load(period, this.fromDate, this.toDate, 1, this.selectedBranchFilter);
  }

  openRangeRow(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!this.fromDate) {
      this.fromDate = new Date(today);
    }
    if (!this.toDate) {
      this.toDate = new Date(today);
    }
    this.showRangeRow.set(true);
    this.activePeriod.set('range');
  }

  closeRangeRow(): void {
    this.showRangeRow.set(false);
  }

  applyRange(): void {
    this.activePeriod.set('range');
    this.data.load('range', this.fromDate, this.toDate, 1, this.selectedBranchFilter);
  }

  onPageChange(event: PaginatorState): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.data.pageSize())) + 1;
    this.data.loadPage(page);
  }

  printReport(): void {
    if (this.data.printLoading()) {
      return;
    }
    this.data.preparePrint();
    const waitForRows = () => {
      if (this.data.printLoading()) {
        requestAnimationFrame(waitForRows);
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.print());
      });
    };
    waitForRows();
  }

  serviceLines(row: { serviceSummary1?: string | null; serviceSummary2?: string | null; extraServiceCount: number }): string {
    const parts = [row.serviceSummary1, row.serviceSummary2].filter(Boolean);
    if (row.extraServiceCount > 0) {
      parts.push(`+${row.extraServiceCount} more`);
    }
    return parts.length ? parts.join('; ') : '—';
  }

  rangeSubtitle(): string {
    const range = this.data.range();
    if (range.fromDate === range.toDate) {
      return `Visits and billing for ${range.fromDate}`;
    }
    return `Visits and billing from ${range.fromDate} to ${range.toDate}`;
  }
}
