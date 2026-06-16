import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-quick-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="dash-panel dash-section dash-section--links" aria-label="Quick links">
      <div class="dash-section-head">
        <div class="dash-section-head__title-wrap">
          <span class="dash-section-icon" aria-hidden="true"><i class="pi pi-th-large"></i></span>
          <div>
            <h2 class="dash-section-title">Quick access</h2>
            <p class="dash-section-subtitle">Frequently used modules</p>
          </div>
        </div>
      </div>

      <nav class="dash-links-list" aria-label="Quick navigation">
        @for (card of quickLinks; track card.route; let i = $index) {
          <a
            [routerLink]="card.route"
            class="dash-link-item"
            [style.animation-delay]="stagger(i)"
          >
            <span class="dash-link-item__icon" aria-hidden="true">
              <i [class]="card.icon"></i>
            </span>
            <span class="dash-link-item__text">
              <span class="dash-link-item__title">{{ card.title }}</span>
              <span class="dash-link-item__desc">{{ card.description }}</span>
            </span>
            <span class="dash-link-item__arrow" aria-hidden="true">
              <i class="pi pi-chevron-right"></i>
            </span>
          </a>
        }
      </nav>
    </section>
  `,
})
export class DashboardQuickLinksComponent {
  readonly quickLinks = [
    {
      title: 'Reports',
      description: 'Daily, weekly & monthly reports',
      route: '/app/reports',
      icon: 'pi pi-file',
    },
    {
      title: 'Clinical departments',
      description: 'Units and bed capacity',
      route: '/app/clinical/departments',
      icon: 'pi pi-building',
    },
    {
      title: 'Doctors',
      description: 'Clinical staff directory',
      route: '/app/clinical/doctors',
      icon: 'pi pi-user',
    },
    {
      title: 'Patients',
      description: 'Patient records',
      route: '/app/clinical/patients',
      icon: 'pi pi-users',
    },
    {
      title: 'Hospitals',
      description: 'Tenant hospitals',
      route: '/app/admin/hospitals',
      icon: 'pi pi-sitemap',
    },
    {
      title: 'Users',
      description: 'Platform accounts',
      route: '/app/admin/users',
      icon: 'pi pi-id-card',
    },
    {
      title: 'Profile',
      description: 'Your account summary',
      route: '/app/account/profile',
      icon: 'pi pi-cog',
    },
  ] as const;

  stagger(index: number): string {
    return `${index * 45}ms`;
  }
}
