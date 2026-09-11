import { inject, Injectable } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { MeApiService } from '../api/me-api.service';
import type { MeResponse } from '../models/api-contracts';
import { MenuAccessService } from './menu-access.service';
import { MenuPermissionService } from './menu-permission.service';

/**
 * Loads `/me` once per session and feeds everything derived from it.
 *
 * `/me` already returns the navigation tree and the permission matrix alongside the profile, but
 * three places used to fetch session state independently on a cold load: the route guard called
 * `/me/menus`, the shell called `/me` *and* `/me/menus`, and the dashboard called `/me` again.
 * `/me` is one of the most expensive endpoints in the API, so this collapses them into a single
 * in-flight request whose result is shared.
 */
@Injectable({ providedIn: 'root' })
export class SessionBootstrapService {
  private readonly meApi = inject(MeApiService);
  private readonly menuAccess = inject(MenuAccessService);
  private readonly menuPermissions = inject(MenuPermissionService);

  private inFlight$: Observable<MeResponse> | null = null;
  private loaded: MeResponse | null = null;

  /** Resolves immediately once loaded; concurrent callers share one request. */
  ensureLoaded(): Observable<MeResponse> {
    if (this.loaded) {
      return of(this.loaded);
    }
    if (this.inFlight$) {
      return this.inFlight$;
    }

    this.inFlight$ = this.meApi.getMe().pipe(
      tap((me) => {
        this.loaded = me;
        this.menuAccess.setMenus(me.menus ?? []);
        this.menuPermissions.load(me.menuPermissions ?? []);
      }),
      finalize(() => {
        this.inFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.inFlight$;
  }

  /** Forces the next `ensureLoaded()` to refetch — after a branch switch, for example. */
  reload(): Observable<MeResponse> {
    this.loaded = null;
    this.inFlight$ = null;
    return this.ensureLoaded();
  }

  /** Drops everything derived from the session. Call on sign-out. */
  clear(): void {
    this.loaded = null;
    this.inFlight$ = null;
    this.menuAccess.clear();
    this.menuPermissions.clear();
  }
}
