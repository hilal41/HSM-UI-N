import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import type { BranchSummary, LoginResponse } from '../../../core/models/api-contracts';

const heroImageUrl = (path: string) =>
  `${path}${path.includes('?') ? '&' : '?'}auto=format&fit=crop&w=1600&q=80`;

@Component({
  selector: 'app-login-page',
  imports: [
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    SelectModule,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly heroSlides: readonly { src: string; alt: string }[] = [
    {
      src: heroImageUrl('https://plus.unsplash.com/premium_photo-1682130277144-423d6b582e56?ixlib=rb-4.1.0'),
      alt: 'Patient and nurse discussing care in a hospital waiting area',
    },
    {
      src: heroImageUrl('https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7'),
      alt: 'Surgical team during a procedure in an operating room',
    },
    {
      src: heroImageUrl('https://plus.unsplash.com/premium_photo-1682141167789-d6b26632bb13?ixlib=rb-4.1.0'),
      alt: 'Clinician reviewing medical documents at a desk',
    },
    {
      src: heroImageUrl('https://plus.unsplash.com/premium_photo-1682141257744-dea7d9e14fd3?ixlib=rb-4.1.0'),
      alt: 'Senior doctor working at a computer in a modern clinic',
    },
    {
      src: heroImageUrl('https://images.unsplash.com/photo-1504439468489-c8920d796a29'),
      alt: 'Medical staff in surgical attire in an operating room',
    },
  ];

  activeHeroIndex = 0;
  private heroIntervalId: ReturnType<typeof setInterval> | undefined;

  userNameOrEmail = '';
  password = '';
  loading = false;
  errorMessage: string | null = null;

  branchPickerOpen = false;
  pendingLogin: LoginResponse | null = null;
  branchOptions: { label: string; value: number }[] = [];
  selectedBranchId: number | null = null;

  ngOnInit(): void {
    for (const slide of this.heroSlides) {
      const img = new Image();
      img.src = slide.src;
    }
    this.heroIntervalId = setInterval(() => {
      this.activeHeroIndex = (this.activeHeroIndex + 1) % this.heroSlides.length;
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.heroIntervalId !== undefined) {
      clearInterval(this.heroIntervalId);
    }
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
          void this.router.navigateByUrl('/app/dashboard');
        },
        error: () => {
          this.errorMessage = 'Could not activate the selected branch.';
        },
      });
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
    void this.router.navigateByUrl('/app/dashboard');
  }
}
