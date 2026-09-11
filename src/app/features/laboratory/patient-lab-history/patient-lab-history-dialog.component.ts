import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { LabOrdersApiService } from '../../../core/api/lab-orders-api.service';
import { LabWorklistApiService } from '../../../core/api/lab-worklist-api.service';
import type { LabOrderResponse, LabWorklistItem, Patient } from '../../../core/models/api-contracts';
import { hasPrintableResults, printLabResultReport } from '../../../shared/utils/lab-result-print.util';

@Component({
  selector: 'app-patient-lab-history-dialog',
  imports: [DialogModule, TableModule, ButtonModule, TagModule, DatePipe],
  template: `
    <p-dialog
      [header]="dialogTitle"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: 'min(95vw, 40rem)' }"
    >
      @if (loading) {
        <p class="text-sm text-slate-500">Loading…</p>
      } @else if (orders.length === 0) {
        <p class="text-sm text-slate-500">No lab orders found for this patient.</p>
      } @else {
        <p-table [value]="orders" size="small">
          <ng-template pTemplate="header">
            <tr><th>Order</th><th>Date</th><th>Status</th><th></th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td class="font-mono text-xs">{{ row.orderNumber }}</td>
              <td>{{ row.createdAt | date: 'short' }}</td>
              <td><p-tag [value]="row.orderStatus" /></td>
              <td>
                <button pButton type="button" label="View" class="p-button-sm p-button-text" (click)="viewOrder(row)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      @if (selectedOrder) {
        <div class="mt-4 border-t pt-3">
          <div class="flex justify-between items-center mb-2">
            <strong class="text-sm">{{ selectedOrder.orderNumber }}</strong>
            @if (canPrint(selectedOrder)) {
              <button pButton type="button" label="Print" icon="pi pi-print" class="p-button-sm p-button-outlined" (click)="print(selectedOrder)"></button>
            }
          </div>
          <ul class="text-sm space-y-1">
            @for (line of selectedOrder.lines; track line.id) {
              <li>
                {{ line.testName }}:
                @if (line.result?.value) {
                  <strong>{{ line.result?.value }}</strong> {{ line.result?.unit }}
                  <span class="text-slate-500">({{ line.status }})</span>
                } @else {
                  <span class="text-slate-500">{{ line.status }}</span>
                }
              </li>
            }
          </ul>
        </div>
      }
    </p-dialog>
  `,
})
export class PatientLabHistoryDialogComponent {
  private readonly worklistApi = inject(LabWorklistApiService);
  private readonly ordersApi = inject(LabOrdersApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  visible = false;
  loading = false;
  dialogTitle = 'Lab history';
  orders: LabWorklistItem[] = [];
  selectedOrder: LabOrderResponse | null = null;

  open(patient: Patient): void {
    this.dialogTitle = `Lab history — ${patient.firstName} ${patient.lastName}`;
    this.visible = true;
    this.selectedOrder = null;
    this.loading = true;
    const from = new Date();
    from.setFullYear(from.getFullYear() - 2);
    this.worklistApi
      .getWorklist({
        fromDate: from.toISOString().slice(0, 10),
        toDate: new Date().toISOString().slice(0, 10),
        patientId: patient.id,
        pageSize: 50,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.orders = res.items;
          this.cdr.markForCheck();
        },
      });
  }

  viewOrder(row: LabWorklistItem): void {
    this.ordersApi.getById(row.orderId).subscribe({
      next: (o) => {
        this.selectedOrder = o;
        this.cdr.markForCheck();
      },
    });
  }

  canPrint(order: LabOrderResponse): boolean {
    return hasPrintableResults(order.lines);
  }

  print(order: LabOrderResponse): void {
    printLabResultReport(order);
  }
}
