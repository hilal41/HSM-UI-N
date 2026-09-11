import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { itemsFromPaged } from '../../shared/utils/ensure-array';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CheckupTemplate,
  CreateCheckupTemplateRequest,
  PagedResponse,
  UpdateCheckupTemplateRequest,
} from '../models/api-contracts';

export interface CheckupTemplatesQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CheckupTemplatesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /** Built-in library templates (5 per hospital), ordered. */
  getLibrary(pageSize = 100): Observable<CheckupTemplate[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('pageSize', String(pageSize));
    return this.http
      .get<PagedResponse<CheckupTemplate>>(`${this.base}/clinical/checkup-templates/library`, { params })
      .pipe(map((res) => itemsFromPaged(res)));
  }

  getPaged(query: CheckupTemplatesQuery = {}): Observable<PagedResponse<CheckupTemplate>> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 12));
    return this.http.get<PagedResponse<CheckupTemplate>>(`${this.base}/clinical/checkup-templates`, {
      params,
    });
  }

  getById(id: number): Observable<CheckupTemplate> {
    return this.http.get<CheckupTemplate>(`${this.base}/clinical/checkup-templates/${id}`);
  }

  create(body: CreateCheckupTemplateRequest): Observable<CheckupTemplate> {
    return this.http.post<CheckupTemplate>(`${this.base}/clinical/checkup-templates`, body);
  }

  update(id: number, body: UpdateCheckupTemplateRequest): Observable<CheckupTemplate> {
    return this.http.put<CheckupTemplate>(`${this.base}/clinical/checkup-templates/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/checkup-templates/${id}`);
  }
}
