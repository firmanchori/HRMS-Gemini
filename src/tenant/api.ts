// Relative by default so requests go through this page's own origin (dev
// server proxies /api/* to the backend — see vite.config.ts) and stay
// same-site for the session cookie. Override via VITE_API_BASE when the API
// truly lives on a different origin (e.g. a production deployment).
const API_BASE = import.meta.env.VITE_API_BASE || "";

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || `Request failed (${res.status})`, res.status, body.details);
  return body as T;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  entityId: string | null;
  role: "tenant_admin";
  name: string;
  email: string;
  createdAt: string;
}

export interface CompanyEntity {
  id: string;
  tenantId: string;
  parentEntityId: string | null;
  name: string;
  code: string;
  emailDomain: string | null;
  relationType: "resmi" | "administratif";
  useDepartmentLevel: boolean;
  npwp: string | null;
  address: string | null;
  city: string | null;
  nikPattern: string | null;
  nikPatternFollowsParent: boolean;
  docPrefix: string | null;
  status: "Aktif" | "Nonaktif";
  isGovernanceLocked: boolean;
  documentLogoUrl: string | null;
  appFaviconUrl: string | null;
  createdByEntityId: string | null;
  createdAt: string;
}

export interface EntityTreeNode {
  entity: CompanyEntity;
  children: EntityTreeNode[];
}

export interface CompanyDivision {
  id: string;
  tenantId: string;
  entityId: string;
  code: string;
  name: string;
  headTitle: string | null;
  description: string | null;
}

export interface CompanyDepartment {
  id: string;
  tenantId: string;
  entityId: string;
  divisionId: string | null;
  code: string;
  name: string;
  headTitle: string | null;
  description: string | null;
}

export interface MasterJobPosition {
  id: string;
  tenantId: string;
  entityId: string;
  code: string;
  title: string;
  defaultLevel: number;
  divisionId: string | null;
  departmentId: string | null;
  jobFamily: string | null;
  jobGrade: string | null;
  minGrade: string | null;
  maxGrade: string | null;
  gradingScheme: "single" | "broadbanding";
  description: string | null;
  requirements: string | null;
}

export interface OrgStructureNode {
  id: string;
  tenantId: string;
  entityId: string;
  title: string;
  divisionId: string | null;
  departmentId: string | null;
  code: string | null;
  jobGrade: string | null;
  description: string | null;
  reportsToId: string | null;
  relationType: "struktural" | "administratif";
  isVacant: boolean;
  level: number;
  masterJobPositionId: string | null;
}

export interface OrgStructure {
  divisions: CompanyDivision[];
  departments: CompanyDepartment[];
  positions: MasterJobPosition[];
  orgNodes: OrgStructureNode[];
}

export interface GradeSalaryRange {
  id: string;
  tenantId: string;
  entityId: string | null;
  gradeCode: string;
  gradeName: string;
  minSalary: number | null;
  midSalary: number | null;
  maxSalary: number | null;
  singleValueSalary: number | null;
  effectiveDate: string;
  version: number;
  notes: string | null;
}

export interface OfficeLocation {
  id: string;
  tenantId: string;
  entityId: string | null;
  code: string;
  name: string;
  type: "Kantor Pusat" | "Kantor Cabang" | "Gudang" | "Workshop" | "Site Operasional";
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  isActive: boolean;
  notes: string | null;
}

