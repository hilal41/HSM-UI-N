import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  getLibrary(): Observable<CheckupTemplate[]> {
    return this.http.get<CheckupTemplate[]>(`${this.base}/clinical/checkup-templates/library`);
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
