import { HttpErrorResponse } from '@angular/common/http';

/** Pulls a human-readable message from API error bodies (FluentValidation, our `{ message }` payloads, ProblemDetails). */
export function apiErrorDetail(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      const msg = o['message'];
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
      const errors = o['errors'];
      if (errors && typeof errors === 'object') {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(errors as Record<string, unknown>)) {
          if (Array.isArray(val)) {
            for (const line of val) {
              if (typeof line === 'string' && line.trim()) parts.push(`${key}: ${line.trim()}`);
            }
          } else if (typeof val === 'string' && val.trim()) {
            parts.push(`${key}: ${val.trim()}`);
          }
        }
        if (parts.length) return parts.join(' ');
      }
      const title = o['title'];
      if (typeof title === 'string' && title.trim()) return title.trim();
    }
    if (err.status === 0) return 'Network error — check your connection and API base URL.';
    if (err.status >= 500) {
      return 'Server error — check API logs and that database migrations are applied (e.g. checkup_templates.template_html).';
    }
    return err.statusText?.trim() || `HTTP ${err.status}`;
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}
