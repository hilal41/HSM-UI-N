import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { RolesApiService } from '../../../core/api/roles-api.service';
import type { Role } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-roles-page',
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
  templateUrl: './roles.page.html',
})
export class RolesPage implements OnInit {
  private readonly api = inject(RolesApiService);
  private readonly messages = inject(MessageService);

  rows: Role[] = [];
  loading = false;
  errorMessage: string | null = null;

  detailOpen = false;
  detailLoading = false;
  roleDetail: Role | null = null;

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

  openDetail(row: Role): void {
    this.roleDetail = null;
    this.detailOpen = true;
    this.detailLoading = true;
    this.api
      .getById(row.id)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (r) => (this.roleDetail = r),
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'GET /Roles/' + row.id + ' failed.',
          });
          this.detailOpen = false;
        },
      });
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.roleDetail = null;
  }
}
