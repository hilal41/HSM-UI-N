import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreateHospitalRequest,
  Hospital,
  Module,
  SetHospitalModulesRequest,
  UpdateHospitalRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class HospitalsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(status?: string): Observable<Hospital[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Hospital[]>(`${this.base}/Hospitals`, { params });
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

  getModules(id: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.base}/Hospitals/${id}/modules`);
  }

  setModules(id: number, body: SetHospitalModulesRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/Hospitals/${id}/modules`, body);
  }
}
