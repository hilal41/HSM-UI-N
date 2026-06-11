import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { SurfacePanelComponent } from '../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CardModule, SurfacePanelComponent],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  readonly quickLinks = [
    {
      title: 'Clinical departments',
      description: 'Hospital units and bed capacity',
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
      icon: 'pi pi-user',
    },
    {
      title: 'Profile',
      description: 'Your account summary',
      route: '/app/account/profile',
      icon: 'pi pi-id-card',
    },
  ] as const;
}
