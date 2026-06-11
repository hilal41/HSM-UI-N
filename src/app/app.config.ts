import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { hmsAuraPreset } from './core/theme/hms-preset';
import { API_BASE_URL } from './core/tokens/api-base-url.token';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: `${environment.apiBaseUrl}${environment.apiVersionPath}`,
    },
    MessageService,
    ConfirmationService,
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: hmsAuraPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
};
