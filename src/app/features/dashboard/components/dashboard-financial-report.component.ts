import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { HMS_COLORS } from '../../../core/theme/hms-colors';
import { DashboardDataService } from '../dashboard-data.service';
import { DashboardStatCardComponent } from './dashboard-stat-card.component';

@Component({
  selector: 'app-dashboard-financial-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartModule, SkeletonModule, DashboardStatCardComponent],
  template: `
    <section class="dash-charts-section" aria-label="Financial report">
      <div class="dash-stat-grid dash-stat-grid--financial">
        @if (data.financialState() === 'loading' || data.financialState() === 'idle') {
          @for (i of skeletonSlots; track i) {
            <app-dashboard-stat-card [loading]="true" [delay]="stagger(i)" />
          }
        } @else if (data.financialError()) {
          <div class="dash-panel dash-inline-error" role="alert">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <span>{{ data.financialError() }}</span>
          </div>
        } @else {
          @for (card of data.financialCards(); track card.key; let i = $index) {
            <app-dashboard-stat-card [card]="card" [delay]="stagger(i)" />
          }
        }
      </div>

      <article class="dash-panel dash-chart-card">
        <header class="dash-chart-card__head">
          <div>
            <h3>Revenue trend</h3>
            <p class="dash-chart-card__desc">
              @if (data.financialVisitCount() > 0) {
                {{ data.financialVisitCount() }} billed visits in the last 7 days
              } @else {
                Net amount by day (last 7 days)
              }
            </p>
          </div>
        </header>
        @if (data.financialState() === 'loading' || data.financialState() === 'idle') {
          <p-skeleton width="100%" height="12rem" borderRadius="12px" />
        } @else if (data.financialTrend(); as trend) {
          <div class="dash-chart-card__canvas dash-chart-card__canvas--featured">
            <p-chart type="bar" [data]="revenueChartData()" [options]="barOptions" />
          </div>
        }
      </article>
    </section>
  `,
})
export class DashboardFinancialReportComponent implements OnInit {
  readonly data = inject(DashboardDataService);
  readonly skeletonSlots = [0, 1, 2, 3, 4];

  readonly revenueChartData = computed(() => {
    const trend = this.data.financialTrend();
    if (!trend) return { labels: [], datasets: [] };
    return {
      labels: trend.labels,
      datasets: [
        {
          label: 'Net amount',
          data: trend.netValues,
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: 'rgba(5, 150, 105, 0.85)',
          hoverBackgroundColor: HMS_COLORS.primaryHover,
          maxBarThickness: 42,
        },
        {
          label: 'Discount',
          data: trend.discountValues,
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: 'rgba(148, 163, 184, 0.55)',
          hoverBackgroundColor: HMS_COLORS.textSubtle,
          maxBarThickness: 42,
        },
      ],
    };
  });

  readonly barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' as const },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: HMS_COLORS.textMuted,
          boxWidth: 10,
          boxHeight: 10,
          padding: 14,
          font: { size: 11, weight: '500' as const },
          usePointStyle: true,
          pointStyle: 'circle' as const,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(148, 163, 184, 0.15)', drawTicks: false },
        ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
      },
    },
  };

  ngOnInit(): void {
    this.data.loadFinancial();
  }

  stagger(index: number): string {
    return `${index * 60}ms`;
  }
}
