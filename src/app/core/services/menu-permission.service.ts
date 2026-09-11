import { computed, Injectable, signal } from '@angular/core';
import type { MenuPermission } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class MenuPermissionService {
  private readonly permissionsSignal = signal<Map<string, MenuPermission>>(new Map());
  private readonly loadedSignal = signal(false);

  readonly permissions = this.permissionsSignal.asReadonly();
  /** True after `load()` has been called at least once (including empty grants). */
  readonly loaded = this.loadedSignal.asReadonly();

  load(permissions: MenuPermission[]): void {
    const map = new Map<string, MenuPermission>();
    for (const p of permissions) {
      map.set(p.menuCode.toLowerCase(), p);
    }
    this.permissionsSignal.set(map);
    this.loadedSignal.set(true);
  }

  clear(): void {
    this.permissionsSignal.set(new Map());
    this.loadedSignal.set(false);
  }

  can(menuCode: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    // Fail closed until permissions hydrate. Failing open rendered create/edit/delete controls
    // for everyone on first paint and then removed them a moment later, which reads as the UI
    // lying about what the user may do. Use `loaded()` to show a skeleton while it resolves.
    if (!this.loadedSignal()) {
      return false;
    }
    const p = this.permissionsSignal().get(menuCode.toLowerCase());
    if (!p) {
      return false;
    }
    switch (action) {
      case 'view':
        return p.canView;
      case 'create':
        return p.canCreate;
      case 'edit':
        return p.canEdit;
      case 'delete':
        return p.canDelete;
      default:
        return false;
    }
  }

  readonly canCreatePatient = computed(() => this.can('clinical.patients', 'create'));
  readonly canEditPatient = computed(() => this.can('clinical.patients', 'edit'));
}
