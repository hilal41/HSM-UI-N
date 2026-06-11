import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Layout shell: `hms-surface-panel` is transparent. The header band is `hms-surface-panel-inner` (global
 * styles: `--hms-card-padding` = 0.5rem on all sides, top corners rounded, bottom corners square). Body
 * projects below as sibling content.
 */
@Component({
  selector: 'app-surface-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  template: `
    <section
      class="hms-surface-panel flex min-h-0 min-w-0 flex-1 flex-col bg-transparent"
      [attr.aria-labelledby]="title() ? 'hms-surface-panel-title' : null"
    >
      @if (title() || headerBar()) {
        <div class="hms-surface-panel-inner shrink-0 min-w-0 w-full">
          <div
            class="flex shrink-0 min-w-0 flex-nowrap gap-x-[var(--hms-page-gutter)] gap-y-0 overflow-x-auto pb-[var(--hms-page-gutter)] [-ms-overflow-style:none] [scrollbar-width:thin]"
            [class.items-start]="!!title()"
            [class.items-center]="!title() && headerBar()"
            [class.justify-between]="!!title()"
          >
            @if (title()) {
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
                    class="truncate text-lg font-semibold tracking-tight text-slate-900"
                  >
                    {{ title() }}
                  </h1>
                  @if (subtitle()) {
                    <p class="mt-[calc(var(--hms-page-gutter)*0.5)] truncate text-xs leading-snug text-slate-600">
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
              [class.flex-1]="!title() && headerBar()"
              [class.justify-between]="!title() && headerBar()"
              [class.justify-end]="!!title()"
              [class.shrink-0]="!!title()"
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
        border: 1px solid rgb(203 213 225 / 0.9) !important;
        background:
          radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.95), transparent 34%),
          linear-gradient(135deg, #f8fafc, #eef2ff) !important;
        color: #0f172a !important;
        box-shadow:
          0 1px 2px rgb(15 23 42 / 0.08),
          0 8px 18px rgb(15 23 42 / 0.07) !important;
        transition:
          box-shadow 0.16s ease,
          border-color 0.14s ease,
          color 0.14s ease,
          transform 0.16s ease;
      }

      .hms-surface-panel-back:hover {
        border-color: rgb(16 185 129 / 0.55) !important;
        color: #0f172a !important;
        transform: translateY(-1px);
        box-shadow:
          0 2px 4px rgb(15 23 42 / 0.1),
          0 10px 22px rgb(16 185 129 / 0.14) !important;
      }

      .hms-surface-panel-back:active {
        transform: translateY(0) scale(0.98);
      }

      .hms-surface-panel-back:focus-visible {
        outline: 2px solid rgb(34 197 94 / 0.55);
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

  goBack(): void {
    this.location.back();
  }
}
