import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardDataService } from '../dashboard-data.service';

@Component({
  selector: 'app-dashboard-recent-visits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, TagModule, SkeletonModule],
  template: `
    <section class="dash-panel dash-section dash-section--recent" aria-label="Recent visits">
      <div class="dash-section-head">
        <div class="dash-section-head__title-wrap">
          <span class="dash-section-icon" aria-hidden="true"><i class="pi pi-history"></i></span>
          <div>
            <h2 class="dash-section-title">Recent visits</h2>
            <p class="dash-section-subtitle">
              @if (data.recentTotal() > 0) {
                {{ data.recentTotal() }} visits in the last 3 days
              } @else {
                Latest patient registrations
              }
            </p>
          </div>
        </div>
        <a routerLink="/app/clinical/patient-registration" class="dash-section-action">
          View all
          <i class="pi pi-arrow-right" aria-hidden="true"></i>
        </a>
      </div>

      @if (data.recentState() === 'loading' || data.recentState() === 'idle') {
        <div class="dash-recent-list dash-recent-list--skeleton">
          @for (i of skeletonSlots; track i) {
            <div class="dash-recent-row">
              <p-skeleton shape="circle" size="2.25rem" />
              <div class="dash-recent-row__main">
                <p-skeleton width="55%" height="0.7rem" borderRadius="6px" />
                <p-skeleton width="35%" height="0.55rem" borderRadius="6px" />
              </div>
              <p-skeleton width="4.5rem" height="1.3rem" borderRadius="999px" />
            </div>
          }
        </div>
      } @else if (data.recentError()) {
        <div class="dash-inline-error" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <span>{{ data.recentError() }}</span>
        </div>
      } @else if (!data.recentVisits().length) {
        <div class="dash-empty-state">
          <span class="dash-empty-state__icon" aria-hidden="true"><i class="pi pi-inbox"></i></span>
          <p class="dash-empty-state__title">No recent visits</p>
          <p class="dash-empty-state__desc">New registrations will appear here automatically.</p>
        </div>
      } @else {
        <div class="dash-recent-list">
          @for (visit of data.recentVisits(); track visit.visitId; let i = $index) {
            <div class="dash-recent-row" [style.animation-delay]="stagger(i)">
              <span class="dash-avatar" [attr.aria-label]="visit.patientName + ' avatar'">
                {{ initials(visit.patientName) }}
              </span>
              <div class="dash-recent-row__main">
                <p class="dash-recent-row__name">{{ visit.patientName }}</p>
                <p class="dash-recent-row__meta">
                  <span>{{ visit.gender }}</span>
                  <span class="dash-recent-row__sep" aria-hidden="true">·</span>
                  <span>{{ visit.ageYears }} yrs</span>
                  @if (visit.branchName) {
                    <span class="dash-recent-row__sep" aria-hidden="true">·</span>
                    <span>{{ visit.branchName }}</span>
                  }
                  @if (visit.phone) {
                    <span class="dash-recent-row__sep" aria-hidden="true">·</span>
                    <span>{{ visit.phone }}</span>
                  }
                </p>
              </div>
              <div class="dash-recent-row__end">
                <time class="dash-recent-row__date" [dateTime]="visit.visitDate">
                  {{ visit.visitDate | date: 'MMM d, HH:mm' }}
                </time>
                <p-tag
                  [value]="visit.hasCheckup ? 'Checked' : 'Pending'"
                  [severity]="visit.hasCheckup ? 'success' : 'warn'"
                  [rounded]="true"
                />
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class DashboardRecentVisitsComponent implements OnInit {
  readonly data = inject(DashboardDataService);
  readonly skeletonSlots = [0, 1, 2, 3, 4];

  ngOnInit(): void {
    this.data.loadRecentVisits();
  }

  stagger(index: number): string {
    return `${index * 50}ms`;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
}
