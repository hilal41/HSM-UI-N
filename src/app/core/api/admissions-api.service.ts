import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ActiveInpatient,
  Admission,
  CreateAdmissionRequest,
  DischargeAdmissionRequest,
  EnsureTodayVisitResponse,
  PagedResponse,
  TransferAdmissionRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class AdmissionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(status?: string, patientId?: number, page = 1, pageSize = 50): Observable<Admission[]> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (status) params = params.set('status', status);
    if (patientId != null) params = params.set('patientId', String(patientId));
    return this.http
      .get<PagedResponse<Admission>>(`${this.base}/clinical/admissions`, { params })
      .pipe(map((r) => r.items ?? []));
  }

  getActive(): Observable<ActiveInpatient[]> {
    return this.http.get<ActiveInpatient[]>(`${this.base}/clinical/admissions/active`);
  }

  getById(id: number): Observable<Admission> {
    return this.http.get<Admission>(`${this.base}/clinical/admissions/${id}`);
  }

  create(body: CreateAdmissionRequest): Observable<Admission> {
    return this.http.post<Admission>(`${this.base}/clinical/admissions`, body);
  }

  transfer(id: number, body: TransferAdmissionRequest): Observable<Admission> {
    return this.http.post<Admission>(`${this.base}/clinical/admissions/${id}/transfer`, body);
  }

  discharge(id: number, body: DischargeAdmissionRequest): Observable<Admission> {
    return this.http.post<Admission>(`${this.base}/clinical/admissions/${id}/discharge`, body);
  }

  cancel(id: number): Observable<Admission> {
    return this.http.post<Admission>(`${this.base}/clinical/admissions/${id}/cancel`, {});
  }

  ensureTodayVisit(id: number): Observable<EnsureTodayVisitResponse> {
    return this.http.post<EnsureTodayVisitResponse>(
      `${this.base}/clinical/admissions/${id}/ensure-today-visit`,
      {},
    );
  }
}
