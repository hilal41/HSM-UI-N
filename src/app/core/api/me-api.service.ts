import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  AllowedModulesResponse,
  AppMenuTree,
  Hospital,
  MeResponse,
  UpdateHospitalRequest,
  UpdateMyProfileRequest,
  User,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class MeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/Me`);
  }

  getAllowedModules(): Observable<AllowedModulesResponse> {
    return this.http.get<AllowedModulesResponse>(`${this.base}/Me/allowed-modules`);
  }

  getMenus(): Observable<AppMenuTree[]> {
    return this.http.get<AppMenuTree[]>(`${this.base}/Me/menus`);
  }

  getMyHospital(): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.base}/Me/hospital`);
  }

  updateMyHospital(body: UpdateHospitalRequest): Observable<Hospital> {
    return this.http.put<Hospital>(`${this.base}/Me/hospital`, body);
  }

  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/Me/profile`);
  }

  updateMyProfile(body: UpdateMyProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/Me/profile`, body);
  }
}
