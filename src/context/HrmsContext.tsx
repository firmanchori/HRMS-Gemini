import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  tenantApi,
  type CompanyEntity as ApiCompanyEntity,
  type OfficeLocation as ApiOfficeLocation,
  type CompanyDivision as ApiCompanyDivision,
  type CompanyDepartment as ApiCompanyDepartment,
  type MasterJobPosition as ApiMasterJobPosition,
  type OrgStructureNode as ApiOrgStructureNode,
  type GradeSalaryRange as ApiGradeSalaryRange,
  type TenantUser as ApiTenantUser,
  type JobRequisition as ApiJobRequisition,
  type JobVacancy as ApiJobVacancy,
  type Candidate as ApiCandidate,
  type OnboardingProcess as ApiOnboardingProcess,
  type CompetencyTestTypeSetting as ApiCompetencyTestTypeSetting,
  type InterviewTypeSetting as ApiInterviewTypeSetting,
  type OnboardingChecklistTemplateItem as ApiOnboardingChecklistTemplateItem,
  type Employee as ApiEmployee,
  type ProbationEvaluation as ApiProbationEvaluation,
  type ContractRenewalReview as ApiContractRenewalReview,
  type ApprovalWorkflowItem as ApiApprovalWorkflowItem,
  type ApprovalDelegation as ApiApprovalDelegation,
  type WorkShift as ApiWorkShift,
  type EmployeeSchedule as ApiEmployeeSchedule,
  type ShiftSwapRequest as ApiShiftSwapRequest,
  type AttendanceRecord as ApiAttendanceRecord,
  type AttendanceCorrectionRequest as ApiAttendanceCorrectionRequest,
  type OvertimeRequest as ApiOvertimeRequest,
  type OrgStructureSnapshot as ApiOrgStructureSnapshot,
} from '../tenant/api';
import { ORG_STRUCTURE_TEMPLATES } from '../utils/orgStructureTemplates';
import {
  Tenant,
  UserAccount,
  UserRole,
  Employee,
  PersonaliaLog,
  PersonaliaSignatory,
  PersonaliaActionType,
  SystemicImpactConfig,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  EmployeeLoan,
  EmployeeKPI,
  ComplianceRecord,
  JobVacancy,
  JobRequisition,
  Candidate,
  OffboardingRecord,
  GAAsset,
  ProcurementOrder,
  OfficialDocument,
  MigrationRowPreview,
  WorkShift,
  EmployeeSchedule,
  ShiftSwapRequest,
  AttendanceCorrectionRequest,
  BusinessTripRequest,
  ApprovalWorkflowItem,
  ApprovalDelegation,
  Vendor,
  AssetMaintenanceTicket,
  AssetRelocationLog,
  DocumentTemplateConfig,
  OnboardingProcess,
  OnboardingChecklistTemplateItem,
  OnboardingSubItem,
  ModuleSettingsConfig,
  CompanyEntity,
  EmployeeStaging,
  OvertimeRequest,
  ReimbursementClaim,
  PersonaliaRequest,
  OrgStructureNode,
  OrgChangeProposal,
  OrgStructureSnapshot,
  ProbationEvaluation,
  ContractRenewalReview,
  CompanyCalendarEvent,
  GradeSalaryRange,
  SalaryComponentMaster,
  EmployeeSalaryComponentAssignment,
  GARoomBooking,
  GAVehicleBooking,
  GAOfficeSupply,
  GAOfficeSupplyRequest,
  GATicket,
  VendorInvoice,
  AuditLogEntry,
  ENpsSurvey,
  UniversalPreviewItem,
  RoleDefinition,
  OperationPermissions,
  CompanyDivision,
  CompanyDepartment,
  MasterJobPosition,
  FlexibleNikSettings,
  NikPatternConfig,
  CandidateCompetencyScore,
  CompetencyTestTypeSetting,
  InterviewTypeSetting,
  InterviewScorecardCriterion,
  CandidateInterviewEvaluation,
  OfficeLocation,
} from '../types/hrms';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_PERSONALIA_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_LOANS,
  INITIAL_KPIS,
  INITIAL_COMPLIANCE,
  INITIAL_JOB_REQUISITIONS,
  INITIAL_JOB_VACANCIES,
  INITIAL_CANDIDATES,
  INITIAL_COMPETENCY_TEST_TYPES,
  INITIAL_INTERVIEW_TYPES,
  INITIAL_OFFBOARDING,
  INITIAL_ASSETS,
  INITIAL_PROCUREMENT,
  INITIAL_DOCUMENTS,
  INITIAL_SHIFTS,
  INITIAL_SCHEDULES,
  INITIAL_SHIFT_SWAPS,
  INITIAL_ATTENDANCE_CORRECTIONS,
  INITIAL_BUSINESS_TRIPS,
  INITIAL_APPROVALS,
  INITIAL_VENDORS,
  INITIAL_ONBOARDING,
  DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES,
  INITIAL_DOCUMENT_TEMPLATES,
  INITIAL_MODULE_SETTINGS,
  INITIAL_EMPLOYEE_STAGING,
  INITIAL_OVERTIME_REQUESTS,
  INITIAL_REIMBURSEMENT_CLAIMS,
  INITIAL_PERSONALIA_REQUESTS,
  INITIAL_ORG_NODES,
  INITIAL_ORG_PROPOSALS,
  INITIAL_PROBATION_EVALUATIONS,
  INITIAL_CONTRACT_REVIEWS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_SALARY_COMPONENTS,
  INITIAL_EMPLOYEE_SALARY_ASSIGNMENTS,
  INITIAL_GA_ROOM_BOOKINGS,
  INITIAL_GA_VEHICLE_BOOKINGS,
  INITIAL_GA_SUPPLIES,
  INITIAL_GA_SUPPLY_REQUESTS,
  INITIAL_GA_TICKETS,
  INITIAL_VENDOR_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ENPS_SURVEY,
  INITIAL_PAYROLL_RECORDS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_DIVISIONS,
  INITIAL_DEPARTMENTS,
} from '../data/initialData';
import { calculatePPh21TER, calculateBPJS, calculateOvertimePay, calculateSeverancePay } from '../utils/taxCalculator';
import { generateDocumentNumber } from '../utils/documentNumbering';
import {
  DEFAULT_FLEXIBLE_NIK_SETTINGS,
  generateFlexibleNik,
  normalizeEmploymentType,
} from '../utils/nikGenerator';

interface HrmsContextType {
  // Tenant & User RBAC
  tenants: Tenant[];
  currentTenant: Tenant;
  setCurrentTenantId: (id: string) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  updateTenantBranding: (documentLogoUrl?: string, appFaviconUrl?: string) => void;
  currentUser: UserAccount;
  setCurrentUserRole: (role: UserRole) => void;
  /** Set once from the real session (login success / the on-mount session check) so `currentUser` reflects who's actually logged in, not a hardcoded placeholder. */
  setCurrentSessionUser: (user: { id: string; name: string; email: string } | null) => void;
  users: UserAccount[];
  /** Creates a real additional login account scoped to your own entity — the backend rejects it otherwise. */
  addUser: (user: Omit<UserAccount, 'id' | 'tenantId'>, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  roles: RoleDefinition[];
  addRole: (role: RoleDefinition, copyFrom?: string) => void;
  deleteRole: (id: string) => void;
  rolePermissions: Record<string, OperationPermissions>;
  updateRolePermission: (module: string, roleKey: string, op: keyof OperationPermissions, allowed: boolean) => void;
  getRolePermission: (module: string, roleKey: string) => OperationPermissions;
  hasPermission: (module: string, roleKey: string, op: keyof OperationPermissions) => boolean;

  // Navigation & View
  activeModule: string;
  setActiveModule: (module: string) => void;

  // 1. Employees & Personalia
  employees: Employee[];
  personaliaLogs: PersonaliaLog[];
  addEmployee: (emp: Omit<Employee, 'id' | 'tenantId'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  processPersonaliaAction: (action: {
    employeeId: string;
    type: PersonaliaActionType | string;
    newPosition?: string;
    newDepartment?: string;
    newGrade?: string;
    newSalary?: number;
    newPositionAllowance?: number;
    newFixedAllowance?: number;
    newBranchLocation?: string;
    contractDurationMonths?: number;
    contractEndDate?: string;
    actingRoleExpiryDate?: string;
    permanentAppointmentDate?: string;
    disciplinaryLevel?: 'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing';
    reason: string;
    effectiveDate: string;
    skDocNumber?: string;
    notes?: string;
    signatories?: PersonaliaSignatory[];
    status?: 'Disetujui' | 'Menunggu Approval' | 'Draf';
    systemicImpact?: SystemicImpactConfig;
  }) => void;

  // 2. Attendance & Leave
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  clockIn: (employeeId: string, notes?: string) => void;
  clockOut: (employeeId: string, notes?: string) => void;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'tenantId' | 'status'>) => void;
  reviewLeaveRequest: (id: string, approved: boolean) => void;

  // 3. Payroll & Tax
  payrollRecords: PayrollRecord[];
  generatePayrollRun: (period: string) => void;
  approvePayrollRun: (period: string) => void;
  disbursePayrollRun: (period: string) => void;

  // 4. Loans & Kasbon
  loans: EmployeeLoan[];
  addLoan: (loan: Omit<EmployeeLoan, 'id' | 'tenantId' | 'remainingAmount' | 'status'>) => void;
  updateLoanStatus: (id: string, status: 'Aktif' | 'Lunas' | 'Menunggu Approval' | 'Ditolak') => void;

  // 5. Real-time KPI
  kpis: EmployeeKPI[];
  saveKPIReview: (kpi: Omit<EmployeeKPI, 'id' | 'tenantId' | 'evaluatedAt'>) => void;

  // 6. Compliance (SP/PHK)
  complianceRecords: ComplianceRecord[];
  issueComplianceAction: (record: {
    employeeId: string;
    level: 'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing' | 'PHK';
    violationReason: string;
    validMonths: number;
  }) => void;

  // 7. Recruitment & Onboarding
  jobRequisitions: JobRequisition[];
  addJobRequisition: (req: Omit<JobRequisition, 'id' | 'tenantId' | 'createdAt'>) => Promise<void>;
  updateJobRequisition: (id: string, updates: Partial<JobRequisition>) => Promise<void>;
  deleteJobRequisition: (id: string) => void;
  vacancies: JobVacancy[];
  candidates: Candidate[];
  addVacancy: (vacancy: Omit<JobVacancy, 'id' | 'tenantId' | 'postedDate'>) => void;
  updateVacancy: (id: string, updates: Partial<JobVacancy>) => void;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'tenantId' | 'appliedDate'>) => void;
  updateCandidateStage: (
    id: string,
    stage: Candidate['stage'],
    extra?: Partial<Candidate>
  ) => void;
  convertCandidateToEmployee: (candidateId: string, joinDate: string) => Promise<void>;
  competencyTestTypes: CompetencyTestTypeSetting[];
  addCompetencyTestType: (testType: Omit<CompetencyTestTypeSetting, 'id'>) => void;
  updateCompetencyTestType: (id: string, updates: Partial<CompetencyTestTypeSetting>) => void;
  deleteCompetencyTestType: (id: string) => void;
  resetCompetencyTestTypes: () => void;
  saveCandidateCompetencyScore: (
    candidateId: string,
    scoreData: Omit<CandidateCompetencyScore, 'id' | 'evaluatedAt'>
  ) => void;
  deleteCandidateCompetencyScore: (candidateId: string, scoreId: string) => void;
  interviewTypeSettings: InterviewTypeSetting[];
  addInterviewType: (type: Omit<InterviewTypeSetting, 'id'>) => void;
  updateInterviewType: (id: string, updates: Partial<InterviewTypeSetting>) => void;
  deleteInterviewType: (id: string) => void;
  resetInterviewTypes: () => void;
  saveCandidateInterviewEvaluation: (
    candidateId: string,
    evalData: Omit<CandidateInterviewEvaluation, 'id' | 'evaluatedAt'>
  ) => void;
  deleteCandidateInterviewEvaluation: (candidateId: string, evalId: string) => void;

  // 8. Offboarding
  offboardingRecords: OffboardingRecord[];
  initiateOffboarding: (
    employeeId: string,
    separationType: OffboardingRecord['separationType'],
    effectiveDate: string,
    notes: string
  ) => void;
  updateOffboardingChecklist: (
    id: string,
    checklist: Partial<Pick<OffboardingRecord, 'handoverCompleted' | 'assetReturned' | 'financeCleared' | 'parklaringIssued'>>
  ) => void;

  // 9. GA Assets & QR
  assets: GAAsset[];
  addAsset: (asset: Omit<GAAsset, 'id' | 'tenantId' | 'lastStockOpname' | 'qrPayload'>) => void;
  updateAsset: (id: string, updates: Partial<GAAsset>) => void;
  performStockOpname: (assetCode: string, condition: GAAsset['condition'], notes?: string) => boolean;

  // 10. Procurement
  procurementOrders: ProcurementOrder[];
  addProcurementOrder: (order: Omit<ProcurementOrder, 'id' | 'tenantId' | 'prNumber' | 'poNumber' | 'status' | 'requestedDate'>) => void;
  updateProcurementStatus: (id: string, status: ProcurementOrder['status'], poNumber?: string) => void;

  // 11. Documents & QR Signatures
  documents: OfficialDocument[];
  createOfficialDocument: (doc: {
    type: OfficialDocument['type'];
    templateId?: string;
    title: string;
    targetEmployeeId: string;
    signeeName: string;
    signeeRole: string;
    contentPreview: string;
    renderedHtml?: string;
    isFromDocxTemplate?: boolean;
    customDocumentNumber?: string;
  }) => OfficialDocument;

  // 12. Migration Wizard
  executeMigrationImport: (rows: MigrationRowPreview[]) => { successCount: number; errorCount: number };

  // 13. Onboarding (Via Rekrutmen vs Direct) & Checklist Templates
  onboardingProcesses: OnboardingProcess[];
  onboardingChecklistTemplates: OnboardingChecklistTemplateItem[];
  addOnboardingProcess: (process: Omit<OnboardingProcess, 'id' | 'tenantId' | 'status'>) => OnboardingProcess;
  updateOnboardingTask: (processId: string, taskId: string, isCompleted: boolean, actionPayload?: any, subItems?: OnboardingSubItem[]) => void;
  toggleOnboardingSubItem?: (processId: string, taskId: string, subItemId: string) => void;
  completeOnboardingProcess: (processId: string) => Promise<Employee | null>;
  updateOnboardingProcess: (processId: string, updates: Partial<OnboardingProcess>) => void;
  cancelOnboardingProcess: (processId: string, reason: string, actionType: 'talent_pool' | 'delete_all') => void;
  updateOnboardingChecklistTemplates: (templates: OnboardingChecklistTemplateItem[]) => void;
  addChecklistTemplateItem: (item: Omit<OnboardingChecklistTemplateItem, 'id'>) => void;
  removeChecklistTemplateItem: (id: string) => void;

  // 14. Shifts, Roaster & Swap Requests
  shifts: WorkShift[];
  schedules: EmployeeSchedule[];
  addShift: (shift: Omit<WorkShift, 'id' | 'tenantId'>) => void;
  updateShift: (id: string, updates: Partial<WorkShift>) => void;
  deleteShift: (id: string) => void;
  upsertSchedules: (items: { employeeId: string; date: string; shiftId: string | null }[]) => void;
  clearSchedules: (employeeIds: string[], dateFrom: string, dateTo: string) => void;
  shiftSwaps: ShiftSwapRequest[];
  addShiftSwapRequest: (swap: Omit<ShiftSwapRequest, 'id' | 'tenantId' | 'status'>) => void;
  reviewShiftSwapRequest: (id: string, approved: boolean) => void;

  // 15. Attendance Corrections (Lupa Absen, Keterlambatan, etc.)
  attendanceCorrections: AttendanceCorrectionRequest[];
  submitAttendanceCorrection: (req: Omit<AttendanceCorrectionRequest, 'id' | 'tenantId' | 'status'>) => void;
  reviewAttendanceCorrection: (id: string, approved: boolean) => void;

  // 16. Business Trips (SPPD)
  businessTrips: BusinessTripRequest[];
  submitBusinessTrip: (trip: Omit<BusinessTripRequest, 'id' | 'tenantId' | 'tripNumber' | 'status'>) => void;
  reviewBusinessTrip: (id: string, status: BusinessTripRequest['status']) => void;

  // 17. Multi-tier Approval Center & Delegations
  approvalItems: ApprovalWorkflowItem[];
  reviewApprovalItem: (id: string, approved: boolean, notes?: string) => void;
  approvalDelegations: ApprovalDelegation[];
  setApprovalDelegation: (delegation: Omit<ApprovalDelegation, 'id' | 'tenantId'>) => void;

  // 18. Vendors & Procurement RFQ/PO
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'tenantId'>) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;

  // 19. GA Asset Maintenance & Relocations
  assetMaintenanceTickets: AssetMaintenanceTicket[];
  assetRelocations: AssetRelocationLog[];
  addMaintenanceTicket: (ticket: Omit<AssetMaintenanceTicket, 'id' | 'tenantId' | 'ticketNumber' | 'reportedAt' | 'status'>) => void;
  updateMaintenanceTicket: (id: string, status: AssetMaintenanceTicket['status'], resolutionNotes?: string, cost?: number) => void;
  addAssetRelocation: (relocation: Omit<AssetRelocationLog, 'id' | 'tenantId' | 'relocationDate'>) => void;

  // 20. Document Templates
  documentTemplates: DocumentTemplateConfig[];
  addDocumentTemplate: (template: Omit<DocumentTemplateConfig, 'id' | 'tenantId'>) => DocumentTemplateConfig;
  updateDocumentTemplate: (id: string, updates: Partial<DocumentTemplateConfig>) => void;
  deleteDocumentTemplate: (id: string) => void;

  // 21. Module Settings
  moduleSettings: ModuleSettingsConfig;
  updateModuleSettings: (moduleKey: keyof ModuleSettingsConfig, updates: any) => void;

  // 22. Holding & Subsidiary Entity Structure
  entities: CompanyEntity[];
  currentEntityId: string;
  setCurrentEntityId: (id: string) => void;
  currentEntity: CompanyEntity;
  /** `admin` is required when `entity.parentEntityId` is set — the one admin account the creating entity must provision for its new child; see backend provisioning rule. Rejects (with an Indonesian message) on failure so the caller can show it inline. */
  addEntity: (entity: Omit<CompanyEntity, 'id' | 'tenantId'>, admin?: { name: string; email: string; password: string }) => Promise<void>;
  updateEntity: (id: string, updates: Partial<CompanyEntity>) => void;
  deleteEntity: (id: string) => void;
  toggleEntityDepartmentLevel: (entityId: string) => void;
  /** Loads real entities + office locations from the backend, replacing whatever mock data is currently in state. Call once right after a successful login. */
  loadTenantOrgData: () => Promise<void>;

  // 22B. Divisi & Departemen Fleksibel
  divisions: CompanyDivision[];
  addDivision: (division: Omit<CompanyDivision, 'id'>) => void;
  updateDivision: (id: string, updates: Partial<CompanyDivision>) => void;
  deleteDivision: (id: string) => void;
  departments: CompanyDepartment[];
  addDepartment: (department: Omit<CompanyDepartment, 'id'>) => void;
  updateDepartment: (id: string, updates: Partial<CompanyDepartment>) => void;
  deleteDepartment: (id: string) => void;

  // 22B-2. Master Jabatan / Standar Posisi (Kamus Jabatan)
  masterJobPositions: MasterJobPosition[];
  addMasterJobPosition: (posData: Omit<MasterJobPosition, 'id'>) => void;
  updateMasterJobPosition: (id: string, updates: Partial<MasterJobPosition>) => void;
  deleteMasterJobPosition: (id: string) => void;
  /** Bulk-fills a brand-new entity's divisions/departments/jabatan/grade from a predefined starter template. */
  applyOrgTemplate: (entityId: string, templateKey: string) => Promise<void>;
  /** Bulk-copies divisions/departments/jabatan from another entity in the same tenant as a starting point. */
  copyOrgStructureFromEntity: (targetEntityId: string, sourceEntityId: string) => Promise<void>;
  assignEmployeeToPosition: (positionId: string, employeeId: string | null) => void;

  // 22C. Format NIK Fleksibel
  flexibleNikSettings: FlexibleNikSettings;
  updateFlexibleNikSettings: (settings: FlexibleNikSettings) => void;
  generateNextNik: (employmentType: string, entityId?: string) => string;

  // 23. Employee Staging (Onboarding Gate)
  employeeStaging: EmployeeStaging[];
  addEmployeeStaging: (staging: Omit<EmployeeStaging, 'id' | 'tenantId' | 'tempNik' | 'status'>) => void;
  updateEmployeeStagingTask: (stagingId: string, taskId: string, isCompleted: boolean) => void;
  completeOnboarding: (stagingId: string) => Promise<Employee | null>;

  // 24. Overtime Request & Approval Flow
  overtimeRequests: OvertimeRequest[];
  submitOvertimeRequest: (req: Omit<OvertimeRequest, 'id' | 'tenantId' | 'status'>) => void;
  reviewOvertimeRequest: (id: string, approved: boolean, approvedHours?: number, notes?: string) => void;

  // 25. Reimbursement Claim & Payroll Opt-In
  reimbursementClaims: ReimbursementClaim[];
  addReimbursementClaim: (claim: Omit<ReimbursementClaim, 'id' | 'tenantId' | 'claimNumber' | 'status'>) => void;
  reviewReimbursementClaim: (id: string, approved: boolean, notes?: string) => void;
  toggleReimbursementPayrollOptIn: (id: string) => void;

  // 26. Personalia Request (Requires Approval Before Effective)
  personaliaRequests: PersonaliaRequest[];
  submitPersonaliaRequest: (req: Omit<PersonaliaRequest, 'id' | 'tenantId' | 'status'>) => void;
  reviewPersonaliaRequest: (id: string, approved: boolean) => void;

  // 27. Org Chart & Per-Entity Governance
  isOrgGovernanceLocked: boolean;
  isEntityGovernanceLocked: (entityId?: string) => boolean;
  toggleEntityGovernanceLock: (entityId: string) => void;
  setOrgGovernanceLocked: (locked: boolean) => void;
  orgNodes: OrgStructureNode[];
  addOrgNode: (node: Omit<OrgStructureNode, 'id'>) => void;
  updateOrgNode: (id: string, updates: Partial<OrgStructureNode>) => void;
  deleteOrgNode: (id: string) => void;
  orgProposals: OrgChangeProposal[];
  submitOrgProposal: (proposal: Omit<OrgChangeProposal, 'id' | 'tenantId' | 'status' | 'implemented'>) => void;
  reviewOrgProposal: (id: string, approved: boolean, rejectionReason?: string) => void;
  /** Only ever call this on a Draft-status proposal — a Draft hasn't been submitted for approval yet, so deleting it is safe; anything already Menunggu Approval/Disetujui/Ditolak is a real decision record and must not be deletable here. */
  deleteOrgProposal: (id: string) => void;
  orgSnapshots: OrgStructureSnapshot[];
  startOrgRestructure: (data: {
    entityId: string;
    skDocNumber: string;
    effectiveDate: string;
    skDocFileName?: string | null;
    changeType: 'restrukturisasi' | 'modifikasi';
    reason: string;
    startMode: 'copy' | 'blank';
  }) => Promise<void>;
  revertOrgRestructure: (entityId: string) => Promise<void>;
  replaceEntityStructure: (
    entityId: string,
    newDivisions: CompanyDivision[],
    newDepartments: CompanyDepartment[],
    newNodes: OrgStructureNode[],
    proposalInfo?: { skDocNumber?: string; title?: string; effectiveDate?: string; reason?: string }
  ) => Promise<void>;

  // 28. Probation Evaluation
  probationEvaluations: ProbationEvaluation[];
  submitProbationEvaluation: (evaluation: Omit<ProbationEvaluation, 'id' | 'tenantId' | 'status'>) => void;
  reviewProbationEvaluation: (id: string, approved: boolean) => void;

  // 29. Contract Renewal (PKWT)
  contractReviews: ContractRenewalReview[];
  submitContractReview: (rev: Omit<ContractRenewalReview, 'id' | 'tenantId' | 'status'>) => void;
  reviewContractReview: (id: string, approved: boolean) => void;

  // 30. Company Calendar & Leave Buckets
  calendarEvents: CompanyCalendarEvent[];
  addCalendarEvent: (event: Omit<CompanyCalendarEvent, 'id' | 'tenantId'>) => void;

  // 31. Grade & Salary Ranges
  gradeSalaryRanges: GradeSalaryRange[];
  addGradeSalaryRange: (range: Omit<GradeSalaryRange, 'id' | 'tenantId'>) => void;
  updateGradeSalaryRange: (id: string, updates: Partial<GradeSalaryRange>) => void;
  deleteGradeSalaryRange: (id: string) => void;
  jobGradingScheme: 'single' | 'broadbanding';
  setJobGradingScheme: (scheme: 'single' | 'broadbanding') => void;

  // 32. Salary Components Master & Assignments
  salaryComponents: SalaryComponentMaster[];
  addSalaryComponent: (comp: Omit<SalaryComponentMaster, 'id' | 'tenantId'>) => void;
  employeeSalaryAssignments: EmployeeSalaryComponentAssignment[];
  assignSalaryComponent: (assignment: Omit<EmployeeSalaryComponentAssignment, 'id' | 'tenantId'>) => void;

  // 33. GA Facilities, Fleet & Supply
  roomBookings: GARoomBooking[];
  addRoomBooking: (booking: Omit<GARoomBooking, 'id' | 'tenantId' | 'bookingDocNumber' | 'status'>) => void;
  saveMeetingMinutes: (bookingId: string, notes: string) => void;
  vehicleBookings: GAVehicleBooking[];
  addVehicleBooking: (booking: Omit<GAVehicleBooking, 'id' | 'tenantId' | 'formDocNumber' | 'status'>) => void;
  updateVehicleBookingStatus: (id: string, status: GAVehicleBooking['status'], endOdometer?: number, fuelCost?: number) => void;
  officeSupplies: GAOfficeSupply[];
  addOfficeSupply: (item: Omit<GAOfficeSupply, 'id' | 'tenantId'>) => void;
  officeSupplyRequests: GAOfficeSupplyRequest[];
  addOfficeSupplyRequest: (req: Omit<GAOfficeSupplyRequest, 'id' | 'tenantId' | 'status' | 'requestDate'>) => void;
  reviewOfficeSupplyRequest: (id: string, approved: boolean) => void;
  gaTickets: GATicket[];
  addGaTicket: (ticket: Omit<GATicket, 'id' | 'tenantId' | 'ticketNumber' | 'createdAt' | 'status'>) => void;
  updateGaTicketStatus: (id: string, status: GATicket['status'], notes?: string) => void;

  // 34. Procurement Vendor Invoices (AP)
  vendorInvoices: VendorInvoice[];
  addVendorInvoice: (invoice: Omit<VendorInvoice, 'id' | 'tenantId' | 'status'>) => void;
  updateVendorInvoiceStatus: (id: string, status: 'Sudah Bill' | 'Belum Bill', paidDate?: string, paymentMethod?: string) => void;

  // 35. Audit Trail Log
  auditLogs: AuditLogEntry[];
  logAuditAction: (module: string, action: string, recordId: string, changesSummary: string, details?: any[]) => void;

  // 36. eNPS Engagement Survey
  enpsSurvey: ENpsSurvey;
  submitEnpsResponse: (score: number, department: string, feedback?: string) => void;

  // 37. User Signatures
  userSignatures: Record<string, string>;
  saveUserSignature: (userId: string, signatureUrl: string) => void;

  // 38. Universal File & Document Preview Modal
  activePreviewItem: UniversalPreviewItem | null;
  openFilePreview: (item: UniversalPreviewItem) => void;
  closeFilePreview: () => void;

  // 39. Sample Business Flow Reset
  resetToSampleFlowData: () => void;

  // 40. Master Lokasi Kantor & Geofencing
  officeLocations: OfficeLocation[];
  addOfficeLocation: (loc: Omit<OfficeLocation, 'id' | 'tenantId'>) => void;
  updateOfficeLocation: (id: string, updates: Partial<OfficeLocation>) => void;
  deleteOfficeLocation: (id: string) => void;
}

/**
 * Adapters between the real backend's entity shape and the mock frontend's
 * `CompanyEntity` type — the backend deliberately has no `level` enum
 * (unlimited-depth tree via parentEntityId + a closure table instead of the
 * old fixed holding/anak/cucu 3-tier model), so `level` here is a DISPLAY
 * value computed from depth, never sent back to the API.
 */
