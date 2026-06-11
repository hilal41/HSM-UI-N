import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { MeApiService } from '../../../core/api/me-api.service';
import type { Hospital } from '../../../core/models/api-contracts';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-my-hospital-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    InputTextModule,
    SelectModule,
    ButtonModule,
    MessageModule,
    TagModule,
  ],
  templateUrl: './my-hospital.page.html',
})
export class MyHospitalPage implements OnInit {
  private readonly meApi = inject(MeApiService);
  private readonly messages = inject(MessageService);

  loading = false;
  saving = false;
  errorMessage: string | null = null;
  hospital: Hospital | null = null;

  name = '';
  address = '';
  phone = '';
  email = '';
  website = '';
  businessRegistrationNumber = '';
  tagline = '';
  /** Base64 data URL or raw base64; sent on save. */
  logoBase64 = '';
  status: string | null = null;

  private readonly maxLogoBytes = 2 * 1024 * 1024;

  readonly statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Suspended', value: 'Suspended' },
  ];

  ngOnInit(): void {
    this.loading = true;
    this.meApi
      .getMyHospital()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (h) => {
          this.hospital = h;
          this.name = h.name;
          this.address = h.address ?? '';
          this.phone = h.phone ?? '';
          this.email = h.email ?? '';
          this.website = h.website ?? '';
          this.businessRegistrationNumber = h.businessRegistrationNumber ?? '';
          this.tagline = h.tagline ?? '';
          this.logoBase64 = h.logoBase64 ?? '';
          this.status = h.status;
        },
        error: () => {
          this.errorMessage =
            'No hospital is linked to this account, or the profile could not be loaded (GET /api/v1/Me/hospital).';
        },
      });
  }

  onLogoFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.messages.add({
        severity: 'warn',
        summary: 'Logo',
        detail: 'Please choose an image file (PNG, JPEG, etc.).',
      });
      return;
    }
    if (file.size > this.maxLogoBytes) {
      this.messages.add({
        severity: 'warn',
        summary: 'Logo',
        detail: 'Image must be about 2 MB or smaller.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.logoBase64 = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  }

  clearLogo(): void {
    this.logoBase64 = '';
  }

  save(): void {
    if (!this.hospital) return;
    this.saving = true;
    this.meApi
      .updateMyHospital({
        name: this.name || undefined,
        address: this.address || undefined,
        phone: this.phone || undefined,
        email: this.email || undefined,
        status: this.status ?? undefined,
        website: this.website,
        businessRegistrationNumber: this.businessRegistrationNumber,
        tagline: this.tagline,
        logoBase64: this.logoBase64,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (h) => {
          this.hospital = h;
          this.logoBase64 = h.logoBase64 ?? '';
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Hospital profile updated.',
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Update failed',
            detail: err?.error?.message ?? 'Could not save changes.',
          });
        },
      });
  }
}
