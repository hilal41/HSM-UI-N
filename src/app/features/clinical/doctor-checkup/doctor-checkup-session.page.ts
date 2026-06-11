import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { CheckupsApiService } from '../../../core/api/checkups-api.service';
import { CheckupTemplatesApiService } from '../../../core/api/checkup-templates-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import { PatientVisitsApiService } from '../../../core/api/patient-visits-api.service';
import { PatientsApiService } from '../../../core/api/patients-api.service';
import type {
  CheckupSaveResponse,
  CheckupTemplate,
  Hospital,
  Patient,
  PatientVisitRegisterLogItemResponse,
  PatientVisitResponse,
} from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import {
  emptyCheckupFormDoc,
  parseCheckupFormDocFromSchemaJson,
  type CheckupFormDoc,
} from '../checkup-templates/checkup-form-doc.model';
import {
  emptyFieldValues,
  parseCheckupResponsesJson,
  serializeCheckupResponses,
  type CheckupFieldValue,
} from './checkup-responses.model';
import { DoctorCheckupFormComponent } from './doctor-checkup-form.component';
import { DoctorCheckupMedicinePanelComponent } from './doctor-checkup-medicine-panel.component';
import { MedicineSlipComponent } from './medicine-slip.component';
import {
  defaultMedicineSlipTemplate,
  parseMedicineSlipTemplateJson,
  type MedicineSlipTemplate,
} from './medicine-slip-template';

interface VisitOption {
  visitId: number;
  label: string;
}

