import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import type { DashboardStatCard } from '../dashboard-data.service';

@Component({
  selector: 'app-dashboard-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, NgTemplateOutlet, RouterLink, SkeletonModule],
  styleUrl: './dashboard-stat-card.component.scss',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-width: 0;
      }

      .dash-stat-card--tone-blue {
        --stat-tone: var(--hms-color-primary);
        --stat-tone-bright: var(--hms-color-primary-bright);
        --stat-tone-soft: var(--hms-color-primary-light);
        --stat-tone-border: var(--hms-color-primary-border);
      }

      .dash-stat-card--tone-green {
        --stat-tone: var(--hms-color-success);
        --stat-tone-bright: var(--hms-color-success-bright);
        --stat-tone-soft: var(--hms-color-success-light);
        --stat-tone-border: var(--hms-color-success-border);
      }

      .dash-stat-card--tone-amber {
        --stat-tone: var(--hms-color-warn);
        --stat-tone-bright: #f59e0b;
        --stat-tone-soft: var(--hms-color-warn-light);
        --stat-tone-border: var(--hms-color-warn-border);
      }

      .dash-stat-card--tone-blue .dash-stat-card__icon,
      .dash-stat-card--tone-green .dash-stat-card__icon,
      .dash-stat-card--tone-amber .dash-stat-card__icon {
        color: var(--stat-tone);
        background: var(--stat-tone-soft);
        border-color: var(--stat-tone-border);
      }

      .dash-stat-card--tone-blue.dash-stat-card--interactive:hover,
      .dash-stat-card--tone-green.dash-stat-card--interactive:hover,
      .dash-stat-card--tone-amber.dash-stat-card--interactive:hover,
      .dash-stat-card--tone-blue.dash-stat-card--interactive:focus-visible,
      .dash-stat-card--tone-green.dash-stat-card--interactive:focus-visible,
      .dash-stat-card--tone-amber.dash-stat-card--interactive:focus-visible {
        box-shadow: 0 4px 14px color-mix(in srgb, var(--stat-tone) 18%, transparent);
      }
    `,
  ],
  template: `
    @if (loading()) {
      <div
        class="dash-stat-card dash-stat-card--skeleton dash-stat-card--tone-blue"
        [style.animation-delay]="delay()"
      >
        <p-skeleton width="2.5rem" height="2.5rem" borderRadius="12px" />
        <div class="dash-stat-card__body">
          <p-skeleton width="55%" height="0.65rem" borderRadius="6px" />
          <p-skeleton width="40%" height="1.6rem" borderRadius="6px" />
          <div class="dash-stat-card__footer">
            <p-skeleton width="50%" height="0.65rem" borderRadius="6px" />
          </div>
        </div>
        <span class="dash-stat-card__arrow dash-stat-card__arrow--hidden" aria-hidden="true">
          <i class="pi pi-arrow-right"></i>
        </span>
      </div>
    } @else if (card(); as item) {
      @if (item.route) {
        <a
          [routerLink]="item.route"
          [class]="'dash-stat-card dash-stat-card--interactive ' + toneClass(item.tone)"
          [style.animation-delay]="delay()"
        >
          <ng-container [ngTemplateOutlet]="cardInner" [ngTemplateOutletContext]="{ item }" />
        </a>
      } @else {
        <article
          [class]="'dash-stat-card ' + toneClass(item.tone)"
          [style.animation-delay]="delay()"
        >
          <ng-container [ngTemplateOutlet]="cardInner" [ngTemplateOutletContext]="{ item }" />
        </article>
      }
    }

    <ng-template #cardInner let-item="item">
      <div class="dash-stat-card__icon" aria-hidden="true">
        <i [class]="item.icon"></i>
      </div>
      <div class="dash-stat-card__body">
        <p class="dash-stat-card__label">{{ item.label }}</p>
        <p class="dash-stat-card__value">
          @if (item.valueFormat === 'money') {
            {{ displayValue() | number: '1.0-0' }}
          } @else {
            {{ displayValue() | number }}
          }
        </p>
        @if (item.trend) {
          <div class="dash-stat-card__footer">
            <p
              class="dash-stat-card__trend"
              [class.dash-stat-card__trend--up]="item.trend.delta > 0"
              [class.dash-stat-card__trend--down]="item.trend.delta < 0"
            >
              <i
                class="pi"
                [class.pi-arrow-up]="item.trend.delta > 0"
                [class.pi-arrow-down]="item.trend.delta < 0"
                [class.pi-minus]="item.trend.delta === 0"
                aria-hidden="true"
              ></i>
              <span>
                @if (item.trend.delta > 0) {
                  +{{ item.trend.delta }}
                } @else {
                  {{ item.trend.delta }}
                }
                {{ item.trend.label }}
              </span>
            </p>
          </div>
        } @else {
          <div class="dash-stat-card__footer">
            <p class="dash-stat-card__hint">{{ item.hint }}</p>
          </div>
        }
      </div>
      <span
        class="dash-stat-card__arrow"
        [class.dash-stat-card__arrow--hidden]="!item.route"
        aria-hidden="true"
      >
        <i class="pi pi-arrow-right"></i>
      </span>
    </ng-template>
  `,
})
export class DashboardStatCardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly card = input<DashboardStatCard | null>(null);
  readonly loading = input(false);
  readonly delay = input('0ms');

  readonly displayValue = signal(0);

  private frameId: number | null = null;

  constructor() {
    effect(() => {
      const target = this.card()?.value ?? 0;
      if (this.loading()) {
        this.displayValue.set(0);
        return;
      }
      this.animateCount(target);
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      if (this.frameId != null) {
        cancelAnimationFrame(this.frameId);
      }
    });
  }

  private animateCount(target: number): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }

    const start = performance.now();
    const from = this.displayValue();
    const duration = 720;
    const round = this.card()?.valueFormat === 'money';

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const raw = from + (target - from) * eased;
      const next = round ? Math.round(raw) : Math.round(raw);
      this.displayValue.set(next);
      if (progress < 1) {
        this.frameId = requestAnimationFrame(step);
      }
    };

    this.frameId = requestAnimationFrame(step);
  }

  toneClass(tone?: DashboardStatCard['tone']): string {
    return `dash-stat-card--tone-${tone ?? 'blue'}`;
  }
}
