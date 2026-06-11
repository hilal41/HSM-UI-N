import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { Role } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}/Roles`);
  }

  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.base}/Roles/${id}`);
  }
}
