import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { BedsApiService } from '../../../../core/api/beds-api.service';
import { WardsApiService } from '../../../../core/api/wards-api.service';
import type { Bed, Ward } from '../../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-ipd-beds-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './beds.page.html',
})
export class IpdBedsPage implements OnInit {
  private readonly api = inject(BedsApiService);
  private readonly wardApi = inject(WardsApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  rows: Bed[] = [];
  wards: Ward[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  filterWardId: number | null = null;
  filterStatus: string | null = null;

  dialogOpen = false;
  editingId: number | null = null;
  formWardId: number | null = null;
  formNumber = '';
  formType = 'General';
  formStatus = 'Available';

  readonly statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Occupied', value: 'Occupied' },
    { label: 'Maintenance', value: 'Maintenance' },
  ];

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 10);
  }

  ngOnInit(): void {
    this.wardApi.getPaged().subscribe({ next: (w) => (this.wards = w) });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getPaged(this.filterWardId ?? undefined, this.filterStatus ?? undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load beds.'),
      });
  }

  bedSeverity(status: string): 'success' | 'warn' | 'secondary' {
    if (status === 'Available') return 'success';
    if (status === 'Occupied') return 'warn';
    return 'secondary';
  }

  openCreate(): void {
    this.editingId = null;
    this.formWardId = this.filterWardId ?? this.wards[0]?.id ?? null;
    this.formNumber = '';
    this.formType = 'General';
    this.formStatus = 'Available';
    this.dialogOpen = true;
  }

  openEdit(row: Bed): void {
    this.editingId = row.id;
    this.formWardId = row.wardId;
    this.formNumber = row.bedNumber;
    this.formType = row.bedType;
    this.formStatus = row.status;
    this.dialogOpen = true;
  }

  save(): void {
    if (!this.formNumber.trim() || this.formWardId == null) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Ward and bed number are required.' });
      return;
    }
    this.saving = true;
    const onError = (err: { error?: { message?: string } }) => {
      this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Save failed.' });
    };
    if (this.editingId == null) {
      this.api
        .create({ wardId: this.formWardId, bedNumber: this.formNumber.trim(), bedType: this.formType, status: this.formStatus })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({ next: () => { this.dialogOpen = false; this.load(); }, error: onError });
    } else {
      this.api
        .update(this.editingId, { bedNumber: this.formNumber.trim(), bedType: this.formType, status: this.formStatus })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({ next: () => { this.dialogOpen = false; this.load(); }, error: onError });
    }
  }

  confirmDelete(row: Bed): void {
    this.confirm.confirm({
      message: `Delete bed "${row.bedNumber}"?`,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => this.load(),
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Delete failed.' });
          },
        });
      },
    });
  }
}
