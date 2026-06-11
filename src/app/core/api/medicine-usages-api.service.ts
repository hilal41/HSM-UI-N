import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateMedicineUsageRequest,
  MedicineUsage,
  PagedResponse,
  UpdateMedicineUsageRequest,
} from '../models/api-contracts';

export interface MedicineUsagesQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class MedicineUsagesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(query: MedicineUsagesQuery = {}): Observable<PagedResponse<MedicineUsage>> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<MedicineUsage>>(`${this.base}/clinical/medicine-usages`, {
      params,
    });
  }

  getById(id: number): Observable<MedicineUsage> {
    return this.http.get<MedicineUsage>(`${this.base}/clinical/medicine-usages/${id}`);
  }

  create(body: CreateMedicineUsageRequest): Observable<MedicineUsage> {
    return this.http.post<MedicineUsage>(`${this.base}/clinical/medicine-usages`, body);
  }

  update(id: number, body: UpdateMedicineUsageRequest): Observable<MedicineUsage> {
    return this.http.put<MedicineUsage>(`${this.base}/clinical/medicine-usages/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/medicine-usages/${id}`);
  }
}
