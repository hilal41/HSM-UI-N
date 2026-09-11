import type { AppMenuTree } from '../../../core/models/api-contracts';

export function flattenMenuTree(tree: AppMenuTree[]): AppMenuTree[] {
  return tree.flatMap((menu) => [menu, ...flattenMenuTree(menu.children ?? [])]);
}

export function countRoutableMenus(tree: AppMenuTree[], selectedMenuIds: number[]): number {
  const idSet = new Set(selectedMenuIds);
  return flattenMenuTree(tree).filter((m) => m.route && idSet.has(m.id)).length;
}
