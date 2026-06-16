import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/** Blocks branch-scoped clinical routes until Staff selects an active branch. */
export const branchRequiredGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  if (!session.requiresActiveBranchSelection()) {
    return true;
  }
  return router.createUrlTree(['/app/dashboard'], { queryParams: { branchRequired: '1' } });
};
