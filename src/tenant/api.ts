import { getCsrfHeader } from "../shared/csrf";

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
    headers: { "Content-Type": "application/json", ...getCsrfHeader(), ...options.headers },
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

export interface OrgStructureSnapshot {
  id: string;
  tenantId: string;
  entityId: string;
  proposalId: string | null;
  divisions: unknown[];
  departments: unknown[];
  positions: unknown[];
  orgNodes: unknown[];
  skDocNumber: string | null;
  effectiveDate: string | null;
  skDocFileName: string | null;
  changeType: "restrukturisasi" | "modifikasi" | null;
  reason: string | null;
  createdByUserId: string | null;
  takenAt: string;
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

/**
 * Full employee record (src/types/hrms.ts Employee, ~90 fields). Core
 * queryable/joinable columns are first-class; everything else (identity
 * docs, BPJS, bank, allowances, education, family, emergency contacts,
 * contract info, probation, ...) lives in `details`, same pattern as
 * Candidate/JobVacancy/OnboardingProcess.
 */
export interface Employee {
  id: string;
  tenantId: string;
  entityId: string;
  nik: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  employmentType: string;
  positionId: string | null;
  divisionId: string | null;
  departmentId: string | null;
  orgNodeId: string | null;
  managerId: string | null;
  candidateId: string | null;
  status: string;
  basicSalary: number;
  joinDate: string | null;
  resignDate: string | null;
  resignReason: string | null;
  details: Record<string, unknown>;
  createdAt: string;
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

export interface OnboardingChecklistTemplateItem {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  targetDepartment: string;
  verificationType: string;
  actionType: string | null;
  isMandatory: boolean;
  description: string | null;
  subItems: string[];
}

export interface ProbationCategoryScore {
  categoryId: string;
  label: string;
  score: number;
  questions?: { questionId: string; text: string; score: number }[];
}

export interface ProbationEvaluation {
  id: string;
  tenantId: string;
  employeeId: string;
  supervisorId: string | null;
  evaluationDate: string;
  technicalSkillScore: number | null;
  disciplineScore: number | null;
  teamworkScore: number | null;
  initiativeScore: number | null;
  templateId?: string | null;
  categoryScores?: ProbationCategoryScore[] | null;
  overallScore: number;
  recommendation: "Lulus" | "Perpanjang Probation" | "Tidak Lulus";
  extensionDurationMonths: number | null;
  notes: string | null;
  status: "Draft" | "Menunggu Approval" | "Disetujui" | "Ditolak";
  approvedBy: string | null;
  skDocNumber: string | null;
}

export interface ProbationEvaluationCategory {
  id: string;
  label: string;
  questions?: { id: string; text: string }[];
}

export interface ProbationEvaluationTemplate {
  id: string;
  tenantId: string;
  name: string;
  categories: ProbationEvaluationCategory[];
  divisionId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ContractRenewalReview {
  id: string;
  tenantId: string;
  employeeId: string;
  currentContractEnd: string;
  recommendation: "Perpanjang PKWT" | "Alih Status PKWTT (Tetap)" | "Tidak Diperpanjang";
  newDurationMonths: number | null;
  notes: string | null;
  status: "Menunggu Approval" | "Disetujui" | "Ditolak";
  approvedBy: string | null;
  newContractDocNumber: string | null;
}

export interface ApprovalWorkflowItem {
  id: string;
  tenantId: string;
  category: string;
  referenceId: string;
  title: string;
  requesterId: string;
  department: string | null;
  submittedAt: string;
  deadlineAt: string | null;
  level: number;
  totalLevels: number;
  assignedApproverRole: string;
  assignedApproverId: string | null;
  substituteApproverId: string | null;
  status: "Menunggu" | "Disetujui" | "Ditolak" | "Eskalasi Terlambat";
  amount: number | null;
  notes: string | null;
  steps?: ApprovalStepState[];
  history?: { at: string; level: number; action: string; byEmployeeId: string | null; byName: string; reason?: string | null; viaDelegation?: boolean }[];
  rejectionReason?: string | null;
}

export interface ApprovalStepState {
  level: number;
  mode: "approve" | "acknowledge";
  label: string;
  approverType: "direct_manager" | "manager_of_manager" | "role" | "employee";
  approverRoleKey?: string | null;
  approverEmployeeId: string | null;
  slaHours: number;
  deadlineAt: string | null;
  decision: "Disetujui" | "Ditolak" | "Diketahui" | null;
  decidedByEmployeeId: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  reason: string | null;
}

export interface ApprovalWorkflowStepConfig {
  mode: "approve" | "acknowledge";
  label: string;
  approverType: "direct_manager" | "manager_of_manager" | "role" | "employee";
  approverRoleKey?: string | null;
  approverEmployeeId?: string | null;
  slaHours: number;
}

export interface ApprovalWorkflowConfig {
  id: string;
  tenantId: string;
  category: string;
  steps: ApprovalWorkflowStepConfig[];
  updatedAt: string;
}

export interface ApprovalDelegation {
  id: string;
  tenantId: string;
  principalId: string;
  substituteId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isActive: boolean;
}

export interface WorkShift {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  color: string;
  isNightShift: boolean;
  lateToleranceMins: number;
  breakMins: number | null;
  isActive: boolean;
}

export interface EmployeeSchedule {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  shiftId: string;
}

export interface ShiftSwapRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  targetEmployeeId: string;
  requestDate: string;
  targetDate: string;
  requestShiftId: string | null;
  targetShiftId: string | null;
  reason: string | null;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  approvedBy: string | null;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  overtimeHours: number;
  lateMinutes: number;
  notes: string | null;
  shiftId: string | null;
  workType: "WFO" | "WFH" | "WFA" | null;
}

export interface EssClockInCheck {
  insideRadius: boolean;
  hasAssignedLocations: boolean;
  allowedWorkTypes: ('WFO' | 'WFA' | 'Perjalanan Dinas')[];
  requireSelfieCamera: boolean;
  withinTimeWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

export interface EssClockOutCheck {
  insideRadius: boolean;
  withinTimeWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  type: string;
  proposedClockIn: string | null;
  proposedClockOut: string | null;
  reason: string | null;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  approvedBy: string | null;
  attachmentUrl: string | null;
}

export interface OvertimeRequest {
  id: string;
  tenantId: string;
  entityId: string | null;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string | null;
  type: "Pengajuan Karyawan" | "Perintah Atasan";
  status: "Menunggu" | "Disetujui" | "Ditolak";
  approvedBy: string | null;
  approvedHours: number | null;
  compensationType: "Lembur Berbayar" | "Cuti Pengganti";
  notes: string | null;
}

export interface SalaryComponent {
  id: string;
  tenantId: string;
  entityId: string | null;
  code: string;
  name: string;
  category: "Tunjangan Tetap" | "Tunjangan Tidak Tetap" | "Asuransi Pemerintah" | "Asuransi Swasta" | "Potongan";
  calculationBasis: "Nominal Tetap" | "Persen Gaji Pokok";
  defaultValue: number;
  isTaxable: boolean;
  isBpjsBase: boolean;
  description: string | null;
}

export interface EmployeeSalaryAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  componentId: string;
  amount: number;
  effectiveDate: string;
  isActive: boolean;
}

export interface PayrollRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtimePay: number;
  reimbursement: number;
  thrBonus: number;
  grossPay: number;
  bpjsKesCompany: number;
  bpjsKesEmployee: number;
  bpjsTkCompany: number;
  bpjsTkEmployee: number;
  pph21TERCategory: "TER A" | "TER B" | "TER C";
  pph21RatePercent: number;
  pph21Amount: number;
  loanDeduction: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number | null;
  severancePay: number | null;
  totalDeductions: number;
  netPay: number;
  status: "Draft" | "Approved" | "Disbursed";
  paidDate: string | null;
}

export interface EmployeeLoan {
  id: string;
  tenantId: string;
  employeeId: string;
  loanType: string;
  totalAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  remainingAmount: number;
  startDate: string;
  reason: string | null;
  status: "Aktif" | "Lunas" | "Menunggu Approval" | "Ditolak";
  adminFee: number | null;
  interestMethod: string | null;
  interestRatePercent: number | null;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveType: "Cuti Tahunan" | "Sakit Tanpa Surat Dokter" | "Sakit dengan Surat Dokter" | "Cuti Menikah" | "Cuti Melahirkan" | "Izin Urusan Pribadi";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  approvedBy: string | null;
}

export interface EmployeeKpi {
  id: string;
  tenantId: string;
  employeeId: string;
  period: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  metrics: unknown[];
  finalScore: number;
  feedback: string | null;
  reviewer: string | null;
  evaluatedAt: string;
}

export interface ComplianceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  level: "SP 1" | "SP 2" | "SP 3" | "Skorsing" | "PHK";
  violationReason: string;
  letterNumber: string;
  issueDate: string;
  validUntil: string;
  signedBy: string | null;
  status: "Aktif" | "Kedaluwarsa" | "Dibatalkan";
}

