import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateWardRequest,
  PagedResponse,
  UpdateWardRequest,
  Ward,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class WardsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(departmentId?: number, page = 1, pageSize = 100): Observable<Ward[]> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (departmentId != null) params = params.set('departmentId', String(departmentId));
    return this.http
      .get<PagedResponse<Ward>>(`${this.base}/clinical/wards`, { params })
      .pipe(map((r) => r.items ?? []));
  }

  getByDepartment(departmentId: number): Observable<Ward[]> {
    return this.http.get<Ward[]>(`${this.base}/clinical/wards/by-department/${departmentId}`);
  }

  create(body: CreateWardRequest): Observable<Ward> {
    return this.http.post<Ward>(`${this.base}/clinical/wards`, body);
  }

  update(id: number, body: UpdateWardRequest): Observable<Ward> {
    return this.http.put<Ward>(`${this.base}/clinical/wards/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/wards/${id}`);
  }
}
