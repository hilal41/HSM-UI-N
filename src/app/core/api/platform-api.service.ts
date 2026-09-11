import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ApplyMenuPackageRequest,
  AuditLog,
  CreateMenuPackageRequest,
  CreatePlatformUserRequest,
  MenuPackage,
  PagedResponse,
  PlatformSummary,
  UpdateMenuPackageRequest,
  UpdatePlatformUserRequest,
  User,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/platform`;

  getSummary(): Observable<PlatformSummary> {
    return this.http.get<PlatformSummary>(`${this.base}/summary`);
  }

  getUsers(page: number, pageSize: number, isActive?: boolean): Observable<PagedResponse<User>> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (isActive != null) params = params.set('isActive', String(isActive));
    return this.http.get<PagedResponse<User>>(`${this.base}/users`, { params });
  }

  createUser(body: CreatePlatformUserRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, body);
  }

  updateUser(id: number, body: UpdatePlatformUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/users/${id}`, body);
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  getAuditLogs(
    page: number,
    pageSize: number,
    entityType?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Observable<PagedResponse<AuditLog>> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (entityType?.trim()) params = params.set('entityType', entityType.trim());
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    return this.http.get<PagedResponse<AuditLog>>(`${this.base}/audit-logs`, { params });
  }

  getPackages(activeOnly = false): Observable<MenuPackage[]> {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<MenuPackage[]>(`${this.base}/packages`, { params });
  }

  createPackage(body: CreateMenuPackageRequest): Observable<MenuPackage> {
    return this.http.post<MenuPackage>(`${this.base}/packages`, body);
  }

  updatePackage(id: number, body: UpdateMenuPackageRequest): Observable<MenuPackage> {
    return this.http.put<MenuPackage>(`${this.base}/packages/${id}`, body);
  }

  deletePackage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/packages/${id}`);
  }

  applyPackage(
    packageId: number,
    hospitalId: number,
    body: ApplyMenuPackageRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.base}/packages/${packageId}/apply/${hospitalId}`, body);
  }
}
