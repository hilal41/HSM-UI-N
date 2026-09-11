import type { TableLazyLoadEvent } from 'primeng/table';

/** Shared lazy-table paging helpers for list/dialog CRUD pages. */
export function normalizeLazyPage(
  event: TableLazyLoadEvent,
  defaultPageSize = 20,
): { page: number; pageSize: number; first: number } {
  const pageSize = event.rows && event.rows > 0 ? event.rows : defaultPageSize;
  const first = event.first ?? 0;
  const page = Math.floor(first / pageSize) + 1;
  return { page, pageSize, first };
}

/** Dialog open/edit/close state used across patients/users/doctors/hospitals CRUD. */
export class CrudDialogState {
  open = false;
  saving = false;
  editingId: number | null = null;

  get isEdit(): boolean {
    return this.editingId != null;
  }

  beginCreate(): void {
    this.editingId = null;
    this.saving = false;
    this.open = true;
  }

  beginEdit(id: number): void {
    this.editingId = id;
    this.saving = false;
    this.open = true;
  }

  close(): void {
    this.open = false;
    this.saving = false;
    this.editingId = null;
  }
}

/** Paged list state for PrimeNG lazy tables. */
export class CrudListState<T> {
  rows: T[] = [];
  totalCount = 0;
  /** Lazy tables fire `onLazyLoad` on init — start loading to avoid NG0100. */
  loading = true;
  errorMessage: string | null = null;
  /** Active rows-per-page (updates when the user changes the paginator dropdown). */
  tablePageSize: number;
  /** Cached paginator visibility — updated when list data changes (not a getter). */
  showPaginator = false;

  constructor(readonly defaultPageSize = 20) {
    this.tablePageSize = defaultPageSize;
  }

  /** @deprecated Use `defaultPageSize`. */
  get pageSize(): number {
    return this.defaultPageSize;
  }

  /** Hide paginator when the list is empty or fits on one page. */
  private refreshShowPaginator(): void {
    this.showPaginator = showCrudPaginator(this.totalCount, this.tablePageSize);
  }

  /** Sync `tablePageSize` from a lazy-load event and return normalized paging. */
  syncLazyEvent(event: TableLazyLoadEvent): { page: number; pageSize: number; first: number } {
    const normalized = normalizeLazyPage(event, this.defaultPageSize);
    this.tablePageSize = normalized.pageSize;
    this.refreshShowPaginator();
    return normalized;
  }

  beginLoad(): void {
    this.loading = true;
    this.errorMessage = null;
  }

  applySuccess(items: T[], totalCount: number): void {
    this.rows = items;
    this.totalCount = totalCount;
    this.loading = false;
    this.refreshShowPaginator();
  }

  applyError(message: string): void {
    this.errorMessage = message;
    this.loading = false;
  }
}

/** Show PrimeNG table paginator only when results span more than one page. */
export function showCrudPaginator(totalCount: number, pageSize: number): boolean {
  return totalCount > pageSize;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { error?: unknown } | null;
  const body = e?.error;
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (!body || typeof body !== 'object') return fallback;

  const record = body as {
    message?: string;
    title?: string;
    errors?: Record<string, string[] | string>;
  };
  if (record.message?.trim()) return record.message.trim();
  if (record.errors) {
    const first = Object.values(record.errors)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => String(v).trim())
      .find((v) => v.length > 0);
    if (first) return first;
  }
  if (record.title?.trim()) return record.title.trim();
  return fallback;
}
