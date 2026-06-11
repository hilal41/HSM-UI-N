import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-change-password-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './change-password.page.html',
})
export class ChangePasswordPage {
  private readonly authApi = inject(AuthApiService);
  private readonly messages = inject(MessageService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage: string | null = null;

  submit(): void {
    this.errorMessage = null;
    if (!this.currentPassword || !this.newPassword) {
      this.errorMessage = 'All fields are required.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirmation must match.';
      return;
    }
    this.loading = true;
    this.authApi
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmNewPassword: this.confirmPassword,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.messages.add({
            severity: 'success',
            summary: 'Password updated',
            detail: 'Your password was changed successfully.',
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage = err?.error?.message ?? 'Could not update password.';
        },
      });
  }
}
