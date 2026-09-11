import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  LabOrderEvent,
  LabOrderLine,
  LabOrderResponse,
  UpdateLabOrderPriorityRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class LabOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getById(id: number): Observable<LabOrderResponse> {
    return this.http.get<LabOrderResponse>(`${this.base}/laboratory/orders/${id}`);
  }

  getEvents(orderId: number): Observable<LabOrderEvent[]> {
    return this.http.get<LabOrderEvent[]>(`${this.base}/laboratory/orders/${orderId}/events`);
  }

  updatePriority(orderId: number, body: UpdateLabOrderPriorityRequest): Observable<LabOrderResponse> {
    return this.http.patch<LabOrderResponse>(`${this.base}/laboratory/orders/${orderId}/priority`, body);
  }

  /** POST laboratory/orders/lines/{id}/print */
  markLinePrinted(lineId: number): Observable<LabOrderLine> {
    return this.http.post<LabOrderLine>(`${this.base}/laboratory/orders/lines/${lineId}/print`, {});
  }
}
