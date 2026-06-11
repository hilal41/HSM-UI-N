import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { Module } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class ModulesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.base}/Modules`);
  }

  getById(id: number): Observable<Module> {
    return this.http.get<Module>(`${this.base}/Modules/${id}`);
  }
}
