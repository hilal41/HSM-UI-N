import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { ClinicalServicesApiService } from '../../../core/api/clinical-services-api.service';
import { DoctorsApiService } from '../../../core/api/doctors-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import { PatientVisitsApiService } from '../../../core/api/patient-visits-api.service';
import type { ClinicalService, CreatePatientVisitRequest, Doctor, Hospital, Patient } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { resolveBranchTimeZone } from '../../../shared/utils/branch-calendar-date.util';
import { newClientId } from '../../../shared/utils/client-id.util';
import { doctorIsAvailableAt } from '../../../shared/utils/doctor-availability.util';
import {
  PatientRegistrationSlipComponent,
  type PatientRegistrationSlipLineVm,
} from './patient-registration-slip.component';
import {
  defaultRegistrationSlipTemplate,
  parseRegistrationSlipTemplateJson,
  type RegistrationSlipTemplate,
} from './registration-slip-template';
import { PatientRegisterLogDialogComponent } from './patient-register-log-dialog.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { RegisterPatientFlowDialogComponent } from './register-patient-flow-dialog.component';

interface VisitLineVm {
  key: string;
  clinicalServiceId: number;
  serviceTitle: string;
  serviceCode: string;
  consultancyType: string;
  labTestId?: number | null;
  doctorId: number | null;
  priority: string;
  servicePrice: number;
  serviceDiscount: number;
  remarks: string;
}

interface SlipSnapshot {
  lines: PatientRegistrationSlipLineVm[];
  visitRemarks: string;
  totalAmount: number;
  discountAmount: number;
  branchName: string | null;
}

@Component({
  selector: 'app-patient-registration-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    RegisterPatientFlowDialogComponent,
    ButtonModule,
    MessageModule,
    AutoCompleteModule,
    TableModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    PatientRegistrationSlipComponent,
    PatientRegisterLogDialogComponent,
  ],
  templateUrl: './patient-registration.page.html',
  styleUrl: './patient-registration.page.scss',
})
export class PatientRegistrationPage implements OnInit, OnDestroy {
  private static readonly ServiceSearchPlaceholderStatic = 'Search service…';

  private static readonly ServiceSearchHints = [
    'Search service by name here…',
    'Search lab test or consultation…',
    'Find service code or title…',
    'Type service name to add…',
    'Look up clinical service here…',
    'Search OPD, lab, or procedure…',
  ];
  private readonly clinicalApi = inject(ClinicalServicesApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly meApi = inject(MeApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  registerDialogOpen = false;
  historyDialogOpen = false;
  currentPatient: Patient | null = null;
  pageError: string | null = null;

  serviceSuggestions: ClinicalService[] = [];
  servicePick: ClinicalService | null = null;
  serviceSearchPlaceholder = '';
  serviceSearchFocused = false;
  private serviceSearchQuery = '';
  private serviceHintTimer: ReturnType<typeof setTimeout> | null = null;
  private serviceHintPaused = false;

  lines: VisitLineVm[] = [];
  private allDoctors: Doctor[] = [];
  doctorOptions: { label: string; value: number }[] = [];

  visitRemarks = '';
  savingVisit = false;

  /** After "Save & print", lines are cleared but the slip keeps this snapshot until the next edit. */
  private slipSnapshot: SlipSnapshot | null = null;

  myHospital: Hospital | null = null;
  slipTemplate: RegistrationSlipTemplate = defaultRegistrationSlipTemplate();

  private doctorsLoadGen = 0;
  private lastBranchIdForDoctors: number | null | undefined = undefined;

  constructor() {
    // Re-filter (and reload) when active branch / timezone changes.
    effect(() => {
      const branchId = this.session.activeBranchId();
      this.session.activeBranch()?.timeZoneId;
      if (this.lastBranchIdForDoctors === undefined) {
        this.lastBranchIdForDoctors = branchId;
        this.refreshDoctorOptions();
        return;
      }
      if (this.lastBranchIdForDoctors !== branchId) {
        this.lastBranchIdForDoctors = branchId;
        this.loadDoctors();
        return;
      }
      this.refreshDoctorOptions();
    });
  }

  ngOnInit(): void {
    this.meApi.getMyHospital().subscribe({
      next: (h) => {
        this.myHospital = h;
        this.slipTemplate = parseRegistrationSlipTemplateJson(h.registrationSlipTemplateJson);
        this.cdr.markForCheck();
      },
      error: () => {
        this.messages.add({
          severity: 'warn',
          summary: 'Hospital',
          detail: 'Could not load hospital profile for the printed slip.',
        });
      },
    });

    this.loadDoctors();
    this.syncServiceHintPause();
  }

  private loadDoctors(): void {
    const gen = ++this.doctorsLoadGen;
    this.doctorsApi
      .getPaged({ page: 1, pageSize: 500, status: 'Active' })
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: (res) => {
          if (gen !== this.doctorsLoadGen) {
            return;
          }
          this.allDoctors = Array.isArray(res.items) ? res.items : [];
          this.refreshDoctorOptions();
        },
        error: () => {
          if (gen !== this.doctorsLoadGen) {
            return;
          }
          this.allDoctors = [];
          this.refreshDoctorOptions();
          this.messages.add({
            severity: 'warn',
            summary: 'Doctors',
            detail: 'Could not load doctors list.',
          });
        },
      });
  }

