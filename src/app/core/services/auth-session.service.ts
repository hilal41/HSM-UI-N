import { computed, Injectable, signal } from '@angular/core';
import type { BranchSummary, LoginResponse, UserSummary } from '../models/api-contracts';

const STORAGE_ACCESS = 'hms_access_token';
const STORAGE_REFRESH = 'hms_refresh_token';
const STORAGE_USER = 'hms_user';
const STORAGE_BRANCHES = 'hms_branches';
const STORAGE_ACTIVE_BRANCH = 'hms_active_branch_id';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<UserSummary | null>(null);
  private readonly branchesSignal = signal<BranchSummary[]>([]);
  private readonly activeBranchIdSignal = signal<number | null>(null);

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly branches = this.branchesSignal.asReadonly();
  readonly activeBranchId = this.activeBranchIdSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());
  readonly isPlatformUser = computed(() => {
    const user = this.userSignal();
    if (user?.hospitalId != null) {
      return false;
    }
    const role = user?.roleName ?? '';
    return role === 'Developer';
  });
  readonly defaultAppRoute = computed(() =>
    this.isPlatformUser() ? '/app/admin/platform-home' : '/app/dashboard',
  );
  readonly showBranchSwitcher = computed(
    () => !!this.userSignal()?.hospitalId && this.branchesSignal().length > 0,
  );
  readonly activeBranch = computed(() => {
    const id = this.activeBranchIdSignal();
    return this.branchesSignal().find((b) => b.id === id) ?? null;
  });

  constructor() {
    this.restoreFromStorage();
  }

  setSession(response: LoginResponse): void {
    this.accessTokenSignal.set(response.token);
    this.refreshTokenSignal.set(response.refreshToken);
    this.userSignal.set(response.user);
    const branches = response.branches ?? [];
    const activeBranchId = response.activeBranchId ?? response.user.activeBranchId ?? null;
    this.branchesSignal.set(branches);
    this.activeBranchIdSignal.set(activeBranchId);
    sessionStorage.setItem(STORAGE_ACCESS, response.token);
    sessionStorage.setItem(STORAGE_REFRESH, response.refreshToken);
    sessionStorage.setItem(STORAGE_USER, JSON.stringify(response.user));
    sessionStorage.setItem(STORAGE_BRANCHES, JSON.stringify(branches));
    if (activeBranchId != null) {
      sessionStorage.setItem(STORAGE_ACTIVE_BRANCH, String(activeBranchId));
    } else {
      sessionStorage.removeItem(STORAGE_ACTIVE_BRANCH);
    }
  }

  updateTokens(token: string, refreshToken: string): void {
    this.accessTokenSignal.set(token);
    this.refreshTokenSignal.set(refreshToken);
    sessionStorage.setItem(STORAGE_ACCESS, token);
    sessionStorage.setItem(STORAGE_REFRESH, refreshToken);
  }

  /** Payload for POST /auth/refresh-token — preserves active branch when set. */
  buildRefreshTokenRequest(): { refreshToken: string; branchId?: number } | null {
    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) {
      return null;
    }
    const branchId = this.activeBranchIdSignal();
    return branchId != null ? { refreshToken, branchId } : { refreshToken };
  }

  /** Staff (and similar roles) need an active branch before branch-scoped clinical pages. */
  requiresActiveBranchSelection(): boolean {
    const user = this.userSignal();
    if (!user?.hospitalId) {
      return false;
    }
    if (this.activeBranchIdSignal() != null) {
      return false;
    }
    return this.branchesSignal().length > 1;
  }

  applyBranchSwitch(response: LoginResponse): void {
    this.setSession(response);
  }

  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(null);
    this.branchesSignal.set([]);
    this.activeBranchIdSignal.set(null);
    sessionStorage.removeItem(STORAGE_ACCESS);
    sessionStorage.removeItem(STORAGE_REFRESH);
    sessionStorage.removeItem(STORAGE_USER);
    sessionStorage.removeItem(STORAGE_BRANCHES);
    sessionStorage.removeItem(STORAGE_ACTIVE_BRANCH);
  }

  private restoreFromStorage(): void {
    const access = sessionStorage.getItem(STORAGE_ACCESS);
    const refresh = sessionStorage.getItem(STORAGE_REFRESH);
    const userJson = sessionStorage.getItem(STORAGE_USER);
    const branchesJson = sessionStorage.getItem(STORAGE_BRANCHES);
    const activeBranchRaw = sessionStorage.getItem(STORAGE_ACTIVE_BRANCH);
    if (access && refresh && userJson) {
      try {
        this.accessTokenSignal.set(access);
        this.refreshTokenSignal.set(refresh);
        this.userSignal.set(JSON.parse(userJson) as UserSummary);
        if (branchesJson) {
          this.branchesSignal.set(JSON.parse(branchesJson) as BranchSummary[]);
        }
        if (activeBranchRaw) {
          const id = Number(activeBranchRaw);
          if (!Number.isNaN(id)) {
            this.activeBranchIdSignal.set(id);
          }
        }
      } catch {
        this.clearSession();
      }
    }
  }
}