function computeLevelFromDepth(apiEntity: ApiCompanyEntity, allApiEntities: ApiCompanyEntity[]): 'holding' | 'anak' | 'cucu' {
  let depth = 0;
  let current = apiEntity;
  const byId = new Map(allApiEntities.map((e) => [e.id, e]));
  while (current.parentEntityId) {
    const parent = byId.get(current.parentEntityId);
    if (!parent) break;
    depth += 1;
    current = parent;
  }
  if (depth === 0) return 'holding';
  if (depth === 1) return 'anak';
  return 'cucu';
}

function mapApiEntityToMock(apiEntity: ApiCompanyEntity, allApiEntities: ApiCompanyEntity[]): CompanyEntity {
  return {
    id: apiEntity.id,
    tenantId: apiEntity.tenantId,
    parentEntityId: apiEntity.parentEntityId ?? undefined,
    name: apiEntity.name,
    code: apiEntity.code,
    relationType: apiEntity.relationType,
    level: computeLevelFromDepth(apiEntity, allApiEntities),
    address: apiEntity.address ?? '',
    city: apiEntity.city ?? '',
    npwp: apiEntity.npwp ?? '',
    nikPattern: apiEntity.nikPattern ?? '',
    docPrefix: apiEntity.docPrefix ?? '',
    status: apiEntity.status,
    useDepartmentLevel: apiEntity.useDepartmentLevel,
    isGovernanceLocked: apiEntity.isGovernanceLocked,
    documentLogoUrl: apiEntity.documentLogoUrl ?? undefined,
    appFaviconUrl: apiEntity.appFaviconUrl ?? undefined,
    nikPatternFollowsParent: apiEntity.nikPatternFollowsParent,
  };
}

function mapApiOfficeLocationToMock(apiLoc: ApiOfficeLocation, entityNameById: Map<string, string>): OfficeLocation {
  return {
    id: apiLoc.id,
    tenantId: apiLoc.tenantId,
    entityId: apiLoc.entityId ?? undefined,
    code: apiLoc.code,
    name: apiLoc.name,
    type: apiLoc.type,
    companyName: apiLoc.entityId ? entityNameById.get(apiLoc.entityId) ?? '' : '',
    address: apiLoc.address ?? '',
    city: apiLoc.city ?? '',
    latitude: apiLoc.latitude ?? 0,
    longitude: apiLoc.longitude ?? 0,
    radiusMeters: apiLoc.radiusMeters,
    isActive: apiLoc.isActive,
    notes: apiLoc.notes ?? undefined,
  };
}

function mapApiDivisionToMock(apiDiv: ApiCompanyDivision): CompanyDivision {
  return {
    id: apiDiv.id,
    entityId: apiDiv.entityId,
    code: apiDiv.code,
    name: apiDiv.name,
    headTitle: apiDiv.headTitle ?? undefined,
    description: apiDiv.description ?? undefined,
  };
}

function mapApiDepartmentToMock(apiDept: ApiCompanyDepartment): CompanyDepartment {
  return {
    id: apiDept.id,
    entityId: apiDept.entityId,
    divisionId: apiDept.divisionId ?? undefined,
    code: apiDept.code,
    name: apiDept.name,
    headTitle: apiDept.headTitle ?? undefined,
    description: apiDept.description ?? undefined,
  };
}

/**
 * Backend stores division/department as FKs (divisionId/departmentId);
 * the mock frontend type stores them as plain NAME strings — this looks the
 * name up from the already-mapped divisions/departments lists so existing UI
 * that reads `.division`/`.department` as display strings keeps working.
 */
function mapApiPositionToMock(
  apiPos: ApiMasterJobPosition,
  divisionNameById: Map<string, string>,
  departmentNameById: Map<string, string>
): MasterJobPosition {
  return {
    id: apiPos.id,
    entityId: apiPos.entityId,
    code: apiPos.code,
    title: apiPos.title,
    defaultLevel: apiPos.defaultLevel,
    division: apiPos.divisionId ? divisionNameById.get(apiPos.divisionId) : undefined,
    department: apiPos.departmentId ? departmentNameById.get(apiPos.departmentId) : undefined,
    jobFamily: apiPos.jobFamily ?? undefined,
    jobGrade: apiPos.jobGrade ?? undefined,
    minGrade: apiPos.minGrade ?? undefined,
    maxGrade: apiPos.maxGrade ?? undefined,
    gradingScheme: apiPos.gradingScheme ?? undefined,
    description: apiPos.description ?? undefined,
    requirements: apiPos.requirements ?? undefined,
  };
}

function mapApiOrgNodeToMock(
  apiNode: ApiOrgStructureNode,
  divisionNameById: Map<string, string>,
  departmentNameById: Map<string, string>
): OrgStructureNode {
  return {
    id: apiNode.id,
    entityId: apiNode.entityId,
    title: apiNode.title,
    department: apiNode.departmentId ? departmentNameById.get(apiNode.departmentId) ?? 'Umum' : 'Umum',
    division: apiNode.divisionId ? divisionNameById.get(apiNode.divisionId) : undefined,
    code: apiNode.code ?? undefined,
    jobGrade: apiNode.jobGrade ?? undefined,
    description: apiNode.description ?? undefined,
    reportsToId: apiNode.reportsToId ?? undefined,
    relationType: apiNode.relationType,
    currentEmployeeId: undefined,
    isVacant: apiNode.isVacant,
    level: apiNode.level,
    masterJobPositionId: apiNode.masterJobPositionId ?? undefined,
  };
}

function mapApiGradeToMock(apiGrade: ApiGradeSalaryRange): GradeSalaryRange {
  return {
    id: apiGrade.id,
    tenantId: apiGrade.tenantId,
    entityId: apiGrade.entityId ?? undefined,
    gradeCode: apiGrade.gradeCode,
    gradeName: apiGrade.gradeName,
    minSalary: apiGrade.minSalary ?? 0,
    midSalary: apiGrade.midSalary ?? 0,
    maxSalary: apiGrade.maxSalary ?? 0,
    singleValueSalary: apiGrade.singleValueSalary ?? undefined,
    effectiveDate: apiGrade.effectiveDate,
    version: apiGrade.version,
    notes: apiGrade.notes ?? undefined,
  };
}

/**
 * Merges a backend row's `details` jsonb blob with its first-class columns
 * into one flat mock-shaped object — used for Employee/Candidate/
 * JobVacancy/OnboardingProcess, which each have dozens of mostly-optional
 * fields not worth a dedicated DB column. Module-level (not a closure
 * inside HrmsProvider) so it has no declaration-order dependency on where
 * each `apiXxx` state is declared.
 */
function mergeRowIntoMock(row: any): Record<string, unknown> {
  const { details, ...columns } = row;
  return { ...(details as object), ...columns };
}

const HrmsContext = createContext<HrmsContextType | null>(null);

