import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateHospitalRequest,
  Hospital,
  MenuSummary,
  PagedResponse,
  ResetHospitalAdminPasswordRequest,
  ResetHospitalAdminPasswordResponse,
  SetHospitalMenusRequest,
  UpdateHospitalRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class HospitalsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(status?: string): Observable<Hospital[]> {
    let params = new HttpParams().set('page', '1').set('pageSize', '100');
    if (status) params = params.set('status', status);
    return this.http
      .get<PagedResponse<Hospital>>(`${this.base}/Hospitals`, { params })
      .pipe(map((res) => res.items ?? []));
  }

  getById(id: number): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.base}/Hospitals/${id}`);
  }

  create(body: CreateHospitalRequest): Observable<Hospital> {
    return this.http.post<Hospital>(`${this.base}/Hospitals`, body);
  }

  update(id: number, body: UpdateHospitalRequest): Observable<Hospital> {
    return this.http.put<Hospital>(`${this.base}/Hospitals/${id}`, body);
  }

  softDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Hospitals/${id}`);
  }

  getMenus(id: number): Observable<MenuSummary[]> {
    return this.http.get<MenuSummary[]>(`${this.base}/Hospitals/${id}/menus`);
  }

  setMenus(id: number, body: SetHospitalMenusRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/Hospitals/${id}/menus`, body);
  }

  resetAdminPassword(
    id: number,
    body: ResetHospitalAdminPasswordRequest,
  ): Observable<ResetHospitalAdminPasswordResponse> {
    return this.http.post<ResetHospitalAdminPasswordResponse>(
      `${this.base}/Hospitals/${id}/reset-admin-password`,
      body,
    );
  }
}
