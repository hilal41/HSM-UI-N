import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/**
 * Skeleton rows for PrimeNG `p-table` — use inside:
 * `<ng-template pTemplate="loadingbody" let-columns><app-hms-table-loading-body [cols]="columns?.length || N" /></ng-template>`
 * and set `[showLoader]="false"` on the table to hide the default spinner mask.
 */
@Component({
  selector: 'app-hms-table-loading-body',
  standalone: true,
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (r of rowIndices(); track r) {
      <tr class="hms-table-skel-tr">
        @for (c of colIndices(); track c) {
          <td class="hms-table-skel-td">
            <p-skeleton [width]="widthFor(c)" height="0.7rem" borderRadius="6px" />
          </td>
        }
      </tr>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .hms-table-skel-td {
      padding: var(--hms-table-cell-py) var(--hms-table-cell-px);
      border: none;
      vertical-align: middle;
    }
  `,
})
export class HmsTableLoadingBodyComponent {
  readonly rows = input(10);
  readonly cols = input(6);

  readonly rowIndices = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i),
  );
  readonly colIndices = computed(() =>
    Array.from({ length: Math.max(1, this.cols()) }, (_, i) => i),
  );

  widthFor(c: number): string {
    const widths = ['62%', '78%', '50%', '90%', '44%', '68%', '55%', '72%', '58%'];
    return widths[c % widths.length];
  }
}
