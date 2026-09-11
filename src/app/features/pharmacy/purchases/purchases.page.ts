import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { MedicinesApiService } from '../../../core/api/medicines-api.service';
import { PharmacyApiService } from '../../../core/api/pharmacy-api.service';
import type { Medicine, PhrmyGoodsReceipt, PhrmyPurchaseOrder, PhrmySupplier } from '../../../core/models/api-contracts';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

interface GrnDraftLine {
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
}

@Component({
  selector: 'app-pharmacy-purchases-page',
  imports: [
    DecimalPipe,
    FormsModule,
    SurfacePanelComponent,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
  ],
  templateUrl: './purchases.page.html',
  styleUrl: './purchases.page.scss',
})
export class PharmacyPurchasesPage implements OnInit, OnDestroy {
  private readonly api = inject(PharmacyApiService);
  private readonly medicinesApi = inject(MedicinesApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly MedHints = [
    'Search medicine here…',
    'Type medicine name…',
    'Find by code…',
  ];

  suppliers: PhrmySupplier[] = [];
  medicines: Medicine[] = [];
  receipts: PhrmyGoodsReceipt[] = [];
  orders: PhrmyPurchaseOrder[] = [];
  historyTab: 'receipts' | 'orders' = 'receipts';
  historyLoading = false;
  historySearch = '';
  selectedReceipt: PhrmyGoodsReceipt | null = null;

  saving = false;
  supplierId: number | null = null;
  receiptDate = new Date().toISOString().slice(0, 10);
  invoiceNo = '';
  lineMedicineId: number | null = null;
  lineBatch = '';
  lineExpiry = '';
  lineQty = 1;
  lineCost = 0;
  lines: GrnDraftLine[] = [];
  readonly medPlaceholder = signal('');
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private hintPaused = false;

  ngOnInit(): void {
    this.api.getSuppliers({ page: 1, pageSize: 200, activeOnly: true }).subscribe({
      next: (res) => {
        this.suppliers = res.items;
        this.cdr.markForCheck();
      },
    });
    this.medicinesApi.getPaged({ page: 1, pageSize: 300, activeOnly: true }).subscribe({
      next: (res) => {
        this.medicines = res.items;
        this.cdr.markForCheck();
      },
    });
    this.loadHistory();
    this.startMedHintAnimation();
  }

  ngOnDestroy(): void {
    this.clearHintTimer();
  }

  private startMedHintAnimation(): void {
    this.clearHintTimer();
    this.hintPaused = false;
    this.medPlaceholder.set('');
    this.hintTimer = setTimeout(() => this.runHintCycle(0), 2000);
  }

  private runHintCycle(index: number): void {
    if (this.hintPaused) return;
    const phrases = PharmacyPurchasesPage.MedHints;
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
    this.medPlaceholder.set(text.slice(0, i));
    if (i >= text.length) {
      done();
      return;
    }
    this.hintTimer = setTimeout(() => this.typeHint(text, i + 1, done), 42);
  }

  private deleteHint(len: number, done: () => void): void {
    if (this.hintPaused) return;
    if (len <= 0) {
      this.medPlaceholder.set('');
      done();
      return;
    }
    this.medPlaceholder.set(this.medPlaceholder().slice(0, -1));
    this.hintTimer = setTimeout(() => this.deleteHint(len - 1, done), 28);
  }

  private clearHintTimer(): void {
    if (this.hintTimer != null) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  private syncMedHintPause(): void {
    const shouldPause = this.lineMedicineId != null;
    if (shouldPause === this.hintPaused) return;
    this.hintPaused = shouldPause;
    if (shouldPause) {
      this.clearHintTimer();
      this.medPlaceholder.set('Search medicine…');
    } else {
      this.startMedHintAnimation();
    }
  }

  get linesTotal(): number {
    return this.lines.reduce((s, l) => s + l.qty * (l.unitCost || 0), 0);
  }

  get linesQty(): number {
    return this.lines.reduce((s, l) => s + l.qty, 0);
  }

  get canSave(): boolean {
    return !!this.supplierId && this.lines.length > 0 && !this.saving;
  }

  setHistoryTab(tab: 'receipts' | 'orders'): void {
    this.historyTab = tab;
    this.selectedReceipt = null;
    this.loadHistory();
  }

  loadHistory(): void {
    this.historyLoading = true;
    const q = this.historySearch.trim() || undefined;
    const done = () => {
      this.historyLoading = false;
      this.cdr.markForCheck();
    };

    if (this.historyTab === 'receipts') {
      this.api
        .getGoodsReceipts({ search: q, page: 1, pageSize: 30 })
        .pipe(finalize(done))
        .subscribe({
          next: (res) => {
            this.receipts = res.items;
            if (this.selectedReceipt) {
              this.selectedReceipt = res.items.find((r) => r.id === this.selectedReceipt!.id) ?? null;
            }
          },
        });
    } else {
      this.api
        .getPurchaseOrders({ search: q, page: 1, pageSize: 30 })
        .pipe(finalize(done))
        .subscribe({
          next: (res) => (this.orders = res.items),
        });
    }
  }

  selectReceipt(row: PhrmyGoodsReceipt): void {
    this.selectedReceipt = row;
  }

  clearSelection(): void {
    this.selectedReceipt = null;
  }

  onMedicinePicked(): void {
    this.syncMedHintPause();
    const med = this.medicines.find((m) => m.id === this.lineMedicineId);
    if (med?.purchasePrice != null && this.lineCost === 0) {
      this.lineCost = med.purchasePrice;
    }
  }

  addLine(): void {
    const med = this.medicines.find((m) => m.id === this.lineMedicineId);
    if (!med || !this.lineBatch.trim() || !this.lineExpiry || this.lineQty <= 0) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing details',
        detail: 'Choose medicine, batch, expiry, and quantity.',
      });
      return;
    }

