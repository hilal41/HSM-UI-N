import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { toPascalTitle } from '../../utils/title-case.util';

/**
 * Layout shell: `hms-surface-panel` is transparent. The header band is `hms-surface-panel-inner` (global
 * styles: `--hms-card-padding` = 0.5rem on all sides, top corners rounded, bottom corners square). Body
 * projects below as sibling content.
 *
 * `title` is always shown in PascalCase words (e.g. "Stock Purchases").
 */
@Component({
  selector: 'app-surface-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  template: `
    <section
      class="hms-surface-panel flex min-h-0 min-w-0 flex-1 flex-col bg-transparent"
      [attr.aria-labelledby]="displayTitle() ? 'hms-surface-panel-title' : null"
    >
      @if (displayTitle() || headerBar()) {
        <div class="hms-surface-panel-inner shrink-0 min-w-0 w-full">
          <div
            class="flex shrink-0 min-w-0 flex-nowrap gap-x-[var(--hms-page-gutter)] gap-y-0 overflow-x-auto pb-[var(--hms-page-gutter)] [-ms-overflow-style:none] [scrollbar-width:thin]"
            [class.items-start]="!!displayTitle()"
            [class.items-center]="!displayTitle() && headerBar()"
            [class.justify-between]="!!displayTitle()"
          >
            @if (displayTitle()) {
              <div class="flex min-w-0 shrink items-start gap-2 pl-0.5 pr-[var(--hms-page-gutter)] sm:flex-1">
                <button
                  pButton
                  type="button"
                  class="hms-surface-panel-back"
                  aria-label="Go back"
                  title="Back"
                  (click)="goBack()"
                >
                  <i class="pi pi-angle-left hms-surface-panel-back__icon" aria-hidden="true"></i>
                </button>
                <div class="min-w-0 flex-1">
                  <h1
                    id="hms-surface-panel-title"
                    class="truncate text-lg font-semibold tracking-tight text-[var(--hms-color-text)]"
                  >
                    {{ displayTitle() }}
                  </h1>
                  @if (subtitle()) {
                    <p class="mt-[calc(var(--hms-page-gutter)*0.5)] truncate text-xs leading-snug text-[var(--hms-color-text-muted)]">
                      {{ subtitle() }}
                    </p>
                  }
                  <div class="mt-[var(--hms-page-gutter)] min-w-0">
                    <ng-content select="[surfacePanelHeaderFields]" />
                  </div>
                </div>
              </div>
            }
            <div
              class="flex min-w-0 flex-nowrap items-end gap-[var(--hms-page-gutter)] pt-[calc(var(--hms-page-gutter)*0.5)]"
              [class.flex-1]="!displayTitle() && headerBar()"
              [class.justify-between]="!displayTitle() && headerBar()"
              [class.justify-end]="!!displayTitle()"
              [class.shrink-0]="!!displayTitle()"
            >
              <ng-content select="[surfacePanelTitleExtras]" />
              <ng-content select="[surfacePanelActions]" />
            </div>
          </div>
        </div>
      }
      <div class="hms-surface-panel-body flex min-h-0 min-w-0 flex-1 flex-col">
        <ng-content />
      </div>
    </section>
  `,
  styles: [
    `
      .hms-surface-panel-back {
        flex: 0 0 auto;
        width: 2.25rem !important;
        height: 2.25rem !important;
        min-width: 2.25rem !important;
        min-height: 2.25rem !important;
        margin-top: 0.05rem;
        margin-left: 0.05rem;
        padding: 0 !important;
        border-radius: 999px !important;
        border: 1px solid var(--hms-color-border-input) !important;
        background:
          radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.95), transparent 34%),
          linear-gradient(135deg, var(--hms-color-canvas), var(--hms-color-primary-light)) !important;
        color: var(--hms-color-text) !important;
        box-shadow:
          0 1px 2px rgb(15 23 42 / 0.08),
          0 8px 18px rgb(37 99 235 / 0.08) !important;
        transition:
          box-shadow 0.16s ease,
          border-color 0.14s ease,
          color 0.14s ease,
          transform 0.16s ease;
      }

      .hms-surface-panel-back:hover {
        border-color: var(--hms-color-primary-border) !important;
        color: var(--hms-color-primary-hover) !important;
        transform: translateY(-1px);
        box-shadow:
          0 2px 4px rgb(15 23 42 / 0.1),
          0 10px 22px rgb(37 99 235 / 0.14) !important;
      }

      .hms-surface-panel-back:active {
        transform: translateY(0) scale(0.98);
      }

      .hms-surface-panel-back:focus-visible {
        outline: 2px solid var(--hms-color-primary-border);
        outline-offset: 2px;
      }

      .hms-surface-panel-back__icon {
        display: block;
        font-size: 1.65rem !important;
        font-weight: 300;
        line-height: 1;
      }
    `,
  ],
})
export class SurfacePanelComponent {
  private readonly location = inject(Location);

  readonly title = input<string>();
  readonly subtitle = input<string>();
  /** When true, render the top toolbar row even if `title` is empty (extras + actions only). */
  readonly headerBar = input(false);

  /** Shared page titles always render in PascalCase words. */
  readonly displayTitle = computed(() => {
    const raw = this.title();
    const formatted = toPascalTitle(raw);
    return formatted || undefined;
  });

  goBack(): void {
    this.location.back();
  }
}
