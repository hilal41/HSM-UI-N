import { Component, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { finalize } from 'rxjs';
import { AdmissionsApiService } from '../../../../core/api/admissions-api.service';
import { BedsApiService } from '../../../../core/api/beds-api.service';
import { ClinicalDepartmentsApiService } from '../../../../core/api/clinical-departments-api.service';
import { DoctorsApiService } from '../../../../core/api/doctors-api.service';
import { WardsApiService } from '../../../../core/api/wards-api.service';
import type { Admission, Bed, Department, Doctor, Patient, Ward } from '../../../../core/models/api-contracts';
import { PatientRegisterSearchComponent } from '../../patient-registration/patient-register-search.component';
import { HmsCrudEmptyStateComponent } from '../../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../../shared/components/surface-panel/surface-panel.component';
import { showCrudPaginator } from '../../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-ipd-admissions-page',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    PatientRegisterSearchComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './admissions.page.html',
})
export class IpdAdmissionsPage implements OnInit {
  private readonly api = inject(AdmissionsApiService);
  private readonly deptApi = inject(ClinicalDepartmentsApiService);
  private readonly doctorApi = inject(DoctorsApiService);
  private readonly wardApi = inject(WardsApiService);
  private readonly bedApi = inject(BedsApiService);
  private readonly messages = inject(MessageService);

  rows: Admission[] = [];
  departments: Department[] = [];
  doctors: Doctor[] = [];
  wards: Ward[] = [];
  availableBeds: Bed[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  statusFilter = '';

  admitOpen = false;
  pickedPatient: Patient | null = null;
  formDepartmentId: number | null = null;
  formDoctorId: number | null = null;
  formWardId: number | null = null;
  formBedId: number | null = null;
  formReason = '';
  formDiagnosis = '';
  formExpectedDischarge: Date | null = null;

  readonly statusOptions = [
    { label: 'All', value: '' },
    { label: 'Admitted', value: 'Admitted' },
    { label: 'Discharged', value: 'Discharged' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 15);
  }

  ngOnInit(): void {
    this.deptApi.getAll().subscribe({ next: (d) => (this.departments = d) });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getPaged(this.statusFilter || undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: () => (this.errorMessage = 'Unable to load admissions.'),
      });
  }

  onPatientPicked(p: Patient): void {
    this.pickedPatient = p;
  }

  openAdmit(): void {
    this.pickedPatient = null;
    this.formDepartmentId = null;
    this.formDoctorId = null;
    this.formWardId = null;
    this.formBedId = null;
    this.formReason = '';
    this.formDiagnosis = '';
    this.formExpectedDischarge = null;
    this.admitOpen = true;
  }

  onDepartmentChange(): void {
    this.formWardId = null;
    this.formBedId = null;
    this.wards = [];
    this.availableBeds = [];
    if (this.formDepartmentId == null) return;
    this.doctorApi.getPaged({ departmentId: this.formDepartmentId, pageSize: 100 }).subscribe({
      next: (r) => (this.doctors = r.items ?? []),
    });
    this.wardApi.getByDepartment(this.formDepartmentId).subscribe({ next: (w) => (this.wards = w) });
  }

  onWardChange(): void {
    this.formBedId = null;
    this.availableBeds = [];
    if (this.formWardId == null) return;
    this.bedApi.getAvailable(this.formWardId).subscribe({ next: (b) => (this.availableBeds = b) });
  }

  admit(): void {
    if (
      !this.pickedPatient ||
      this.formDepartmentId == null ||
      this.formDoctorId == null ||
      this.formWardId == null ||
      this.formBedId == null
    ) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Patient, department, doctor, ward and bed are required.' });
      return;
    }
    this.saving = true;
    this.api
      .create({
        patientId: this.pickedPatient.id,
        departmentId: this.formDepartmentId,
        doctorId: this.formDoctorId,
        wardId: this.formWardId,
        bedId: this.formBedId,
        reasonForAdmission: this.formReason.trim() || null,
        diagnosis: this.formDiagnosis.trim() || null,
        expectedDischargeDate: this.formExpectedDischarge?.toISOString() ?? null,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Admitted', detail: 'Patient admitted successfully.' });
          this.admitOpen = false;
          this.load();
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Admission failed.' });
        },
      });
  }

  statusSeverity(status: string): 'success' | 'secondary' | 'warn' {
    if (status === 'Admitted') return 'success';
    if (status === 'Discharged') return 'secondary';
    return 'warn';
  }
}
