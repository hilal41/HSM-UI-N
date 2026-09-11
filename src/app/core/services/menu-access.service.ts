import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { Observable, tap } from 'rxjs';
import { MeApiService } from '../api/me-api.service';
import type { AppMenuTree } from '../models/api-contracts';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private readonly api = inject(MeApiService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  private readonly menusSignal = signal<AppMenuTree[]>([]);
  readonly menus = this.menusSignal.asReadonly();
  readonly menuItems = computed(() => this.toMenuItems(this.menusSignal()));
  readonly navMenuItems = computed(() =>
    this.toMenuItems(this.menusSignal().filter((m) => m.code !== 'account')),
  );
  readonly accountMenus = computed(() => {
    const account = this.menusSignal().find((m) => m.code === 'account');
    return account?.children ?? [];
  });
  readonly accountMenuItems = computed(() => this.toMenuItems(this.accountMenus()));

  loadMenus(): Observable<AppMenuTree[]> {
    return this.api.getMenus().pipe(tap((menus) => this.setMenus(menus)));
  }

  /** Applies a tree already present in a `/me` response, avoiding a second round-trip. */
  setMenus(menus: AppMenuTree[] | null | undefined): void {
    this.menusSignal.set(this.normalizeMenuTree(menus));
  }

  clear(): void {
    this.menusSignal.set([]);
  }

  canAccessUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    if (cleanUrl === '/app' || cleanUrl === '/app/dashboard') {
      return true;
    }

    const routes = new Set(this.flatten(this.menusSignal()).map((m) => this.cleanUrl(m.route ?? '')));

    // Legacy Branches URL redirects to Hospitals & Branches.
    if (cleanUrl === '/app/admin/branches') {
      return routes.has('/app/admin/hospitals') || routes.has('/app/admin/branches');
    }

    if (routes.has(cleanUrl)) return true;

    // Allow child editor/session routes when their parent list menu is allowed.
    return [...routes].some((route) => route.length > 0 && cleanUrl.startsWith(`${route}/`));
  }

  private toMenuItems(menus: AppMenuTree[]): MenuItem[] {
    return menus
      .map((menu) => this.toMenuItem(menu))
      .filter((item): item is MenuItem => item != null);
  }

  private toMenuItem(menu: AppMenuTree): MenuItem | null {
    const childMenus = menu.children ?? [];
    const children = childMenus
      .map((child) => this.toMenuItem(child))
      .filter((item): item is MenuItem => item != null);

    if (!menu.route && children.length === 0) return null;

    const route = menu.route ?? undefined;

    const item: MenuItem = {
      label: menu.label,
      icon: menu.icon ?? undefined,
      routerLink: route,
      command: route
        ? () => {
            void this.router.navigateByUrl(route);
          }
        : undefined,
    };

    if (children.length > 0) {
      item.items = children;
    }

    return item;
  }

  private normalizeMenuTree(menus: AppMenuTree[] | null | undefined): AppMenuTree[] {
    if (!Array.isArray(menus)) {
      return [];
    }
    return menus.map((menu) => ({
      ...menu,
      children: this.normalizeMenuTree(menu.children),
    }));
  }

  private flatten(menus: AppMenuTree[]): AppMenuTree[] {
    return menus.flatMap((menu) => [menu, ...this.flatten(menu.children ?? [])]);
  }

  private cleanUrl(url: string): string {
    const base = url.split('?')[0].split('#')[0];
    return base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base;
  }
}
