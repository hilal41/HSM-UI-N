import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateMedicineRequest,
  Medicine,
  MedicineImportResult,
  PagedResponse,
  UpdateMedicineRequest,
} from '../models/api-contracts';

export interface MedicinesQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  /** When true, only active medicines (e.g. doctor checkup picker). */
  activeOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MedicinesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /**
   * Medicine search API (paged list). Query: `search`, `page`, `pageSize`, optional `activeOnly`.
   * Calls `GET .../clinical/medicines`.
   */
  getPaged(query: MedicinesQuery = {}): Observable<PagedResponse<Medicine>> {
    return this.http.get<PagedResponse<Medicine>>(`${this.base}/clinical/medicines`, {
      params: this.medicinesListParams(query),
    });
  }

  /**
   * Same response and query params as {@link getPaged}. Calls `GET .../clinical/medicines/search`
   * so the URL explicitly documents “search” for other developers and API catalogs.
   */
  searchPaged(query: MedicinesQuery = {}): Observable<PagedResponse<Medicine>> {
    return this.http.get<PagedResponse<Medicine>>(`${this.base}/clinical/medicines/search`, {
      params: this.medicinesListParams(query),
    });
  }

  private medicinesListParams(query: MedicinesQuery): HttpParams {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    if (query.activeOnly === true) params = params.set('activeOnly', 'true');
    return params;
  }

  getById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.base}/clinical/medicines/${id}`);
  }

  create(body: CreateMedicineRequest): Observable<Medicine> {
    return this.http.post<Medicine>(`${this.base}/clinical/medicines`, body);
  }

  update(id: number, body: UpdateMedicineRequest): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.base}/clinical/medicines/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/medicines/${id}`);
  }

  /** GET /clinical/medicines/export — same filters as the table (search, activeOnly). */
  exportExcel(query: { search?: string; activeOnly?: boolean } = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.activeOnly === true) params = params.set('activeOnly', 'true');
    return this.http.get(`${this.base}/clinical/medicines/export`, {
      params,
      responseType: 'blob',
    });
  }

  /** POST /clinical/medicines/import — multipart field name `file` (.xlsx). */
  importExcel(file: File, hospitalId?: number): Observable<MedicineImportResult> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    let params = new HttpParams();
    if (hospitalId != null && hospitalId > 0) {
      params = params.set('hospitalId', String(hospitalId));
    }
    return this.http.post<MedicineImportResult>(`${this.base}/clinical/medicines/import`, fd, { params });
  }
}
