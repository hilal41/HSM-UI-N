import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

@Component({
  selector: 'app-main-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    MenubarModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss',
})
export class MainShellComponent {
  private readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly menuModel: MenuItem[] = [
    {
      label: 'Overview',
      icon: 'pi pi-home',
      items: [{ label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: ['/app/dashboard'] }],
    },
    {
      label: 'Clinical',
      icon: 'pi pi-heart',
      items: [
        { label: 'Departments', icon: 'pi pi-building', routerLink: ['/app/clinical/departments'] },
        { label: 'Doctors', icon: 'pi pi-user', routerLink: ['/app/clinical/doctors'] },
        { label: 'Patients', icon: 'pi pi-users', routerLink: ['/app/clinical/patients'] },
        {
          label: 'Patient Registration',
          icon: 'pi pi-file-edit',
          routerLink: ['/app/clinical/patient-registration'],
        },
        {
          label: 'Service categories',
          icon: 'pi pi-tags',
          routerLink: ['/app/clinical/service-categories'],
        },
        { label: 'Services', icon: 'pi pi-briefcase', routerLink: ['/app/clinical/services'] },
        { label: 'Medicines', icon: 'pi pi-tablet', routerLink: ['/app/clinical/medicines'] },
        {
          label: 'Medicine usage',
          icon: 'pi pi-clock',
          routerLink: ['/app/clinical/medicine-usages'],
        },
        { label: 'Doctor Checkup', icon: 'pi pi-heart', routerLink: ['/app/clinical/doctor-checkup'] },
        {
          label: 'Checkup studio',
          icon: 'pi pi-list-check',
          routerLink: ['/app/clinical/checkup-templates'],
        },
      ],
    },
    {
      label: 'Administration',
      icon: 'pi pi-cog',
      items: [
        { label: 'Hospitals', icon: 'pi pi-building', routerLink: ['/app/admin/hospitals'] },
        { label: 'Users', icon: 'pi pi-user', routerLink: ['/app/admin/users'] },
        { label: 'Roles', icon: 'pi pi-shield', routerLink: ['/app/admin/roles'] },
        { label: 'Modules', icon: 'pi pi-th-large', routerLink: ['/app/admin/modules'] },
      ],
    },
    {
      label: 'Account',
      icon: 'pi pi-id-card',
      items: [
        { label: 'Profile', icon: 'pi pi-user', routerLink: ['/app/account/profile'] },
        { label: 'My hospital', icon: 'pi pi-map-marker', routerLink: ['/app/account/my-hospital'] },
        {
          label: 'Registration slip designer',
          icon: 'pi pi-palette',
          routerLink: ['/app/account/registration-slip-designer'],
        },
        {
          label: 'Medicine slip designer',
          icon: 'pi pi-receipt',
          routerLink: ['/app/account/medicine-slip-designer'],
        },
        {
          label: 'Change password',
          icon: 'pi pi-key',
          routerLink: ['/app/account/change-password'],
        },
      ],
    },
  ];

  readonly user = this.session.user;

  signOut(): void {
    const refresh = this.session.refreshToken();
    if (!refresh) {
      this.session.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }
    this.authApi
      .logout({ refreshToken: refresh })
      .pipe(
        finalize(() => {
          this.session.clearSession();
          void this.router.navigateByUrl('/login');
        }),
      )
      .subscribe({
        error: () => {
          this.messages.add({
            severity: 'warn',
            summary: 'Signed out',
            detail: 'Could not reach the server; your session was cleared locally.',
          });
        },
      });
  }
}
