import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/** Redirects platform users away from the hospital dashboard. */
export const platformDashboardGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  if (session.isPlatformUser()) {
    return router.createUrlTree(['/app/admin/platform-home']);
  }
  return true;
};
