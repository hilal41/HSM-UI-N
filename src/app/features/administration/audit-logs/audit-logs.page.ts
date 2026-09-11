import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { ApplicationConfigurationApiService } from '../../../core/api/application-configuration-api.service';
import { PlatformApiService } from '../../../core/api/platform-api.service';
import type { AuditLog } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage, normalizeLazyPage, showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-audit-logs-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    ToggleSwitchModule,
  ],
  templateUrl: './audit-logs.page.html',
})
export class AuditLogsPage implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly settingsApi = inject(ApplicationConfigurationApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: AuditLog[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  filterEntityType = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;

  get hasActiveFilter(): boolean {
    return (
      this.filterEntityType.trim().length > 0 ||
      this.filterDateFrom != null ||
      this.filterDateTo != null
    );
  }

  auditLogsEnabled = true;
  auditToggleLoading = false;
  auditToggleSaving = false;

  private lastLazy: TableLazyLoadEvent = { first: 0, rows: this.pageSize };

  ngOnInit(): void {
    this.loadAuditSetting();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.lastLazy = event;
    this.fetch(event);
  }

  applyFilters(): void {
    this.fetch({ ...this.lastLazy, first: 0 });
  }

  clearFilters(): void {
    this.filterEntityType = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.applyFilters();
  }

  onAuditToggle(enabled: boolean): void {
    const previous = this.auditLogsEnabled;
    this.auditLogsEnabled = enabled;
    this.auditToggleSaving = true;
    this.settingsApi
      .updateSettings({ auditLogsEnabled: enabled })
      .pipe(finalize(() => (this.auditToggleSaving = false)))
      .subscribe({
        next: (s) => {
          this.auditLogsEnabled = s.auditLogsEnabled;
          this.messages.add({
            severity: 'success',
            summary: s.auditLogsEnabled ? 'Audit logging on' : 'Audit logging off',
            detail: s.auditLogsEnabled
              ? 'New platform activity will be recorded.'
              : 'New platform activity will not be recorded.',
          });
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.auditLogsEnabled = previous;
          this.messages.add({
            severity: 'error',
            summary: 'Update failed',
            detail: apiErrorMessage(err, 'Could not update audit logging.'),
          });
          this.cdr.markForCheck();
        },
      });
  }

  private loadAuditSetting(): void {
    this.auditToggleLoading = true;
    this.settingsApi
      .getSettings()
      .pipe(finalize(() => (this.auditToggleLoading = false)))
      .subscribe({
        next: (s) => {
          this.auditLogsEnabled = s.auditLogsEnabled;
          this.cdr.markForCheck();
        },
        error: () => {
          // Keep default on; list still works without the toggle.
          this.cdr.markForCheck();
        },
      });
  }

  private fetch(event: TableLazyLoadEvent): void {
    const { page, pageSize } = normalizeLazyPage(event, this.pageSize);
    this.tablePageSize = pageSize;
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getAuditLogs(
        page,
        pageSize,
        this.filterEntityType.trim() || undefined,
        this.toIsoDate(this.filterDateFrom),
        this.toIsoDateEnd(this.filterDateTo),
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load audit logs.';
          this.cdr.markForCheck();
        },
      });
  }

  private toIsoDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
  }

  private toIsoDateEnd(d: Date | null): string | undefined {
    if (!d) return undefined;
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)).toISOString();
  }
}
