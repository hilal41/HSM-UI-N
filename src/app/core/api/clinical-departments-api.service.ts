import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateDepartmentRequest,
  Department,
  PagedResponse,
  UpdateDepartmentRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class ClinicalDepartmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(): Observable<Department[]> {
    const params = new HttpParams().set('page', '1').set('pageSize', '100');
    return this.http
      .get<PagedResponse<Department>>(`${this.base}/clinical/departments`, { params })
      .pipe(map((res) => res.items ?? []));
  }

  getById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.base}/clinical/departments/${id}`);
  }

  create(body: CreateDepartmentRequest): Observable<Department> {
    return this.http.post<Department>(`${this.base}/clinical/departments`, body);
  }

  update(id: number, body: UpdateDepartmentRequest): Observable<Department> {
    return this.http.put<Department>(`${this.base}/clinical/departments/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/departments/${id}`);
  }
}
