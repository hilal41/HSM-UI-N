import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { MedicineUsagesApiService } from '../../../core/api/medicine-usages-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import type { CreateMedicineUsageRequest, MedicineUsage, UpdateMedicineUsageRequest } from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import {
  MEDICINE_USAGE_PRESETS,
  findMatchingMedicineUsagePresetId,
  medicineUsagePresetById,
} from './medicine-usage-presets';

@Component({
  selector: 'app-medicine-usages-page',
  imports: [
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    MessageModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    TagModule,
  ],
  templateUrl: './medicine-usages.page.html',
  styleUrl: './medicine-usages.page.scss',
})
export class MedicineUsagesPage implements OnInit {
  private readonly api = inject(MedicineUsagesApiService);
  private readonly session = inject(AuthSessionService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly presets = MEDICINE_USAGE_PRESETS;
  private readonly savedPageSize = 100;
  readonly savedTablePageSize = 10;

  saving = false;
  errorMessage: string | null = null;

  savedRows: MedicineUsage[] = [];
  savedLoading = false;

  editingId: number | null = null;
  selectedPresetId: number | null = 1;
  draftShortCode = '';
  draftDescription = '';
  draftIsActive = true;

  ngOnInit(): void {
    this.startNew();
    this.loadSavedList();
  }

  loadSavedList(): void {
    this.savedLoading = true;
    this.api
      .getPaged({ page: 1, pageSize: this.savedPageSize })
      .pipe(finalize(() => (this.savedLoading = false)))
      .subscribe({
        next: (res) => {
          this.savedRows = res.items;
          this.cdr.markForCheck();
        },
        error: () => {
          this.savedRows = [];
          this.cdr.markForCheck();
        },
      });
  }

  isPresetActive(id: number): boolean {
    return this.selectedPresetId === id;
  }

  applyPreset(id: number): void {
    const p = medicineUsagePresetById(id);
    if (!p) return;
    this.editingId = null;
    this.selectedPresetId = p.id;
    this.draftShortCode = p.shortCode;
    this.draftDescription = p.description;
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  syncPresetHighlight(): void {
    this.selectedPresetId = findMatchingMedicineUsagePresetId(this.draftShortCode, this.draftDescription);
    this.cdr.markForCheck();
  }

  startNew(): void {
    this.editingId = null;
    this.applyPreset(1);
    this.draftIsActive = true;
    this.cdr.markForCheck();
  }

  openSaved(row: MedicineUsage): void {
    this.editingId = row.id;
    this.draftShortCode = row.shortCode;
    this.draftDescription = row.description ?? '';
    this.draftIsActive = row.isActive;
    this.selectedPresetId = findMatchingMedicineUsagePresetId(row.shortCode, row.description);
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  save(): void {
    const code = this.draftShortCode.trim();
    if (!code) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Short code is required.' });
      return;
    }

    const u = this.session.user();
    if (this.editingId == null) {
      const body: CreateMedicineUsageRequest = {
        shortCode: code,
        description: this.draftDescription.trim() || null,
        isActive: this.draftIsActive,
      };
      if (u?.hospitalId == null && (body.hospitalId == null || body.hospitalId <= 0)) {
        this.messages.add({
          severity: 'warn',
          summary: 'Hospital required',
          detail: 'Sign in with a hospital user, or extend the form with hospital selection for platform users.',
        });
        return;
      }

      this.errorMessage = null;
      this.saving = true;
      this.api
        .create(body)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Usage added for your hospital.' });
            this.startNew();
            this.loadSavedList();
            this.cdr.markForCheck();
          },
          error: (err: { error?: { message?: string } }) => {
            const msg = err?.error?.message ?? 'Save failed.';
            this.errorMessage = msg;
            this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
            this.cdr.markForCheck();
          },
        });
    } else {
      const body: UpdateMedicineUsageRequest = {
        shortCode: code,
        description: this.draftDescription.trim() || null,
        isActive: this.draftIsActive,
      };
      this.errorMessage = null;
      this.saving = true;
      this.api
        .update(this.editingId, body)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Usage saved.' });
            this.startNew();
            this.loadSavedList();
            this.cdr.markForCheck();
          },
          error: (err: { error?: { message?: string } }) => {
            const msg = err?.error?.message ?? 'Update failed.';
            this.errorMessage = msg;
            this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
            this.cdr.markForCheck();
          },
        });
    }
  }

  confirmDelete(row: MedicineUsage): void {
    this.confirm.confirm({
      message: `Delete usage “${row.shortCode}”?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.savedRows = this.savedRows.filter((r) => r.id !== row.id);
            if (this.editingId === row.id) {
              this.startNew();
            }
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Usage removed.' });
            this.loadSavedList();
            this.cdr.markForCheck();
          },
          error: () => {
            this.messages.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' });
          },
        });
      },
    });
  }
}
