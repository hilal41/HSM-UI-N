import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { Observable, tap } from 'rxjs';
import { MeApiService } from '../api/me-api.service';
import type { AppMenuTree } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private readonly api = inject(MeApiService);
  private readonly router = inject(Router);

  private readonly menusSignal = signal<AppMenuTree[]>([]);
  readonly menus = this.menusSignal.asReadonly();
  readonly menuItems = computed(() => this.toMenuItems(this.menusSignal()));

  loadMenus(): Observable<AppMenuTree[]> {
    return this.api.getMenus().pipe(tap((menus) => this.menusSignal.set(menus)));
  }

  clear(): void {
    this.menusSignal.set([]);
  }

  canAccessUrl(url: string): boolean {
    const cleanUrl = this.cleanUrl(url);
    if (cleanUrl === '/app' || cleanUrl === '/app/dashboard' || cleanUrl === '/app/reports') {
      return true;
    }

    const routes = new Set(this.flatten(this.menusSignal()).map((m) => this.cleanUrl(m.route ?? '')));
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
    const children = menu.children
      .map((child) => this.toMenuItem(child))
      .filter((item): item is MenuItem => item != null);

    if (!menu.route && children.length === 0) return null;

    const route = menu.route ?? undefined;

    return {
      label: menu.label,
      icon: menu.icon ?? undefined,
      routerLink: route,
      command: route
        ? () => {
            void this.router.navigateByUrl(route);
          }
        : undefined,
      items: children.length > 0 ? children : undefined,
    };
  }

  private flatten(menus: AppMenuTree[]): AppMenuTree[] {
    return menus.flatMap((menu) => [menu, ...this.flatten(menu.children)]);
  }

  private cleanUrl(url: string): string {
    const base = url.split('?')[0].split('#')[0];
    return base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base;
  }
}
