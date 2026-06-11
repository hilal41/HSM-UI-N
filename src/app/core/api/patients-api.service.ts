import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreatePatientRequest,
  Patient,
  PatientSearchHit,
  PagedResponse,
  UpdatePatientRequest,
} from '../models/api-contracts';

export interface PatientsQuery {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PatientSearchQuery {
  term: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PatientsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  search(query: PatientSearchQuery): Observable<PagedResponse<PatientSearchHit>> {
    const term = query.term.trim();
    let params = new HttpParams().set('Term', term);
    params = params.set('Page', String(query.page ?? 1));
    params = params.set('PageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<PatientSearchHit>>(`${this.base}/clinical/patients/search`, {
      params,
    });
  }

  getPaged(query: PatientsQuery = {}): Observable<PagedResponse<Patient>> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<Patient>>(`${this.base}/clinical/patients`, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.base}/clinical/patients/${id}`);
  }

  create(body: CreatePatientRequest): Observable<Patient> {
    return this.http.post<Patient>(`${this.base}/clinical/patients`, body);
  }

  update(id: number, body: UpdatePatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.base}/clinical/patients/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/patients/${id}`);
  }
}
