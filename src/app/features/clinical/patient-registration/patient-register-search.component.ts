import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
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
export class PatientRegisterSearchComponent implements OnInit, OnDestroy {
  private static readonly SearchPlaceholderStatic =
    'Search name, phone, or reg no…';

  /** Wait until the user has typed at least this many characters before searching. */
  private static readonly MinSearchLength = 2;

  private static readonly SearchHints = [
    'Search patient name here…',
    'Search by phone number…',
    'Search registration number now…',
    'Find patient by name or phone…',
    'Type name, phone, or reg no…',
    'Look up existing patient record…',
  ];

  private readonly api = inject(PatientsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() patientPicked = new EventEmitter<Patient>();
  /** Opens the new-patient registration step. */
  @Output() registerNew = new EventEmitter<void>();

  readonly minSearchLength = PatientRegisterSearchComponent.MinSearchLength;

  term = '';
  searchPlaceholder = '';
  items: PatientSearchHit[] = [];
  loading = false;
  searchError: string | null = null;
  searchFocused = false;
  private lastTerm = '';
  page = 1;
  readonly pageSize = 15;
  hasNext = false;
  totalCount = 0;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private hintPaused = false;
  private searchGeneration = 0;

  ngOnInit(): void {
    this.startSearchHintAnimation();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.clearHintTimer();
  }

  onSearchChange(value: string): void {
    this.term = value ?? '';
    if (this.term.trim().length < PatientRegisterSearchComponent.MinSearchLength) {
      this.searchError = null;
      this.items = [];
      this.hasNext = false;
      this.totalCount = 0;
      this.searchGeneration += 1;
    }
    this.syncHintPause();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.executeSearch(true);
    }, 320);
  }

  onSearchFocus(): void {
    this.searchFocused = true;
    this.syncHintPause();
  }

  onSearchBlur(): void {
    this.searchFocused = false;
    this.syncHintPause();
  }

  private syncHintPause(): void {
    const shouldPause = this.searchFocused || this.term.trim().length > 0;
    if (shouldPause === this.hintPaused) return;
    this.hintPaused = shouldPause;
    if (shouldPause) {
      this.clearHintTimer();
      this.searchPlaceholder = PatientRegisterSearchComponent.SearchPlaceholderStatic;
      this.cdr.markForCheck();
    } else {
      this.startSearchHintAnimation();
    }
  }

  private startSearchHintAnimation(): void {
    this.clearHintTimer();
    this.hintPaused = false;
    this.searchPlaceholder = '';
    this.cdr.markForCheck();
    this.hintTimer = setTimeout(() => this.runHintCycle(0), 600);
  }

  private runHintCycle(index: number): void {
    if (this.hintPaused) return;
    const phrases = PatientRegisterSearchComponent.SearchHints;
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
    this.searchPlaceholder = text.slice(0, i);
    this.cdr.markForCheck();
    if (i >= text.length) {
      done();
      return;
    }
    this.hintTimer = setTimeout(() => this.typeHint(text, i + 1, done), 42);
  }

  private deleteHint(len: number, done: () => void): void {
    if (this.hintPaused) return;
    if (len <= 0) {
      this.searchPlaceholder = '';
      this.cdr.markForCheck();
      done();
      return;
    }
    this.searchPlaceholder = this.searchPlaceholder.slice(0, -1);
    this.cdr.markForCheck();
    this.hintTimer = setTimeout(() => this.deleteHint(len - 1, done), 28);
  }

  private clearHintTimer(): void {
    if (this.hintTimer != null) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  executeSearch(resetPage: boolean): void {
    const t = this.term.trim();
    this.lastTerm = t;
    if (resetPage) {
      this.page = 1;
    }
    if (t.length < PatientRegisterSearchComponent.MinSearchLength) {
      this.searchGeneration += 1;
      this.loading = false;
      this.items = [];
      this.hasNext = false;
      this.totalCount = 0;
      this.searchError = null;
      this.cdr.markForCheck();
      return;
    }
    const generation = ++this.searchGeneration;
    this.loading = true;
    this.searchError = null;
    this.cdr.markForCheck();
    this.api
      .search({ term: t, page: this.page, pageSize: this.pageSize })
      .pipe(
        finalize(() => {
          if (generation !== this.searchGeneration) {
            return;
          }
          this.loading = false;
          this.cdr.markForCheck();
        }),
        catchError(() => {
          if (generation === this.searchGeneration) {
            this.searchError = 'Search failed. Try again.';
          }
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (generation !== this.searchGeneration) {
          return;
        }
        if (res === null) {
          if (resetPage) {
            this.items = [];
            this.hasNext = false;
            this.totalCount = 0;
          }
          return;
        }
        const pageItems = Array.isArray(res.items) ? res.items : [];
        if (resetPage) {
          this.items = pageItems;
        } else {
          this.items = [...this.items, ...pageItems];
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
