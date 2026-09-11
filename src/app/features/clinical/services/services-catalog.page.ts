import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { ClinicalServicesApiService } from '../../../core/api/clinical-services-api.service';
import type { ClinicalService } from '../../../core/models/api-contracts';
import { MenuPermissionService } from '../../../core/services/menu-permission.service';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { CrudListState } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-services-catalog-page',
  imports: [
    DecimalPipe,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
  ],
  templateUrl: './services-catalog.page.html',
})
export class ServicesCatalogPage {
  private readonly api = inject(ClinicalServicesApiService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly menuPerms = inject(MenuPermissionService);

  readonly list = new CrudListState<ClinicalService>(20);

  get rows(): ClinicalService[] {
    return this.list.rows;
  }

  get totalCount(): number {
    return this.list.totalCount;
  }

  get loading(): boolean {
    return this.list.loading;
  }

  get errorMessage(): string | null {
    return this.list.errorMessage;
  }

  get tablePageSize(): number {
    return this.list.tablePageSize;
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const { page, pageSize } = this.list.syncLazyEvent(event);
    this.list.beginLoad();
    this.api
      .getPaged({ page, pageSize })
      .pipe(finalize(() => (this.list.loading = false)))
      .subscribe({
        next: (res) => {
          this.list.applySuccess(res.items, res.totalCount);
          this.cdr.markForCheck();
        },
        error: () => {
          this.list.applyError('Unable to load services.');
          this.cdr.markForCheck();
        },
      });
  }

  reloadTable(): void {
    this.list.beginLoad();
    this.api
      .getPaged({ page: 1, pageSize: this.list.defaultPageSize })
      .pipe(finalize(() => (this.list.loading = false)))
      .subscribe({
        next: (res) => {
          this.list.applySuccess(res.items, res.totalCount);
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck(),
      });
  }

  openCreate(): void {
    void this.router.navigate(['/app/clinical/services/new']);
  }

  openEdit(row: ClinicalService): void {
    void this.router.navigate(['/app/clinical/services/edit', row.id]);
  }

  confirmDelete(row: ClinicalService): void {
    this.confirm.confirm({
      message: `Delete service "${row.title}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Service removed.' });
            this.reloadTable();
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' });
          },
        });
      },
    });
  }
}
