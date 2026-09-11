import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { HospitalConfigurationApiService } from '../../../core/api/hospital-configuration-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import type { Hospital, HospitalConfigurationOption } from '../../../core/models/api-contracts';
import { MenuPermissionService } from '../../../core/services/menu-permission.service';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

/**
 * Hospital profile page of the Hospital settings console.
 * Type/size choices come from the database-backed configuration schema;
 * localization, MRN, and slip layouts live on their own child pages.
 * Status and branch-management allowance are Developer-controlled (read-only here).
 */
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
  styleUrl: './my-hospital.page.scss',
})
export class MyHospitalPage implements OnInit {
  private readonly meApi = inject(MeApiService);
  private readonly configApi = inject(HospitalConfigurationApiService);
  private readonly messages = inject(MessageService);
  private readonly menuPerms = inject(MenuPermissionService);

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
  licenseNumber = '';
  taxNumber = '';
  hospitalType: string | null = null;
  hospitalSize: string | null = null;
  /** Base64 data URL or raw base64; sent on save. */
  logoBase64 = '';
  status: string | null = null;

  /** Choices come from the database-backed configuration schema. */
  hospitalTypeOptions: HospitalConfigurationOption[] = [];
  hospitalSizeOptions: HospitalConfigurationOption[] = [];

  private readonly maxLogoBytes = 2 * 1024 * 1024;

  get canEdit(): boolean {
    return this.menuPerms.can('hospital.configuration.profile', 'edit');
  }

  get displayName(): string {
    return this.name || this.hospital?.name || '—';
  }

  get hospitalTypeLabel(): string | null {
    if (!this.hospitalType) return null;
    return (
      this.hospitalTypeOptions.find((o) => o.value === this.hospitalType)?.label ??
      this.hospitalType
    );
  }

  get hospitalSizeLabel(): string | null {
    if (!this.hospitalSize) return null;
    return (
      this.hospitalSizeOptions.find((o) => o.value === this.hospitalSize)?.label ??
      this.hospitalSize
    );
  }

  get statusSeverity(): 'success' | 'warn' | 'danger' {
    switch ((this.status ?? '').toLowerCase()) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warn';
      default:
        return 'danger';
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.meApi
      .getMyHospital()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (h) => this.applyHospital(h),
        error: () => {
          this.errorMessage =
            'No hospital is linked to this account, or the profile could not be loaded (GET /api/v1/Me/hospital).';
        },
      });

    this.configApi.getSettings().subscribe({
      next: (config) => {
        const profile = config.categories.find((c) => c.code.toLowerCase() === 'profile');
        this.hospitalTypeOptions =
          profile?.settings.find((s) => s.key === 'profile.hospitalType')?.options ?? [];
        this.hospitalSizeOptions =
          profile?.settings.find((s) => s.key === 'profile.hospitalSize')?.options ?? [];
      },
      error: () => {
        // Selects stay empty but the rest of the profile remains editable.
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
        website: this.website,
        businessRegistrationNumber: this.businessRegistrationNumber,
        tagline: this.tagline,
        logoBase64: this.logoBase64,
        licenseNumber: this.licenseNumber || null,
        taxNumber: this.taxNumber || null,
        hospitalType: this.hospitalType || null,
        hospitalSize: this.hospitalSize || null,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (h) => {
          this.applyHospital(h);
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

  private applyHospital(h: Hospital): void {
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
    this.licenseNumber = h.licenseNumber ?? '';
    this.taxNumber = h.taxNumber ?? '';
    this.hospitalType = h.hospitalType ?? null;
    this.hospitalSize = h.hospitalSize ?? null;
  }
}
