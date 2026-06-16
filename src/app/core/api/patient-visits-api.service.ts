import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  CreatePatientVisitRequest,
  FinancialSummaryResponse,
  PatientVisitRegisterLogPage,
  PatientVisitResponse,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class PatientVisitsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  create(body: CreatePatientVisitRequest): Observable<PatientVisitResponse> {
    return this.http.post<PatientVisitResponse>(`${this.base}/clinical/patient-visits`, body);
  }

  getById(id: number): Observable<PatientVisitResponse> {
    return this.http.get<PatientVisitResponse>(`${this.base}/clinical/patient-visits/${id}`);
  }

  /** Visit history for the hospital: defaults to UTC today; optional date range and patient filter. */
  getRegisterLog(params: {
    fromDate?: string;
    toDate?: string;
    patientId?: number;
    consultancyType?: string;
    branchId?: number;
    page?: number;
    pageSize?: number;
  }): Observable<PatientVisitRegisterLogPage> {
    let hp = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.fromDate) {
      hp = hp.set('fromDate', params.fromDate);
    }
    if (params.toDate) {
      hp = hp.set('toDate', params.toDate);
    }
    if (params.patientId != null && params.patientId > 0) {
      hp = hp.set('patientId', String(params.patientId));
    }
    if (params.consultancyType) {
      hp = hp.set('consultancyType', params.consultancyType);
    }
    if (params.branchId != null && params.branchId > 0) {
      hp = hp.set('branchId', String(params.branchId));
    }
    return this.http.get<PatientVisitRegisterLogPage>(`${this.base}/clinical/patient-visits`, {
      params: hp,
    });
  }

  getFinancialSummary(params: {
    fromDate?: string;
    toDate?: string;
    branchId?: number;
  } = {}): Observable<FinancialSummaryResponse> {
    let hp = new HttpParams();
    if (params.fromDate) {
      hp = hp.set('fromDate', params.fromDate);
    }
    if (params.toDate) {
      hp = hp.set('toDate', params.toDate);
    }
    if (params.branchId != null && params.branchId > 0) {
      hp = hp.set('branchId', String(params.branchId));
    }
    return this.http.get<FinancialSummaryResponse>(
      `${this.base}/clinical/patient-visits/financial-summary`,
      { params: hp },
    );
  }
}
