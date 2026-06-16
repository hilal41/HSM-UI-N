import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { branchRequiredGuard } from './core/guards/branch-required.guard';
import { guestGuard } from './core/guards/guest.guard';
import { menuAccessGuard } from './core/guards/menu-access.guard';

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
        loadComponent: () =>
          import('./features/clinical/services/service-editor.page').then((m) => m.ServiceEditorPage),
      },
      {
        path: 'clinical/services/edit/:id',
        loadComponent: () =>
          import('./features/clinical/services/service-editor.page').then((m) => m.ServiceEditorPage),
      },
      {
        path: 'clinical/services',
        loadComponent: () =>
          import('./features/clinical/services/services-catalog.page').then((m) => m.ServicesCatalogPage),
      },
      {
        path: 'clinical/medicines',
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
        path: 'admin/hospitals',
        loadComponent: () =>
          import('./features/administration/hospitals/hospitals.page').then((m) => m.HospitalsPage),
      },
      {
        path: 'admin/branches',
        loadComponent: () =>
          import('./features/administration/branches/branches.page').then((m) => m.BranchesPage),
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
      {
        path: 'account/profile',
        loadComponent: () => import('./features/account/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'account/my-hospital',
        loadComponent: () =>
          import('./features/account/my-hospital/my-hospital.page').then((m) => m.MyHospitalPage),
      },
      {
        path: 'account/registration-slip-designer',
        loadComponent: () =>
          import('./features/account/registration-slip-designer/registration-slip-designer.page').then(
            (m) => m.RegistrationSlipDesignerPage,
          ),
      },
      {
        path: 'account/medicine-slip-designer',
        loadComponent: () =>
          import('./features/account/medicine-slip-designer/medicine-slip-designer.page').then(
            (m) => m.MedicineSlipDesignerPage,
          ),
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