export interface OffboardingRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  separationType: "Resign Sukarela" | "Habis Kontrak" | "PHK Efisiensi" | "PHK Indisipliner";
  requestDate: string;
  effectiveDate: string;
  handoverCompleted: boolean;
  assetReturned: boolean;
  financeCleared: boolean;
  severancePay: number;
  parklaringIssued: boolean;
  parklaringNumber: string | null;
  notes: string | null;
}

export interface BusinessTripRequest {
  id: string;
  tenantId: string;
  tripNumber: string;
  employeeId: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  purpose: string;
  transportType: "Pesawat" | "Kereta Api" | "Mobil Operasional" | "Travel";
  estimatedCost: number;
  perDiemDaily: number;
  accommodationCost: number;
  status: "Menunggu Approval" | "Disetujui Atasan" | "Disetujui Finance" | "Selesai" | "Ditolak";
  approvedBy: string | null;
}

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  category: "Hardware & IT" | "Konstruksi & Fasilitas" | "ATK & Cetak" | "Jasa Konsultan / Project" | "Event & Logistik";
  contactPerson: string;
  phone: string;
  email: string;
  npwp: string;
  rating: number;
  address: string;
  isVerified: boolean;
}

export interface GAAsset {
  id: string;
  tenantId: string;
  assetCode: string;
  name: string;
  category: "Laptop & Komputer" | "Kendaraan Operasional" | "Fasilitas Gedung" | "Furniture" | "Perangkat Jaringan";
  building: string;
  room: string;
  purchaseDate: string;
  purchasePrice: number;
  condition: "Baik" | "Perlu Perbaikan" | "Rusak" | "Dipinjam" | "Hilang";
  assignedToEmployeeId: string | null;
  lastStockOpname: string;
  qrPayload: string;
  /** Derived server-side from holder + condition — never client-set. */
  usageStatus: "Tersedia" | "Digunakan" | "Dalam Perbaikan" | null;
  warrantyExpiryDate?: string | null;
  warrantyProvider?: string | null;
  procurementOrderId?: string | null;
  vendorId?: string | null;
  poNumber?: string | null;
  officeLocationId?: string | null;
  returnedToGaAt?: string | null;
}

