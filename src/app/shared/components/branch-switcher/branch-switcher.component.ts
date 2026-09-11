import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { SessionBootstrapService } from '../../../core/services/session-bootstrap.service';

@Component({
  selector: 'app-branch-switcher',
  imports: [FormsModule, SelectModule],
  host: {
    '[class.branch-switcher--header]': 'appearance() === "header"',
    '[class.branch-switcher--panel]': 'appearance() === "panel"',
  },
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
        ariaLabel="Active branch"
        [styleClass]="selectStyleClass()"
        panelStyleClass="text-sm"
        appendTo="body"
      />
    }
  `,
  styles: `
    :host.branch-switcher--header ::ng-deep .branch-switcher-select .p-select-label {
      color: rgb(219 234 254);
      font-size: 0.72rem;
    }
    :host.branch-switcher--header ::ng-deep .branch-switcher-select {
      background: rgb(30 58 138 / 0.35);
      border-color: rgb(255 255 255 / 0.2);
    }
    :host.branch-switcher--panel {
      display: block;
      width: 100%;
    }
    :host.branch-switcher--panel ::ng-deep .branch-switcher-select {
      width: 100%;
    }
    :host.branch-switcher--panel ::ng-deep .branch-switcher-select .p-select-label {
      font-size: 0.8125rem;
    }
  `,
})
export class BranchSwitcherComponent {
  readonly appearance = input<'header' | 'panel'>('header');

  readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly menuAccess = inject(MenuAccessService);
  private readonly bootstrap = inject(SessionBootstrapService);
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

  readonly selectStyleClass = computed(() =>
    this.appearance() === 'panel'
      ? 'branch-switcher-select branch-switcher-select--panel w-full'
      : 'branch-switcher-select !min-w-[8rem] !max-w-[12rem]',
  );

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
          this.bootstrap.reload().subscribe({
            complete: () => {
              void this.router.navigateByUrl(this.router.url);
            },
            error: () => {
              this.messages.add({
                severity: 'warn',
                summary: 'Menus',
                detail: 'Branch switched, but menus could not be refreshed.',
              });
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
