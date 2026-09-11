import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  Renderer2,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, NgStyle } from '@angular/common';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { filter, finalize, take } from 'rxjs';
import { AuthApiService } from '../../../core/api/auth-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { userDisplayName } from '../../utils/user-display.utils';
import { BranchSwitcherComponent } from '../branch-switcher/branch-switcher.component';
import { SessionBootstrapService } from '../../../core/services/session-bootstrap.service';

@Component({
  selector: 'app-account-menu',
  imports: [NgStyle, BranchSwitcherComponent, RouterLink],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss',
})
export class AccountMenuComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly authApi = inject(AuthApiService);
  private readonly meApi = inject(MeApiService);
  private readonly menuAccess = inject(MenuAccessService);
  private readonly bootstrap = inject(SessionBootstrapService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  @ViewChild('accountDropdown') private dropdownRef?: ElementRef<HTMLElement>;
  @ViewChild('dropdownAnchor') private dropdownAnchorRef?: ElementRef<HTMLElement>;

  private dropdownPortaled = false;

  readonly menuOpen = signal(false);
  readonly panelStyle = signal<Record<string, string>>({});
  readonly profilePicture = signal<string | null>(null);
  readonly user = this.session.user;
  readonly isPlatformUser = this.session.isPlatformUser;
  readonly showBranchSwitcher = this.session.showBranchSwitcher;
  readonly accountLinks = this.menuAccess.accountMenuItems;

  readonly displayName = computed(() => userDisplayName(this.session.user()));
  readonly roleLabel = computed(() => {
    if (this.session.isPlatformUser()) return 'Developer';
    return this.session.user()?.roleName ?? '—';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeMenu());

    this.destroyRef.onDestroy(() => {
      this.restoreDropdownFromBody();
    });
  }

  ngOnInit(): void {
    this.loadProfilePicture();
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }
    this.loadProfilePicture();
    const trigger = event.currentTarget;
    if (trigger instanceof HTMLElement) {
      this.positionPanel(trigger);
    }
    this.menuOpen.set(true);
    setTimeout(() => this.attachDropdownToBody(), 0);
  }

  closeMenu(): void {
    this.restoreDropdownFromBody();
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this.host.nativeElement.contains(target)) return;
    const dropdown = this.dropdownRef?.nativeElement;
    if (dropdown?.contains(target)) return;
    if (target instanceof Element && target.closest('.p-select-overlay, .p-select-list, .p-overlay')) {
      return;
    }
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenu();
  }

  signOut(): void {
    this.closeMenu();
    const refresh = this.session.refreshToken();
    if (!refresh) {
      this.bootstrap.clear();
      this.session.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }
    this.authApi
      .logout({ refreshToken: refresh })
      .pipe(
        finalize(() => {
          this.bootstrap.clear();
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

  private positionPanel(trigger: HTMLElement): void {
    const rect = trigger.getBoundingClientRect();
    this.panelStyle.set({
      position: 'fixed',
      top: `${rect.bottom + 6}px`,
      right: `${Math.max(8, window.innerWidth - rect.right)}px`,
      zIndex: '1100',
    });
  }

  private attachDropdownToBody(): void {
    if (this.dropdownPortaled || !this.menuOpen()) return;
    const dropdown = this.dropdownRef?.nativeElement;
    const body = this.document.body;
    if (!dropdown || !body) return;
    this.renderer.appendChild(body, dropdown);
    this.renderer.addClass(dropdown, 'account-menu__dropdown--body');
    this.dropdownPortaled = true;
  }

  private restoreDropdownFromBody(): void {
    if (!this.dropdownPortaled) return;
    const dropdown = this.dropdownRef?.nativeElement;
    const anchor = this.dropdownAnchorRef?.nativeElement;
    if (!dropdown) {
      this.dropdownPortaled = false;
      return;
    }
    this.renderer.removeClass(dropdown, 'account-menu__dropdown--body');
    if (anchor) {
      this.renderer.appendChild(anchor, dropdown);
    }
    this.dropdownPortaled = false;
  }

  private loadProfilePicture(): void {
    if (!this.session.user()) return;
    this.meApi.getMyProfile().pipe(take(1)).subscribe({
      next: (user) => {
        this.profilePicture.set(user.profilePictureBase64 ?? user.profilePictureUrl ?? null);
      },
      error: () => {
        this.profilePicture.set(null);
      },
    });
  }
}
