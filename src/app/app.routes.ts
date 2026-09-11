import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { branchRequiredGuard } from './core/guards/branch-required.guard';
import { guestGuard } from './core/guards/guest.guard';
import { menuAccessGuard } from './core/guards/menu-access.guard';
import { platformDashboardGuard } from './core/guards/platform-dashboard.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [menuAccessGuard],
    loadComponent: () =>
      import('./shared/layout/main-shell/main-shell.component').then((m) => m.MainShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [platformDashboardGuard],
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'clinical/departments',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/departments/departments.page').then((m) => m.DepartmentsPage),
      },
      {
        path: 'clinical/doctors',
        canActivate: [branchRequiredGuard],
        loadComponent: () => import('./features/clinical/doctors/doctors.page').then((m) => m.DoctorsPage),
      },
      {
        path: 'clinical/patients',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/patients/patients.page').then((m) => m.PatientsPage),
      },
      {
        path: 'clinical/patient-registration',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/patient-registration/patient-registration.page').then(
            (m) => m.PatientRegistrationPage,
          ),
      },
      {
        path: 'clinical/service-categories',
        loadComponent: () =>
          import('./features/clinical/service-categories/service-categories.page').then(
            (m) => m.ServiceCategoriesPage,
          ),
      },
      {
        path: 'clinical/services/new',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/services/service-editor.page').then((m) => m.ServiceEditorPage),
      },
      {
        path: 'clinical/services/edit/:id',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/services/service-editor.page').then((m) => m.ServiceEditorPage),
      },
      {
        path: 'clinical/services',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/services/services-catalog.page').then((m) => m.ServicesCatalogPage),
      },
      {
        path: 'clinical/medicines',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/medicines/medicines.page').then((m) => m.MedicinesPage),
      },
      {
        path: 'clinical/medicine-usages',
        loadComponent: () =>
          import('./features/clinical/medicine-usages/medicine-usages.page').then((m) => m.MedicineUsagesPage),
      },
      {
        path: 'clinical/doctor-checkup/session/:visitId',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/doctor-checkup/doctor-checkup-session.page').then(
            (m) => m.DoctorCheckupSessionPage,
          ),
      },
      {
        path: 'clinical/doctor-checkup',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/doctor-checkup/doctor-checkup.page').then((m) => m.DoctorCheckupPage),
      },
      {
        path: 'clinical/checkup-templates/new',
        loadComponent: () =>
          import('./features/clinical/checkup-templates/checkup-template-editor.page').then(
            (m) => m.CheckupTemplateEditorPage,
          ),
      },
      {
        path: 'clinical/checkup-templates/edit/:id',
        loadComponent: () =>
          import('./features/clinical/checkup-templates/checkup-template-editor.page').then(
            (m) => m.CheckupTemplateEditorPage,
          ),
      },
      {
        path: 'clinical/checkup-templates',
        loadComponent: () =>
          import('./features/clinical/checkup-templates/checkup-templates.page').then((m) => m.CheckupTemplatesPage),
      },
      {
        path: 'clinical/ipd/wards',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/ipd/wards/wards.page').then((m) => m.IpdWardsPage),
      },
      {
        path: 'clinical/ipd/beds',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/ipd/beds/beds.page').then((m) => m.IpdBedsPage),
      },
      {
        path: 'clinical/ipd/admissions',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/ipd/admissions/admissions.page').then((m) => m.IpdAdmissionsPage),
      },
      {
        path: 'clinical/ipd/active-inpatients',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/clinical/ipd/active-inpatients/active-inpatients.page').then((m) => m.ActiveInpatientsPage),
      },
      {
        path: 'laboratory/worklist',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/laboratory/worklist/lab-worklist.page').then((m) => m.LabWorklistPage),
      },
      {
        path: 'laboratory/categories',
        loadComponent: () =>
          import('./features/laboratory/categories/lab-categories.page').then((m) => m.LabCategoriesPage),
      },
      {
        path: 'laboratory/reports',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/laboratory/reports/lab-reports.page').then((m) => m.LabReportsPage),
      },
      {
        path: 'pharmacy',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/dashboard/pharmacy-dashboard.page').then((m) => m.PharmacyDashboardPage),
      },
      {
        path: 'pharmacy/rx-queue',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/rx-queue/rx-queue.page').then((m) => m.PharmacyRxQueuePage),
      },
      {
        path: 'pharmacy/dispense',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/dispense/dispense.page').then((m) => m.PharmacyDispensePage),
      },
      {
        path: 'pharmacy/sales',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/sales/sales.page').then((m) => m.PharmacySalesPage),
      },
      {
        path: 'pharmacy/stock',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/stock/stock.page').then((m) => m.PharmacyStockPage),
      },
      {
        path: 'pharmacy/purchases',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/purchases/purchases.page').then((m) => m.PharmacyPurchasesPage),
      },
      {
        path: 'pharmacy/suppliers',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/suppliers/suppliers.page').then((m) => m.PharmacySuppliersPage),
      },
      {
        path: 'pharmacy/returns',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/returns/returns.page').then((m) => m.PharmacyReturnsPage),
      },
      {
        path: 'pharmacy/reports',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/pharmacy/reports/reports.page').then((m) => m.PharmacyReportsPage),
      },
      {
        path: 'billing/invoices',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/billing/invoices/invoices.page').then((m) => m.BillingInvoicesPage),
      },
      {
        path: 'billing/cashier',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/billing/cashier/cashier.page').then((m) => m.BillingCashierPage),
      },
      {
        path: 'billing/reports',
        canActivate: [branchRequiredGuard],
        loadComponent: () =>
          import('./features/billing/reports/billing-reports.page').then((m) => m.BillingReportsPage),
      },
      {
        path: 'admin/application-configuration',
        loadComponent: () =>
          import('./features/administration/application-configuration/application-configuration.page').then(
            (m) => m.ApplicationConfigurationPage,
          ),
      },
      {
        path: 'admin/platform-home',
        loadComponent: () =>
          import('./features/administration/platform-home/platform-home.page').then(
            (m) => m.PlatformHomePage,
          ),
      },
      {
        path: 'admin/platform-users',
        loadComponent: () =>
          import('./features/administration/platform-users/platform-users.page').then(
            (m) => m.PlatformUsersPage,
          ),
      },
      {
        path: 'admin/audit-logs',
        loadComponent: () =>
          import('./features/administration/audit-logs/audit-logs.page').then((m) => m.AuditLogsPage),
      },
      {
        path: 'admin/license-packages',
        loadComponent: () =>
          import('./features/administration/license-packages/license-packages.page').then(
            (m) => m.LicensePackagesPage,
          ),
      },
      {
        path: 'admin/hospitals/new',
        loadComponent: () =>
          import('./features/administration/hospitals/hospital-editor.page').then((m) => m.HospitalEditorPage),
      },
      {
        path: 'admin/hospitals/edit/:id',
        loadComponent: () =>
          import('./features/administration/hospitals/hospital-editor.page').then((m) => m.HospitalEditorPage),
      },
      {
        path: 'admin/hospitals/:id/menus',
        loadComponent: () =>
          import('./features/administration/hospitals/hospital-menus.page').then((m) => m.HospitalMenusPage),
      },
      {
        path: 'admin/hospitals',
        loadComponent: () =>
          import('./features/administration/hospitals/hospitals.page').then((m) => m.HospitalsPage),
      },
      {
        path: 'admin/branches',
        redirectTo: 'admin/hospitals',
        pathMatch: 'full',
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/administration/users/users.page').then((m) => m.UsersPage),
      },
      {
        path: 'admin/roles/new',
        loadComponent: () =>
          import('./features/administration/roles/role-editor.page').then((m) => m.RoleEditorPage),
      },
      {
        path: 'admin/roles/edit/:id',
        loadComponent: () =>
          import('./features/administration/roles/role-editor.page').then((m) => m.RoleEditorPage),
      },
      {
        path: 'admin/roles',
        loadComponent: () => import('./features/administration/roles/roles.page').then((m) => m.RolesPage),
      },
      {
        path: 'admin/modules',
        loadComponent: () =>
          import('./features/administration/modules/modules.page').then((m) => m.ModulesPage),
      },

      // ── Hospital settings console (database-driven; hospital admins) ──
      {
        path: 'admin/configuration/profile',
        loadComponent: () =>
          import('./features/account/my-hospital/my-hospital.page').then((m) => m.MyHospitalPage),
      },
      {
        path: 'admin/configuration/localization',
        data: {
          category: 'Localization',
          title: 'Localization & formats',
          subtitle: 'Currency, date/time formats, language, and timezone',
        },
        loadComponent: () =>
          import('./features/hospital-configuration/settings-category.page').then(
            (m) => m.SettingsCategoryPage,
          ),
      },
      {
        path: 'admin/configuration/mrn',
        data: {
          category: 'Mrn',
          title: 'MRN numbering',
          subtitle: 'Medical record number format used for patient registration',
        },
        loadComponent: () =>
          import('./features/hospital-configuration/settings-category.page').then(
            (m) => m.SettingsCategoryPage,
          ),
      },
      {
        path: 'admin/configuration/features',
        data: {
          category: 'Features',
          title: 'Feature settings',
          subtitle: 'Workflow options for your hospital',
        },
        loadComponent: () =>
          import('./features/hospital-configuration/settings-category.page').then(
            (m) => m.SettingsCategoryPage,
          ),
      },
      {
        path: 'admin/configuration/registration-slip',
        loadComponent: () =>
          import('./features/account/registration-slip-designer/registration-slip-designer.page').then(
            (m) => m.RegistrationSlipDesignerPage,
          ),
      },
      {
        path: 'admin/configuration/prescription-slip',
        loadComponent: () =>
          import('./features/account/medicine-slip-designer/medicine-slip-designer.page').then(
            (m) => m.MedicineSlipDesignerPage,
          ),
      },

      {
        path: 'account/profile',
        loadComponent: () => import('./features/account/profile/profile.page').then((m) => m.ProfilePage),
      },
      // Legacy account routes → Hospital settings console.
      {
        path: 'account/my-hospital',
        redirectTo: 'admin/configuration/profile',
        pathMatch: 'full',
      },
      {
        path: 'account/registration-slip-designer',
        redirectTo: 'admin/configuration/registration-slip',
        pathMatch: 'full',
      },
      {
        path: 'account/medicine-slip-designer',
        redirectTo: 'admin/configuration/prescription-slip',
        pathMatch: 'full',
      },
      {
        path: 'account/change-password',
        loadComponent: () =>
          import('./features/auth/change-password/change-password.page').then((m) => m.ChangePasswordPage),
      },
    ],
  },
  { path: '**', redirectTo: 'app' },
];
