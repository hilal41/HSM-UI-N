import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { CreateDoctorRequest, Doctor, DoctorImportResult, PagedResponse, UpdateDoctorRequest } from '../models/api-contracts';

export interface DoctorsQuery {
  departmentId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class DoctorsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(query: DoctorsQuery = {}): Observable<PagedResponse<Doctor>> {
    let params = new HttpParams();
    if (query.departmentId != null) params = params.set('departmentId', String(query.departmentId));
    if (query.status) params = params.set('status', query.status);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<Doctor>>(`${this.base}/clinical/doctors`, { params });
  }

  getById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.base}/clinical/doctors/${id}`);
  }

  create(body: CreateDoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.base}/clinical/doctors`, body);
  }

  update(id: number, body: UpdateDoctorRequest): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.base}/clinical/doctors/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/doctors/${id}`);
  }

  /** GET /clinical/doctors/export */
  exportExcel(query: { departmentId?: number; status?: string } = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.departmentId != null) params = params.set('departmentId', String(query.departmentId));
    if (query.status) params = params.set('status', query.status);
    return this.http.get(`${this.base}/clinical/doctors/export`, {
      params,
      responseType: 'blob',
    });
  }

  /** POST /clinical/doctors/import — multipart field name `file` (.xlsx). */
  importExcel(file: File): Observable<DoctorImportResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<DoctorImportResult>(`${this.base}/clinical/doctors/import`, fd);
  }
}