    const existing = this.lines.findIndex(
      (l) => l.medicineId === med.id && l.batchNumber.toLowerCase() === this.lineBatch.trim().toLowerCase(),
    );
    if (existing >= 0) {
      this.lines[existing].qty += this.lineQty;
      this.lines[existing].unitCost = this.lineCost;
      this.lines[existing].expiryDate = this.lineExpiry;
    } else {
      this.lines.push({
        medicineId: med.id,
        medicineName: med.medicineName,
        batchNumber: this.lineBatch.trim(),
        expiryDate: this.lineExpiry,
        qty: this.lineQty,
        unitCost: this.lineCost,
      });
    }

    this.lineMedicineId = null;
    this.lineBatch = '';
    this.lineExpiry = '';
    this.lineQty = 1;
    this.lineCost = 0;
    this.syncMedHintPause();
  }

  bumpQty(index: number, delta: number): void {
    const line = this.lines[index];
    if (!line) return;
    line.qty = Math.max(0.01, +(line.qty + delta).toFixed(2));
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
  }

  clearDraft(): void {
    this.lines = [];
    this.invoiceNo = '';
    this.lineMedicineId = null;
    this.lineBatch = '';
    this.lineExpiry = '';
    this.lineQty = 1;
    this.lineCost = 0;
    this.syncMedHintPause();
  }

  saveReceipt(): void {
    if (!this.canSave || !this.supplierId) return;
    this.saving = true;
    this.api
      .createGoodsReceipt({
        supplierId: this.supplierId,
        receiptDate: this.receiptDate,
        invoiceNo: this.invoiceNo || null,
        lines: this.lines.map((l) => ({
          medicineId: l.medicineId,
          batchNumber: l.batchNumber,
          expiryDate: l.expiryDate,
          qty: l.qty,
          unitCost: l.unitCost,
        })),
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (created) => {
          this.messages.add({
            severity: 'success',
            summary: 'Stock updated',
            detail: `Receipt ${created.receiptNo} saved.`,
          });
          this.clearDraft();
          this.historyTab = 'receipts';
          this.loadHistory();
          this.selectedReceipt = created;
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Receive failed',
            detail: err?.error?.message ?? 'Could not save receipt.',
          }),
      });
  }

  submitOrder(id: number, event: Event): void {
    event.stopPropagation();
    this.api.submitPurchaseOrder(id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Order submitted', detail: 'Purchase order sent.' });
        this.loadHistory();
      },
      error: (err) =>
        this.messages.add({
          severity: 'error',
          summary: 'Submit failed',
          detail: err?.error?.message ?? 'Could not submit order.',
        }),
    });
  }

  orderSeverity(status: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    switch (status) {
      case 'Draft':
        return 'warn';
      case 'Submitted':
      case 'Approved':
        return 'info';
      case 'Received':
      case 'Closed':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
