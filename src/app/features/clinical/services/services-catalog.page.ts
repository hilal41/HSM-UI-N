import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { ClinicalServicesApiService } from '../../../core/api/clinical-services-api.service';
import { DoctorsApiService } from '../../../core/api/doctors-api.service';
import { ServiceCategoriesApiService } from '../../../core/api/service-categories-api.service';
import type { ClinicalService } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-services-catalog-page',
  imports: [
    DecimalPipe,
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
  ],
  templateUrl: './services-catalog.page.html',
})
export class ServicesCatalogPage {
  readonly consultancyTypeOptions: { label: string; value: string }[] = [
    { value: 'OPD', label: 'OPD (Outpatient)' },
    { value: 'IPD', label: 'IPD (Inpatient)' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'Specialist', label: 'Specialist' },
    { value: 'Telemedicine', label: 'Telemedicine (Online)' },
  ];

  private readonly api = inject(ClinicalServicesApiService);
  private readonly categoriesApi = inject(ServiceCategoriesApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly session = inject(AuthSessionService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: ClinicalService[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;

  categoryOptions: { label: string; value: number }[] = [];
  doctorOptions: { label: string; value: number }[] = [];

  dialogOpen = false;
  saving = false;
  editingId: number | null = null;

  formCode = '';
  formTitle = '';
  formConsultancyType = 'OPD';
  formCategoryId: number | null = null;
  formDiscount = 0;
  formPrice = 0;
  formDoctorId: number | null = null;
  formDoctorShare = 0;
  formClearDoctor = false;

  constructor() {
    this.categoriesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) =>
        (this.categoryOptions = res.items.map((c) => ({ label: c.name, value: c.id }))),
      error: () => {},
    });
    this.doctorsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) =>
        (this.doctorOptions = res.items.map((d) => ({
          label: `${d.firstName} ${d.lastName} (${d.doctorNumber})`,
          value: d.id,
        }))),
      error: () => {},
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize;
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getPaged({ page, pageSize: rows })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load services.';
          this.cdr.markForCheck();
        },
      });
  }

  reloadTable(): void {
    this.loading = true;
    this.api
      .getPaged({ page: 1, pageSize: this.pageSize })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck(),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formCode = '';
    this.formTitle = '';
    this.formConsultancyType = 'OPD';
    this.formCategoryId = this.categoryOptions[0]?.value ?? null;
    this.formDiscount = 0;
    this.formPrice = 0;
    this.formDoctorId = null;
    this.formDoctorShare = 0;
    this.formClearDoctor = false;
    this.dialogOpen = true;
  }

  openEdit(row: ClinicalService): void {
    this.editingId = row.id;
    this.formCode = row.code;
    this.formTitle = row.title;
    this.formConsultancyType = row.consultancyType || 'OPD';
    this.formCategoryId = row.serviceCategoryId;
    this.formDiscount = row.discount;
    this.formPrice = row.price;
    this.formDoctorId = row.doctorId ?? null;
    this.formDoctorShare = row.doctorShare;
    this.formClearDoctor = false;
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  save(): void {
    if (!this.formCode.trim() || !this.formTitle.trim() || !this.formConsultancyType || this.formCategoryId == null) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Code, title, consultancy type, and category are required.',
      });
      return;
    }
    this.saving = true;
    if (this.editingId == null) {
      this.api
        .create({
          code: this.formCode.trim(),
          title: this.formTitle.trim(),
          consultancyType: this.formConsultancyType,
          serviceCategoryId: this.formCategoryId,
          discount: this.formDiscount,
          price: this.formPrice,
          doctorId: this.formDoctorId,
          doctorShare: this.formDoctorShare,
          createdBy: this.session.user()?.id,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Service saved.' });
            this.closeDialog();
            this.reloadTable();
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
        .update(this.editingId, {
          code: this.formCode.trim(),
          title: this.formTitle.trim(),
          consultancyType: this.formConsultancyType,
          serviceCategoryId: this.formCategoryId,
          discount: this.formDiscount,
          price: this.formPrice,
          doctorId: this.formClearDoctor ? null : this.formDoctorId,
          clearDoctor: this.formClearDoctor,
          doctorShare: this.formDoctorShare,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Service saved.' });
            this.closeDialog();
            this.reloadTable();
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
