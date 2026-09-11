import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MedicinesApiService } from '../../../core/api/medicines-api.service';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { Medicine, PhrmyRxQueueItem, PhrmySale, PhrmyStockRow } from '../../../core/models/api-contracts';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

interface DraftLine {
  medicineId: number;
  medicineName: string;
  qty: number;
  unitPrice: number;
  patientMedicineId?: number | null;
}

interface CatalogItem {
  medicineId: number;
  medicineName: string;
  medicineCode: string;
  strength?: string | null;
  form?: string | null;
  unit?: string | null;
  qtyOnHand: number;
  isLowStock: boolean;
  salePrice: number;
  soldQty: number;
  initials: string;
}

@Component({
  selector: 'app-pharmacy-dispense-page',
  imports: [DecimalPipe, FormsModule, SurfacePanelComponent, ButtonModule, InputTextModule, InputNumberModule],
  templateUrl: './dispense.page.html',
  styleUrl: './dispense.page.scss',
})
export class PharmacyDispensePage implements OnInit, OnDestroy {
  private readonly api = inject(PharmacyApiService);
  private readonly medicinesApi = inject(MedicinesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly SearchHints = [
    'Search medicine here…',
    'Type medicine name or code…',
    'Find by strength…',
  ];

  saleType: 'Rx' | 'Otc' = 'Otc';
  checkupId: number | null = null;
  visitId: number | null = null;
  patientId: number | null = null;
  patientLabel = '';
  catalogLoading = false;
  readonly search = signal('');
  readonly searchPlaceholder = signal('');
  readonly searchFocused = signal(false);
  private readonly catalog = signal<CatalogItem[]>([]);
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private hintPaused = false;
  lines: DraftLine[] = [];
  discount = 0;
  tax = 0;
  notes = '';
  saving = false;
  lastSale: PhrmySale | null = null;

  /** Always up to 5 favorites for a full strip. */
  readonly topSellers = computed(() => this.rankCatalog(this.filteredCatalog()).slice(0, 5));

  readonly favGhosts = computed(() =>
    Array.from({ length: Math.max(0, 5 - this.topSellers().length) }, (_, i) => i),
  );

  /** Remaining products — compact default (3) so the till fits without scrolling. */
  readonly productList = computed(() => {
    const ranked = this.rankCatalog(this.filteredCatalog());
    const topIds = new Set(ranked.slice(0, 5).map((t) => t.medicineId));
    return ranked.filter((i) => !topIds.has(i.medicineId)).slice(0, 3);
  });

  readonly catalogCount = computed(() => this.filteredCatalog().length);

  private filteredCatalog(): CatalogItem[] {
    const q = this.search().trim().toLowerCase();
    const all = this.catalog();
    if (!q) return all;
    return all.filter(
      (i) =>
        i.medicineName.toLowerCase().includes(q) ||
        i.medicineCode.toLowerCase().includes(q) ||
        (i.strength ?? '').toLowerCase().includes(q),
    );
  }

  private rankCatalog(items: CatalogItem[]): CatalogItem[] {
    return [...items].sort((a, b) => {
      if (b.soldQty !== a.soldQty) return b.soldQty - a.soldQty;
      if ((b.qtyOnHand > 0 ? 1 : 0) !== (a.qtyOnHand > 0 ? 1 : 0)) {
        return (b.qtyOnHand > 0 ? 1 : 0) - (a.qtyOnHand > 0 ? 1 : 0);
      }
      if (b.qtyOnHand !== a.qtyOnHand) return b.qtyOnHand - a.qtyOnHand;
      return a.medicineName.localeCompare(b.medicineName);
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const checkupId = Number(q.get('checkupId'));
    const visitId = Number(q.get('visitId'));
    const patientId = Number(q.get('patientId'));
    if (checkupId > 0) {
      this.saleType = 'Rx';
      this.checkupId = checkupId;
      this.visitId = visitId > 0 ? visitId : null;
      this.patientId = patientId > 0 ? patientId : null;
      this.loadRx(checkupId);
    }
    this.loadCatalog();
    this.startSearchHintAnimation();
  }

  ngOnDestroy(): void {
    this.clearHintTimer();
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.syncHintPause();
  }

  onSearchFocus(): void {
    this.searchFocused.set(true);
    this.syncHintPause();
  }

  onSearchBlur(): void {
    this.searchFocused.set(false);
    this.syncHintPause();
  }

  private syncHintPause(): void {
    const shouldPause = this.searchFocused() || this.search().trim().length > 0;
    if (shouldPause === this.hintPaused) return;
    this.hintPaused = shouldPause;
    if (shouldPause) {
      this.clearHintTimer();
      this.searchPlaceholder.set('Search medicine…');
    } else {
      this.startSearchHintAnimation();
    }
  }

  private startSearchHintAnimation(): void {
    this.clearHintTimer();
    this.hintPaused = false;
    this.searchPlaceholder.set('');
    // Wait 2 seconds, then type the first hint.
    this.hintTimer = setTimeout(() => this.runHintCycle(0), 2000);
  }

  private runHintCycle(index: number): void {
    if (this.hintPaused) return;
    const phrases = PharmacyDispensePage.SearchHints;
    const text = phrases[index % phrases.length];
    this.typeHint(text, 0, () => {
      this.hintTimer = setTimeout(() => {
        this.deleteHint(text.length, () => {
          this.hintTimer = setTimeout(() => this.runHintCycle(index + 1), 400);
        });
      }, 1800);
    });
  }

  private typeHint(text: string, i: number, done: () => void): void {
    if (this.hintPaused) return;
    this.searchPlaceholder.set(text.slice(0, i));
    if (i >= text.length) {
      done();
      return;
    }
    this.hintTimer = setTimeout(() => this.typeHint(text, i + 1, done), 42);
  }

  private deleteHint(len: number, done: () => void): void {
    if (this.hintPaused) return;
    if (len <= 0) {
      this.searchPlaceholder.set('');
      done();
      return;
    }
    this.searchPlaceholder.set(this.searchPlaceholder().slice(0, -1));
    this.hintTimer = setTimeout(() => this.deleteHint(len - 1, done), 28);
  }

  private clearHintTimer(): void {
    if (this.hintTimer != null) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  initialsFor(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  loadCatalog(): void {
    this.catalogLoading = true;
    forkJoin({
      stock: this.api.getStock({ page: 1, pageSize: 100 }).pipe(
        catchError(() => of({ items: [] as PhrmyStockRow[], totalCount: 0, page: 1, pageSize: 100 })),
      ),
      sales: this.api.getSales({ page: 1, pageSize: 100 }).pipe(
        catchError(() => of({ items: [] as PhrmySale[], totalCount: 0, page: 1, pageSize: 100 })),
      ),
      medicines: this.medicinesApi.getPaged({ page: 1, pageSize: 300, activeOnly: true }),
    })
      .pipe(finalize(() => (this.catalogLoading = false)))
      .subscribe({
        next: ({ stock, sales, medicines }) => {
          const soldById = new Map<number, number>();
          for (const sale of sales.items) {
            for (const line of sale.lines ?? []) {
              soldById.set(line.medicineId, (soldById.get(line.medicineId) ?? 0) + line.qty);
            }
          }

          const stockById = new Map<number, PhrmyStockRow>();
          for (const s of stock.items as PhrmyStockRow[]) {
            stockById.set(s.medicineId, s);
          }

          const meds = medicines.items as Medicine[];
          // Prefer in-stock medicines, then fill from master list for search/favorites.
          const inStock = meds.filter((m) => (stockById.get(m.id)?.qtyOnHand ?? 0) > 0);
          const outOfStock = meds.filter((m) => (stockById.get(m.id)?.qtyOnHand ?? 0) <= 0);
          const picked = [...inStock, ...outOfStock].slice(0, 40);

          const rows: CatalogItem[] = picked.map((m) => {
            const s = stockById.get(m.id);
            return {
              medicineId: m.id,
              medicineName: m.medicineName,
              medicineCode: m.code,
              strength: m.strength,
              form: m.form,
              unit: m.saleUnit ?? m.unit ?? s?.unit,
              qtyOnHand: s?.qtyOnHand ?? 0,
              isLowStock: s?.isLowStock ?? false,
              salePrice: m.salePrice ?? 0,
              soldQty: soldById.get(m.id) ?? 0,
              initials: this.initialsFor(m.medicineName),
            };
          });

          this.catalog.set(rows);
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'warn',
            summary: 'Dispense',
            detail: 'Could not load product catalog.',
          });
        },
      });
  }

  loadRx(checkupId: number): void {
    this.api.getRxQueue({ page: 1, pageSize: 50 }).subscribe({
      next: (res) => {
        const item = res.items.find((x) => x.checkupId === checkupId);
        if (!item) return;
        this.applyRx(item);
      },
    });
  }

  applyRx(item: PhrmyRxQueueItem): void {
    this.patientLabel = `${item.patientName}${item.mrn ? ' · ' + item.mrn : ''}`;
    this.checkupId = item.checkupId;
    this.visitId = item.patientVisitId;
    this.patientId = item.patientId;
    this.saleType = 'Rx';
    const priceById = new Map(this.catalog().map((c) => [c.medicineId, c.salePrice]));
    this.lines = item.lines
      .filter((l) => l.remainingQty > 0 || (l.quantity == null && l.dispenseStatus !== 'Dispensed'))
      .map((l) => ({
        medicineId: l.medicineId,
        medicineName: l.medicineName,
        qty: l.remainingQty > 0 ? l.remainingQty : 1,
        unitPrice: priceById.get(l.medicineId) ?? 0,
        patientMedicineId: l.patientMedicineId,
      }));
    this.cdr.markForCheck();
  }

  addProduct(item: CatalogItem, qty = 1): void {
    if (qty <= 0 || item.qtyOnHand <= 0) {
      if (item.qtyOnHand <= 0) {
        this.messages.add({
          severity: 'warn',
          summary: 'Out of stock',
          detail: `${item.medicineName} has no quantity on hand.`,
        });
      }
      return;
    }
    const existing = this.lines.find((l) => l.medicineId === item.medicineId && !l.patientMedicineId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.lines.push({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        qty,
        unitPrice: item.salePrice,
      });
    }
    this.saleType = this.checkupId ? 'Rx' : 'Otc';
    this.cdr.markForCheck();
  }

  bumpQty(index: number, delta: number): void {
    const line = this.lines[index];
    if (!line) return;
    line.qty = Math.max(0.01, +(line.qty + delta).toFixed(2));
  }

  removeLine(i: number): void {
    this.lines.splice(i, 1);
  }

  clearCart(): void {
    this.lines = [];
    this.discount = 0;
    this.tax = 0;
    this.notes = '';
  }

  get lineCount(): number {
    return this.lines.length;
  }

  get itemsQty(): number {
    return this.lines.reduce((s, l) => s + l.qty, 0);
  }

  get subTotalEstimate(): number {
    return this.lines.reduce((s, l) => s + l.qty * (l.unitPrice || 0), 0);
  }

  get totalEstimate(): number {
    return Math.max(0, this.subTotalEstimate - (this.discount || 0) + (this.tax || 0));
  }

  complete(): void {
    if (this.lines.length === 0) return;
    this.saving = true;
    this.api
      .completeSale({
        saleType: this.saleType,
        checkupId: this.checkupId,
        patientVisitId: this.visitId,
        patientId: this.patientId,
        discount: this.discount,
        tax: this.tax,
        notes: this.notes || null,
        lines: this.lines.map((l) => ({
          medicineId: l.medicineId,
          qty: l.qty,
          patientMedicineId: l.patientMedicineId ?? null,
        })),
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (sale) => {
          this.lastSale = sale;
          this.clearCart();
          this.messages.add({
            severity: 'success',
            summary: 'Dispense',
            detail: `Sale ${sale.saleNo} completed. Total ${sale.total}`,
          });
          this.loadCatalog();
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Dispense',
            detail: err?.error?.message ?? 'Sale failed.',
          }),
      });
  }
}
