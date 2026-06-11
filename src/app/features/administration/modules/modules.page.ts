import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { ModulesApiService } from '../../../core/api/modules-api.service';
import type { Module } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-modules-page',
  imports: [
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    HmsBlockSkeletonComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
  ],
  templateUrl: './modules.page.html',
})
export class ModulesPage implements OnInit {
  private readonly api = inject(ModulesApiService);
  private readonly messages = inject(MessageService);

  rows: Module[] = [];
  loading = false;
  errorMessage: string | null = null;

  detailOpen = false;
  detailLoading = false;
  moduleDetail: Module | null = null;

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
        next: (data) => (this.rows = [...data].sort((a, b) => a.sortOrder - b.sortOrder)),
        error: () => (this.errorMessage = 'Unable to load modules.'),
      });
  }

  openDetail(row: Module): void {
    this.moduleDetail = null;
    this.detailOpen = true;
    this.detailLoading = true;
    this.api
      .getById(row.id)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (m) => (this.moduleDetail = m),
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'GET /Modules/' + row.id + ' failed.',
          });
          this.detailOpen = false;
        },
      });
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.moduleDetail = null;
  }
}
