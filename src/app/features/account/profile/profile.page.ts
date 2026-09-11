import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import type { Department, MeResponse, Module } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { LANGUAGE_OPTIONS } from '../../../shared/utils/hospital-profile.utils';

@Component({
  selector: 'app-profile-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    ChipModule,
    TagModule,
    MessageModule,
    ButtonModule,
    SelectModule,
    RouterLink,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly meApi = inject(MeApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly messages = inject(MessageService);

  data: MeResponse | null = null;
  loading = false;
  refreshing = false;
  errorMessage: string | null = null;

  allowedModulesEndpoint: Module[] = [];
  loadingAllowedModules = false;
  allowedModulesError: string | null = null;

  readonly languageOptions = LANGUAGE_OPTIONS;
  formLanguage: string | null = 'en';
  formProfilePictureBase64: string | null = null;
  preferencesLoading = false;
  preferencesSaving = false;
  preferencesAvailable = false;

  get displayName(): string {
    const user = this.data?.user;
    if (!user) return '—';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.userName || user.email || '—';
  }

  get initials(): string {
    const user = this.data?.user;
    if (!user) return '?';
    const first = user.firstName?.trim()?.[0] ?? '';
    const last = user.lastName?.trim()?.[0] ?? '';
    const fromName = `${first}${last}`.toUpperCase();
    if (fromName) return fromName;
    return (user.userName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();
  }

  get roleLabel(): string {
    return this.data?.roleName ?? this.data?.user.roleName ?? '—';
  }

  get activeBranchName(): string | null {
    const branchId = this.data?.activeBranchId ?? this.data?.user.activeBranchId;
    if (!branchId || !this.data?.branches.length) return null;
    return this.data.branches.find((b) => b.id === branchId)?.name ?? null;
  }

  get moduleList(): Module[] {
    if (this.allowedModulesEndpoint.length) return this.allowedModulesEndpoint;
    return this.data?.allowedModules ?? [];
  }

  ngOnInit(): void {
    this.loading = true;
    this.meApi
      .getMe()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loadPreferences();
        },
        error: () => (this.errorMessage = 'Unable to load your profile. Please try again.'),
      });
    this.loadAllowedModulesEndpoint();
  }

  departmentLabel(department: Department): string {
    return department.branchName ? `${department.name} · ${department.branchName}` : department.name;
  }

  isActiveBranch(branchId: number): boolean {
    const active = this.data?.activeBranchId ?? this.data?.user.activeBranchId;
    return active === branchId;
  }

  loadAllowedModulesEndpoint(): void {
    this.loadingAllowedModules = true;
    this.allowedModulesError = null;
    this.meApi
      .getAllowedModules()
      .pipe(finalize(() => (this.loadingAllowedModules = false)))
      .subscribe({
        next: (res) => (this.allowedModulesEndpoint = res.modules ?? []),
        error: () => (this.allowedModulesError = 'Could not reload module access.'),
      });
  }

  onProfilePictureSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.messages.add({ severity: 'warn', summary: 'Picture', detail: 'Please select an image file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.formProfilePictureBase64 = typeof reader.result === 'string' ? reader.result : null;
    };
    reader.readAsDataURL(file);
  }

  clearProfilePicture(): void {
    this.formProfilePictureBase64 = '';
  }

  savePreferences(): void {
    this.preferencesSaving = true;
    this.meApi
      .updateMyProfile({
        language: this.formLanguage || null,
        profilePictureBase64: this.formProfilePictureBase64,
      })
      .pipe(finalize(() => (this.preferencesSaving = false)))
      .subscribe({
        next: (user) => {
          this.formLanguage = user.language ?? 'en';
          this.formProfilePictureBase64 = user.profilePictureBase64 ?? user.profilePictureUrl ?? null;
          this.preferencesAvailable = true;
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Language and profile picture updated.',
          });
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Preferences',
            detail: 'Could not update preferences. Please try again.',
          });
        },
      });
  }

  refreshAccessToken(): void {
    const body = this.session.buildRefreshTokenRequest();
    if (!body) return;
    this.refreshing = true;
    this.authApi
      .refreshToken(body)
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: (res) => {
          this.session.setSession(res);
          this.messages.add({
            severity: 'success',
            summary: 'Session refreshed',
            detail: 'Your access token was renewed.',
          });
        },
        error: () => {
          this.errorMessage = 'Could not refresh your session. Please sign in again.';
        },
      });
  }

  private loadPreferences(): void {
    this.preferencesLoading = true;
    this.meApi
      .getMyProfile()
      .pipe(finalize(() => (this.preferencesLoading = false)))
      .subscribe({
        next: (user) => {
          this.formLanguage = user.language ?? 'en';
          this.formProfilePictureBase64 = user.profilePictureBase64 ?? user.profilePictureUrl ?? null;
          this.preferencesAvailable = true;
        },
        error: () => {
          this.preferencesAvailable = false;
          this.formLanguage = 'en';
        },
      });
  }
}
