import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { ClinicalServicesApiService } from '../../../core/api/clinical-services-api.service';
import { DoctorsApiService } from '../../../core/api/doctors-api.service';
import { ServiceCategoriesApiService } from '../../../core/api/service-categories-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { CLINICAL_CONSULTANCY_TYPE_OPTIONS } from './clinical-consultancy-types';

@Component({
  selector: 'app-service-editor-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    MessageModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
  ],
  templateUrl: './service-editor.page.html',
  styleUrl: './service-editor.page.scss',
})
export class ServiceEditorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ClinicalServicesApiService);
  private readonly categoriesApi = inject(ServiceCategoriesApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);

  readonly consultancyTypeOptions = CLINICAL_CONSULTANCY_TYPE_OPTIONS;

  loading = true;
  saving = false;
  loadError: string | null = null;
  editingId: number | null = null;

  categoryOptions: { label: string; value: number }[] = [];
  doctorOptions: { label: string; value: number }[] = [];

  formCode = '';
  formTitle = '';
  formConsultancyType = 'OPD';
  formCategoryId: number | null = null;
  formDiscount = 0;
  formPrice = 0;
  formDoctorId: number | null = null;
  formDoctorShare = 0;
  formClearDoctor = false;

  get isCreateMode(): boolean {
    return this.editingId == null;
  }

  get pageTitle(): string {
    return this.isCreateMode ? 'New service' : 'Edit service';
  }

  get pageSubtitle(): string {
    return 'OPD, IPD, and other billable services';
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.editingId = idParam != null && /^\d+$/.test(idParam) ? Number(idParam) : null;

    this.loading = true;
    this.loadError = null;

    this.categoriesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        this.categoryOptions = res.items.map((c) => ({ label: c.name, value: c.id }));
        if (this.isCreateMode && this.formCategoryId == null) {
          this.formCategoryId = this.categoryOptions[0]?.value ?? null;
        }
      },
      error: () => {},
    });

    this.doctorsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        this.doctorOptions = res.items.map((d) => ({
          label: `${d.firstName} ${d.lastName} (${d.doctorNumber})`,
          value: d.id,
        }));
      },
      error: () => {},
    });

    if (this.editingId == null) {
      this.loading = false;
      return;
    }

    this.api
      .getById(this.editingId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (row) => {
          this.formCode = row.code;
          this.formTitle = row.title;
          this.formConsultancyType = row.consultancyType || 'OPD';
          this.formCategoryId = row.serviceCategoryId;
          this.formDiscount = row.discount;
          this.formPrice = row.price;
          this.formDoctorId = row.doctorId ?? null;
          this.formDoctorShare = row.doctorShare;
          this.formClearDoctor = false;
        },
        error: () => {
          this.loadError = 'Could not load service.';
        },
      });
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
    const request$ =
      this.editingId == null
        ? this.api.create({
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
        : this.api.update(this.editingId, {
            code: this.formCode.trim(),
            title: this.formTitle.trim(),
            consultancyType: this.formConsultancyType,
            serviceCategoryId: this.formCategoryId,
            discount: this.formDiscount,
            price: this.formPrice,
            doctorId: this.formClearDoctor ? null : this.formDoctorId,
            clearDoctor: this.formClearDoctor,
            doctorShare: this.formDoctorShare,
          });

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Service saved.' });
        void this.router.navigate(['/app/clinical/services']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err?.error?.message ?? 'Could not save service.',
        });
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/app/clinical/services']);
  }
}
