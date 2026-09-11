import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateRoleRequest,
  PagedResponse,
  Role,
  RoleDetail,
  SetRoleMenusRequest,
  UpdateRoleRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(): Observable<Role[]> {
    const params = new HttpParams().set('page', '1').set('pageSize', '100');
    return this.http
      .get<PagedResponse<Role>>(`${this.base}/Roles`, { params })
      .pipe(map((res) => res.items ?? []));
  }

  /** For user create/edit dropdown; allowed with Users view permission. */
  getForAssignment(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}/Roles/for-assignment`);
  }

  getById(id: number): Observable<RoleDetail> {
    return this.http.get<RoleDetail>(`${this.base}/Roles/${id}`);
  }

  create(body: CreateRoleRequest): Observable<RoleDetail> {
    return this.http.post<RoleDetail>(`${this.base}/Roles`, body);
  }

  update(id: number, body: UpdateRoleRequest): Observable<RoleDetail> {
    return this.http.put<RoleDetail>(`${this.base}/Roles/${id}`, body);
  }

  setMenus(id: number, body: SetRoleMenusRequest): Observable<RoleDetail> {
    return this.http.put<RoleDetail>(`${this.base}/Roles/${id}/menus`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Roles/${id}`);
  }
}
