import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateServiceCategoryRequest,
  PagedResponse,
  ServiceCategory,
  UpdateServiceCategoryRequest,
} from '../models/api-contracts';

export interface ServiceCategoriesQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ServiceCategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(query: ServiceCategoriesQuery = {}): Observable<PagedResponse<ServiceCategory>> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<ServiceCategory>>(`${this.base}/clinical/service-categories`, {
      params,
    });
  }

  getById(id: number): Observable<ServiceCategory> {
    return this.http.get<ServiceCategory>(`${this.base}/clinical/service-categories/${id}`);
  }

  create(body: CreateServiceCategoryRequest): Observable<ServiceCategory> {
    return this.http.post<ServiceCategory>(`${this.base}/clinical/service-categories`, body);
  }

  update(id: number, body: UpdateServiceCategoryRequest): Observable<ServiceCategory> {
    return this.http.put<ServiceCategory>(`${this.base}/clinical/service-categories/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/service-categories/${id}`);
  }
}
