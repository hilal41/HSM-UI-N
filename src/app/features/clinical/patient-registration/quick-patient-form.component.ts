import { Component, ElementRef, EventEmitter, OnDestroy, inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { BloodTypesApiService } from '../../../core/api/blood-types-api.service';
import { PatientsApiService } from '../../../core/api/patients-api.service';
import type { BloodTypeOption, Patient } from '../../../core/models/api-contracts';
import {
  caretAfterDigitIndex,
  completedAgeYmdFromDate,
  dateOfBirthFromAgeYmdDate,
  digitIndexBeforeCaret,
  digitsOnlyAgeYmd,
  formatAgeYmdAutoFromDigits,
  formatAgeYmdForInput,
  formatLocalDateIso,
  parseAgeYmdFromUserInput,
} from '../../../shared/utils/patient-age-dob.util';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-quick-patient-form',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './quick-patient-form.component.html',
  styleUrl: './quick-patient-form.component.scss',
})
export class QuickPatientFormComponent implements OnInit, OnDestroy {
  private readonly api = inject(PatientsApiService);
  private readonly bloodTypesApi = inject(BloodTypesApiService);
  private readonly messages = inject(MessageService);

  @Output() patientRegistered = new EventEmitter<Patient>();
  @Output() cancelled = new EventEmitter<void>();
  @ViewChild('qpfCamVideo') private camVideoEl?: ElementRef<HTMLVideoElement>;

  readonly genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  readonly maxDobDate = new Date();

  bloodTypeOptions: BloodTypeOption[] = [];

  saving = false;
  firstName = '';
  lastName = '';
  phone = '';
  dateOfBirth: Date | null = null;
  /** Single field: years-months-days (synced with calendar DOB). */
  ageYmdText = '';
  private syncingDobAge = false;

  address = '';
  gender = 'Other';
  email = '';
  bloodTypeId: number | null = null;
  city = '';
  state = '';
  zipCode = '';
  emergencyContactName = '';
  emergencyContactPhone = '';
  emergencyContactRelation = '';
  insuranceProvider = '';
  insurancePolicyNumber = '';
  patientPictureBase64: string | null = null;
  cameraOpen = false;
  private cameraStream: MediaStream | null = null;
  cameraErrorMessage = '';

