import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { Module, PagedResponse } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class ModulesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(activeOnly = false): Observable<Module[]> {
    let params = new HttpParams().set('page', '1').set('pageSize', '100');
    if (activeOnly) params = params.set('activeOnly', 'true');
    return this.http
      .get<PagedResponse<Module>>(`${this.base}/Modules`, { params })
      .pipe(map((res) => res.items ?? []));
  }

  getById(id: number): Observable<Module> {
    return this.http.get<Module>(`${this.base}/Modules/${id}`);
  }
}
