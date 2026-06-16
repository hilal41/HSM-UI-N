import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DashboardDataService } from '../dashboard-data.service';
import { DashboardStatCardComponent } from './dashboard-stat-card.component';

@Component({
  selector: 'app-dashboard-stat-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardStatCardComponent],
  template: `
    <section class="dash-section dash-section--stats" aria-label="Key statistics">
      <div class="dash-stat-grid">
        @if (data.summaryState() === 'loading' || data.summaryState() === 'idle') {
          @for (i of skeletonSlots; track i) {
            <app-dashboard-stat-card [loading]="true" [delay]="stagger(i)" />
          }
        } @else if (data.summaryError()) {
          <div class="dash-inline-error" role="alert">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <span>{{ data.summaryError() }}</span>
          </div>
        } @else {
          @for (card of data.summaryCards(); track card.key; let i = $index) {
            <app-dashboard-stat-card [card]="card" [delay]="stagger(i)" />
          }
        }
      </div>
    </section>
  `,
})
export class DashboardStatCardsComponent implements OnInit {
  readonly data = inject(DashboardDataService);
  readonly skeletonSlots = [0, 1, 2, 3];

  ngOnInit(): void {
    this.data.loadSummary();
  }

  stagger(index: number): string {
    return `${index * 70}ms`;
  }
}
