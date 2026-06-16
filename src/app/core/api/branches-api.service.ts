import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  Branch,
  BranchSummary,
  CreateBranchRequest,
  UpdateBranchRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class BranchesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(status?: string): Observable<Branch[]> {
    const params = status ? { params: { status } } : {};
    return this.http.get<Branch[]>(`${this.base}/branches`, params);
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
