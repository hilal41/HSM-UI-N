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
        <div class="dash-charts-grid__row">
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
        <div class="dash-charts-grid__row">
          @if (data.canViewDepartments() && data.charts()!.departmentBeds.labels.length) {
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
          }
        </div>
      }
    </section>
  `,
})
export class DashboardChartsComponent implements OnInit {
  readonly data = inject(DashboardDataService);

  readonly bedData = computed(() => {
    const charts = this.data.charts();
    if (!charts) return { labels: [], datasets: [] };
    return {
      labels: charts.departmentBeds.labels,
      datasets: [
        {
          label: 'Available beds',
          data: charts.departmentBeds.values,
          borderRadius: 10,
          borderSkipped: false,
          backgroundColor: HMS_COLORS.chartLab,
          hoverBackgroundColor: HMS_COLORS.accentLab,
          maxBarThickness: 42,
        },
      ],
    };
  });

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
