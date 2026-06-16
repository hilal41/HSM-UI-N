import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { BranchSwitcherComponent } from '../../components/branch-switcher/branch-switcher.component';

@Component({
  selector: 'app-main-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    MenubarModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    BranchSwitcherComponent,
  ],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss',
})
export class MainShellComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly menuAccess = inject(MenuAccessService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly menuModel = this.menuAccess.menuItems;
  readonly user = this.session.user;

  ngOnInit(): void {
    this.menuAccess.loadMenus().subscribe({
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Menus',
          detail: 'Could not load your application menu.',
        });
      },
    });
  }

  signOut(): void {
    const refresh = this.session.refreshToken();
    if (!refresh) {
      this.menuAccess.clear();
      this.session.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }
    this.authApi
      .logout({ refreshToken: refresh })
      .pipe(
        finalize(() => {
          this.menuAccess.clear();
          this.session.clearSession();
          void this.router.navigateByUrl('/login');
        }),
      )
      .subscribe({
        error: () => {
          this.messages.add({
            severity: 'warn',
            summary: 'Signed out',
            detail: 'Could not reach the server; your session was cleared locally.',
          });
        },
      });
  }
}
