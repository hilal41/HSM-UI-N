import { Component, computed, inject, OnInit } from '@angular/core';
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
import { BranchesApiService } from '../../../core/api/branches-api.service';
import type { Branch } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-branches-page',
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
    SelectModule,
  ],
  templateUrl: './branches.page.html',
})
export class BranchesPage implements OnInit {
  private readonly api = inject(BranchesApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly canManageBranches = computed(() => this.session.user()?.roleName === 'HospitalAdmin');

  rows: Branch[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  dialogOpen = false;
  editing: Branch | null = null;

  formCode = '';
  formName = '';
  formAddress = '';
  formPhone = '';
  formEmail = '';
  formStatus = 'Active';

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

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
        error: () => (this.errorMessage = 'Unable to load branches.'),
      });
  }

  openCreate(): void {
    this.editing = null;
    this.formCode = '';
    this.formName = '';
    this.formAddress = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formStatus = 'Active';
    this.dialogOpen = true;
  }

  openEdit(row: Branch): void {
    this.editing = row;
    this.formCode = row.code;
    this.formName = row.name;
    this.formAddress = row.address ?? '';
    this.formPhone = row.phone ?? '';
    this.formEmail = row.email ?? '';
    this.formStatus = row.status;
    this.dialogOpen = true;
  }

  save(): void {
    if (!this.formName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required.' });
      return;
    }
    this.saving = true;
    if (this.editing == null) {
      if (!this.formCode.trim()) {
        this.saving = false;
        this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code is required.' });
        return;
      }
      this.api
        .create({
          code: this.formCode.trim(),
          name: this.formName.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Branch created.' });
            this.dialogOpen = false;
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Create failed.',
            });
          },
        });
    } else {
      this.api
        .update(this.editing.id, {
          name: this.formName.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Branch updated.' });
            this.dialogOpen = false;
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Update failed.',
            });
          },
        });
    }
  }

  confirmDelete(row: Branch): void {
    if (row.isMain) {
      this.messages.add({
        severity: 'warn',
        summary: 'Protected',
        detail: 'The main branch cannot be deleted.',
      });
      return;
    }
    this.confirm.confirm({
      message: `Deactivate branch "${row.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Removed', detail: 'Branch deactivated.' });
            this.load();
          },
          error: (err: { error?: { message?: string } }) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'Delete failed.',
            });
          },
        });
      },
    });
  }
}
