import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { MenusApiService } from '../../../core/api/menus-api.service';
import type { AppMenuTree } from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

interface ParentOption {
  label: string;
  value: number | null;
}

@Component({
  selector: 'app-modules-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    SelectModule,
  ],
  templateUrl: './modules.page.html',
})
export class ModulesPage implements OnInit {
  private readonly api = inject(MenusApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  rows: AppMenuTree[] = [];
  menuTree: AppMenuTree[] = [];
  parentOptions: ParentOption[] = [{ label: 'None (top level)', value: null }];
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  dialogOpen = false;
  editingId: number | null = null;

  formParentId: number | null = null;
  formCode = '';
  formLabel = '';
  formRoute = '';
  formIcon = '';
  formPermissionKey = '';
  formSortOrder = 0;
  formIsActive = true;
  formIsVisible = true;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getTree(false)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.menuTree = data;
          this.rows = this.flattenMenus(data);
          this.parentOptions = this.buildParentOptions(data);
        },
        error: () => (this.errorMessage = 'Unable to load menus.'),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formParentId = null;
    this.formCode = '';
    this.formLabel = '';
    this.formRoute = '';
    this.formIcon = 'pi pi-circle';
    this.formPermissionKey = '';
    this.formSortOrder = 0;
    this.formIsActive = true;
    this.formIsVisible = true;
    this.dialogOpen = true;
  }

  openEdit(row: AppMenuTree): void {
    const menu = this.findMenuById(this.menuTree, row.id) ?? row;
    this.editingId = menu.id;
    this.formParentId = menu.parentId ?? null;
    this.formCode = menu.code;
    this.formLabel = menu.label;
    this.formRoute = menu.route ?? '';
    this.formIcon = menu.icon ?? '';
    this.formPermissionKey = menu.permissionKey ?? '';
    this.formSortOrder = menu.sortOrder;
    this.formIsActive = menu.isActive;
    this.formIsVisible = menu.isVisible;
    this.parentOptions = this.buildParentOptions(this.menuTree, menu.id);
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
    this.parentOptions = this.buildParentOptions(this.menuTree);
  }

  save(): void {
    const code = this.formCode.trim().toLowerCase();
    const label = this.formLabel.trim();
    if (!code || !label) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code and label are required.' });
      return;
    }

    this.saving = true;
    const request$ =
      this.editingId == null
        ? this.api.create({
            parentId: this.formParentId,
            code,
            label,
            route: this.formRoute.trim() || null,
            icon: this.formIcon.trim() || null,
            permissionKey: this.formPermissionKey.trim() || null,
            sortOrder: this.formSortOrder,
            isActive: this.formIsActive,
            isVisible: this.formIsVisible,
          })
        : this.api.update(this.editingId, {
            parentId: this.formParentId,
            code,
            label,
            route: this.formRoute.trim() || null,
            icon: this.formIcon.trim() || null,
            permissionKey: this.formPermissionKey.trim() || null,
            sortOrder: this.formSortOrder,
            isActive: this.formIsActive,
            isVisible: this.formIsVisible,
          });

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Saved',
          detail: this.editingId == null ? 'Menu created.' : 'Menu updated.',
        });
        this.dialogOpen = false;
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err?.error?.message ?? 'Could not save menu.',
        });
      },
    });
  }

  confirmDelete(row: AppMenuTree): void {
    this.confirm.confirm({
      header: 'Delete menu?',
      message: `Delete "${row.label}"? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(row),
    });
  }

  private delete(row: AppMenuTree): void {
    this.api.delete(row.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Menu deleted.' });
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.messages.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: err?.error?.message ?? 'Could not delete menu.',
        });
      },
    });
  }

  private flattenMenus(menus: AppMenuTree[], level = 0): AppMenuTree[] {
    return menus.flatMap((menu) => [
      { ...menu, label: `${'— '.repeat(level)}${menu.label}` },
      ...this.flattenMenus(menu.children, level + 1),
    ]);
  }

  private findMenuById(menus: AppMenuTree[], id: number): AppMenuTree | null {
    for (const menu of menus) {
      if (menu.id === id) return menu;
      const found = this.findMenuById(menu.children, id);
      if (found) return found;
    }
    return null;
  }

  private buildParentOptions(menus: AppMenuTree[], excludeId?: number): ParentOption[] {
    const excluded = excludeId == null ? new Set<number>() : this.collectDescendantIds(menus, excludeId);
    if (excludeId != null) excluded.add(excludeId);

    const options: ParentOption[] = [{ label: 'None (top level)', value: null }];
    this.appendParentOptions(menus, options, excluded, 0);
    return options;
  }

  private appendParentOptions(
    menus: AppMenuTree[],
    options: ParentOption[],
    excluded: Set<number>,
    level: number,
  ): void {
    for (const menu of menus) {
      if (!excluded.has(menu.id)) {
        options.push({
          label: `${'— '.repeat(level)}${menu.label}`,
          value: menu.id,
        });
      }
      this.appendParentOptions(menu.children, options, excluded, level + 1);
    }
  }

  private collectDescendantIds(menus: AppMenuTree[], menuId: number): Set<number> {
    const result = new Set<number>();
    const walk = (nodes: AppMenuTree[]): void => {
      for (const node of nodes) {
        if (node.id === menuId) {
          this.addDescendants(node, result);
          return;
        }
        walk(node.children);
      }
    };
    walk(menus);
    return result;
  }

  private addDescendants(menu: AppMenuTree, result: Set<number>): void {
    for (const child of menu.children) {
      result.add(child.id);
      this.addDescendants(child, result);
    }
  }
}