  private get clinicTimeZone(): string {
    return resolveBranchTimeZone(this.session.activeBranch()?.timeZoneId);
  }

  ngOnDestroy(): void {
    this.clearServiceHintTimer();
  }

  onServiceSearchFocus(): void {
    this.serviceSearchFocused = true;
    this.syncServiceHintPause();
  }

  onServiceSearchBlur(): void {
    this.serviceSearchFocused = false;
    this.syncServiceHintPause();
  }

  private syncServiceHintPause(): void {
    const shouldPause =
      !this.currentPatient ||
      this.serviceSearchFocused ||
      this.serviceSearchQuery.trim().length > 0;
    if (shouldPause === this.serviceHintPaused) {
      return;
    }
    this.serviceHintPaused = shouldPause;
    if (shouldPause) {
      this.clearServiceHintTimer();
      this.serviceSearchPlaceholder = PatientRegistrationPage.ServiceSearchPlaceholderStatic;
      this.cdr.markForCheck();
    } else {
      this.startServiceHintAnimation();
    }
  }

  private startServiceHintAnimation(): void {
    this.clearServiceHintTimer();
    this.serviceHintPaused = false;
    this.serviceSearchPlaceholder = '';
    this.cdr.markForCheck();
    this.serviceHintTimer = setTimeout(() => this.runServiceHintCycle(0), 600);
  }

  private runServiceHintCycle(index: number): void {
    if (this.serviceHintPaused) {
      return;
    }
    const phrases = PatientRegistrationPage.ServiceSearchHints;
    const text = phrases[index % phrases.length];
    this.typeServiceHint(text, 0, () => {
      this.serviceHintTimer = setTimeout(() => {
        this.deleteServiceHint(text.length, () => {
          this.serviceHintTimer = setTimeout(() => this.runServiceHintCycle(index + 1), 400);
        });
      }, 1800);
    });
  }

  private typeServiceHint(text: string, i: number, done: () => void): void {
    if (this.serviceHintPaused) {
      return;
    }
    this.serviceSearchPlaceholder = text.slice(0, i);
    this.cdr.markForCheck();
    if (i >= text.length) {
      done();
      return;
    }
    this.serviceHintTimer = setTimeout(() => this.typeServiceHint(text, i + 1, done), 42);
  }

  private deleteServiceHint(len: number, done: () => void): void {
    if (this.serviceHintPaused) {
      return;
    }
    if (len <= 0) {
      this.serviceSearchPlaceholder = '';
      this.cdr.markForCheck();
      done();
      return;
    }
    this.serviceSearchPlaceholder = this.serviceSearchPlaceholder.slice(0, -1);
    this.cdr.markForCheck();
    this.serviceHintTimer = setTimeout(() => this.deleteServiceHint(len - 1, done), 28);
  }

  private clearServiceHintTimer(): void {
    if (this.serviceHintTimer != null) {
      clearTimeout(this.serviceHintTimer);
      this.serviceHintTimer = null;
    }
  }

  readonly priorityOptions = [
    { label: 'Routine', value: 'Routine' },
    { label: 'Urgent', value: 'Urgent' },
    { label: 'STAT', value: 'STAT' },
  ];

