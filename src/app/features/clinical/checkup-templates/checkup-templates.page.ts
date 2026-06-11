import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { forkJoin, finalize } from 'rxjs';
import { CheckupTemplatesApiService } from '../../../core/api/checkup-templates-api.service';
import type { CheckupTemplate } from '../../../core/models/api-contracts';
import { apiErrorDetail } from '../../../core/utils/api-error';
@Component({
  selector: 'app-checkup-templates-page',
  imports: [
    DatePipe,
    FormsModule,
    MessageModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    TagModule,
  ],
  templateUrl: './checkup-templates.page.html',
  styleUrl: './checkup-templates.page.scss',
})
export class CheckupTemplatesPage implements OnInit {
  private readonly api = inject(CheckupTemplatesApiService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  libraryRows: CheckupTemplate[] = [];
  rows: CheckupTemplate[] = [];
  totalCount = 0;
  loadingStudio = true;
  errorMessage: string | null = null;
  pageSize = 10;
  page = 1;
  searchInput = '';

  ngOnInit(): void {
    this.reloadStudio();
  }

  reloadStudio(): void {
    this.loadingStudio = true;
    this.errorMessage = null;
    forkJoin({
      library: this.api.getLibrary(),
      page: this.api.getPaged({ page: this.page, pageSize: this.pageSize, search: this.searchTerm() }),
    })
      .pipe(finalize(() => (this.loadingStudio = false)))
      .subscribe({
        next: ({ library, page: p }) => {
          this.libraryRows = library;
          this.rows = p.items;
          this.totalCount = p.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load checkup templates.';
          this.cdr.markForCheck();
        },
      });
  }

  filteredLibrary(): CheckupTemplate[] {
    const s = this.searchInput.trim().toLowerCase();
    if (!s) return this.libraryRows;
    return this.libraryRows.filter(
      (r) => r.code.toLowerCase().includes(s) || r.name.toLowerCase().includes(s),
    );
  }

  schemaSummary(row: CheckupTemplate): string {
    if (!row.schemaJson?.trim()) return 'No sections';
    try {
      const o = JSON.parse(row.schemaJson) as { sections?: unknown[] };
      const n = Array.isArray(o?.sections) ? o.sections.length : 0;
      return n === 1 ? '1 section' : `${n} sections`;
    } catch {
      return 'Layout';
    }
  }

  loadPage(page: number, pageSize?: number): void {
    if (pageSize != null) this.pageSize = pageSize;
    this.page = page;
    this.loadingStudio = true;
    this.errorMessage = null;
    this.api
      .getPaged({ page, pageSize: this.pageSize, search: this.searchTerm() })
      .pipe(finalize(() => (this.loadingStudio = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.items;
          this.totalCount = res.totalCount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load custom templates.';
          this.cdr.markForCheck();
        },
      });
  }

  private searchTerm(): string | undefined {
    const t = this.searchInput.trim();
    return t || undefined;
  }

  onPageChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize;
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;
    this.loadPage(page, rows);
  }

  applySearch(): void {
    this.page = 1;
    this.reloadStudio();
  }

  openCreate(): void {
    void this.router.navigate(['/app/clinical/checkup-templates/new']);
  }

  openEdit(row: CheckupTemplate): void {
    void this.router.navigate(['/app/clinical/checkup-templates/edit', row.id]);
  }

  duplicateAsCustom(row: CheckupTemplate): void {
    void this.router.navigate(['/app/clinical/checkup-templates/new'], {
      queryParams: { from: row.id },
    });
  }

  confirmDelete(row: CheckupTemplate): void {
    if (row.isBuiltIn) return;
    this.confirm.confirm({
      message: `Delete template "${row.name}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.delete(row.id).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Template removed.' });
            this.reloadStudio();
          },
          error: (err: unknown) => {
            this.messages.add({
              severity: 'error',
              summary: 'Error',
              detail: apiErrorDetail(err, 'Delete failed.'),
            });
          },
        });
      },
    });
  }
}
