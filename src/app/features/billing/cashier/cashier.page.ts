import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BillingApiService } from '../../../core/api/billing-api.service';
import type { BillingCashSession } from '../../../core/models/api-contracts';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { apiErrorMessage } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-billing-cashier-page',
  imports: [
    CurrencyPipe,
    FormsModule,
    SurfacePanelComponent,
    ButtonModule,
    InputNumberModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './cashier.page.html',
  styleUrl: './cashier.page.scss',
})
export class BillingCashierPage implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  saving = false;
  businessDate = new Date().toISOString().slice(0, 10);
  sessions: BillingCashSession[] = [];
  head: BillingCashSession | null = null;
  mySub: BillingCashSession | null = null;

  openingFloat = 0;
  headDeclaredCash = 0;
  subDeclaredCash = 0;
  notes = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.api
      .getSessions(this.businessDate)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => {
          this.sessions = rows;
          this.head = rows.find((s) => s.sessionType === 'Head' && s.status === 'Open') ?? null;
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Cashier',
            detail: apiErrorMessage(err, 'Could not load sessions.'),
          }),
      });

    this.api
      .getMyOpenSub()
      .pipe(catchError(() => of(null)))
      .subscribe({
        next: (s) => {
          this.mySub = s;
          if (s) this.subDeclaredCash = s.cashCollected;
          this.cdr.markForCheck();
        },
      });
  }

  openHead(): void {
    this.saving = true;
    this.api
      .openHead({ openingFloat: this.openingFloat, businessDate: this.businessDate, notes: this.notes || null })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Cashier', detail: 'Head session opened.' });
          this.reload();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Cashier',
            detail: apiErrorMessage(err, 'Could not open head session.'),
          }),
      });
  }

  openSub(): void {
    this.saving = true;
    this.api
      .openSub({ openingFloat: this.openingFloat, businessDate: this.businessDate, notes: this.notes || null })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Cashier', detail: 'Sub session opened.' });
          this.reload();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Cashier',
            detail: apiErrorMessage(err, 'Could not open sub session.'),
          }),
      });
  }

  closeSub(): void {
    if (!this.mySub) return;
    this.saving = true;
    this.api
      .closeSub(this.mySub.id, { declaredCash: this.subDeclaredCash, notes: this.notes || null })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Cashier', detail: 'Sub closed and remitted to head.' });
          this.reload();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Cashier',
            detail: apiErrorMessage(err, 'Could not close sub session.'),
          }),
      });
  }

  closeHead(): void {
    if (!this.head) return;
    this.saving = true;
    this.api
      .closeHead(this.head.id, { declaredCash: this.headDeclaredCash, notes: this.notes || null })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Cashier', detail: 'Head session closed for the day.' });
          this.reload();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Cashier',
            detail: apiErrorMessage(err, 'Could not close head session.'),
          }),
      });
  }
}
