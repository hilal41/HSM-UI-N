import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LabWorklistApiService } from '../../../core/api/lab-worklist-api.service';
import type {
  LabCompletedReportRow,
  LabDailyVolumeRow,
  LabPendingSummary,
  LabStatusCount,
} from '../../../core/models/api-contracts';
import { SurfacePanelComponent } from '../../../shared/components/surface-panel/surface-panel.component';

@Component({
  selector: 'app-lab-reports-page',
  imports: [DatePipe, FormsModule, SurfacePanelComponent, TableModule, ButtonModule, InputTextModule],
  templateUrl: './lab-reports.page.html',
})
export class LabReportsPage implements OnInit {
  private readonly api = inject(LabWorklistApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  tab: 'pending' | 'completed' | 'volume' = 'pending';
  pending: LabPendingSummary = { totalPending: 0, byStatus: [] };
  completed: LabCompletedReportRow[] = [];
  volume: LabDailyVolumeRow[] = [];
  from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.loadPending();
  }

  get pendingRows(): LabStatusCount[] {
    return this.pending.byStatus ?? [];
  }

  loadPending(): void {
    this.tab = 'pending';
    this.api.getPendingSummary().subscribe({
      next: (res) => {
        this.pending = res;
        this.cdr.markForCheck();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Reports', detail: 'Pending report failed.' }),
    });
  }

  loadCompleted(): void {
    this.tab = 'completed';
    this.api.getCompletedReport(this.from, this.to).subscribe({
      next: (rows) => {
        this.completed = rows;
        this.cdr.markForCheck();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Reports', detail: 'Completed report failed.' }),
    });
  }

  loadVolume(): void {
    this.tab = 'volume';
    this.api.getDailyVolume(this.from, this.to).subscribe({
      next: (rows) => {
        this.volume = rows;
        this.cdr.markForCheck();
      },
      error: () =>
        this.messages.add({ severity: 'error', summary: 'Reports', detail: 'Daily volume report failed.' }),
    });
  }
}
