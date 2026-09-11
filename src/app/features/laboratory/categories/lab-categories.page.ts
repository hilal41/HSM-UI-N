import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { LabTestsApiService } from '../../../core/api/lab-tests-api.service';
import type { LabTestCategory } from '../../../core/models/api-contracts';
import { ensureArray } from '../../../shared/utils/ensure-array';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-lab-categories-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
    TagModule,
    ConfirmDialogModule,
  ],
  templateUrl: './lab-categories.page.html',
})
export class LabCategoriesPage {
  private readonly api = inject(LabTestsApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: LabTestCategory[] = [];
  loading = false;
  dialogOpen = false;
  saving = false;
  editing: LabTestCategory | null = null;
  formCode = '';
  formName = '';
  formSortOrder = 0;
  formIsActive = true;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .getCategories()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (items) => {
          this.rows = ensureArray(items);
          this.cdr.markForCheck();
        },
        error: () =>
          this.messages.add({ severity: 'error', summary: 'Categories', detail: 'Could not load categories.' }),
      });
  }

  openCreate(): void {
    this.editing = null;
    this.formCode = '';
    this.formName = '';
    this.formSortOrder = this.rows.length + 1;
    this.formIsActive = true;
    this.dialogOpen = true;
  }

  openEdit(row: LabTestCategory): void {
    this.editing = row;
    this.formCode = row.code;
    this.formName = row.name;
    this.formSortOrder = row.sortOrder;
    this.formIsActive = row.isActive;
    this.dialogOpen = true;
  }

  save(): void {
    if (!this.formCode.trim() || !this.formName.trim()) return;
    this.saving = true;
    const body = {
      code: this.formCode.trim(),
      name: this.formName.trim(),
      sortOrder: this.formSortOrder,
      isActive: this.formIsActive,
    };
    const req = this.editing ? this.api.updateCategory(this.editing.id, body) : this.api.createCategory(body);
    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.dialogOpen = false;
        this.load();
        this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Category saved.' });
      },
      error: (err: { error?: { message?: string } }) =>
        this.messages.add({ severity: 'error', summary: 'Save failed', detail: err?.error?.message ?? 'Failed.' }),
    });
  }

  confirmDelete(row: LabTestCategory): void {
    this.confirm.confirm({
      message: `Delete category "${row.name}"?`,
      header: 'Confirm',
      accept: () => {
        this.api.deleteCategory(row.id).subscribe({
          next: () => {
            this.load();
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Category removed.' });
          },
          error: (err: { error?: { message?: string } }) =>
            this.messages.add({ severity: 'error', summary: 'Delete failed', detail: err?.error?.message ?? 'Failed.' }),
        });
      },
    });
  }
}
