import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6 border-b border-[var(--hms-color-border)] pb-4">
      <h1 class="text-xl font-semibold text-[var(--hms-color-text)]">{{ title() }}</h1>
      @if (subtitle(); as sub) {
        <p class="mt-1 text-sm text-[var(--hms-color-text-muted)]">{{ sub }}</p>
      }
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
