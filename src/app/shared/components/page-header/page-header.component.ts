import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6 border-b border-[#e6e9f3] pb-4">
      <h1 class="text-xl font-semibold text-slate-800">{{ title() }}</h1>
      @if (subtitle(); as sub) {
        <p class="mt-1 text-sm text-slate-600">{{ sub }}</p>
      }
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
