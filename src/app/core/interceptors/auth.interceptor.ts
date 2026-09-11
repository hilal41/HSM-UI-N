import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import { AuthSessionService } from '../services/auth-session.service';
import { TokenRefreshService } from '../services/token-refresh.service';

function withAuthHeader<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/** Auth endpoints that must never trigger a refresh-and-retry (avoids infinite loops). */
function isAuthLifecycleUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('/auth/login') ||
    lower.includes('/auth/refresh-token') ||
    lower.includes('/auth/logout')
  );
}

/** True when the refresh endpoint actively rejected the token, rather than being unreachable. */
function isRejectedRefresh(error: unknown): boolean {
  return error instanceof HttpErrorResponse && [400, 401, 403].includes(error.status);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const authApi = inject(AuthApiService);
  const tokenRefresh = inject(TokenRefreshService);
  const router = inject(Router);

  const authReq = withAuthHeader(req, session.accessToken());

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLifecycleUrl = isAuthLifecycleUrl(authReq.url);

      if (err.status !== 401 || isLifecycleUrl || !session.isAuthenticated()) {
        return throwError(() => err);
      }

      // Access token expired mid-session — transparently refresh and retry once instead of
      // force-logging the user out (which previously happened on every access-token expiry).
      return tokenRefresh.refreshAccessToken(authApi, session).pipe(
        switchMap((newToken) => next(withAuthHeader(req, newToken))),
        catchError((refreshErr: unknown) => {
          // Only a rejected refresh token means the session is really over. Throttling (429),
          // a dropped connection (0), or a server fault (5xx) are transient — clearing the
          // session on those signs people out at random, so keep it and let them retry.
          if (isRejectedRefresh(refreshErr)) {
            session.clearSession();
            router.navigate(['/login']);
          }
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