export interface AssetMaintenanceTicket {
  id: string;
  tenantId: string;
  ticketNumber: string;
  assetCode: string;
  assetName: string;
  reporterEmployeeId: string;
  issueType: "Kerusakan Hardware" | "Perawatan Rutin" | "Perbaikan Fasilitas / Gedung" | "Permintaan Penggantian";
  priority: "Rendah" | "Sedang" | "Tinggi" | "Darurat";
  description: string;
  reportedAt: string;
  status: "Tiket Dibuka" | "Sedang Dikerjakan GA" | "Menunggu Sparepart" | "Selesai Diperbaiki" | "Aset Diganti Baru";
  assignedTechnician: string | null;
  cost: number | null;
  resolutionNotes: string | null;
}

export interface AssetRelocationLog {
  id: string;
  tenantId: string;
  assetCode: string;
  assetName: string;
  fromBuilding: string;
  fromRoom: string;
  fromEmployeeId: string | null;
  toBuilding: string;
  toRoom: string;
  toEmployeeId: string | null;
  relocationDate: string;
  approvedBy: string;
  notes: string;
}

export interface ProcurementOrder {
  id: string;
  tenantId: string;
  type: "Pengadaan Barang" | "Project / Jasa" | "Barang" | "Proyek / Jasa Kontrak" | null;
  prNumber: string;
  poNumber: string;
  quotationNumber: string | null;
  contractNumber: string | null;
  vendorId: string | null;
  vendorName: string;
  itemName: string;
  quantity: number;
  estimatedCost: number;
  requestor: string;
  department: string;
  status: "Pengajuan PR" | "Quotation Diterima" | "Disetujui HR/Finance" | "PO Terbit" | "Kontrak Berjalan" | "Barang Diterima / Project Selesai" | "Barang Diterima";
  requestedDate: string;
}

export interface RoleDefinition {
  id: string;
  tenantId: string;
  label: string;
  description: string;
  badgeClass: string | null;
  isSystem: boolean;
}

export interface OperationPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface CompanyCalendarEvent {
  id: string;
  tenantId: string;
  entityId: string | null;
  title: string;
  date: string;
  type: "Cuti Bersama" | "Libur Nasional" | "Event" | "Libur Perusahaan" | "Cuti Bersama Perusahaan";
  deductsLeaveBucket: boolean;
  description: string | null;
}

export interface AuditTrailEntry {
  id: string;
  tenantId: string;
  entityId: string | null;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  module: string;
  action: string;
  recordId: string;
  changesSummary: string;
  details: unknown[] | null;
}

