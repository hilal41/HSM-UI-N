import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ResetPasswordRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, body);
  }

  refreshToken(body: RefreshTokenRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/refresh-token`, body);
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
}
