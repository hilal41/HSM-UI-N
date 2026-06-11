import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const token = session.accessToken();
  const authReq =
    token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const url = authReq.url.toLowerCase();
      const isLogin = url.includes('/auth/login');
      if (err.status === 401 && !isLogin && session.isAuthenticated()) {
        session.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
