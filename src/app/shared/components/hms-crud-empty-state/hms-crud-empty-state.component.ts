import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Centered CRUD table empty state — use inside p-table `#emptymessage`.
 * When actionable, the large icon opens the create dialog via (action).
 */
@Component({
  selector: 'app-hms-crud-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hms-crud-empty">
      @if (actionable()) {
        <button
          type="button"
          class="hms-crud-empty__icon hms-crud-empty__icon--action"
          [attr.aria-label]="actionLabel() || title()"
          (click)="action.emit()"
        >
          <i [class]="icon()" aria-hidden="true"></i>
        </button>
      } @else {
        <span class="hms-crud-empty__icon" aria-hidden="true">
          <i [class]="icon()"></i>
        </span>
      }

      <p class="hms-crud-empty__title">{{ title() }}</p>

      @if (description()) {
        <p class="hms-crud-empty__desc">{{ description() }}</p>
      }

      @if (actionable() && actionLabel()) {
        <p class="hms-crud-empty__hint" aria-hidden="true">{{ actionLabel() }}</p>
      }
    </div>
  `,
})
export class HmsCrudEmptyStateComponent {
  readonly icon = input('pi pi-inbox');
  readonly title = input('Nothing here yet');
  readonly description = input('');
  readonly actionable = input(false);
  readonly actionLabel = input('');

  readonly action = output<void>();
}
