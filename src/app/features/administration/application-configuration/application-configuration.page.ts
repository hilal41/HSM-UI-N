import { Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApplicationConfigurationApiService } from '../../../core/api/application-configuration-api.service';
import type { LoginHeroImage } from '../../../core/models/api-contracts';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage, showCrudPaginator } from '../../../shared/utils/crud-page.state';
import { publicAssetUrl } from '../../../shared/utils/public-asset-url';

@Component({
  selector: 'app-application-configuration-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    ToggleSwitchModule,
  ],
  templateUrl: './application-configuration.page.html',
})
export class ApplicationConfigurationPage implements OnInit {
  private readonly api = inject(ApplicationConfigurationApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageUpload');

  readonly apiOrigin = environment.apiBaseUrl;

  rows: LoginHeroImage[] = [];
  loading = false;
  uploading = false;
  errorMessage: string | null = null;
  uploadAltText = '';

  get showPaginator(): boolean {
    return showCrudPaginator(this.rows.length, 10);
  }

  settingsLoading = false;
  settingsSaving = false;
  settingsError: string | null = null;
  formAppName = '';
  formSupportEmail = '';
  formSupportPhone = '';
  formMaintenanceMode = false;
  formMaintenanceMessage = '';
  formAuditLogsEnabled = true;

  ngOnInit(): void {
    this.loadSettings();
    this.load();
  }

  loadSettings(): void {
    this.settingsLoading = true;
    this.settingsError = null;
    this.api
      .getSettings()
      .pipe(finalize(() => (this.settingsLoading = false)))
      .subscribe({
        next: (s) => {
          this.formAppName = s.appName ?? '';
          this.formSupportEmail = s.supportEmail ?? '';
          this.formSupportPhone = s.supportPhone ?? '';
          this.formMaintenanceMode = s.maintenanceMode;
          this.formMaintenanceMessage = s.maintenanceMessage ?? '';
          this.formAuditLogsEnabled = s.auditLogsEnabled;
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          if (err?.status === 403) {
            this.settingsError = 'You do not have permission to manage application settings.';
          } else {
            this.settingsError = err?.error?.message ?? 'Unable to load application settings.';
          }
        },
      });
  }

  saveSettings(): void {
    if (!this.formAppName.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'App name is required.',
      });
      return;
    }
    this.settingsSaving = true;
    this.api
      .updateSettings({
        appName: this.formAppName.trim(),
        supportEmail: this.formSupportEmail.trim() || null,
        supportPhone: this.formSupportPhone.trim() || null,
        maintenanceMode: this.formMaintenanceMode,
        maintenanceMessage: this.formMaintenanceMessage.trim() || null,
        auditLogsEnabled: this.formAuditLogsEnabled,
      })
      .pipe(finalize(() => (this.settingsSaving = false)))
      .subscribe({
        next: (s) => {
          this.formAppName = s.appName ?? '';
          this.formSupportEmail = s.supportEmail ?? '';
          this.formSupportPhone = s.supportPhone ?? '';
          this.formMaintenanceMode = s.maintenanceMode;
          this.formMaintenanceMessage = s.maintenanceMessage ?? '';
          this.formAuditLogsEnabled = s.auditLogsEnabled;
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Application settings updated.',
          });
        },
        error: (err: unknown) => {
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: apiErrorMessage(err, 'Could not save settings.'),
          });
        },
      });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getLoginHeroImages()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.rows = data),
        error: (err: { status?: number; error?: { message?: string } }) => {
          if (err?.status === 403) {
            this.errorMessage =
              'You do not have permission to manage login images. Sign in as Developer and open Application configuration from the menu.';
          } else {
            this.errorMessage =
              err?.error?.message ?? 'Unable to load login images. Restart the API if you recently updated the app.';
          }
        },
      });
  }

  imageSrc(row: LoginHeroImage): string {
    return publicAssetUrl(this.apiOrigin, row.imageUrl);
  }

  openUploadPicker(): void {
    this.imageInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png'].includes(ext)) {
      this.messages.add({
        severity: 'warn',
        summary: 'Invalid file',
        detail: 'Choose a JPG or PNG image.',
      });
      return;
    }

    this.uploading = true;
    this.api
      .uploadLoginHeroImage(file, this.uploadAltText)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (created) => {
          this.rows = [...this.rows, created].sort((a, b) => a.sortOrder - b.sortOrder);
          this.uploadAltText = '';
          this.messages.add({
            severity: 'success',
            summary: 'Uploaded',
            detail: 'Login image added.',
          });
        },
        error: (err: { error?: { message?: string; detail?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Upload failed',
            detail:
              err?.error?.message ??
              err?.error?.detail ??
              'Could not upload the image.',
          });
        },
      });
  }

  toggleActive(row: LoginHeroImage, isActive: boolean): void {
    this.api.updateLoginHeroImage(row.id, { isActive }).subscribe({
      next: (updated) => {
        row.isActive = updated.isActive;
        this.messages.add({
          severity: 'success',
          summary: 'Updated',
          detail: updated.isActive ? 'Image is shown on the login page.' : 'Image hidden from login page.',
        });
      },
      error: () => {
        row.isActive = !isActive;
        this.messages.add({
          severity: 'error',
          summary: 'Update failed',
          detail: 'Could not update image status.',
        });
      },
    });
  }

  saveAltText(row: LoginHeroImage): void {
    this.api.updateLoginHeroImage(row.id, { altText: row.altText ?? '' }).subscribe({
      next: (updated) => {
        row.altText = updated.altText;
        this.messages.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Alt text updated.',
        });
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: 'Could not save alt text.',
        });
      },
    });
  }

  confirmDelete(row: LoginHeroImage): void {
    this.confirm.confirm({
      header: 'Remove login image',
      message: 'Delete this image from the login carousel?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteRow(row),
    });
  }

  private deleteRow(row: LoginHeroImage): void {
    this.api.deleteLoginHeroImage(row.id).subscribe({
      next: () => {
        this.rows = this.rows.filter((x) => x.id !== row.id);
        this.messages.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Login image removed.',
        });
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: 'Could not delete the image.',
        });
      },
    });
  }
}
