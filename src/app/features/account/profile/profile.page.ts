import { Component, inject, OnInit } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import type { MeResponse, Module } from '../../../core/models/api-contracts';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-profile-page',
  imports: [
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    ChipModule,
    TagModule,
    MessageModule,
    ButtonModule,
  ],
  templateUrl: './profile.page.html',
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

  ngOnInit(): void {
    this.loading = true;
    this.meApi
      .getMe()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => (this.data = res),
        error: () => (this.errorMessage = 'Unable to load your profile (GET /api/v1/Me).'),
      });
    this.loadAllowedModulesEndpoint();
  }

  loadAllowedModulesEndpoint(): void {
    this.loadingAllowedModules = true;
    this.allowedModulesError = null;
    this.meApi
      .getAllowedModules()
      .pipe(finalize(() => (this.loadingAllowedModules = false)))
      .subscribe({
        next: (res) => (this.allowedModulesEndpoint = res.modules ?? []),
        error: () =>
          (this.allowedModulesError = 'Could not load GET /api/v1/Me/allowed-modules.'),
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
            detail: 'New access token from POST /auth/refresh-token.',
          });
        },
        error: () => {
          this.errorMessage = 'Refresh token failed (POST /api/v1/auth/refresh-token).';
        },
      });
  }
}
