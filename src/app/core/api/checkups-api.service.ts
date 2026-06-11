import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { CheckupSaveResponse, SaveCheckupRequest } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class CheckupsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getForVisitTemplate(visitId: number, templateId: number): Observable<CheckupSaveResponse> {
    const params = new HttpParams().set('templateId', String(templateId));
    return this.http.get<CheckupSaveResponse>(
      `${this.base}/clinical/patient-visits/${visitId}/checkups`,
      { params },
    );
  }

  save(visitId: number, body: SaveCheckupRequest): Observable<CheckupSaveResponse> {
    return this.http.post<CheckupSaveResponse>(
      `${this.base}/clinical/patient-visits/${visitId}/checkups/save`,
      body,
    );
  }
}
