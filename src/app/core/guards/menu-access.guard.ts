import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { MenuAccessService } from '../services/menu-access.service';

export const menuAccessGuard: CanActivateChildFn = (_route, state) => {
  const menus = inject(MenuAccessService);
  const router = inject(Router);

  const decide = () => (menus.canAccessUrl(state.url) ? true : router.createUrlTree(['/app/dashboard']));

  if (menus.menus().length > 0) {
    return decide();
  }

  return menus.loadMenus().pipe(
    map(() => decide()),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
