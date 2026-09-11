import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ClinicalService,
  ClinicalServiceLabProfile,
  CreateClinicalServiceRequest,
  PagedResponse,
  SaveClinicalServiceLabProfileRequest,
  UpdateClinicalServiceRequest,
} from '../models/api-contracts';

export interface ClinicalServicesQuery {
  serviceCategoryId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ClinicalServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(query: ClinicalServicesQuery = {}): Observable<PagedResponse<ClinicalService>> {
    let params = new HttpParams();
    if (query.serviceCategoryId != null) {
      params = params.set('serviceCategoryId', String(query.serviceCategoryId));
    }
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<ClinicalService>>(`${this.base}/clinical/services`, { params });
  }

  getById(id: number): Observable<ClinicalService> {
    return this.http.get<ClinicalService>(`${this.base}/clinical/services/${id}`);
  }

  create(body: CreateClinicalServiceRequest): Observable<ClinicalService> {
    return this.http.post<ClinicalService>(`${this.base}/clinical/services`, body);
  }

  update(id: number, body: UpdateClinicalServiceRequest): Observable<ClinicalService> {
    return this.http.put<ClinicalService>(`${this.base}/clinical/services/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clinical/services/${id}`);
  }

  getLabProfile(serviceId: number): Observable<ClinicalServiceLabProfile> {
    return this.http.get<ClinicalServiceLabProfile>(`${this.base}/clinical/services/${serviceId}/lab-profile`);
  }

  saveLabProfile(serviceId: number, body: SaveClinicalServiceLabProfileRequest): Observable<ClinicalServiceLabProfile> {
    return this.http.put<ClinicalServiceLabProfile>(`${this.base}/clinical/services/${serviceId}/lab-profile`, body);
  }
}
