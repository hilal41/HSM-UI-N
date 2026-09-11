import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { Bed, CreateBedRequest, PagedResponse, UpdateBedRequest } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class BedsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(wardId?: number, status?: string, page = 1, pageSize = 100): Observable<Bed[]> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (wardId != null) params = params.set('wardId', String(wardId));
    if (status) params = params.set('status', status);
    return this.http
      .get<PagedResponse<Bed>>(`${this.base}/clinical/beds`, { params })
      .pipe(map((r) => r.items ?? []));
  }

  getAvailable(wardId: number): Observable<Bed[]> {
    return this.http.get<Bed[]>(`${this.base}/clinical/beds/available/${wardId}`);
  }

  create(body: CreateBedRequest): Observable<Bed> {
    return this.http.post<Bed>(`${this.base}/clinical/beds`, body);
  }

  update(id: number, body: UpdateBedRequest): Observable<Bed> {
    return this.http.put<Bed>(`${this.base}/clinical/beds/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/beds/${id}`);
  }
}
