import { Injectable } from '@angular/core';
import { Observable, finalize, map, shareReplay, throwError } from 'rxjs';
import type { AuthApiService } from '../api/auth-api.service';
import type { LoginResponse } from '../models/api-contracts';
import type { AuthSessionService } from './auth-session.service';

/**
 * Coordinates concurrent 401s so only one refresh-token call is in flight at a time —
 * every request that fails while a refresh is already running waits on the same result
 * instead of each firing its own POST /auth/refresh-token.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private refreshInProgress$: Observable<string> | null = null;

  refreshAccessToken(authApi: AuthApiService, session: AuthSessionService): Observable<string> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    const body = session.buildRefreshTokenRequest();
    if (!body) {
      return throwError(() => new Error('No refresh token available.'));
    }

    this.refreshInProgress$ = authApi.refreshToken(body).pipe(
      map((res: LoginResponse) => {
        session.setSession(res);
        return res.token;
      }),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInProgress$;
  }
}
