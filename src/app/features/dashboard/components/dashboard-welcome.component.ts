import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import type { ReportsPeriod } from '../../reports/reports-data.service';
import { DashboardDataService } from '../dashboard-data.service';

@Component({
  selector: 'app-dashboard-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DatePickerModule, SkeletonModule],
  styles: [
    `
      .dash-welcome {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--hms-page-gutter);
        padding: var(--hms-card-padding);
        border-radius: var(--hms-space);
        border: var(--hms-card-border);
        background: var(--hms-color-surface);
        box-shadow: var(--hms-shadow-card);
        animation: dash-rise-in 0.45s ease both;
      }

      .dash-welcome__brand {
        display: flex;
        align-items: center;
        gap: var(--hms-page-gutter);
        min-width: 0;
      }

      .dash-welcome__icon {
        flex-shrink: 0;
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 10px;
        font-size: 0.95rem;
        color: var(--hms-color-primary);
        background: var(--hms-color-primary-soft);
        border: 1px solid var(--hms-color-primary-border);
      }

      .dash-welcome__logo {
        flex-shrink: 0;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 10px;
        object-fit: contain;
        background: var(--hms-color-surface);
        border: 1px solid var(--hms-color-border);
        padding: 0.15rem;
        box-sizing: border-box;
      }

      .dash-welcome__main {
        min-width: 0;
      }

      .dash-welcome__eyebrow {
        margin: 0;
        font-size: 0.58rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hms-color-text-subtle);
        line-height: 1.2;
      }

      .dash-welcome__title {
        margin: 0.1rem 0 0;
        font-size: 0.88rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--hms-color-text);
        line-height: 1.25;
      }

      .dash-welcome__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem;
        margin: 0.12rem 0 0;
        font-size: 0.68rem;
        color: var(--hms-color-text-muted);
        line-height: 1.2;
      }

      .dash-welcome__sep {
        color: var(--hms-color-border-input);
      }

      .dash-welcome__aside {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 0.45rem;
        flex-shrink: 0;
        margin-left: auto;
        max-width: 100%;
      }

      .dash-welcome__chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.45rem;
        border-radius: 999px;
        font-size: 0.6rem;
        font-weight: 600;
        color: var(--hms-color-text-muted);
        background: var(--hms-color-primary-light);
        border: 1px solid var(--hms-color-border);
        white-space: nowrap;
      }

      .dash-welcome__chip .pi {
        font-size: 0.58rem;
      }

      .dash-welcome__date {
        font-size: 0.64rem;
        font-weight: 500;
        color: var(--hms-color-text-subtle);
        white-space: nowrap;
      }

      .dash-period-pills {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem;
        border-radius: 999px;
        background: var(--hms-color-canvas);
      }

      .dash-period-pill {
        appearance: none;
        border: 1px solid transparent;
        background: transparent;
        border-radius: 999px;
        padding: 0.28rem 0.62rem;
        font-size: 0.62rem;
        font-weight: 600;
        color: var(--hms-color-text-muted);
        cursor: pointer;
        line-height: 1.2;
        transition:
          background 0.15s ease,
          color 0.15s ease,
          border-color 0.15s ease;
      }

      .dash-period-pill:hover {
        color: var(--hms-color-primary-hover, #1d4ed8);
        background: rgb(255 255 255 / 0.85);
      }

      .dash-period-pill--active {
        color: var(--hms-color-primary-hover, #1d4ed8);
        background: var(--hms-color-surface);
        border-color: var(--hms-color-primary-border);
        box-shadow: 0 1px 2px rgb(37 99 235 / 0.08);
      }

      .dash-period-pill--icon {
        display: inline-grid;
        place-items: center;
        width: 1.55rem;
        height: 1.55rem;
        padding: 0;
      }

      .dash-period-range {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem;
      }

      :host ::ng-deep .dash-welcome-date.p-datepicker,
      :host ::ng-deep .dash-welcome-date {
        width: 6.5rem;
      }

      .dash-welcome__skeleton {
        display: flex;
        align-items: center;
        gap: var(--hms-page-gutter);
        width: 100%;
      }

      .dash-welcome__skeleton-text {
        display: flex;
        flex-direction: column;
        gap: var(--hms-page-gutter);
        flex: 1;
        min-width: 0;
      }
    `,
  ],
  template: `
    <header class="dash-welcome" aria-label="Welcome summary">
      @if (data.welcomeState() === 'loading' || data.welcomeState() === 'idle') {
        <div class="dash-welcome__skeleton">
          <p-skeleton width="2.25rem" height="2.25rem" borderRadius="10px" />
          <div class="dash-welcome__skeleton-text">
            <p-skeleton width="12rem" height="0.95rem" borderRadius="6px" />
            <p-skeleton width="16rem" height="0.7rem" borderRadius="6px" />
          </div>
        </div>
      } @else if (data.welcome(); as welcome) {
        <div class="dash-welcome__brand">
          @if (welcome.hospitalLogoBase64) {
            <img
              class="dash-welcome__logo"
              [src]="welcome.hospitalLogoBase64"
              [alt]="welcome.hospitalName ? welcome.hospitalName + ' logo' : 'Hospital logo'"
            />
          } @else {
            <span class="dash-welcome__icon" aria-hidden="true"><i class="pi pi-heart-fill"></i></span>
          }
          <div class="dash-welcome__main">
            <p class="dash-welcome__eyebrow">
              @if (welcome.hospitalName) {
                {{ welcome.hospitalName }}
              } @else {
                Hospital dashboard
              }
            </p>
            <h2 class="dash-welcome__title">Welcome back, {{ welcome.displayName }}</h2>
            <p class="dash-welcome__meta">
              @if (welcome.roleName) {
                <span>{{ welcome.roleName }}</span>
              }
              @if (welcome.hospitalTagline) {
                @if (welcome.roleName) {
                  <span class="dash-welcome__sep" aria-hidden="true">·</span>
                }
                <span>{{ welcome.hospitalTagline }}</span>
              }
            </p>
          </div>
        </div>
        <div class="dash-welcome__aside">
          @if (welcome.branchName) {
            <span class="dash-welcome__chip">
              <i class="pi pi-map-marker" aria-hidden="true"></i>
              {{ welcome.branchName }}
            </span>
          }
          @if (data.permissionsLoaded() && data.canViewVisits()) {
            <div class="dash-period-pills" role="group" aria-label="Report period">
              <button
                type="button"
                class="dash-period-pill"
                [class.dash-period-pill--active]="data.reportPeriod() === 'today'"
                (click)="applyPeriod('today')"
              >
                Today
              </button>
              <button
                type="button"
                class="dash-period-pill"
                [class.dash-period-pill--active]="data.reportPeriod() === 'week'"
                (click)="applyPeriod('week')"
              >
                This week
              </button>
              <button
                type="button"
                class="dash-period-pill"
                [class.dash-period-pill--active]="data.reportPeriod() === 'month'"
                (click)="applyPeriod('month')"
              >
                This month
              </button>
              @if (!data.showReportRangeRow()) {
                <button
                  type="button"
                  class="dash-period-pill"
                  [class.dash-period-pill--active]="data.reportPeriod() === 'range'"
                  (click)="data.openReportRangeRow()"
                >
                  Custom
                </button>
              } @else {
                <div class="dash-period-range">
                  <p-datepicker
                    [ngModel]="data.reportFromDate()"
                    (ngModelChange)="data.reportFromDate.set($event)"
                    dateFormat="yy-mm-dd"
                    [showIcon]="true"
                    iconDisplay="input"
                    appendTo="body"
                    styleClass="dash-welcome-date"
                  />
                  <p-datepicker
                    [ngModel]="data.reportToDate()"
                    (ngModelChange)="data.reportToDate.set($event)"
                    dateFormat="yy-mm-dd"
                    [showIcon]="true"
                    iconDisplay="input"
                    appendTo="body"
                    styleClass="dash-welcome-date"
                  />
                  <button
                    type="button"
                    class="dash-period-pill dash-period-pill--active"
                    (click)="data.applyReportRange()"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    class="dash-period-pill dash-period-pill--icon"
                    aria-label="Close custom range"
                    (click)="data.closeReportRangeRow()"
                  >
                    <i class="pi pi-times" aria-hidden="true"></i>
                  </button>
                </div>
              }
            </div>
          } @else {
            <time class="dash-welcome__date" [dateTime]="today().toISOString()">
              {{ today() | date: 'EEEE, MMM d' }}
            </time>
          }
        </div>
      }
    </header>
  `,
})
export class DashboardWelcomeComponent {
  readonly data = inject(DashboardDataService);
  readonly today = input(new Date());

  applyPeriod(period: ReportsPeriod): void {
    this.data.applyReportPeriod(period);
  }
}
