import { DecimalPipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { catchError, debounceTime, finalize, fromEvent, of, Subject, switchMap, tap } from 'rxjs';
import { LabTestsApiService } from '../../../core/api/lab-tests-api.service';
import type { LabOrderLine, LabTest, SaveLabOrderLineRequest } from '../../../core/models/api-contracts';

@Component({
  selector: 'app-doctor-checkup-lab-panel',
  imports: [FormsModule, ButtonModule, DecimalPipe],
  templateUrl: './doctor-checkup-lab-panel.component.html',
  styleUrl: './doctor-checkup-lab-panel.component.scss',
})
export class DoctorCheckupLabPanelComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentRef = inject(DOCUMENT);
  private readonly testsApi = inject(LabTestsApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly labSearchAreaEl = viewChild<ElementRef<HTMLElement>>('labSearchArea');
  private readonly stagedLabels = new Map<number, string>();
  private readonly searchTrigger$ = new Subject<void>();

  readonly pageSizePresets = [10, 20, 50, 100] as const;

  searchInput = '';
  searchPage = 1;
  searchPageSize = 20;
  searchRows: LabTest[] = [];
  searchTotal = 0;
  searchLoading = false;

  pageSizeMenuOpen = false;
  customPageSizeDraft = 20;
  testListOpen = false;
  private clearingSearchAfterPick = false;

  stagedTestIds: number[] = [];

  constructor() {
    this.searchTrigger$
      .pipe(
        debounceTime(320),
        tap(() => {
          this.searchPage = 1;
          this.testListOpen = true;
        }),
        switchMap(() => this.runSearchRequest()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.searchRows = res.items;
        this.searchTotal = res.totalCount;
        this.testListOpen = true;
        this.cdr.markForCheck();
      });

    fromEvent(this.documentRef, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ev) => {
        const root = this.labSearchAreaEl()?.nativeElement;
        if (root?.contains(ev.target as Node)) return;
        this.pageSizeMenuOpen = false;
        this.testListOpen = false;
        this.cdr.markForCheck();
      });
  }

  resetForNewOrder(): void {
    this.searchInput = '';
    this.searchPage = 1;
    this.searchPageSize = 20;
    this.customPageSizeDraft = 20;
    this.searchRows = [];
    this.searchTotal = 0;
    this.pageSizeMenuOpen = false;
    this.testListOpen = false;
    this.stagedTestIds = [];
    this.stagedLabels.clear();
    this.cdr.markForCheck();
  }

  applyServerLines(rows: LabOrderLine[]): void {
    this.stagedTestIds = rows.map((r) => r.labTestId);
    this.stagedLabels.clear();
    for (const r of rows) {
      this.stagedLabels.set(r.labTestId, `${r.testName} (${r.testCode})`);
    }
    this.cdr.markForCheck();
  }

  get stagedCount(): number {
    return this.stagedTestIds.length;
  }

  getStagedTestLines(): SaveLabOrderLineRequest[] {
    return this.stagedTestIds.map((labTestId) => ({ labTestId }));
  }

  onSearchInput(): void {
    if (this.clearingSearchAfterPick) return;
    this.searchTrigger$.next();
  }

  toggleTestList(ev: MouseEvent): void {
    ev.stopPropagation();
    this.pageSizeMenuOpen = false;
    this.testListOpen = !this.testListOpen;
    if (this.testListOpen) {
      this.searchPage = 1;
      void this.runSearchRequest().subscribe((res) => {
        this.searchRows = res.items;
        this.searchTotal = res.totalCount;
        this.cdr.markForCheck();
      });
    }
    this.cdr.markForCheck();
  }

  togglePageSizeMenu(ev: MouseEvent): void {
    ev.stopPropagation();
    this.pageSizeMenuOpen = !this.pageSizeMenuOpen;
    this.customPageSizeDraft = this.searchPageSize;
    this.cdr.markForCheck();
  }

  selectPageSize(n: number): void {
    this.pageSizeMenuOpen = false;
    this.searchPageSize = n;
    this.customPageSizeDraft = n;
    this.searchPage = 1;
    this.testListOpen = true;
    void this.runSearchRequest().subscribe((res) => {
      this.searchRows = res.items;
      this.searchTotal = res.totalCount;
      this.cdr.markForCheck();
    });
  }

  applyCustomPageSize(): void {
    const raw = this.customPageSizeDraft;
    const n = typeof raw === 'number' && !Number.isNaN(raw) ? Math.round(raw) : Number.NaN;
    const clamped = Number.isNaN(n) ? 20 : Math.min(1000, Math.max(1, n));
    this.searchPageSize = clamped;
    this.customPageSizeDraft = clamped;
    this.pageSizeMenuOpen = false;
    this.searchPage = 1;
    this.testListOpen = true;
    void this.runSearchRequest().subscribe((res) => {
      this.searchRows = res.items;
      this.searchTotal = res.totalCount;
      this.cdr.markForCheck();
    });
  }

  goSearchPrev(): void {
    if (this.searchPage <= 1 || this.searchLoading) return;
    this.searchPage -= 1;
    void this.runSearchRequest().subscribe((res) => {
      this.searchRows = res.items;
      this.searchTotal = res.totalCount;
      this.cdr.markForCheck();
    });
  }

  goSearchNext(): void {
    if (this.searchLoading || !this.hasNextSearchPage) return;
    this.searchPage += 1;
    void this.runSearchRequest().subscribe((res) => {
      this.searchRows = res.items;
      this.searchTotal = res.totalCount;
      this.cdr.markForCheck();
    });
  }

  get hasNextSearchPage(): boolean {
    const pages = Math.ceil(this.searchTotal / this.searchPageSize);
    return this.searchPage < pages;
  }

  get searchTotalPages(): number {
    return Math.max(1, Math.ceil(this.searchTotal / this.searchPageSize) || 1);
  }

  addTest(t: LabTest): void {
    if (this.stagedTestIds.includes(t.id)) return;
    this.stagedTestIds = [...this.stagedTestIds, t.id];
    this.stagedLabels.set(t.id, `${t.name} (${t.code})`);
    this.clearSearchAfterPick();
    this.cdr.markForCheck();
  }

  private clearSearchAfterPick(): void {
    this.testListOpen = false;
    this.pageSizeMenuOpen = false;
    this.searchRows = [];
    this.searchTotal = 0;
    this.searchPage = 1;
    this.clearingSearchAfterPick = true;
    this.searchInput = '';
    queueMicrotask(() => {
      this.clearingSearchAfterPick = false;
    });
  }

  removeTest(id: number): void {
    this.stagedTestIds = this.stagedTestIds.filter((x) => x !== id);
    this.stagedLabels.delete(id);
    this.cdr.markForCheck();
  }

  labelFor(id: number): string {
    return this.stagedLabels.get(id) ?? `#${id}`;
  }

  canAdd(t: LabTest): boolean {
    return !this.stagedTestIds.includes(t.id);
  }

  isStaged(t: LabTest): boolean {
    return this.stagedTestIds.includes(t.id);
  }

  onResultRowClick(t: LabTest): void {
    if (!this.canAdd(t)) return;
    this.addTest(t);
  }

  private runSearchRequest() {
    this.searchLoading = true;
    this.cdr.markForCheck();
    return this.testsApi
      .getPaged({
        search: this.searchInput.trim() || undefined,
        page: this.searchPage,
        pageSize: this.searchPageSize,
        activeOnly: true,
      })
      .pipe(
        catchError(() => {
          this.messages.add({
            severity: 'error',
            summary: 'Lab tests',
            detail: 'Unable to search lab tests.',
          });
          return of({
            items: [] as LabTest[],
            page: this.searchPage,
            pageSize: this.searchPageSize,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }),
        finalize(() => {
          this.searchLoading = false;
          this.cdr.markForCheck();
        }),
      );
  }
}