export interface EducationLevel {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FieldOfStudy {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  isActive: boolean;
}

export type EmploymentStatus = "Aktif" | "Cuti Panjang" | "Resign" | "Diberhentikan" | "Pensiun";

export interface Employee {
  id: string;
  tenantId: string;
  entityId: string;
  nik: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  positionId: string | null;
  divisionId: string | null;
  departmentId: string | null;
  orgNodeId: string | null;
  employmentStatus: EmploymentStatus;
  joinDate: string | null;
  resignDate: string | null;
  resignReason: string | null;
}

export interface DocumentSignatoryConfig {
  id: string;
  tenantId: string;
  documentType: string;
  roleLabel: string;
  isRequired: boolean;
  sortOrder: number;
}

export type JobRequisitionStatus = "Draft" | "Menunggu Approval" | "Disetujui" | "Ditolak" | "Dibatalkan" | "Dicabut (Retracted)";
export type JobRequisitionType = "Baru" | "Penggantian";

export interface JobRequisition {
  id: string;
  tenantId: string;
  entityId: string;
  officeLocationId: string | null;
  divisionId: string | null;
  departmentId: string | null;
  positionId: string | null;
  requestedByUserId: string;
  requisitionType: JobRequisitionType;
  replacementEmployeeId: string | null;
  headcount: number;
  educationLevelId: string | null;
  fieldsOfStudyIds: string[];
  minExperienceYears: number;
  knockoutCriteria: unknown[];
  scoredCriteria: unknown[];
  signatories: unknown[];
  status: JobRequisitionStatus;
  /** Free-text/descriptive FPTK fields not worth a dedicated column — reqNumber, position title, grade labels, requester/approver names, etc. */
  details: Record<string, unknown>;
  createdAt: string;
}

export type JobVacancyStatus = "Buka" | "Ditutup";

export interface JobVacancy {
  id: string;
  tenantId: string;
  entityId: string;
  jobRequisitionId: string | null;
  title: string;
  openings: number;
  status: JobVacancyStatus;
  postedDate: string;
  targetCloseDate: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Candidate {
  id: string;
  tenantId: string;
  jobVacancyId: string;
  name: string;
  email: string;
  phone: string | null;
  stage: string;
  appliedDate: string;
  aiMatchScore: number | null;
  testScore: number | null;
  interviewScore: number | null;
  offeredSalary: number | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export type OnboardingStatus = "In Progress" | "Completed" | "Cancelled";
export type OnboardingType = "via_recruitment" | "direct";

export interface OnboardingProcess {
  id: string;
  tenantId: string;
  entityId: string;
  type: OnboardingType;
  candidateId: string | null;
  employeeName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  departmentId: string | null;
  joinDate: string | null;
  basicSalary: number | null;
  contractDocNumber: string | null;
  status: OnboardingStatus;
  createdEmployeeId: string | null;
  tasks: unknown[];
  details: Record<string, unknown>;
  createdAt: string;
}

export interface CompetencyTestTypeSetting {
  id: string;
  tenantId: string;
  name: string;
  category: "Hard Skill" | "Soft Skill" | "Kognitif & Logika" | "Bahasa" | "Studi Kasus" | "Praktik Kerja";
  passingGrade: number;
  durationMinutes: number;
  method: "Online Test" | "Live Coding" | "Presentasi" | "Tatap Muka" | "Studi Kasus Mandiri";
  description: string | null;
  weightPercent: number | null;
  isActive: boolean;
}

export interface InterviewTypeSetting {
  id: string;
  tenantId: string;
  name: string;
  targetRole: string | null;
  description: string | null;
  interviewerRoles: string | null;
  criteria: unknown[];
  isActive: boolean;
}

export type OrgChangeSet = { create?: Record<string, unknown>[]; update?: { id: string; data: Record<string, unknown> }[]; delete?: string[] };

export interface OrgChangeProposal {
  id: string;
  tenantId: string;
  entityId: string;
  title: string;
  description: string | null;
  officialLetterNumber: string | null;
  changes: { divisions?: OrgChangeSet; departments?: OrgChangeSet; positions?: OrgChangeSet; orgNodes?: OrgChangeSet };
  status: "Draft" | "PendingApproval" | "Approved" | "Rejected";
  proposedByUserId: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export const tenantApi = {
  // Entities
  createEntity: (
    data: Partial<CompanyEntity> & {
      name: string;
      code: string;
      followParentNikPattern?: boolean;
      /** Required when parentEntityId is set — the one admin account this call provisions for the new child entity. */
      admin?: { name: string; email: string; password: string };
    }
  ) => request<CompanyEntity & { admin: { id: string; name: string; email: string } | null }>("/api/tenant/entities", { method: "POST", body: JSON.stringify(data) }),
  listEntities: (viewAsEntityId?: string) => request<CompanyEntity[]>(`/api/tenant/entities${viewAsEntityId ? `?viewAsEntityId=${viewAsEntityId}` : ""}`),
  getEntityTree: () => request<EntityTreeNode[]>("/api/tenant/entities/tree"),
  getEntity: (id: string) => request<CompanyEntity>(`/api/tenant/entities/${id}`),
  updateEntity: (id: string, data: Partial<CompanyEntity> & { followParentNikPattern?: boolean }) =>
    request<CompanyEntity>(`/api/tenant/entities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getOrgStructure: (entityId: string) => request<OrgStructure>(`/api/tenant/entities/${entityId}/org-structure`),

  // Users — each tenant_admin manages only their own entity's roster; viewing follows the same vertical rule as entities.
  listUsers: () => request<TenantUser[]>("/api/tenant/users"),
  createUser: (data: { name: string; email: string; password: string }) => request<TenantUser>("/api/tenant/users", { method: "POST", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<{ ok: true }>(`/api/tenant/users/${id}`, { method: "DELETE" }),

  // Direct CRUD — only works while the entity is unlocked (isGovernanceLocked = false); 403 once locked.
  createDivision: (data: Omit<CompanyDivision, "id" | "tenantId">) => request<CompanyDivision>("/api/tenant/divisions", { method: "POST", body: JSON.stringify(data) }),
  listDivisions: () => request<CompanyDivision[]>("/api/tenant/divisions"),
  updateDivision: (id: string, data: Partial<CompanyDivision>) => request<CompanyDivision>(`/api/tenant/divisions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDivision: (id: string) => request<{ ok: true }>(`/api/tenant/divisions/${id}`, { method: "DELETE" }),

  createDepartment: (data: Omit<CompanyDepartment, "id" | "tenantId">) => request<CompanyDepartment>("/api/tenant/departments", { method: "POST", body: JSON.stringify(data) }),
  listDepartments: () => request<CompanyDepartment[]>("/api/tenant/departments"),
  updateDepartment: (id: string, data: Partial<CompanyDepartment>) => request<CompanyDepartment>(`/api/tenant/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDepartment: (id: string) => request<{ ok: true }>(`/api/tenant/departments/${id}`, { method: "DELETE" }),

  createPosition: (data: Omit<MasterJobPosition, "id" | "tenantId">) => request<MasterJobPosition>("/api/tenant/positions", { method: "POST", body: JSON.stringify(data) }),
  listPositions: () => request<MasterJobPosition[]>("/api/tenant/positions"),
  updatePosition: (id: string, data: Partial<MasterJobPosition>) => request<MasterJobPosition>(`/api/tenant/positions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePosition: (id: string) => request<{ ok: true }>(`/api/tenant/positions/${id}`, { method: "DELETE" }),

  createOrgNode: (data: Omit<OrgStructureNode, "id" | "tenantId">) => request<OrgStructureNode>("/api/tenant/org-nodes", { method: "POST", body: JSON.stringify(data) }),
  listOrgNodes: () => request<OrgStructureNode[]>("/api/tenant/org-nodes"),
  updateOrgNode: (id: string, data: Partial<OrgStructureNode>) => request<OrgStructureNode>(`/api/tenant/org-nodes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOrgNode: (id: string) => request<{ ok: true }>(`/api/tenant/org-nodes/${id}`, { method: "DELETE" }),

  // Grades — plain CRUD, never gated by the governance lock.
  createGrade: (data: Omit<GradeSalaryRange, "id" | "tenantId" | "effectiveDate" | "version">) =>
    request<GradeSalaryRange>("/api/tenant/grades", { method: "POST", body: JSON.stringify(data) }),
  listGrades: () => request<GradeSalaryRange[]>("/api/tenant/grades"),
  updateGrade: (id: string, data: Partial<GradeSalaryRange>) => request<GradeSalaryRange>(`/api/tenant/grades/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteGrade: (id: string) => request<{ ok: true }>(`/api/tenant/grades/${id}`, { method: "DELETE" }),

  // Office locations — plain CRUD.
  createOfficeLocation: (data: Omit<OfficeLocation, "id" | "tenantId" | "isActive">) =>
    request<OfficeLocation>("/api/tenant/office-locations", { method: "POST", body: JSON.stringify(data) }),
  listOfficeLocations: () => request<OfficeLocation[]>("/api/tenant/office-locations"),
  updateOfficeLocation: (id: string, data: Partial<OfficeLocation>) =>
    request<OfficeLocation>(`/api/tenant/office-locations/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Org change proposals — the formal path once an entity is governance-locked.
  createProposal: (data: { entityId: string; title: string; description?: string; officialLetterNumber?: string; changes: OrgChangeProposal["changes"] }) =>
    request<OrgChangeProposal>("/api/tenant/org-change-proposals", { method: "POST", body: JSON.stringify(data) }),
  listProposals: (entityId?: string) => request<OrgChangeProposal[]>(`/api/tenant/org-change-proposals${entityId ? `?entityId=${entityId}` : ""}`),
  getProposal: (id: string) => request<OrgChangeProposal>(`/api/tenant/org-change-proposals/${id}`),
  updateProposal: (id: string, data: Partial<Pick<OrgChangeProposal, "title" | "description" | "officialLetterNumber" | "changes">>) =>
    request<OrgChangeProposal>(`/api/tenant/org-change-proposals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  submitProposal: (id: string) => request<OrgChangeProposal>(`/api/tenant/org-change-proposals/${id}/submit`, { method: "POST" }),
  approveProposal: (id: string) => request<OrgChangeProposal>(`/api/tenant/org-change-proposals/${id}/approve`, { method: "POST" }),
  rejectProposal: (id: string, rejectionReason: string) =>
    request<OrgChangeProposal>(`/api/tenant/org-change-proposals/${id}/reject`, { method: "POST", body: JSON.stringify({ rejectionReason }) }),

  // Master data — education levels & fields of study (user, 2026-11-02: these must have real master data, not a hardcoded list).
  listEducationLevels: () => request<EducationLevel[]>("/api/tenant/education-levels"),
  createEducationLevel: (data: { name: string; sortOrder?: number }) => request<EducationLevel>("/api/tenant/education-levels", { method: "POST", body: JSON.stringify(data) }),
  updateEducationLevel: (id: string, data: Partial<EducationLevel>) => request<EducationLevel>(`/api/tenant/education-levels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEducationLevel: (id: string) => request<{ ok: true }>(`/api/tenant/education-levels/${id}`, { method: "DELETE" }),

  listFieldsOfStudy: () => request<FieldOfStudy[]>("/api/tenant/fields-of-study"),
  createFieldOfStudy: (data: { name: string; category?: string }) => request<FieldOfStudy>("/api/tenant/fields-of-study", { method: "POST", body: JSON.stringify(data) }),
  updateFieldOfStudy: (id: string, data: Partial<FieldOfStudy>) => request<FieldOfStudy>(`/api/tenant/fields-of-study/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFieldOfStudy: (id: string) => request<{ ok: true }>(`/api/tenant/fields-of-study/${id}`, { method: "DELETE" }),

  // Employees — real headcount; the "inactive" list is what the FPTK "Nama Karyawan Sebelumnya (Jika Penggantian)" dropdown uses.
  listEmployees: () => request<Employee[]>("/api/tenant/employees"),
  listInactiveEmployees: () => request<Employee[]>("/api/tenant/employees/inactive"),
  createEmployee: (data: Omit<Employee, "id" | "tenantId">) => request<Employee>("/api/tenant/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: Partial<Employee>) => request<Employee>(`/api/tenant/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Document signatory config — set once per document type in Document Management, read by every document-generating flow (FPTK first).
  listDocumentSignatoryConfigs: (documentType?: string) =>
    request<DocumentSignatoryConfig[]>(`/api/tenant/document-signatory-configs${documentType ? `?documentType=${encodeURIComponent(documentType)}` : ""}`),
  createDocumentSignatoryConfig: (data: { documentType: string; roleLabel: string; isRequired?: boolean; sortOrder?: number }) =>
    request<DocumentSignatoryConfig>("/api/tenant/document-signatory-configs", { method: "POST", body: JSON.stringify(data) }),
  updateDocumentSignatoryConfig: (id: string, data: Partial<DocumentSignatoryConfig>) =>
    request<DocumentSignatoryConfig>(`/api/tenant/document-signatory-configs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDocumentSignatoryConfig: (id: string) => request<{ ok: true }>(`/api/tenant/document-signatory-configs/${id}`, { method: "DELETE" }),

  // Job requisitions (FPTK) — real backend.
  listJobRequisitions: () => request<JobRequisition[]>("/api/tenant/job-requisitions"),
  createJobRequisition: (data: Partial<JobRequisition> & { entityId: string }) =>
    request<JobRequisition>("/api/tenant/job-requisitions", { method: "POST", body: JSON.stringify(data) }),
  updateJobRequisition: (id: string, data: Partial<JobRequisition>) =>
    request<JobRequisition>(`/api/tenant/job-requisitions/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Job vacancies.
  listJobVacancies: () => request<JobVacancy[]>("/api/tenant/job-vacancies"),
  createJobVacancy: (data: Partial<JobVacancy> & { entityId: string; title: string }) =>
    request<JobVacancy>("/api/tenant/job-vacancies", { method: "POST", body: JSON.stringify(data) }),
  updateJobVacancy: (id: string, data: Partial<JobVacancy>) =>
    request<JobVacancy>(`/api/tenant/job-vacancies/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Candidates.
  listCandidates: () => request<Candidate[]>("/api/tenant/candidates"),
  createCandidate: (data: Partial<Candidate> & { jobVacancyId: string; name: string; email: string }) =>
    request<Candidate>("/api/tenant/candidates", { method: "POST", body: JSON.stringify(data) }),
  updateCandidate: (id: string, data: Partial<Candidate>) =>
    request<Candidate>(`/api/tenant/candidates/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Onboarding processes.
  listOnboardingProcesses: () => request<OnboardingProcess[]>("/api/tenant/onboarding-processes"),
  createOnboardingProcess: (data: Partial<OnboardingProcess> & { entityId: string; employeeName: string }) =>
    request<OnboardingProcess>("/api/tenant/onboarding-processes", { method: "POST", body: JSON.stringify(data) }),
  updateOnboardingProcess: (id: string, data: Partial<OnboardingProcess>) =>
    request<OnboardingProcess>(`/api/tenant/onboarding-processes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOnboardingProcess: (id: string) => request<{ ok: true }>(`/api/tenant/onboarding-processes/${id}`, { method: "DELETE" }),

  // Competency test types & interview types — recruitment master config.
  listCompetencyTestTypes: () => request<CompetencyTestTypeSetting[]>("/api/tenant/competency-test-types"),
  createCompetencyTestType: (data: Omit<CompetencyTestTypeSetting, "id" | "tenantId">) =>
    request<CompetencyTestTypeSetting>("/api/tenant/competency-test-types", { method: "POST", body: JSON.stringify(data) }),
  updateCompetencyTestType: (id: string, data: Partial<CompetencyTestTypeSetting>) =>
    request<CompetencyTestTypeSetting>(`/api/tenant/competency-test-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCompetencyTestType: (id: string) => request<{ ok: true }>(`/api/tenant/competency-test-types/${id}`, { method: "DELETE" }),

  listInterviewTypes: () => request<InterviewTypeSetting[]>("/api/tenant/interview-types"),
  createInterviewType: (data: Omit<InterviewTypeSetting, "id" | "tenantId">) =>
    request<InterviewTypeSetting>("/api/tenant/interview-types", { method: "POST", body: JSON.stringify(data) }),
  updateInterviewType: (id: string, data: Partial<InterviewTypeSetting>) =>
    request<InterviewTypeSetting>(`/api/tenant/interview-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInterviewType: (id: string) => request<{ ok: true }>(`/api/tenant/interview-types/${id}`, { method: "DELETE" }),
};
