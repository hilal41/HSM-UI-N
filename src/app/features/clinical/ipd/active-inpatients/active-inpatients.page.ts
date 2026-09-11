import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { AdmissionsApiService } from '../../../../core/api/admissions-api.service';
import { BedsApiService } from '../../../../core/api/beds-api.service';
import { ClinicalServicesApiService } from '../../../../core/api/clinical-services-api.service';
import { DoctorsApiService } from '../../../../core/api/doctors-api.service';
import { PatientVisitsApiService } from '../../../../core/api/patient-visits-api.service';
import { WardsApiService } from '../../../../core/api/wards-api.service';
import type {
  ActiveInpatient,
  Bed,
  ClinicalService,
  CreatePatientVisitDetailLineRequest,
  Ward,
} from '../../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-active-inpatients-page',
  imports: [
    DecimalPipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
  ],
  templateUrl: './active-inpatients.page.html',
})
export class ActiveInpatientsPage implements OnInit {
  private readonly api = inject(AdmissionsApiService);
  private readonly visitsApi = inject(PatientVisitsApiService);
  private readonly servicesApi = inject(ClinicalServicesApiService);
  private readonly wardApi = inject(WardsApiService);
  private readonly bedApi = inject(BedsApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  rows: ActiveInpatient[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  selected: ActiveInpatient | null = null;
  chargeOpen = false;
  transferOpen = false;
  dischargeOpen = false;

  ipdServices: ClinicalService[] = [];
  chargeServiceId: number | null = null;
  chargeDoctorId: number | null = null;

  transferWards: Ward[] = [];
  transferWardId: number | null = null;
  transferBeds: Bed[] = [];
  transferBedId: number | null = null;

  dischargeSummary = '';
  dischargeInstructions = '';

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 15);
  }

  ngOnInit(): void {
    this.load();
    this.servicesApi.getPaged({ pageSize: 200 }).subscribe({
      next: (r) => {
        this.ipdServices = (r.items ?? []).filter(
          (s) => s.consultancyType === 'IPD' || s.consultancyType === 'Test',
        );
      },
    });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getActive()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load active inpatients.'),
      });
  }

  openCharge(row: ActiveInpatient): void {
    this.selected = row;
    this.chargeServiceId = this.ipdServices[0]?.id ?? null;
    this.chargeDoctorId = row.doctorId;
    this.chargeOpen = true;
  }

  submitCharge(): void {
    if (!this.selected || this.chargeServiceId == null) return;
    const svc = this.ipdServices.find((s) => s.id === this.chargeServiceId);
    if (!svc) return;
    const line: CreatePatientVisitDetailLineRequest = {
      clinicalServiceId: svc.id,
      doctorId: this.chargeDoctorId,
      servicePrice: svc.price,
      serviceDiscount: 0,
    };
    this.saving = true;
    this.visitsApi
      .create({
        patientId: this.selected.patientId,
        admissionId: this.selected.id,
        totalAmount: svc.price,
        discountAmount: 0,
        receivedAmount: 0,
        isPrinted: false,
        details: [line],
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Charged', detail: 'Added to running tab.' });
          this.chargeOpen = false;
          this.load();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Charge failed.' });
        },
      });
  }

  startRounds(row: ActiveInpatient): void {
    this.api.ensureTodayVisit(row.id).subscribe({
      next: (res) => {
        void this.router.navigate(['/app/clinical/doctor-checkup/session', res.visitId]);
      },
      error: (err: { error?: { message?: string } }) => {
        this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Could not start rounds.' });
      },
    });
  }

  openTransfer(row: ActiveInpatient): void {
    this.selected = row;
    this.transferWardId = null;
    this.transferBedId = null;
    this.transferBeds = [];
    this.wardApi.getByDepartment(row.departmentId).subscribe({ next: (w) => (this.transferWards = w) });
    this.transferOpen = true;
  }

  onTransferWardChange(): void {
    this.transferBedId = null;
    if (this.transferWardId == null) return;
    this.bedApi.getAvailable(this.transferWardId).subscribe({ next: (b) => (this.transferBeds = b) });
  }

  submitTransfer(): void {
    if (!this.selected || this.transferWardId == null || this.transferBedId == null) return;
    this.saving = true;
    this.api
      .transfer(this.selected.id, { wardId: this.transferWardId, bedId: this.transferBedId })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Transferred', detail: 'Bed updated.' });
          this.transferOpen = false;
          this.load();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Transfer failed.' });
        },
      });
  }

  openDischarge(row: ActiveInpatient): void {
    this.selected = row;
    this.dischargeSummary = '';
    this.dischargeInstructions = '';
    this.dischargeOpen = true;
  }

  submitDischarge(): void {
    if (!this.selected) return;
    this.saving = true;
    this.api
      .discharge(this.selected.id, {
        dischargeSummary: this.dischargeSummary.trim() || null,
        dischargeInstructions: this.dischargeInstructions.trim() || null,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (a) => {
          this.messages.add({
            severity: 'success',
            summary: 'Discharged',
            detail: a.runningBalance > 0 ? 'Collect balance at cashier.' : 'Stay closed.',
          });
          this.dischargeOpen = false;
          this.load();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Discharge failed.' });
        },
      });
  }
}
