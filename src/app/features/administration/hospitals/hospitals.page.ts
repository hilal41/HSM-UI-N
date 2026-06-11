import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import { ModulesApiService } from '../../../core/api/modules-api.service';
import type { Hospital, Module } from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-hospitals-page',
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
    MultiSelectModule,
  ],
  templateUrl: './hospitals.page.html',
})
export class HospitalsPage implements OnInit {
  private readonly api = inject(HospitalsApiService);
  private readonly modulesApi = inject(ModulesApiService);
  private readonly messages = inject(MessageService);

  rows: Hospital[] = [];
  allModules: Module[] = [];
  moduleOptions: { label: string; value: number }[] = [];

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  dialogOpen = false;
  modulesDialogOpen = false;
  editingHospital: Hospital | null = null;
  modulesTarget: Hospital | null = null;

  formName = '';
  formCode = '';
  formAddress = '';
  formPhone = '';
  formEmail = '';
  formStatus = 'Active';
  formModuleIds: number[] = [];

  selectedModuleIds: number[] = [];

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Suspended', value: 'Suspended' },
  ];

  ngOnInit(): void {
    this.load();
    this.modulesApi.getAll().subscribe({
      next: (mods) => {
        this.allModules = mods;
        this.moduleOptions = mods
          .filter((m) => m.isActive)
          .map((m) => ({ label: `${m.code} — ${m.name}`, value: m.id }));
      },
      error: () => {},
    });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load hospitals.'),
      });
  }

  openCreate(): void {
    this.editingHospital = null;
    this.formName = '';
    this.formCode = '';
    this.formAddress = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formStatus = 'Active';
    this.formModuleIds = [];
    this.dialogOpen = true;
  }

  openEdit(row: Hospital): void {
    this.editingHospital = row;
    this.formName = row.name;
    this.formCode = row.code;
    this.formAddress = row.address ?? '';
    this.formPhone = row.phone ?? '';
    this.formEmail = row.email ?? '';
    this.formStatus = row.status;
    this.formModuleIds = row.enabledModules?.map((m) => m.id) ?? [];
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  saveHospital(): void {
    if (!this.formName.trim() || !this.formCode.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Name and code are required.' });
      return;
    }
    this.saving = true;
    if (this.editingHospital == null) {
      this.api
        .create({
          name: this.formName.trim(),
          code: this.formCode.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          enabledModuleIds: this.formModuleIds ?? [],
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Hospital created.' });
            this.closeDialog();
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
        .update(this.editingHospital.id, {
          name: this.formName.trim(),
          address: this.formAddress.trim() || null,
          phone: this.formPhone.trim() || null,
          email: this.formEmail.trim() || null,
          status: this.formStatus,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Hospital updated.' });
            this.closeDialog();
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

  openModulesDialog(row: Hospital): void {
    this.modulesTarget = row;
    this.selectedModuleIds = [];
    this.modulesDialogOpen = true;
    this.api.getModules(row.id).subscribe({
      next: (mods) => (this.selectedModuleIds = mods.map((m) => m.id)),
      error: () => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not load hospital modules.' });
        this.modulesDialogOpen = false;
      },
    });
  }

  closeModulesDialog(): void {
    this.modulesDialogOpen = false;
    this.modulesTarget = null;
  }

  saveModules(): void {
    if (!this.modulesTarget) return;
    const id = this.modulesTarget.id;
    this.saving = true;
    this.api
      .setModules(id, { moduleIds: this.selectedModuleIds })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Hospital modules updated.' });
          this.closeModulesDialog();
          this.load();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'Update modules failed.',
          });
        },
      });
  }
}
