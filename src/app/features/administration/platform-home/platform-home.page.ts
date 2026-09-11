import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { PlatformApiService } from '../../../core/api/platform-api.service';
import type { PlatformSummary } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';

@Component({
  selector: 'app-platform-home-page',
  imports: [
    DatePipe,
    RouterLink,
    HmsBlockSkeletonComponent,
    ButtonModule,
    MessageModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './platform-home.page.html',
  styleUrl: './platform-home.page.scss',
})
export class PlatformHomePage implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  summary: PlatformSummary | null = null;
  loading = true;
  errorMessage: string | null = null;

  readonly userName = () => this.session.user()?.userName ?? 'Developer';

  readonly quickActions: { label: string; hint: string; icon: string; path: string; tone: string }[] = [
    {
      label: 'New hospital',
      hint: 'Onboard a tenant',
      icon: 'pi pi-plus',
      path: '/app/admin/hospitals/new',
      tone: 'accent',
    },
    {
      label: 'Hospitals',
      hint: 'Lifecycle & branches',
      icon: 'pi pi-building',
      path: '/app/admin/hospitals',
      tone: 'teal',
    },
    {
      label: 'Menus',
      hint: 'Global catalog',
      icon: 'pi pi-th-large',
      path: '/app/admin/modules',
      tone: 'teal',
    },
    {
      label: 'Packages',
      hint: 'License bundles',
      icon: 'pi pi-box',
      path: '/app/admin/license-packages',
      tone: 'teal',
    },
    {
      label: 'Platform users',
      hint: 'Developer accounts',
      icon: 'pi pi-users',
      path: '/app/admin/platform-users',
      tone: 'teal',
    },
    {
      label: 'Audit logs',
      hint: 'Platform activity',
      icon: 'pi pi-history',
      path: '/app/admin/audit-logs',
      tone: 'teal',
    },
    {
      label: 'App config',
      hint: 'Branding & maintenance',
      icon: 'pi pi-images',
      path: '/app/admin/application-configuration',
      tone: 'teal',
    },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getSummary()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.summary = data),
        error: () => {
          this.errorMessage = 'Unable to load platform summary.';
          this.messages.add({
            severity: 'error',
            summary: 'Platform',
            detail: 'Could not load console summary.',
          });
        },
      });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    if (status === 'Active') return 'success';
    if (status === 'Suspended') return 'warn';
    return 'secondary';
  }

  navigate(path: string): void {
    void this.router.navigateByUrl(path);
  }

  activeShare(): number {
    if (!this.summary || this.summary.totalHospitals <= 0) return 0;
    return Math.round((this.summary.activeHospitals / this.summary.totalHospitals) * 100);
  }
}
