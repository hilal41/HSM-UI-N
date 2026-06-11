import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';

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
  ],
  templateUrl: './login.page.html',
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  /** Rotates every 3s; URLs from Unsplash (user-provided photos). */
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
        next: (res) => {
          this.session.setSession(res);
          void this.router.navigateByUrl('/app/dashboard');
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage =
            err?.error?.message ?? 'Sign-in failed. Check your credentials and try again.';
        },
      });
  }
}
