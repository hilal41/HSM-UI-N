import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { BillingApiService } from '../../../core/api/billing-api.service';
import type { BillingInvoice } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage, normalizeLazyPage, showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-billing-invoices-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
  ],
  templateUrl: './invoices.page.html',
  styleUrl: './invoices.page.scss',
})
export class BillingInvoicesPage {
  private readonly api = inject(BillingApiService);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: BillingInvoice[] = [];
  totalCount = 0;
  loading = false;
  searchInput = '';
  statusFilter: string | null = null;
  readonly pageSize = 20;
  tablePageSize = this.pageSize;

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  readonly statusOptions = [
    { label: 'All', value: null },
    { label: 'Issued', value: 'Issued' },
    { label: 'Partially Paid', value: 'PartiallyPaid' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Void', value: 'Void' },
  ];

  readonly payMethods = [
    { label: 'Cash', value: 'Cash' },
    { label: 'Card', value: 'Card' },
    { label: 'Bank Transfer', value: 'BankTransfer' },
    { label: 'Other', value: 'Other' },
  ];

  detail: BillingInvoice | null = null;
  detailOpen = false;

  fromVisitOpen = false;
  fromVisitId: number | null = null;
  fromVisitNotes = '';
  saving = false;

  payOpen = false;
  payMethod = 'Cash';
  payAmount = 0;
  payRef = '';
  payNotes = '';

  lineOpen = false;
  lineDesc = '';
  lineQty = 1;
  linePrice = 0;
  lineDiscount = 0;

  onLazyLoad(event: TableLazyLoadEvent): void {
    const { page, pageSize } = normalizeLazyPage(event, this.pageSize);
    this.tablePageSize = pageSize;
    this.loading = true;
    this.api
      .getInvoices({
        page,
        pageSize,
        search: this.searchInput.trim() || undefined,
        status: this.statusFilter || undefined,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Invoices',
            detail: apiErrorMessage(err, 'Could not load invoices.'),
          }),
      });
  }

  refresh(): void {
    this.onLazyLoad({ first: 0, rows: this.pageSize });
  }

  setStatus(value: string | null): void {
    this.statusFilter = value;
    this.refresh();
  }

  statusLabel(status: string): string {
    return status === 'PartiallyPaid' ? 'Partially Paid' : status;
  }

  openDetail(row: BillingInvoice): void {
    this.api.getInvoice(row.id).subscribe({
      next: (inv) => {
        this.detail = inv;
        this.detailOpen = true;
        this.cdr.markForCheck();
      },
      error: (err) =>
        this.messages.add({
          severity: 'error',
          summary: 'Invoice',
          detail: apiErrorMessage(err, 'Could not load invoice.'),
        }),
    });
  }

  openFromVisit(): void {
    this.fromVisitId = null;
    this.fromVisitNotes = '';
    this.fromVisitOpen = true;
  }

  createFromVisit(): void {
    if (!this.fromVisitId || this.fromVisitId <= 0) {
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Enter a visit id.' });
      return;
    }
    this.saving = true;
    this.api
      .createFromVisit({ patientVisitId: this.fromVisitId, notes: this.fromVisitNotes || null })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (inv) => {
          this.fromVisitOpen = false;
          this.messages.add({ severity: 'success', summary: 'Invoice', detail: `${inv.invoiceNo} created.` });
          this.refresh();
          this.openDetail(inv);
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Invoice',
            detail: apiErrorMessage(err, 'Could not create invoice.'),
          }),
      });
  }

  openPay(): void {
    if (!this.detail) return;
    this.payMethod = 'Cash';
    this.payAmount = this.detail.balanceAmount;
    this.payRef = '';
    this.payNotes = '';
    this.payOpen = true;
  }

  recordPayment(): void {
    if (!this.detail) return;
    this.saving = true;
    this.api
      .recordPayment({
        invoiceId: this.detail.id,
        method: this.payMethod,
        amount: this.payAmount,
        referenceNo: this.payRef || null,
        notes: this.payNotes || null,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (p) => {
          this.payOpen = false;
          this.messages.add({ severity: 'success', summary: 'Payment', detail: `${p.paymentNo} recorded.` });
          this.openDetail(this.detail!);
          this.refresh();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Payment',
            detail: apiErrorMessage(err, 'Could not record payment.'),
          }),
      });
  }

  openAddLine(): void {
    this.lineDesc = '';
    this.lineQty = 1;
    this.linePrice = 0;
    this.lineDiscount = 0;
    this.lineOpen = true;
  }

  addLine(): void {
    if (!this.detail) return;
    this.saving = true;
    this.api
      .addManualLine(this.detail.id, {
        description: this.lineDesc,
        qty: this.lineQty,
        unitPrice: this.linePrice,
        discount: this.lineDiscount,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (inv) => {
          this.lineOpen = false;
          this.detail = inv;
          this.messages.add({ severity: 'success', summary: 'Invoice', detail: 'Line added.' });
          this.refresh();
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Invoice',
            detail: apiErrorMessage(err, 'Could not add line.'),
          }),
      });
  }

  voidInvoice(): void {
    if (!this.detail) return;
    this.confirm.confirm({
      message: `Void invoice ${this.detail.invoiceNo}?`,
      accept: () => {
        this.api.voidInvoice(this.detail!.id).subscribe({
          next: (inv) => {
            this.detail = inv;
            this.messages.add({ severity: 'success', summary: 'Invoice', detail: 'Voided.' });
            this.refresh();
            this.cdr.markForCheck();
          },
          error: (err) =>
            this.messages.add({
              severity: 'error',
              summary: 'Invoice',
              detail: apiErrorMessage(err, 'Could not void invoice.'),
            }),
        });
      },
    });
  }

  printReceipt(): void {
    if (!this.detail) return;
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    const lines = this.detail.lines
      .map((l) => `<tr><td>${l.description}</td><td style="text-align:right">${l.lineTotal.toFixed(2)}</td></tr>`)
      .join('');
    const pays = this.detail.payments
      .map((p) => `<tr><td>${p.paymentNo} · ${p.method}</td><td style="text-align:right">${p.amount.toFixed(2)}</td></tr>`)
      .join('');
    w.document.write(`<!doctype html><html><head><title>${this.detail.invoiceNo}</title>
      <style>body{font-family:system-ui,sans-serif;padding:1rem}table{width:100%;border-collapse:collapse}
      td,th{padding:.35rem 0;border-bottom:1px solid #ddd;font-size:13px}</style></head><body>
      <h2>${this.detail.invoiceNo}</h2>
      <p>${this.detail.patientName}<br/>${new Date(this.detail.invoiceDate).toLocaleString()}<br/>Status: ${this.detail.status}</p>
      <table><thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead><tbody>${lines}</tbody></table>
      <p><strong>Total:</strong> ${this.detail.total.toFixed(2)} &nbsp; <strong>Paid:</strong> ${this.detail.paidAmount.toFixed(2)}
      &nbsp; <strong>Balance:</strong> ${this.detail.balanceAmount.toFixed(2)}</p>
      <h3>Payments</h3><table><tbody>${pays || '<tr><td colspan="2">None</td></tr>'}</tbody></table>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'PartiallyPaid':
        return 'warn';
      case 'Void':
        return 'danger';
      case 'Issued':
        return 'info';
      default:
        return 'secondary';
    }
  }
}
