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
  activeBranchId?: number | null;
}

export interface BranchSummary {
  id: number;
  code: string;
  name: string;
  isMain: boolean;
  isDefault: boolean;
  timeZoneId: string;
  currencyCode: string;
}

export interface Branch {
  id: number;
  hospitalId: number;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  isMain: boolean;
  timeZoneId: string;
  currencyCode: string;
  countryCode?: string | null;
  closureReason?: string | null;
  reopenDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateBranchRequest {
  hospitalId?: number | null;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  timeZoneId: string;
  currencyCode: string;
  countryCode?: string | null;
}

export interface UpdateBranchRequest {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  timeZoneId: string;
  currencyCode: string;
  countryCode?: string | null;
  closureReason?: string | null;
  reopenDate?: string | null;
}

export interface SwitchBranchRequest {
  branchId: number;
}

export interface SetUserBranchesRequest {
  branchIds: number[];
  defaultBranchId?: number | null;
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
  activeBranchId?: number | null;
  branches?: BranchSummary[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
  branchId?: number | null;
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
  activeBranchId?: number | null;
  branches: BranchSummary[];
  departments: Department[];
  allowedModules: Module[];
  menus: AppMenuTree[];
  menuPermissions?: MenuPermission[];
}

export interface MenuPermission {
  menuCode: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AllowedModulesResponse {
  modules: Module[];
}

export interface Department {
  id: number;
  branchId?: number;
  branchName?: string | null;
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
  branchId?: number;
  branchName?: string | null;
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
  medicalCouncilRegistration?: string | null;
  specialityCode?: string | null;
  /** FullTime | PartTime | Visiting | Consultant */
  employmentType?: string | null;
  /** ISO date `yyyy-MM-dd`. */
  joiningDate?: string | null;
  /** ISO date `yyyy-MM-dd`. */
  leavingDate?: string | null;
  signatureUrl?: string | null;
  signatureBase64?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Result of POST /clinical/doctors/import (Excel upsert by doctor number). */
export interface DoctorImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: DoctorImportErrorRow[];
}

export interface DoctorImportErrorRow {
  rowNumber: number;
  message: string;
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
  medicalCouncilRegistration?: string | null;
  specialityCode?: string | null;
  employmentType?: string | null;
  joiningDate?: string | null;
  leavingDate?: string | null;
  signatureBase64?: string | null;
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
  medicalCouncilRegistration?: string | null;
  specialityCode?: string | null;
  employmentType?: string | null;
  joiningDate?: string | null;
  leavingDate?: string | null;
  /** Base64 or data URL; empty string clears signature. */
  signatureBase64?: string | null;
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

/** Result of POST /clinical/patients/import (Excel upsert by patient number). */
export interface PatientImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: PatientImportErrorRow[];
}

export interface PatientImportErrorRow {
  rowNumber: number;
  message: string;
}

export interface CreatePatientRequest {
  /** Omit or leave empty to auto-allocate MRN on the server. */
  patientNumber?: string;
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
  /** ISO date `yyyy-MM-dd` (from API `DateOnly`). Optional — real lots live in pharmacy batches. */
  expiryDate?: string | null;
  description?: string | null;
  reorderLevel?: number | null;
  unit?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
  hsnCode?: string | null;
  taxPercent?: number | null;
  brand?: string | null;
  genericStrength?: string | null;
  storageTemperature?: string | null;
  controlledDrugClass?: string | null;
  purchaseUnit?: string | null;
  saleUnit?: string | null;
  isControlled?: boolean;
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
  dose?: string | null;
  durationDays?: number | null;
  quantity?: number | null;
  dispenseStatus?: string;
  dispensedQty?: number;
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
  dose?: string | null;
  durationDays?: number | null;
  quantity?: number | null;
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
  expiryDate?: string | null;
  description?: string | null;
  reorderLevel?: number | null;
  unit?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
  hsnCode?: string | null;
  taxPercent?: number | null;
  brand?: string | null;
  genericStrength?: string | null;
  storageTemperature?: string | null;
  controlledDrugClass?: string | null;
  purchaseUnit?: string | null;
  saleUnit?: string | null;
  isControlled?: boolean;
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
  /** Expected lab report datetime when consultancy type is Test. */
  reportingTime?: string | null;
  cptCode?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  durationMinutes?: number | null;
  /** Linked lab catalog row when consultancy type is Test. */
  labTestId?: number | null;
  parameterCount?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface LabTestParameter {
  id: number;
  labTestId: number;
  code: string;
  name: string;
  unit?: string | null;
  referenceRange?: string | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ClinicalServiceLabProfile {
  clinicalServiceId: number;
  labTestId: number;
  sampleType?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  turnaroundHours?: number | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  method?: string | null;
  instrument?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  sampleVolume?: string | null;
  preparationInstructions?: string | null;
  fastingRequired?: boolean;
  homeCollection?: boolean;
  outsourcedLab?: string | null;
  cptCode?: string | null;
  loincCode?: string | null;
  parameters: LabTestParameter[];
}

export interface SaveLabTestParameterRequest {
  code: string;
  name: string;
  unit?: string | null;
  referenceRange?: string | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SaveClinicalServiceLabProfileRequest {
  sampleType?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  turnaroundHours?: number | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  method?: string | null;
  instrument?: string | null;
  departmentId?: number | null;
  sampleVolume?: string | null;
  preparationInstructions?: string | null;
  fastingRequired?: boolean;
  homeCollection?: boolean;
  outsourcedLab?: string | null;
  cptCode?: string | null;
  loincCode?: string | null;
  parameters: SaveLabTestParameterRequest[];
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
  reportingTime?: string | null;
  cptCode?: string | null;
  departmentId?: number | null;
  durationMinutes?: number | null;
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
  reportingTime?: string | null;
  clearReportingTime?: boolean;
  cptCode?: string | null;
  departmentId?: number | null;
  clearDepartment?: boolean;
  durationMinutes?: number | null;
  clearDurationMinutes?: boolean;
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
  licenseNumber?: string | null;
  taxNumber?: string | null;
  hospitalType?: string | null;
  hospitalSize?: string | null;
  currencySymbol?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  defaultLanguage?: string | null;
  defaultTimeZoneId?: string | null;
  mrnFormat?: string | null;
  mrnPrefix?: string | null;
  mrnNextNumber?: number;
  mrnPreview?: string | null;
  /** JSON string: registration slip layout (section order, visibility, hospital fields). */
  registrationSlipTemplateJson?: string | null;
  /** JSON string: medicine slip layout (section order, visibility, typography, fields). */
  medicineSlipTemplateJson?: string | null;
  status: string;
  allowHospitalBranchManagement?: boolean;
  isDeleted?: boolean;
  createdBy?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  enabledModules: Module[];
  enabledMenus?: MenuSummary[];
}

export interface MenuSummary {
  id: number;
  code: string;
  label: string;
  route?: string | null;
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
  licenseNumber?: string | null;
  taxNumber?: string | null;
  hospitalType?: string | null;
  hospitalSize?: string | null;
  currencySymbol?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  defaultLanguage?: string | null;
  defaultTimeZoneId?: string | null;
  mrnFormat?: string | null;
  mrnPrefix?: string | null;
  enabledMenuIds: number[];
  allowHospitalBranchManagement?: boolean;
  initialRole?: CreateHospitalInitialRoleRequest | null;
  adminUser?: CreateHospitalAdminRequest | null;
}

export interface CreateHospitalInitialRoleRequest {
  name: string;
  menuPermissions: RoleMenuPermission[];
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
  licenseNumber?: string | null;
  taxNumber?: string | null;
  hospitalType?: string | null;
  hospitalSize?: string | null;
  currencySymbol?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  defaultLanguage?: string | null;
  defaultTimeZoneId?: string | null;
  mrnFormat?: string | null;
  mrnPrefix?: string | null;
  registrationSlipTemplateJson?: string | null;
  medicineSlipTemplateJson?: string | null;
  allowHospitalBranchManagement?: boolean | null;
}

export interface SetHospitalMenusRequest {
  menuIds: number[];
}

// ── Hospital configuration console (database-driven schema) ─────────────────

export interface HospitalConfiguration {
  hospitalId: number;
  hospitalCode: string;
  hospitalName: string;
  mrnNextNumber: number;
  mrnPreview?: string | null;
  categories: HospitalConfigurationCategory[];
}

export interface HospitalConfigurationCategory {
  /** Category code: Profile, Localization, Mrn, Features. */
  code: string;
  /** Menu code gating this category (permission checks). */
  menuCode: string;
  settings: HospitalConfigurationSetting[];
}

export interface HospitalConfigurationSetting {
  key: string;
  label: string;
  description?: string | null;
  /** Text | Select | Boolean | Number. */
  dataType: string;
  isRequired: boolean;
  maxLength?: number | null;
  defaultValue?: string | null;
  sortOrder: number;
  isEditable: boolean;
  value?: string | null;
  options: HospitalConfigurationOption[];
}

export interface HospitalConfigurationOption {
  value: string;
  label: string;
}

export interface UpdateHospitalConfigurationRequest {
  settings: { key: string; value?: string | null }[];
}

export interface UpdateSlipTemplateRequest {
  templateJson: string;
}

export interface User {
  id: number;
  userName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  employeeNumber?: string | null;
  /** en | ur | ar */
  language?: string | null;
  profilePictureUrl?: string | null;
  profilePictureBase64?: string | null;
  lastLoginAt?: string | null;
  lastPasswordChangeAt?: string | null;
  isActive: boolean;
  roleId?: number | null;
  roleName?: string | null;
  hospitalId?: number | null;
  /** "AllBranches" | "AssignedOnly" */
  branchAccessMode?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserDetail extends User {
  departments: Department[];
  branches: BranchSummary[];
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
  jobTitle?: string | null;
  employeeNumber?: string | null;
  language?: string | null;
  profilePictureBase64?: string | null;
  roleId?: number | null;
  hospitalId?: number | null;
  isActive?: boolean;
  branchIds?: number[];
  defaultBranchId?: number | null;
  /** "AllBranches" | "AssignedOnly" */
  branchAccessMode?: string;
}

export interface UpdateUserRequest {
  userName?: string | null;
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  employeeNumber?: string | null;
  language?: string | null;
  /** Base64 or data URL; empty string clears picture. */
  profilePictureBase64?: string | null;
  isActive?: boolean | null;
  roleId?: number | null;
  hospitalId?: number | null;
  /** "AllBranches" | "AssignedOnly" */
  branchAccessMode?: string | null;
}

/** Self-service profile preferences (no admin.users required). */
export interface UpdateMyProfileRequest {
  language?: string | null;
  /** Base64 or data URL; empty string clears picture. */
  profilePictureBase64?: string | null;
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
  hospitalId?: number | null;
}

export interface RoleDetail extends Role {
  menuIds: number[];
  menuPermissions: RoleMenuPermission[];
  menuTree: AppMenuTree[];
}

export interface RoleMenuPermission {
  menuId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  menuIds: number[];
  menuPermissions: RoleMenuPermission[];
}

export interface UpdateRoleRequest {
  name?: string | null;
  description?: string | null;
  menuIds?: number[] | null;
  menuPermissions?: RoleMenuPermission[] | null;
}

export interface SetRoleMenusRequest {
  menuIds: number[];
  menuPermissions: RoleMenuPermission[];
}

export interface AppMenu {
  id: number;
  parentId?: number | null;
  code: string;
  label: string;
  route?: string | null;
  icon?: string | null;
  permissionKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  isVisible: boolean;
}

export interface AppMenuTree extends AppMenu {
  children: AppMenuTree[];
}

export interface CreateMenuRequest {
  parentId?: number | null;
  code: string;
  label: string;
  route?: string | null;
  icon?: string | null;
  permissionKey?: string | null;
  sortOrder: number;
  isActive: boolean;
  isVisible: boolean;
}

export interface UpdateMenuRequest {
  parentId?: number | null;
  code?: string | null;
  label?: string | null;
  route?: string | null;
  icon?: string | null;
  permissionKey?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
  isVisible?: boolean | null;
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
  doctorId?: number | null;
  priority?: string | null;
  clinicalServiceId: number;
  servicePrice: number;
  serviceDiscount: number;
  remarks?: string | null;
}

export interface CreatePatientVisitRequest {
  patientId: number;
  admissionId?: number | null;
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
  doctorId?: number | null;
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
  branchId: number;
  branchName?: string | null;
  patientId: number;
  admissionId?: number | null;
  totalAmount: number;
  discountAmount: number;
  receivedAmount: number;
  remarks?: string | null;
  recordedByUserId?: number | null;
  visitDate: string;
  isPrinted: boolean;
  admissionReferralRequestedAt?: string | null;
  admissionReferralCompletedAt?: string | null;
  admissionReferralReason?: string | null;
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
  branchId: number;
  branchName?: string | null;
  patientId: number;
  patientName: string;
  phone?: string | null;
  ageYears: number;
  gender: string;
  visitDate: string;
  isPrinted: boolean;
  hasCheckup: boolean;
  hasLabOrder: boolean;
  labOrderStatus?: string | null;
  doctorSummary?: string | null;
  extraDoctorCount: number;
  serviceSummary1?: string | null;
  serviceSummary2?: string | null;
  extraServiceCount: number;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  receivedAmount: number;
  remarks?: string | null;
}

export type PatientVisitRegisterLogPage = PagedResponse<PatientVisitRegisterLogItemResponse>;

export interface FinancialTrendPoint {
  date: string;
  visitCount: number;
  totalServiceAmount: number;
  totalDiscount: number;
  netAmount: number;
  totalReceived: number;
}

export interface FinancialSummaryResponse {
  fromDate: string;
  toDate: string;
  visitCount: number;
  totalServiceAmount: number;
  totalDiscount: number;
  netAmount: number;
  totalReceived: number;
  outstandingAmount: number;
  trend: FinancialTrendPoint[];
}

export interface ServiceSalesItem {
  clinicalServiceId: number;
  serviceName: string;
  serviceCode?: string | null;
  lineCount: number;
  totalAmount: number;
  discount: number;
  netAmount: number;
}

export interface ServiceSalesSummaryResponse {
  fromDate: string;
  toDate: string;
  totalLineCount: number;
  totalServiceAmount: number;
  totalDiscount: number;
  netAmount: number;
  items: ServiceSalesItem[];
}

// ── Laboratory ─────────────────────────────────────────────────────────────

export interface LabTestCategory {
  id: number;
  hospitalId: number;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

/** Mirrors API `LabTestResponse`. */
export interface LabTest {
  id: number;
  hospitalId: number;
  categoryId?: number | null;
  categoryName?: string | null;
  code: string;
  name: string;
  sampleType?: string | null;
  turnaroundHours?: number | null;
  unit?: string | null;
  referenceRange?: string | null;
  price: number;
  isActive: boolean;
  clinicalServiceId?: number | null;
  method?: string | null;
  instrument?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  sampleVolume?: string | null;
  preparationInstructions?: string | null;
  fastingRequired?: boolean;
  homeCollection?: boolean;
  outsourcedLab?: string | null;
  cptCode?: string | null;
  loincCode?: string | null;
  parameters?: LabTestParameter[];
}

export type LabTestResponse = LabTest;

export interface CreateLabTestRequest {
  categoryId?: number | null;
  code: string;
  name: string;
  sampleType?: string | null;
  turnaroundHours?: number | null;
  unit?: string | null;
  referenceRange?: string | null;
  price: number;
  isActive: boolean;
  clinicalServiceId?: number | null;
  hospitalId?: number | null;
  method?: string | null;
  instrument?: string | null;
  departmentId?: number | null;
  sampleVolume?: string | null;
  preparationInstructions?: string | null;
  fastingRequired?: boolean;
  homeCollection?: boolean;
  outsourcedLab?: string | null;
  cptCode?: string | null;
  loincCode?: string | null;
}

export type UpdateLabTestRequest = Omit<CreateLabTestRequest, 'hospitalId'>;

export interface LabOrderLine {
  id: number;
  labOrderId: number;
  labTestId: number;
  testCode: string;
  testName: string;
  status: string;
  price: number;
  specimenCollectedAt?: string | null;
  accessionNumber?: string | null;
  result?: LabResult | null;
  testParameters?: LabTestParameter[];
}

export interface LabResult {
  id: number;
  labOrderLineId: number;
  value?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  abnormalFlag: string;
  notes?: string | null;
  verifiedByUserId?: number | null;
  verifiedAt?: string | null;
  reportUrl?: string | null;
  pdfReportUrl?: string | null;
  releasedByUserId?: number | null;
  releasedByUserName?: string | null;
  printedByUserId?: number | null;
  printedByUserName?: string | null;
  printedAt?: string | null;
  parameters?: LabResultParameter[];
}

export interface LabResultParameter {
  id: number;
  labTestParameterId?: number | null;
  code: string;
  name: string;
  value?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  abnormalFlag: string;
}

export interface LabOrderSaveResponse {
  id: number;
  patientVisitId: number;
  orderNumber: string;
  status: string;
  priority: string;
  clinicalNotes?: string | null;
  orderedByDoctorId?: number | null;
  orderedByDoctorName?: string | null;
  totalAmount: number;
  lines: LabOrderLine[];
}

export interface LabOrderResponse extends LabOrderSaveResponse {
  hospitalId: number;
  branchId: number;
  branchName?: string | null;
  patientId: number;
  patientName: string;
  patientNumber?: string | null;
  labNotes?: string | null;
  createdAt: string;
}

export interface SaveLabOrderLineRequest {
  labTestId: number;
}

export interface SaveVisitLabOrderRequest {
  priority?: string | null;
  orderedByDoctorId?: number | null;
  clinicalNotes?: string | null;
  testLines: SaveLabOrderLineRequest[];
}

export interface UpdateLabOrderPriorityRequest {
  priority: string;
}

export interface LabWorklistItem {
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientNumber?: string | null;
  patientVisitId: number;
  priority: string;
  orderStatus: string;
  orderedByDoctorId?: number | null;
  orderedByDoctorName?: string | null;
  totalAmount: number;
  pendingLineCount: number;
  totalLineCount: number;
  testSummary: string;
  branchId?: number;
  branchName?: string | null;
  createdAt: string;
  turnaroundHours?: number | null;
  dueAt?: string | null;
  isOverdue?: boolean;
}

export interface LabStatusCount {
  status: string;
  count: number;
}

export interface LabPendingSummary {
  totalPending: number;
  byStatus: LabStatusCount[];
}

export interface LabCompletedReportRow {
  orderNumber: string;
  patientName: string;
  patientNumber?: string | null;
  testName: string;
  branchName?: string | null;
  releasedAt: string;
}

export interface LabDailyVolumeRow {
  date: string;
  orderCount: number;
  lineCount: number;
  releasedCount: number;
}

export interface SaveLabResultRequest {
  value?: string | null;
  unit?: string | null;
  notes?: string | null;
  parameters?: SaveLabResultParameterRequest[];
}

export interface SaveLabResultParameterRequest {
  code: string;
  name: string;
  value: string;
  unit?: string | null;
  referenceRange?: string | null;
  labTestParameterId?: number | null;
}

export interface UpdateLabOrderLineStatusRequest {
  status: string;
  notes?: string | null;
}

export interface LabOrderEvent {
  id: number;
  labOrderId: number;
  labOrderLineId?: number | null;
  eventType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  notes?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface LoginHeroImage {
  id: number;
  imageUrl: string;
  mobileImageUrl: string;
  altText?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateLoginHeroImageRequest {
  altText?: string | null;
  isActive?: boolean | null;
}

// ── Pharmacy ───────────────────────────────────────────────────────────────

export interface PhrmySupplier {
  id: number;
  hospitalId: number;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface PhrmySupplierRequest {
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface PhrmyStockRow {
  medicineId: number;
  medicineName: string;
  medicineCode: string;
  unit?: string | null;
  reorderLevel?: number | null;
  qtyOnHand: number;
  isLowStock: boolean;
}

export interface PhrmyBatch {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  qtyOnHand: number;
  unitCost: number;
  salePrice: number;
  receivedAt: string;
}

export interface PhrmyPurchaseOrder {
  id: number;
  hospitalId: number;
  branchId: number;
  supplierId: number;
  supplierName: string;
  orderNo: string;
  orderDate: string;
  status: string;
  notes?: string | null;
  lines: {
    id: number;
    medicineId: number;
    medicineName: string;
    medicineCode: string;
    orderedQty: number;
    unitCost: number;
  }[];
}

export interface PhrmyGoodsReceipt {
  id: number;
  hospitalId: number;
  branchId: number;
  supplierId: number;
  supplierName: string;
  purchaseOrderId?: number | null;
  receiptNo: string;
  receiptDate: string;
  invoiceNo?: string | null;
  notes?: string | null;
  lines: {
    id: number;
    medicineId: number;
    medicineName: string;
    batchNumber: string;
    expiryDate: string;
    qty: number;
    unitCost: number;
    salePriceOverride?: number | null;
  }[];
}

export interface CreatePhrmyGoodsReceiptRequest {
  supplierId: number;
  purchaseOrderId?: number | null;
  receiptDate: string;
  invoiceNo?: string | null;
  notes?: string | null;
  lines: {
    medicineId: number;
    batchNumber: string;
    expiryDate: string;
    qty: number;
    unitCost: number;
    salePriceOverride?: number | null;
  }[];
}

export interface PhrmyRxQueueItem {
  checkupId: number;
  patientVisitId: number;
  patientId: number;
  patientName: string;
  mrn?: string | null;
  doctorName?: string | null;
  checkupAt: string;
  pendingLineCount: number;
  lines: PhrmyRxQueueLine[];
}

export interface PhrmyRxQueueLine {
  patientMedicineId: number;
  medicineId: number;
  medicineName: string;
  medicineCode: string;
  dose?: string | null;
  durationDays?: number | null;
  quantity?: number | null;
  dispensedQty: number;
  remainingQty: number;
  dispenseStatus: string;
  usageShortCode?: string | null;
}

export interface PhrmySale {
  id: number;
  hospitalId: number;
  branchId: number;
  saleNo: string;
  saleDate: string;
  saleType: string;
  patientVisitId?: number | null;
  checkupId?: number | null;
  patientId?: number | null;
  patientName?: string | null;
  status: string;
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string | null;
  lines: {
    id: number;
    medicineId: number;
    medicineName: string;
    batchId: number;
    batchNumber: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    patientMedicineId?: number | null;
  }[];
}

export interface CreatePhrmySaleRequest {
  saleType: string;
  patientVisitId?: number | null;
  checkupId?: number | null;
  patientId?: number | null;
  discount?: number;
  tax?: number;
  notes?: string | null;
  lines: {
    medicineId: number;
    batchId?: number | null;
    qty: number;
    unitPrice?: number | null;
    patientMedicineId?: number | null;
  }[];
}

export interface PhrmyReturn {
  id: number;
  saleId: number;
  returnNo: string;
  returnDate: string;
  reason?: string | null;
  status: string;
  lines: {
    id: number;
    saleLineId: number;
    batchId: number;
    qty: number;
    refundAmount: number;
  }[];
}

export interface PhrmyDashboard {
  pendingRxCount: number;
  lowStockCount: number;
  expiringSoonCount: number;
  todaySalesTotal: number;
  todaySalesCount: number;
}

export interface PhrmySalesReportRow {
  date: string;
  saleCount: number;
  total: number;
}

export interface PhrmyStockMovementReportRow {
  id: number;
  createdAt: string;
  medicineName: string;
  batchNumber: string;
  movementType: string;
  qty: number;
  refType?: string | null;
  refId?: number | null;
  notes?: string | null;
}

// -- Billing ----------------------------------------------------------------

export interface BillingInvoiceLine {
  id: number;
  sourceType: string;
  patientVisitDetailId?: number | null;
  clinicalServiceId?: number | null;
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface BillingPayment {
  id: number;
  paymentNo: string;
  invoiceId: number;
  patientId: number;
  method: string;
  amount: number;
  paidAt: string;
  cashSessionId?: number | null;
  receivedByUserId: number;
  receivedByUserName?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
}

export interface BillingInvoice {
  id: number;
  hospitalId: number;
  branchId: number;
  invoiceNo: string;
  patientId: number;
  patientName: string;
  patientVisitId?: number | null;
  admissionId?: number | null;
  invoiceDate: string;
  status: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string | null;
  lines: BillingInvoiceLine[];
  payments: BillingPayment[];
}

export interface CreateBillingInvoiceFromVisitRequest {
  patientVisitId: number;
  notes?: string | null;
}

export interface AddBillingManualLineRequest {
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

export interface CreateBillingPaymentRequest {
  invoiceId: number;
  method: string;
  amount: number;
  referenceNo?: string | null;
  notes?: string | null;
}

export interface BillingCashSession {
  id: number;
  hospitalId: number;
  branchId: number;
  sessionNo: string;
  sessionType: string;
  parentSessionId?: number | null;
  parentSessionNo?: string | null;
  cashierUserId: number;
  cashierUserName: string;
  businessDate: string;
  openedAt: string;
  closedAt?: string | null;
  status: string;
  openingFloat: number;
  expectedCash: number;
  declaredCash: number;
  variance: number;
  notes?: string | null;
  cashCollected: number;
  openChildCount: number;
}

export interface OpenBillingCashSessionRequest {
  openingFloat: number;
  businessDate?: string | null;
  notes?: string | null;
}

export interface CloseBillingCashSessionRequest {
  declaredCash: number;
  notes?: string | null;
}

export interface BillingDailyCollectionRow {
  cashierUserId: number;
  cashierUserName: string;
  sessionType: string;
  sessionNo: string;
  cashCollected: number;
  cardCollected: number;
  bankCollected: number;
  otherCollected: number;
  totalCollected: number;
  status: string;
}

export interface BillingDayEndSummary {
  businessDate: string;
  branchId: number;
  headSession?: BillingCashSession | null;
  collections: BillingDailyCollectionRow[];
  totalCash: number;
  totalNonCash: number;
  totalCollected: number;
  outstandingBalance: number;
}

/** Platform Developer console */

export interface PlatformSummary {
  totalHospitals: number;
  activeHospitals: number;
  suspendedHospitals: number;
  inactiveHospitals: number;
  platformUserCount: number;
  licensePackageCount: number;
  maintenanceMode: boolean;
  appName: string;
  recentHospitals: HospitalSummaryItem[];
}

export interface HospitalSummaryItem {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
}

export interface ApplicationSettings {
  id: number;
  appName: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  maintenanceMode: boolean;
  maintenanceMessage?: string | null;
  auditLogsEnabled: boolean;
  updatedAt: string;
}

export interface PublicApplicationSettings {
  appName: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  maintenanceMode: boolean;
  maintenanceMessage?: string | null;
}

export interface UpdateApplicationSettingsRequest {
  appName?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  maintenanceMode?: boolean | null;
  maintenanceMessage?: string | null;
  auditLogsEnabled?: boolean | null;
}

export interface MenuPackage {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  menuIds: number[];
  menus: MenuSummary[];
}

export interface CreateMenuPackageRequest {
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  menuIds: number[];
}

export interface UpdateMenuPackageRequest {
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
  menuIds?: number[] | null;
}

export interface ApplyMenuPackageRequest {
  replaceExisting?: boolean;
}

export interface CreatePlatformUserRequest {
  userName: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface UpdatePlatformUserRequest {
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean | null;
}

export interface ResetHospitalAdminPasswordRequest {
  newPassword: string;
  userId?: number | null;
}

export interface ResetHospitalAdminPasswordResponse {
  userId: number;
  userName: string;
  email: string;
  message: string;
}

export interface ImpersonateRequest {
  userId?: number | null;
  hospitalId?: number | null;
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ── IPD ─────────────────────────────────────────────────────────────────────

export interface Ward {
  id: number;
  hospitalId: number;
  branchId: number;
  branchName?: string | null;
  departmentId: number;
  departmentName?: string | null;
  wardCode: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  status: string;
  bedCount: number;
  availableBedCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateWardRequest {
  departmentId: number;
  wardCode: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  status: string;
}

export interface UpdateWardRequest {
  wardCode?: string | null;
  name?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  status?: string | null;
}

export interface Bed {
  id: number;
  hospitalId: number;
  branchId: number;
  branchName?: string | null;
  wardId: number;
  wardName?: string | null;
  departmentName?: string | null;
  bedNumber: string;
  bedType: string;
  status: string;
  currentAdmissionId?: number | null;
  currentPatientName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateBedRequest {
  wardId: number;
  bedNumber: string;
  bedType: string;
  status: string;
}

export interface UpdateBedRequest {
  bedNumber?: string | null;
  bedType?: string | null;
  status?: string | null;
}

export interface Admission {
  id: number;
  hospitalId: number;
  branchId: number;
  branchName?: string | null;
  admissionNumber: string;
  patientId: number;
  patientName: string;
  patientNumber?: string | null;
  departmentId: number;
  departmentName: string;
  doctorId: number;
  doctorName: string;
  wardId: number;
  wardName: string;
  bedId: number;
  bedNumber: string;
  admissionDate: string;
  expectedDischargeDate?: string | null;
  reasonForAdmission?: string | null;
  diagnosis?: string | null;
  status: string;
  dischargeDate?: string | null;
  dischargeSummary?: string | null;
  dischargeInstructions?: string | null;
  daysAdmitted: number;
  runningInvoiceId?: number | null;
  runningInvoiceNo?: string | null;
  runningBalance: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ActiveInpatient extends Admission {
  hasTodayVisit: boolean;
  todayVisitId?: number | null;
}

export interface CreateAdmissionRequest {
  patientId: number;
  departmentId: number;
  doctorId: number;
  wardId: number;
  bedId: number;
  admissionDate?: string | null;
  expectedDischargeDate?: string | null;
  reasonForAdmission?: string | null;
  diagnosis?: string | null;
  initialCharges?: CreatePatientVisitDetailLineRequest[];
}

export interface TransferAdmissionRequest {
  wardId: number;
  bedId: number;
}

export interface DischargeAdmissionRequest {
  dischargeSummary?: string | null;
  dischargeInstructions?: string | null;
  dischargeDate?: string | null;
}

export interface EnsureTodayVisitResponse {
  visitId: number;
  created: boolean;
}

