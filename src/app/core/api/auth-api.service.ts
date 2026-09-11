import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ImpersonateRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ResetPasswordRequest,
  SwitchBranchRequest,
} from '../models/api-contracts';
import { AuthSessionService } from '../services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly session = inject(AuthSessionService);

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body);
  }

  refreshToken(body: RefreshTokenRequest): Observable<LoginResponse> {
    const branchId = body.branchId ?? this.session.activeBranchId() ?? undefined;
    const payload: RefreshTokenRequest =
      branchId != null ? { ...body, branchId } : body;
    return this.http.post<LoginResponse>(`${this.base}/auth/refresh-token`, payload);
  }

  logout(body: RefreshTokenRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout`, body);
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/auth/change-password`, body);
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.base}/auth/forgot-password`, body);
  }

  resetPassword(body: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/reset-password`, body);
  }

  switchBranch(body: SwitchBranchRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/switch-branch`, body);
  }

  impersonate(body: ImpersonateRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/impersonate`, body);
  }
}
