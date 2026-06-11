import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type { BloodTypeOption } from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class BloodTypesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getAll(): Observable<BloodTypeOption[]> {
    return this.http.get<BloodTypeOption[]>(`${this.base}/clinical/blood-types`);
  }
}