@Component({
  selector: 'app-doctor-checkup-session-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    MessageModule,
    ButtonModule,
    SelectModule,
    TextareaModule,
    DoctorCheckupFormComponent,
    DoctorCheckupMedicinePanelComponent,
    MedicineSlipComponent,
  ],
  templateUrl: './doctor-checkup-session.page.html',
  styleUrl: './doctor-checkup-session.page.scss',
})
export class DoctorCheckupSessionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly templatesApi = inject(CheckupTemplatesApiService);
  private readonly checkupsApi = inject(CheckupsApiService);
  private readonly meApi = inject(MeApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly medicinePanel = viewChild(DoctorCheckupMedicinePanelComponent);

  loading = true;
  checkupLoading = false;
  saving = false;
  errorMessage: string | null = null;

  visit: PatientVisitResponse | null = null;
  patient: Patient | null = null;
  myHospital: Hospital | null = null;
  visitOptions: VisitOption[] = [];

  templates: CheckupTemplate[] = [];
  selectedTemplateId: number | null = null;
  medicineNotes = '';
  nextCheckupAt = '';
  checkupId = 0;
  printCheckupSnapshot: CheckupSaveResponse | null = null;
  medicineSlipTemplate: MedicineSlipTemplate = defaultMedicineSlipTemplate();

  formDoc: CheckupFormDoc = emptyCheckupFormDoc();
  fieldValues: Record<string, CheckupFieldValue> = {};

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      const raw = pm.get('visitId');
      if (raw == null || !/^\d+$/.test(raw)) {
        this.errorMessage = 'Invalid visit.';
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }
      this.bootstrap(+raw);
    });
  }

  onTemplateChange(): void {
    const vid = this.visit?.id;
    if (vid != null && this.selectedTemplateId != null) {
      this.persistLastTemplateForVisit(vid, this.selectedTemplateId);
    }
    this.loadCheckupForTemplate();
  }

  saveAll(andPrint = false): void {
    const vid = this.visit?.id;
    const tplId = this.selectedTemplateId;
    if (vid == null || tplId == null) return;

    const panel = this.medicinePanel();
    const medicineLines = panel?.getStagedMedicineLines() ?? [];

    this.saving = true;
    this.checkupsApi
      .save(vid, {
        checkupTemplateId: tplId,
        responsesJson: serializeCheckupResponses(this.formDoc, this.fieldValues),
        medicineNotes: this.medicineNotes.trim() || null,
        nextCheckupAt: this.toApiDateTimeOrNull(this.nextCheckupAt),
        medicineLines,
      })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          this.checkupId = res.id;
          this.printCheckupSnapshot = res;
          this.medicineNotes = res.medicineNotes ?? '';
          this.nextCheckupAt = this.toDateTimeLocalValue(res.nextCheckupAt);
          if (res.responsesJson) {
            this.fieldValues = parseCheckupResponsesJson(res.responsesJson, this.formDoc);
          }
          panel?.applyServerLines(res.medicines);
          this.persistLastTemplateForVisit(vid, tplId);
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: andPrint ? 'Checkup saved. Opening medicine slip print…' : 'Checkup and medicines were saved.',
          });
          if (andPrint) {
            this.printMedicineSlip();
          }
        },
        error: (err: HttpErrorResponse) => {
          const detail =
            typeof (err.error as { message?: string } | null)?.message === 'string'
              ? (err.error as { message: string }).message
              : 'Could not save checkup. Try again.';
          this.messages.add({ severity: 'error', summary: 'Save failed', detail });
        },
      });
  }

  get hasFormFields(): boolean {
    return this.formDoc.sections.some((s) => s.fields.length > 0);
  }

  saveAndPrintMedicineSlip(): void {
    this.saveAll(true);
  }

  private bootstrap(visitId: number): void {
    this.loading = true;
    this.errorMessage = null;
    this.visit = null;
    this.patient = null;
    this.printCheckupSnapshot = null;
    this.medicineNotes = '';
    this.nextCheckupAt = '';
    this.selectedTemplateId = null;
    this.checkupId = 0;
    this.formDoc = emptyCheckupFormDoc();
    this.fieldValues = {};

    const today = this.todayYmd();
    forkJoin({
      visit: this.visitsApi.getById(visitId).pipe(catchError(() => of(null))),
      hospital: this.meApi.getMyHospital().pipe(catchError(() => of(null))),
      templates: this.loadAllTemplates$(),
      log: this.visitsApi
        .getRegisterLog({
          page: 1,
          pageSize: 500,
          consultancyType: 'OPD',
          fromDate: today,
          toDate: today,
        })
        .pipe(
          catchError(() =>
            of({
              items: [],
              totalCount: 0,
              page: 1,
              pageSize: 500,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            }),
          ),
        ),
    }).subscribe({
      next: ({ visit, hospital, templates, log }) => {
        if (visit == null) {
          this.errorMessage = 'Visit not found or you do not have access.';
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.patientsApi.getById(visit.patientId).subscribe({
          next: (patient) => {
            this.myHospital = hospital;
            this.medicineSlipTemplate = parseMedicineSlipTemplateJson(hospital?.medicineSlipTemplateJson);
            this.applyBootstrapData(visit, patient, templates, log.items);
            this.loading = false;
            this.loadCheckupForTemplate();
            this.cdr.markForCheck();
          },
          error: () => {
            this.errorMessage = 'Could not load patient profile for this visit.';
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: () => {
        this.errorMessage = 'Could not load checkup session.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private applyBootstrapData(
    visit: PatientVisitResponse,
    patient: Patient,
    templates: CheckupTemplate[],
    logItems: PatientVisitRegisterLogItemResponse[],
  ): void {
    this.visit = visit;
    this.patient = patient;
    this.templates = templates;
    this.visitOptions = this.buildVisitOptions(logItems, visit, patient);
    if (this.selectedTemplateId == null || !templates.some((t) => t.id === this.selectedTemplateId)) {
      this.selectedTemplateId = templates[0]?.id ?? null;
    }
    const lastTpl = this.readLastTemplateForVisit(visit.id);
    if (lastTpl != null && templates.some((t) => t.id === lastTpl)) {
      this.selectedTemplateId = lastTpl;
    }
    this.applyTemplateFormDoc();
  }

  private loadCheckupForTemplate(): void {
    const vid = this.visit?.id;
    const tplId = this.selectedTemplateId;
    if (vid == null || tplId == null) return;

    this.applyTemplateFormDoc();
    this.medicinePanel()?.resetForNewCheckup();

    this.checkupLoading = true;
    this.checkupsApi
      .getForVisitTemplate(vid, tplId)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) return of(null);
          const msg =
            typeof (err.error as { message?: string } | null)?.message === 'string'
              ? (err.error as { message: string }).message
              : 'Could not load saved checkup.';
          this.messages.add({ severity: 'error', summary: 'Error', detail: msg });
          return of(null);
        }),
        finalize(() => {
          this.checkupLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((res) => {
        if (res == null) {
          this.checkupId = 0;
          this.printCheckupSnapshot = null;
          this.fieldValues = emptyFieldValues(this.formDoc);
          this.medicineNotes = '';
          this.nextCheckupAt = '';
          return;
        }
        this.checkupId = res.id;
        this.printCheckupSnapshot = res;
        this.medicineNotes = res.medicineNotes ?? '';
        this.nextCheckupAt = this.toDateTimeLocalValue(res.nextCheckupAt);
        this.fieldValues = parseCheckupResponsesJson(res.responsesJson, this.formDoc);
        this.medicinePanel()?.applyServerLines(res.medicines);
        this.cdr.markForCheck();
      });
  }

  private applyTemplateFormDoc(): void {
    const t = this.templates.find((x) => x.id === this.selectedTemplateId);
    this.formDoc = parseCheckupFormDocFromSchemaJson(t?.schemaJson);
    this.fieldValues = emptyFieldValues(this.formDoc);
  }

  private readonly lastTemplateStorageKey = (visitId: number) =>
    `hms_doctor_checkup_last_template_${visitId}`;

  private persistLastTemplateForVisit(visitId: number, templateId: number | null): void {
    if (visitId <= 0 || templateId == null) return;
    try {
      localStorage.setItem(this.lastTemplateStorageKey(visitId), String(templateId));
    } catch {
      /* ignore */
    }
  }

  private readLastTemplateForVisit(visitId: number): number | null {
    try {
      const raw = localStorage.getItem(this.lastTemplateStorageKey(visitId));
      if (raw == null || !/^\d+$/.test(raw)) return null;
      return +raw;
    } catch {
      return null;
    }
  }

  private buildVisitOptions(
    items: PatientVisitRegisterLogItemResponse[],
    current: PatientVisitResponse,
    patient: Patient,
  ): VisitOption[] {
    const byId = new Map<number, VisitOption>();
    for (const row of items) {
      byId.set(row.visitId, {
        visitId: row.visitId,
        label: `${row.patientName} · ${this.shortWhen(row.visitDate)}`,
      });
    }
    if (!byId.has(current.id)) {
      const name = `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || `Patient #${current.patientId}`;
      byId.set(current.id, {
        visitId: current.id,
        label: `${name} · ${this.shortWhen(current.visitDate)}`,
      });
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  visitQueueLine(): string {
    const v = this.visit;
    if (v == null) return '';
    const fromOptions = this.visitOptions.find((o) => o.visitId === v.id);
    if (fromOptions) return fromOptions.label;
    const p = this.patient;
    const name = p
      ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `Patient #${v.patientId}`
      : `Patient #${v.patientId}`;
    return `${name} · ${this.shortWhen(v.visitDate)}`;
  }

  private shortWhen(iso: string): string {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    const day = dt.getDate();
    const month = dt.toLocaleString('en-GB', { month: 'long' });
    const year = dt.getFullYear();
    const timePart = dt.toLocaleString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day} ${month} ${year}, ${timePart}`;
  }

  private todayYmd(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  private printMedicineSlip(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  private toApiDateTimeOrNull(value: string): string | null {
    if (!value) return null;
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  private toDateTimeLocalValue(value: string | null | undefined): string {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  private loadAllTemplates$() {
    return forkJoin({
      lib: this.templatesApi.getLibrary().pipe(catchError(() => of([] as CheckupTemplate[]))),
      custom: this.templatesApi.getPaged({ page: 1, pageSize: 100 }).pipe(catchError(() => of(null))),
    }).pipe(
      map(({ lib, custom }) => {
        const byId = new Map<number, CheckupTemplate>();
        for (const t of lib) byId.set(t.id, t);
        if (custom?.items?.length) {
          for (const t of custom.items) byId.set(t.id, t);
        }
        return [...byId.values()].sort((a, b) => {
          const ab = a.isBuiltIn === true ? 0 : 1;
          const bb = b.isBuiltIn === true ? 0 : 1;
          if (ab !== bb) return ab - bb;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
      }),
    );
  }
}
