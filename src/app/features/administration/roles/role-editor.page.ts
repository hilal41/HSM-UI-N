import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { finalize, forkJoin } from 'rxjs';
import { MenusApiService } from '../../../core/api/menus-api.service';
import { RolesApiService } from '../../../core/api/roles-api.service';
import type { AppMenuTree, RoleMenuPermission } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

type PermissionField = 'canView' | 'canCreate' | 'canEdit' | 'canDelete';
type PermissionState = Record<PermissionField, boolean>;

const FULL_ACCESS: PermissionState = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

const EMPTY_ACCESS: PermissionState = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

@Component({
  selector: 'app-role-editor-page',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    MessageModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    TagModule,
  ],
  templateUrl: './role-editor.page.html',
  styleUrl: './role-editor.page.scss',
})
export class RoleEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rolesApi = inject(RolesApiService);
  private readonly menusApi = inject(MenusApiService);
  private readonly messages = inject(MessageService);

  readonly permissionColumns: { field: PermissionField; label: string }[] = [
    { field: 'canView', label: 'View' },
    { field: 'canCreate', label: 'New' },
    { field: 'canEdit', label: 'Edit' },
    { field: 'canDelete', label: 'Delete' },
  ];

  loading = true;
  saving = false;
  loadError: string | null = null;
  editingId: number | null = null;
  roleDetail: { isSystemRole: boolean } | null = null;
  menuTree: AppMenuTree[] = [];
  permissions = new Map<number, PermissionState>();

  formName = '';
  formDescription = '';

  get isCreateMode(): boolean {
    return this.editingId == null;
  }

  get pageTitle(): string {
    return this.isCreateMode ? 'New role' : 'Edit role';
  }

  get leftColumnMenus(): AppMenuTree[] {
    return this.menuTree.filter((_, index) => index % 2 === 0);
  }

  get rightColumnMenus(): AppMenuTree[] {
    return this.menuTree.filter((_, index) => index % 2 === 1);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.editingId = idParam != null && /^\d+$/.test(idParam) ? Number(idParam) : null;

    this.loading = true;
    this.loadError = null;

    if (this.editingId == null) {
      this.menusApi
        .getTree()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (tree) => (this.menuTree = tree),
          error: () => {
            this.loadError = 'Could not load role editor data.';
          },
        });
      return;
    }

    forkJoin({
      menus: this.menusApi.getTree(),
      role: this.rolesApi.getById(this.editingId),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ menus, role }) => {
          this.menuTree = menus;
          this.roleDetail = role;
          this.formName = role.name;
          this.formDescription = role.description ?? '';
          this.loadPermissions(role.menuPermissions, role.menuIds);
        },
        error: () => {
          this.loadError = 'Could not load role editor data.';
        },
      });
  }

  save(): void {
    const name = this.formName.trim();
    if (!name) {
      this.messages.add({ severity: 'warn', summary: 'Role', detail: 'Role name is required.' });
      return;
    }

    const menuPermissions = this.buildMenuPermissionsPayload();
    const request$ =
      this.editingId == null
        ? this.rolesApi.create({
            name,
            description: this.formDescription.trim() || null,
            menuIds: [],
            menuPermissions,
          })
        : this.rolesApi.update(this.editingId, {
            name,
            description: this.formDescription.trim() || null,
            menuIds: null,
            menuPermissions,
          });

    this.saving = true;
    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Role saved.' });
        void this.router.navigate(['/app/admin/roles']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err?.error?.message ?? 'Could not save role.',
        });
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/app/admin/roles']);
  }

  isPageMenu(menu: AppMenuTree): boolean {
    return !!menu.route?.trim();
  }

  getPermission(menuId: number): PermissionState {
    return this.permissions.get(menuId) ?? EMPTY_ACCESS;
  }

  isMenuSelected(menu: AppMenuTree): boolean {
    const state = this.getPermission(menu.id);
    return state.canView || state.canCreate || state.canEdit || state.canDelete;
  }

  isGroupFullySelected(menu: AppMenuTree): boolean {
    const pageIds = this.collectPageMenuIds(menu);
    if (pageIds.length === 0) {
      const state = this.getPermission(menu.id);
      return state.canView;
    }

    return pageIds.every((id) => {
      const state = this.getPermission(id);
      return state.canView && state.canCreate && state.canEdit && state.canDelete;
    });
  }

  setGroupSelected(menu: AppMenuTree, selected: boolean): void {
    const next = new Map(this.permissions);

    for (const id of this.collectPageMenuIds(menu)) {
      if (selected) next.set(id, { ...FULL_ACCESS });
      else next.delete(id);
    }

    if (this.isPageMenu(menu)) {
      if (selected) next.set(menu.id, { ...FULL_ACCESS });
      else next.delete(menu.id);
    } else {
      if (selected) next.set(menu.id, { canView: true, canCreate: false, canEdit: false, canDelete: false });
      else next.delete(menu.id);
    }

    this.permissions = next;
  }

  setPermission(menuId: number, field: PermissionField, value: boolean): void {
    const next = new Map(this.permissions);
    const current = { ...this.getPermission(menuId), [field]: value };

    if (!current.canView && !current.canCreate && !current.canEdit && !current.canDelete) {
      next.delete(menuId);
    } else {
      if ((field === 'canCreate' || field === 'canEdit' || field === 'canDelete') && value) {
        current.canView = true;
      }
      next.set(menuId, current);
    }

    this.ensureParentViewAccess(menuId, next);
    this.permissions = next;
  }

  selectedMenuCount(): number {
    let count = 0;
    for (const state of this.permissions.values()) {
      if (state.canView || state.canCreate || state.canEdit || state.canDelete) count += 1;
    }
    return count;
  }

  private loadPermissions(menuPermissions: RoleMenuPermission[] | undefined, menuIds: number[]): void {
    const next = new Map<number, PermissionState>();

    if (menuPermissions?.length) {
      for (const permission of menuPermissions) {
        next.set(permission.menuId, {
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
        });
      }
    } else {
      for (const menuId of menuIds) {
        next.set(menuId, { ...FULL_ACCESS });
      }
    }

    this.permissions = next;
  }

  private buildMenuPermissionsPayload(): RoleMenuPermission[] {
    return [...this.permissions.entries()].map(([menuId, state]) => ({
      menuId,
      canView: state.canView,
      canCreate: state.canCreate,
      canEdit: state.canEdit,
      canDelete: state.canDelete,
    }));
  }

  private ensureParentViewAccess(menuId: number, permissions: Map<number, PermissionState>): void {
    const parent = this.findParentMenu(this.menuTree, menuId);
    if (!parent) return;

    const state = permissions.get(menuId);
    if (!state) return;

    if (state.canView || state.canCreate || state.canEdit || state.canDelete) {
      const parentState = permissions.get(parent.id) ?? { ...EMPTY_ACCESS };
      parentState.canView = true;
      permissions.set(parent.id, parentState);
      this.ensureParentViewAccess(parent.id, permissions);
    }
  }

  private findParentMenu(menus: AppMenuTree[], childId: number): AppMenuTree | null {
    for (const menu of menus) {
      if (menu.children.some((child) => child.id === childId)) return menu;
      const nested = this.findParentMenu(menu.children, childId);
      if (nested) return nested;
    }
    return null;
  }

  private collectPageMenuIds(menu: AppMenuTree): number[] {
    const ids: number[] = [];
    if (this.isPageMenu(menu)) ids.push(menu.id);
    for (const child of menu.children) {
      ids.push(...this.collectPageMenuIds(child));
    }
    return ids;
  }
}
