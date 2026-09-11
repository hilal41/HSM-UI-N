import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  LabCompletedReportRow,
  LabDailyVolumeRow,
  LabOrderLine,
  LabPendingSummary,
  LabWorklistItem,
  PagedResponse,
  SaveLabResultRequest,
  UpdateLabOrderLineStatusRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class LabWorklistApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getWorklist(query: {
    fromDate?: string;
    toDate?: string;
    status?: string;
    priority?: string;
    search?: string;
    patientId?: number;
    branchId?: number;
    page?: number;
    pageSize?: number;
  } = {}): Observable<PagedResponse<LabWorklistItem>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 25));
    if (query.fromDate) params = params.set('fromDate', query.fromDate);
    if (query.toDate) params = params.set('toDate', query.toDate);
    if (query.status) params = params.set('status', query.status);
    if (query.priority) params = params.set('priority', query.priority);
    if (query.search) params = params.set('search', query.search);
    if (query.patientId != null) params = params.set('patientId', String(query.patientId));
    if (query.branchId != null) params = params.set('branchId', String(query.branchId));
    return this.http.get<PagedResponse<LabWorklistItem>>(`${this.base}/laboratory/worklist`, { params });
  }

  collectSpecimen(lineId: number): Observable<LabOrderLine> {
    return this.http.post<LabOrderLine>(`${this.base}/laboratory/worklist/lines/${lineId}/collect`, {});
  }

  enterResult(lineId: number, body: SaveLabResultRequest): Observable<LabOrderLine> {
    return this.http.post<LabOrderLine>(`${this.base}/laboratory/worklist/lines/${lineId}/result`, body);
  }

  verifyResult(lineId: number): Observable<LabOrderLine> {
    return this.http.post<LabOrderLine>(`${this.base}/laboratory/worklist/lines/${lineId}/verify`, {});
  }

  releaseResult(lineId: number): Observable<LabOrderLine> {
    return this.http.post<LabOrderLine>(`${this.base}/laboratory/worklist/lines/${lineId}/release`, {});
  }

  updateLineStatus(lineId: number, body: UpdateLabOrderLineStatusRequest): Observable<LabOrderLine> {
    return this.http.post<LabOrderLine>(`${this.base}/laboratory/worklist/lines/${lineId}/status`, body);
  }

  getPendingSummary(): Observable<LabPendingSummary> {
    return this.http.get<LabPendingSummary>(`${this.base}/laboratory/reports/pending-summary`);
  }

  getCompletedReport(from: string, to: string): Observable<LabCompletedReportRow[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<LabCompletedReportRow[]>(`${this.base}/laboratory/reports/completed`, { params });
  }

  getDailyVolume(from: string, to: string): Observable<LabDailyVolumeRow[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<LabDailyVolumeRow[]>(`${this.base}/laboratory/reports/daily-volume`, { params });
  }
}
