import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import { MenusApiService } from '../../../core/api/menus-api.service';
import { PlatformApiService } from '../../../core/api/platform-api.service';
import type { AppMenuTree, Hospital, MenuPackage } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HospitalMenuPickerComponent } from '../../../shared/components/hospital-menu-picker/hospital-menu-picker.component';
import {
  countRoutableMenus,
  flattenMenuTree,
} from '../../../shared/components/hospital-menu-picker/hospital-menu.utils';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { apiErrorMessage } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-hospital-menus-page',
  imports: [
    RouterLink,
    HmsBlockSkeletonComponent,
    HospitalMenuPickerComponent,
    MessageModule,
    ButtonModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './hospital-menus.page.html',
  styleUrl: './hospital-menus.page.scss',
})
export class HospitalMenusPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(HospitalsApiService);
  private readonly menusApi = inject(MenusApiService);
  private readonly platformApi = inject(PlatformApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  hospitalId: number | null = null;
  hospital: Hospital | null = null;
  menuTree: AppMenuTree[] = [];
  packages: MenuPackage[] = [];
  selectedMenuIds = signal<number[]>([]);

  loading = true;
  saving = false;
  applyingPackageId: number | null = null;
  loadError: string | null = null;

  readonly isPlatformUser = this.session.isPlatformUser;

  readonly selectedCount = computed(() =>
    countRoutableMenus(this.menuTree, this.selectedMenuIds()),
  );

  readonly totalRoutable = computed(() =>
    flattenMenuTree(this.menuTree).filter((m) => !!m.route?.trim()).length,
  );

  readonly selectedPercent = computed(() => {
    const total = this.totalRoutable();
    if (total <= 0) return 0;
    return Math.round((this.selectedCount() / total) * 100);
  });

  readonly licensedGroupCount = computed(() => {
    const ids = new Set(this.selectedMenuIds());
    return this.menuTree.filter((group) =>
      (group.children ?? []).some((c) => !!c.route?.trim() && ids.has(c.id)),
    ).length;
  });

  readonly totalGroups = computed(
    () =>
      this.menuTree.filter((g) => (g.children ?? []).some((c) => !!c.route?.trim())).length,
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.hospitalId = idParam != null && /^\d+$/.test(idParam) ? Number(idParam) : null;

    if (this.hospitalId == null) {
      this.loadError = 'Invalid hospital.';
      this.loading = false;
      return;
    }

    forkJoin({
      hospital: this.api.getById(this.hospitalId),
      menus: this.api.getMenus(this.hospitalId),
      tree: this.menusApi.getTree(true),
      packages: this.isPlatformUser()
        ? this.platformApi.getPackages(true).pipe(catchError(() => of([] as MenuPackage[])))
        : of([] as MenuPackage[]),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ hospital, menus, tree, packages }) => {
          this.hospital = hospital;
          this.menuTree = tree;
          this.packages = packages.filter((p) => p.isActive);
          const ids = menus.length
            ? menus.map((m) => m.id)
            : (hospital.enabledMenus?.map((m) => m.id) ?? []);
          this.selectedMenuIds.set(ids);
        },
        error: () => {
          this.loadError = 'Could not load hospital menus.';
        },
      });
  }

  onSelectionChange(ids: number[]): void {
    this.selectedMenuIds.set(ids);
  }

  statusSeverity(status: string | undefined): 'success' | 'warn' | 'secondary' {
    if (status === 'Active') return 'success';
    if (status === 'Suspended') return 'warn';
    return 'secondary';
  }

  selectAll(): void {
    const ids = flattenMenuTree(this.menuTree)
      .filter((m) => !!m.route?.trim())
      .map((m) => m.id);
    this.selectedMenuIds.set(ids);
  }

  clearAll(): void {
    this.confirm.confirm({
      message: 'Clear all licensed menus for this hospital?',
      header: 'Clear selection',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Clear',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.selectedMenuIds.set([]),
    });
  }

  applyPackage(pkg: MenuPackage): void {
    if (this.hospitalId == null) return;
    this.confirm.confirm({
      message: `Replace this hospital’s licensed menus with the “${pkg.name}” package (${pkg.menuIds.length} pages)?`,
      header: 'Apply license package',
      icon: 'pi pi-box',
      acceptLabel: 'Apply',
      accept: () => {
        this.applyingPackageId = pkg.id;
        this.platformApi
          .applyPackage(pkg.id, this.hospitalId!, { replaceExisting: true })
          .pipe(finalize(() => (this.applyingPackageId = null)))
          .subscribe({
            next: () => {
              this.selectedMenuIds.set([...(pkg.menuIds ?? [])]);
              this.messages.add({
                severity: 'success',
                summary: 'Package applied',
                detail: `“${pkg.name}” menus are now licensed. Save if you make further edits.`,
              });
            },
            error: (err: unknown) => {
              this.messages.add({
                severity: 'error',
                summary: 'Error',
                detail: apiErrorMessage(err, 'Could not apply package.'),
              });
            },
          });
      },
    });
  }

  usePackageLocally(pkg: MenuPackage): void {
    this.selectedMenuIds.set([...(pkg.menuIds ?? [])]);
    this.messages.add({
      severity: 'info',
      summary: 'Package loaded',
      detail: `Selection set to “${pkg.name}”. Click Save menus to persist.`,
    });
  }

  cancel(): void {
    void this.router.navigate(['/app/admin/hospitals']);
  }

  save(): void {
    if (this.hospitalId == null) return;

    if (this.selectedCount() === 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Select at least one allowed menu.',
      });
      return;
    }

    this.saving = true;
    this.api
      .setMenus(this.hospitalId, { menuIds: this.selectedMenuIds() })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Licenses saved',
            detail:
              'Allowed menus updated. Administrator role synced automatically; other roles may need review under Roles.',
          });
          void this.router.navigate(['/app/admin/hospitals']);
        },
        error: (err: unknown) =>
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: apiErrorMessage(err, 'Could not save menus.'),
          }),
      });
  }
}
