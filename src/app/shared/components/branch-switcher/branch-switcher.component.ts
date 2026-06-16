import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuAccessService } from '../../../core/services/menu-access.service';

@Component({
  selector: 'app-branch-switcher',
  imports: [FormsModule, SelectModule],
  template: `
    @if (session.showBranchSwitcher()) {
      <p-select
        [options]="options()"
        optionLabel="label"
        optionValue="value"
        [ngModel]="selectedId()"
        (ngModelChange)="onBranchChange($event)"
        [disabled]="switching()"
        placeholder="Branch"
        styleClass="branch-switcher-select !min-w-[8rem] !max-w-[12rem]"
        panelStyleClass="text-sm"
        appendTo="body"
      />
    }
  `,
  styles: `
    :host ::ng-deep .branch-switcher-select .p-select-label {
      color: rgb(219 234 254);
      font-size: 0.72rem;
    }
    :host ::ng-deep .branch-switcher-select {
      background: rgb(30 58 138 / 0.35);
      border-color: rgb(255 255 255 / 0.2);
    }
  `,
})
export class BranchSwitcherComponent {
  readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly menuAccess = inject(MenuAccessService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly switching = signal(false);

  readonly options = computed(() =>
    this.session.branches().map((b) => ({
      label: b.isMain ? `${b.name}` : b.name,
      value: b.id,
    })),
  );

  readonly selectedId = computed(() => this.session.activeBranchId());

  onBranchChange(branchId: number | null): void {
    if (branchId == null || branchId === this.session.activeBranchId()) return;
    this.switching.set(true);
    this.authApi
      .switchBranch({ branchId })
      .pipe(finalize(() => this.switching.set(false)))
      .subscribe({
        next: (res) => {
          this.session.applyBranchSwitch(res);
          this.menuAccess.clear();
          this.menuAccess.loadMenus().subscribe({
            complete: () => {
              void this.router.navigateByUrl(this.router.url);
            },
          });
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Branch',
            detail: 'Could not switch branch. Try again.',
          });
        },
      });
  }
}
