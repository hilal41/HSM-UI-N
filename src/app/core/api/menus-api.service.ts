import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { AppMenu, AppMenuTree, CreateMenuRequest, UpdateMenuRequest } from '../models/api-contracts';
import { API_BASE_URL } from '../tokens/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class MenusApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getTree(activeOnly = true): Observable<AppMenuTree[]> {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<AppMenuTree[]>(`${this.base}/Menus/tree`, { params });
  }

  getById(id: number): Observable<AppMenu> {
    return this.http.get<AppMenu>(`${this.base}/Menus/${id}`);
  }

  create(body: CreateMenuRequest): Observable<AppMenu> {
    return this.http.post<AppMenu>(`${this.base}/Menus`, body);
  }

  update(id: number, body: UpdateMenuRequest): Observable<AppMenu> {
    return this.http.put<AppMenu>(`${this.base}/Menus/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Menus/${id}`);
  }
}
