import type { Route } from '@angular/router';
import { routes } from './app.routes';

/** Flattens the route tree so redirects nested under the shell layout can be found. */
function flatten(routeList: Route[]): Route[] {
  return routeList.flatMap((r) => [r, ...(r.children ? flatten(r.children) : [])]);
}

describe('app routes — hospital configuration console', () => {
  const all = flatten(routes);

  const redirectCases: Array<{ from: string; to: string }> = [
    { from: 'account/my-hospital', to: 'admin/configuration/profile' },
    { from: 'account/registration-slip-designer', to: 'admin/configuration/registration-slip' },
    { from: 'account/medicine-slip-designer', to: 'admin/configuration/prescription-slip' },
  ];

  for (const { from, to } of redirectCases) {
    it(`redirects legacy ${from} to ${to}`, () => {
      const route = all.find((r) => r.path === from);
      expect(route).withContext(`route '${from}' should exist`).toBeDefined();
      expect(route!.redirectTo).toBe(to);
      expect(route!.pathMatch).toBe('full');
    });
  }

  it('registers every configuration child page', () => {
    const expectedPaths = [
      'admin/configuration/profile',
      'admin/configuration/localization',
      'admin/configuration/mrn',
      'admin/configuration/features',
      'admin/configuration/registration-slip',
      'admin/configuration/prescription-slip',
    ];
    for (const path of expectedPaths) {
      expect(all.some((r) => r.path === path))
        .withContext(`route '${path}' should exist`)
        .toBeTrue();
    }
  });

  it('drives schema pages from route data categories', () => {
    const categoryByPath: Record<string, string> = {
      'admin/configuration/localization': 'Localization',
      'admin/configuration/mrn': 'Mrn',
      'admin/configuration/features': 'Features',
    };
    for (const [path, category] of Object.entries(categoryByPath)) {
      const route = all.find((r) => r.path === path);
      expect(route?.data?.['category'])
        .withContext(`route '${path}' category`)
        .toBe(category);
    }
  });
});
