import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';
import { HospitalConfigurationApiService } from '../../core/api/hospital-configuration-api.service';
import type {
  HospitalConfiguration,
  HospitalConfigurationCategory,
  HospitalConfigurationSetting,
} from '../../core/models/api-contracts';
import { MenuPermissionService } from '../../core/services/menu-permission.service';
import { HmsBlockSkeletonComponent } from '../../shared/components/hms-block-skeleton/hms-block-skeleton.component';
import { SurfacePanelComponent } from '../../shared/components/surface-panel/surface-panel.component';
import { previewMrn } from '../../shared/utils/hospital-profile.utils';

/**
 * Schema-driven settings page: renders one configuration category entirely from the
 * database-backed schema (labels, control types, choices, defaults, ordering,
 * validation limits) returned by the hospital-configuration API.
 */
@Component({
  selector: 'app-hospital-settings-category-page',
  imports: [
    FormsModule,
    SurfacePanelComponent,
    HmsBlockSkeletonComponent,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './settings-category.page.html',
  styleUrl: './settings-category.page.scss',
})
export class SettingsCategoryPage implements OnInit {
  private readonly api = inject(HospitalConfigurationApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly menuPerms = inject(MenuPermissionService);

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  categoryCode = '';
  title = '';
  subtitle = '';

  configuration: HospitalConfiguration | null = null;
  category: HospitalConfigurationCategory | null = null;
  /** Draft values keyed by setting key ('true'/'false' strings for booleans). */
  draft: Record<string, string | null> = {};

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.categoryCode = (data['category'] as string) ?? '';
      this.title = (data['title'] as string) ?? 'Hospital settings';
      this.subtitle = (data['subtitle'] as string) ?? '';
      this.load();
    });
  }

  get canEdit(): boolean {
    const menuCode = this.category?.menuCode;
    return !!menuCode && this.menuPerms.can(menuCode, 'edit');
  }

  get isMrnCategory(): boolean {
    return this.categoryCode.toLowerCase() === 'mrn';
  }

  /** PrimeIcons class for the current category's card header. */
  get categoryIcon(): string {
    switch (this.categoryCode.toLowerCase()) {
      case 'localization':
        return 'pi-globe';
      case 'mrn':
        return 'pi-hashtag';
      case 'features':
        return 'pi-sliders-h';
      default:
        return 'pi-cog';
    }
  }

  get mrnPreview(): string {
    if (!this.configuration) return '';
    return previewMrn(
      this.draft['mrn.format'] ?? '',
      this.configuration.hospitalCode,
      this.draft['mrn.prefix'] ?? '',
      this.configuration.mrnNextNumber,
    );
  }

  isBoolean(setting: HospitalConfigurationSetting): boolean {
    return setting.dataType === 'Boolean';
  }

  isSelect(setting: HospitalConfigurationSetting): boolean {
    return setting.dataType === 'Select';
  }

  isNumber(setting: HospitalConfigurationSetting): boolean {
    return setting.dataType === 'Number';
  }

  boolValue(key: string): boolean {
    return (this.draft[key] ?? '').toLowerCase() === 'true';
  }

  setBoolValue(key: string, checked: boolean): void {
    this.draft[key] = checked ? 'true' : 'false';
  }

  load(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .getSettings()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (config) => this.apply(config),
        error: (err: { error?: { message?: string } }) => {
          this.errorMessage =
            err?.error?.message ?? 'Could not load hospital configuration settings.';
        },
      });
  }

  save(): void {
    if (!this.category) return;
    const settings = this.category.settings
      .filter((s) => s.isEditable)
      .map((s) => ({ key: s.key, value: this.draft[s.key] ?? null }));
    if (settings.length === 0) return;

    this.saving = true;
    this.api
      .updateSettings({ settings })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (config) => {
          this.apply(config);
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: `${this.title} updated.`,
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: err?.error?.message ?? 'Could not save settings.',
          });
        },
      });
  }

  private apply(config: HospitalConfiguration): void {
    this.configuration = config;
    this.category =
      config.categories.find(
        (c) => c.code.toLowerCase() === this.categoryCode.toLowerCase(),
      ) ?? null;
    if (!this.category) {
      this.errorMessage = 'You do not have access to these settings.';
      return;
    }

    const draft: Record<string, string | null> = {};
    for (const setting of this.category.settings) {
      draft[setting.key] = setting.value ?? setting.defaultValue ?? null;
    }
    this.draft = draft;
  }
}
