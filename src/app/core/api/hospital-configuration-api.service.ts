import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  HospitalConfiguration,
  UpdateHospitalConfigurationRequest,
} from '../models/api-contracts';

/**
 * Hospital-admin configuration console API. Always operates on the caller's own
 * hospital (resolved from the JWT server-side) — no hospital id is ever sent.
 */
@Injectable({ providedIn: 'root' })
export class HospitalConfigurationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /** Schema + effective values, restricted server-side to categories the caller may view. */
  getSettings(): Observable<HospitalConfiguration> {
    return this.http.get<HospitalConfiguration>(`${this.base}/hospital-configuration/settings`);
  }

  /** Atomic bulk update; requires Edit permission on every touched category. */
  updateSettings(body: UpdateHospitalConfigurationRequest): Observable<HospitalConfiguration> {
    return this.http.put<HospitalConfiguration>(`${this.base}/hospital-configuration/settings`, body);
  }

  saveRegistrationSlip(templateJson: string): Observable<void> {
    return this.http.put<void>(`${this.base}/hospital-configuration/registration-slip`, {
      templateJson,
    });
  }

  savePrescriptionSlip(templateJson: string): Observable<void> {
    return this.http.put<void>(`${this.base}/hospital-configuration/prescription-slip`, {
      templateJson,
    });
  }
}
