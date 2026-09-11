import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { publicAssetUrl } from '../../../shared/utils/public-asset-url';
import { ApplicationConfigurationApiService } from '../../../core/api/application-configuration-api.service';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import type { BranchSummary, LoginResponse, PublicApplicationSettings } from '../../../core/models/api-contracts';

@Component({
  selector: 'app-login-page',
  imports: [
    FormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    SelectModule,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly authApi = inject(AuthApiService);
  private readonly configApi = inject(ApplicationConfigurationApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  heroSlides: { src: string; mobileSrc: string; alt: string }[] = [];
  activeHeroIndex = 0;
  private heroIntervalId: ReturnType<typeof setInterval> | undefined;

  readonly heroTaglines = [
    'Diagnostics. Decisions. Care.',
    'Efficiency drives growth.',
    'Secure access for your care team.',
    'One platform for every branch.',
  ];
  activeTaglineIndex = 0;
  private taglineIntervalId: ReturnType<typeof setInterval> | undefined;

  publicSettings: PublicApplicationSettings | null = null;

  userNameOrEmail = '';
  password = '';
  loading = false;
  errorMessage: string | null = null;

  branchPickerOpen = false;
  pendingLogin: LoginResponse | null = null;
  branchOptions: { label: string; value: number }[] = [];
  selectedBranchId: number | null = null;

  get displayAppName(): string {
    return this.publicSettings?.appName?.trim() || 'HMS Platform';
  }

  get maintenanceBanner(): string | null {
    if (!this.publicSettings?.maintenanceMode) return null;
    const msg = this.publicSettings.maintenanceMessage?.trim();
    return msg || 'The system is currently under maintenance. Sign-in may be limited.';
  }

  ngOnInit(): void {
    this.startTaglineRotation();
    this.configApi.getPublicSettings().subscribe({
      next: (settings) => (this.publicSettings = settings),
      error: () => {
        this.publicSettings = null;
      },
    });
    this.configApi.getPublicLoginHeroImages().subscribe({
      next: (images) => {
        this.heroSlides = images.map((image) => ({
          src: publicAssetUrl(environment.apiBaseUrl, image.imageUrl),
          mobileSrc: publicAssetUrl(environment.apiBaseUrl, image.mobileImageUrl ?? image.imageUrl),
          alt: image.altText?.trim() || 'Healthcare image',
        }));
        this.preloadHeroImages();
        this.startHeroCarousel();
      },
      error: () => {
        this.heroSlides = [];
      },
    });
  }

  ngOnDestroy(): void {
    this.stopHeroCarousel();
    this.stopTaglineRotation();
  }

  submit(): void {
    this.errorMessage = null;
    const u = this.userNameOrEmail.trim();
    if (!u || !this.password) {
      this.errorMessage = 'Enter your username or email and password.';
      return;
    }
    this.loading = true;
    this.authApi
      .login({ userNameOrEmail: u, password: this.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => this.handleLoginSuccess(res),
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage =
            err?.error?.message ?? 'Sign-in failed. Check your credentials and try again.';
        },
      });
  }

  confirmBranch(): void {
    if (!this.pendingLogin || this.selectedBranchId == null) {
      this.errorMessage = 'Select a branch to continue.';
      return;
    }
    this.loading = true;
    this.authApi
      .switchBranch({ branchId: this.selectedBranchId })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.branchPickerOpen = false;
          this.pendingLogin = null;
          this.session.setSession(res);
          this.navigateAfterLogin();
        },
        error: () => {
          this.errorMessage = 'Could not activate the selected branch.';
        },
      });
  }

  private navigateAfterLogin(): void {
    void this.router.navigateByUrl(this.session.defaultAppRoute());
  }

  private handleLoginSuccess(res: LoginResponse): void {
    const branches = res.branches ?? [];
    const needsPicker = branches.length > 1 && (res.activeBranchId == null || res.activeBranchId <= 0);
    if (needsPicker) {
      this.pendingLogin = res;
      this.branchOptions = branches.map((b: BranchSummary) => ({
        label: b.isMain ? `${b.name} (Main)` : b.name,
        value: b.id,
      }));
      this.selectedBranchId = branches.find((b) => b.isDefault)?.id ?? branches[0]?.id ?? null;
      this.session.setSession(res);
      this.branchPickerOpen = true;
      return;
    }
    this.session.setSession(res);
    this.navigateAfterLogin();
  }

  private preloadHeroImages(): void {
    for (const slide of this.heroSlides) {
      const desktop = new Image();
      desktop.src = slide.src;
      const mobile = new Image();
      mobile.src = slide.mobileSrc;
    }
  }

  private startHeroCarousel(): void {
    this.stopHeroCarousel();
    if (this.heroSlides.length <= 1) return;
    this.heroIntervalId = setInterval(() => {
      this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroSlides.length;
    }, 3000);
  }

  private stopHeroCarousel(): void {
    if (this.heroIntervalId !== undefined) {
      clearInterval(this.heroIntervalId);
      this.heroIntervalId = undefined;
    }
  }

  private startTaglineRotation(): void {
    this.stopTaglineRotation();
    this.taglineIntervalId = setInterval(() => {
      this.activeTaglineIndex = (this.activeTaglineIndex + 1) % this.heroTaglines.length;
    }, 4000);
  }

  private stopTaglineRotation(): void {
    if (this.taglineIntervalId !== undefined) {
      clearInterval(this.taglineIntervalId);
      this.taglineIntervalId = undefined;
    }
  }
}
