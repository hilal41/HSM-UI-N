import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { MenusApiService } from '../../../core/api/menus-api.service';
import type { AppMenuTree } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../hms-block-skeleton/hms-block-skeleton.component';

/**
 * Pre-selected codes when creating a new hospital. These must match menu codes
 * from the database menu catalog (Menus table) — the tree itself is loaded from the API.
 */
export const DEFAULT_HOSPITAL_MENU_CODES = [
  'dashboard',
  'account.profile',
  'account.change-password',
  'hospital.configuration.profile',
  'hospital.configuration.localization',
  'hospital.configuration.mrn',
  'hospital.configuration.registration-slip',
  'hospital.configuration.prescription-slip',
  'hospital.configuration.features',
  'admin.users',
  'admin.roles',
] as const;

@Component({
  selector: 'app-hospital-menu-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CheckboxModule, HmsBlockSkeletonComponent],
  templateUrl: './hospital-menu-picker.component.html',
  styleUrl: './hospital-menu-picker.component.scss',
})
export class HospitalMenuPickerComponent implements OnInit {
  private readonly menusApi = inject(MenusApiService);

  readonly selectedMenuIds = input<number[]>([]);
  readonly lockedMenuIds = input<number[]>([]);
  readonly menuTreeInput = input<AppMenuTree[] | null>(null, { alias: 'menuTree' });
  readonly applyDefaultSelection = input(true);
  readonly layout = input<'dialog' | 'page'>('dialog');

  readonly selectedMenuIdsChange = output<number[]>();

  readonly menuTree = signal<AppMenuTree[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  private readonly selectedSet = signal<Set<number>>(new Set());
  private readonly lockedSet = signal<Set<number>>(new Set());
  private defaultsApplied = false;

  constructor() {
    effect(() => {
      this.selectedSet.set(new Set(this.selectedMenuIds()));
    });

    effect(() => {
      this.lockedSet.set(new Set(this.lockedMenuIds()));
    });
  }

  ngOnInit(): void {
    const externalTree = this.menuTreeInput();
    if (externalTree != null && externalTree.length > 0) {
      this.menuTree.set(externalTree);
      this.loading.set(false);
      this.maybeApplyDefaults(externalTree);
      return;
    }

    this.menusApi.getTree(true).subscribe({
      next: (tree) => {
        this.menuTree.set(tree);
        this.loading.set(false);
        this.maybeApplyDefaults(tree);
      },
      error: () => {
        this.loadError.set('Could not load application menus.');
        this.loading.set(false);
      },
    });
  }

  routableChildren(menu: AppMenuTree): AppMenuTree[] {
    return (menu.children ?? []).filter((child) => !!child.route?.trim());
  }

  isLocked(menuId: number): boolean {
    return this.lockedSet().has(menuId);
  }

  isSelected(menuId: number): boolean {
    return this.selectedSet().has(menuId);
  }

  isGroupFullySelected(menu: AppMenuTree): boolean {
    const children = this.routableChildren(menu);
    if (children.length === 0) return false;
    return children.every((child) => this.isSelected(child.id) || this.isLocked(child.id));
  }

  isGroupPartiallySelected(menu: AppMenuTree): boolean {
    const children = this.routableChildren(menu);
    if (children.length === 0) return false;
    const selectedCount = children.filter((child) => this.isSelected(child.id)).length;
    return selectedCount > 0 && selectedCount < children.length;
  }

  selectedCountInGroup(menu: AppMenuTree): number {
    return this.routableChildren(menu).filter((child) => this.isSelected(child.id)).length;
  }

  setGroupSelected(menu: AppMenuTree, checked: boolean): void {
    const next = new Set(this.selectedSet());
    for (const child of this.routableChildren(menu)) {
      if (this.isLocked(child.id)) continue;
      if (checked) next.add(child.id);
      else next.delete(child.id);
    }
    this.emitSelection(next);
  }

  toggleChild(menuId: number, checked: boolean): void {
    if (this.isLocked(menuId)) return;
    const next = new Set(this.selectedSet());
    if (checked) next.add(menuId);
    else next.delete(menuId);
    this.emitSelection(next);
  }

  private maybeApplyDefaults(tree: AppMenuTree[]): void {
    if (!this.applyDefaultSelection() || this.defaultsApplied || this.selectedMenuIds().length > 0) {
      return;
    }

    const codeToId = new Map<string, number>();
    this.flattenMenus(tree).forEach((menu) => codeToId.set(menu.code, menu.id));

    const defaults = DEFAULT_HOSPITAL_MENU_CODES
      .map((code) => codeToId.get(code))
      .filter((id): id is number => id != null);

    if (defaults.length === 0) return;

    this.defaultsApplied = true;
    const next = new Set([...defaults, ...this.lockedMenuIds()]);
    this.emitSelection(next);
  }

  private emitSelection(next: Set<number>): void {
    this.selectedSet.set(next);
    this.selectedMenuIdsChange.emit([...next].sort((a, b) => a - b));
  }

  private flattenMenus(tree: AppMenuTree[]): AppMenuTree[] {
    return tree.flatMap((menu) => [menu, ...this.flattenMenus(menu.children ?? [])]);
  }
}
