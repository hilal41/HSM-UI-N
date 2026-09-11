import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { MeApiService } from '../api/me-api.service';

/** User-scoped module access derived from role + hospital menu licensing (not legacy hospital modules). */
@Injectable({ providedIn: 'root' })
export class ModuleAccessService {
  private readonly meApi = inject(MeApiService);
  private readonly enabledCodesSignal = signal<Set<string>>(new Set());
  private loaded = false;

  readonly enabledCodes = this.enabledCodesSignal.asReadonly();

  hasModule(code: string): boolean {
    // Fail-closed: while permissions are still loading, deny access rather than
    // briefly showing/allowing modules the user may not actually be licensed for.
    if (!this.loaded) return false;
    return this.enabledCodesSignal().has(code);
  }

  readonly hasLaboratory = computed(() => this.hasModule('Laboratory'));
  readonly hasClinical = computed(() => this.hasModule('Clinical'));

  load(): void {
    if (this.loaded) return;
    this.meApi
      .getAllowedModules()
      .pipe(
        tap((res) => {
          this.enabledCodesSignal.set(new Set(res.modules?.map((m) => m.code) ?? []));
          this.loaded = true;
        }),
        catchError(() => {
          this.loaded = true;
          return of(null);
        }),
      )
      .subscribe();
  }

  refresh(modules: { code: string }[]): void {
    this.enabledCodesSignal.set(new Set(modules.map((m) => m.code)));
    this.loaded = true;
  }
}
