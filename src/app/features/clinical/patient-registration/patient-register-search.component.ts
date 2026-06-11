import { ChangeDetectorRef, Component, EventEmitter, inject, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { HmsBlockSkeletonComponent } from '../../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { catchError, finalize, of } from 'rxjs';
import { PatientsApiService } from '../../../core/api/patients-api.service';
import type { Patient, PatientSearchHit } from '../../../core/models/api-contracts';

@Component({
  selector: 'app-patient-register-search',
  imports: [FormsModule, ButtonModule, InputTextModule, HmsBlockSkeletonComponent],
  templateUrl: './patient-register-search.component.html',
  styleUrl: './patient-register-search.component.scss',
})
export class PatientRegisterSearchComponent implements OnDestroy {
  private readonly api = inject(PatientsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() patientPicked = new EventEmitter<Patient>();
  /** Opens the new-patient registration step (same as header action). */
  @Output() registerNew = new EventEmitter<void>();

  term = '';
  items: PatientSearchHit[] = [];
  loading = false;
  searchError: string | null = null;
  private lastTerm = '';
  page = 1;
  readonly pageSize = 15;
  hasNext = false;
  totalCount = 0;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  onTermChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.executeSearch(true);
    }, 320);
  }

  executeSearch(resetPage: boolean): void {
    const t = this.term.trim();
    this.lastTerm = t;
    if (resetPage) {
      this.page = 1;
    }
    if (t.length < 1) {
      this.items = [];
      this.hasNext = false;
      this.totalCount = 0;
      this.searchError = null;
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.searchError = null;
    this.cdr.markForCheck();
    this.api
      .search({ term: t, page: this.page, pageSize: this.pageSize })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.searchError = 'Search failed. Try again.';
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (res === null) {
          if (resetPage) {
            this.items = [];
            this.hasNext = false;
            this.totalCount = 0;
          }
          return;
        }
        if (resetPage) {
          this.items = res.items;
        } else {
          this.items = [...this.items, ...res.items];
        }
        this.hasNext = res.hasNextPage;
        this.totalCount = res.totalCount;
        this.page = res.page;
      });
  }

  loadMore(): void {
    if (!this.hasNext || this.loading || !this.lastTerm.trim()) {
      return;
    }
    this.page += 1;
    this.executeSearch(false);
  }

  pick(hit: PatientSearchHit): void {
    this.patientPicked.emit(hit.patient);
  }

  formatDob(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  displayName(p: Patient): string {
    const ln = (p.lastName ?? '').trim();
    if (!ln || ln === '-') {
      return p.firstName.trim();
    }
    return `${p.firstName} ${p.lastName}`.trim();
  }
}
