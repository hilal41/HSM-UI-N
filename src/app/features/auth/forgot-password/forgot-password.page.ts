import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {
  private readonly authApi = inject(AuthApiService);

  email = '';
  loading = false;
  infoMessage: string | null = null;
  debugToken: string | null = null;
  errorMessage: string | null = null;

  submit(): void {
    this.infoMessage = null;
    this.debugToken = null;
    this.errorMessage = null;
    const e = this.email.trim();
    if (!e) {
      this.errorMessage = 'Enter your email address.';
      return;
    }
    this.loading = true;
    this.authApi
      .forgotPassword({ email: e })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.infoMessage = res.message;
          this.debugToken = res.debugToken ?? null;
        },
        error: () => {
          this.errorMessage = 'Request could not be completed. Try again later.';
        },
      });
  }
}
