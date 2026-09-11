import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import type {
  ApplicationSettings,
  LoginHeroImage,
  PublicApplicationSettings,
  UpdateApplicationSettingsRequest,
  UpdateLoginHeroImageRequest,
} from '../models/api-contracts';

@Injectable({ providedIn: 'root' })
export class ApplicationConfigurationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  getPublicSettings(): Observable<PublicApplicationSettings> {
    return this.http.get<PublicApplicationSettings>(`${this.base}/application-configuration/settings/public`);
  }

  getSettings(): Observable<ApplicationSettings> {
    return this.http.get<ApplicationSettings>(`${this.base}/application-configuration/settings`);
  }

  updateSettings(body: UpdateApplicationSettingsRequest): Observable<ApplicationSettings> {
    return this.http.put<ApplicationSettings>(`${this.base}/application-configuration/settings`, body);
  }

  getPublicLoginHeroImages(): Observable<LoginHeroImage[]> {
    return this.http.get<LoginHeroImage[]>(`${this.base}/application-configuration/login-hero-images/public`);
  }

  getLoginHeroImages(): Observable<LoginHeroImage[]> {
    return this.http.get<LoginHeroImage[]>(`${this.base}/application-configuration/login-hero-images`);
  }

  uploadLoginHeroImage(file: File, altText?: string | null): Observable<LoginHeroImage> {
    const form = new FormData();
    form.append('file', file);
    if (altText?.trim()) {
      form.append('altText', altText.trim());
    }
    return this.http.post<LoginHeroImage>(`${this.base}/application-configuration/login-hero-images`, form);
  }

  updateLoginHeroImage(id: number, body: UpdateLoginHeroImageRequest): Observable<LoginHeroImage> {
    return this.http.put<LoginHeroImage>(`${this.base}/application-configuration/login-hero-images/${id}`, body);
  }

  deleteLoginHeroImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/application-configuration/login-hero-images/${id}`);
  }
}
