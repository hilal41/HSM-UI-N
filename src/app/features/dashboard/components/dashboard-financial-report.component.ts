import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardDataService } from '../dashboard-data.service';

interface FinancialMetrics {
  service: number;
  discount: number;
  net: number;
  received: number;
  outstanding: number;
}

@Component({
  selector: 'app-dashboard-financial-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, SkeletonModule],
  templateUrl: './dashboard-financial-report.component.html',
  styleUrl: './dashboard-financial-report.component.scss',
})
export class DashboardFinancialReportComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject(DashboardDataService);

  readonly display = signal<FinancialMetrics>({
    service: 0,
    discount: 0,
    net: 0,
    received: 0,
    outstanding: 0,
  });

  readonly metrics = computed((): FinancialMetrics => {
    const cards = this.data.financialCards();
    const byKey = new Map(cards.map((c) => [c.key, c.value]));
    return {
      service: byKey.get('service-total') ?? 0,
      discount: byKey.get('discount-total') ?? 0,
      net: byKey.get('net-total') ?? 0,
      received: byKey.get('received-total') ?? 0,
      outstanding: byKey.get('outstanding-total') ?? 0,
    };
  });

  readonly isLoading = computed(
    () => this.data.financialState() === 'loading' || this.data.financialState() === 'idle',
  );

  private frameId: number | null = null;

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.display.set({ service: 0, discount: 0, net: 0, received: 0, outstanding: 0 });
        return;
      }
      this.animateTo(this.metrics());
    });
  }

  ngOnInit(): void {
    this.data.loadFinancial();
    this.destroyRef.onDestroy(() => {
      if (this.frameId != null) cancelAnimationFrame(this.frameId);
    });
  }

  private animateTo(target: FinancialMetrics): void {
    if (this.frameId != null) cancelAnimationFrame(this.frameId);

    const from = this.display();
    const start = performance.now();
    const duration = 680;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.display.set({
        service: Math.round(from.service + (target.service - from.service) * eased),
        discount: Math.round(from.discount + (target.discount - from.discount) * eased),
        net: Math.round(from.net + (target.net - from.net) * eased),
        received: Math.round(from.received + (target.received - from.received) * eased),
        outstanding: Math.round(from.outstanding + (target.outstanding - from.outstanding) * eased),
      });
      if (progress < 1) {
        this.frameId = requestAnimationFrame(step);
      }
    };

    this.frameId = requestAnimationFrame(step);
  }
}
