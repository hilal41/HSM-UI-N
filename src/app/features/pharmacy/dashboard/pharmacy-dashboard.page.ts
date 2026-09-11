import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { PhrmyDashboard } from '../../../core/models/api-contracts';
import { DashboardStatCardComponent } from '../../dashboard/components/dashboard-stat-card.component';
import type { DashboardStatCard } from '../../dashboard/dashboard-data.service';

interface PharmacyQuickLink {
  route: string;
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-pharmacy-dashboard-page',
  imports: [RouterLink, DashboardStatCardComponent],
  templateUrl: './pharmacy-dashboard.page.html',
  styleUrl: './pharmacy-dashboard.page.scss',
})
export class PharmacyDashboardPage implements OnInit {
  private readonly api = inject(PharmacyApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly quickLinks: PharmacyQuickLink[] = [
    {
      route: '/app/pharmacy/dispense',
      icon: 'pi pi-cart-plus',
      title: 'Dispense',
      desc: 'Fill prescriptions and OTC sales',
    },
    {
      route: '/app/pharmacy/rx-queue',
      icon: 'pi pi-inbox',
      title: 'Rx queue',
      desc: 'Pending prescriptions',
    },
    {
      route: '/app/pharmacy/purchases',
      icon: 'pi pi-truck',
      title: 'Receive goods',
      desc: 'Goods receipt and purchase orders',
    },
    {
      route: '/app/pharmacy/stock',
      icon: 'pi pi-box',
      title: 'Stock',
      desc: 'Inventory levels and batches',
    },
    {
      route: '/app/pharmacy/suppliers',
      icon: 'pi pi-building',
      title: 'Suppliers',
      desc: 'Vendor directory',
    },
    {
      route: '/app/pharmacy/sales',
      icon: 'pi pi-shopping-bag',
      title: 'Sales',
      desc: 'Completed sale history',
    },
    {
      route: '/app/pharmacy/returns',
      icon: 'pi pi-replay',
      title: 'Returns',
      desc: 'Customer and supplier returns',
    },
    {
      route: '/app/pharmacy/reports',
      icon: 'pi pi-chart-bar',
      title: 'Reports',
      desc: 'Expiring, low stock, and sales',
    },
  ];

  loading = true;
  errorMessage: string | null = null;
  statCards: DashboardStatCard[] = [];

  ngOnInit(): void {
    this.api
      .getDashboard()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.errorMessage = null;
          this.statCards = this.buildStatCards(data);
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Could not load pharmacy dashboard.';
          this.statCards = [];
          this.cdr.markForCheck();
        },
      });
  }

  private buildStatCards(data: PhrmyDashboard): DashboardStatCard[] {
    return [
      {
        key: 'pending-rx',
        label: 'Pending Rx',
        value: data.pendingRxCount,
        icon: 'pi pi-inbox',
        hint: 'Awaiting dispense',
        route: '/app/pharmacy/rx-queue',
        tone: 'blue',
      },
      {
        key: 'low-stock',
        label: 'Low stock',
        value: data.lowStockCount,
        icon: 'pi pi-exclamation-triangle',
        hint: 'Items below threshold',
        route: '/app/pharmacy/stock',
        tone: 'amber',
      },
      {
        key: 'expiring',
        label: 'Expiring soon',
        value: data.expiringSoonCount,
        icon: 'pi pi-clock',
        hint: 'Batches nearing expiry',
        route: '/app/pharmacy/reports',
        tone: 'amber',
      },
      {
        key: 'today-sales',
        label: 'Today sales',
        value: data.todaySalesTotal,
        icon: 'pi pi-shopping-bag',
        hint: `${data.todaySalesCount} sales today`,
        route: '/app/pharmacy/sales',
        valueFormat: 'money',
        tone: 'green',
      },
    ];
  }
}
