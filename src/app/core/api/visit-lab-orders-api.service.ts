import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { LabOrderSaveResponse, SaveVisitLabOrderRequest } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class VisitLabOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getForVisit(visitId: number): Observable<LabOrderSaveResponse> {
    return this.http.get<LabOrderSaveResponse>(
      `${this.base}/clinical/patient-visits/${visitId}/lab-orders`,
    );
  }

  save(visitId: number, body: SaveVisitLabOrderRequest): Observable<LabOrderSaveResponse> {
    return this.http.post<LabOrderSaveResponse>(
      `${this.base}/clinical/patient-visits/${visitId}/lab-orders/save`,
      body,
    );
  }
}
