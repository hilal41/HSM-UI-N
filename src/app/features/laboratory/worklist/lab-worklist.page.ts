import { DecimalPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { LabOrdersApiService } from '../../../core/api/lab-orders-api.service';
import { LabWorklistApiService } from '../../../core/api/lab-worklist-api.service';
import { MeApiService } from '../../../core/api/me-api.service';
import type { LabOrderEvent, LabOrderLine, LabOrderResponse, LabWorklistItem } from '../../../core/models/api-contracts';
import { HmsCrudEmptyStateComponent } from '../../../shared/components/hms-crud-empty-state/hms-crud-empty-state.component';
import { HmsTableLoadingBodyComponent } from '../../../shared/components/hms-table-loading-body/hms-table-loading-body.component';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';
import { hasPrintableResults, printLabResultReport, formatLineResultSummary } from '../../../shared/utils/lab-result-print.util';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import {
  branchCalendarToday,
  resolveBranchTimeZone,
  toBranchYmd,
} from '../../../shared/utils/branch-calendar-date.util';
import { showCrudPaginator } from '../../../shared/utils/crud-page.state';

@Component({
  selector: 'app-lab-worklist-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsCrudEmptyStateComponent,
    HmsTableLoadingBodyComponent,
    TableModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    TabsModule,
    ConfirmDialogModule,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './lab-worklist.page.html',
  styleUrl: './lab-worklist.page.scss',
})
export class LabWorklistPage {
  private readonly worklistApi = inject(LabWorklistApiService);
  private readonly ordersApi = inject(LabOrdersApiService);
  private readonly meApi = inject(MeApiService);
  private readonly session = inject(AuthSessionService);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: LabWorklistItem[] = [];
  totalCount = 0;
  loading = false;
  searchInput = '';
  fromDate: Date;
  toDate: Date;
  filterStatus: string | null = null;
  filterPriority: string | null = null;
  filterTat: 'overdue' | 'ontime' | null = null;

  get hasActiveFilter(): boolean {
    return (
      this.searchInput.trim().length > 0 ||
      this.filterStatus != null ||
      this.filterPriority != null ||
      this.filterTat != null
    );
  }

  get showPaginator(): boolean {
    return showCrudPaginator(this.totalCount, 25);
  }

  readonly statusOptions = [
    { label: 'All statuses', value: null },
    { label: 'Ordered', value: 'Ordered' },
    { label: 'In progress', value: 'InProgress' },
    { label: 'Completed', value: 'Completed' },
  ];
  readonly priorityOptions = [
    { label: 'All priorities', value: null },
    { label: 'Routine', value: 'Routine' },
    { label: 'Urgent', value: 'Urgent' },
    { label: 'STAT', value: 'STAT' },
  ];
  readonly tatOptions = [
    { label: 'All TAT', value: null },
    { label: 'Overdue', value: 'overdue' },
    { label: 'On time', value: 'ontime' },
  ];
  readonly editPriorityOptions = [
    { label: 'Routine', value: 'Routine' },
    { label: 'Urgent', value: 'Urgent' },
    { label: 'STAT', value: 'STAT' },
  ];

  detailOpen = false;
  detailLoading = false;
  detailTab = 'lines';
  selectedOrder: LabOrderResponse | null = null;
  orderEvents: LabOrderEvent[] = [];
  eventsLoading = false;
  hospitalName: string | null = null;

  resultDialogOpen = false;
  resultLine: LabOrderLine | null = null;
  resultValue = '';
  resultNotes = '';
  resultPanelValues: {
    code: string;
    name: string;
    value: string;
    unit?: string | null;
    referenceRange?: string | null;
    labTestParameterId?: number | null;
  }[] = [];
  resultSaving = false;
  prioritySaving = false;

  constructor() {
    const branchToday = branchCalendarToday(this.branchTimeZone);
    this.fromDate = branchToday;
    this.toDate = branchToday;

    this.meApi.getMyHospital().subscribe({
      next: (h) => {
        this.hospitalName = h.name ?? null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.messages.add({
          severity: 'warn',
          summary: 'Hospital',
          detail: 'Unable to load hospital name for printing.',
        });
      },
    });
    this.load();
  }

  load(page = 1): void {
    this.loading = true;
    this.worklistApi
      .getWorklist({
        fromDate: toBranchYmd(this.fromDate, this.branchTimeZone),
        toDate: toBranchYmd(this.toDate, this.branchTimeZone),
        status: this.filterStatus ?? undefined,
        priority: this.filterPriority ?? undefined,
        search: this.searchInput.trim() || undefined,
        page,
        pageSize: 25,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = this.applyTatFilter(res.items);
          this.totalCount = this.filterTat ? this.rows.length : res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Worklist', detail: 'Could not load worklist.' }),
      });
  }

  openOrder(row: LabWorklistItem): void {
    this.detailOpen = true;
    this.detailTab = 'lines';
    this.detailLoading = true;
    this.orderEvents = [];
    this.ordersApi
      .getById(row.orderId)
      .pipe(finalize(() => (this.detailLoading = false)))
      .subscribe({
        next: (o) => {
          this.selectedOrder = o;
          this.loadEvents(o.id);
          this.cdr.markForCheck();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Order', detail: 'Could not load order.' }),
      });
  }

  loadEvents(orderId: number): void {
    this.eventsLoading = true;
    this.ordersApi
      .getEvents(orderId)
      .pipe(finalize(() => (this.eventsLoading = false)))
      .subscribe({
        next: (ev) => {
          this.orderEvents = ev;
          this.cdr.markForCheck();
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Events',
            detail: 'Could not load order events.',
          }),
      });
  }

  collect(line: LabOrderLine): void {
    this.worklistApi.collectSpecimen(line.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Collected', detail: 'Specimen collected.' });
        this.refreshOrder();
      },
      error: (err: { error?: { message?: string } }) =>
        this.messages.add({ severity: 'error', summary: 'Collect', detail: err?.error?.message ?? 'Failed.' }),
    });
  }

  openResult(line: LabOrderLine): void {
    this.resultLine = line;
    const testParams = line.testParameters ?? [];
    if (testParams.length > 0) {
      this.resultPanelValues = testParams.map((p) => ({
        code: p.code,
        name: p.name,
        value: line.result?.parameters?.find((rp) => rp.code === p.code)?.value ?? '',
        unit: p.unit,
        referenceRange: p.referenceRange,
        labTestParameterId: p.id,
      }));
      this.resultValue = '';
    } else {
      this.resultPanelValues = [];
      this.resultValue = line.result?.value ?? '';
    }
    this.resultNotes = line.result?.notes ?? '';
    this.resultDialogOpen = true;
  }

  get isPanelResult(): boolean {
    return this.resultPanelValues.length > 0;
  }

  saveResult(): void {
    if (!this.resultLine) return;

    if (this.isPanelResult) {
      const parameters = this.resultPanelValues
        .filter((p) => p.value.trim())
        .map((p) => ({
          code: p.code,
          name: p.name,
          value: p.value.trim(),
          unit: p.unit,
          referenceRange: p.referenceRange,
          labTestParameterId: p.labTestParameterId,
        }));
      if (parameters.length === 0) return;
      this.resultSaving = true;
      this.worklistApi
        .enterResult(this.resultLine.id, {
          notes: this.resultNotes.trim() || null,
          parameters,
        })
        .pipe(finalize(() => (this.resultSaving = false)))
        .subscribe({
          next: () => {
            this.resultDialogOpen = false;
            this.messages.add({ severity: 'success', summary: 'Result', detail: 'Panel result saved.' });
            this.refreshOrder();
          },
          error: (err: { error?: { message?: string } }) =>
            this.messages.add({ severity: 'error', summary: 'Result', detail: err?.error?.message ?? 'Failed.' }),
        });
      return;
    }

    if (!this.resultValue.trim()) return;
    this.resultSaving = true;
    this.worklistApi
      .enterResult(this.resultLine.id, { value: this.resultValue.trim(), notes: this.resultNotes.trim() || null })
      .pipe(finalize(() => (this.resultSaving = false)))
      .subscribe({
        next: () => {
          this.resultDialogOpen = false;
          this.messages.add({ severity: 'success', summary: 'Result', detail: 'Result saved.' });
          this.refreshOrder();
        },
        error: (err: { error?: { message?: string } }) =>
          this.messages.add({ severity: 'error', summary: 'Result', detail: err?.error?.message ?? 'Failed.' }),
      });
  }

  verify(line: LabOrderLine): void {
    this.worklistApi.verifyResult(line.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Verified', detail: 'Result verified. A second user must release it.' });
        this.refreshOrder();
      },
      error: (err: { error?: { message?: string } }) =>
        this.messages.add({ severity: 'error', summary: 'Verify', detail: err?.error?.message ?? 'Failed.' }),
    });
  }

  release(line: LabOrderLine): void {
    this.worklistApi.releaseResult(line.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Released', detail: 'Result released.' });
        this.refreshOrder();
      },
      error: (err: { error?: { message?: string } }) =>
        this.messages.add({ severity: 'error', summary: 'Release', detail: err?.error?.message ?? 'Failed.' }),
    });
  }

  cancelLine(line: LabOrderLine): void {
    this.confirm.confirm({
      message: `Cancel test "${line.testName}"?`,
      header: 'Cancel line',
      accept: () => {
        this.worklistApi.updateLineStatus(line.id, { status: 'Cancelled' }).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Cancelled', detail: 'Line cancelled.' });
            this.refreshOrder();
            this.load();
          },
          error: (err: { error?: { message?: string } }) =>
            this.messages.add({ severity: 'error', summary: 'Cancel', detail: err?.error?.message ?? 'Failed.' }),
        });
      },
    });
  }

  canPrint(): boolean {
    return this.selectedOrder != null && hasPrintableResults(this.selectedOrder.lines);
  }

  isRegistrationBilled(order: LabOrderResponse | LabWorklistItem | null = this.selectedOrder): boolean {
    return order != null && order.patientVisitId != null && order.patientVisitId > 0;
  }

  lineResultSummary(line: LabOrderLine): string {
    return formatLineResultSummary(line);
  }

  lineAbnormalFlags(line: LabOrderLine): string[] {
    const params = line.result?.parameters?.filter((p) => p.value) ?? [];
    if (params.length > 0) {
      return [...new Set(params.map((p) => p.abnormalFlag).filter((f) => f && f !== 'Normal'))];
    }
    const flag = line.result?.abnormalFlag;
    return flag && flag !== 'Normal' ? [flag] : [];
  }

  flagSeverity(flag: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' | 'contrast' {
    if (flag === 'Critical') return 'danger';
    if (flag === 'High' || flag === 'Low') return 'warn';
    return 'info';
  }

  printResults(): void {
    if (!this.selectedOrder) return;
    printLabResultReport(this.selectedOrder, this.hospitalName);
    const printableLines = this.selectedOrder.lines.filter((l) => l.status === 'Released' && l.result);
    for (const line of printableLines) {
      this.ordersApi.markLinePrinted(line.id).subscribe({
        next: (updated) => {
          if (!this.selectedOrder) return;
          this.selectedOrder = {
            ...this.selectedOrder,
            lines: this.selectedOrder.lines.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)),
          };
          this.cdr.markForCheck();
        },
        error: () => {
          /* Print already succeeded; keep silent on meta sync failure. */
        },
      });
    }
  }

  lineReleaseMeta(line: LabOrderLine): string | null {
    const r = line.result;
    if (!r) return null;
    const parts: string[] = [];
    if (r.releasedByUserName) parts.push(`Released by ${r.releasedByUserName}`);
    if (r.printedByUserName || r.printedAt) {
      const when = r.printedAt ? ` at ${new Date(r.printedAt).toLocaleString()}` : '';
      parts.push(`Printed${r.printedByUserName ? ` by ${r.printedByUserName}` : ''}${when}`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  lineSeverity(status: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    if (status === 'Released') return 'success';
    if (status === 'Verified') return 'info';
    if (status === 'Cancelled') return 'secondary';
    if (status === 'ResultEntered') return 'warn';
    return 'info';
  }

  canEditPriority(order: LabOrderResponse | null = this.selectedOrder): boolean {
    return order != null && (order.status === 'Ordered' || order.status === 'InProgress');
  }

  onPriorityChange(priority: string): void {
    if (!this.selectedOrder || !this.canEditPriority(this.selectedOrder) || priority === this.selectedOrder.priority) {
      return;
    }

    this.prioritySaving = true;
    this.ordersApi
      .updatePriority(this.selectedOrder.id, { priority })
      .pipe(finalize(() => (this.prioritySaving = false)))
      .subscribe({
        next: (order) => {
          this.selectedOrder = order;
          this.messages.add({ severity: 'success', summary: 'Priority', detail: 'Order priority updated.' });
          this.load();
          this.cdr.markForCheck();
        },
        error: (err: { error?: { message?: string } }) =>
          this.messages.add({
            severity: 'error',
            summary: 'Priority',
            detail: err?.error?.message ?? 'Could not update priority.',
          }),
      });
  }

  private get branchTimeZone(): string {
    return resolveBranchTimeZone(this.session.activeBranch()?.timeZoneId);
  }

  private applyTatFilter(items: LabWorklistItem[]): LabWorklistItem[] {
    if (this.filterTat === 'overdue') {
      return items.filter((r) => r.turnaroundHours != null && r.isOverdue);
    }
    if (this.filterTat === 'ontime') {
      return items.filter((r) => r.turnaroundHours != null && !r.isOverdue);
    }
    return items;
  }

  private refreshOrder(): void {
    if (!this.selectedOrder) return;
    this.openOrder({ orderId: this.selectedOrder.id } as LabWorklistItem);
    this.load();
  }
}