export interface DocumentTemplateConfig {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  numberingPattern: string;
  paperSize: "A4" | "F4" | "A5" | null;
  letterHeadTitle: string;
  letterHeadAddress: string;
  letterHeadNpwp: string | null;
  letterHeadPhone: string | null;
  letterHeadEmail: string | null;
  defaultBody: string;
  showQrSignature: boolean;
  signeeTitle: string;
  signeeRole: string;
  sourceType: "system" | "uploaded_docx" | null;
  fileName: string | null;
  fileSize: string | null;
  uploadedAt: string | null;
  rawHtmlTemplate: string | null;
  extractedPlaceholders: string[] | null;
  kopPosition: "top" | "none" | "embedded" | null;
  qrPosition: "bottom-right" | "bottom-left" | "inline" | "none" | null;
  footerText: string | null;
}

export interface OfficialDocument {
  id: string;
  tenantId: string;
  documentNumber: string;
  type: string;
  templateId: string | null;
  title: string;
  targetEmployeeId: string | null;
  issueDate: string;
  signeeName: string;
  signeeRole: string;
  /** null until every required signatory has confirmed — server-generated, never client-supplied. */
  qrVerificationUrl: string | null;
  status: "Resmi Diterbitkan" | "Menunggu Tanda Tangan" | "Draft";
  signatories: OfficialDocumentSignatory[];
  contentPreview: string;
  renderedHtml: string | null;
  isFromDocxTemplate: boolean;
}

export interface OfficialDocumentSignatory {
  roleLabel: string;
  isRequired: boolean;
  sortOrder: number;
  confirmedByEmployeeId: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
}

export interface EnpsSurveyResponse {
  id: string;
  score: number;
  department: string;
  feedback?: string;
  submittedAt: string;
}

export interface EnpsSurvey {
  id: string;
  tenantId: string;
  period: string;
  title: string;
  isActive: boolean;
  responses: EnpsSurveyResponse[];
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  score: number;
}

export interface VendorInvoice {
  id: string;
  tenantId: string;
  vendorId: string;
  vendorName: string;
  poNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: "Belum Bill" | "Sudah Bill";
  paidDate: string | null;
  paymentMethod: string | null;
  taxInvoiceNumber: string | null;
  notes: string | null;
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

