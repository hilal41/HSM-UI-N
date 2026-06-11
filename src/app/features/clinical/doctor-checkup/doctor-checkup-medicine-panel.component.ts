import { DOCUMENT } from '@angular/common';
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
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  fromEvent,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { MedicinesApiService } from '../../../core/api/medicines-api.service';
import { MedicineUsagesApiService } from '../../../core/api/medicine-usages-api.service';
import type {
  Medicine,
  PatientMedicineLine,
  SaveCheckupMedicineLine,
} from '../../../core/models/api-contracts';

interface MedicineUsageOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-doctor-checkup-medicine-panel',
  imports: [FormsModule, ButtonModule, SelectModule],
  templateUrl: './doctor-checkup-medicine-panel.component.html',
  styleUrl: './doctor-checkup-medicine-panel.component.scss',
})
export class DoctorCheckupMedicinePanelComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentRef = inject(DOCUMENT);
  private readonly medicinesApi = inject(MedicinesApiService);
  private readonly medicineUsagesApi = inject(MedicineUsagesApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly medicineSearchAreaEl = viewChild<ElementRef<HTMLElement>>('medicineSearchArea');

  private readonly stagedLabels = new Map<number, string>();
  private readonly stagedUsageIds = new Map<number, number | null>();
  private readonly searchTrigger$ = new Subject<void>();

  readonly pageSizePresets = [10, 20, 50, 1000] as const;

  searchInput = '';
  searchPage = 1;
  searchPageSize = 20;
  searchRows: Medicine[] = [];
  searchTotal = 0;
  searchLoading = false;
  usageOptions: MedicineUsageOption[] = [];
  usageLoading = false;

  pageSizeMenuOpen = false;
  customPageSizeDraft = 20;
  medicineListOpen = false;
  private clearingSearchAfterPick = false;

  stagedMedicineIds: number[] = [];

  constructor() {
    this.loadMedicineUsages();

    this.searchTrigger$
      .pipe(
        debounceTime(320),
        tap(() => {
          this.searchPage = 1;
          this.medicineListOpen = true;
        }),
        switchMap(() => this.runSearchRequest()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.searchRows = res.items;
        this.searchTotal = res.totalCount;
        this.medicineListOpen = true;
        this.cdr.markForCheck();
      });

    fromEvent(this.documentRef, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ev) => {
        const root = this.medicineSearchAreaEl()?.nativeElement;
        if (root?.contains(ev.target as Node)) return;
        this.pageSizeMenuOpen = false;
        this.medicineListOpen = false;
        this.cdr.markForCheck();
      });
  }

  resetForNewCheckup(): void {
    this.searchInput = '';
    this.searchPage = 1;
    this.searchPageSize = 20;
    this.customPageSizeDraft = 20;
    this.searchRows = [];
    this.searchTotal = 0;
    this.pageSizeMenuOpen = false;
    this.medicineListOpen = false;
    this.stagedMedicineIds = [];
    this.stagedLabels.clear();
    this.stagedUsageIds.clear();
    this.cdr.markForCheck();
  }

  applyServerLines(rows: PatientMedicineLine[]): void {
    this.stagedMedicineIds = rows.map((r) => r.medicineId);
    this.stagedLabels.clear();
    this.stagedUsageIds.clear();
    for (const r of rows) {
      this.stagedLabels.set(r.medicineId, `${r.medicineName} (${r.code})`);
      this.stagedUsageIds.set(r.medicineId, r.medicineUsageId ?? null);
    }
    this.cdr.markForCheck();
  }

  getStagedMedicineLines(): SaveCheckupMedicineLine[] {
    return this.stagedMedicineIds.map((medicineId) => ({
      medicineId,
      medicineUsageId: this.stagedUsageIds.get(medicineId) ?? null,
    }));
  }

  onSearchInput(): void {
    if (this.clearingSearchAfterPick) return;
    this.searchTrigger$.next();
  }

  toggleMedicineList(ev: MouseEvent): void {
    ev.stopPropagation();
    this.pageSizeMenuOpen = false;
    this.medicineListOpen = !this.medicineListOpen;
    if (this.medicineListOpen) {
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
    this.medicineListOpen = true;
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
    this.medicineListOpen = true;
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

  addMedicine(m: Medicine): void {
    if (this.stagedMedicineIds.includes(m.id)) return;
    this.stagedMedicineIds = [...this.stagedMedicineIds, m.id];
    this.stagedLabels.set(m.id, this.lineLabelFromMedicine(m));
    this.stagedUsageIds.set(m.id, null);
    this.clearSearchAfterPick();
    this.cdr.markForCheck();
  }

  private clearSearchAfterPick(): void {
    this.medicineListOpen = false;
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

  removeMedicine(id: number): void {
    this.stagedMedicineIds = this.stagedMedicineIds.filter((x) => x !== id);
    this.stagedLabels.delete(id);
    this.stagedUsageIds.delete(id);
    this.cdr.markForCheck();
  }

  labelForStaged(id: number): string {
    return this.stagedLabels.get(id) ?? `#${id}`;
  }

  usageForStaged(id: number): number | null {
    return this.stagedUsageIds.get(id) ?? null;
  }

  setUsageForStaged(id: number, usageId: number | null): void {
    this.stagedUsageIds.set(id, usageId ?? null);
    this.cdr.markForCheck();
  }

  canAdd(m: Medicine): boolean {
    return !this.stagedMedicineIds.includes(m.id);
  }

  isStaged(m: Medicine): boolean {
    return this.stagedMedicineIds.includes(m.id);
  }

  onResultRowClick(m: Medicine): void {
    if (!this.canAdd(m)) return;
    this.addMedicine(m);
  }

  private lineLabelFromMedicine(m: Medicine): string {
    return `${m.medicineName} (${m.code})`;
  }

  private loadMedicineUsages(): void {
    this.usageLoading = true;
    this.medicineUsagesApi
      .getPaged({ page: 1, pageSize: 1000 })
      .pipe(
        catchError(() =>
          of({
            items: [],
            page: 1,
            pageSize: 1000,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }),
        ),
        finalize(() => {
          this.usageLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((res) => {
        this.usageOptions = res.items
          .filter((u) => u.isActive)
          .map((u) => ({
            label: u.description ? `${u.shortCode} - ${u.description}` : u.shortCode,
            value: u.id,
          }));
        this.cdr.markForCheck();
      });
  }

  private runSearchRequest() {
    this.searchLoading = true;
    this.cdr.markForCheck();
    return this.medicinesApi
      .searchPaged({
        search: this.searchInput.trim() || undefined,
        page: this.searchPage,
        pageSize: this.searchPageSize,
        activeOnly: true,
      })
      .pipe(
        finalize(() => {
          this.searchLoading = false;
          this.cdr.markForCheck();
        }),
      );
  }
}
