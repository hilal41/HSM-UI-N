import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './reset-password.page.html',
})
export class ResetPasswordPage {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  success = false;
  errorMessage: string | null = null;

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('token');
    if (q) this.token = q;
  }

  submit(): void {
    this.errorMessage = null;
    if (!this.token.trim()) {
      this.errorMessage = 'Reset token is missing. Open the link from your email.';
      return;
    }
    if (!this.newPassword || this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords must match and cannot be empty.';
      return;
    }
    this.loading = true;
    this.authApi
      .resetPassword({
        token: this.token.trim(),
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmPassword,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.success = true;
          setTimeout(() => void this.router.navigateByUrl('/login'), 2000);
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage = err?.error?.message ?? 'Reset failed. The token may be invalid or expired.';
        },
      });
  }
}
