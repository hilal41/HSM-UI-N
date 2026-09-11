import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { CheckupTemplatesApiService } from '../../../core/api/checkup-templates-api.service';
import { HospitalsApiService } from '../../../core/api/hospitals-api.service';
import type { CheckupTemplate, CreateCheckupTemplateRequest, Hospital } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { apiErrorDetail } from '../../../core/utils/api-error';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { CheckupFormDesignerComponent } from './checkup-form-designer.component';
import {
  emptyCheckupFormDoc,
  parseCheckupFormDocFromSchemaJson,
  serializeCheckupFormDoc,
  type CheckupFormDoc,
} from './checkup-form-doc.model';

@Component({
  selector: 'app-checkup-template-editor-page',
  imports: [
    FormsModule,
    HmsBlockSkeletonComponent,
    CheckupFormDesignerComponent,
    MessageModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './checkup-template-editor.page.html',
  styleUrl: './checkup-template-editor.page.scss',
})
export class CheckupTemplateEditorPage implements OnInit {
  readonly session = inject(AuthSessionService);
  private readonly api = inject(CheckupTemplatesApiService);
  private readonly hospitalsApi = inject(HospitalsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  loadError: string | null = null;
  /** True when opened as `new?from=id` and source template loaded. */
  openedAsDuplicate = false;

  editingId: number | null = null;
  editingBuiltIn = false;
  formCode = '';
  formName = '';
  formDoc: CheckupFormDoc = emptyCheckupFormDoc();
  saving = false;

  hospitalsForPick: Hospital[] = [];
  hospitalsPickLoading = false;
  targetHospitalId: number | null = null;

  /** Route `new` vs `edit/:id` */
  isCreateMode = true;

  get pageTitle(): string {
    if (this.isCreateMode) return 'New Custom Template';
    return this.editingBuiltIn ? 'Edit Library Template' : 'Edit Custom Template';
  }

  get pageSubtitle(): string {
    if (this.editingBuiltIn) {
      return 'Fixed code · edit name & layout, or Save as custom for a new code.';
    }
    return 'Builder left · live preview right · Save stores layout + print HTML.';
  }

  /** Editor body: hidden while loading, or when edit-by-id failed completely. */
  get showEditorForm(): boolean {
    if (this.loading) return false;
    if (this.loadError && !this.isCreateMode) return false;
    return true;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const fromId = this.route.snapshot.queryParamMap.get('from');

    if (idParam != null && /^\d+$/.test(idParam)) {
      this.isCreateMode = false;
      this.loadForEdit(+idParam);
      return;
    }

    this.isCreateMode = true;
    this.editingId = null;
    this.editingBuiltIn = false;
    this.formCode = '';
    this.formName = '';
    this.formDoc = emptyCheckupFormDoc();
    this.targetHospitalId = null;

    if (fromId != null && /^\d+$/.test(fromId)) {
      this.openedAsDuplicate = true;
      this.loading = true;
      this.loadDuplicateFrom(+fromId);
    } else {
      this.openedAsDuplicate = false;
      this.loading = false;
      this.ensureHospitalPickerForCreate();
    }
    this.cdr.markForCheck();
  }

  showHospitalPickerOnCreate(): boolean {
    if (!this.isCreateMode) return false;
    const h = this.session.user()?.hospitalId;
    return h == null || h <= 0;
  }

  onFormDocChange(doc: CheckupFormDoc): void {
    this.formDoc = doc;
    this.cdr.markForCheck();
  }

  cancel(): void {
    void this.router.navigate(['/app/clinical/checkup-templates']);
  }

  save(): void {
    if (!this.formCode.trim() || !this.formName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Code and name are required.' });
      return;
    }
    const schemaJson = serializeCheckupFormDoc(this.formDoc);
    if (this.isCreateMode) {
      const jwtHid = this.session.user()?.hospitalId;
      const hasJwtHospital = jwtHid != null && jwtHid > 0;
      if (!hasJwtHospital && (this.targetHospitalId == null || this.targetHospitalId <= 0)) {
        this.messages.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Choose which hospital this template belongs to.',
        });
        return;
      }
    }
    this.saving = true;
    if (this.isCreateMode) {
      const jwtHid = this.session.user()?.hospitalId;
      const hasJwtHospital = jwtHid != null && jwtHid > 0;
      const body: CreateCheckupTemplateRequest = {
        code: this.formCode.trim(),
        name: this.formName.trim(),
        schemaJson,
      };
      if (!hasJwtHospital) body.hospitalId = this.targetHospitalId!;
      this.api
        .create(body)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Custom template created.' });
            void this.router.navigate(['/app/clinical/checkup-templates']);
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorDetail(err, 'Create failed.'),
            });
            this.cdr.markForCheck();
          },
        });
    } else if (this.editingId != null) {
      this.api
        .update(this.editingId, {
          code: this.formCode.trim(),
          name: this.formName.trim(),
          schemaJson,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Template updated.' });
            void this.router.navigate(['/app/clinical/checkup-templates']);
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorDetail(err, 'Update failed.'),
            });
            this.cdr.markForCheck();
          },
        });
    }
  }

  private loadForEdit(id: number): void {
    this.loading = true;
    this.loadError = null;
    this.api.getById(id).subscribe({
      next: (row) => {
        this.loadError = null;
        this.editingId = row.id;
        this.editingBuiltIn = !!row.isBuiltIn;
        this.formCode = row.code;
        this.formName = row.name;
        this.formDoc = parseCheckupFormDocFromSchemaJson(row.schemaJson);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = 'Could not load this template.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadDuplicateFrom(sourceId: number): void {
    this.loading = true;
    this.loadError = null;
    this.api.getById(sourceId).subscribe({
      next: (row) => {
        this.loadError = null;
        this.formCode = '';
        this.formName = `${row.name} (custom)`;
        this.formDoc = parseCheckupFormDocFromSchemaJson(row.schemaJson);
        this.loading = false;
        this.ensureHospitalPickerForCreate();
        this.messages.add({
          severity: 'info',
          summary: 'Copied from preset',
          detail: 'Choose a unique code, then save.',
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = 'Could not load the template to copy — you can still create a blank template.';
        this.loading = false;
        this.openedAsDuplicate = false;
        this.ensureHospitalPickerForCreate();
        this.cdr.markForCheck();
      },
    });
  }

  private ensureHospitalPickerForCreate(): void {
    if (!this.isCreateMode) return;
    const hid = this.session.user()?.hospitalId;
    if (hid != null && hid > 0) return;
    this.loadHospitalsForPicker();
  }

  private loadHospitalsForPicker(): void {
    if (this.hospitalsForPick.length > 0) return;
    this.hospitalsPickLoading = true;
    this.hospitalsApi
      .getAll('Active')
      .pipe(finalize(() => (this.hospitalsPickLoading = false)))
      .subscribe({
        next: (rows) => {
          this.hospitalsForPick = rows;
          if (rows.length === 1) this.targetHospitalId = rows[0].id;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Hospitals',
            detail: 'Could not load hospitals. Use a hospital-linked account or try again.',
          });
          this.cdr.markForCheck();
        },
      });
  }
}
