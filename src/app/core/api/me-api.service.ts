import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { AllowedModulesResponse, Hospital, MeResponse, UpdateHospitalRequest } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class MeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/Me`);
  }

  getAllowedModules(): Observable<AllowedModulesResponse> {
    return this.http.get<AllowedModulesResponse>(`${this.base}/Me/allowed-modules`);
  }

  getMyHospital(): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.base}/Me/hospital`);
  }

  updateMyHospital(body: UpdateHospitalRequest): Observable<Hospital> {
    return this.http.put<Hospital>(`${this.base}/Me/hospital`, body);
  }
}
