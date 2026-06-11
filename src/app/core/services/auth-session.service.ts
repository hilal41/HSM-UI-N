import { computed, Injectable, signal } from '@angular/core';
import type { LoginResponse, UserSummary } from '../models/api-contracts';

const STORAGE_ACCESS = 'hms_access_token';
const STORAGE_REFRESH = 'hms_refresh_token';
const STORAGE_USER = 'hms_user';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<UserSummary | null>(null);

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());

  constructor() {
    this.restoreFromStorage();
  }

  setSession(response: LoginResponse): void {
    this.accessTokenSignal.set(response.token);
    this.refreshTokenSignal.set(response.refreshToken);
    this.userSignal.set(response.user);
    sessionStorage.setItem(STORAGE_ACCESS, response.token);
    sessionStorage.setItem(STORAGE_REFRESH, response.refreshToken);
    sessionStorage.setItem(STORAGE_USER, JSON.stringify(response.user));
  }

  updateTokens(token: string, refreshToken: string): void {
    this.accessTokenSignal.set(token);
    this.refreshTokenSignal.set(refreshToken);
    sessionStorage.setItem(STORAGE_ACCESS, token);
    sessionStorage.setItem(STORAGE_REFRESH, refreshToken);
  }

  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(null);
    sessionStorage.removeItem(STORAGE_ACCESS);
    sessionStorage.removeItem(STORAGE_REFRESH);
    sessionStorage.removeItem(STORAGE_USER);
  }

  private restoreFromStorage(): void {
    const access = sessionStorage.getItem(STORAGE_ACCESS);
    const refresh = sessionStorage.getItem(STORAGE_REFRESH);
    const userJson = sessionStorage.getItem(STORAGE_USER);
    if (access && refresh && userJson) {
      try {
        this.accessTokenSignal.set(access);
        this.refreshTokenSignal.set(refresh);
        this.userSignal.set(JSON.parse(userJson) as UserSummary);
      } catch {
        this.clearSession();
      }
    }
  }
}
