import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/** Stacked line skeletons for forms, dialogs, and non-table loading states. */
@Component({
  selector: 'app-hms-block-skeleton',
  standalone: true,
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hms-block-skel" role="status" aria-live="polite" aria-busy="true" [attr.aria-label]="ariaLabel()">
      @for (i of lineIndices(); track i) {
        <p-skeleton [height]="lineHeight(i)" [width]="lineWidth(i)" borderRadius="6px" />
      }
    </div>
  `,
  styles: `
    .hms-block-skel {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      width: 100%;
      min-height: 0;
      flex: 1 1 auto;
      padding: 0.15rem 0;
    }
  `,
})
export class HmsBlockSkeletonComponent {
  readonly lines = input(10);
  readonly ariaLabel = input('Loading');

  readonly lineIndices = computed(() =>
    Array.from({ length: this.lines() }, (_, i) => i),
  );

  lineHeight(i: number): string {
    return i % 4 === 0 ? '1.05rem' : '0.72rem';
  }

  lineWidth(i: number): string {
    const widths = ['100%', '92%', '88%', '95%', '70%', '100%', '55%', '100%', '78%'];
    return widths[i % widths.length];
  }
}
