import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { RolesApiService } from '../../../core/api/roles-api.service';
import type { Role } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-roles-page',
  imports: [
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
  ],
  templateUrl: './roles.page.html',
})
export class RolesPage implements OnInit {
  private readonly api = inject(RolesApiService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  rows: Role[] = [];
  loading = false;
  errorMessage: string | null = null;

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 15);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load roles.'),
      });
  }

  openCreate(): void {
    void this.router.navigate(['/app/admin/roles/new']);
  }

  openEdit(row: Role): void {
    void this.router.navigate(['/app/admin/roles/edit', row.id]);
  }

  confirmDelete(row: Role): void {
    this.confirm.confirm({
      header: 'Delete role?',
      message: `Delete "${row.name}"? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(row),
    });
  }

  private delete(row: Role): void {
    this.api.delete(row.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted.' });
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.messages.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: err?.error?.message ?? 'Could not delete role.',
        });
      },
    });
  }
}
