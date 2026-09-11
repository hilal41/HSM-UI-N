import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { SessionBootstrapService } from '../../../core/services/session-bootstrap.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MenuPermissionService } from '../../../core/services/menu-permission.service';
import { MenuAccessService } from '../../../core/services/menu-access.service';
import { AccountMenuComponent } from '../../components/account-menu/account-menu.component';

@Component({
  selector: 'app-main-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    MenubarModule,
    ToastModule,
    ConfirmDialogModule,
    AccountMenuComponent,
  ],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss',
  host: {
    '[class.hms-platform-shell]': 'isPlatformUser()',
  },
})
export class MainShellComponent implements OnInit {
  private readonly session = inject(AuthSessionService);
  private readonly menuAccess = inject(MenuAccessService);
  private readonly menuPermissions = inject(MenuPermissionService);
  private readonly bootstrap = inject(SessionBootstrapService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly navHost = viewChild<ElementRef<HTMLElement>>('navHost');
  private navViewport: HTMLElement | null = null;
  private navTrack: HTMLElement | null = null;
  private navOffsetPx = 0;
  private resizeObserver: ResizeObserver | null = null;

  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);

  readonly menuModel = this.menuAccess.navMenuItems;
  readonly homeRoute = this.session.defaultAppRoute;
  readonly isPlatformUser = this.session.isPlatformUser;
  readonly brandTitle = computed(() => (this.isPlatformUser() ? 'Platform' : 'HMS'));
  readonly brandSubtitle = computed(() =>
    this.isPlatformUser() ? 'Developer console' : 'Hospital management',
  );

  constructor() {
    afterNextRender(() => {
      this.bindNavScroller();
    });

    toObservable(this.menuModel)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        queueMicrotask(() => this.bindNavScroller());
      });

    this.destroyRef.onDestroy(() => {
      this.teardownNavScroller();
    });
  }

  ngOnInit(): void {
    // Menus and permissions both arrive with the profile, and the route guard has usually
    // requested it already — this shares that request rather than issuing two more.
    this.bootstrap.ensureLoaded().subscribe({
      error: () => {
        this.menuPermissions.load([]);
        this.messages.add({
          severity: 'error',
          summary: 'Menus',
          detail: 'Could not load your application menu.',
        });
      },
    });
  }

  scrollNav(direction: -1 | 1): void {
    const viewport = this.navViewport;
    const track = this.navTrack;
    if (!viewport || !track) return;

    const step = Math.max(180, Math.round(viewport.clientWidth * 0.6));
    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    this.navOffsetPx = Math.min(maxOffset, Math.max(0, this.navOffsetPx + direction * step));
    this.applyNavTransform();
    this.updateNavScrollState();
  }

  private bindNavScroller(): void {
    const viewport = this.navHost()?.nativeElement;
    if (!viewport) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }

    const track = viewport.querySelector('.p-menubar-root-list') as HTMLElement | null;
    if (!track) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }

    if (this.navViewport !== viewport || this.navTrack !== track) {
      this.teardownNavScroller();
      this.navViewport = viewport;
      this.navTrack = track;
      this.navOffsetPx = 0;
      this.applyNavTransform();
      this.resizeObserver = new ResizeObserver(() => this.updateNavScrollState());
      this.resizeObserver.observe(viewport);
      this.resizeObserver.observe(track);
    }

    this.updateNavScrollState();
  }

  private applyNavTransform(): void {
    if (!this.navTrack) return;
    this.navTrack.style.transform = `translateX(-${this.navOffsetPx}px)`;
  }

  private updateNavScrollState(): void {
    const viewport = this.navViewport;
    const track = this.navTrack;
    if (!viewport || !track) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }

    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
    if (this.navOffsetPx > maxOffset) {
      this.navOffsetPx = maxOffset;
      this.applyNavTransform();
    }

    const overflow = maxOffset > 2;
    this.canScrollLeft.set(overflow && this.navOffsetPx > 2);
    this.canScrollRight.set(overflow && this.navOffsetPx < maxOffset - 2);
  }

  private teardownNavScroller(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.navTrack) {
      this.navTrack.style.transform = '';
    }
    this.navViewport = null;
    this.navTrack = null;
    this.navOffsetPx = 0;
  }
}