  private refreshDoctorOptions(): void {
    const at = new Date();
    const timeZone = this.clinicTimeZone;
    const onDuty: { label: string; value: number }[] = [];
    const offDuty: { label: string; value: number }[] = [];

    for (const d of this.allDoctors) {
      const name = `${d.firstName} ${d.lastName}`.trim();
      if (doctorIsAvailableAt(d.availability, at, timeZone)) {
        onDuty.push({ label: name, value: d.id });
      } else {
        offDuty.push({ label: `${name} (Off duty)`, value: d.id });
      }
    }

    // Prefer on-duty doctors; if none match the schedule in clinic TZ, still list Active doctors.
    this.doctorOptions = onDuty.length > 0 ? [...onDuty, ...offDuty] : offDuty;
    this.cdr.markForCheck();
  }

  openRegisterDialog(): void {
    this.registerDialogOpen = true;
  }

  onPatientRegistered(p: Patient): void {
    this.currentPatient = p;
    this.lines = [];
    this.visitRemarks = '';
    this.slipSnapshot = null;
    this.pageError = null;
    this.serviceSearchQuery = '';
    this.syncServiceHintPause();
    this.cdr.markForCheck();
  }

  completeServices(event: AutoCompleteCompleteEvent): void {
    const q = (event.query ?? '').trim();
    this.serviceSearchQuery = q;
    this.syncServiceHintPause();
    // Empty query: still load first page so dropdown / search shows services (API allows no search).
    const query = q.length > 0 ? { search: q, page: 1, pageSize: 40 } : { page: 1, pageSize: 40 };
    this.clinicalApi.getPaged(query).subscribe({
      next: (res) => {
        this.serviceSuggestions = Array.isArray(res.items) ? res.items : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.serviceSuggestions = [];
        this.cdr.markForCheck();
      },
    });
  }

  onServiceSelected(event: AutoCompleteSelectEvent): void {
    const svc = event.value as ClinicalService | null;
    if (svc?.id) {
      this.addLine(svc);
    }
    queueMicrotask(() => {
      this.servicePick = null;
      this.serviceSearchQuery = '';
      this.syncServiceHintPause();
      this.cdr.markForCheck();
    });
  }

  private addLine(svc: ClinicalService): void {
    this.slipSnapshot = null;
    const defaultDoctorId =
      svc.doctorId != null && this.isDoctorAvailableNow(svc.doctorId) ? svc.doctorId : null;

    this.lines = [
      ...this.lines,
      {
        key: newClientId(),
        clinicalServiceId: svc.id,
        serviceTitle: svc.title,
        serviceCode: svc.code,
        consultancyType: svc.consultancyType,
        labTestId: svc.labTestId ?? null,
        doctorId: svc.consultancyType === 'Test' ? null : defaultDoctorId,
        priority: 'Routine',
        servicePrice: svc.price,
        serviceDiscount: svc.discount,
        remarks: '',
      },
    ];
    this.cdr.markForCheck();
  }

  isTestLine(row: VisitLineVm): boolean {
    return row.consultancyType === 'Test';
  }

  removeLine(key: string): void {
    this.lines = this.lines.filter((l) => l.key !== key);
    this.cdr.markForCheck();
  }

  get totalAmount(): number {
    return this.lines.reduce((s, l) => s + Number(l.servicePrice), 0);
  }

  get discountAmount(): number {
    return this.lines.reduce((s, l) => s + Number(l.serviceDiscount), 0);
  }

  get netAmount(): number {
    return this.totalAmount - this.discountAmount;
  }

  get canSaveVisit(): boolean {
    return this.currentPatient != null && this.lines.length > 0 && !this.savingVisit;
  }

  get slipLines(): PatientRegistrationSlipLineVm[] {
    return this.lines.map((l) => ({
      serviceTitle: l.serviceTitle,
      serviceCode: l.serviceCode,
      doctorName: this.doctorName(l.doctorId),
      priority: l.priority,
      isTestLine: this.isTestLine(l),
      servicePrice: l.servicePrice,
      serviceDiscount: l.serviceDiscount,
      remarks: l.remarks,
    }));
  }

  get slipLinesForSlip(): PatientRegistrationSlipLineVm[] {
    if (this.lines.length > 0) {
      return this.slipLines;
    }
    return this.slipSnapshot?.lines ?? [];
  }

  get slipRemarksForSlip(): string {
    if (this.lines.length > 0) {
      return this.visitRemarks;
    }
    return this.slipSnapshot?.visitRemarks ?? '';
  }

  get slipTotalForSlip(): number {
    if (this.lines.length > 0) {
      return this.totalAmount;
    }
    return this.slipSnapshot?.totalAmount ?? 0;
  }

  get slipDiscountForSlip(): number {
    if (this.lines.length > 0) {
      return this.discountAmount;
    }
    return this.slipSnapshot?.discountAmount ?? 0;
  }