  onDateOfBirthChange(): void {
    if (this.syncingDobAge) return;
    if (!this.dateOfBirth) {
      this.ageYmdText = '';
      return;
    }
    if (this.dateOfBirth.getTime() >= Date.now()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Date of birth must be before today.',
      });
      this.dateOfBirth = null;
      this.ageYmdText = '';
      return;
    }
    this.syncingDobAge = true;
    const a = completedAgeYmdFromDate(this.dateOfBirth);
    this.ageYmdText = formatAgeYmdForInput(a);
    this.syncingDobAge = false;
  }

  onAgeYmdInput(ev: Event): void {
    if (this.syncingDobAge) return;
    const el = ev.target as HTMLInputElement;
    const caret = el.selectionStart ?? el.value.length;
    const digitIdx = digitIndexBeforeCaret(el.value, caret);
    const formatted = formatAgeYmdAutoFromDigits(digitsOnlyAgeYmd(el.value));
    this.ageYmdText = formatted;
    const pos = caretAfterDigitIndex(formatted, digitIdx);
    queueMicrotask(() => {
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* ignore if input detached */
      }
    });
    this.syncAgeFromAgeField();
  }

  private syncAgeFromAgeField(): void {
    if (this.syncingDobAge) return;
    const t = this.ageYmdText.trim();
    if (!t) {
      this.syncingDobAge = true;
      this.dateOfBirth = null;
      this.syncingDobAge = false;
      return;
    }
    const parsed = parseAgeYmdFromUserInput(this.ageYmdText);
    if (!parsed) return;
    if (parsed.years + parsed.months + parsed.days === 0) {
      this.syncingDobAge = true;
      this.dateOfBirth = null;
      this.syncingDobAge = false;
      return;
    }
    this.syncingDobAge = true;
    this.dateOfBirth = dateOfBirthFromAgeYmdDate(parsed.years, parsed.months, parsed.days);
    this.syncingDobAge = false;
  }

  onAgeYmdBlur(): void {
    if (this.syncingDobAge) return;
    const t = this.ageYmdText.trim();
    if (!t) return;
    const parsed = parseAgeYmdFromUserInput(this.ageYmdText);
    if (parsed && parsed.years + parsed.months + parsed.days > 0) {
      this.syncingDobAge = true;
      this.ageYmdText = formatAgeYmdForInput(parsed);
      this.syncingDobAge = false;
      return;
    }
    this.messages.add({
      severity: 'warn',
      summary: 'Age',
      detail: 'Use years, months, and days like 45-6-12 or 45 (years only).',
    });
    this.syncingDobAge = true;
    this.ageYmdText = this.dateOfBirth ? formatAgeYmdForInput(completedAgeYmdFromDate(this.dateOfBirth)) : '';
    this.syncingDobAge = false;
  }

  resetForm(): void {
    this.firstName = '';
    this.lastName = '';
    this.phone = '';
    this.dateOfBirth = null;
    this.ageYmdText = '';
    this.address = '';
    this.gender = 'Other';
    this.email = '';
    this.bloodTypeId = null;
    this.city = '';
    this.state = '';
    this.zipCode = '';
    this.emergencyContactName = '';
    this.emergencyContactPhone = '';
    this.emergencyContactRelation = '';
    this.insuranceProvider = '';
    this.insurancePolicyNumber = '';
    this.patientPictureBase64 = null;
  }

  onPatientPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.patientPictureBase64 = typeof reader.result === 'string' ? reader.result : null;
    };
    reader.onerror = () => {
      this.messages.add({
        severity: 'error',
        summary: 'Picture',
        detail: 'Could not read selected image.',
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearPatientPicture(): void {
    this.patientPictureBase64 = null;
  }

  async openCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.messages.add({
        severity: 'warn',
        summary: 'Camera',
        detail: 'Camera is not supported in this browser.',
      });
      return;
    }
    this.cameraErrorMessage = '';
    try {
      const stream = await this.tryOpenCameraStream();
      this.cameraStream = stream;
      this.cameraOpen = true;
      queueMicrotask(() => {
        void this.attachCameraStream();
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: 'Camera',
        detail: 'Could not open device camera. Please check permissions.',
      });
    }
  }

  closeCamera(): void {
    this.cameraOpen = false;
    this.cameraErrorMessage = '';
    if (this.cameraStream) {
      for (const track of this.cameraStream.getTracks()) {
        track.stop();
      }
      this.cameraStream = null;
    }
  }

  captureFromCamera(): void {
    const video = this.camVideoEl?.nativeElement;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.patientPictureBase64 = canvas.toDataURL('image/jpeg', 0.9);
    this.closeCamera();
  }

  private async attachCameraStream(): Promise<void> {
    const video = this.camVideoEl?.nativeElement;
    if (!video || !this.cameraStream) {
      return;
    }
    video.srcObject = this.cameraStream;
    try {
      await video.play();
    } catch {
      this.cameraErrorMessage = 'Camera stream started but preview could not play.';
      return;
    }

    // If no frame arrives quickly, surface a useful hint (prevents silent black screen confusion).
    await new Promise((resolve) => setTimeout(resolve, 1200));
    if (!this.cameraOpen) {
      return;
    }
    if (!video.videoWidth || !video.videoHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.cameraErrorMessage = 'No camera frames received. Check camera privacy settings, then retry.';
    }
  }

  private async tryOpenCameraStream(): Promise<MediaStream> {
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: true, audio: false },
    ];
    let lastError: unknown = null;
    for (const c of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(c);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error('Camera not available');
  }

  ngOnDestroy(): void {
    this.closeCamera();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  ngOnInit(): void {
    this.bloodTypesApi.getAll().subscribe({
      next: (list) => {
        this.bloodTypeOptions = list;
      },
      error: () => {
        this.bloodTypeOptions = [];
        this.messages.add({
          severity: 'error',
          summary: 'Blood types',
          detail: 'Unable to load blood type options.',
        });
      },
    });
  }

  save(): void {
    if (!this.firstName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'First name is required.' });
      return;
    }
    if (!this.lastName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Last name is required.' });
      return;
    }
    if (!this.dateOfBirth) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Select date of birth or enter age (e.g. 45-6-12 for years-months-days).',
      });
      return;
    }
    if (this.dateOfBirth.getTime() >= Date.now()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Date of birth must be before today.',
      });
      return;
    }
    if (!this.gender || !['Male', 'Female', 'Other'].includes(this.gender)) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Choose a valid gender.' });
      return;
    }
    if (!this.phone.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Mobile phone is required.' });
      return;
    }
    const emailTrim = this.email.trim();
    if (emailTrim && !emailPattern.test(emailTrim)) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Enter a valid email or leave it blank.',
      });
      return;
    }

    const dob = formatLocalDateIso(this.dateOfBirth);

    this.saving = true;
    this.api
      .create({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        dateOfBirth: dob,
        gender: this.gender,
        ...(this.bloodTypeId != null ? { bloodTypeId: this.bloodTypeId } : {}),
        phone: this.phone.trim(),
        email: emailTrim || null,
        address: this.address.trim() || null,
        city: this.city.trim() || null,
        state: this.state.trim() || null,
        zipCode: this.zipCode.trim() || null,
        emergencyContactName: this.emergencyContactName.trim() || null,
        emergencyContactPhone: this.emergencyContactPhone.trim() || null,
        emergencyContactRelation: this.emergencyContactRelation.trim() || null,
        insuranceProvider: this.insuranceProvider.trim() || null,
        insurancePolicyNumber: this.insurancePolicyNumber.trim() || null,
        patientPictureBase64: this.patientPictureBase64,
        status: 'Active',
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (patient) => {
          this.messages.add({ severity: 'success', summary: 'Registered', detail: 'Patient saved.' });
          this.patientRegistered.emit(patient);
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'Could not save patient.',
          });
        },
      });
  }
}
