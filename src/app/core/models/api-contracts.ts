/** Mirrors HMS_API JSON (camelCase). */

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserSummary {
  id: number;
  userName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roleName?: string | null;
  roleId?: number | null;
  hospitalId?: number | null;
}

export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserSummary;
  roleName: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface MeResponse {
  user: UserSummary;
  roleName?: string | null;
  roleId?: number | null;
  hospitalId?: number | null;
  departments: Department[];
  allowedModules: Module[];
}

export interface AllowedModulesResponse {
  modules: Module[];
}

export interface Department {
  id: number;
  departmentCode: string;
  name: string;
  headDoctorId?: number | null;
  description?: string | null;
  totalBeds?: number;
  availableBeds?: number;
  staffCount?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateDepartmentRequest {
  departmentCode: string;
  name: string;
  headDoctorId?: number | null;
  description?: string | null;
  totalBeds: number;
  availableBeds: number;
  staffCount: number;
  status: string;
}

export interface UpdateDepartmentRequest {
  departmentCode?: string | null;
  name?: string | null;
  headDoctorId?: number | null;
  description?: string | null;
  totalBeds?: number | null;
  availableBeds?: number | null;
  staffCount?: number | null;
  status?: string | null;
}

export interface Doctor {
  id: number;
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  departmentId: number;
  departmentName?: string | null;
  licenseNumber: string;
  phone?: string | null;
  email?: string | null;
  availability?: string | null;
  qualification?: string | null;
  yearsOfExperience?: number | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateDoctorRequest {
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  departmentId: number;
  licenseNumber: string;
  phone?: string | null;
  email?: string | null;
  availability?: string | null;
  qualification?: string | null;
  yearsOfExperience?: number | null;
  status: string;
  createdBy: number;
}

export interface UpdateDoctorRequest {
  doctorNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  specialization?: string | null;
  departmentId?: number | null;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  availability?: string | null;
  qualification?: string | null;
  yearsOfExperience?: number | null;
  status?: string | null;
}

/** One row from `GET .../clinical/patients/search`. */
export interface PatientSearchHit {
  patient: Patient;
  matchScore: number;
  matchedOn: string[];
}

export interface BloodTypeOption {
  id: number;
  code: string;
  displayName: string;
  sortOrder: number;
}

export interface Patient {
  id: number;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodTypeId?: number | null;
  bloodType?: string | null;
  phone?: string | null;
  cnic?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  patientPictureBase64?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePatientRequest {
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodTypeId?: number | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  patientPictureBase64?: string | null;
  status: string;
  createdBy?: number | null;
}

export interface UpdatePatientRequest {
  patientNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodTypeId?: number | null;
  clearBloodType?: boolean;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  patientPictureBase64?: string | null;
  status?: string | null;
}

export interface ServiceCategory {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateServiceCategoryRequest {
  code: string;
  name: string;
}

export interface UpdateServiceCategoryRequest {
  code?: string | null;
  name?: string | null;
}

export interface MedicineUsage {
  id: number;
  shortCode: string;
  description?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateMedicineUsageRequest {
  shortCode: string;
  description?: string | null;
  isActive: boolean;
  /** Required when the signed-in user has no hospital (e.g. platform user). */
  hospitalId?: number | null;
}

export interface UpdateMedicineUsageRequest {
  shortCode?: string | null;
  description?: string | null;
  isActive?: boolean | null;
}

/** Result of POST /clinical/medicines/import (Excel upsert by code). */
export interface MedicineImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: MedicineImportErrorRow[];
}

export interface MedicineImportErrorRow {
  rowNumber: number;
  message: string;
}

export interface Medicine {
  id: number;
  hospitalId: number;
  medicineName: string;
  genericName?: string | null;
  code: string;
  category: string;
  form: string;
  strength?: string | null;
  manufacturer?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  batchNumber?: string | null;
  /** ISO date `yyyy-MM-dd` (from API `DateOnly`). */
  expiryDate: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

/** Medicine line for a saved checkup (`checkupMedicines`). */
export interface PatientMedicineLine {
  id: number;
  checkupId: number;
  medicineId: number;
  medicineUsageId?: number | null;
  medicineUsageShortCode?: string | null;
  medicineUsageDescription?: string | null;
  medicineName: string;
  code: string;
  form: string;
  strength?: string | null;
}

export interface CheckupSaveResponse {
  id: number;
  patientVisitId: number;
  checkupTemplateId: number;
  responsesJson?: string | null;
  medicineNotes?: string | null;
  nextCheckupAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  medicines: PatientMedicineLine[];
}

export interface SaveCheckupMedicineLine {
  medicineId: number;
  medicineUsageId?: number | null;
}

export interface SaveCheckupRequest {
  checkupTemplateId: number;
  responsesJson?: string | null;
  medicineNotes?: string | null;
  nextCheckupAt?: string | null;
  medicineLines?: SaveCheckupMedicineLine[];
  medicineIds?: number[];
}

export interface CreateMedicineRequest {
  medicineName: string;
  genericName?: string | null;
  code: string;
  category: string;
  form: string;
  strength?: string | null;
  manufacturer?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  batchNumber?: string | null;
  expiryDate: string;
  description?: string | null;
  isActive: boolean;
  /** Required when the signed-in user has no hospital (platform). */
  hospitalId?: number | null;
}

export type UpdateMedicineRequest = Omit<CreateMedicineRequest, 'hospitalId'>;

/** Doctor checkup form template (per hospital): display name + stable code (e.g. ENT / ENT). */
export interface CheckupTemplate {
  id: number;
  code: string;
  name: string;
  /** JSON string: full form structure (sections, fields, etc.). */
  schemaJson?: string | null;
  /** Server-generated HTML snapshot for print / read-only views. */
  templateHtml?: string | null;
  /** Seeded HMS library row — cannot be deleted; code is fixed. */
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCheckupTemplateRequest {
  code: string;
  name: string;
  schemaJson?: string | null;
  /** Required when the signed-in user has no hospital (matches API: platform / developer). */
  hospitalId?: number | null;
}

export interface UpdateCheckupTemplateRequest {
  code?: string | null;
  name?: string | null;
  /** Include to replace schema; send empty string to clear. Omit to leave unchanged. */
  schemaJson?: string | null;
}

export interface ClinicalService {
  id: number;
  code: string;
  title: string;
  consultancyType: string;
  serviceCategoryId: number;
  serviceCategoryName?: string | null;
  discount: number;
  price: number;
  doctorId?: number | null;
  doctorName?: string | null;
  doctorShare: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateClinicalServiceRequest {
  code: string;
  title: string;
  consultancyType: string;
  serviceCategoryId: number;
  discount: number;
  price: number;
  doctorId?: number | null;
  doctorShare: number;
  createdBy?: number | null;
}

export interface UpdateClinicalServiceRequest {
  code?: string | null;
  title?: string | null;
  consultancyType?: string | null;
  serviceCategoryId?: number | null;
  discount?: number | null;
  price?: number | null;
  doctorId?: number | null;
  clearDoctor?: boolean;
  doctorShare?: number | null;
}

export interface Hospital {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Logo as base64 (often a `data:image/...;base64,...` URL). */
  logoBase64?: string | null;
  website?: string | null;
  businessRegistrationNumber?: string | null;
  tagline?: string | null;
  /** JSON string: registration slip layout (section order, visibility, hospital fields). */
  registrationSlipTemplateJson?: string | null;
  /** JSON string: medicine slip layout (section order, visibility, typography, fields). */
  medicineSlipTemplateJson?: string | null;
  status: string;
  createdBy?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  enabledModules: Module[];
}

export interface CreateHospitalRequest {
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoBase64?: string | null;
  website?: string | null;
  businessRegistrationNumber?: string | null;
  tagline?: string | null;
  enabledModuleIds: number[];
  adminUser?: CreateHospitalAdminRequest | null;
}

export interface CreateHospitalAdminRequest {
  userName: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface UpdateHospitalRequest {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  logoBase64?: string | null;
  website?: string | null;
  businessRegistrationNumber?: string | null;
  tagline?: string | null;
  registrationSlipTemplateJson?: string | null;
  medicineSlipTemplateJson?: string | null;
}

export interface SetHospitalModulesRequest {
  moduleIds: number[];
}

export interface User {
  id: number;
  userName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  roleId?: number | null;
  roleName?: string | null;
  hospitalId?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserDetail extends User {
  departments: Department[];
  allowedModules: Module[];
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  roleId?: number | null;
  hospitalId?: number | null;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  userName?: string | null;
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive?: boolean | null;
  roleId?: number | null;
  hospitalId?: number | null;
}

export interface AssignRoleRequest {
  roleId: number;
}

export interface SetUserDepartmentsRequest {
  departmentIds: number[];
}

export interface SetUserModulesRequest {
  moduleIds: number[];
  departmentId?: number | null;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  isSystemRole: boolean;
}

export interface Module {
  id: number;
  code: string;
  name: string;
  category?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
  debugToken?: string;
}

export interface CreatePatientVisitDetailLineRequest {
  doctorId: number;
  clinicalServiceId: number;
  servicePrice: number;
  serviceDiscount: number;
  remarks?: string | null;
}

export interface CreatePatientVisitRequest {
  patientId: number;
  totalAmount: number;
  discountAmount: number;
  receivedAmount: number;
  remarks?: string | null;
  recordedByUserId?: number | null;
  visitDate?: string | null;
  isPrinted: boolean;
  details: CreatePatientVisitDetailLineRequest[];
  createdBy?: number | null;
}

export interface PatientVisitDetailResponse {
  id: number;
  patientVisitId: number;
  doctorId: number;
  clinicalServiceId: number;
  servicePrice: number;
  serviceDiscount: number;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PatientVisitResponse {
  id: number;
  hospitalId: number;
  patientId: number;
  totalAmount: number;
  discountAmount: number;
  receivedAmount: number;
  remarks?: string | null;
  recordedByUserId?: number | null;
  visitDate: string;
  isPrinted: boolean;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  details: PatientVisitDetailResponse[];
}

export interface PatientVisitHistoryLineResponse {
  id: number;
  serviceTitle: string;
  serviceCode: string;
  doctorName: string;
  servicePrice: number;
  serviceDiscount: number;
  remarks?: string | null;
}

export interface PatientVisitHistoryItemResponse {
  id: number;
  patientId: number;
  visitDate: string;
  totalAmount: number;
  discountAmount: number;
  receivedAmount: number;
  netAmount: number;
  remarks?: string | null;
  isPrinted: boolean;
  createdAt: string;
  lines: PatientVisitHistoryLineResponse[];
}

export type PatientVisitHistoryPage = PagedResponse<PatientVisitHistoryItemResponse>;

/** Registration visit log row (date range query, compact). */
export interface PatientVisitRegisterLogItemResponse {
  visitId: number;
  patientId: number;
  patientName: string;
  phone?: string | null;
  ageYears: number;
  gender: string;
  visitDate: string;
  isPrinted: boolean;
  hasCheckup: boolean;
  doctorSummary?: string | null;
  extraDoctorCount: number;
  serviceSummary1?: string | null;
  serviceSummary2?: string | null;
  extraServiceCount: number;
}

export type PatientVisitRegisterLogPage = PagedResponse<PatientVisitRegisterLogItemResponse>;
