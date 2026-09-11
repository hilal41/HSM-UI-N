import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { HMS_COLORS } from '../../../core/theme/hms-colors';
import { DashboardDataService } from '../dashboard-data.service';

@Component({
  selector: 'app-dashboard-stat-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartModule, SkeletonModule],
  template: `
    <section class="dash-section dash-section--stats" aria-label="Visit and revenue trends">
      @if (data.canViewVisits()) {
        <div class="dash-charts-grid__row dash-charts-grid__row--activity">
          @if (data.chartsState() === 'loading' || data.chartsState() === 'idle' || data.financialState() === 'loading' || data.financialState() === 'idle') {
            <article class="dash-panel dash-chart-card dash-chart-card--skeleton">
              <p-skeleton width="35%" height="0.75rem" borderRadius="6px" />
              <p-skeleton width="100%" height="10rem" borderRadius="12px" />
            </article>
            <article class="dash-panel dash-chart-card dash-chart-card--skeleton">
              <p-skeleton width="35%" height="0.75rem" borderRadius="6px" />
              <p-skeleton width="100%" height="10rem" borderRadius="12px" />
            </article>
          } @else {
            @if (data.chartsError()) {
              <article class="dash-panel dash-inline-error" role="alert">
                <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                <span>{{ data.chartsError() }}</span>
              </article>
            } @else if ((data.charts()?.visitTrend?.values?.length ?? 0) > 0) {
              <article class="dash-panel dash-chart-card" style="animation-delay: 0ms">
                <header class="dash-chart-card__head">
                  <div>
                    <h3>Visit trend</h3>
                    <p class="dash-chart-card__desc">Daily registrations across the week</p>
                  </div>
                  <span class="dash-chart-card__badge">7 days</span>
                </header>
                <div class="dash-chart-card__canvas dash-chart-card__canvas--featured">
                  <p-chart type="line" [data]="visitTrendData()" [options]="lineOptions" />
                </div>
              </article>
            }

            @if (data.financialError()) {
              <article class="dash-panel dash-inline-error" role="alert">
                <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                <span>{{ data.financialError() }}</span>
              </article>
            } @else if (data.financialTrend()) {
              <article class="dash-panel dash-chart-card" style="animation-delay: 80ms">
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
                  <span class="dash-chart-card__badge">7 days</span>
                </header>
                <div class="dash-chart-card__canvas dash-chart-card__canvas--featured">
                  <p-chart type="bar" [data]="revenueChartData()" [options]="barOptions" />
                </div>
              </article>
            }
          }
        </div>
      }
    </section>
  `,
})
export class DashboardStatCardsComponent implements OnInit {
  readonly data = inject(DashboardDataService);

  readonly visitTrendData = computed(() => {
    const charts = this.data.charts();
    if (!charts) return { labels: [], datasets: [] };
    return {
      labels: charts.visitTrend.labels,
      datasets: [
        {
          label: 'Visits',
          data: charts.visitTrend.values,
          fill: true,
          tension: 0.42,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderColor: HMS_COLORS.primaryBright,
          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
            const { ctx: canvasCtx, chartArea } = ctx.chart;
            if (!chartArea) return 'rgba(37, 99, 235, 0.08)';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0.02)');
            return gradient;
          },
          pointBackgroundColor: HMS_COLORS.primary,
          pointBorderColor: HMS_COLORS.surface,
          pointBorderWidth: 2,
        },
      ],
    };
  });

  readonly lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 4, bottom: 0 } },
    interaction: { mode: 'index' as const, intersect: false },
    animation: { duration: 1000, easing: 'easeOutQuart' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: HMS_COLORS.text,
        titleFont: { size: 12, weight: '600' as const },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: HMS_COLORS.textSubtle, font: { size: 11, weight: '500' as const }, padding: 8 },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(148, 163, 184, 0.15)', drawTicks: false },
        ticks: { color: HMS_COLORS.textSubtle, font: { size: 11 }, precision: 0, padding: 10 },
      },
    },
  };

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
          backgroundColor: HMS_COLORS.chartPrimary,
          hoverBackgroundColor: HMS_COLORS.primaryHover,
          maxBarThickness: 42,
        },
        {
          label: 'Discount',
          data: trend.discountValues,
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: HMS_COLORS.chartBilling,
          hoverBackgroundColor: HMS_COLORS.warn,
          maxBarThickness: 42,
        },
      ],
    };
  });

  readonly barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 4, bottom: 0 } },
    animation: { duration: 900, easing: 'easeOutQuart' as const },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: HMS_COLORS.textMuted,
          boxWidth: 10,
          boxHeight: 10,
          padding: 6,
          font: { size: 10, weight: '500' as const },
          usePointStyle: true,
          pointStyle: 'circle' as const,
        },
      },
      tooltip: {
        backgroundColor: HMS_COLORS.text,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: HMS_COLORS.textSubtle, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(148, 163, 184, 0.15)', drawTicks: false },
        ticks: { color: HMS_COLORS.textSubtle, font: { size: 11 }, precision: 0 },
      },
    },
  };

  ngOnInit(): void {
    this.data.loadCharts();
    this.data.loadFinancial();
  }
}
