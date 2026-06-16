import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { HMS_COLORS } from '../../../core/theme/hms-colors';
import { DashboardDataService } from '../dashboard-data.service';

@Component({
  selector: 'app-dashboard-charts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartModule, SkeletonModule],
  template: `
    <section class="dash-charts-section" aria-label="Analytics charts">
      @if (data.chartsState() === 'loading' || data.chartsState() === 'idle') {
        <article class="dash-panel dash-chart-card dash-chart-card--skeleton">
          <p-skeleton width="35%" height="0.75rem" borderRadius="6px" />
          <p-skeleton width="100%" height="14rem" borderRadius="12px" />
        </article>
        <div class="dash-charts-grid__row">
          <article class="dash-panel dash-chart-card dash-chart-card--skeleton">
            <p-skeleton width="45%" height="0.75rem" borderRadius="6px" />
            <p-skeleton width="100%" height="11rem" borderRadius="12px" />
          </article>
          <article class="dash-panel dash-chart-card dash-chart-card--skeleton">
            <p-skeleton width="45%" height="0.75rem" borderRadius="6px" />
            <p-skeleton width="100%" height="11rem" borderRadius="12px" />
          </article>
        </div>
      } @else if (data.chartsError()) {
        <div class="dash-panel dash-inline-error" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <span>{{ data.chartsError() }}</span>
        </div>
      } @else if (data.charts()) {
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

        <div class="dash-charts-grid__row">
          <article class="dash-panel dash-chart-card" style="animation-delay: 80ms">
            <header class="dash-chart-card__head">
              <div>
                <h3>Checkup status</h3>
                <p class="dash-chart-card__desc">Completed vs pending</p>
              </div>
            </header>
            <div class="dash-chart-card__doughnut-wrap">
              <div class="dash-chart-card__canvas dash-chart-card__canvas--doughnut">
                <p-chart type="doughnut" [data]="checkupData()" [options]="doughnutOptions" />
                <div class="dash-chart-card__center" aria-hidden="true">
                  <span class="dash-chart-card__center-value">{{ checkupRate() }}%</span>
                  <span class="dash-chart-card__center-label">Checked</span>
                </div>
              </div>
              <div class="dash-chart-card__doughnut-legend" aria-hidden="true">
                <span class="dash-chart-card__legend-item">
                  <span class="dash-chart-card__legend-dot dash-chart-card__legend-dot--primary"></span>
                  Checked up
                </span>
                <span class="dash-chart-card__legend-item">
                  <span class="dash-chart-card__legend-dot dash-chart-card__legend-dot--muted"></span>
                  Pending
                </span>
              </div>
            </div>
          </article>

          <article class="dash-panel dash-chart-card" style="animation-delay: 160ms">
            <header class="dash-chart-card__head">
              <div>
                <h3>Bed capacity</h3>
                <p class="dash-chart-card__desc">Available beds by department</p>
              </div>
            </header>
            <div class="dash-chart-card__canvas">
              <p-chart type="bar" [data]="bedData()" [options]="barOptions" />
            </div>
          </article>
        </div>
      }
    </section>
  `,
})
export class DashboardChartsComponent implements OnInit {
  readonly data = inject(DashboardDataService);

  readonly checkupRate = computed(() => {
    const charts = this.data.charts();
    if (!charts) return 0;
    const [checked, pending] = charts.checkupSplit.values;
    const total = checked + pending;
    if (!total) return 0;
    return Math.round((checked / total) * 100);
  });

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
            if (!chartArea) return 'rgba(5, 150, 105, 0.08)';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(5, 150, 105, 0.28)');
            gradient.addColorStop(1, 'rgba(5, 150, 105, 0.02)');
            return gradient;
          },
          pointBackgroundColor: HMS_COLORS.primary,
          pointBorderColor: HMS_COLORS.surface,
          pointBorderWidth: 2,
        },
      ],
    };
  });

  readonly checkupData = computed(() => {
    const charts = this.data.charts();
    if (!charts) return { labels: [], datasets: [] };
    return {
      labels: charts.checkupSplit.labels,
      datasets: [
        {
          data: charts.checkupSplit.values,
          backgroundColor: [HMS_COLORS.primary, HMS_COLORS.borderInput],
          borderWidth: 0,
          hoverOffset: 8,
          spacing: 2,
        },
      ],
    };
  });

  readonly bedData = computed(() => {
    const charts = this.data.charts();
    if (!charts) return { labels: [], datasets: [] };
    return {
      labels: charts.departmentBeds.labels,
      datasets: [
        {
          label: 'Beds',
          data: charts.departmentBeds.values,
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: 'rgba(5, 150, 105, 0.75)',
          hoverBackgroundColor: HMS_COLORS.primaryHover,
          maxBarThickness: 42,
        },
      ],
    };
  });

  readonly lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
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

  readonly doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    layout: {
      padding: 0,
    },
    animation: { animateRotate: true, duration: 1000 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: HMS_COLORS.text,
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  readonly barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: 'easeOutQuart' as const },
    plugins: {
      legend: { display: false },
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
        ticks: { color: HMS_COLORS.textSubtle, font: { size: 10 }, maxRotation: 0, minRotation: 0 },
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
  }
}