  listOrgSnapshots: () => request<OrgStructureSnapshot[]>("/api/tenant/org-snapshots"),
  createOrgSnapshot: (data: {
    entityId: string;
    divisions: unknown[];
    departments: unknown[];
    positions?: unknown[];
    orgNodes: unknown[];
    skDocNumber?: string | null;
    effectiveDate?: string | null;
    skDocFileName?: string | null;
    changeType?: "restrukturisasi" | "modifikasi" | null;
    reason?: string | null;
  }) => request<OrgStructureSnapshot>("/api/tenant/org-snapshots", { method: "POST", body: JSON.stringify(data) }),
  startOrgRestructure: (data: {
    entityId: string;
    skDocNumber: string;
    effectiveDate: string;
    skDocFileName?: string | null;
    changeType: "restrukturisasi" | "modifikasi";
    reason: string;
    startMode: "copy" | "blank";
  }) => request<{ snapshot: OrgStructureSnapshot; entity: CompanyEntity }>("/api/tenant/org-restructure/start", { method: "POST", body: JSON.stringify(data) }),
  revertOrgRestructure: (entityId: string) =>
    request<{ entity: CompanyEntity; restoredFromSnapshotId: string }>("/api/tenant/org-restructure/revert", { method: "POST", body: JSON.stringify({ entityId }) }),

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
  createEmployee: (data: Partial<Employee> & { entityId: string; nik: string; fullName: string }) =>
    request<Employee>("/api/tenant/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: Partial<Employee>) => request<Employee>(`/api/tenant/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmployee: (id: string) => request<{ ok: true }>(`/api/tenant/employees/${id}`, { method: "DELETE" }),

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

  listOnboardingChecklistTemplates: () => request<OnboardingChecklistTemplateItem[]>("/api/tenant/onboarding-checklist-templates"),
  createOnboardingChecklistTemplate: (data: Omit<OnboardingChecklistTemplateItem, "id" | "tenantId">) =>
    request<OnboardingChecklistTemplateItem>("/api/tenant/onboarding-checklist-templates", { method: "POST", body: JSON.stringify(data) }),
  updateOnboardingChecklistTemplate: (id: string, data: Partial<OnboardingChecklistTemplateItem>) =>
    request<OnboardingChecklistTemplateItem>(`/api/tenant/onboarding-checklist-templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOnboardingChecklistTemplate: (id: string) => request<{ ok: true }>(`/api/tenant/onboarding-checklist-templates/${id}`, { method: "DELETE" }),

  listProbationEvaluations: () => request<ProbationEvaluation[]>("/api/tenant/probation-evaluations"),
  createProbationEvaluation: (data: Omit<ProbationEvaluation, "id" | "tenantId">) =>
    request<ProbationEvaluation>("/api/tenant/probation-evaluations", { method: "POST", body: JSON.stringify(data) }),
  updateProbationEvaluation: (id: string, data: Partial<ProbationEvaluation>) =>
    request<ProbationEvaluation>(`/api/tenant/probation-evaluations/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listProbationEvaluationTemplates: () => request<ProbationEvaluationTemplate[]>("/api/tenant/probation-evaluation-templates"),
  createProbationEvaluationTemplate: (data: Omit<ProbationEvaluationTemplate, "id" | "tenantId" | "createdAt">) =>
    request<ProbationEvaluationTemplate>("/api/tenant/probation-evaluation-templates", { method: "POST", body: JSON.stringify(data) }),

  listContractRenewalReviews: () => request<ContractRenewalReview[]>("/api/tenant/contract-renewal-reviews"),
  createContractRenewalReview: (data: Omit<ContractRenewalReview, "id" | "tenantId">) =>
    request<ContractRenewalReview>("/api/tenant/contract-renewal-reviews", { method: "POST", body: JSON.stringify(data) }),
  updateContractRenewalReview: (id: string, data: Partial<ContractRenewalReview>) =>
    request<ContractRenewalReview>(`/api/tenant/contract-renewal-reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getModuleSettings: () => request<Record<string, Record<string, unknown>>>("/api/tenant/module-settings"),
  updateModuleSettings: (moduleKey: string, settings: Record<string, unknown>) =>
    request<{ moduleKey: string; settings: Record<string, unknown> }>(`/api/tenant/module-settings/${moduleKey}`, { method: "PUT", body: JSON.stringify({ settings }) }),

  decideApprovalItem: (id: string, decision: "Disetujui" | "Ditolak" | "Diketahui", reason?: string) =>
    request<ApprovalWorkflowItem>(`/api/tenant/approval-items/${id}/decision`, { method: "POST", body: JSON.stringify({ decision, reason }) }),
  listApprovalWorkflowConfigs: () => request<ApprovalWorkflowConfig[]>("/api/tenant/approval-workflow-configs"),
  saveApprovalWorkflowConfig: (category: string, steps: ApprovalWorkflowStepConfig[]) =>
    request<ApprovalWorkflowConfig>(`/api/tenant/approval-workflow-configs/${encodeURIComponent(category)}`, { method: "PUT", body: JSON.stringify({ steps }) }),
  listApprovalItems: () => request<ApprovalWorkflowItem[]>("/api/tenant/approval-items"),
  createApprovalItem: (data: Omit<ApprovalWorkflowItem, "id" | "tenantId">) =>
    request<ApprovalWorkflowItem>("/api/tenant/approval-items", { method: "POST", body: JSON.stringify(data) }),
  updateApprovalItem: (id: string, data: Partial<ApprovalWorkflowItem>) =>
    request<ApprovalWorkflowItem>(`/api/tenant/approval-items/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listApprovalDelegations: () => request<ApprovalDelegation[]>("/api/tenant/approval-delegations"),
  createApprovalDelegation: (data: Omit<ApprovalDelegation, "id" | "tenantId">) =>
    request<ApprovalDelegation>("/api/tenant/approval-delegations", { method: "POST", body: JSON.stringify(data) }),
  updateApprovalDelegation: (id: string, data: Partial<ApprovalDelegation>) =>
    request<ApprovalDelegation>(`/api/tenant/approval-delegations/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Attendance (Presensi) module.
  listWorkShifts: () => request<WorkShift[]>("/api/tenant/work-shifts"),
  createWorkShift: (data: Omit<WorkShift, "id" | "tenantId">) => request<WorkShift>("/api/tenant/work-shifts", { method: "POST", body: JSON.stringify(data) }),
  updateWorkShift: (id: string, data: Partial<WorkShift>) => request<WorkShift>(`/api/tenant/work-shifts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorkShift: (id: string) => request<{ ok: true }>(`/api/tenant/work-shifts/${id}`, { method: "DELETE" }),

  listEmployeeSchedules: () => request<EmployeeSchedule[]>("/api/tenant/employee-schedules"),
  createEmployeeSchedule: (data: Omit<EmployeeSchedule, "id" | "tenantId">) =>
    request<EmployeeSchedule>("/api/tenant/employee-schedules", { method: "POST", body: JSON.stringify(data) }),
  updateEmployeeSchedule: (id: string, data: Partial<EmployeeSchedule>) =>
    request<EmployeeSchedule>(`/api/tenant/employee-schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmployeeSchedule: (id: string) => request<{ ok: true }>(`/api/tenant/employee-schedules/${id}`, { method: "DELETE" }),
  bulkCreateEmployeeSchedules: (entries: Omit<EmployeeSchedule, "id" | "tenantId">[]) =>
    request<EmployeeSchedule[]>("/api/tenant/employee-schedules/bulk", { method: "POST", body: JSON.stringify({ entries }) }),

  listShiftSwapRequests: () => request<ShiftSwapRequest[]>("/api/tenant/shift-swap-requests"),
  createShiftSwapRequest: (data: Omit<ShiftSwapRequest, "id" | "tenantId">) =>
    request<ShiftSwapRequest>("/api/tenant/shift-swap-requests", { method: "POST", body: JSON.stringify(data) }),
  updateShiftSwapRequest: (id: string, data: Partial<ShiftSwapRequest>) =>
    request<ShiftSwapRequest>(`/api/tenant/shift-swap-requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listAttendanceRecords: () => request<AttendanceRecord[]>("/api/tenant/attendance-records"),
  createAttendanceRecord: (data: Omit<AttendanceRecord, "id" | "tenantId">) =>
    request<AttendanceRecord>("/api/tenant/attendance-records", { method: "POST", body: JSON.stringify(data) }),
  updateAttendanceRecord: (id: string, data: Partial<AttendanceRecord>) =>
    request<AttendanceRecord>(`/api/tenant/attendance-records/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  upsertAttendanceRecord: (data: Omit<AttendanceRecord, "id" | "tenantId">) =>
    request<AttendanceRecord>("/api/tenant/attendance-records/upsert", { method: "POST", body: JSON.stringify(data) }),

  // Real geofence/time-window/work-type-gated Clock-In/Out (user, 2026-11-09
  // ESS redesign) — distinct from upsertAttendanceRecord above, which is
  // the unvalidated raw admin edit still used by manual HR corrections.
  checkEssClockIn: (employeeId: string, lat: number, lng: number) =>
    request<EssClockInCheck>(`/api/tenant/employees/${employeeId}/attendance/clock-in/check`, { method: "POST", body: JSON.stringify({ lat, lng }) }),
  checkEssClockOut: (employeeId: string, lat: number, lng: number) =>
    request<EssClockOutCheck>(`/api/tenant/employees/${employeeId}/attendance/clock-out/check`, { method: "POST", body: JSON.stringify({ lat, lng }) }),
  essClockIn: (employeeId: string, lat: number, lng: number, workType: 'WFO' | 'WFA' | 'Perjalanan Dinas') =>
    request<AttendanceRecord>(`/api/tenant/employees/${employeeId}/attendance/clock-in`, { method: "POST", body: JSON.stringify({ lat, lng, workType }) }),
  essClockOut: (employeeId: string, lat: number, lng: number) =>
    request<AttendanceRecord>(`/api/tenant/employees/${employeeId}/attendance/clock-out`, { method: "POST", body: JSON.stringify({ lat, lng }) }),

  listAttendanceCorrections: () => request<AttendanceCorrectionRequest[]>("/api/tenant/attendance-corrections"),
  createAttendanceCorrection: (data: Omit<AttendanceCorrectionRequest, "id" | "tenantId">) =>
    request<AttendanceCorrectionRequest>("/api/tenant/attendance-corrections", { method: "POST", body: JSON.stringify(data) }),
  updateAttendanceCorrection: (id: string, data: Partial<AttendanceCorrectionRequest>) =>
    request<AttendanceCorrectionRequest>(`/api/tenant/attendance-corrections/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listOvertimeRequests: () => request<OvertimeRequest[]>("/api/tenant/overtime-requests"),
  createOvertimeRequest: (data: Omit<OvertimeRequest, "id" | "tenantId">) =>
    request<OvertimeRequest>("/api/tenant/overtime-requests", { method: "POST", body: JSON.stringify(data) }),
  updateOvertimeRequest: (id: string, data: Partial<OvertimeRequest>) =>
    request<OvertimeRequest>(`/api/tenant/overtime-requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listSalaryComponents: () => request<SalaryComponent[]>("/api/tenant/salary-components"),
  createSalaryComponent: (data: Omit<SalaryComponent, "id" | "tenantId">) =>
    request<SalaryComponent>("/api/tenant/salary-components", { method: "POST", body: JSON.stringify(data) }),
  updateSalaryComponent: (id: string, data: Partial<SalaryComponent>) =>
    request<SalaryComponent>(`/api/tenant/salary-components/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSalaryComponent: (id: string) => request<{ ok: true }>(`/api/tenant/salary-components/${id}`, { method: "DELETE" }),

  listEmployeeSalaryAssignments: () => request<EmployeeSalaryAssignment[]>("/api/tenant/employee-salary-assignments"),
  createEmployeeSalaryAssignment: (data: Omit<EmployeeSalaryAssignment, "id" | "tenantId">) =>
    request<EmployeeSalaryAssignment>("/api/tenant/employee-salary-assignments", { method: "POST", body: JSON.stringify(data) }),
  deleteEmployeeSalaryAssignment: (id: string) =>
    request<{ ok: true }>(`/api/tenant/employee-salary-assignments/${id}`, { method: "DELETE" }),

  listPayrollRecords: () => request<PayrollRecord[]>("/api/tenant/payroll-records"),
  upsertPayrollRecord: (data: Omit<PayrollRecord, "id" | "tenantId">) =>
    request<PayrollRecord>("/api/tenant/payroll-records/upsert", { method: "POST", body: JSON.stringify(data) }),
  updatePayrollRecord: (id: string, data: Partial<PayrollRecord>) =>
    request<PayrollRecord>(`/api/tenant/payroll-records/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listLoans: () => request<EmployeeLoan[]>("/api/tenant/loans"),
  createLoan: (data: Omit<EmployeeLoan, "id" | "tenantId">) =>
    request<EmployeeLoan>("/api/tenant/loans", { method: "POST", body: JSON.stringify(data) }),
  updateLoan: (id: string, data: Partial<EmployeeLoan>) =>
    request<EmployeeLoan>(`/api/tenant/loans/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listLeaveRequests: () => request<LeaveRequest[]>("/api/tenant/leave-requests"),
  createLeaveRequest: (data: Omit<LeaveRequest, "id" | "tenantId">) =>
    request<LeaveRequest>("/api/tenant/leave-requests", { method: "POST", body: JSON.stringify(data) }),
  updateLeaveRequest: (id: string, data: Partial<LeaveRequest>) =>
    request<LeaveRequest>(`/api/tenant/leave-requests/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listEmployeeKpis: () => request<EmployeeKpi[]>("/api/tenant/employee-kpis"),
  upsertEmployeeKpi: (data: Omit<EmployeeKpi, "id" | "tenantId">) =>
    request<EmployeeKpi>("/api/tenant/employee-kpis/upsert", { method: "POST", body: JSON.stringify(data) }),

  listComplianceRecords: () => request<ComplianceRecord[]>("/api/tenant/compliance-records"),
  createComplianceRecord: (data: Omit<ComplianceRecord, "id" | "tenantId">) =>
    request<ComplianceRecord>("/api/tenant/compliance-records", { method: "POST", body: JSON.stringify(data) }),
  updateComplianceRecord: (id: string, data: Partial<ComplianceRecord>) =>
    request<ComplianceRecord>(`/api/tenant/compliance-records/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listOffboardingRecords: () => request<OffboardingRecord[]>("/api/tenant/offboarding-records"),
  createOffboardingRecord: (data: Omit<OffboardingRecord, "id" | "tenantId">) =>
    request<OffboardingRecord>("/api/tenant/offboarding-records", { method: "POST", body: JSON.stringify(data) }),
  updateOffboardingRecord: (id: string, data: Partial<OffboardingRecord>) =>
    request<OffboardingRecord>(`/api/tenant/offboarding-records/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listBusinessTrips: () => request<BusinessTripRequest[]>("/api/tenant/business-trips"),
  createBusinessTrip: (data: Omit<BusinessTripRequest, "id" | "tenantId">) =>
    request<BusinessTripRequest>("/api/tenant/business-trips", { method: "POST", body: JSON.stringify(data) }),
  updateBusinessTrip: (id: string, data: Partial<BusinessTripRequest>) =>
    request<BusinessTripRequest>(`/api/tenant/business-trips/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listVendors: () => request<Vendor[]>("/api/tenant/vendors"),
  createVendor: (data: Omit<Vendor, "id" | "tenantId">) =>
    request<Vendor>("/api/tenant/vendors", { method: "POST", body: JSON.stringify(data) }),
  updateVendor: (id: string, data: Partial<Vendor>) =>
    request<Vendor>(`/api/tenant/vendors/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listGAAssets: () => request<GAAsset[]>("/api/tenant/ga-assets"),
  createGAAsset: (data: Omit<GAAsset, "id" | "tenantId">) =>
    request<GAAsset>("/api/tenant/ga-assets", { method: "POST", body: JSON.stringify(data) }),
  returnGAAssetToGa: (id: string) => request<GAAsset>(`/api/tenant/ga-assets/${id}/return`, { method: "POST", body: JSON.stringify({}) }),
  updateGAAsset: (id: string, data: Partial<GAAsset>) =>
    request<GAAsset>(`/api/tenant/ga-assets/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listMaintenanceTickets: () => request<AssetMaintenanceTicket[]>("/api/tenant/asset-maintenance-tickets"),
  createMaintenanceTicket: (data: Omit<AssetMaintenanceTicket, "id" | "tenantId">) =>
    request<AssetMaintenanceTicket>("/api/tenant/asset-maintenance-tickets", { method: "POST", body: JSON.stringify(data) }),
  updateMaintenanceTicket: (id: string, data: Partial<AssetMaintenanceTicket>) =>
    request<AssetMaintenanceTicket>(`/api/tenant/asset-maintenance-tickets/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listAssetRelocations: () => request<AssetRelocationLog[]>("/api/tenant/asset-relocations"),
  createAssetRelocation: (data: Omit<AssetRelocationLog, "id" | "tenantId">) =>
    request<AssetRelocationLog>("/api/tenant/asset-relocations", { method: "POST", body: JSON.stringify(data) }),

  listProcurementOrders: () => request<ProcurementOrder[]>("/api/tenant/procurement-orders"),
  createProcurementOrder: (data: Omit<ProcurementOrder, "id" | "tenantId">) =>
    request<ProcurementOrder>("/api/tenant/procurement-orders", { method: "POST", body: JSON.stringify(data) }),
  updateProcurementOrder: (id: string, data: Partial<ProcurementOrder>) =>
    request<ProcurementOrder>(`/api/tenant/procurement-orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listRbacRoles: () => request<RoleDefinition[]>("/api/tenant/rbac-roles"),
  createRbacRole: (data: Omit<RoleDefinition, "tenantId">) =>
    request<RoleDefinition>("/api/tenant/rbac-roles", { method: "POST", body: JSON.stringify(data) }),
  deleteRbacRole: (roleKey: string) =>
    request<{ ok: true }>(`/api/tenant/rbac-roles/${encodeURIComponent(roleKey)}`, { method: "DELETE" }),

  listRolePermissions: () => request<Record<string, OperationPermissions>>("/api/tenant/rbac-permissions"),
  setRolePermission: (moduleKey: string, roleKey: string, data: OperationPermissions) =>
    request<OperationPermissions>(`/api/tenant/rbac-permissions/${encodeURIComponent(moduleKey)}/${encodeURIComponent(roleKey)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  listCalendarEvents: () => request<CompanyCalendarEvent[]>("/api/tenant/calendar-events"),
  createCalendarEvent: (data: Omit<CompanyCalendarEvent, "id" | "tenantId">) =>
    request<CompanyCalendarEvent>("/api/tenant/calendar-events", { method: "POST", body: JSON.stringify(data) }),

  listAuditTrail: () => request<AuditTrailEntry[]>("/api/tenant/audit-trail"),
  createAuditTrailEntry: (data: Omit<AuditTrailEntry, "id" | "tenantId">) =>
    request<AuditTrailEntry>("/api/tenant/audit-trail", { method: "POST", body: JSON.stringify(data) }),

  listDocumentTemplates: () => request<DocumentTemplateConfig[]>("/api/tenant/document-templates"),
  createDocumentTemplate: (data: Omit<DocumentTemplateConfig, "id" | "tenantId">) =>
    request<DocumentTemplateConfig>("/api/tenant/document-templates", { method: "POST", body: JSON.stringify(data) }),
  updateDocumentTemplate: (id: string, data: Partial<DocumentTemplateConfig>) =>
    request<DocumentTemplateConfig>(`/api/tenant/document-templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDocumentTemplate: (id: string) =>
    request<{ ok: true }>(`/api/tenant/document-templates/${id}`, { method: "DELETE" }),

  listDocuments: () => request<OfficialDocument[]>("/api/tenant/documents"),
  createDocument: (data: Omit<OfficialDocument, "id" | "tenantId" | "qrVerificationUrl" | "status" | "signatories">) =>
    request<OfficialDocument>("/api/tenant/documents", { method: "POST", body: JSON.stringify(data) }),
  confirmDocumentSignatory: (documentId: string, index: number, confirmedByName?: string) =>
    request<OfficialDocument>(`/api/tenant/documents/${documentId}/signatories/${index}/confirm`, { method: "POST", body: JSON.stringify({ confirmedByName }) }),

  getEnpsSurvey: () => request<EnpsSurvey | null>("/api/tenant/enps-survey"),
  submitEnpsResponse: (data: { score: number; department: string; feedback?: string | null }) =>
    request<EnpsSurvey>("/api/tenant/enps-survey/responses", { method: "POST", body: JSON.stringify(data) }),

  listVendorInvoices: () => request<VendorInvoice[]>("/api/tenant/vendor-invoices"),
  createVendorInvoice: (data: Omit<VendorInvoice, "id" | "tenantId">) =>
    request<VendorInvoice>("/api/tenant/vendor-invoices", { method: "POST", body: JSON.stringify(data) }),
  updateVendorInvoice: (id: string, data: Partial<VendorInvoice>) =>
    request<VendorInvoice>(`/api/tenant/vendor-invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
