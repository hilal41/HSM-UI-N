import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { HospitalConfigurationApiService } from '../../core/api/hospital-configuration-api.service';
import type { HospitalConfiguration } from '../../core/models/api-contracts';
import { MenuPermissionService } from '../../core/services/menu-permission.service';
import { SettingsCategoryPage } from './settings-category.page';

describe('SettingsCategoryPage', () => {
  let api: jasmine.SpyObj<HospitalConfigurationApiService>;
  let menuPerms: jasmine.SpyObj<MenuPermissionService>;
  let messages: jasmine.SpyObj<MessageService>;

  const configuration: HospitalConfiguration = {
    hospitalId: 1,
    hospitalCode: 'HOSP1',
    hospitalName: 'Hospital One',
    mrnNextNumber: 42,
    mrnPreview: 'HOSP1-2026-00042',
    categories: [
      {
        code: 'Localization',
        menuCode: 'hospital.configuration.localization',
        settings: [
          {
            key: 'localization.currencySymbol',
            label: 'Currency symbol',
            description: null,
            dataType: 'Select',
            isRequired: true,
            maxLength: 10,
            defaultValue: 'Rs',
            sortOrder: 10,
            isEditable: true,
            value: '$',
            options: [
              { value: 'Rs', label: 'Rs (Rupee)' },
              { value: '$', label: '$ (Dollar)' },
            ],
          },
          {
            key: 'localization.dateFormat',
            label: 'Date format',
            description: null,
            dataType: 'Select',
            isRequired: true,
            maxLength: 20,
            defaultValue: 'dd/MM/yyyy',
            sortOrder: 20,
            isEditable: true,
            value: null, // no stored value — the default must be used
            options: [{ value: 'dd/MM/yyyy', label: 'dd/MM/yyyy' }],
          },
        ],
      },
      {
        code: 'Mrn',
        menuCode: 'hospital.configuration.mrn',
        settings: [
          {
            key: 'mrn.format',
            label: 'MRN format',
            description: null,
            dataType: 'Text',
            isRequired: true,
            maxLength: 80,
            defaultValue: '{CODE}-{YYYY}-{#####}',
            sortOrder: 10,
            isEditable: true,
            value: '{CODE}-{#####}',
            options: [],
          },
          {
            key: 'mrn.prefix',
            label: 'MRN prefix',
            description: null,
            dataType: 'Text',
            isRequired: false,
            maxLength: 20,
            defaultValue: null,
            sortOrder: 20,
            isEditable: true,
            value: null,
            options: [],
          },
        ],
      },
    ],
  };

  function createPage(routeData: Record<string, string>): SettingsCategoryPage {
    TestBed.configureTestingModule({
      imports: [SettingsCategoryPage],
      providers: [
        provideNoopAnimations(),
        { provide: HospitalConfigurationApiService, useValue: api },
        { provide: MenuPermissionService, useValue: menuPerms },
        { provide: MessageService, useValue: messages },
        { provide: ActivatedRoute, useValue: { data: of(routeData) } },
      ],
    });
    const fixture = TestBed.createComponent(SettingsCategoryPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<HospitalConfigurationApiService>('HospitalConfigurationApiService', [
      'getSettings',
      'updateSettings',
    ]);
    api.getSettings.and.returnValue(of(configuration));
    menuPerms = jasmine.createSpyObj<MenuPermissionService>('MenuPermissionService', ['can']);
    menuPerms.can.and.returnValue(true);
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
  });

  it('builds the draft form from schema values, falling back to database defaults', () => {
    const page = createPage({ category: 'Localization', title: 'Localization & formats' });

    expect(page.category?.code).toBe('Localization');
    expect(page.draft['localization.currencySymbol']).toBe('$');
    // No stored value — must fall back to the definition default from the API.
    expect(page.draft['localization.dateFormat']).toBe('dd/MM/yyyy');
  });

  it('shows an access error when the requested category is not returned by the API', () => {
    const page = createPage({ category: 'Features', title: 'Feature settings' });

    expect(page.category).toBeNull();
    expect(page.errorMessage).toBe('You do not have access to these settings.');
  });

  it('derives edit permission from the category menu code', () => {
    menuPerms.can.and.callFake(
      (code: string, action: string) =>
        code === 'hospital.configuration.localization' && action === 'edit',
    );
    const page = createPage({ category: 'Localization', title: 'Localization & formats' });

    expect(page.canEdit).toBeTrue();
    expect(menuPerms.can).toHaveBeenCalledWith('hospital.configuration.localization', 'edit');
  });

  it('denies editing when the menu permission is missing', () => {
    menuPerms.can.and.returnValue(false);
    const page = createPage({ category: 'Localization', title: 'Localization & formats' });

    expect(page.canEdit).toBeFalse();
  });

  it('sends only editable settings on save and reloads returned values', () => {
    const saved: HospitalConfiguration = {
      ...configuration,
      categories: configuration.categories.map((c) =>
        c.code === 'Localization'
          ? {
              ...c,
              settings: c.settings.map((s) =>
                s.key === 'localization.currencySymbol' ? { ...s, value: 'Rs' } : s,
              ),
            }
          : c,
      ),
    };
    api.updateSettings.and.returnValue(of(saved));

    const page = createPage({ category: 'Localization', title: 'Localization & formats' });
    page.draft['localization.currencySymbol'] = 'Rs';
    page.save();

    expect(api.updateSettings).toHaveBeenCalledWith({
      settings: [
        { key: 'localization.currencySymbol', value: 'Rs' },
        { key: 'localization.dateFormat', value: 'dd/MM/yyyy' },
      ],
    });
    // Saved values returned by the API replace the draft.
    expect(page.draft['localization.currencySymbol']).toBe('Rs');
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('surfaces API validation errors on save without clearing the form', () => {
    api.updateSettings.and.returnValue(
      throwError(() => ({ error: { message: 'MRN format must include a sequence token.' } })),
    );
    const page = createPage({ category: 'Mrn', title: 'MRN numbering' });
    page.draft['mrn.format'] = '{CODE}';
    page.save();

    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'error',
        detail: 'MRN format must include a sequence token.',
      }),
    );
    expect(page.draft['mrn.format']).toBe('{CODE}');
  });

  it('previews the next MRN from draft format, prefix, hospital code and next number', () => {
    const page = createPage({ category: 'Mrn', title: 'MRN numbering' });

    expect(page.isMrnCategory).toBeTrue();
    expect(page.mrnPreview).toBe('HOSP1-00042');

    page.draft['mrn.format'] = '{PREFIX}-{#####}';
    page.draft['mrn.prefix'] = 'PX';
    expect(page.mrnPreview).toBe('PX-00042');
  });
});
