import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateRoleRequest,
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
    return this.http.get<Role[]>(`${this.base}/Roles`);
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
