import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';
import { PlatformApiService } from '../../../core/api/platform-api.service';
import type { UpdatePlatformUserRequest, User } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage, normalizeLazyPage, showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-platform-users-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    TagModule,
    MessageModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ToggleSwitchModule,
  ],
  templateUrl: './platform-users.page.html',
})
export class PlatformUsersPage {
  private readonly api = inject(PlatformApiService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: User[] = [];
  totalCount = 0;
  loading = false;
  errorMessage: string | null = null;
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  dialogOpen = false;
  saving = false;
  editingId: number | null = null;

  formUserName = '';
  formEmail = '';
  formPassword = '';
  formFirstName = '';
  formLastName = '';
  formPhone = '';
  formIsActive = true;

  onLazyLoad(event: TableLazyLoadEvent): void {
    const { page, pageSize } = normalizeLazyPage(event, this.pageSize);
    this.tablePageSize = pageSize;
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getUsers(page, pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load platform users.';
          this.cdr.markForCheck();
        },
      });
  }

  reloadTable(): void {
    this.loading = true;
    this.api
      .getUsers(1, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck(),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formUserName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formFirstName = '';
    this.formLastName = '';
    this.formPhone = '';
    this.formIsActive = true;
    this.dialogOpen = true;
  }

  openEdit(row: User): void {
    this.editingId = row.id;
    this.formUserName = row.userName;
    this.formEmail = row.email;
    this.formPassword = '';
    this.formFirstName = row.firstName ?? '';
    this.formLastName = row.lastName ?? '';
    this.formPhone = row.phone ?? '';
    this.formIsActive = row.isActive;
    this.dialogOpen = true;
  }

  closeDialog(): void {
    this.dialogOpen = false;
  }

  saveUser(): void {
    if (!this.formEmail.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Email is required.' });
      return;
    }
    if (this.editingId == null) {
      if (!this.formUserName.trim() || !this.formPassword.trim()) {
        this.messages.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Username and password are required for new users.',
        });
        return;
      }
      this.saving = true;
      this.api
        .createUser({
          userName: this.formUserName.trim(),
          email: this.formEmail.trim(),
          password: this.formPassword.trim(),
          firstName: this.formFirstName.trim() || null,
          lastName: this.formLastName.trim() || null,
          phone: this.formPhone.trim() || null,
          isActive: this.formIsActive,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Created', detail: 'Platform user created.' });
            this.closeDialog();
            this.reloadTable();
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorMessage(err, 'Create failed.'),
            });
          },
        });
      return;
    }

    const body: UpdatePlatformUserRequest = {
      email: this.formEmail.trim(),
      firstName: this.formFirstName.trim() || null,
      lastName: this.formLastName.trim() || null,
      phone: this.formPhone.trim() || null,
      isActive: this.formIsActive,
    };
    if (this.formPassword.trim()) {
      body.password = this.formPassword.trim();
    }
    this.saving = true;
    this.api
      .updateUser(this.editingId, body)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Platform user updated.' });
          this.closeDialog();
          this.reloadTable();
        },
        error: (err: unknown) => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: apiErrorMessage(err, 'Update failed.'),
          });
        },
      });
  }

  confirmDeactivate(row: User): void {
    this.confirm.confirm({
      message: `Deactivate platform user "${row.userName}"? They will no longer be able to sign in.`,
      header: 'Deactivate user',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Deactivate',
      accept: () => {
        this.api.deactivateUser(row.id).subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: 'Deactivated',
              detail: 'Platform user deactivated.',
            });
            this.reloadTable();
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorMessage(err, 'Deactivate failed.'),
            });
          },
        });
      },
    });
  }
}
