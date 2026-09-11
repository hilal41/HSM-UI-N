import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  Branch,
  BranchSummary,
  CreateBranchRequest,
  PagedResponse,
  UpdateBranchRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class BranchesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /** Full list for dropdowns / admin tables (API is paged; requests max page size). */
  getAll(status?: string, hospitalId?: number): Observable<Branch[]> {
    let params = new HttpParams().set('page', '1').set('pageSize', '100');
    if (status) params = params.set('status', status);
    if (hospitalId != null) params = params.set('hospitalId', String(hospitalId));
    return this.http
      .get<PagedResponse<Branch>>(`${this.base}/branches`, { params })
      .pipe(map((res) => res.items ?? []));
  }

  getPaged(query: {
    status?: string;
    hospitalId?: number;
    page?: number;
    pageSize?: number;
  } = {}): Observable<PagedResponse<Branch>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));
    if (query.status) params = params.set('status', query.status);
    if (query.hospitalId != null) params = params.set('hospitalId', String(query.hospitalId));
    return this.http.get<PagedResponse<Branch>>(`${this.base}/branches`, { params });
  }

  getById(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.base}/branches/${id}`);
  }

  create(body: CreateBranchRequest): Observable<Branch> {
    return this.http.post<Branch>(`${this.base}/branches`, body);
  }

  update(id: number, body: UpdateBranchRequest): Observable<Branch> {
    return this.http.put<Branch>(`${this.base}/branches/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/branches/${id}`);
  }

  getMyBranches(): Observable<BranchSummary[]> {
    return this.http.get<BranchSummary[]>(`${this.base}/Me/branches`);
  }
}