export const HrmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Universal File Preview Modal State
  const [activePreviewItem, setActivePreviewItem] = useState<UniversalPreviewItem | null>(null);
  const openFilePreview = (item: UniversalPreviewItem) => setActivePreviewItem(item);
  const closeFilePreview = () => setActivePreviewItem(null);

  // Tenant State
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('nusahr_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    return localStorage.getItem('nusahr_active_tenant') || 'tenant-ntm';
  });

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem('nusahr_tenants', JSON.stringify(next));
      return next;
    });
  };

  const updateTenantBranding = (documentLogoUrl?: string, appFaviconUrl?: string) => {
    updateTenant(currentTenantId, {
      ...(documentLogoUrl !== undefined ? { documentLogoUrl } : {}),
      ...(appFaviconUrl !== undefined ? { appFaviconUrl } : {}),
    });
  };

  const currentTenant = useMemo(() => {
    return tenants.find((t) => t.id === currentTenantId) || tenants[0];
  }, [tenants, currentTenantId]);

  // Sync Favicon to HTML head
  useEffect(() => {
    if (currentTenant?.appFaviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = currentTenant.appFaviconUrl;
    }
  }, [currentTenant?.appFaviconUrl]);

  const DEFAULT_ROLES: RoleDefinition[] = [
    { id: 'super_admin', label: 'Super Admin', description: 'Akses penuh seluruh modul, konfigurasi organisasi & audit log', badgeClass: 'bg-purple-100 text-purple-800', isSystem: true },
    { id: 'hr_admin', label: 'HR Admin', description: 'Pengelolaan SDM, presensi, cuti, KPI, kepatuhan & rekrutmen', badgeClass: 'bg-indigo-100 text-indigo-800', isSystem: true },
    { id: 'payroll_admin', label: 'Payroll Admin', description: 'Perhitungan gaji, slip PPh 21 TER, pinjaman & kasbon karyawan', badgeClass: 'bg-blue-100 text-blue-800', isSystem: true },
    { id: 'ga_admin', label: 'GA Admin', description: 'Aset inventaris, barcode QR, pengadaan PO & logistik operasional', badgeClass: 'bg-amber-100 text-amber-800', isSystem: true },
    { id: 'manager', label: 'Manager (MSS)', description: 'Persetujuan berjenjang, monitoring kehadiran & cuti tim bawahan', badgeClass: 'bg-emerald-100 text-emerald-800', isSystem: true },
    { id: 'employee', label: 'Staff (ESS)', description: 'Portal mandiri: pengajuan cuti, presensi, reimbursement, & slip', badgeClass: 'bg-slate-100 text-slate-800', isSystem: true },
  ];

  // Current User State & Role Switching
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('super_admin');
  const [currentSessionUser, setCurrentSessionUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    const saved = localStorage.getItem('nusahr_roles');
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });
  // Real backend login accounts, loaded via loadTenantOrgData(). Every real account is a
  // tenant_admin scoped to one entity; mapped to 'super_admin' here to match how LoginScreen
  // already labels a real session, since this app's in-house role/permission matrix (below)
  // has no backend equivalent yet.
  const [apiUsers, setApiUsers] = useState<ApiTenantUser[]>([]);
  const users = useMemo<UserAccount[]>(
    () => apiUsers.map((u) => ({ id: u.id, tenantId: u.tenantId, name: u.name, email: u.email, role: 'super_admin', status: 'Aktif' })),
    [apiUsers]
  );
  const [rolePermissions, setRolePermissions] = useState<Record<string, OperationPermissions>>(() => {
    const saved = localStorage.getItem('nusahr_role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_ROLE_PERMISSIONS, ...parsed };
        }
      } catch (e) {
        console.error('Failed to parse saved role permissions:', e);
      }
    }
    return INITIAL_ROLE_PERMISSIONS;
  });

  useEffect(() => {
    localStorage.setItem('nusahr_roles', JSON.stringify(roles));
  }, [roles]);

  // users is now derived from real backend accounts — no mock persistence.

  useEffect(() => {
    localStorage.setItem('nusahr_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  const currentUser = useMemo(() => {
    if (currentSessionUser) {
      const found = users.find((u) => u.id === currentSessionUser.id);
      if (found) return found;
      return { id: currentSessionUser.id, tenantId: currentTenant.id, name: currentSessionUser.name, email: currentSessionUser.email, role: currentUserRole };
    }
    return {
      id: 'current-usr',
      tenantId: currentTenant.id,
      name: 'Aditya Pratama (Admin)',
      email: 'aditya@nusantara.id',
      role: currentUserRole,
    };
  }, [currentTenant.id, currentUserRole, users, currentSessionUser]);

  // Active module view
  const [activeModule, setActiveModule] = useState<string>('dashboard');

  // Master Data Stores
  // Real backend data, hydrated via loadTenantOrgData() — the core
  // employee record (user, 2026-11-02: "selesaikan semua yang ada di menu
  // Management Karyawan"). ~90 mostly-optional fields; core
  // queryable/joinable columns are first-class, the rest rides in
  // `details` (see buildEmployeeApiPayload below), same pattern already
  // proven for candidates/jobVacancies/onboardingProcesses.
  const [apiEmployees, setApiEmployees] = useState<ApiEmployee[]>([]);
  const employees = useMemo(() => apiEmployees.map((r) => mergeRowIntoMock(r) as unknown as Employee), [apiEmployees]);

  const [personaliaLogs, setPersonaliaLogs] = useState<PersonaliaLog[]>(() => {
    const saved = localStorage.getItem('nusahr_personalia');
    return saved ? JSON.parse(saved) : INITIAL_PERSONALIA_LOGS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('nusahr_payroll');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_PAYROLL_RECORDS;
  });

  const [loans, setLoans] = useState<EmployeeLoan[]>(() => {
    const saved = localStorage.getItem('nusahr_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [kpis, setKpis] = useState<EmployeeKPI[]>(() => {
    const saved = localStorage.getItem('nusahr_kpis');
    return saved ? JSON.parse(saved) : INITIAL_KPIS;
  });

  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>(() => {
    const saved = localStorage.getItem('nusahr_compliance');
    return saved ? JSON.parse(saved) : INITIAL_COMPLIANCE;
  });

  // Real backend data, loaded via loadTenantOrgData(). FPTK is no longer
  // mock-only (user, 2026-11-02: "kenapa semua masih mockup form nya bukan
  // real dari database" / "Aku tidak mau ada lagi data mock"). Descriptive
  // fields that don't have a dedicated DB column live in `details` — see
  // mapApiJobRequisitionToMock below.
  const [apiJobRequisitions, setApiJobRequisitions] = useState<ApiJobRequisition[]>([]);
  const mapApiJobRequisitionToMock = (r: ApiJobRequisition): JobRequisition => ({
    id: r.id,
    tenantId: r.tenantId,
    reqNumber: (r.details.reqNumber as string) || '',
    position: (r.details.position as string) || '',
    department: (r.details.department as string) || '',
    officeLocationId: r.officeLocationId || undefined,
    grade: (r.details.grade as string) || '',
    gradeMin: r.details.gradeMin as string | undefined,
    gradeMax: r.details.gradeMax as string | undefined,
    headcount: r.headcount,
    reason: (r.details.reason as string) || (r.requisitionType === 'Penggantian' ? 'Penggantian Karyawan (Replacement)' : 'Posisi Baru (New Position)'),
    replacementFor: r.details.replacementFor as string | undefined,
    isBudgeted: r.details.isBudgeted as boolean | undefined,
    justification: r.details.justification as string | undefined,
    targetJoinDate: (r.details.targetJoinDate as string) || '',
    reportingToDepartment: r.details.reportingToDepartment as string | undefined,
    reportingToTitle: r.details.reportingToTitle as string | undefined,
    reportingToEmployeeId: r.details.reportingToEmployeeId as string | undefined,
    supervisedStaffCount: r.details.supervisedStaffCount as number | undefined,
    mainResponsibilities: r.details.mainResponsibilities as string | undefined,
    educationLevel: r.details.educationLevel as string | undefined,
    educationMajor: r.details.educationMajor as string | undefined,
    educationMin: r.details.educationMin as string | undefined,
    minExperience: (r.details.minExperience as string) || '',
    skills: r.details.skills as string | undefined,
    otherRequirements: r.details.otherRequirements as string | undefined,
    requirements: (r.details.requirements as string) || '',
    knockoutCriteria: r.knockoutCriteria as JobRequisition['knockoutCriteria'],
    scoredCriteria: r.scoredCriteria as JobRequisition['scoredCriteria'],
    requesterName: (r.details.requesterName as string) || '',
    requesterTitle: r.details.requesterTitle as string | undefined,
    approvedBy: r.details.approvedBy as string | undefined,
    approverTitle: r.details.approverTitle as string | undefined,
    approvalDate: r.details.approvalDate as string | undefined,
    approvalNotes: r.details.approvalNotes as string | undefined,
    signatories: r.signatories as JobRequisition['signatories'],
    retractedAt: r.details.retractedAt as string | undefined,
    retractedReason: r.details.retractedReason as string | undefined,
    retractedBy: r.details.retractedBy as string | undefined,
    status: r.status,
    createdAt: r.createdAt,
  });
  const jobRequisitions = useMemo(() => apiJobRequisitions.map(mapApiJobRequisitionToMock), [apiJobRequisitions]);

  // Real backend data, hydrated via loadTenantOrgData() — no more mock/
  // localStorage (user, 2026-11-02: "Aku tidak mau ada lagi data mock").
  // Vacancy/Candidate/OnboardingProcess each have dozens of mostly-optional
  // fields (sourcing, screening, testing, interview, MCU, offering, ...)
  // that aren't worth a dedicated DB column each — the row's `details`
  // jsonb holds the whole object, and a handful of columns (stage, scores,
  // status) are promoted for querying. See persistVacancy/persistCandidate/
  // persistOnboardingProcess below for the write side.
  const [apiVacancies, setApiVacancies] = useState<ApiJobVacancy[]>([]);
  const vacancies = useMemo(() => apiVacancies.map((r) => mergeRowIntoMock(r) as unknown as JobVacancy), [apiVacancies]);
  const [apiCandidates, setApiCandidates] = useState<ApiCandidate[]>([]);
  const candidates = useMemo(() => apiCandidates.map((r) => mergeRowIntoMock(r) as unknown as Candidate), [apiCandidates]);

  // Real backend data, hydrated via loadTenantOrgData() — recruitment
  // master config (user, 2026-11-02: "Selesaikan untuk modul rekrutmen").
  const [competencyTestTypes, setCompetencyTestTypes] = useState<CompetencyTestTypeSetting[]>([]);
  const [interviewTypeSettings, setInterviewTypeSettings] = useState<InterviewTypeSetting[]>([]);

  const [offboardingRecords, setOffboardingRecords] = useState<OffboardingRecord[]>(() => {
    const saved = localStorage.getItem('nusahr_offboarding');
    return saved ? JSON.parse(saved) : INITIAL_OFFBOARDING;
  });

  const [assets, setAssets] = useState<GAAsset[]>(() => {
    const saved = localStorage.getItem('nusahr_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GAAsset[];
        const existingIds = new Set(parsed.map((a) => a.id));
        const merged = [...parsed];
        for (const initAsset of INITIAL_ASSETS) {
          if (!existingIds.has(initAsset.id)) {
            merged.push(initAsset);
          }
        }
        return merged;
      } catch {
        return INITIAL_ASSETS;
      }
    }
    return INITIAL_ASSETS;
  });

  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>(() => {
    const saved = localStorage.getItem('nusahr_procurement');
    return saved ? JSON.parse(saved) : INITIAL_PROCUREMENT;
  });

  const [documents, setDocuments] = useState<OfficialDocument[]>(() => {
    const saved = localStorage.getItem('nusahr_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as OfficialDocument[];
        const existingIds = new Set(parsed.map((d) => d.id));
        const merged = [...parsed];
        for (const initDoc of INITIAL_DOCUMENTS) {
          if (!existingIds.has(initDoc.id)) {
            merged.push(initDoc);
          }
        }
        return merged;
      } catch (e) {
        console.error('Failed to parse documents', e);
      }
    }
    return INITIAL_DOCUMENTS;
  });

  const [apiOnboardingProcesses, setApiOnboardingProcesses] = useState<ApiOnboardingProcess[]>([]);
  const onboardingProcesses = useMemo(() => apiOnboardingProcesses.map((r) => mergeRowIntoMock(r) as unknown as OnboardingProcess), [apiOnboardingProcesses]);

  const [onboardingChecklistTemplates, setOnboardingChecklistTemplates] = useState<OnboardingChecklistTemplateItem[]>([]);

  // Real backend data, hydrated via loadTenantOrgData() — Attendance
  // (Presensi) module (user, 2026-11-03: "selesaikan semua integrasi dan
  // konsistensinya").
  const [shifts, setShifts] = useState<WorkShift[]>([]);

  const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>([]);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState<AttendanceCorrectionRequest[]>([]);

  const [businessTrips, setBusinessTrips] = useState<BusinessTripRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_trips');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse nusahr_trips', e);
      }
    }
    return INITIAL_BUSINESS_TRIPS;
  });

  // Real backend data, hydrated via loadTenantOrgData() — the Approval
  // Engine (user, 2026-11-02: fix this before the modules that depend on
  // it). createApprovalItem/persistApprovalItemUpdate below replace the
  // old setApprovalItems local-only setter everywhere it was used to add
  // or change a row.
  const [approvalItems, setApprovalItems] = useState<ApprovalWorkflowItem[]>([]);
  const [approvalDelegations, setApprovalDelegations] = useState<ApprovalDelegation[]>([]);

  const createApprovalItem = (item: Omit<ApprovalWorkflowItem, 'id' | 'tenantId'>) => {
    tenantApi.createApprovalItem(item as unknown as Omit<ApiApprovalWorkflowItem, 'id' | 'tenantId'>).then((created) => {
      setApprovalItems((prev) => [created as unknown as ApprovalWorkflowItem, ...prev]);
    });
  };

  const persistApprovalItemUpdate = (id: string, updates: Partial<ApprovalWorkflowItem>) => {
    const current = approvalItems.find((a) => a.id === id);
    if (!current) return;
    const merged = { ...current, ...updates };
    tenantApi.updateApprovalItem(id, merged as unknown as Partial<ApiApprovalWorkflowItem>).then((updated) => {
      setApprovalItems((prev) => prev.map((a) => (a.id === id ? (updated as unknown as ApprovalWorkflowItem) : a)));
    });
  };

  /** Most review actions sync the hub by referenceId+category, not by the approval item's own id (that's only known inside this module). */
  const persistApprovalItemByReference = (referenceId: string, category: string, updates: Partial<ApprovalWorkflowItem>) => {
    const current = approvalItems.find((a) => a.referenceId === referenceId && a.category === category);
    if (!current) return;
    persistApprovalItemUpdate(current.id, updates);
  };

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('nusahr_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [assetMaintenanceTickets, setAssetMaintenanceTickets] = useState<AssetMaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('nusahr_maintenance');
    return saved ? JSON.parse(saved) : [];
  });

  const [assetRelocations, setAssetRelocations] = useState<AssetRelocationLog[]>(() => {
    const saved = localStorage.getItem('nusahr_relocations');
    return saved ? JSON.parse(saved) : [];
  });

  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplateConfig[]>(() => {
    const saved = localStorage.getItem('nusahr_templates_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DocumentTemplateConfig[];
        const existingIds = new Set(parsed.map(t => t.id));
        const merged = [...parsed];
        for (const initTmpl of INITIAL_DOCUMENT_TEMPLATES) {
          if (!existingIds.has(initTmpl.id)) {
            merged.push(initTmpl);
          }
        }
        return merged;
      } catch (e) {
        console.error('Failed to parse templates', e);
      }
    }
    return INITIAL_DOCUMENT_TEMPLATES;
  });

  // Real backend data (per-module settings blob), hydrated via
  // loadTenantOrgData() and merged onto INITIAL_MODULE_SETTINGS so any
  // module key the tenant hasn't customized yet still has sane defaults.
  const [moduleSettings, setModuleSettings] = useState<ModuleSettingsConfig>(INITIAL_MODULE_SETTINGS);

  // 22. Entities & Holding — real backend data, loaded via loadTenantOrgData() right after login.
  const [apiEntities, setApiEntities] = useState<ApiCompanyEntity[]>([]);
  const entities = useMemo<CompanyEntity[]>(
    () => apiEntities.map((e) => mapApiEntityToMock(e, apiEntities)),
    [apiEntities]
  );
  const [currentEntityId, setCurrentEntityId] = useState<string>(() => {
    return localStorage.getItem('nusahr_active_entity') || 'ent-ntm-holding';
  });
  const currentEntity = useMemo(() => {
    return entities.find((e) => e.id === currentEntityId) || entities[0];
  }, [entities, currentEntityId]);

  // Setelah data entitas asli dimuat, pastikan currentEntityId selalu menunjuk ke entitas yang benar-benar ada.
  useEffect(() => {
    if (entities.length === 0) return;
    if (!entities.some((e) => e.id === currentEntityId)) {
      const holding = entities.find((e) => !e.parentEntityId) || entities[0];
      setCurrentEntityId(holding.id);
      localStorage.setItem('nusahr_active_entity', holding.id);
    }
  }, [entities, currentEntityId]);

  // 22B. Divisions & Departments — real backend data, loaded via loadTenantOrgData().
  const [apiDivisions, setApiDivisions] = useState<ApiCompanyDivision[]>([]);
  const [apiDepartments, setApiDepartments] = useState<ApiCompanyDepartment[]>([]);
  const divisions = useMemo<CompanyDivision[]>(() => apiDivisions.map(mapApiDivisionToMock), [apiDivisions]);
  const departments = useMemo<CompanyDepartment[]>(() => apiDepartments.map(mapApiDepartmentToMock), [apiDepartments]);
  const divisionNameById = useMemo(() => new Map(apiDivisions.map((d) => [d.id, d.name])), [apiDivisions]);
  const departmentNameById = useMemo(() => new Map(apiDepartments.map((d) => [d.id, d.name])), [apiDepartments]);
  /** Resolves a division/department NAME string (what the mock-shaped UI reads/writes) back to its real id, scoped to one entity — used by every CRUD handler below that has to translate the other direction. */
  const resolveDivisionId = (entityId: string, name: string | undefined): string | undefined =>
    name ? apiDivisions.find((d) => d.entityId === entityId && d.name === name)?.id : undefined;
  const resolveDepartmentId = (entityId: string, name: string | undefined): string | undefined =>
    name ? apiDepartments.find((d) => d.entityId === entityId && d.name === name)?.id : undefined;

  // 22B-2. Master Jabatan (Kamus Jabatan) — real backend data.
  const [apiPositions, setApiPositions] = useState<ApiMasterJobPosition[]>([]);
  const masterJobPositions = useMemo<MasterJobPosition[]>(
    () => apiPositions.map((p) => mapApiPositionToMock(p, divisionNameById, departmentNameById)),
    [apiPositions, divisionNameById, departmentNameById]
  );

  // 23. Employee Staging
  const [employeeStaging, setEmployeeStaging] = useState<EmployeeStaging[]>(() => {
    const saved = localStorage.getItem('nusahr_staging');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_STAGING;
  });

  // 24. Overtime Requests
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);

  // 25. Reimbursements
  const [reimbursementClaims, setReimbursementClaims] = useState<ReimbursementClaim[]>(() => {
    const saved = localStorage.getItem('nusahr_reimbursements_v3');
    const normalizeClaim = (c: any): ReimbursementClaim => ({
      ...c,
      category:
        typeof c.category === 'object' && c.category !== null
          ? String(c.category.value || c.category.label || 'Lainnya')
          : String(c.category || c.type || 'Lainnya'),
      receiptDate: c.receiptDate || c.claimDate || '2026-10-15',
      claimDate: c.claimDate || c.receiptDate || '2026-10-15',
      status: c.status || 'Menunggu Review',
    });
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as any[]).map(normalizeClaim);
        const existingIds = new Set(parsed.map((c) => c.id));
        const merged = [...parsed];
        for (const initClaim of INITIAL_REIMBURSEMENT_CLAIMS) {
          if (!existingIds.has(initClaim.id)) merged.push(normalizeClaim(initClaim));
        }
        return merged;
      } catch {
        return INITIAL_REIMBURSEMENT_CLAIMS.map(normalizeClaim);
      }
    }
    return INITIAL_REIMBURSEMENT_CLAIMS.map(normalizeClaim);

  });

  // 26. Personalia Requests
  const [personaliaRequests, setPersonaliaRequests] = useState<PersonaliaRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_personalia_reqs');
    return saved ? JSON.parse(saved) : INITIAL_PERSONALIA_REQUESTS;
  });

  // 27. Org Nodes & Proposals — real backend data for the nodes themselves.
  const [apiOrgNodes, setApiOrgNodes] = useState<ApiOrgStructureNode[]>([]);
  // Employee occupancy has no backend column yet (no employees table exists) — tracked
  // as a local-only overlay until that's wired, so "assign employee" keeps working
  // without inventing a fake backend field.
  const [employeeAssignmentOverrides, setEmployeeAssignmentOverrides] = useState<Record<string, string | null>>({});
  const orgNodes = useMemo<OrgStructureNode[]>(() => {
    return apiOrgNodes.map((n) => {
      const mapped = mapApiOrgNodeToMock(n, divisionNameById, departmentNameById);
      const override = employeeAssignmentOverrides[n.id];
      if (override === undefined) return mapped;
      return { ...mapped, currentEmployeeId: override ?? undefined, isVacant: !override };
    });
  }, [apiOrgNodes, divisionNameById, departmentNameById, employeeAssignmentOverrides]);
  const [orgProposals, setOrgProposals] = useState<OrgChangeProposal[]>(() => {
    const saved = localStorage.getItem('nusahr_org_proposals');
    return saved ? JSON.parse(saved) : INITIAL_ORG_PROPOSALS;
  });
  // Real backend data, loaded via loadTenantOrgData() — the "riwayat"
  // archive, browsable by effective date, taken automatically whenever a
  // proposal is approved or "Ajukan Restrukturisasi" (re)opens a locked
  // entity for direct editing (see startOrgRestructure below).
  const [apiOrgSnapshots, setApiOrgSnapshots] = useState<ApiOrgStructureSnapshot[]>([]);
  const orgSnapshots = useMemo<OrgStructureSnapshot[]>(
    () =>
      apiOrgSnapshots.map((s) => {
        const authorName = users.find((u) => u.id === s.createdByUserId)?.name || 'Sistem';
        const changeTypeLabel = s.changeType === 'modifikasi' ? 'Modifikasi/Pengembangan' : s.changeType === 'restrukturisasi' ? 'Restrukturisasi' : 'Perubahan';
        return {
          id: s.id,
          tenantId: s.tenantId,
          entityId: s.entityId,
          proposalId: s.proposalId ?? undefined,
          skDocNumber: s.skDocNumber ?? undefined,
          versionTitle: s.skDocNumber ? `${changeTypeLabel} — SK ${s.skDocNumber}` : `${changeTypeLabel} (otomatis dari proposal)`,
          effectiveDate: s.effectiveDate ?? s.takenAt.slice(0, 10),
          archivedAt: s.takenAt.slice(0, 10),
          archivedBy: authorName,
          reason: s.reason ?? '',
          divisions: s.divisions as unknown as CompanyDivision[],
          departments: s.departments as unknown as CompanyDepartment[],
          orgNodes: s.orgNodes as unknown as OrgStructureNode[],
        };
      }),
    [apiOrgSnapshots, users]
  );

  // Reads/writes the entity's REAL isGovernanceLocked column — must stay in
  // sync with the backend, which enforces this same flag server-side on
  // every direct division/department/position/org-node CRUD call.
  const isEntityGovernanceLocked = (entityId?: string) => {
    const targetId = entityId || currentEntityId;
    return entities.find((e) => e.id === targetId)?.isGovernanceLocked ?? false;
  };

  const toggleEntityGovernanceLock = (entityId: string) => {
    const target = entities.find((e) => e.id === entityId);
    updateEntity(entityId, { isGovernanceLocked: !(target?.isGovernanceLocked ?? false) });
  };

  const setIsOrgGovernanceLocked = (locked: boolean) => {
    updateEntity(currentEntityId, { isGovernanceLocked: locked });
  };

  /**
   * "Ajukan Restrukturisasi" (button #2, as opposed to the full in-modal
   * Perancang & Pengajuan Restrukturisasi wizard) — unlocks a locked entity
   * for direct editing through the normal Setup tabs. The backend does the
   * snapshot + optional clear + unlock as one transaction; this just calls
   * it and refreshes every collection it touched (entities, divisions,
   * departments, positions, org-nodes, employees, snapshots) from the
   * server rather than trying to hand-merge each one locally.
   */
  const startOrgRestructure = async (data: {
    entityId: string;
    skDocNumber: string;
    effectiveDate: string;
    skDocFileName?: string | null;
    changeType: 'restrukturisasi' | 'modifikasi';
    reason: string;
    startMode: 'copy' | 'blank';
  }) => {
    await tenantApi.startOrgRestructure(data);
    await loadTenantOrgData();
    logAuditAction('Struktur Organisasi', 'AJUKAN_RESTRUKTURISASI', data.entityId, `Membuka entitas ${data.entityId} untuk restrukturisasi (${data.changeType}), SK ${data.skDocNumber}`);
  };

  /** Discards the in-progress restructuring draft and restores the entity's last snapshot, re-locking it. */
  const revertOrgRestructure = async (entityId: string) => {
    await tenantApi.revertOrgRestructure(entityId);
    await loadTenantOrgData();
    logAuditAction('Struktur Organisasi', 'BATALKAN_RESTRUKTURISASI', entityId, `Membatalkan draft restrukturisasi entitas ${entityId}, dikembalikan ke snapshot terakhir`);
  };

  // 28. Probation Evaluations & 29. Contract Reviews — real backend data,
  // hydrated via loadTenantOrgData() (Manajemen Karyawan sub-menus).
  const [probationEvaluations, setProbationEvaluations] = useState<ProbationEvaluation[]>([]);
  const [contractReviews, setContractReviews] = useState<ContractRenewalReview[]>([]);

  // 30. Calendar Events
  const [calendarEvents, setCalendarEvents] = useState<CompanyCalendarEvent[]>(() => {
    const saved = localStorage.getItem('nusahr_calendar');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  // 31. Grade Salary Ranges
  const [apiGrades, setApiGrades] = useState<ApiGradeSalaryRange[]>([]);
  const gradeSalaryRanges = useMemo<GradeSalaryRange[]>(() => apiGrades.map(mapApiGradeToMock), [apiGrades]);

  const [jobGradingScheme, setJobGradingScheme] = useState<'single' | 'broadbanding'>(() => {
    const saved = localStorage.getItem('nusahr_job_grading_scheme');
    return saved === 'broadbanding' || saved === 'single' ? saved : 'single';
  });

  // 32. Salary Components & Assignments
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponentMaster[]>(() => {
    const saved = localStorage.getItem('nusahr_salary_components');
    return saved ? JSON.parse(saved) : INITIAL_SALARY_COMPONENTS;
  });
  const [employeeSalaryAssignments, setEmployeeSalaryAssignments] = useState<EmployeeSalaryComponentAssignment[]>(() => {
    const saved = localStorage.getItem('nusahr_salary_assignments');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_SALARY_ASSIGNMENTS;
  });

  // 33. GA Facilities, Fleet & Supply
  const [roomBookings, setRoomBookings] = useState<GARoomBooking[]>(() => {
    const saved = localStorage.getItem('nusahr_room_bookings');
    return saved ? JSON.parse(saved) : INITIAL_GA_ROOM_BOOKINGS;
  });
  const [vehicleBookings, setVehicleBookings] = useState<GAVehicleBooking[]>(() => {
    const saved = localStorage.getItem('nusahr_vehicle_bookings');
    return saved ? JSON.parse(saved) : INITIAL_GA_VEHICLE_BOOKINGS;
  });
  const [officeSupplies, setOfficeSupplies] = useState<GAOfficeSupply[]>(() => {
    const saved = localStorage.getItem('nusahr_supplies');
    return saved ? JSON.parse(saved) : INITIAL_GA_SUPPLIES;
  });
  const [officeSupplyRequests, setOfficeSupplyRequests] = useState<GAOfficeSupplyRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_supply_requests');
    return saved ? JSON.parse(saved) : INITIAL_GA_SUPPLY_REQUESTS;
  });
  const [gaTickets, setGaTickets] = useState<GATicket[]>(() => {
    const saved = localStorage.getItem('nusahr_ga_tickets');
    return saved ? JSON.parse(saved) : INITIAL_GA_TICKETS;
  });

  // 40. Master Lokasi Kantor — real backend data, loaded via loadTenantOrgData().
  const [apiOfficeLocations, setApiOfficeLocations] = useState<ApiOfficeLocation[]>([]);
  const officeLocations = useMemo<OfficeLocation[]>(() => {
    const entityNameById = new Map(apiEntities.map((e) => [e.id, e.name]));
    return apiOfficeLocations.map((l) => mapApiOfficeLocationToMock(l, entityNameById));
  }, [apiOfficeLocations, apiEntities]);

  const addOfficeLocation = (loc: Omit<OfficeLocation, 'id' | 'tenantId'>) => {
    tenantApi
      .createOfficeLocation({
        entityId: loc.entityId ?? null,
        code: loc.code,
        name: loc.name,
        type: loc.type,
        address: loc.address || null,
        city: loc.city || null,
        latitude: loc.latitude ?? null,
        longitude: loc.longitude ?? null,
        radiusMeters: loc.radiusMeters,
        notes: loc.notes ?? null,
      })
      .then((created) => setApiOfficeLocations((prev) => [...prev, created]))
      .catch((err) => console.error('Gagal menambahkan lokasi kantor:', err));
  };

  const updateOfficeLocation = (id: string, updates: Partial<OfficeLocation>) => {
    tenantApi
      .updateOfficeLocation(id, {
        entityId: updates.entityId,
        code: updates.code,
        name: updates.name,
        type: updates.type,
        address: updates.address,
        city: updates.city,
        latitude: updates.latitude,
        longitude: updates.longitude,
        radiusMeters: updates.radiusMeters,
        isActive: updates.isActive,
        notes: updates.notes,
      })
      .then((updated) => setApiOfficeLocations((prev) => prev.map((l) => (l.id === id ? updated : l))))
      .catch((err) => console.error('Gagal memperbarui lokasi kantor:', err));
  };

  const deleteOfficeLocation = (id: string) => {
    // Backend tidak menyediakan hard-delete lokasi; nonaktifkan saja (isActive: false).
    tenantApi
      .updateOfficeLocation(id, { isActive: false })
      .then((updated) => setApiOfficeLocations((prev) => prev.map((l) => (l.id === id ? updated : l))))
      .catch((err) => console.error('Gagal menghapus lokasi kantor:', err));
  };

  const loadTenantOrgData = async () => {
    const [
      realEntities, realOfficeLocations, realDivisions, realDepartments, realPositions, realOrgNodes, realGrades,
      realUsers, realJobRequisitions, realVacancies, realCandidates, realOnboardingProcesses,
      realCompetencyTestTypes, realInterviewTypes, realOnboardingChecklistTemplates, realEmployees,
      realProbationEvaluations, realContractReviews, realModuleSettings,
      realApprovalItems, realApprovalDelegations,
      realWorkShifts, realEmployeeSchedules, realShiftSwapRequests, realAttendanceRecords, realAttendanceCorrections, realOvertimeRequests,
      realOrgSnapshots,
    ] = await Promise.all([
      tenantApi.listEntities(),
      tenantApi.listOfficeLocations(),
      tenantApi.listDivisions(),
      tenantApi.listDepartments(),
      tenantApi.listPositions(),
      tenantApi.listOrgNodes(),
      tenantApi.listGrades(),
      tenantApi.listUsers(),
      tenantApi.listJobRequisitions(),
      tenantApi.listJobVacancies(),
      tenantApi.listCandidates(),
      tenantApi.listOnboardingProcesses(),
      tenantApi.listCompetencyTestTypes(),
      tenantApi.listInterviewTypes(),
      tenantApi.listOnboardingChecklistTemplates(),
      tenantApi.listEmployees(),
      tenantApi.listProbationEvaluations(),
      tenantApi.listContractRenewalReviews(),
      tenantApi.getModuleSettings(),
      tenantApi.listApprovalItems(),
      tenantApi.listApprovalDelegations(),
      tenantApi.listWorkShifts(),
      tenantApi.listEmployeeSchedules(),
      tenantApi.listShiftSwapRequests(),
      tenantApi.listAttendanceRecords(),
      tenantApi.listAttendanceCorrections(),
      tenantApi.listOvertimeRequests(),
      tenantApi.listOrgSnapshots(),
    ]);
    setApiEntities(realEntities);
    setApiOfficeLocations(realOfficeLocations);
    setApiDivisions(realDivisions);
    setApiDepartments(realDepartments);
    setApiPositions(realPositions);
    setApiOrgNodes(realOrgNodes);
    setApiGrades(realGrades);
    setApiUsers(realUsers);
    setApiJobRequisitions(realJobRequisitions);
    setApiVacancies(realVacancies);
    setApiCandidates(realCandidates);
    setApiOnboardingProcesses(realOnboardingProcesses);
    setCompetencyTestTypes(realCompetencyTestTypes.map(toMockCompetencyTestType));
    setInterviewTypeSettings(realInterviewTypes.map(toMockInterviewType));
    setOnboardingChecklistTemplates(realOnboardingChecklistTemplates.map(toMockChecklistTemplate));
    setApiEmployees(realEmployees);
    setProbationEvaluations(realProbationEvaluations.map(toMockProbationEvaluation));
    setContractReviews(realContractReviews.map(toMockContractReview));
    setModuleSettings((prev) => {
      const merged = { ...prev };
      for (const key of Object.keys(realModuleSettings)) {
        (merged as any)[key] = { ...(merged as any)[key], ...realModuleSettings[key] };
      }
      return merged;
    });
    setApprovalItems(realApprovalItems as unknown as ApprovalWorkflowItem[]);
    setApprovalDelegations(realApprovalDelegations as unknown as ApprovalDelegation[]);
    setShifts(realWorkShifts as unknown as WorkShift[]);
    setSchedules(realEmployeeSchedules as unknown as EmployeeSchedule[]);
    setShiftSwaps(realShiftSwapRequests as unknown as ShiftSwapRequest[]);
    setAttendance(realAttendanceRecords as unknown as AttendanceRecord[]);
    setAttendanceCorrections(realAttendanceCorrections as unknown as AttendanceCorrectionRequest[]);
    setOvertimeRequests(realOvertimeRequests as unknown as OvertimeRequest[]);
    setApiOrgSnapshots(realOrgSnapshots);
  };

  // 34. Vendor Invoices (AP)
  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoice[]>(() => {
    const saved = localStorage.getItem('nusahr_vendor_invoices');
    return saved ? JSON.parse(saved) : INITIAL_VENDOR_INVOICES;
  });

  // 35. Audit Trail
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('nusahr_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // 36. eNPS
  const [enpsSurvey, setEnpsSurvey] = useState<ENpsSurvey>(() => {
    const saved = localStorage.getItem('nusahr_enps');
    return saved ? JSON.parse(saved) : INITIAL_ENPS_SURVEY;
  });

  // 37. User Signatures
  const [userSignatures, setUserSignatures] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nusahr_signatures');
    return saved ? JSON.parse(saved) : {
      'usr-1': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M10 40 Q 30 10, 60 30 T 110 20 T 150 45" stroke="%231e293b" stroke-width="2.5" fill="none"/></svg>'
    };
  });


  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nusahr_active_tenant', currentTenantId);
  }, [currentTenantId]);


  useEffect(() => {
    localStorage.setItem('nusahr_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('nusahr_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('nusahr_templates_v6', JSON.stringify(documentTemplates));
  }, [documentTemplates]);

  useEffect(() => {
    localStorage.setItem('nusahr_payroll', JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  // entities is now derived from real backend data (apiEntities) — no mock persistence.

  // divisions/departments/masterJobPositions/gradeSalaryRanges are now derived from real backend data — no mock persistence.

  useEffect(() => {
    localStorage.setItem('nusahr_job_grading_scheme', jobGradingScheme);
  }, [jobGradingScheme]);

  useEffect(() => {
    localStorage.setItem('nusahr_reimbursements_v3', JSON.stringify(reimbursementClaims));
  }, [reimbursementClaims]);


  // Real backend data, already tenant-scoped server-side — NOT re-filtered by
  // currentTenant.id (bug, 2026-11-03: currentTenant is still mock/App-Owner
  // tenant-switcher state whose id never matches the real tenant UUID, so this
  // filter silently emptied every real employee list for every real session).
  const tenantEmployees = useMemo(
    () => employees,
    [employees]
  );

  // 1. Employee & Personalia Functions
  // Splits a (partial) mock Employee into the real columns the backend
  // actually queries on vs. the ~80 other descriptive fields that just
  // ride along in `details` — mirrors buildCandidateApiPayload.
  const buildEmployeeApiPayload = (e: Partial<Employee>) => ({
    entityId: currentEntity?.id || e.entityId,
    nik: e.nik,
    fullName: e.fullName,
    email: e.email,
    phone: e.phone,
    avatar: e.avatar,
    employmentType: e.employmentType,
    managerId: e.managerId,
    candidateId: e.candidateId,
    status: e.status,
    basicSalary: typeof e.basicSalary === 'number' ? e.basicSalary : undefined,
    joinDate: e.joinDate,
    details: e,
  });

  const addEmployee = async (empData: Omit<Employee, 'id' | 'tenantId'>): Promise<Employee> => {
    const payload = buildEmployeeApiPayload(empData);
    const created = await tenantApi.createEmployee(payload as Partial<ApiEmployee> & { entityId: string; nik: string; fullName: string });
    const newEmp = mergeRowIntoMock(created) as unknown as Employee;
    setApiEmployees((prev) => [created, ...prev]);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const current = employees.find((e) => e.id === id);
    if (!current) return;
    const merged = { ...current, ...updates };
    tenantApi
      .updateEmployee(id, buildEmployeeApiPayload(merged) as Partial<ApiEmployee>)
      .then((updated) => setApiEmployees((prev) => prev.map((r) => (r.id === id ? updated : r))));
  };

  const deleteEmployee = (id: string) => {
    tenantApi.deleteEmployee(id).then(() => setApiEmployees((prev) => prev.filter((e) => e.id !== id)));
  };

  const processPersonaliaAction = (action: {
    employeeId: string;
    type: PersonaliaActionType | string;
    newPosition?: string;
    newDepartment?: string;
    newGrade?: string;
    newSalary?: number;
    newPositionAllowance?: number;
    newFixedAllowance?: number;
    newBranchLocation?: string;
    contractDurationMonths?: number;
    contractEndDate?: string;
    actingRoleExpiryDate?: string;
    permanentAppointmentDate?: string;
    disciplinaryLevel?: 'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing';
    reason: string;
    effectiveDate: string;
    skDocNumber?: string;
    notes?: string;
    signatories?: PersonaliaSignatory[];
    status?: 'Disetujui' | 'Menunggu Approval' | 'Draf';
    systemicImpact?: SystemicImpactConfig;
  }) => {
    const emp = employees.find((e) => e.id === action.employeeId);
    if (!emp) return;

    const letterNumber =
      action.skDocNumber ||
      generateDocumentNumber(
        'Surat Promosi',
        personaliaLogs.length + 1,
        currentTenant.code
      );

    const finalStatus = action.status || 'Menunggu Approval';

    const log: PersonaliaLog = {
      id: `pers-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: action.employeeId,
      type: action.type,
      previousPosition: emp.position,
      newPosition: action.newPosition || emp.position,
      previousDepartment: emp.department,
      newDepartment: action.newDepartment || emp.department,
      previousGrade: emp.grade,
      newGrade: action.newGrade || emp.grade,
      previousSalary: emp.basicSalary,
      newSalary: action.newSalary !== undefined ? action.newSalary : emp.basicSalary,
      previousAllowance: emp.positionAllowance,
      newAllowance: action.newPositionAllowance !== undefined ? action.newPositionAllowance : emp.positionAllowance,
      effectiveDate: action.effectiveDate,
      letterNumber,
      reason: action.reason,
      approvedBy: action.signatories?.find((s) => s.label.toLowerCase().includes('menyetujui') || s.label.toLowerCase().includes('disetujui'))?.name || currentUser.name,
      status: finalStatus,
      notes: action.notes,
      newBranchLocation: action.newBranchLocation,
      contractDurationMonths: action.contractDurationMonths,
      contractEndDate: action.contractEndDate,
      actingRoleExpiryDate: action.actingRoleExpiryDate,
      permanentAppointmentDate: action.permanentAppointmentDate,
      disciplinaryLevel: action.disciplinaryLevel,
      skDocNumber: letterNumber,
      signatories: action.signatories,
      systemicImpact: action.systemicImpact,
    };

    setPersonaliaLogs((prev) => [log, ...prev]);

    // If it's a draft, do NOT update employee master record yet
    if (finalStatus === 'Draf') {
      logAuditAction('Personalia', 'SAVE_DRAFT', log.id, `Simpan draf tindakan personalia ${action.type} untuk ${emp.fullName}`);
      return;
    }

    if (finalStatus === 'Menunggu Approval') {
      // Add to Approval Center queue
      createApprovalItem({
        category: 'Promosi/Personalia',
        referenceId: log.id,
        title: `Personalia: ${action.type} - ${emp.fullName}`,
        requesterId: action.employeeId,
        department: emp.department || 'Operasional',
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        deadlineAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        level: 1,
        totalLevels: action.signatories?.length || 2,
        assignedApproverRole: 'manager',
        status: 'Menunggu',
        notes: action.reason,
      });
      logAuditAction('Personalia', 'SUBMIT_FOR_APPROVAL', log.id, `Pengajuan persetujuan SK ${action.type} untuk ${emp.fullName}`);
      return;
    }

    // Update employee master record with specific field updates based on action type
    const updates: Partial<Employee> = {};
    if (action.newPosition) updates.position = action.newPosition;
    if (action.newDepartment) updates.department = action.newDepartment;
    if (action.newGrade) updates.grade = action.newGrade;
    if (action.newSalary !== undefined) updates.basicSalary = action.newSalary;
    if (action.newPositionAllowance !== undefined) updates.positionAllowance = action.newPositionAllowance;
    if (action.newFixedAllowance !== undefined) updates.fixedAllowance = action.newFixedAllowance;
    if (action.newBranchLocation) updates.branchLocation = action.newBranchLocation;

    if (action.type === 'Pengangkatan Tetap') {
      updates.employmentType = 'Tetap';
      updates.probationStatus = 'Lolos';
      updates.permanentAppointmentDate = action.permanentAppointmentDate || action.effectiveDate;
      if (action.skDocNumber) updates.contractDocNumber = action.skDocNumber;
    } else if (action.type === 'Perpanjangan Kontrak') {
      if (action.contractEndDate) updates.contractEndDate = action.contractEndDate;
      if (action.skDocNumber) updates.contractDocNumber = action.skDocNumber;
    } else if (action.type === 'Sanksi Disiplin SP' && action.disciplinaryLevel) {
      issueComplianceAction({
        employeeId: emp.id,
        level: action.disciplinaryLevel,
        violationReason: action.reason,
        validMonths: 6,
      });
    }

    updateEmployee(emp.id, updates);

    // Create official document
    createOfficialDocument({
      type: 'Surat Promosi',
      title: `Surat Keputusan (${action.type}): ${emp.fullName}`,
      targetEmployeeId: emp.id,
      signeeName: currentUser.name,
      signeeRole: 'VP Human Resources & Direksi',
      contentPreview: `Menetapkan keputusan personalia (${action.type}) atas nama ${emp.fullName} (NIK: ${emp.nik}). Perubahan mencakup jabatan: ${updates.position || emp.position}, unit: ${updates.department || emp.department}, remunerasi disesuaikan menjadi Rp ${(updates.basicSalary || emp.basicSalary).toLocaleString('id-ID')}. Berlaku efektif terhitung tanggal ${action.effectiveDate}.`,
    });
  };

  // 2. Attendance & Leave — real backend. persistAttendanceUpsert mirrors
  // the server's own upsert-by-(employeeId, date) endpoint: compute the
  // merged row exactly as before, send it, and swap the local row for
  // whatever the server actually persisted.
  const persistAttendanceUpsert = (record: Omit<AttendanceRecord, 'id' | 'tenantId'>) => {
    tenantApi.upsertAttendanceRecord(record as unknown as Omit<ApiAttendanceRecord, 'id' | 'tenantId'>).then((saved) => {
      const mock = saved as unknown as AttendanceRecord;
      setAttendance((prev) => {
        const idx = prev.findIndex((a) => a.employeeId === mock.employeeId && a.date === mock.date);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = mock;
          return copy;
        }
        return [mock, ...prev];
      });
    });
  };

  const clockIn = (employeeId: string, notes?: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    // Standard start hour 08:30
    const [hours, mins] = timeStr.split(':').map(Number);
    const lateMinutes = Math.max(0, hours * 60 + mins - (8 * 60 + 30));
    const status = lateMinutes > 0 ? 'Terlambat' : 'Hadir';

    const existing = attendance.find((a) => a.tenantId === currentTenant.id && a.employeeId === employeeId && a.date === today);

    persistAttendanceUpsert({
      employeeId,
      date: today,
      clockIn: timeStr,
      clockOut: existing?.clockOut,
      status,
      overtimeHours: existing?.overtimeHours ?? 0,
      lateMinutes,
      notes: notes || existing?.notes || 'Presensi ESS Mobile/Webcam Terverifikasi',
      shiftId: existing?.shiftId,
    });
  };

  const clockOut = (employeeId: string, notes?: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    const [hours, mins] = timeStr.split(':').map(Number);
    // Overtime calculated after 17:30
    const outTotalMins = hours * 60 + mins;
    const standardOutMins = 17 * 60 + 30;
    const otMinutes = Math.max(0, outTotalMins - standardOutMins);
    const overtimeHours = Number((otMinutes / 60).toFixed(1));

    const existing = attendance.find((a) => a.tenantId === currentTenant.id && a.employeeId === employeeId && a.date === today);
    if (!existing) return;

    persistAttendanceUpsert({
      ...existing,
      clockOut: timeStr,
      overtimeHours,
      notes: notes || existing.notes,
    });
  };

  const submitLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'tenantId' | 'status'>) => {
    const newReq: LeaveRequest = {
      ...requestData,
      id: `leave-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu',
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
    const emp = employees.find((e) => e.id === newReq.employeeId);
    createApprovalItem({
      category: 'Cuti',
      referenceId: newReq.id,
      title: `Permohonan ${newReq.leaveType} (${newReq.totalDays} Hari) - ${emp?.fullName || 'Karyawan'}`,
      requesterId: newReq.employeeId,
      department: emp?.department || 'Operasional',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
      level: 1,
      totalLevels: 2,
      assignedApproverRole: 'manager',
      status: 'Menunggu',
      notes: `${newReq.startDate} s/d ${newReq.endDate}: ${newReq.reason}`,
    });
  };

  const reviewLeaveRequest = (id: string, approved: boolean) => {
    const req = leaveRequests.find((l) => l.id === id);
    persistApprovalItemByReference(id, 'Cuti', { status: approved ? 'Disetujui' : 'Ditolak' });
    if (req && approved) {
      const attStatus: AttendanceRecord['status'] = req.leaveType.includes('Sakit')
        ? 'Sakit'
        : req.leaveType.includes('Izin')
        ? 'Izin'
        : 'Cuti';
      const existing = attendance.find((a) => a.tenantId === currentTenant.id && a.employeeId === req.employeeId && a.date === req.startDate);
      persistAttendanceUpsert(
        existing
          ? { ...existing, status: attStatus, lateMinutes: 0, notes: `${req.leaveType}: ${req.reason}` }
          : {
              employeeId: req.employeeId,
              date: req.startDate,
              clockIn: '-',
              clockOut: '-',
              status: attStatus,
              overtimeHours: 0,
              lateMinutes: 0,
              notes: `${req.leaveType} Disetujui: ${req.reason}`,
            }
      );
    }
    if (!req) return;

    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: approved ? 'Disetujui' : 'Ditolak',
              approvedBy: currentUser.name,
            }
          : l
      )
    );

    // If approved, deduct leave days from employee
    if (approved) {
      const emp = employees.find((e) => e.id === req.employeeId);
      if (emp && req.leaveType === 'Cuti Tahunan') {
        updateEmployee(emp.id, { remainingLeaveDays: Math.max(0, (emp.remainingLeaveDays ?? 12) - req.totalDays) });
      }
    }
  };

  // 3. Payroll Calculation Engine (with PPh 21 TER 2024 & BPJS)
  const generatePayrollRun = (period: string) => {
    // Determine period date filter (e.g. "Oktober 2026" -> "2026-10")
    const periodLower = period.toLowerCase();
    const monthNames = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
    ];
    let monthIdx = -1;
    monthNames.forEach((m, idx) => {
      if (periodLower.includes(m)) monthIdx = idx + 1;
    });
    const yearMatch = period.match(/\b(20\d\d)\b/);
    const yearStr = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
    const monthStr = monthIdx > 0 ? String(monthIdx).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
    const periodDatePrefix = `${yearStr}-${monthStr}`;

    // Generate payroll records for all active employees of current tenant
    const newRecords: PayrollRecord[] = tenantEmployees.filter((e) => e.status === 'Aktif').map((emp) => {
      // 1. Find employee's attendance strictly filtered by this period (FR-0.1)
      const empAttendance = attendance.filter(
        (a) => a.tenantId === currentTenant.id && a.employeeId === emp.id && a.date.startsWith(periodDatePrefix)
      );
      const totalLateMins = empAttendance.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);

      // 2. Overtime hours derived exclusively from approved OvertimeRequests (FR-0.1, Catalog Bug #2)
      const approvedOvtRequests = overtimeRequests.filter(
        (o) =>
          o.tenantId === currentTenant.id &&
          o.employeeId === emp.id &&
          o.status === 'Disetujui' &&
          o.date.startsWith(periodDatePrefix)
      );
      const totalApprovedOvertimeHours = approvedOvtRequests.reduce(
        (acc, curr) => acc + (curr.approvedHours || curr.hours || 0),
        0
      );
      const overtimePay = calculateOvertimePay(emp.basicSalary, totalApprovedOvertimeHours);

      // 3. Reimbursement derived exclusively from approved ReimbursementClaims with payroll opt-in (FR-0.2, Catalog Bug #5)
      const approvedClaims = reimbursementClaims.filter(
        (c) =>
          c.tenantId === currentTenant.id &&
          c.employeeId === emp.id &&
          c.status === 'Disetujui' &&
          c.processInPayroll &&
          (!c.processedPeriod || c.processedPeriod === period)
      );
      const totalReimbursement = approvedClaims.reduce((acc, curr) => acc + curr.amount, 0);

      // 4. Pro-rata salary check (if joined or resigned during this month)
      let proRataRatio = 1.0;
      if (emp.joinDate && emp.joinDate.startsWith(periodDatePrefix)) {
        const joinDay = parseInt(emp.joinDate.split('-')[2], 10) || 1;
        const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
        const workedDays = Math.max(1, daysInMonth - joinDay + 1);
        proRataRatio = Math.min(1.0, workedDays / daysInMonth);
      }
      const effectiveBasicSalary = Math.round(emp.basicSalary * proRataRatio);

      // 5. Allowances
      const customAssignedComponents = employeeSalaryAssignments
        .filter((asg) => asg.tenantId === currentTenant.id && asg.employeeId === emp.id && asg.isActive !== false)
        .reduce((sum, asg) => {
          const comp = salaryComponents.find((sc) => sc.id === asg.componentId);
          if (comp && comp.category === 'Potongan') return sum;
          return sum + (asg.customAmount ?? asg.amount ?? comp?.defaultAmount ?? 0);
        }, 0);
      const allowances =
        (emp.fixedAllowance || 0) +
        (emp.positionAllowance || 0) +
        (emp.transportAllowance || 0) +
        (emp.mealAllowance || 0) +
        customAssignedComponents;

      // 6. Active Loan Deductions
      const activeLoan = loans.find(
        (l) => l.employeeId === emp.id && l.tenantId === currentTenant.id && l.status === 'Aktif'
      );
      const loanDeduction = activeLoan ? activeLoan.monthlyInstallment : 0;

      // 7. Late deduction based on attendance penalty config
      const penaltyPerHour = moduleSettings.attendance.latePenaltyPerHour || 50000;
      const lateDeduction = Math.floor(totalLateMins / 60) * penaltyPerHour;

      // 8. BPJS calculations
      const bpjs = calculateBPJS(effectiveBasicSalary + emp.fixedAllowance);

      // 9. Gross pay for PPh 21 TER: Gaji Pokok + Tunjangan Tetap + Lembur + BPJS Dibayar Pemberi Kerja (JKK, JKM, Kes)
      const grossIncomeForTax =
        effectiveBasicSalary +
        allowances +
        overtimePay +
        bpjs.breakdown.jkkCompany +
        bpjs.breakdown.jkmCompany +
        bpjs.bpjsKesCompany;

      // 10. Calculate PPh 21 TER
      const taxResult = calculatePPh21TER(grossIncomeForTax, emp.ptkp);

      // 11. Net Pay = (Effective Gaji Pokok + Tunjangan + Lembur + Reimbursement) - Deductions
      const totalTakeHomeIncome = effectiveBasicSalary + allowances + overtimePay + totalReimbursement;
      const totalDeductions =
        bpjs.bpjsKesEmployee +
        bpjs.bpjsTkEmployee +
        taxResult.taxAmount +
        loanDeduction +
        lateDeduction;

      const netPay = Math.max(0, totalTakeHomeIncome - totalDeductions);

      return {
        id: `pay-${period.replace(/\s+/g, '-')}-${emp.id}`,
        tenantId: currentTenant.id,
        employeeId: emp.id,
        period,
        basicSalary: effectiveBasicSalary,
        allowances,
        overtimePay,
        reimbursement: totalReimbursement,
        thrBonus: 0,
        grossPay: totalTakeHomeIncome,
        bpjsKesCompany: bpjs.bpjsKesCompany,
        bpjsKesEmployee: bpjs.bpjsKesEmployee,
        bpjsTkCompany: bpjs.bpjsTkCompany,
        bpjsTkEmployee: bpjs.bpjsTkEmployee,
        pph21TERCategory: taxResult.category,
        pph21RatePercent: taxResult.ratePercent,
        pph21Amount: taxResult.taxAmount,
        loanDeduction,
        lateDeduction,
        totalDeductions,
        netPay,
        status: 'Draft',
      };
    });

    // Replace or merge payroll records for this period
    setPayrollRecords((prev) => {
      const filtered = prev.filter((p) => !(p.tenantId === currentTenant.id && p.period === period));
      return [...newRecords, ...filtered];
    });

    logAuditAction('Payroll', 'GENERATE_PAYROLL', `run-${period}`, `Generate draft payroll periode ${period} untuk ${newRecords.length} karyawan`);
  };

  const approvePayrollRun = (period: string) => {
    setPayrollRecords((prev) =>
      prev.map((p) =>
        p.tenantId === currentTenant.id && p.period === period ? { ...p, status: 'Approved' } : p
      )
    );
  };

  const disbursePayrollRun = (period: string) => {
    const today = new Date().toISOString().split('T')[0];
    setPayrollRecords((prev) =>
      prev.map((p) =>
        p.tenantId === currentTenant.id && p.period === period
          ? { ...p, status: 'Disbursed', paidDate: today }
          : p
      )
    );

    // Also deduct remaining amount on active loans
    setLoans((prev) =>
      prev.map((l) => {
        if (l.tenantId === currentTenant.id && l.status === 'Aktif') {
          const newRemaining = Math.max(0, l.remainingAmount - l.monthlyInstallment);
          return {
            ...l,
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? 'Lunas' : 'Aktif',
          };
        }
        return l;
      })
    );
  };

  // 4. Loans & Kasbon
  const addLoan = (
    loanData: Omit<EmployeeLoan, 'id' | 'tenantId' | 'remainingAmount' | 'status'>
  ) => {
    const newLoan: EmployeeLoan = {
      ...loanData,
      id: `loan-${Date.now()}`,
      tenantId: currentTenant.id,
      remainingAmount: loanData.totalAmount,
      status: 'Menunggu Approval',
    };
    setLoans((prev) => [newLoan, ...prev]);
    const emp = employees.find((e) => e.id === newLoan.employeeId);
    createApprovalItem({
      category: 'Pinjaman',
      referenceId: newLoan.id,
      title: `Pengajuan ${newLoan.loanType}: ${emp?.fullName || 'Karyawan'} (Tenor ${newLoan.tenorMonths} Bln)`,
      requesterId: newLoan.employeeId,
      department: emp?.department || 'Operasional',
      amount: newLoan.totalAmount,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
      level: 1,
      totalLevels: 2,
      assignedApproverRole: 'payroll_admin',
      status: 'Menunggu',
      notes: newLoan.reason,
    });
  };

  const updateLoanStatus = (id: string, status: 'Aktif' | 'Lunas' | 'Menunggu Approval' | 'Ditolak') => {
    persistApprovalItemByReference(id, 'Pinjaman', {
      status: status === 'Aktif' || status === 'Lunas' ? 'Disetujui' : status === 'Ditolak' ? 'Ditolak' : 'Menunggu',
    });
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  // 5. Performance & KPI
  const saveKPIReview = (kpiData: Omit<EmployeeKPI, 'id' | 'tenantId' | 'evaluatedAt'>) => {
    const evaluatedAt = new Date().toISOString().split('T')[0];
    const newKpi: EmployeeKPI = {
      ...kpiData,
      id: `kpi-${Date.now()}`,
      tenantId: currentTenant.id,
      evaluatedAt,
    };
    setKpis((prev) => {
      const filtered = prev.filter(
        (k) =>
          !(
            k.tenantId === currentTenant.id &&
            k.employeeId === kpiData.employeeId &&
            k.quarter === kpiData.quarter &&
            k.period === kpiData.period
          )
      );
      return [newKpi, ...filtered];
    });
  };

  // 6. Compliance (SP & PHK)
  const issueComplianceAction = (record: {
    employeeId: string;
    level: 'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing' | 'PHK';
    violationReason: string;
    validMonths: number;
  }) => {
    const emp = employees.find((e) => e.id === record.employeeId);
    if (!emp) return;

    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    const validUntilDate = new Date();
    validUntilDate.setMonth(validUntilDate.getMonth() + record.validMonths);
    const validUntil = validUntilDate.toISOString().split('T')[0];

    const letterNumber = generateDocumentNumber(
      'Surat Peringatan',
      complianceRecords.length + 1,
      currentTenant.code
    );

    const newCompliance: ComplianceRecord = {
      id: `comp-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: record.employeeId,
      level: record.level,
      violationReason: record.violationReason,
      letterNumber,
      issueDate,
      validUntil,
      signedBy: currentUser.name,
      status: 'Aktif',
    };

    setComplianceRecords((prev) => [newCompliance, ...prev]);

    if (record.level === 'PHK') {
      updateEmployee(emp.id, { status: 'PHK' });
      initiateOffboarding(emp.id, 'PHK Indisipliner', issueDate, record.violationReason);
    }

    createOfficialDocument({
      type: 'Surat Peringatan',
      title: `Surat Tindakan Disiplin (${record.level}): ${emp.fullName}`,
      targetEmployeeId: emp.id,
      signeeName: currentUser.name,
      signeeRole: 'VP Human Resources',
      contentPreview: `Diberikan sanksi berupa ${record.level} kepada ${emp.fullName} (${emp.nik}) terkait pelanggaran: "${record.violationReason}". Berlaku s/d ${validUntil}.`,
    });
  };

  // 7. Recruitment & Onboarding
  // Splits a (partial) mock JobRequisition into the real columns the
  // backend actually queries on vs. the descriptive text that just rides
  // along in `details` — see mapApiJobRequisitionToMock above for the
  // inverse direction.
  const buildJobRequisitionApiPayload = (req: Partial<JobRequisition>): Partial<ApiJobRequisition> & { entityId?: string } => {
    const {
      officeLocationId, headcount, replacementFor, reason, knockoutCriteria, scoredCriteria, signatories, status,
      reqNumber, position, department, grade, gradeMin, gradeMax, isBudgeted, justification, targetJoinDate,
      reportingToDepartment, reportingToTitle, reportingToEmployeeId, supervisedStaffCount, mainResponsibilities,
      educationLevel, educationMajor, educationMin, minExperience, skills, otherRequirements, requirements,
      requesterName, requesterTitle, approvedBy, approverTitle, approvalDate, approvalNotes,
      retractedAt, retractedReason, retractedBy,
      ...rest
    } = req;
    void rest;
    const details: Record<string, unknown> = {
      reqNumber, position, department, grade, gradeMin, gradeMax, replacementFor, reason, isBudgeted, justification,
      targetJoinDate, reportingToDepartment, reportingToTitle, reportingToEmployeeId, supervisedStaffCount,
      mainResponsibilities, educationLevel, educationMajor, educationMin, minExperience, skills, otherRequirements,
      requirements, requesterName, requesterTitle, approvedBy, approverTitle, approvalDate, approvalNotes,
      retractedAt, retractedReason, retractedBy,
    };
    Object.keys(details).forEach((k) => details[k] === undefined && delete details[k]);
    return {
      officeLocationId,
      headcount,
      knockoutCriteria,
      scoredCriteria,
      signatories,
      status,
      requisitionType: (reason || '').includes('Penggantian') ? 'Penggantian' : 'Baru',
      details,
    };
  };

  const addJobRequisition = async (req: Omit<JobRequisition, 'id' | 'tenantId' | 'createdAt'>) => {
    const payload = buildJobRequisitionApiPayload(req);
    const created = await tenantApi.createJobRequisition({ ...payload, entityId: currentEntity?.id || '' } as Partial<ApiJobRequisition> & { entityId: string });
    setApiJobRequisitions((prev) => [created, ...prev]);
  };

  const updateJobRequisition = async (id: string, updates: Partial<JobRequisition>) => {
    const payload = buildJobRequisitionApiPayload(updates);
    const updated = await tenantApi.updateJobRequisition(id, payload);
    setApiJobRequisitions((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteJobRequisition = (_id: string) => {
    // No DELETE endpoint for job_requisitions — a real FPTK is retracted
    // (status: 'Dicabut (Retracted)'), never hard-deleted, matching how the
    // rest of this module already treats a submitted requisition.
  };

  const buildVacancyApiPayload = (v: Partial<JobVacancy>) => ({
    entityId: currentEntity?.id || '',
    jobRequisitionId: v.jobRequisitionId || undefined,
    title: v.title,
    openings: v.openings,
    status: v.status,
    targetCloseDate: v.targetCloseDate,
    details: v,
  });

  const addVacancy = async (v: Omit<JobVacancy, 'id' | 'tenantId' | 'postedDate'>) => {
    const created = await tenantApi.createJobVacancy(buildVacancyApiPayload(v) as Partial<ApiJobVacancy> & { entityId: string; title: string });
    setApiVacancies((prev) => [created, ...prev]);
  };

  const updateVacancy = (id: string, updates: Partial<JobVacancy>) => {
    const current = vacancies.find((v) => v.id === id);
    if (!current) return;
    const merged = { ...current, ...updates };
    tenantApi
      .updateJobVacancy(id, buildVacancyApiPayload(merged) as Partial<ApiJobVacancy>)
      .then((updated) => setApiVacancies((prev) => prev.map((r) => (r.id === id ? updated : r))));
  };

  const buildCandidateApiPayload = (c: Partial<Candidate>) => ({
    jobVacancyId: c.jobVacancyId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    stage: c.stage,
    aiMatchScore: c.aiMatchScore,
    testScore: c.testScore,
    interviewScore: c.interviewScore,
    offeredSalary: c.offeredSalary,
    details: c,
  });

  const addCandidate = async (c: Omit<Candidate, 'id' | 'tenantId' | 'appliedDate'>) => {
    const created = await tenantApi.createCandidate(buildCandidateApiPayload(c) as Partial<ApiCandidate> & { jobVacancyId: string; name: string; email: string });
    setApiCandidates((prev) => [created, ...prev]);
  };

  const persistCandidateMerge = (id: string, merged: Candidate) => {
    tenantApi
      .updateCandidate(id, buildCandidateApiPayload(merged) as Partial<ApiCandidate>)
      .then((updated) => setApiCandidates((prev) => prev.map((r) => (r.id === id ? updated : r))));
  };

  const updateCandidateStage = (
    id: string,
    stage: Candidate['stage'],
    extra?: Partial<Candidate>
  ) => {
    const current = candidates.find((c) => c.id === id);
    if (!current) return;
    persistCandidateMerge(id, { ...current, stage, ...extra });
  };

  const convertCandidateToEmployee = async (candidateId: string, joinDate: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    const vacancy = vacancies.find((v) => v.id === cand.jobVacancyId);
    const department = vacancy?.department || 'Operations';
    const position = vacancy?.title || 'Associate Staff';
    const employmentType = vacancy?.employmentType || 'Kontrak';

    const docNumber = generateDocumentNumber(
      employmentType === 'Tetap' ? 'PKWTT' : 'PKWT',
      employees.length + 1,
      currentTenant.code
    );

    const newEmp = await addEmployee({
      nik: `${currentTenant.code}-${new Date().getFullYear()}-${String(tenantEmployees.length + 1).padStart(3, '0')}`,
      fullName: cand.name,
      email: cand.email,
      personalEmail: cand.email,
      phone: cand.phone,
      employmentType,
      contractDocNumber: docNumber,
      contractStartDate: joinDate,
      contractEndDate: employmentType === 'Kontrak' ? '2027-10-31' : undefined,
      permanentAppointmentDate: employmentType === 'Tetap' ? joinDate : undefined,
      probationStatus: employmentType === 'Tetap' ? 'Sedang Berjalan' : 'Tanpa Percobaan',
      probationEndDate: employmentType === 'Tetap' ? '2027-01-31' : undefined,
      outsourceVendor: employmentType === 'Outsource' ? 'PT Mitra Prima Solusindo' : undefined,
      department,
      position,
      grade: 'L2',
      joinDate,
      status: 'Aktif',
      remainingLeaveDays: 12,
      nikKtp: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      noKk: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      birthPlace: 'Jakarta',
      birthDate: '1998-05-15',
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      ktpAddress: 'Jl. Jenderal Sudirman No. 10, Jakarta Selatan',
      currentAddress: 'Jl. Jenderal Sudirman No. 10, Jakarta Selatan',
      npwp: '00.000.000.0-000.000',
      ptkp: 'TK/0',
      kppPratama: `KPP Pratama ${currentTenant.city}`,
      bpjsTkNo: `2401${Math.floor(10000000 + Math.random() * 90000000)}`,
      bpjsKesNo: `0001${Math.floor(10000000 + Math.random() * 90000000)}`,
      faskes1Bpjs: `Puskesmas ${currentTenant.city}`,
      bankName: 'BCA',
      bankAccount: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      bankAccountHolder: cand.name,
      basicSalary: cand.offeredSalary || cand.expectedSalary,
      fixedAllowance: 1500000,
      transportAllowance: 800000,
      mealAllowance: 700000,
      positionAllowance: 500000,
      lastEducationDegree: 'S1',
      institution: 'Universitas Indonesia',
      major: 'Manajemen / Teknik',
      graduationYear: 2021,
      familyMembers: [],
      emergencyContacts: [
        {
          id: `emg-${Date.now()}`,
          fullName: 'Keluarga Kontak Darurat',
          relation: 'Orang Tua',
          phone: cand.phone,
          address: 'Jakarta',
        },
      ],
    });

    updateCandidateStage(candidateId, 'Hired', { joinedDate: joinDate });

    // Generate PKWT/PKWTT document
    createOfficialDocument({
      type: employmentType === 'Tetap' ? 'PKWTT' : 'PKWT',
      title: `Surat Perjanjian Kerja (${employmentType}): ${cand.name}`,
      targetEmployeeId: newEmp.id,
      signeeName: currentUser.name,
      signeeRole: 'VP Human Resources',
      contentPreview: `Perjanjian Kerja antara ${currentTenant.name} dengan ${cand.name} sebagai ${position} di departemen ${department}. Mulai bertugas per ${joinDate}.`,
    });
  };

  const toMockCompetencyTestType = (r: ApiCompetencyTestTypeSetting): CompetencyTestTypeSetting => ({
    id: r.id,
    name: r.name,
    category: r.category,
    passingGrade: r.passingGrade,
    durationMinutes: r.durationMinutes,
    method: r.method,
    description: r.description || '',
    weightPercent: r.weightPercent ?? undefined,
    isActive: r.isActive,
  });

  const addCompetencyTestType = async (testType: Omit<CompetencyTestTypeSetting, 'id'>) => {
    const created = await tenantApi.createCompetencyTestType(testType as Omit<ApiCompetencyTestTypeSetting, 'id' | 'tenantId'>);
    setCompetencyTestTypes((prev) => [toMockCompetencyTestType(created), ...prev]);
  };

  const updateCompetencyTestType = async (id: string, updates: Partial<CompetencyTestTypeSetting>) => {
    const updated = await tenantApi.updateCompetencyTestType(id, updates);
    setCompetencyTestTypes((prev) => prev.map((t) => (t.id === id ? toMockCompetencyTestType(updated) : t)));
  };

  const deleteCompetencyTestType = async (id: string) => {
    await tenantApi.deleteCompetencyTestType(id);
    setCompetencyTestTypes((prev) => prev.filter((t) => t.id !== id));
  };

  const resetCompetencyTestTypes = async () => {
    await Promise.all(competencyTestTypes.map((t) => tenantApi.deleteCompetencyTestType(t.id)));
    const created = await Promise.all(
      INITIAL_COMPETENCY_TEST_TYPES.map((t) => {
        const { id, ...rest } = t;
        void id;
        return tenantApi.createCompetencyTestType(rest as Omit<ApiCompetencyTestTypeSetting, 'id' | 'tenantId'>);
      })
    );
    setCompetencyTestTypes(created.map(toMockCompetencyTestType));
  };

  const saveCandidateCompetencyScore = (
    candidateId: string,
    scoreData: Omit<CandidateCompetencyScore, 'id' | 'evaluatedAt'>
  ) => {
    const c = candidates.find((x) => x.id === candidateId);
    if (!c) return;
    const newScore: CandidateCompetencyScore = {
      ...scoreData,
      id: `score-${Date.now()}`,
      evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    const existingScores = c.competencyScores ? [...c.competencyScores] : [];
    const existingIndex = existingScores.findIndex(
      (s) => s.testTypeId === scoreData.testTypeId || s.testTypeName === scoreData.testTypeName
    );
    if (existingIndex >= 0) {
      existingScores[existingIndex] = newScore;
    } else {
      existingScores.push(newScore);
    }

    // Calculate aggregate / average score
    const totalScore = existingScores.reduce((acc, s) => acc + s.score, 0);
    const avgScore = Math.round(totalScore / existingScores.length);
    const allPassed = existingScores.every((s) => s.score >= s.passingGrade);

    persistCandidateMerge(candidateId, {
      ...c,
      competencyScores: existingScores,
      testType: scoreData.testTypeName,
      testScore: avgScore,
      testPassingGrade: scoreData.passingGrade,
      testStatus: allPassed ? 'Lulus' : 'Tidak Lulus',
      testNotes: scoreData.notes || c.testNotes,
    });
  };

  const deleteCandidateCompetencyScore = (candidateId: string, scoreId: string) => {
    const c = candidates.find((x) => x.id === candidateId);
    if (!c || !c.competencyScores) return;
    const updatedScores = c.competencyScores.filter((s) => s.id !== scoreId);
    const avgScore =
      updatedScores.length > 0
        ? Math.round(updatedScores.reduce((acc, s) => acc + s.score, 0) / updatedScores.length)
        : 0;
    const allPassed =
      updatedScores.length > 0
        ? updatedScores.every((s) => s.score >= s.passingGrade)
        : false;
    persistCandidateMerge(candidateId, {
      ...c,
      competencyScores: updatedScores,
      testScore: avgScore,
      testStatus: updatedScores.length > 0 ? (allPassed ? 'Lulus' : 'Tidak Lulus') : 'Belum Ditugaskan',
    });
  };

  const toMockInterviewType = (r: ApiInterviewTypeSetting): InterviewTypeSetting => ({
    id: r.id,
    name: r.name,
    targetRole: r.targetRole || undefined,
    description: r.description || '',
    interviewerRoles: r.interviewerRoles || undefined,
    criteria: r.criteria as InterviewTypeSetting['criteria'],
    isActive: r.isActive,
  });

  const addInterviewType = async (type: Omit<InterviewTypeSetting, 'id'>) => {
    const created = await tenantApi.createInterviewType(type as Omit<ApiInterviewTypeSetting, 'id' | 'tenantId'>);
    setInterviewTypeSettings((prev) => [toMockInterviewType(created), ...prev]);
  };

  const updateInterviewType = async (id: string, updates: Partial<InterviewTypeSetting>) => {
    const updated = await tenantApi.updateInterviewType(id, updates as Partial<ApiInterviewTypeSetting>);
    setInterviewTypeSettings((prev) => prev.map((t) => (t.id === id ? toMockInterviewType(updated) : t)));
  };

  const deleteInterviewType = async (id: string) => {
    await tenantApi.deleteInterviewType(id);
    setInterviewTypeSettings((prev) => prev.filter((t) => t.id !== id));
  };

  const resetInterviewTypes = async () => {
    await Promise.all(interviewTypeSettings.map((t) => tenantApi.deleteInterviewType(t.id)));
    const created = await Promise.all(
      INITIAL_INTERVIEW_TYPES.map((t) => {
        const { id, ...rest } = t;
        void id;
        return tenantApi.createInterviewType(rest as Omit<ApiInterviewTypeSetting, 'id' | 'tenantId'>);
      })
    );
    setInterviewTypeSettings(created.map(toMockInterviewType));
  };

  const saveCandidateInterviewEvaluation = (
    candidateId: string,
    evalData: Omit<CandidateInterviewEvaluation, 'id' | 'evaluatedAt'>
  ) => {
    const c = candidates.find((x) => x.id === candidateId);
    if (!c) return;
    const newEval: CandidateInterviewEvaluation = {
      ...evalData,
      id: `int-eval-${Date.now()}`,
      evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    const existingEvals = c.interviewEvaluations ? [...c.interviewEvaluations] : [];
    const existingIdx = existingEvals.findIndex((e) => e.interviewTypeId === evalData.interviewTypeId);
    if (existingIdx >= 0) {
      existingEvals[existingIdx] = newEval;
    } else {
      existingEvals.push(newEval);
    }

    const totalScore = existingEvals.reduce((acc, e) => acc + e.calculatedScore, 0);
    const avgScore = Math.round(totalScore / existingEvals.length);

    persistCandidateMerge(candidateId, {
      ...c,
      interviewEvaluations: existingEvals,
      interviewTypeId: evalData.interviewTypeId,
      interviewTypeName: evalData.interviewTypeName,
      interviewDate: evalData.interviewDate,
      interviewer: evalData.interviewer,
      interviewers: evalData.interviewers || c.interviewers,
      meetingPlatform: evalData.platform as any,
      meetingLink: evalData.meetingLink,
      interviewScore: avgScore,
      interviewNotes: evalData.notes,
      interviewScorecard: {
        ratings: evalData.scorecardRatings,
        recommendation: evalData.recommendation,
      },
    });
  };

  const deleteCandidateInterviewEvaluation = (candidateId: string, evalId: string) => {
    const c = candidates.find((x) => x.id === candidateId);
    if (!c || !c.interviewEvaluations) return;
    const filtered = c.interviewEvaluations.filter((e) => e.id !== evalId);
    const avgScore =
      filtered.length > 0
        ? Math.round(filtered.reduce((acc, e) => acc + e.calculatedScore, 0) / filtered.length)
        : undefined;
    persistCandidateMerge(candidateId, {
      ...c,
      interviewEvaluations: filtered,
      interviewScore: avgScore,
    });
  };

  // 8. Offboarding
  const initiateOffboarding = (
    employeeId: string,
    separationType: OffboardingRecord['separationType'],
    effectiveDate: string,
    notes: string
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    // Calculate years of service
    const startYear = new Date(emp.joinDate).getFullYear();
    const currentYear = new Date(effectiveDate).getFullYear();
    const serviceYears = Math.max(1, currentYear - startYear);

    const { totalSeverance } = calculateSeverancePay(emp.basicSalary, serviceYears);

    const parklaringNumber = generateDocumentNumber(
      'Parklaring',
      offboardingRecords.length + 1,
      currentTenant.code
    );

    const record: OffboardingRecord = {
      id: `off-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId,
      separationType,
      requestDate: new Date().toISOString().split('T')[0],
      effectiveDate,
      handoverCompleted: false,
      assetReturned: false,
      financeCleared: false,
      severancePay: separationType.includes('PHK') ? totalSeverance : 0,
      parklaringIssued: false,
      parklaringNumber,
      notes,
    };

    setOffboardingRecords((prev) => [record, ...prev]);
  };

  const updateOffboardingChecklist = (
    id: string,
    checklist: Partial<Pick<OffboardingRecord, 'handoverCompleted' | 'assetReturned' | 'financeCleared' | 'parklaringIssued'>>
  ) => {
    setOffboardingRecords((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updated = { ...o, ...checklist };
          if (checklist.assetReturned && !o.assetReturned) {
            setAssets((prevAssets) =>
              prevAssets.map((ast) =>
                ast.assignedToEmployeeId === o.employeeId
                  ? { ...ast, assignedToEmployeeId: undefined, condition: 'Baik' }
                  : ast
              )
            );
          }
          if (checklist.financeCleared && !o.financeCleared) {
            setLoans((prevLoans) =>
              prevLoans.map((ln) =>
                ln.employeeId === o.employeeId && ln.status === 'Aktif'
                  ? { ...ln, remainingAmount: 0, status: 'Lunas' }
                  : ln
              )
            );
          }
          // If parklaring just issued, create document
          if (checklist.parklaringIssued && !o.parklaringIssued) {
            const emp = employees.find((e) => e.id === o.employeeId);
            if (emp) {
              createOfficialDocument({
                type: 'Parklaring',
                title: `Surat Keterangan Pengalaman Kerja (Parklaring): ${emp.fullName}`,
                targetEmployeeId: emp.id,
                signeeName: currentUser.name,
                signeeRole: 'VP Human Resources',
                contentPreview: `Menerangkan bahwa Saudara/i ${emp.fullName} telah bekerja dengan baik di ${currentTenant.name} terhitung sejak ${emp.joinDate} sampai ${o.effectiveDate} dengan jabatan terakhir ${emp.position}.`,
              });
              updateEmployee(emp.id, { status: 'Resign' });
            }
          }
          return updated;
        }
        return o;
      })
    );
  };

  // 9. GA Assets & QR
  const addAsset = (
    assetData: Omit<GAAsset, 'id' | 'tenantId' | 'lastStockOpname' | 'qrPayload'>
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const qrPayload = JSON.stringify({
      code: assetData.assetCode,
      type: 'GA_ASSET',
      tenant: currentTenant.code,
      name: assetData.name,
    });

    const newAsset: GAAsset = {
      ...assetData,
      id: `ast-${Date.now()}`,
      tenantId: currentTenant.id,
      lastStockOpname: today,
      qrPayload,
    };
    setAssets((prev) => [newAsset, ...prev]);
  };

  const updateAsset = (id: string, updates: Partial<GAAsset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const performStockOpname = (assetCode: string, condition: GAAsset['condition']): boolean => {
    const asset = assets.find((a) => a.tenantId === currentTenant.id && a.assetCode === assetCode);
    if (!asset) return false;

    const today = new Date().toISOString().split('T')[0];
    updateAsset(asset.id, {
      condition,
      lastStockOpname: today,
    });
    return true;
  };

  // 10. Procurement
  const addProcurementOrder = (
    orderData: Omit<ProcurementOrder, 'id' | 'tenantId' | 'prNumber' | 'poNumber' | 'status' | 'requestedDate'>
  ) => {
    const count = procurementOrders.length + 1;
    const year = new Date().getFullYear();
    const prNumber = `PR-${year}-${String(count).padStart(3, '0')}`;

    const newOrder: ProcurementOrder = {
      ...orderData,
      id: `pr-${Date.now()}`,
      tenantId: currentTenant.id,
      prNumber,
      poNumber: '',
      status: 'Pengajuan PR',
      requestedDate: new Date().toISOString().split('T')[0],
    };
    setProcurementOrders((prev) => [newOrder, ...prev]);
  };

  const updateProcurementStatus = (
    id: string,
    status: ProcurementOrder['status'],
    poNumber?: string
  ) => {
    setProcurementOrders((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const year = new Date().getFullYear();
          const generatedPO = poNumber || (status === 'PO Terbit' && !p.poNumber ? `PO-${year}-${String(Date.now()).slice(-4)}` : p.poNumber);
          return {
            ...p,
            status,
            poNumber: generatedPO,
          };
        }
        return p;
      })
    );
  };

  // 11. Documents & Digital Signatures
  const createOfficialDocument = (docData: {
    type: OfficialDocument['type'];
    templateId?: string;
    title: string;
    targetEmployeeId: string;
    signeeName: string;
    signeeRole: string;
    contentPreview: string;
    renderedHtml?: string;
    isFromDocxTemplate?: boolean;
    customDocumentNumber?: string;
  }): OfficialDocument => {
    const documentNumber =
      docData.customDocumentNumber ||
      generateDocumentNumber(
        docData.type,
        documents.length + 1,
        currentTenant.code
      );

    const cleanNumber = documentNumber.replace(/[\/\s]/g, '-');
    const hash = Math.random().toString(36).substring(2, 10);
    const qrVerificationUrl = `https://nusahr.enterprise/verify?doc=${cleanNumber}&h=${hash}`;

    const newDoc: OfficialDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      tenantId: currentTenant.id,
      documentNumber,
      issueDate: new Date().toISOString().split('T')[0],
      qrVerificationUrl,
      status: 'Resmi Diterbitkan',
    };

    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  // 12. Migration Wizard Execution
  const executeMigrationImport = (rows: MigrationRowPreview[]) => {
    let successCount = 0;
    let errorCount = 0;

    const newEmps: Omit<Employee, 'id' | 'tenantId'>[] = [];
    rows.forEach((r) => {
      if (!r.isValid) {
        errorCount++;
        return;
      }
      successCount++;
      const isTetap = ((r.status as any) || 'Tetap') === 'Tetap';
      const docType = isTetap ? 'PKWTT' : 'PKWT';
      const docNumber = generateDocumentNumber(
        docType,
        employees.length + newEmps.length + 1,
        currentTenant.code
      );
      const today = new Date().toISOString().split('T')[0];

      newEmps.push({
        nik: r.nik,
        fullName: r.nama,
        email: r.email,
        personalEmail: r.email,
        phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
        employmentType: (r.status as any) || 'Tetap',
        contractDocNumber: docNumber,
        contractStartDate: today,
        contractEndDate: !isTetap ? '2027-10-31' : undefined,
        permanentAppointmentDate: isTetap ? today : undefined,
        probationStatus: isTetap ? 'Lolos' : 'Tanpa Percobaan',
        probationEndDate: isTetap ? today : undefined,
        outsourceVendor: (r.status as any) === 'Outsource' ? 'PT Mitra Prima Solusindo' : undefined,
        department: r.departemen,
        position: r.jabatan,
        grade: 'L3',
        joinDate: today,
        status: 'Aktif',
        remainingLeaveDays: r.saldoCuti || 12,
        nikKtp: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
        noKk: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
        birthPlace: currentTenant.city,
        birthDate: '1995-04-10',
        gender: 'Laki-laki',
        religion: 'Islam',
        maritalStatus: r.ptkp.startsWith('K') ? 'Menikah' : 'Lajang',
        ktpAddress: `Jl. Raya Utama No. 8, ${currentTenant.city}`,
        currentAddress: `Jl. Raya Utama No. 8, ${currentTenant.city}`,
        ptkp: (r.ptkp as any) || 'TK/0',
        npwp: '00.000.000.0-000.000',
        kppPratama: `KPP Pratama ${currentTenant.city}`,
        bpjsTkNo: '24' + Math.floor(1000000000 + Math.random() * 9000000000),
        bpjsKesNo: '0001' + Math.floor(10000000 + Math.random() * 90000000),
        faskes1Bpjs: `Puskesmas ${currentTenant.city}`,
        bankName: 'BCA',
        bankAccount: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        bankAccountHolder: r.nama,
        basicSalary: r.gajiPokok,
        fixedAllowance: Math.round(r.gajiPokok * 0.15),
        transportAllowance: 500000,
        mealAllowance: 500000,
        positionAllowance: 500000,
        lastEducationDegree: 'S1',
        institution: 'Universitas Indonesia',
        major: r.jabatan,
        graduationYear: 2018,
        familyMembers: [],
        emergencyContacts: [
          {
            id: `emg-${Date.now()}`,
            fullName: 'Kontak Darurat Kerabat',
            relation: 'Orang Tua',
            phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
            address: currentTenant.city,
          },
        ],
      });
    });

    if (newEmps.length > 0) {
      // Fired in the background — successCount/errorCount below is pure
      // row validation and can be reported to the wizard immediately.
      Promise.all(newEmps.map((e) => addEmployee(e)));
    }

    return { successCount, errorCount };
  };

  // 13. Onboarding Actions & Checklist Templates — real backend.
  const toMockChecklistTemplate = (r: ApiOnboardingChecklistTemplateItem): OnboardingChecklistTemplateItem => ({
    id: r.id,
    title: r.title,
    category: r.category,
    targetDepartment: r.targetDepartment as OnboardingChecklistTemplateItem['targetDepartment'],
    verificationType: r.verificationType as OnboardingChecklistTemplateItem['verificationType'],
    actionType: (r.actionType || undefined) as OnboardingChecklistTemplateItem['actionType'],
    isMandatory: r.isMandatory,
    description: r.description || undefined,
    subItems: r.subItems,
  });

  const updateOnboardingChecklistTemplates = async (templates: OnboardingChecklistTemplateItem[]) => {
    await Promise.all(onboardingChecklistTemplates.map((t) => tenantApi.deleteOnboardingChecklistTemplate(t.id)));
    const created = await Promise.all(
      templates.map((t) => {
        const { id, ...rest } = t;
        void id;
        return tenantApi.createOnboardingChecklistTemplate(rest as Omit<ApiOnboardingChecklistTemplateItem, 'id' | 'tenantId'>);
      })
    );
    setOnboardingChecklistTemplates(created.map(toMockChecklistTemplate));
    logAuditAction('Onboarding Settings', 'UPDATE_TEMPLATES', 'templates', `Memperbarui ${templates.length} template checklist onboarding`);
  };

  const addChecklistTemplateItem = async (item: Omit<OnboardingChecklistTemplateItem, 'id'>) => {
    const created = await tenantApi.createOnboardingChecklistTemplate(item as Omit<ApiOnboardingChecklistTemplateItem, 'id' | 'tenantId'>);
    const newItem = toMockChecklistTemplate(created);
    setOnboardingChecklistTemplates((prev) => [...prev, newItem]);
    logAuditAction('Onboarding Settings', 'ADD_TEMPLATE_ITEM', newItem.id, `Menambahkan checklist: ${newItem.title}`);
  };

  const removeChecklistTemplateItem = async (id: string) => {
    await tenantApi.deleteOnboardingChecklistTemplate(id);
    setOnboardingChecklistTemplates((prev) => prev.filter((t) => t.id !== id));
    logAuditAction('Onboarding Settings', 'DELETE_TEMPLATE_ITEM', id, `Menghapus template checklist ID: ${id}`);
  };

  const buildOnboardingApiPayload = (p: Partial<OnboardingProcess>) => ({
    entityId: currentEntity?.id || '',
    type: p.type,
    candidateId: p.candidateId,
    employeeName: p.employeeName,
    email: p.email,
    phone: p.phone,
    position: p.position,
    joinDate: p.joinDate,
    basicSalary: p.basicSalary,
    contractDocNumber: p.contractDocNumber,
    status: p.status,
    createdEmployeeId: p.createdEmployeeId,
    tasks: p.tasks,
    details: p,
  });

  const persistOnboardingMerge = (id: string, merged: OnboardingProcess) => {
    tenantApi
      .updateOnboardingProcess(id, buildOnboardingApiPayload(merged) as Partial<ApiOnboardingProcess>)
      .then((updated) => setApiOnboardingProcesses((prev) => prev.map((r) => (r.id === id ? updated : r))));
  };

  const addOnboardingProcess = (
    data: Omit<OnboardingProcess, 'id' | 'tenantId' | 'status'>
  ): OnboardingProcess => {
    // Generate tasks from templates if none provided
    const tasks =
      data.tasks && data.tasks.length > 0
        ? data.tasks
        : onboardingChecklistTemplates.map((tmpl) => ({
            id: `t-${tmpl.id}-${Date.now()}`,
            title: tmpl.title,
            category: tmpl.category as any,
            targetDepartment: tmpl.targetDepartment,
            verificationType: tmpl.verificationType,
            actionType: tmpl.actionType,
            isMandatory: tmpl.isMandatory,
            isCompleted: false,
            assignedRole: tmpl.targetDepartment === 'GA' ? 'ga_admin' : tmpl.targetDepartment === 'IT' ? 'it_admin' : 'hr_admin',
            subItems: tmpl.subItems && tmpl.subItems.length > 0
              ? tmpl.subItems.map((s, idx) => ({ id: `sub-${idx}-${Date.now()}`, title: s, isCompleted: false }))
              : undefined,
          }));

    const newProcess: OnboardingProcess = {
      ...data,
      id: `onb-${Date.now()}`,
      tenantId: currentTenant.id,
      tasks,
      status: 'In Progress',
    };
    const payload = buildOnboardingApiPayload(newProcess);
    tenantApi.createOnboardingProcess(payload as Partial<ApiOnboardingProcess> & { entityId: string; employeeName: string }).then((created) => {
      setApiOnboardingProcesses((prev) => [created, ...prev]);
    });
    return newProcess;
  };

  const updateOnboardingTask = (
    processId: string,
    taskId: string,
    isCompleted: boolean,
    actionPayload?: any,
    subItems?: OnboardingSubItem[]
  ) => {
    const p = onboardingProcesses.find((x) => x.id === processId);
    if (!p) return;
    const updatedTasks = p.tasks.map((t) => {
      if (t.id !== taskId) return t;
      let finalSubItems = subItems !== undefined ? subItems : t.subItems;
      if (subItems === undefined && t.subItems && t.subItems.length > 0) {
        finalSubItems = t.subItems.map((s) => ({ ...s, isCompleted }));
      }
      return {
        ...t,
        isCompleted,
        completedAt: isCompleted ? (t.completedAt || new Date().toISOString().split('T')[0]) : undefined,
        actionPayload: actionPayload ? { ...t.actionPayload, ...actionPayload } : t.actionPayload,
        subItems: finalSubItems,
      };
    });
    const mandatoryCompleted = updatedTasks
      .filter((t) => t.isMandatory !== false)
      .every((t) => t.isCompleted);
    persistOnboardingMerge(processId, {
      ...p,
      tasks: updatedTasks,
      status: mandatoryCompleted ? 'Completed' : 'In Progress',
    });
  };

  const toggleOnboardingSubItem = (
    processId: string,
    taskId: string,
    subItemId: string
  ) => {
    const p = onboardingProcesses.find((x) => x.id === processId);
    if (!p) return;
    const updatedTasks = p.tasks.map((t) => {
      if (t.id !== taskId || !t.subItems) return t;
      const updatedSubItems = t.subItems.map((s) =>
        s.id === subItemId ? { ...s, isCompleted: !s.isCompleted } : s
      );
      const allDone = updatedSubItems.length > 0 && updatedSubItems.every((s) => s.isCompleted);
      return {
        ...t,
        subItems: updatedSubItems,
        isCompleted: allDone,
        completedAt: allDone ? (t.completedAt || new Date().toISOString().split('T')[0]) : undefined,
      };
    });
    const mandatoryCompleted = updatedTasks
      .filter((t) => t.isMandatory !== false)
      .every((t) => t.isCompleted);
    persistOnboardingMerge(processId, {
      ...p,
      tasks: updatedTasks,
      status: mandatoryCompleted ? 'Completed' : 'In Progress',
    });
  };

  const completeOnboardingProcess = async (processId: string): Promise<Employee | null> => {
    const process = onboardingProcesses.find((p) => p.id === processId);
    if (!process) return null;

    // If employee already linked or exists, just mark completed
    if (process.createdEmployeeId) {
      const existing = employees.find((e) => e.id === process.createdEmployeeId);
      if (existing) {
        persistOnboardingMerge(processId, { ...process, status: 'Completed', officialNik: existing.nik });
        return existing;
      }
    }

    const existingByName = employees.find(
      (e) => e.fullName.toLowerCase() === process.employeeName.toLowerCase()
    );
    if (existingByName) {
      persistOnboardingMerge(processId, { ...process, status: 'Completed', createdEmployeeId: existingByName.id, officialNik: existingByName.nik });
      return existingByName;
    }

    const seq = employees.length + 1;
    const isTetap = process.employmentType === 'Tetap';
    const code = currentTenant.code;
    const docNumber =
      process.contractDocNumber ||
      `${String(seq).padStart(3, '0')}/HRD-${isTetap ? 'SK-TETAP' : 'PKWT'}/${code}/X/2026`;

    const newEmp = await addEmployee({
      nik: `${code}-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`,
      fullName: process.employeeName,
      email: process.email,
      personalEmail: process.email,
      phone: process.phone,
      employmentType: process.employmentType,
      contractDocNumber: docNumber,
      contractStartDate: process.joinDate,
      contractEndDate: !isTetap ? '2027-10-31' : undefined,
      permanentAppointmentDate: isTetap ? process.joinDate : undefined,
      probationStatus: isTetap ? 'Sedang Berjalan' : 'Tanpa Percobaan',
      probationEndDate: isTetap ? '2027-01-31' : undefined,
      department: process.department,
      position: process.position,
      grade: 'L3',
      joinDate: process.joinDate,
      status: 'Aktif',
      remainingLeaveDays: 12,
      nikKtp: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      noKk: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      birthPlace: currentTenant.city,
      birthDate: '1996-05-15',
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      ktpAddress: `Jl. Melati No. 15, ${currentTenant.city}`,
      currentAddress: `Jl. Melati No. 15, ${currentTenant.city}`,
      npwp: '01.234.567.8-011.000',
      ptkp: 'TK/0',
      kppPratama: `KPP Pratama ${currentTenant.city}`,
      bpjsTkNo: '24' + Math.floor(1000000000 + Math.random() * 9000000000),
      bpjsKesNo: '0001' + Math.floor(10000000 + Math.random() * 90000000),
      faskes1Bpjs: `Puskesmas ${currentTenant.city}`,
      bankName: 'BCA',
      bankAccount: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      bankAccountHolder: process.employeeName,
      basicSalary: process.basicSalary,
      fixedAllowance: Math.round(process.basicSalary * 0.15),
      transportAllowance: 800000,
      mealAllowance: 700000,
      positionAllowance: 500000,
      lastEducationDegree: 'S1',
      institution: 'Universitas Indonesia',
      major: process.position,
      graduationYear: 2020,
      familyMembers: [],
      emergencyContacts: [
        {
          id: `emg-${Date.now()}`,
          fullName: 'Kontak Darurat Utama',
          relation: 'Orang Tua',
          phone: process.phone,
          address: currentTenant.city,
        },
      ],
    });

    persistOnboardingMerge(processId, { ...process, status: 'Completed', createdEmployeeId: newEmp.id, officialNik: newEmp.nik });

    return newEmp;
  };

  const updateOnboardingProcess = (processId: string, updates: Partial<OnboardingProcess>) => {
    const p = onboardingProcesses.find((x) => x.id === processId);
    if (!p) return;
    persistOnboardingMerge(processId, { ...p, ...updates });
  };

  const cancelOnboardingProcess = (
    processId: string,
    reason: string,
    actionType: 'talent_pool' | 'delete_all'
  ) => {
    const process = onboardingProcesses.find((p) => p.id === processId);
    if (!process) return;

    // 1. Bersihkan seluruh data karyawan di Management Karyawan jika sudah terbuat/tertaut
    if (process.createdEmployeeId) {
      deleteEmployee(process.createdEmployeeId);
    }
    employees
      .filter(
        (e) =>
          e.id !== process.createdEmployeeId &&
          e.fullName.toLowerCase() === process.employeeName.toLowerCase() &&
          (e.email.toLowerCase() === process.email.toLowerCase() || e.position === process.position)
      )
      .forEach((e) => deleteEmployee(e.id));

    // 2. Tindak lanjut data pelamar / Talent Pool
    const cand = process.candidateId ? candidates.find((c) => c.id === process.candidateId) : undefined;
    if (cand) {
      if (actionType === 'talent_pool') {
        persistCandidateMerge(cand.id, {
          ...cand,
          stage: 'Disqualified',
          disqualificationReason: `Batal Onboarding: ${reason}`,
          isTalentPool: true,
          talentPoolNotes: `Batal Onboarding: ${reason} (Mulai bertugas awal: ${process.joinDate})`,
        } as unknown as Candidate);
      } else {
        persistCandidateMerge(cand.id, {
          ...cand,
          stage: 'Disqualified',
          disqualificationReason: `Batal Onboarding (Dihapus): ${reason}`,
          isTalentPool: false,
        } as unknown as Candidate);
      }
    }

    // 3. Hapus proses onboarding dari daftar aktif
    tenantApi.deleteOnboardingProcess(processId).then(() => {
      setApiOnboardingProcesses((prev) => prev.filter((p) => p.id !== processId));
    });
  };

  // 14. Shifts & Roaster Actions — real backend.
  const addShiftSwapRequest = (swap: Omit<ShiftSwapRequest, 'id' | 'tenantId' | 'status'>) => {
    tenantApi.createShiftSwapRequest({ ...swap, status: 'Menunggu' } as unknown as Omit<ApiShiftSwapRequest, 'id' | 'tenantId'>).then((created) => {
      const newSwap = created as unknown as ShiftSwapRequest;
      setShiftSwaps((prev) => [newSwap, ...prev]);

      // Add to approval hub
      const requester = employees.find((e) => e.id === swap.requesterId);
      createApprovalItem({
        category: 'Tukar Shift',
        referenceId: newSwap.id,
        title: `Pengajuan Tukar Shift: ${requester?.fullName || 'Karyawan'}`,
        requesterId: swap.requesterId,
        department: requester?.department || 'Operasional',
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        level: 1,
        totalLevels: 1,
        assignedApproverRole: 'manager',
        status: 'Menunggu',
        notes: swap.reason,
      });
    });
  };

  const reviewShiftSwapRequest = (id: string, approved: boolean) => {
    const swap = shiftSwaps.find((s) => s.id === id);
    tenantApi.updateShiftSwapRequest(id, { status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name }).then((updated) => {
      setShiftSwaps((prev) => prev.map((s) => (s.id === id ? (updated as unknown as ShiftSwapRequest) : s)));
    });
    persistApprovalItemByReference(id, 'Tukar Shift', { status: approved ? 'Disetujui' : 'Ditolak' });
    // Tukar shift disetujui -> roster kedua karyawan ikut ditukar
    if (approved && swap && swap.status === 'Menunggu') {
      const findEntry = (empId: string, date: string) =>
        schedules.find((p) => p.tenantId === swap.tenantId && p.employeeId === empId && p.date === date);
      const a = findEntry(swap.requesterId, swap.requestDate);
      const b = findEntry(swap.targetEmployeeId, swap.targetDate);
      if (a && b) {
        tenantApi.updateEmployeeSchedule(a.id, { shiftId: b.shiftId }).then((u) => setSchedules((prev) => prev.map((s) => (s.id === a.id ? (u as unknown as EmployeeSchedule) : s))));
        tenantApi.updateEmployeeSchedule(b.id, { shiftId: a.shiftId }).then((u) => setSchedules((prev) => prev.map((s) => (s.id === b.id ? (u as unknown as EmployeeSchedule) : s))));
      } else if (a && !b) {
        tenantApi.createEmployeeSchedule({ employeeId: swap.targetEmployeeId, date: swap.targetDate, shiftId: a.shiftId }).then((c) => setSchedules((prev) => [c as unknown as EmployeeSchedule, ...prev]));
        tenantApi.deleteEmployeeSchedule(a.id).then(() => setSchedules((prev) => prev.filter((s) => s.id !== a.id)));
      } else if (b && !a) {
        tenantApi.createEmployeeSchedule({ employeeId: swap.requesterId, date: swap.requestDate, shiftId: b.shiftId }).then((c) => setSchedules((prev) => [c as unknown as EmployeeSchedule, ...prev]));
        tenantApi.deleteEmployeeSchedule(b.id).then(() => setSchedules((prev) => prev.filter((s) => s.id !== b.id)));
      }
    }
  };

  // Master shift & roster
  const addShift = (shift: Omit<WorkShift, 'id' | 'tenantId'>) => {
    tenantApi.createWorkShift(shift as unknown as Omit<ApiWorkShift, 'id' | 'tenantId'>).then((created) => {
      setShifts((prev) => [...prev, created as unknown as WorkShift]);
    });
  };

  const updateShift = (id: string, updates: Partial<WorkShift>) => {
    tenantApi.updateWorkShift(id, updates as Partial<ApiWorkShift>).then((updated) => {
      setShifts((prev) => prev.map((s) => (s.id === id ? (updated as unknown as WorkShift) : s)));
    });
  };

  const deleteShift = (id: string) => {
    tenantApi.deleteWorkShift(id).then(() => {
      setShifts((prev) => prev.filter((s) => s.id !== id));
      setSchedules((prev) => prev.filter((s) => s.shiftId !== id));
    });
  };

  // shiftId null = hapus entri roster pada tanggal tersebut
  const upsertSchedules = (items: { employeeId: string; date: string; shiftId: string | null }[]) => {
    const toCreate: { employeeId: string; date: string; shiftId: string }[] = [];
    items.forEach((it) => {
      const existing = schedules.find((s) => s.employeeId === it.employeeId && s.date === it.date);
      if (it.shiftId === null) {
        if (existing) {
          tenantApi.deleteEmployeeSchedule(existing.id).then(() => setSchedules((prev) => prev.filter((s) => s.id !== existing.id)));
        }
      } else if (existing) {
        tenantApi.updateEmployeeSchedule(existing.id, { shiftId: it.shiftId }).then((u) => setSchedules((prev) => prev.map((s) => (s.id === existing.id ? (u as unknown as EmployeeSchedule) : s))));
      } else {
        toCreate.push({ employeeId: it.employeeId, date: it.date, shiftId: it.shiftId });
      }
    });
    if (toCreate.length > 0) {
      tenantApi.bulkCreateEmployeeSchedules(toCreate).then((created) => {
        setSchedules((prev) => [...(created as unknown as EmployeeSchedule[]), ...prev]);
      });
    }
  };

  const clearSchedules = (employeeIds: string[], dateFrom: string, dateTo: string) => {
    const toDelete = schedules.filter(
      (p) => p.tenantId === currentTenant.id && employeeIds.includes(p.employeeId) && p.date >= dateFrom && p.date <= dateTo
    );
    const deleteIds = new Set(toDelete.map((p) => p.id));
    setSchedules((prev) => prev.filter((p) => !deleteIds.has(p.id)));
    toDelete.forEach((p) => {
      tenantApi.deleteEmployeeSchedule(p.id).catch(() => {});
    });
  };

  // 15. Attendance Corrections Actions — real backend.
  const submitAttendanceCorrection = (req: Omit<AttendanceCorrectionRequest, 'id' | 'tenantId' | 'status'>) => {
    tenantApi.createAttendanceCorrection({ ...req, status: 'Menunggu' } as unknown as Omit<ApiAttendanceCorrectionRequest, 'id' | 'tenantId'>).then((created) => {
      const newReq = created as unknown as AttendanceCorrectionRequest;
      setAttendanceCorrections((prev) => [newReq, ...prev]);

      const requester = employees.find((e) => e.id === req.employeeId);
      createApprovalItem({
        category: 'Perbaikan Presensi',
        referenceId: newReq.id,
        title: `Koreksi Presensi (${req.type}) - ${requester?.fullName || 'Karyawan'}`,
        requesterId: req.employeeId,
        department: requester?.department || 'Operasional',
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        level: 1,
        totalLevels: 1,
        assignedApproverRole: 'hr_admin',
        status: 'Menunggu',
        notes: req.reason,
      });
    });
  };

  const reviewAttendanceCorrection = (id: string, approved: boolean) => {
    const corr = attendanceCorrections.find((c) => c.id === id);
    if (approved && corr) {
      const existing = attendance.find((a) => a.employeeId === corr.employeeId && a.date === corr.date);
      persistAttendanceUpsert(
        existing
          ? {
              ...existing,
              clockIn: corr.proposedClockIn || existing.clockIn,
              clockOut: corr.proposedClockOut || existing.clockOut,
              status: 'Hadir',
              lateMinutes: 0,
              notes: `Koreksi Presensi (${corr.type}) disetujui: ${corr.reason}`,
            }
          : {
              employeeId: corr.employeeId,
              date: corr.date,
              clockIn: corr.proposedClockIn || '08:00',
              clockOut: corr.proposedClockOut || '17:00',
              status: 'Hadir',
              lateMinutes: 0,
              overtimeHours: 0,
              notes: `Koreksi Presensi (${corr.type}) disetujui: ${corr.reason}`,
            }
      );
    }
    tenantApi.updateAttendanceCorrection(id, { status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name }).then((updated) => {
      setAttendanceCorrections((prev) => prev.map((c) => (c.id === id ? (updated as unknown as AttendanceCorrectionRequest) : c)));
    });
    persistApprovalItemByReference(id, 'Perbaikan Presensi', { status: approved ? 'Disetujui' : 'Ditolak' });
  };

  // 16. Business Trips Actions
  const submitBusinessTrip = (trip: Omit<BusinessTripRequest, 'id' | 'tenantId' | 'tripNumber' | 'status'>) => {
    const seq = businessTrips.length + 1;
    const tripNumber = `${String(seq).padStart(3, '0')}/SPPD-HC/${currentTenant.code}/X/2026`;
    const newTrip: BusinessTripRequest = {
      ...trip,
      id: `trip-${Date.now()}`,
      tenantId: currentTenant.id,
      tripNumber,
      status: 'Menunggu Approval',
    };
    setBusinessTrips((prev) => [newTrip, ...prev]);

    const requester = employees.find((e) => e.id === trip.employeeId);
    createApprovalItem({
      category: 'Perjalanan Dinas',
      referenceId: newTrip.id,
      title: `SPPD ke ${trip.destinationCity} (${trip.totalDays} Hari) - ${requester?.fullName || 'Karyawan'}`,
      requesterId: trip.employeeId,
      department: requester?.department || 'General',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
      level: 1,
      totalLevels: 2,
      assignedApproverRole: 'manager',
      status: 'Menunggu',
      amount: trip.estimatedCost,
      notes: trip.purpose,
    });
  };

  const reviewBusinessTrip = (id: string, status: BusinessTripRequest['status']) => {
    setBusinessTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, approvedBy: currentUser.name } : t))
    );
    persistApprovalItemByReference(id, 'Perjalanan Dinas', { status: status === 'Disetujui Atasan' || status === 'Disetujui Finance' ? 'Disetujui' : 'Ditolak' });
  };

  // 17. Multi-tier Approval Center Actions
  const reviewApprovalItem = (id: string, approved: boolean, notes?: string) => {
    const item = approvalItems.find((a) => a.id === id);
    if (!item) return;

    if (approved) {
      if (item.level < item.totalLevels) {
        // Advance to next level! (FR-2.4 & Catalog Bug #7)
        const nextLevel = item.level + 1;
        const nextRole = nextLevel === 2 ? 'director' : 'super_admin';
        persistApprovalItemUpdate(id, {
          level: nextLevel,
          assignedApproverRole: nextRole,
          notes: notes ? `${item.notes || ''} [L${item.level}: ${notes}]` : item.notes,
        });
        logAuditAction('Approval Center', 'LEVEL_UP', id, `Approval level ${item.level} disetujui, lanjut ke level ${nextLevel}`);
        return;
      }

      // Final Level Approved!
      persistApprovalItemUpdate(id, { status: 'Disetujui', notes: notes ? `${item.notes || ''} [Final: ${notes}]` : item.notes });

      // Category Handler Registry
      if (item.category === 'Cuti') {
        reviewLeaveRequest(item.referenceId, true);
        const emp = employees.find((e) => e.id === item.requesterId);
        if (emp) {
          createOfficialDocument({
            type: 'Surat Keputusan Cuti',
            title: `Surat Keterangan Hak Cuti: ${emp.fullName}`,
            targetEmployeeId: emp.id,
            signeeName: currentUser.name,
            signeeRole: 'VP Human Resources',
            contentPreview: `Menerangkan bahwa permohonan cuti Saudara/i ${emp.fullName} telah disetujui secara resmi.`,
          });
        }
      } else if (item.category === 'Pinjaman') {
        updateLoanStatus(item.referenceId, 'Aktif');
      } else if (item.category === 'Perbaikan Presensi') {
        reviewAttendanceCorrection(item.referenceId, true);
      } else if (item.category === 'Tukar Shift') {
        reviewShiftSwapRequest(item.referenceId, true);
      } else if (item.category === 'Perjalanan Dinas') {
        reviewBusinessTrip(item.referenceId, 'Disetujui Finance');
      } else if (item.category === 'Procurement PR') {
        updateProcurementStatus(item.referenceId, 'PO Terbit');
      } else if (item.category === 'Promosi/Personalia') {
        approvePersonaliaRequest(item.referenceId);
      } else if (item.category === 'Lembur') {
        reviewOvertimeRequest(item.referenceId, true);
      } else if (item.category === 'Reimbursement') {
        reviewReimbursementClaim(item.referenceId, true, notes);
      }
      logAuditAction('Approval Center', 'APPROVE_FINAL', id, `Persetujuan final selesai untuk kategori ${item.category}`);
    } else {
      persistApprovalItemUpdate(id, { status: 'Ditolak', notes: notes || item.notes });
      if (item.category === 'Cuti') {
        reviewLeaveRequest(item.referenceId, false);
      } else if (item.category === 'Pinjaman') {
        updateLoanStatus(item.referenceId, 'Ditolak');
      } else if (item.category === 'Perbaikan Presensi') {
        reviewAttendanceCorrection(item.referenceId, false);
      } else if (item.category === 'Tukar Shift') {
        reviewShiftSwapRequest(item.referenceId, false);
      } else if (item.category === 'Perjalanan Dinas') {
        reviewBusinessTrip(item.referenceId, 'Ditolak');
      } else if (item.category === 'Procurement PR') {
        updateProcurementStatus(item.referenceId, 'Pengajuan PR');
      } else if (item.category === 'Promosi/Personalia') {
        rejectPersonaliaRequest(item.referenceId);
      } else if (item.category === 'Lembur') {
        reviewOvertimeRequest(item.referenceId, false);
      } else if (item.category === 'Reimbursement') {
        reviewReimbursementClaim(item.referenceId, false, notes);
      }
      logAuditAction('Approval Center', 'REJECT', id, `Ditolak untuk kategori ${item.category}`);
    }
  };

  const setApprovalDelegation = (delegation: Omit<ApprovalDelegation, 'id' | 'tenantId'>) => {
    tenantApi.createApprovalDelegation(delegation as unknown as Omit<ApiApprovalDelegation, 'id' | 'tenantId'>).then((created) => {
      setApprovalDelegations((prev) => [created as unknown as ApprovalDelegation, ...prev]);
    });
  };

  // 18. Vendors Actions
  const addVendor = (vendor: Omit<Vendor, 'id' | 'tenantId'>) => {
    const newVendor: Vendor = {
      ...vendor,
      id: `vnd-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setVendors((prev) => [newVendor, ...prev]);
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  // 19. GA Maintenance & Relocations Actions
  const addMaintenanceTicket = (
    ticket: Omit<AssetMaintenanceTicket, 'id' | 'tenantId' | 'ticketNumber' | 'reportedAt' | 'status'>
  ) => {
    const seq = assetMaintenanceTickets.length + 1;
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newTicket: AssetMaintenanceTicket = {
      ...ticket,
      id: `tkt-${Date.now()}`,
      tenantId: currentTenant.id,
      ticketNumber,
      reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Tiket Dibuka',
    };
    setAssetMaintenanceTickets((prev) => [newTicket, ...prev]);
  };

  const updateMaintenanceTicket = (
    id: string,
    status: AssetMaintenanceTicket['status'],
    resolutionNotes?: string,
    cost?: number
  ) => {
    setAssetMaintenanceTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              resolutionNotes: resolutionNotes || t.resolutionNotes,
              cost: cost !== undefined ? cost : t.cost,
            }
          : t
      )
    );
  };

  const addAssetRelocation = (relocation: Omit<AssetRelocationLog, 'id' | 'tenantId' | 'relocationDate'>) => {
    const newRelocation: AssetRelocationLog = {
      ...relocation,
      id: `reloc-${Date.now()}`,
      tenantId: currentTenant.id,
      relocationDate: new Date().toISOString().split('T')[0],
    };
    setAssetRelocations((prev) => [newRelocation, ...prev]);

    const targetAsset = assets.find((a) => a.assetCode === relocation.assetCode);
    if (targetAsset) {
      updateAsset(targetAsset.id, {
        building: relocation.toBuilding,
        room: relocation.toRoom,
        assignedToEmployeeId: relocation.toEmployeeId,
      });
    }

    createOfficialDocument({
      type: 'BAST Aset',
      title: `Berita Acara Serah Terima Aset: ${relocation.assetName}`,
      targetEmployeeId: relocation.toEmployeeId || 'emp-3',
      signeeName: currentUser.name,
      signeeRole: 'GA Manager',
      contentPreview: `BAST mutasi aset ${relocation.assetName} (${relocation.assetCode}) ke ${relocation.toBuilding} ${relocation.toRoom}.`,
    });
  };

  // 20. Document Templates
  const addDocumentTemplate = (
    templateData: Omit<DocumentTemplateConfig, 'id' | 'tenantId'>
  ): DocumentTemplateConfig => {
    const newTmpl: DocumentTemplateConfig = {
      ...templateData,
      id: `tmpl-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setDocumentTemplates((prev) => [newTmpl, ...prev]);
    return newTmpl;
  };

  const updateDocumentTemplate = (id: string, updates: Partial<DocumentTemplateConfig>) => {
    setDocumentTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteDocumentTemplate = (id: string) => {
    setDocumentTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // 21. Module Settings
  const updateModuleSettings = (moduleKey: keyof ModuleSettingsConfig, updates: any) => {
    const merged = { ...moduleSettings[moduleKey], ...updates };
    setModuleSettings((prev) => ({ ...prev, [moduleKey]: merged }));
    tenantApi.updateModuleSettings(moduleKey as string, merged);
  };

  // 35. Audit Log Action
  const logAuditAction = (module: string, action: string, recordId: string, changesSummary: string, details?: any[]) => {
    const entry: AuditLogEntry = {
      id: `adt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: currentTenant.id,
      entityId: currentEntityId,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      module,
      action,
      recordId,
      changesSummary,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const addUser = async (userData: Omit<UserAccount, 'id' | 'tenantId'>, password: string) => {
    try {
      const created = await tenantApi.createUser({ name: userData.name, email: userData.email, password });
      setApiUsers((prev) => [created, ...prev]);
      logAuditAction('RBAC User', 'ADD_USER', created.id, `Pendaftaran user baru: ${created.name} (${created.email})`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menambahkan user');
    }
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    try {
      await tenantApi.deleteUser(id);
      setApiUsers((prev) => prev.filter((u) => u.id !== id));
      if (target) logAuditAction('RBAC User', 'DELETE_USER', id, `Menghapus akun user ${target.name} (${target.email})`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menghapus user');
    }
  };

  const getRolePermission = (module: string, roleKey: string): OperationPermissions => {
    const key = `${module}__${roleKey}`;
    if (rolePermissions[key]) {
      return rolePermissions[key];
    }
    if (INITIAL_ROLE_PERMISSIONS[key]) {
      return INITIAL_ROLE_PERMISSIONS[key];
    }
    if (roleKey === 'super_admin') {
      return { view: true, create: true, edit: true, delete: true, approve: true, export: true };
    }
    return { view: false, create: false, edit: false, delete: false, approve: false, export: false };
  };

  const hasPermission = (module: string, roleKey: string, op: keyof OperationPermissions): boolean => {
    return !!getRolePermission(module, roleKey)[op];
  };

  const addRole = (newRole: RoleDefinition, copyFrom?: string) => {
    setRoles((prev) => [...prev, newRole]);
    setRolePermissions((prev) => {
      const next = { ...prev };
      const systemModules = [
        'employees', 'personalia', 'attendance', 'trips', 'payroll',
        'loans', 'approvals', 'kpi', 'compliance', 'recruitment',
        'offboarding', 'assets', 'procurement', 'documents', 'audit_trail', 'calendar'
      ];
      systemModules.forEach((modId) => {
        const targetKey = `${modId}__${newRole.id}`;
        if (copyFrom) {
          const source = prev[`${modId}__${copyFrom}`] || INITIAL_ROLE_PERMISSIONS[`${modId}__${copyFrom}`];
          next[targetKey] = source
            ? { ...source }
            : { view: false, create: false, edit: false, delete: false, approve: false, export: false };
        } else {
          next[targetKey] = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
        }
      });
      return next;
    });
    logAuditAction('RBAC Role', 'ADD_ROLE', newRole.id, `Menambahkan jenis role baru: "${newRole.label}" (key: ${newRole.id})`);
  };

  const deleteRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    logAuditAction('RBAC Role', 'DELETE_ROLE', id, `Menghapus role kustom: ${id}`);
  };

  const updateRolePermission = (module: string, roleKey: string, op: keyof OperationPermissions, allowed: boolean) => {
    const key = `${module}__${roleKey}`;
    setRolePermissions((prev) => {
      const current = prev[key] || getRolePermission(module, roleKey);
      const updated = { ...current, [op]: allowed };
      if (!updated.view && op === 'view') {
        updated.create = false;
        updated.edit = false;
        updated.delete = false;
        updated.approve = false;
        updated.export = false;
      }
      return { ...prev, [key]: updated };
    });
    logAuditAction('RBAC Permission', 'UPDATE_PERMISSION', key, `Update izin [${op.toUpperCase()}=${allowed}] untuk role ${roleKey} di modul ${module}`);
  };

  // 22. Entity Handlers — backed by the real /api/tenant/entities endpoints.
  const addEntity = async (
    entityData: Omit<CompanyEntity, 'id' | 'tenantId'>,
    admin?: { name: string; email: string; password: string }
  ) => {
    try {
      const created = await tenantApi.createEntity({
        name: entityData.name,
        code: entityData.code,
        ...(entityData.parentEntityId ? { parentEntityId: entityData.parentEntityId } : {}),
        relationType: entityData.relationType,
        address: entityData.address || null,
        city: entityData.city || null,
        npwp: entityData.npwp || null,
        nikPattern: entityData.nikPattern || null,
        followParentNikPattern: entityData.nikPatternFollowsParent ?? true,
        docPrefix: entityData.docPrefix || null,
        status: entityData.status,
        useDepartmentLevel: entityData.useDepartmentLevel,
        ...(admin ? { admin } : {}),
      });
      setApiEntities((prev) => [...prev, created]);
      logAuditAction('Struktur Entitas', 'TAMBAH_ENTITAS', created.id, `Menambahkan entitas: ${created.name}`);
      if (created.admin) {
        logAuditAction('Struktur Entitas', 'TAMBAH_ADMIN_ENTITAS', created.id, `Membuat akun admin "${created.admin.email}" untuk entitas ${created.name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan entitas';
      throw new Error(message);
    }
  };

  const updateEntity = (id: string, updates: Partial<CompanyEntity>) => {
    tenantApi
      .updateEntity(id, {
        name: updates.name,
        relationType: updates.relationType,
        address: updates.address,
        city: updates.city,
        npwp: updates.npwp,
        nikPattern: updates.nikPattern,
        followParentNikPattern: updates.nikPatternFollowsParent,
        docPrefix: updates.docPrefix,
        status: updates.status,
        useDepartmentLevel: updates.useDepartmentLevel,
        isGovernanceLocked: updates.isGovernanceLocked,
        documentLogoUrl: updates.documentLogoUrl,
        appFaviconUrl: updates.appFaviconUrl,
      })
      .then((updated) => {
        setApiEntities((prev) => prev.map((e) => (e.id === id ? updated : e)));
        logAuditAction('Struktur Entitas', 'UPDATE_ENTITAS', id, `Memperbarui konfigurasi entitas ${id}`);
      })
      .catch((err) => console.error('Gagal memperbarui entitas:', err));
  };

  const deleteEntity = (id: string) => {
    // Backend tidak menyediakan hard-delete entitas (struktur bersejarah); nonaktifkan saja.
    tenantApi
      .updateEntity(id, { status: 'Nonaktif' })
      .then((updated) => {
        setApiEntities((prev) => prev.map((e) => (e.id === id ? updated : e)));
        logAuditAction('Struktur Entitas', 'HAPUS_ENTITAS', id, `Menonaktifkan entitas ${id}`);
      })
      .catch((err) => console.error('Gagal menghapus entitas:', err));
  };

  const toggleEntityDepartmentLevel = (entityId: string) => {
    const target = entities.find((e) => e.id === entityId);
    updateEntity(entityId, { useDepartmentLevel: !(target?.useDepartmentLevel ?? true) });
    logAuditAction(
      'Struktur Organisasi',
      'TOGGLE_DEPT_LEVEL',
      entityId,
      `Mengubah fleksibilitas hierarki departemen pada ${target?.name || entityId}`
    );
  };

  // 22B. Divisi & Departemen Handlers
  const addDivision = (divData: Omit<CompanyDivision, 'id'>) => {
    tenantApi
      .createDivision({ entityId: divData.entityId, code: divData.code, name: divData.name, headTitle: divData.headTitle ?? null, description: divData.description ?? null })
      .then((created) => {
        setApiDivisions((prev) => [...prev, created]);
        logAuditAction('Struktur Divisi', 'TAMBAH_DIVISI', created.id, `Menambahkan divisi: ${created.name}`);
      })
      .catch((err) => console.error('Gagal menambahkan divisi:', err));
  };

  const updateDivision = (id: string, updates: Partial<CompanyDivision>) => {
    tenantApi
      .updateDivision(id, { code: updates.code, name: updates.name, headTitle: updates.headTitle, description: updates.description })
      .then((updated) => {
        setApiDivisions((prev) => prev.map((d) => (d.id === id ? updated : d)));
        logAuditAction('Struktur Divisi', 'UPDATE_DIVISI', id, `Memperbarui divisi ${id}`);
      })
      .catch((err) => console.error('Gagal memperbarui divisi:', err));
  };

  const deleteDivision = (id: string) => {
    tenantApi
      .deleteDivision(id)
      .then(() => {
        setApiDivisions((prev) => prev.filter((d) => d.id !== id));
        logAuditAction('Struktur Divisi', 'HAPUS_DIVISI', id, `Menghapus divisi ${id}`);
      })
      .catch((err) => console.error('Gagal menghapus divisi:', err));
  };

  const addDepartment = (deptData: Omit<CompanyDepartment, 'id'>) => {
    tenantApi
      .createDepartment({
        entityId: deptData.entityId,
        divisionId: deptData.divisionId ?? null,
        code: deptData.code,
        name: deptData.name,
        headTitle: deptData.headTitle ?? null,
        description: deptData.description ?? null,
      })
      .then((created) => {
        setApiDepartments((prev) => [...prev, created]);
        logAuditAction('Struktur Departemen', 'TAMBAH_DEPARTEMEN', created.id, `Menambahkan departemen: ${created.name}`);
      })
      .catch((err) => console.error('Gagal menambahkan departemen:', err));
  };

  const updateDepartment = (id: string, updates: Partial<CompanyDepartment>) => {
    tenantApi
      .updateDepartment(id, { code: updates.code, name: updates.name, headTitle: updates.headTitle, description: updates.description })
      .then((updated) => {
        setApiDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
        logAuditAction('Struktur Departemen', 'UPDATE_DEPARTEMEN', id, `Memperbarui departemen ${id}`);
      })
      .catch((err) => console.error('Gagal memperbarui departemen:', err));
  };

  const deleteDepartment = (id: string) => {
    tenantApi
      .deleteDepartment(id)
      .then(() => {
        setApiDepartments((prev) => prev.filter((d) => d.id !== id));
        logAuditAction('Struktur Departemen', 'HAPUS_DEPARTEMEN', id, `Menghapus departemen ${id}`);
      })
      .catch((err) => console.error('Gagal menghapus departemen:', err));
  };

  // 22B-2. Master Jabatan Handlers — `division`/`department` arrive as NAME strings (mock-shaped UI); resolved to real ids here.
  const addMasterJobPosition = (posData: Omit<MasterJobPosition, 'id'>) => {
    tenantApi
      .createPosition({
        entityId: posData.entityId,
        code: posData.code,
        title: posData.title,
        defaultLevel: posData.defaultLevel,
        divisionId: resolveDivisionId(posData.entityId, posData.division) ?? null,
        departmentId: resolveDepartmentId(posData.entityId, posData.department) ?? null,
        jobFamily: posData.jobFamily ?? null,
        jobGrade: posData.jobGrade ?? null,
        minGrade: posData.minGrade ?? null,
        maxGrade: posData.maxGrade ?? null,
        gradingScheme: posData.gradingScheme ?? 'single',
        description: posData.description ?? null,
        requirements: posData.requirements ?? null,
      })
      .then((created) => {
        setApiPositions((prev) => [...prev, created]);
        logAuditAction('Master Jabatan', 'TAMBAH_MASTER_JABATAN', created.id, `Menambahkan standar jabatan: ${created.title}`);
      })
      .catch((err) => console.error('Gagal menambahkan standar jabatan:', err));
  };

  const updateMasterJobPosition = (id: string, updates: Partial<MasterJobPosition>) => {
    const target = masterJobPositions.find((p) => p.id === id);
    const entityId = target?.entityId;
    tenantApi
      .updatePosition(id, {
        code: updates.code,
        title: updates.title,
        defaultLevel: updates.defaultLevel,
        divisionId: updates.division !== undefined && entityId ? resolveDivisionId(entityId, updates.division) : undefined,
        departmentId: updates.department !== undefined && entityId ? resolveDepartmentId(entityId, updates.department) : undefined,
        jobFamily: updates.jobFamily,
        jobGrade: updates.jobGrade,
        minGrade: updates.minGrade,
        maxGrade: updates.maxGrade,
        gradingScheme: updates.gradingScheme,
        description: updates.description,
        requirements: updates.requirements,
      })
      .then((updated) => {
        setApiPositions((prev) => prev.map((p) => (p.id === id ? updated : p)));
        logAuditAction('Master Jabatan', 'UPDATE_MASTER_JABATAN', id, `Memperbarui standar jabatan ${id}`);
      })
      .catch((err) => console.error('Gagal memperbarui standar jabatan:', err));
  };

  const deleteMasterJobPosition = (id: string) => {
    tenantApi
      .deletePosition(id)
      .then(() => {
        setApiPositions((prev) => prev.filter((p) => p.id !== id));
        logAuditAction('Master Jabatan', 'HAPUS_MASTER_JABATAN', id, `Menghapus standar jabatan ${id}`);
      })
      .catch((err) => console.error('Gagal menghapus standar jabatan:', err));
  };

  /**
   * Clears an entity's divisions/departments/positions/org-nodes so a
   * template or copy-from-entity can be tried and re-tried freely while the
   * entity's baseline is still Open (user, 2026-11-03: template/copy should
   * replace the existing draft structure, not skip-merge around it — the
   * backend already refuses this once the entity is locked, via
   * requireUnlockedEntity, so this never touches a finalized structure).
   * Deletes in dependency order: nodes first (reference positions/divisions/
   * departments), then positions, then departments, then divisions. Nodes
   * also reference EACH OTHER via reportsToId (self-referencing FK), so a
   * "boss" node can't be deleted in parallel with its own subordinates still
   * pointing at it — every node's reportsToId is cleared first to break
   * those links before any node is actually deleted.
   */
  const clearEntityOrgStructure = async (entityId: string) => {
    const nodesToDelete = apiOrgNodes.filter((n) => n.entityId === entityId);
    const positionsToDelete = apiPositions.filter((p) => p.entityId === entityId);
    const departmentsToDelete = apiDepartments.filter((d) => d.entityId === entityId);
    const divisionsToDelete = apiDivisions.filter((d) => d.entityId === entityId);

    await Promise.all(
      nodesToDelete.filter((n) => n.reportsToId).map((n) => tenantApi.updateOrgNode(n.id, { reportsToId: null }))
    );
    await Promise.all(nodesToDelete.map((n) => tenantApi.deleteOrgNode(n.id)));
    await Promise.all(positionsToDelete.map((p) => tenantApi.deletePosition(p.id)));
    await Promise.all(departmentsToDelete.map((d) => tenantApi.deleteDepartment(d.id)));
    await Promise.all(divisionsToDelete.map((d) => tenantApi.deleteDivision(d.id)));

    const nodeIds = new Set(nodesToDelete.map((n) => n.id));
    const positionIds = new Set(positionsToDelete.map((p) => p.id));
    const departmentIds = new Set(departmentsToDelete.map((d) => d.id));
    const divisionIds = new Set(divisionsToDelete.map((d) => d.id));
    setApiOrgNodes((prev) => prev.filter((n) => !nodeIds.has(n.id)));
    setApiPositions((prev) => prev.filter((p) => !positionIds.has(p.id)));
    setApiDepartments((prev) => prev.filter((d) => !departmentIds.has(d.id)));
    setApiDivisions((prev) => prev.filter((d) => !divisionIds.has(d.id)));
  };

  /** One-click starter setup for an entity's baseline — bulk-creates a predefined set of divisions/departments/jabatan/grade/org-nodes. Replaces whatever draft structure the entity already has (see clearEntityOrgStructure); rejects on failure (e.g. entity already locked) so the caller can show it. */
  const applyOrgTemplate = async (entityId: string, templateKey: string) => {
    const template = ORG_STRUCTURE_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) throw new Error('Template tidak ditemukan');

    await clearEntityOrgStructure(entityId);

    const createdDivisions = await Promise.all(
      template.divisions.map((d) => tenantApi.createDivision({ entityId, code: d.code, name: d.name, headTitle: d.headTitle ?? null, description: null }))
    );
    const divisionByCode = new Map(createdDivisions.map((d) => [d.code, d]));

    const createdDepartments = await Promise.all(
      template.departments.map((d) =>
        tenantApi.createDepartment({ entityId, divisionId: divisionByCode.get(d.divisionCode)?.id ?? null, code: d.code, name: d.name, headTitle: null, description: null })
      )
    );
    const departmentByCode = new Map(createdDepartments.map((d) => [d.code, d]));

    const createdPositions = await Promise.all(
      template.positions.map((p) =>
        tenantApi.createPosition({
          entityId,
          code: p.code,
          title: p.title,
          defaultLevel: p.defaultLevel,
          divisionId: p.divisionCode ? divisionByCode.get(p.divisionCode)?.id ?? null : null,
          departmentId: p.departmentCode ? departmentByCode.get(p.departmentCode)?.id ?? null : null,
          jobFamily: null,
          jobGrade: null,
          minGrade: null,
          maxGrade: null,
          gradingScheme: 'single',
          description: null,
          requirements: null,
        })
      )
    );
    const positionByCode = new Map(createdPositions.map((p) => [p.code, p]));

    // Grades are tenant-wide (not per-entity), so clearEntityOrgStructure
    // never touches them. gradeCode is a label, not a unique key (user,
    // 2026-11-03: codes can repeat as a standard, and different companies
    // may use the same code) — so only skip a template's grade when BOTH
    // code and name already match exactly (meaning this exact template was
    // already applied before); otherwise create it as-is, same code and all.
    const alreadyApplied = (g: { gradeCode: string; gradeName: string }) =>
      gradeSalaryRanges.some((existing) => existing.gradeCode === g.gradeCode && existing.gradeName === g.gradeName);
    const gradesToCreate = template.grades.filter((g) => !alreadyApplied(g));
    const createdGrades = await Promise.all(
      gradesToCreate.map((g) =>
        tenantApi.createGrade({ entityId: null, gradeCode: g.gradeCode, gradeName: g.gradeName, minSalary: g.minSalary ?? null, midSalary: g.midSalary ?? null, maxSalary: g.maxSalary ?? null, singleValueSalary: null, notes: null })
      )
    );

    // The "Struktur Organisasi" diagram renders org-nodes, NOT the division/
    // department/position master lists directly (bug, 2026-11-03: the
    // template never created any, so the diagram stayed empty even though
    // the master data existed). One node per template position. Templates
    // don't encode reportsTo explicitly, so the boss is inferred: the
    // closest lower-level position in the same department, else same
    // division, else the entity-wide top position.
    const closestBossCode = (p: (typeof template.positions)[number]) => {
      const lowerLevel = template.positions.filter((other) => other.code !== p.code && other.defaultLevel < p.defaultLevel);
      const inDept = p.departmentCode ? lowerLevel.filter((c) => c.departmentCode === p.departmentCode) : [];
      const inDiv = p.divisionCode ? lowerLevel.filter((c) => c.divisionCode === p.divisionCode) : [];
      const topLevel = lowerLevel.filter((c) => !c.divisionCode && !c.departmentCode);
      const pool = inDept.length ? inDept : inDiv.length ? inDiv : topLevel.length ? topLevel : lowerLevel;
      if (pool.length === 0) return null;
      return pool.reduce((closest, c) => (c.defaultLevel > closest.defaultLevel ? c : closest)).code;
    };

    const createdNodesRaw = await Promise.all(
      template.positions.map((p) => {
        const pos = positionByCode.get(p.code)!;
        return tenantApi.createOrgNode({
          entityId,
          title: pos.title,
          divisionId: pos.divisionId,
          departmentId: pos.departmentId,
          reportsToId: null, // relinked below, once every node has a real id
          code: pos.code,
          jobGrade: null,
          description: null,
          relationType: 'struktural',
          isVacant: true,
          level: p.defaultLevel,
          masterJobPositionId: pos.id,
        });
      })
    );
    const nodeIdByPositionCode = new Map(template.positions.map((p, i) => [p.code, createdNodesRaw[i].id]));
    const createdNodes = await Promise.all(
      template.positions.map((p, i) => {
        const bossCode = closestBossCode(p);
        const bossNodeId = bossCode ? nodeIdByPositionCode.get(bossCode) : undefined;
        return bossNodeId ? tenantApi.updateOrgNode(createdNodesRaw[i].id, { reportsToId: bossNodeId }) : createdNodesRaw[i];
      })
    );

    setApiDivisions((prev) => [...prev, ...createdDivisions]);
    setApiDepartments((prev) => [...prev, ...createdDepartments]);
    setApiPositions((prev) => [...prev, ...createdPositions]);
    setApiOrgNodes((prev) => [...prev, ...createdNodes]);
    if (createdGrades.length > 0) setApiGrades((prev) => [...prev, ...createdGrades]);

    logAuditAction('Struktur Organisasi', 'TERAPKAN_TEMPLATE', entityId, `Menerapkan template "${template.label}" untuk entitas ${entityId}`);
  };

  /** Copies another entity's divisions/departments/master jabatan as a starting point for this one — a faster alternative to the built-in templates when an existing entity already has the right shape. Replaces whatever draft structure the target entity already has (see clearEntityOrgStructure). */
  const copyOrgStructureFromEntity = async (targetEntityId: string, sourceEntityId: string) => {
    await clearEntityOrgStructure(targetEntityId);

    const sourceDivisions = apiDivisions.filter((d) => d.entityId === sourceEntityId);
    const sourceDepartments = apiDepartments.filter((d) => d.entityId === sourceEntityId);
    const sourcePositions = apiPositions.filter((p) => p.entityId === sourceEntityId);

    const createdDivisions = await Promise.all(
      sourceDivisions.map((d) => tenantApi.createDivision({ entityId: targetEntityId, code: d.code, name: d.name, headTitle: d.headTitle, description: d.description }))
    );
    const divisionIdBySourceId = new Map(sourceDivisions.map((d, i) => [d.id, createdDivisions[i].id]));

    const createdDepartments = await Promise.all(
      sourceDepartments.map((d) =>
        tenantApi.createDepartment({
          entityId: targetEntityId,
          divisionId: d.divisionId ? divisionIdBySourceId.get(d.divisionId) ?? null : null,
          code: d.code,
          name: d.name,
          headTitle: d.headTitle,
          description: d.description,
        })
      )
    );
    const departmentIdBySourceId = new Map(sourceDepartments.map((d, i) => [d.id, createdDepartments[i].id]));

    const createdPositions = await Promise.all(
      sourcePositions.map((p) =>
        tenantApi.createPosition({
          entityId: targetEntityId,
          code: p.code,
          title: p.title,
          defaultLevel: p.defaultLevel,
          divisionId: p.divisionId ? divisionIdBySourceId.get(p.divisionId) ?? null : null,
          departmentId: p.departmentId ? departmentIdBySourceId.get(p.departmentId) ?? null : null,
          jobFamily: p.jobFamily,
          jobGrade: p.jobGrade,
          minGrade: p.minGrade,
          maxGrade: p.maxGrade,
          gradingScheme: p.gradingScheme,
          description: p.description,
          requirements: p.requirements,
        })
      )
    );

    setApiDivisions((prev) => [...prev, ...createdDivisions]);
    setApiDepartments((prev) => [...prev, ...createdDepartments]);
    setApiPositions((prev) => [...prev, ...createdPositions]);

    const sourceEntityName = entities.find((e) => e.id === sourceEntityId)?.name ?? sourceEntityId;
    logAuditAction('Struktur Organisasi', 'SALIN_STRUKTUR', targetEntityId, `Menyalin struktur divisi/departemen/jabatan dari entitas "${sourceEntityName}"`);
  };

  const assignEmployeeToPosition = (positionId: string, employeeId: string | null) => {
    // No backend column for this yet (no employees table) — tracked as a local overlay; see employeeAssignmentOverrides above.
    setEmployeeAssignmentOverrides((prev) => ({ ...prev, [positionId]: employeeId }));
    if (employeeId) {
      const targetNode = orgNodes.find((n) => n.id === positionId);
      if (targetNode) {
        updateEmployee(employeeId, { position: targetNode.title, department: targetNode.department });
      }
    }
    logAuditAction(
      'Assign Jabatan',
      employeeId ? 'ASSIGN_KARYAWAN' : 'VACANT_JABATAN',
      positionId,
      employeeId ? `Menetapkan karyawan ${employeeId} ke posisi ${positionId}` : `Mengosongkan formasi posisi ${positionId}`
    );
  };

  // 22C. Flexible NIK Handlers
  const flexibleNikSettings: FlexibleNikSettings = useMemo(() => {
    return moduleSettings.employee?.flexibleNik || DEFAULT_FLEXIBLE_NIK_SETTINGS;
  }, [moduleSettings]);

  const updateFlexibleNikSettings = (newSettings: FlexibleNikSettings) => {
    updateModuleSettings('employee', {
      ...moduleSettings.employee,
      flexibleNik: newSettings,
    });
    logAuditAction('Format NIK', 'UPDATE_NIK_FORMAT', 'global', 'Memperbarui formula pola NIK dinamis karyawan');
  };

  const generateNextNik = (employmentType: string, entityId?: string): string => {
    const ent = entities.find((e) => e.id === (entityId || currentEntityId)) || currentEntity;
    const typeKey = normalizeEmploymentType(employmentType);
    const patternCfg = flexibleNikSettings[typeKey] || DEFAULT_FLEXIBLE_NIK_SETTINGS[typeKey];

    const sameTypeCount = employees.filter(
      (e) => normalizeEmploymentType(e.employmentType) === typeKey
    ).length;
    const counter = Math.max(patternCfg.counter || 1, sameTypeCount + 1);

    return generateFlexibleNik({
      pattern: patternCfg.pattern,
      employmentType,
      entityCode: ent.code || currentTenant.code,
      counter,
      digitPadding: patternCfg.digitPadding || 4,
      customPrefix: patternCfg.prefix,
      customSuffix: patternCfg.suffix,
    });
  };

  // 23. Employee Staging Handlers
  const addEmployeeStaging = (staging: Omit<EmployeeStaging, 'id' | 'tenantId' | 'tempNik' | 'status'>) => {
    const tempNik = `TEMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStaging: EmployeeStaging = {
      ...staging,
      id: `stg-${Date.now()}`,
      tenantId: currentTenant.id,
      tempNik,
      status: 'In Progress',
    };
    setEmployeeStaging((prev) => [newStaging, ...prev]);
    logAuditAction('Onboarding Staging', 'CREATE_STAGING', newStaging.id, `Karyawan baru masuk staging dengan NIK sementara: ${tempNik}`);
  };

  const updateEmployeeStagingTask = (stagingId: string, taskId: string, isCompleted: boolean) => {
    setEmployeeStaging((prev) =>
      prev.map((s) => {
        if (s.id !== stagingId) return s;
        const updatedTasks = s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined }
            : t
        );
        const contractDone = updatedTasks.find((t) => t.title.toLowerCase().includes('pkwt') || t.title.toLowerCase().includes('kontrak'))?.isCompleted || s.contractSigned;
        const ndaDone = updatedTasks.find((t) => t.title.toLowerCase().includes('nda'))?.isCompleted || s.ndaSigned;
        const docsDone = updatedTasks.find((t) => t.title.toLowerCase().includes('verifikasi'))?.isCompleted || s.docsVerified;

        return {
          ...s,
          tasks: updatedTasks,
          contractSigned: contractDone,
          ndaSigned: ndaDone,
          docsVerified: docsDone,
        };
      })
    );
  };

  const completeOnboarding = async (stagingId: string): Promise<Employee | null> => {
    const stg = employeeStaging.find((s) => s.id === stagingId);
    if (!stg) return null;

    const ent = entities.find((e) => e.id === stg.entityId) || currentEntity;
    const seq = employees.length + 1;
    const isTetap = stg.employmentType === 'Tetap';
    const finalNik = `${ent.code}-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const docNumber = stg.contractDocNumber || `${String(seq).padStart(3, '0')}/${ent.docPrefix}/${new Date().getFullYear()}`;

    const newEmp = await addEmployee({
      entityId: ent.id,
      nik: finalNik,
      fullName: stg.fullName,
      email: stg.email,
      personalEmail: stg.email,
      phone: stg.phone,
      employmentType: stg.employmentType,
      contractDocNumber: docNumber,
      contractStartDate: stg.joinDate,
      contractEndDate: !isTetap ? '2027-10-31' : undefined,
      permanentAppointmentDate: isTetap ? stg.joinDate : undefined,
      probationStatus: isTetap ? 'Sedang Berjalan' : 'Tanpa Percobaan',
      probationEndDate: isTetap ? '2027-01-31' : undefined,
      department: stg.department,
      position: stg.position,
      managerId: stg.managerId || 'emp-1',
      grade: 'L2',
      joinDate: stg.joinDate,
      status: 'Aktif',
      remainingLeaveDays: 12,
      nikKtp: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      noKk: '317' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      birthPlace: ent.city,
      birthDate: '1996-05-15',
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      ktpAddress: `Jl. Melati No. 15, ${ent.city}`,
      currentAddress: `Jl. Melati No. 15, ${ent.city}`,
      npwp: '01.234.567.8-011.000',
      ptkp: 'TK/0',
      kppPratama: `KPP Pratama ${ent.city}`,
      bpjsTkNo: '000' + Math.floor(100000000 + Math.random() * 900000000),
      bpjsKesNo: '000' + Math.floor(100000000 + Math.random() * 900000000),
      faskes1Bpjs: `Klinik Pratama ${ent.city}`,
      bankName: 'BCA',
      bankAccount: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      bankAccountHolder: stg.fullName,
      basicSalary: stg.basicSalary,
      fixedAllowance: 1500000,
      transportAllowance: 800000,
      mealAllowance: 700000,
      positionAllowance: 1000000,
      lastEducationDegree: 'S1',
      institution: 'Universitas Indonesia',
      major: 'Ilmu Komputer',
      graduationYear: 2021,
      familyMembers: [],
      emergencyContacts: [
        {
          id: `emg-${Date.now()}`,
          fullName: 'Bapak / Ibu ' + stg.fullName.split(' ')[0],
          relation: 'Orang Tua',
          phone: stg.phone,
          address: `Jl. Melati No. 15, ${ent.city}`,
        },
      ],
      sourceOfTruth: 'native',
    });

    setEmployeeStaging((prev) =>
      prev.map((s) => (s.id === stagingId ? { ...s, status: 'Completed' } : s))
    );

    createOfficialDocument({
      type: isTetap ? 'PKWTT' : 'PKWT',
      title: `Perjanjian Kerja (${isTetap ? 'PKWTT' : 'PKWT'}): ${newEmp.fullName}`,
      targetEmployeeId: newEmp.id,
      signeeName: currentUser.name,
      signeeRole: 'VP Human Resources',
      contentPreview: `Perjanjian Kerja resmi diterbitkan untuk ${newEmp.fullName} dengan NIK ${finalNik}.`,
    });

    logAuditAction('Onboarding', 'COMPLETE_ONBOARDING', newEmp.id, `Onboarding 100% selesai: NIK Resmi ${finalNik} terbit untuk ${newEmp.fullName}`);
    return newEmp;
  };

  // 24. Overtime Handlers — real backend.
  const submitOvertimeRequest = (req: Omit<OvertimeRequest, 'id' | 'tenantId' | 'status'>) => {
    tenantApi.createOvertimeRequest({ ...req, status: 'Menunggu' } as unknown as Omit<ApiOvertimeRequest, 'id' | 'tenantId'>).then((created) => {
      const newReq = created as unknown as OvertimeRequest;
      setOvertimeRequests((prev) => [newReq, ...prev]);

      const emp = employees.find((e) => e.id === req.employeeId);
      createApprovalItem({
        category: 'Lembur',
        referenceId: newReq.id,
        title: `Lembur: ${emp?.fullName || 'Karyawan'} (${req.hours} jam - ${req.date})`,
        requesterId: req.employeeId,
        department: emp?.department || 'Operasional',
        submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        level: 1,
        totalLevels: 1,
        assignedApproverRole: 'manager',
        status: 'Menunggu',
        notes: req.reason,
      });

      logAuditAction('Presensi', 'SUBMIT_LEMBUR', newReq.id, `Pengajuan lembur ${req.hours} jam oleh ${emp?.fullName}`);
    });
  };

  const reviewOvertimeRequest = (id: string, approved: boolean, approvedHours?: number, notes?: string) => {
    const current = overtimeRequests.find((o) => o.id === id);
    tenantApi
      .updateOvertimeRequest(id, {
        status: approved ? 'Disetujui' : 'Ditolak',
        approvedBy: currentUser.name,
        approvedHours: approvedHours || current?.hours,
        notes: notes || current?.notes,
      })
      .then((updated) => setOvertimeRequests((prev) => prev.map((o) => (o.id === id ? (updated as unknown as OvertimeRequest) : o))));
    persistApprovalItemByReference(id, 'Lembur', { status: approved ? 'Disetujui' : 'Ditolak' });
  };

  // 25. Reimbursement Handlers
  const addReimbursementClaim = (claim: Omit<ReimbursementClaim, 'id' | 'tenantId' | 'claimNumber' | 'status'>) => {
    const seq = reimbursementClaims.length + 1;
    const claimNumber = `CLM-${currentTenant.code}-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newClaim: ReimbursementClaim = {
      ...claim,
      id: `clm-${Date.now()}`,
      tenantId: currentTenant.id,
      claimNumber,
      status: 'Menunggu Review',
    };
    setReimbursementClaims((prev) => [newClaim, ...prev]);
    const emp = employees.find((e) => e.id === newClaim.employeeId);
    createApprovalItem({
      category: 'Reimbursement',
      referenceId: newClaim.id,
      title: `Klaim ${newClaim.category}: ${emp?.fullName || newClaim.employeeId} (${newClaim.claimNumber})`,
      requesterId: newClaim.employeeId,
      department: emp?.department || 'Operasional',
      amount: newClaim.amount,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
      level: 1,
      totalLevels: 2,
      assignedApproverRole: 'manager',
      status: 'Menunggu',
      notes: newClaim.description,
    });
    logAuditAction('Reimbursement', 'SUBMIT_CLAIM', newClaim.id, `Pengajuan klaim ${newClaim.category} Rp ${newClaim.amount.toLocaleString('id-ID')}`);
  };

  const reviewReimbursementClaim = (id: string, approved: boolean, notes?: string) => {
    const current = approvalItems.find((a) => a.referenceId === id && a.category === 'Reimbursement');
    persistApprovalItemByReference(id, 'Reimbursement', { status: approved ? 'Disetujui' : 'Ditolak', notes: notes || current?.notes });
    logAuditAction('Reimbursement', approved ? 'APPROVE_CLAIM' : 'REJECT_CLAIM', id, `Klaim biaya ${approved ? 'disetujui' : 'ditolak'}`);
    setReimbursementClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: approved ? 'Disetujui' : 'Ditolak',
              approvedBy: currentUser.name,
              notes: notes || c.notes,
              approvedAmount: approved ? c.amount : 0,
              processInPayroll: approved ? (c.processInPayroll ?? true) : false,
            }
          : c
      )
    );
  };

  const toggleReimbursementPayrollOptIn = (id: string) => {
    setReimbursementClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, processInPayroll: !c.processInPayroll } : c))
    );
  };

  // 26. Personalia Handlers
  const submitPersonaliaRequest = (req: Omit<PersonaliaRequest, 'id' | 'tenantId' | 'status'>) => {
    const newReq: PersonaliaRequest = {
      ...req,
      id: `pers-req-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu Approval',
    };
    setPersonaliaRequests((prev) => [newReq, ...prev]);

    const emp = employees.find((e) => e.id === req.employeeId);
    createApprovalItem({
      category: 'Promosi/Personalia',
      referenceId: newReq.id,
      title: `Personalia: ${req.type} - ${emp?.fullName || 'Karyawan'}`,
      requesterId: req.employeeId,
      department: emp?.department || 'Operasional',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      deadlineAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
      level: 1,
      totalLevels: 2,
      assignedApproverRole: 'manager',
      status: 'Menunggu',
      notes: req.reason,
    });

    logAuditAction('Personalia', 'SUBMIT_REQUEST', newReq.id, `Pengajuan perubahan status ${req.type} untuk ${emp?.fullName}`);
  };

  const approvePersonaliaRequest = (id: string) => {
    const existingLog = personaliaLogs.find((l) => l.id === id);
    if (existingLog) {
      const emp = employees.find((e) => e.id === existingLog.employeeId);
      if (emp) {
        updateEmployee(emp.id, {
          position: existingLog.newPosition || emp.position,
          department: existingLog.newDepartment || emp.department,
          grade: existingLog.newGrade || emp.grade,
          basicSalary: existingLog.newSalary || emp.basicSalary,
        });
        createOfficialDocument({
          type: existingLog.type === 'Promosi' ? 'Surat Promosi' : existingLog.type === 'Mutasi' ? 'Surat Mutasi' : 'SK Pengangkatan',
          title: `Surat Keputusan ${existingLog.type}: ${emp.fullName}`,
          targetEmployeeId: emp.id,
          signeeName: currentUser.name,
          signeeRole: 'VP Human Resources',
          contentPreview: `Menetapkan perubahan status kepegawaian (${existingLog.type}) atas nama ${emp.fullName} dari jabatan ${existingLog.previousPosition} menjadi ${existingLog.newPosition}. Berlaku efektif ${existingLog.effectiveDate}.`,
        });
      }
      setPersonaliaLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: 'Disetujui', approvedBy: currentUser.name } : l))
      );
      persistApprovalItemByReference(id, 'Promosi/Personalia', { status: 'Disetujui' });
      logAuditAction('Personalia', 'APPROVE_LOG', id, `Persetujuan ${existingLog.type} untuk ${emp?.fullName || existingLog.employeeId}`);
      return;
    }
    const req = personaliaRequests.find((p) => p.id === id);
    if (!req) return;

    const emp = employees.find((e) => e.id === req.employeeId);
    if (!emp) return;

    const letterNumber = generateDocumentNumber(
      'Surat Promosi',
      personaliaLogs.length + 1,
      currentTenant.code
    );

    const updates: Partial<Employee> = {};
    if (req.newPosition) updates.position = req.newPosition;
    if (req.newSalary) updates.basicSalary = req.newSalary;
    if (req.newDepartment) updates.department = req.newDepartment;
    if (req.newEntityId) updates.entityId = req.newEntityId;
    if (req.personalDataUpdates) {
      Object.assign(updates, req.personalDataUpdates);
    }
    updateEmployee(emp.id, updates);

    const log: PersonaliaLog = {
      id: `pers-${Date.now()}`,
      tenantId: currentTenant.id,
      employeeId: req.employeeId,
      type: req.type as any,
      previousPosition: req.previousPosition || emp.position,
      newPosition: req.newPosition || emp.position,
      previousSalary: req.previousSalary || emp.basicSalary,
      newSalary: req.newSalary || emp.basicSalary,
      effectiveDate: req.effectiveDate,
      letterNumber,
      reason: req.reason,
      approvedBy: currentUser.name,
    };
    setPersonaliaLogs((prev) => [log, ...prev]);

    createOfficialDocument({
      type: 'Surat Promosi',
      title: `Surat Keputusan ${req.type}: ${emp.fullName}`,
      targetEmployeeId: emp.id,
      signeeName: currentUser.name,
      signeeRole: 'VP Human Resources',
      contentPreview: `Menetapkan perubahan status kepegawaian (${req.type}) atas nama ${emp.fullName}. Berlaku efektif ${req.effectiveDate}.`,
    });

    setPersonaliaRequests((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Disetujui', approvedBy: currentUser.name, skDocumentNumber: letterNumber } : p))
    );

    logAuditAction('Personalia', 'APPROVE_REQUEST', id, `Persetujuan ${req.type} untuk ${emp.fullName} efektif per ${req.effectiveDate}`);
  };

  const rejectPersonaliaRequest = (id: string) => {
    setPersonaliaLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Ditolak', approvedBy: currentUser.name } : l))
    );
    persistApprovalItemByReference(id, 'Promosi/Personalia', { status: 'Ditolak' });
    setPersonaliaRequests((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Ditolak', approvedBy: currentUser.name } : p))
    );
  };

  const reviewPersonaliaRequest = (id: string, approved: boolean) => {
    if (approved) {
      approvePersonaliaRequest(id);
    } else {
      rejectPersonaliaRequest(id);
    }
  };

  // 27. Org Proposals
  const replaceEntityStructure = async (
    entityId: string,
    newDivisions: CompanyDivision[],
    newDepartments: CompanyDepartment[],
    newNodes: OrgStructureNode[],
    proposalInfo?: { skDocNumber?: string; title?: string; effectiveDate?: string; reason?: string }
  ) => {
    // 1. Simpan snapshot struktur existing sebelum direplace (real backend —
    // this is the "riwayat" browsable in Arsip Snapshot, not local mock
    // state).
    const prevDivs = apiDivisions.filter((d) => d.entityId === entityId);
    const prevDepts = apiDepartments.filter((d) => d.entityId === entityId);
    const prevPositions = apiPositions.filter((p) => p.entityId === entityId);
    const prevNodes = apiOrgNodes.filter((n) => n.entityId === entityId);

    const createdSnapshot = await tenantApi.createOrgSnapshot({
      entityId,
      divisions: prevDivs,
      departments: prevDepts,
      positions: prevPositions,
      orgNodes: prevNodes,
      skDocNumber: proposalInfo?.skDocNumber || null,
      effectiveDate: proposalInfo?.effectiveDate || new Date().toISOString().split('T')[0],
      reason: proposalInfo?.reason || `Snapshot otomatis diarsipkan saat restrukturisasi "${proposalInfo?.title || 'Penataan Struktur'}" diterapkan`,
    });
    setApiOrgSnapshots((prev) => [createdSnapshot, ...prev]);

    // 2. Replace the real backend rows for this entity: delete everything existing, then
    // recreate from the draft, remapping draft-local ids to the real ones the backend assigns.
    const oldOrgNodeIds = apiOrgNodes.filter((n) => n.entityId === entityId).map((n) => n.id);
    const oldDepartmentIds = apiDepartments.filter((d) => d.entityId === entityId).map((d) => d.id);
    const oldDivisionIds = apiDivisions.filter((d) => d.entityId === entityId).map((d) => d.id);
    await Promise.all(oldOrgNodeIds.map((id) => tenantApi.deleteOrgNode(id)));
    await Promise.all(oldDepartmentIds.map((id) => tenantApi.deleteDepartment(id)));
    await Promise.all(oldDivisionIds.map((id) => tenantApi.deleteDivision(id)));

    const createdDivisions = await Promise.all(
      newDivisions.map((d) => tenantApi.createDivision({ entityId, code: d.code, name: d.name, headTitle: d.headTitle ?? null, description: d.description ?? null }))
    );
    const divisionIdByDraftId = new Map(newDivisions.map((d, i) => [d.id, createdDivisions[i].id]));

    const createdDepartments = await Promise.all(
      newDepartments.map((d) =>
        tenantApi.createDepartment({
          entityId,
          divisionId: (d.divisionId ? divisionIdByDraftId.get(d.divisionId) : undefined) ?? null,
          code: d.code,
          name: d.name,
          headTitle: d.headTitle ?? null,
          description: d.description ?? null,
        })
      )
    );
    const divisionIdByName = new Map(createdDivisions.map((d) => [d.name, d.id]));
    const departmentIdByName = new Map(createdDepartments.map((d) => [d.name, d.id]));

    const createdNodesRaw = await Promise.all(
      newNodes.map((n) =>
        tenantApi.createOrgNode({
          entityId,
          title: n.title,
          divisionId: (n.division ? divisionIdByName.get(n.division) : undefined) ?? null,
          departmentId: (n.department ? departmentIdByName.get(n.department) : undefined) ?? null,
          reportsToId: null, // relinked in the second pass below, once every node has a real id
          code: n.code ?? null,
          jobGrade: n.jobGrade ?? null,
          description: n.description ?? null,
          relationType: n.relationType ?? 'struktural',
          isVacant: n.isVacant,
          level: n.level,
          masterJobPositionId: n.masterJobPositionId ?? null,
        })
      )
    );
    // Second pass: now that every node has a real id, relink reportsToId (draft-local ids -> real ids).
    const nodeIdByDraftId = new Map(newNodes.map((n, i) => [n.id, createdNodesRaw[i].id]));
    const createdNodes = await Promise.all(
      newNodes.map((n, i) =>
        n.reportsToId && nodeIdByDraftId.get(n.reportsToId)
          ? tenantApi.updateOrgNode(createdNodesRaw[i].id, { reportsToId: nodeIdByDraftId.get(n.reportsToId) })
          : createdNodesRaw[i]
      )
    );

    setApiDivisions((prev) => [...prev.filter((d) => d.entityId !== entityId), ...createdDivisions]);
    setApiDepartments((prev) => [...prev.filter((d) => d.entityId !== entityId), ...createdDepartments]);
    setApiOrgNodes((prev) => [...prev.filter((n) => n.entityId !== entityId), ...createdNodes]);

    logAuditAction(
      'Struktur Organisasi',
      'REPLACE_STRUCTURE',
      entityId,
      `Restrukturisasi menyeluruh diterapkan untuk entitas ${entityId}. Struktur lama diarsipkan ke snapshot ID ${createdSnapshot.id}`
    );
  };

  const submitOrgProposal = (proposal: Omit<OrgChangeProposal, 'id' | 'tenantId' | 'status' | 'implemented'>) => {
    const targetEntId = proposal.entityId || currentEntityId;
    const isLocked = isEntityGovernanceLocked(targetEntId);
    const isAutoApproved = Boolean(proposal.isCorrectionOnly) || !isLocked;
    const newProp: OrgChangeProposal = {
      ...proposal,
      id: `org-prop-${Date.now()}`,
      tenantId: currentTenant.id,
      status: isAutoApproved ? 'Disetujui' : 'Menunggu Approval',
      implemented: isAutoApproved,
      createdAt: new Date().toISOString().split('T')[0],
      approvedBy: isAutoApproved ? currentUser.name : undefined,
    };
    setOrgProposals((prev) => [newProp, ...prev]);

    // Jika mode koreksi typo atau mode setup awal, langsung terapkan
    if (isAutoApproved && proposal.payload) {
      if (proposal.payload.type === 'full_restructure' || (proposal.payload.newDivisions && proposal.payload.newNodes)) {
        replaceEntityStructure(
          targetEntId,
          proposal.payload.newDivisions || [],
          proposal.payload.newDepartments || [],
          proposal.payload.newNodes || [],
          {
            skDocNumber: proposal.skDocNumber,
            title: proposal.proposalTitle,
            effectiveDate: proposal.effectiveDate,
            reason: proposal.description,
          }
        );
      } else {
        applyProposalPayload(proposal.payload);
      }
    }

    logAuditAction(
      proposal.category === 'perusahaan' ? 'Struktur Perusahaan' : 'Struktur Organisasi',
      'SUBMIT_PROPOSAL',
      newProp.id,
      `Pengusulan perubahan struktur: ${newProp.proposalTitle} [No. SK: ${newProp.skDocNumber || '-'}]`
    );
  };

  const applyProposalPayload = (payload: any) => {
    if (!payload) return;
    if (payload.type === 'create_position') {
      addOrgNode(payload.data);
    } else if (payload.type === 'update_position') {
      updateOrgNode(payload.id, payload.data);
    } else if (payload.type === 'delete_position') {
      deleteOrgNode(payload.id);
    } else if (payload.type === 'create_division') {
      addDivision(payload.data);
    } else if (payload.type === 'update_division') {
      updateDivision(payload.id, payload.data);
    } else if (payload.type === 'delete_division') {
      deleteDivision(payload.id);
    } else if (payload.type === 'create_department') {
      addDepartment(payload.data);
    } else if (payload.type === 'update_department') {
      updateDepartment(payload.id, payload.data);
    } else if (payload.type === 'delete_department') {
      deleteDepartment(payload.id);
    } else if (payload.type === 'create_entity') {
      addEntity(payload.data);
    } else if (payload.type === 'update_entity') {
      updateEntity(payload.id, payload.data);
    } else if (payload.type === 'delete_entity') {
      deleteEntity(payload.id);
    }
  };

  const reviewOrgProposal = (id: string, approved: boolean, rejectionReason?: string) => {
    setOrgProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (approved && p.payload) {
          if (p.payload.type === 'full_restructure' || (p.payload.newDivisions && p.payload.newNodes)) {
            replaceEntityStructure(
              p.entityId,
              p.payload.newDivisions || [],
              p.payload.newDepartments || [],
              p.payload.newNodes || [],
              {
                skDocNumber: p.skDocNumber,
                title: p.proposalTitle,
                effectiveDate: p.effectiveDate,
                reason: p.description,
              }
            );
          } else {
            applyProposalPayload(p.payload);
          }
        }
        return {
          ...p,
          status: approved ? 'Disetujui' : 'Ditolak',
          approvedBy: approved ? currentUser.name : p.approvedBy,
          rejectionReason: !approved ? (rejectionReason || 'Ditolak oleh pimpinan/direksi') : undefined,
          implemented: approved,
        };
      })
    );
    logAuditAction(
      'Struktur Organisasi',
      approved ? 'APPROVE_PROPOSAL' : 'REJECT_PROPOSAL',
      id,
      `Proposal restrukturisasi ${id} ${approved ? 'Disetujui dan diberlakukan' : `Ditolak: ${rejectionReason || '-'}`}`
    );
  };

  const deleteOrgProposal = (id: string) => {
    const target = orgProposals.find((p) => p.id === id);
    setOrgProposals((prev) => prev.filter((p) => p.id !== id));
    logAuditAction('Struktur Organisasi', 'HAPUS_DRAFT_PROPOSAL', id, `Menghapus draf usulan restrukturisasi: ${target?.proposalTitle || id}`);
  };

  const addOrgNode = (node: Omit<OrgStructureNode, 'id'>) => {
    tenantApi
      .createOrgNode({
        entityId: node.entityId,
        title: node.title,
        divisionId: resolveDivisionId(node.entityId, node.division) ?? null,
        departmentId: resolveDepartmentId(node.entityId, node.department) ?? null,
        code: node.code ?? null,
        jobGrade: node.jobGrade ?? null,
        description: node.description ?? null,
        reportsToId: node.reportsToId ?? null,
        relationType: node.relationType ?? 'struktural',
        isVacant: node.isVacant,
        level: node.level,
        masterJobPositionId: node.masterJobPositionId ?? null,
      })
      .then((created) => {
        setApiOrgNodes((prev) => [...prev, created]);
        logAuditAction('Struktur Organisasi', 'TAMBAH_POSISI', created.id, `Menambahkan posisi jabatan: ${created.title}`);
      })
      .catch((err) => console.error('Gagal menambahkan posisi jabatan:', err));
  };

  const updateOrgNode = (id: string, updates: Partial<OrgStructureNode>) => {
    const target = orgNodes.find((n) => n.id === id);
    const entityId = target?.entityId;
    tenantApi
      .updateOrgNode(id, {
        title: updates.title,
        divisionId: updates.division !== undefined && entityId ? resolveDivisionId(entityId, updates.division) : undefined,
        departmentId: updates.department !== undefined && entityId ? resolveDepartmentId(entityId, updates.department) : undefined,
        code: updates.code,
        jobGrade: updates.jobGrade,
        description: updates.description,
        reportsToId: updates.reportsToId,
        relationType: updates.relationType,
        isVacant: updates.isVacant,
        level: updates.level,
        masterJobPositionId: updates.masterJobPositionId,
      })
      .then((updated) => {
        setApiOrgNodes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        logAuditAction('Struktur Organisasi', 'UPDATE_POSISI', id, `Memperbarui posisi jabatan ${id}`);
      })
      .catch((err) => console.error('Gagal memperbarui posisi jabatan:', err));
  };

  const deleteOrgNode = (id: string) => {
    tenantApi
      .deleteOrgNode(id)
      .then(() => {
        setApiOrgNodes((prev) => prev.filter((n) => n.id !== id));
        logAuditAction('Struktur Organisasi', 'HAPUS_POSISI', id, `Menghapus posisi jabatan ${id}`);
      })
      .catch((err) => console.error('Gagal menghapus posisi jabatan:', err));
  };

  // 28. Probation Evaluations — real backend.
  const toMockProbationEvaluation = (r: ApiProbationEvaluation): ProbationEvaluation => ({
    ...r,
    supervisorId: r.supervisorId || '',
    extensionDurationMonths: r.extensionDurationMonths ?? undefined,
    notes: r.notes || '',
    approvedBy: r.approvedBy || undefined,
    skDocNumber: r.skDocNumber || undefined,
  });

  const submitProbationEvaluation = (evaluation: Omit<ProbationEvaluation, 'id' | 'tenantId' | 'status'>) => {
    tenantApi.createProbationEvaluation({ ...evaluation, status: 'Menunggu Approval' } as Omit<ApiProbationEvaluation, 'id' | 'tenantId'>).then((created) => {
      setProbationEvaluations((prev) => [toMockProbationEvaluation(created), ...prev]);
      const emp = employees.find((e) => e.id === evaluation.employeeId);
      logAuditAction('Evaluasi Probation', 'SUBMIT_EVALUATION', created.id, `Evaluasi masa percobaan untuk ${emp?.fullName}: Rekomendasi ${evaluation.recommendation}`);
    });
  };

  const reviewProbationEvaluation = (id: string, approved: boolean) => {
    const ev = probationEvaluations.find((p) => p.id === id);
    if (!ev) return;

    if (approved && ev.recommendation === 'Lulus') {
      const emp = employees.find((e) => e.id === ev.employeeId);
      if (emp) {
        updateEmployee(emp.id, {
          probationStatus: 'Lolos',
          employmentType: 'Tetap',
          permanentAppointmentDate: new Date().toISOString().split('T')[0],
        });
        createOfficialDocument({
          type: 'PKWTT',
          title: `Surat Keputusan Pengangkatan Karyawan Tetap: ${emp.fullName}`,
          targetEmployeeId: emp.id,
          signeeName: currentUser.name,
          signeeRole: 'President Director / VP HC',
          contentPreview: `Menerangkan bahwa Saudara/i ${emp.fullName} resmi diangkat sebagai Karyawan Tetap setelah lulus masa percobaan dengan predikat Sangat Baik.`,
        });
      }
    } else if (approved && ev.recommendation === 'Tidak Lulus') {
      initiateOffboarding(ev.employeeId, 'PHK Efisiensi', new Date().toISOString().split('T')[0], 'Tidak memenuhi standar kelulusan probation 3 bulan.');
    }

    tenantApi
      .updateProbationEvaluation(id, { status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name })
      .then((updated) => setProbationEvaluations((prev) => prev.map((p) => (p.id === id ? toMockProbationEvaluation(updated) : p))));
  };

  // 29. Contract Reviews — real backend.
  const toMockContractReview = (r: ApiContractRenewalReview): ContractRenewalReview => ({
    ...r,
    newDurationMonths: r.newDurationMonths ?? undefined,
    notes: r.notes || '',
    approvedBy: r.approvedBy || undefined,
    newContractDocNumber: r.newContractDocNumber || undefined,
  });

  const submitContractReview = (rev: Omit<ContractRenewalReview, 'id' | 'tenantId' | 'status'>) => {
    tenantApi.createContractRenewalReview({ ...rev, status: 'Menunggu Approval' } as Omit<ApiContractRenewalReview, 'id' | 'tenantId'>).then((created) => {
      setContractReviews((prev) => [toMockContractReview(created), ...prev]);
      logAuditAction('Perpanjangan Kontrak', 'SUBMIT_REVIEW', created.id, `Review perpanjangan kontrak: Rekomendasi ${rev.recommendation}`);
    });
  };

  const reviewContractReview = (id: string, approved: boolean) => {
    const rev = contractReviews.find((r) => r.id === id);
    if (!rev) return;

    if (approved) {
      const emp = employees.find((e) => e.id === rev.employeeId);
      if (emp) {
        if (rev.recommendation === 'Perpanjang PKWT') {
          const newEnd = new Date(Date.now() + (rev.newDurationMonths || 12) * 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
          updateEmployee(emp.id, { contractEndDate: newEnd });
          createOfficialDocument({
            type: 'PKWT',
            title: `Perpanjangan Perjanjian Kerja Waktu Tertentu: ${emp.fullName}`,
            targetEmployeeId: emp.id,
            signeeName: currentUser.name,
            signeeRole: 'VP Human Resources',
            contentPreview: `Memperpanjang masa kerja kontrak atas nama ${emp.fullName} hingga ${newEnd}.`,
          });
        } else if (rev.recommendation === 'Alih Status PKWTT (Tetap)') {
          updateEmployee(emp.id, { employmentType: 'Tetap', probationStatus: 'Lolos' });
          createOfficialDocument({
            type: 'PKWTT',
            title: `Surat Pengangkatan Karyawan Tetap: ${emp.fullName}`,
            targetEmployeeId: emp.id,
            signeeName: currentUser.name,
            signeeRole: 'President Director',
            contentPreview: `Mengangkat ${emp.fullName} sebagai Karyawan Tetap.`,
          });
        } else if (rev.recommendation === 'Tidak Diperpanjang') {
          initiateOffboarding(emp.id, 'Habis Kontrak', emp.contractEndDate || new Date().toISOString().split('T')[0], 'Kontrak selesai dan tidak diperpanjang.');
        }
      }
    }

    tenantApi
      .updateContractRenewalReview(id, { status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name })
      .then((updated) => setContractReviews((prev) => prev.map((r) => (r.id === id ? toMockContractReview(updated) : r))));
  };

  // 30. Calendar Events
  const addCalendarEvent = (event: Omit<CompanyCalendarEvent, 'id' | 'tenantId'>) => {
    const newEvent: CompanyCalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
    logAuditAction('Kalender', 'TAMBAH_EVENT', newEvent.id, `Menambahkan kalender ${newEvent.type}: ${newEvent.title}`);
  };

  // 31. Grade Salary Ranges
  const addGradeSalaryRange = (range: Omit<GradeSalaryRange, 'id' | 'tenantId'>) => {
    tenantApi
      .createGrade({
        entityId: range.entityId ?? null,
        gradeCode: range.gradeCode,
        gradeName: range.gradeName,
        minSalary: range.minSalary,
        midSalary: range.midSalary,
        maxSalary: range.maxSalary,
        singleValueSalary: range.singleValueSalary ?? null,
        notes: range.notes ?? null,
      })
      .then((created) => {
        setApiGrades((prev) => [...prev, created]);
        logAuditAction('Grade Gaji', 'TAMBAH_GRADE', created.id, `Menambahkan grade ${created.gradeCode}`);
      })
      .catch((err) => console.error('Gagal menambahkan grade:', err));
  };

  const updateGradeSalaryRange = (id: string, updates: Partial<GradeSalaryRange>) => {
    tenantApi
      .updateGrade(id, {
        gradeCode: updates.gradeCode,
        gradeName: updates.gradeName,
        minSalary: updates.minSalary,
        midSalary: updates.midSalary,
        maxSalary: updates.maxSalary,
        singleValueSalary: updates.singleValueSalary,
        notes: updates.notes,
      })
      .then((updated) => setApiGrades((prev) => prev.map((g) => (g.id === id ? updated : g))))
      .catch((err) => console.error('Gagal memperbarui grade:', err));
  };

  const deleteGradeSalaryRange = (id: string) => {
    tenantApi
      .deleteGrade(id)
      .then(() => {
        setApiGrades((prev) => prev.filter((g) => g.id !== id));
        logAuditAction('Grade Gaji', 'HAPUS_GRADE', id, `Menghapus master grade ${id}`);
      })
      .catch((err) => console.error('Gagal menghapus grade:', err));
  };

  // 32. Salary Components
  const addSalaryComponent = (comp: Omit<SalaryComponentMaster, 'id' | 'tenantId'>) => {
    const newComp: SalaryComponentMaster = {
      ...comp,
      id: `cmp-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setSalaryComponents((prev) => [...prev, newComp]);
  };

  const assignSalaryComponent = (assignment: Omit<EmployeeSalaryComponentAssignment, 'id' | 'tenantId'>) => {
    const newAsg: EmployeeSalaryComponentAssignment = {
      ...assignment,
      id: `asg-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setEmployeeSalaryAssignments((prev) => [...prev, newAsg]);
  };

  // 33. GA Facilities, Fleet & Supply
  const addRoomBooking = (booking: Omit<GARoomBooking, 'id' | 'tenantId' | 'bookingDocNumber' | 'status'>) => {
    const seq = roomBookings.length + 1;
    const bookingDocNumber = `BKG-ROOM-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newBkg: GARoomBooking = {
      ...booking,
      id: `rm-bkg-${Date.now()}`,
      tenantId: currentTenant.id,
      bookingDocNumber,
      status: 'Terkonfirmasi',
    };
    setRoomBookings((prev) => [newBkg, ...prev]);
    logAuditAction('GA Ruangan', 'BOOKING_ROOM', newBkg.id, `Reservasi ${newBkg.roomName} untuk ${newBkg.meetingTitle}`);
  };

  const saveMeetingMinutes = (bookingId: string, notes: string) => {
    const seq = roomBookings.length + 1;
    const momDocNumber = `MOM-${currentTenant.code}-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    setRoomBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, momNotes: notes, momDocNumber, momRecordedBy: currentUser.name, status: 'Selesai' } : b))
    );
    logAuditAction('GA Ruangan', 'SAVE_MOM', bookingId, `Menyimpan MoM Rapat: ${momDocNumber}`);
  };

  const addVehicleBooking = (booking: Omit<GAVehicleBooking, 'id' | 'tenantId' | 'formDocNumber' | 'status'>) => {
    const seq = vehicleBookings.length + 1;
    const formDocNumber = `SPK-ARMADA-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newBkg: GAVehicleBooking = {
      ...booking,
      id: `veh-bkg-${Date.now()}`,
      tenantId: currentTenant.id,
      formDocNumber,
      status: 'Disetujui',
    };
    setVehicleBookings((prev) => [newBkg, ...prev]);
    logAuditAction('GA Kendaraan', 'BOOKING_VEHICLE', newBkg.id, `Peminjaman kendaraan ${newBkg.vehicleName} plat ${newBkg.plateNumber}`);
  };

  const updateVehicleBookingStatus = (id: string, status: GAVehicleBooking['status'], endOdometer?: number, fuelCost?: number) => {
    setVehicleBookings((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status,
              endOdometer: endOdometer !== undefined ? endOdometer : v.endOdometer,
              fuelCost: fuelCost !== undefined ? fuelCost : v.fuelCost,
            }
          : v
      )
    );
  };

  const addOfficeSupply = (item: Omit<GAOfficeSupply, 'id' | 'tenantId'>) => {
    const newItem: GAOfficeSupply = {
      ...item,
      id: `atk-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setOfficeSupplies((prev) => [...prev, newItem]);
    logAuditAction('GA ATK', 'ADD_SUPPLY_ITEM', newItem.id, `Mendaftarkan master ATK: ${newItem.itemName}`);
  };

  const addOfficeSupplyRequest = (req: Omit<GAOfficeSupplyRequest, 'id' | 'tenantId' | 'status' | 'requestDate'>) => {
    const newReq: GAOfficeSupplyRequest = {
      ...req,
      id: `spl-req-${Date.now()}`,
      tenantId: currentTenant.id,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Menunggu Approval',
    };
    setOfficeSupplyRequests((prev) => [newReq, ...prev]);
    logAuditAction('GA ATK', 'REQUEST_SUPPLY', newReq.id, `Permintaan ATK sebanyak ${newReq.qty}`);
  };

  const reviewOfficeSupplyRequest = (id: string, approved: boolean) => {
    const req = officeSupplyRequests.find((r) => r.id === id);
    if (!req) return;

    if (approved) {
      setOfficeSupplies((prev) =>
        prev.map((s) => (s.id === req.itemId ? { ...s, currentStock: Math.max(0, s.currentStock - req.qty) } : s))
      );
    }

    setOfficeSupplyRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: approved ? 'Didistribusikan' : 'Ditolak',
              distributedAt: approved ? new Date().toISOString().split('T')[0] : undefined,
            }
          : r
      )
    );
  };

  const addGaTicket = (ticket: Omit<GATicket, 'id' | 'tenantId' | 'ticketNumber' | 'createdAt' | 'status'>) => {
    const seq = gaTickets.length + 1;
    const ticketNumber = `TKT-GA-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newTkt: GATicket = {
      ...ticket,
      id: `ga-tkt-${Date.now()}`,
      tenantId: currentTenant.id,
      ticketNumber,
      status: 'Terbuka',
      createdAt: new Date().toISOString(),
    };
    setGaTickets((prev) => [newTkt, ...prev]);
    logAuditAction('GA Tiketing', 'CREATE_TICKET', newTkt.id, `Tiket GA baru: ${newTkt.ticketNumber} (${newTkt.category})`);
  };

  const updateGaTicketStatus = (id: string, status: GATicket['status'], notes?: string) => {
    setGaTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              resolvedAt: status === 'Selesai' ? new Date().toISOString() : t.resolvedAt,
              resolutionNotes: notes || t.resolutionNotes,
            }
          : t
      )
    );
  };

  // 34. Procurement Vendor Invoices
  const addVendorInvoice = (invoice: Omit<VendorInvoice, 'id' | 'tenantId' | 'status'>) => {
    const newInv: VendorInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Belum Bill',
    };
    setVendorInvoices((prev) => [newInv, ...prev]);
    logAuditAction('Procurement AP', 'TAMBAH_INVOICE', newInv.id, `Mencatat tagihan invoice vendor: ${newInv.invoiceNumber} Rp ${newInv.amount.toLocaleString('id-ID')}`);
  };

  const updateVendorInvoiceStatus = (id: string, status: 'Sudah Bill' | 'Belum Bill', paidDate?: string, paymentMethod?: string) => {
    setVendorInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status,
              paidDate: paidDate || (status === 'Sudah Bill' ? new Date().toISOString().split('T')[0] : undefined),
              paymentMethod: paymentMethod || inv.paymentMethod,
            }
          : inv
      )
    );
  };

  // 36. eNPS
  const submitEnpsResponse = (score: number, department: string, feedback?: string) => {
    setEnpsSurvey((prev) => {
      const newResponse = {
        id: `enps-r-${Date.now()}`,
        score,
        department,
        feedback,
        submittedAt: new Date().toISOString().split('T')[0],
      };
      const responses = [...prev.responses, newResponse];
      const promoters = responses.filter((r) => r.score >= 9).length;
      const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
      const detractors = responses.filter((r) => r.score <= 6).length;
      const total = responses.length;
      const npsScore = Math.round(((promoters - detractors) / total) * 100);

      return {
        ...prev,
        responses,
        totalResponses: total,
        promoters,
        passives,
        detractors,
        score: npsScore,
      };
    });
  };

  // 37. User Signatures
  const saveUserSignature = (userId: string, signatureUrl: string) => {
    setUserSignatures((prev) => ({
      ...prev,
      [userId]: signatureUrl,
    }));
    logAuditAction('RBAC User', 'ENROLL_SIGNATURE', userId, `Spesimen tanda tangan digital QR terdaftar`);
  };

  // 39. Reset & Reload Complete Business Flow Simulation
  const resetToSampleFlowData = () => {
    try {
      localStorage.removeItem('nusahr_employees');
      localStorage.removeItem('nusahr_attendance');
      localStorage.removeItem('nusahr_payroll');
      localStorage.removeItem('nusahr_loans');
      localStorage.removeItem('nusahr_leaves');
      localStorage.removeItem('nusahr_compliance');
      localStorage.removeItem('nusahr_offboarding');
      localStorage.removeItem('nusahr_procurement');
      localStorage.removeItem('nusahr_approvals');
      localStorage.removeItem('nusahr_assets');
      localStorage.removeItem('nusahr_candidates');
      localStorage.removeItem('nusahr_trips');
      localStorage.removeItem('nusahr_contract_reviews');
      localStorage.removeItem('nusahr_probation_evals');
      localStorage.removeItem('nusahr_reimbursements');
      localStorage.removeItem('nusahr_overtime');
    } catch {
      // storage unavailable
    }

    setPayrollRecords(INITIAL_PAYROLL_RECORDS);
    setLoans(INITIAL_LOANS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setComplianceRecords(INITIAL_COMPLIANCE);
    setOffboardingRecords(INITIAL_OFFBOARDING);
    setProcurementOrders(INITIAL_PROCUREMENT);
    setAssets(INITIAL_ASSETS);
    setBusinessTrips(INITIAL_BUSINESS_TRIPS);
    setPersonaliaLogs(INITIAL_PERSONALIA_LOGS);
  };

  return (
    <HrmsContext.Provider
      value={{
        tenants,
        currentTenant,
        setCurrentTenantId,
        updateTenant,
        updateTenantBranding,
        currentUser,
        setCurrentUserRole,
        setCurrentSessionUser,
        users,
        addUser,
        deleteUser,
        roles,
        addRole,
        deleteRole,
        rolePermissions,
        updateRolePermission,
        getRolePermission,
        hasPermission,
        activeModule,
        setActiveModule,
        employees: tenantEmployees,
        personaliaLogs: personaliaLogs.filter((p) => p.tenantId === currentTenant.id),
        addEmployee,
        updateEmployee,
        deleteEmployee,
        processPersonaliaAction,
        attendance, // real backend data, already tenant-scoped server-side
        leaveRequests: leaveRequests.filter((l) => l.tenantId === currentTenant.id),
        clockIn,
        clockOut,
        submitLeaveRequest,
        reviewLeaveRequest,
        payrollRecords: payrollRecords.filter((p) => p.tenantId === currentTenant.id),
        generatePayrollRun,
        approvePayrollRun,
        disbursePayrollRun,
        loans: loans.filter((l) => l.tenantId === currentTenant.id),
        addLoan,
        updateLoanStatus,
        kpis: kpis.filter((k) => k.tenantId === currentTenant.id),
        saveKPIReview,
        complianceRecords: complianceRecords.filter((c) => c.tenantId === currentTenant.id),
        issueComplianceAction,
        vacancies, // real backend data, already tenant-scoped server-side
        jobRequisitions, // real backend data, already tenant-scoped server-side
        addJobRequisition,
        updateJobRequisition,
        deleteJobRequisition,
        candidates, // real backend data, already tenant-scoped server-side
        addVacancy,
        updateVacancy,
        addCandidate,
        updateCandidateStage,
        convertCandidateToEmployee,
        competencyTestTypes,
        addCompetencyTestType,
        updateCompetencyTestType,
        deleteCompetencyTestType,
        resetCompetencyTestTypes,
        saveCandidateCompetencyScore,
        deleteCandidateCompetencyScore,
        interviewTypeSettings,
        addInterviewType,
        updateInterviewType,
        deleteInterviewType,
        resetInterviewTypes,
        saveCandidateInterviewEvaluation,
        deleteCandidateInterviewEvaluation,
        offboardingRecords: offboardingRecords.filter((o) => o.tenantId === currentTenant.id),
        initiateOffboarding,
        updateOffboardingChecklist,
        assets: assets.filter((a) => a.tenantId === currentTenant.id),
        addAsset,
        updateAsset,
        performStockOpname,
        procurementOrders: procurementOrders.filter((p) => p.tenantId === currentTenant.id),
        addProcurementOrder,
        updateProcurementStatus,
        documents: documents.filter((d) => d.tenantId === currentTenant.id),
        createOfficialDocument,
        executeMigrationImport,
        // Advanced Modules
        onboardingProcesses, // real backend data, already tenant-scoped server-side
        onboardingChecklistTemplates,
        addOnboardingProcess,
        updateOnboardingTask,
        toggleOnboardingSubItem,
        completeOnboardingProcess,
        updateOnboardingProcess,
        cancelOnboardingProcess,
        updateOnboardingChecklistTemplates,
        addChecklistTemplateItem,
        removeChecklistTemplateItem,
        shifts, // real backend data, already tenant-scoped server-side
        schedules, // real backend data, already tenant-scoped server-side
        addShift,
        updateShift,
        deleteShift,
        upsertSchedules,
        clearSchedules,
        shiftSwaps, // real backend data, already tenant-scoped server-side
        addShiftSwapRequest,
        reviewShiftSwapRequest,
        attendanceCorrections, // real backend data, already tenant-scoped server-side
        submitAttendanceCorrection,
        reviewAttendanceCorrection,
        businessTrips: (() => {
          const scoped = businessTrips.filter((t) => t.tenantId === currentTenant.id);
          return scoped.length > 0 ? scoped : businessTrips;
        })(),
        submitBusinessTrip,
        reviewBusinessTrip,
        approvalItems, // real backend data, already tenant-scoped server-side
        reviewApprovalItem,
        approvalDelegations, // real backend data, already tenant-scoped server-side
        setApprovalDelegation,
        vendors: vendors.filter((v) => v.tenantId === currentTenant.id),
        addVendor,
        updateVendor,
        assetMaintenanceTickets: assetMaintenanceTickets.filter((m) => m.tenantId === currentTenant.id),
        assetRelocations: assetRelocations.filter((r) => r.tenantId === currentTenant.id),
        addMaintenanceTicket,
        updateMaintenanceTicket,
        addAssetRelocation,
        documentTemplates: documentTemplates.filter((t) => t.tenantId === currentTenant.id),
        addDocumentTemplate,
        updateDocumentTemplate,
        deleteDocumentTemplate,
        moduleSettings,
        updateModuleSettings,
        // 22 - 37 Domains
        // Not re-filtered by currentTenant.id — the backend already scopes this to the
        // logged-in session's real tenant; currentTenant is still mock/App-Owner-side
        // tenant-switcher state whose id never matches the real tenant UUID.
        entities,
        currentEntityId,
        setCurrentEntityId,
        currentEntity,
        addEntity,
        updateEntity,
        deleteEntity,
        toggleEntityDepartmentLevel,
        loadTenantOrgData,
        divisions, // real backend data, already tenant-scoped server-side
        addDivision,
        updateDivision,
        deleteDivision,
        departments, // real backend data, already tenant-scoped server-side
        addDepartment,
        updateDepartment,
        deleteDepartment,
        masterJobPositions, // real backend data, already tenant-scoped server-side
        addMasterJobPosition,
        updateMasterJobPosition,
        deleteMasterJobPosition,
        applyOrgTemplate,
        copyOrgStructureFromEntity,
        assignEmployeeToPosition,
        flexibleNikSettings,
        updateFlexibleNikSettings,
        generateNextNik,
        employeeStaging: employeeStaging.filter((s) => s.tenantId === currentTenant.id),
        addEmployeeStaging,
        updateEmployeeStagingTask,
        completeOnboarding,
        overtimeRequests, // real backend data, already tenant-scoped server-side
        submitOvertimeRequest,
        reviewOvertimeRequest,
        reimbursementClaims: reimbursementClaims.filter((c) => c.tenantId === currentTenant.id),
        addReimbursementClaim,
        reviewReimbursementClaim,
        toggleReimbursementPayrollOptIn,
        personaliaRequests: personaliaRequests.filter((p) => p.tenantId === currentTenant.id),
        submitPersonaliaRequest,
        reviewPersonaliaRequest,
        isOrgGovernanceLocked: isEntityGovernanceLocked(currentEntityId),
        isEntityGovernanceLocked,
        toggleEntityGovernanceLock,
        setOrgGovernanceLocked: setIsOrgGovernanceLocked,
        orgNodes, // real backend data, already tenant-scoped server-side
        addOrgNode,
        updateOrgNode,
        deleteOrgNode,
        orgProposals: orgProposals.filter((p) => p.tenantId === currentTenant.id),
        submitOrgProposal,
        reviewOrgProposal,
        deleteOrgProposal,
        orgSnapshots, // real backend data, already tenant-scoped server-side
        startOrgRestructure,
        revertOrgRestructure,
        replaceEntityStructure,
        probationEvaluations, // real backend data, already tenant-scoped server-side
        submitProbationEvaluation,
        reviewProbationEvaluation,
        contractReviews, // real backend data, already tenant-scoped server-side
        submitContractReview,
        reviewContractReview,
        calendarEvents: calendarEvents.filter((c) => c.tenantId === currentTenant.id),
        addCalendarEvent,
        gradeSalaryRanges, // real backend data, already tenant-scoped server-side
        addGradeSalaryRange,
        updateGradeSalaryRange,
        deleteGradeSalaryRange,
        jobGradingScheme,
        setJobGradingScheme,
        salaryComponents: salaryComponents.filter((s) => s.tenantId === currentTenant.id),
        addSalaryComponent,
        employeeSalaryAssignments: employeeSalaryAssignments.filter((a) => a.tenantId === currentTenant.id),
        assignSalaryComponent,
        roomBookings: roomBookings.filter((b) => b.tenantId === currentTenant.id),
        addRoomBooking,
        saveMeetingMinutes,
        vehicleBookings: vehicleBookings.filter((v) => v.tenantId === currentTenant.id),
        addVehicleBooking,
        updateVehicleBookingStatus,
        officeSupplies: officeSupplies.filter((s) => s.tenantId === currentTenant.id),
        addOfficeSupply,
        officeSupplyRequests: officeSupplyRequests.filter((r) => r.tenantId === currentTenant.id),
        addOfficeSupplyRequest,
        reviewOfficeSupplyRequest,
        gaTickets: gaTickets.filter((t) => t.tenantId === currentTenant.id),
        addGaTicket,
        updateGaTicketStatus,
        vendorInvoices: vendorInvoices.filter((v) => v.tenantId === currentTenant.id),
        addVendorInvoice,
        updateVendorInvoiceStatus,
        auditLogs: auditLogs.filter((a) => a.tenantId === currentTenant.id),
        logAuditAction,
        enpsSurvey,
        submitEnpsResponse,
        userSignatures,
        saveUserSignature,
        activePreviewItem,
        openFilePreview,
        closeFilePreview,
        resetToSampleFlowData,
        // Same reasoning as `entities` above — real backend data, already tenant-scoped server-side.
        officeLocations,
        addOfficeLocation,
        updateOfficeLocation,
        deleteOfficeLocation,
      }}
    >
      {children}
    </HrmsContext.Provider>
  );
};


export const useHrms = () => {
  const context = useContext(HrmsContext);
  if (!context) {
    throw new Error('useHrms must be used within an HrmsProvider');
  }
  return context;
};
