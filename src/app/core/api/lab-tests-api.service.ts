import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { itemsFromPaged } from '../../shared/utils/ensure-array';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  LabTest,
  LabTestCategory,
  PagedResponse,
} from '../models/api-contracts';

export interface CreateLabTestCategoryRequest {
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateLabTestCategoryRequest = CreateLabTestCategoryRequest;

@Injectable({ providedIn: 'root' })
export class LabTestsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(query: {
    search?: string;
    page?: number;
    pageSize?: number;
    activeOnly?: boolean;
  } = {}): Observable<PagedResponse<LabTest>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));
    if (query.search) params = params.set('search', query.search);
    if (query.activeOnly) params = params.set('activeOnly', 'true');
    return this.http.get<PagedResponse<LabTest>>(`${this.base}/laboratory/tests`, { params });
  }

  getCategories(pageSize = 500): Observable<LabTestCategory[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('pageSize', String(pageSize));
    return this.http
      .get<PagedResponse<LabTestCategory>>(`${this.base}/laboratory/tests/categories`, { params })
      .pipe(map((res) => itemsFromPaged(res)));
  }

  createCategory(body: CreateLabTestCategoryRequest): Observable<LabTestCategory> {
    return this.http.post<LabTestCategory>(`${this.base}/laboratory/tests/categories`, body);
  }

  updateCategory(id: number, body: UpdateLabTestCategoryRequest): Observable<LabTestCategory> {
    return this.http.put<LabTestCategory>(`${this.base}/laboratory/tests/categories/${id}`, body);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/laboratory/tests/categories/${id}`);
  }
}
