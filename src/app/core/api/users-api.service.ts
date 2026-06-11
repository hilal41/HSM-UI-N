import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  AssignRoleRequest,
  CreateUserRequest,
  Department,
  Module,
  PagedResponse,
  SetUserDepartmentsRequest,
  SetUserModulesRequest,
  UpdateUserRequest,
  User,
  UserDetail,
} from '../models/api-contracts';

export interface UsersQuery {
  isActive?: boolean;
  roleId?: number;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPaged(query: UsersQuery = {}): Observable<PagedResponse<User>> {
    let params = new HttpParams();
    if (query.isActive != null) params = params.set('isActive', String(query.isActive));
    if (query.roleId != null) params = params.set('roleId', String(query.roleId));
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 20));
    return this.http.get<PagedResponse<User>>(`${this.base}/Users`, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/Users/${id}`);
  }

  getDetail(id: number): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.base}/Users/${id}/detail`);
  }

  create(body: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/Users`, body);
  }

  update(id: number, body: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/Users/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Users/${id}`);
  }

  assignRole(id: number, body: AssignRoleRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}/role`, body);
  }

  getDepartments(id: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/Users/${id}/departments`);
  }

  setDepartments(id: number, body: SetUserDepartmentsRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}/departments`, body);
  }

  getModules(id: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.base}/Users/${id}/modules`);
  }

  setModules(id: number, body: SetUserModulesRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}/modules`, body);
  }
}