  get slipBranchName(): string | null {
    if (this.lines.length > 0) {
      return this.session.activeBranch()?.name ?? null;
    }
    return this.slipSnapshot?.branchName ?? this.session.activeBranch()?.name ?? null;
  }

  private doctorName(id: number | null): string {
    if (id == null || id <= 0) {
      return '—';
    }
    const doctor = this.allDoctors.find((o) => o.id === id);
    return doctor ? `${doctor.firstName} ${doctor.lastName}`.trim() : '—';
  }

  private isDoctorAvailableNow(id: number): boolean {
    const doctor = this.allDoctors.find((d) => d.id === id);
    return (
      doctor != null && doctorIsAvailableAt(doctor.availability, new Date(), this.clinicTimeZone)
    );
  }

  /** True when the slip has at least one service line (current visit or last saved-for-print snapshot). */
  get canPrintSlip(): boolean {
    if (!this.currentPatient) {
      return false;
    }
    if (this.lines.length > 0) {
      return true;
    }
    return (this.slipSnapshot?.lines.length ?? 0) > 0;
  }

  /**
   * If the visit is not saved yet, saves with `isPrinted: true` then opens print (via `saveVisit`).
   * If already saved and only a slip snapshot exists, opens print immediately.
   */
  printSlipOrSaveAndPrint(): void {
    if (this.lines.length > 0) {
      this.saveVisit(true);
      return;
    }
    this.printRegistrationSlip();
  }

  printRegistrationSlip(): void {
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  }

  ageDisplay(p: Patient): number {
    const d = new Date(p.dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  showHistory(): void {
    this.historyDialogOpen = true;
    this.cdr.markForCheck();
  }

  saveVisit(andPrint: boolean): void {
    if (!this.currentPatient) {
      this.messages.add({ severity: 'warn', summary: 'Patient', detail: 'Register a patient first.' });
      return;
    }
    if (this.lines.length === 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Services',
        detail: 'Add at least one service line.',
      });
      return;
    }
    for (const line of this.lines) {
      if (this.isTestLine(line)) {
        continue;
      }
      if (line.doctorId == null || line.doctorId <= 0) {
        this.messages.add({
          severity: 'warn',
          summary: 'Doctor',
          detail: `Choose a doctor for "${line.serviceTitle}".`,
        });
        return;
      }
      if (!this.isDoctorAvailableNow(line.doctorId)) {
        this.messages.add({
          severity: 'warn',
          summary: 'Doctor',
          detail: `Selected doctor is not available now for "${line.serviceTitle}".`,
        });
        return;
      }
    }

    const body: CreatePatientVisitRequest = {
      patientId: this.currentPatient.id,
      totalAmount: this.totalAmount,
      discountAmount: this.discountAmount,
      receivedAmount: this.netAmount,
      remarks: this.visitRemarks.trim() || null,
      isPrinted: andPrint,
      visitDate: new Date().toISOString(),
      details: this.lines.map((l) => ({
        doctorId: this.isTestLine(l) ? null : l.doctorId!,
        priority: this.isTestLine(l) ? l.priority : null,
        clinicalServiceId: l.clinicalServiceId,
        servicePrice: l.servicePrice,
        serviceDiscount: l.serviceDiscount,
        remarks: l.remarks.trim() || null,
      })),
    };

    this.pageError = null;
    this.savingVisit = true;
    this.visitsApi
      .create(body)
      .pipe(finalize(() => (this.savingVisit = false)))
      .subscribe({
        next: () => {
          if (andPrint) {
            this.slipSnapshot = {
              lines: this.slipLines.map((l) => ({ ...l })),
              visitRemarks: this.visitRemarks.trim(),
              totalAmount: this.totalAmount,
              discountAmount: this.discountAmount,
              branchName: this.session.activeBranch()?.name ?? null,
            };
          } else {
            this.slipSnapshot = null;
          }
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: andPrint ? 'Visit saved. Opening print…' : 'Visit saved.',
          });
          this.lines = [];
          this.visitRemarks = '';
          this.cdr.detectChanges();
          if (andPrint) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => window.print());
            });
          }
        },
        error: (err: { error?: { message?: string } }) => {
          this.pageError = err?.error?.message ?? 'Could not save visit.';
          this.messages.add({
            severity: 'error',
            summary: 'Visit',
            detail: this.pageError ?? 'Save failed.',
          });
          this.cdr.markForCheck();
        },
      });
  }
}
