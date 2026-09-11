import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';
import { MenuAccessService } from '../services/menu-access.service';
import { SessionBootstrapService } from '../services/session-bootstrap.service';

export const menuAccessGuard: CanActivateChildFn = (_route, state) => {
  const menus = inject(MenuAccessService);
  const router = inject(Router);
  const session = inject(AuthSessionService);
  const bootstrap = inject(SessionBootstrapService);

  const fallback = () => router.createUrlTree([session.defaultAppRoute()]);
  const decide = () => (menus.canAccessUrl(state.url) ? true : fallback());

  if (menus.menus().length > 0) {
    return decide();
  }

  return bootstrap.ensureLoaded().pipe(
    map(() => decide()),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
