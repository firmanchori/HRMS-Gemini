import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Tenant,
  UserAccount,
  UserRole,
  Employee,
  PersonaliaLog,
  PersonaliaActionType,
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
  INITIAL_SHIFT_SWAPS,
  INITIAL_ATTENDANCE_CORRECTIONS,
  INITIAL_BUSINESS_TRIPS,
  INITIAL_APPROVALS,
  INITIAL_VENDORS,
  INITIAL_ONBOARDING,
  DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES,
  INITIAL_DOCUMENT_TEMPLATES,
  INITIAL_MODULE_SETTINGS,
  INITIAL_ENTITIES,
  INITIAL_EMPLOYEE_STAGING,
  INITIAL_OVERTIME_REQUESTS,
  INITIAL_REIMBURSEMENT_CLAIMS,
  INITIAL_PERSONALIA_REQUESTS,
  INITIAL_MASTER_JOB_POSITIONS,
  INITIAL_ORG_NODES,
  INITIAL_ORG_PROPOSALS,
  INITIAL_PROBATION_EVALUATIONS,
  INITIAL_CONTRACT_REVIEWS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_GRADE_SALARY_RANGES,
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
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'tenantId'>) => void;
  deleteUser: (id: string) => void;
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
  addEmployee: (emp: Omit<Employee, 'id' | 'tenantId'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
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
  updateLoanStatus: (id: string, status: 'Aktif' | 'Lunas' | 'Menunggu Approval') => void;

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
  addJobRequisition: (req: Omit<JobRequisition, 'id' | 'tenantId' | 'createdAt'>) => void;
  updateJobRequisition: (id: string, updates: Partial<JobRequisition>) => void;
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
  convertCandidateToEmployee: (candidateId: string, joinDate: string) => void;
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
  updateOnboardingTask: (processId: string, taskId: string, isCompleted: boolean, actionPayload?: any) => void;
  completeOnboardingProcess: (processId: string) => Employee | null;
  updateOnboardingChecklistTemplates: (templates: OnboardingChecklistTemplateItem[]) => void;
  addChecklistTemplateItem: (item: Omit<OnboardingChecklistTemplateItem, 'id'>) => void;
  removeChecklistTemplateItem: (id: string) => void;

  // 14. Shifts, Roaster & Swap Requests
  shifts: WorkShift[];
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
  addEntity: (entity: Omit<CompanyEntity, 'id' | 'tenantId'>) => void;
  updateEntity: (id: string, updates: Partial<CompanyEntity>) => void;
  deleteEntity: (id: string) => void;
  toggleEntityDepartmentLevel: (entityId: string) => void;

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
  assignEmployeeToPosition: (positionId: string, employeeId: string | null) => void;

  // 22C. Format NIK Fleksibel
  flexibleNikSettings: FlexibleNikSettings;
  updateFlexibleNikSettings: (settings: FlexibleNikSettings) => void;
  generateNextNik: (employmentType: string, entityId?: string) => string;

  // 23. Employee Staging (Onboarding Gate)
  employeeStaging: EmployeeStaging[];
  addEmployeeStaging: (staging: Omit<EmployeeStaging, 'id' | 'tenantId' | 'tempNik' | 'status'>) => void;
  updateEmployeeStagingTask: (stagingId: string, taskId: string, isCompleted: boolean) => void;
  completeOnboarding: (stagingId: string) => Employee | null;

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
  orgSnapshots: OrgStructureSnapshot[];
  replaceEntityStructure: (
    entityId: string,
    newDivisions: CompanyDivision[],
    newDepartments: CompanyDepartment[],
    newNodes: OrgStructureNode[],
    proposalInfo?: { skDocNumber?: string; title?: string; effectiveDate?: string; reason?: string }
  ) => void;

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
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    const saved = localStorage.getItem('nusahr_roles');
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('nusahr_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
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

  useEffect(() => {
    localStorage.setItem('nusahr_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('nusahr_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.tenantId === currentTenant.id && u.role === currentUserRole);
    if (found) return found;
    return {
      id: 'current-usr',
      tenantId: currentTenant.id,
      name: 'Aditya Pratama (Admin)',
      email: 'aditya@nusantara.id',
      role: currentUserRole,
    };
  }, [currentTenant.id, currentUserRole, users]);

  // Active module view
  const [activeModule, setActiveModule] = useState<string>('dashboard');

  // Master Data Stores
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('nusahr_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [personaliaLogs, setPersonaliaLogs] = useState<PersonaliaLog[]>(() => {
    const saved = localStorage.getItem('nusahr_personalia');
    return saved ? JSON.parse(saved) : INITIAL_PERSONALIA_LOGS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('nusahr_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

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

  const [jobRequisitions, setJobRequisitions] = useState<JobRequisition[]>(() => {
    const saved = localStorage.getItem('nusahr_job_requisitions_v2');
    return saved ? JSON.parse(saved) : INITIAL_JOB_REQUISITIONS;
  });

  const [vacancies, setVacancies] = useState<JobVacancy[]>(() => {
    const saved = localStorage.getItem('nusahr_vacancies');
    return saved ? JSON.parse(saved) : INITIAL_JOB_VACANCIES;
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('nusahr_candidates_v4');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
  });

  const [competencyTestTypes, setCompetencyTestTypes] = useState<CompetencyTestTypeSetting[]>(() => {
    const saved = localStorage.getItem('nusahr_competency_test_types_v1');
    return saved ? JSON.parse(saved) : INITIAL_COMPETENCY_TEST_TYPES;
  });

  const [interviewTypeSettings, setInterviewTypeSettings] = useState<InterviewTypeSetting[]>(() => {
    const saved = localStorage.getItem('nusahr_interview_types_v1');
    return saved ? JSON.parse(saved) : INITIAL_INTERVIEW_TYPES;
  });

  const [offboardingRecords, setOffboardingRecords] = useState<OffboardingRecord[]>(() => {
    const saved = localStorage.getItem('nusahr_offboarding');
    return saved ? JSON.parse(saved) : INITIAL_OFFBOARDING;
  });

  const [assets, setAssets] = useState<GAAsset[]>(() => {
    const saved = localStorage.getItem('nusahr_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>(() => {
    const saved = localStorage.getItem('nusahr_procurement');
    return saved ? JSON.parse(saved) : INITIAL_PROCUREMENT;
  });

  const [documents, setDocuments] = useState<OfficialDocument[]>(() => {
    const saved = localStorage.getItem('nusahr_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [onboardingProcesses, setOnboardingProcesses] = useState<OnboardingProcess[]>(() => {
    const saved = localStorage.getItem('nusahr_onboarding');
    return saved ? JSON.parse(saved) : INITIAL_ONBOARDING;
  });

  const [onboardingChecklistTemplates, setOnboardingChecklistTemplates] = useState<OnboardingChecklistTemplateItem[]>(() => {
    const saved = localStorage.getItem('nusahr_onboarding_templates_v2');
    return saved ? JSON.parse(saved) : DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES;
  });

  useEffect(() => {
    localStorage.setItem('nusahr_onboarding_templates_v2', JSON.stringify(onboardingChecklistTemplates));
  }, [onboardingChecklistTemplates]);

  const [shifts, setShifts] = useState<WorkShift[]>(() => {
    const saved = localStorage.getItem('nusahr_shifts');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_shiftswaps');
    return saved ? JSON.parse(saved) : INITIAL_SHIFT_SWAPS;
  });

  const [attendanceCorrections, setAttendanceCorrections] = useState<AttendanceCorrectionRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_corrections');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_CORRECTIONS;
  });

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

  const [approvalItems, setApprovalItems] = useState<ApprovalWorkflowItem[]>(() => {
    const saved = localStorage.getItem('nusahr_approvals');
    return saved ? JSON.parse(saved) : INITIAL_APPROVALS;
  });

  const [approvalDelegations, setApprovalDelegations] = useState<ApprovalDelegation[]>(() => {
    const saved = localStorage.getItem('nusahr_delegations');
    return saved ? JSON.parse(saved) : [];
  });

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
    const saved = localStorage.getItem('nusahr_templates');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENT_TEMPLATES;
  });

  const [moduleSettings, setModuleSettings] = useState<ModuleSettingsConfig>(() => {
    const saved = localStorage.getItem('nusahr_settings');
    return saved ? JSON.parse(saved) : INITIAL_MODULE_SETTINGS;
  });

  // 22. Entities & Holding
  const [entities, setEntities] = useState<CompanyEntity[]>(() => {
    const saved = localStorage.getItem('nusahr_entities');
    return saved ? JSON.parse(saved) : INITIAL_ENTITIES;
  });
  const [currentEntityId, setCurrentEntityId] = useState<string>(() => {
    return localStorage.getItem('nusahr_active_entity') || 'ent-ntm-holding';
  });
  const currentEntity = useMemo(() => {
    return entities.find((e) => e.id === currentEntityId) || entities[0];
  }, [entities, currentEntityId]);

  // 22B. Divisions & Departments
  const [divisions, setDivisions] = useState<CompanyDivision[]>(() => {
    const saved = localStorage.getItem('nusahr_divisions_v3');
    return saved ? JSON.parse(saved) : INITIAL_DIVISIONS;
  });
  const [departments, setDepartments] = useState<CompanyDepartment[]>(() => {
    const saved = localStorage.getItem('nusahr_departments_v3');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  // 22B-2. Master Jabatan (Kamus Jabatan)
  const [masterJobPositions, setMasterJobPositions] = useState<MasterJobPosition[]>(() => {
    const saved = localStorage.getItem('nusahr_master_job_positions_v3');
    return saved ? JSON.parse(saved) : INITIAL_MASTER_JOB_POSITIONS;
  });

  // 23. Employee Staging
  const [employeeStaging, setEmployeeStaging] = useState<EmployeeStaging[]>(() => {
    const saved = localStorage.getItem('nusahr_staging');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_STAGING;
  });

  // 24. Overtime Requests
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_overtime');
    return saved ? JSON.parse(saved) : INITIAL_OVERTIME_REQUESTS;
  });

  // 25. Reimbursements
  const [reimbursementClaims, setReimbursementClaims] = useState<ReimbursementClaim[]>(() => {
    const saved = localStorage.getItem('nusahr_reimbursements');
    return saved ? JSON.parse(saved) : INITIAL_REIMBURSEMENT_CLAIMS;
  });

  // 26. Personalia Requests
  const [personaliaRequests, setPersonaliaRequests] = useState<PersonaliaRequest[]>(() => {
    const saved = localStorage.getItem('nusahr_personalia_reqs');
    return saved ? JSON.parse(saved) : INITIAL_PERSONALIA_REQUESTS;
  });

  // 27. Org Nodes & Proposals
  const [orgNodes, setOrgNodes] = useState<OrgStructureNode[]>(() => {
    const saved = localStorage.getItem('nusahr_org_nodes_v3');
    return saved ? JSON.parse(saved) : INITIAL_ORG_NODES;
  });
  const [orgProposals, setOrgProposals] = useState<OrgChangeProposal[]>(() => {
    const saved = localStorage.getItem('nusahr_org_proposals');
    return saved ? JSON.parse(saved) : INITIAL_ORG_PROPOSALS;
  });
  const [lockedEntities, setLockedEntities] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('nusahr_org_locked_entities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      'ent-ntm-holding': true,
      'ent-ntm-digital': true,
      'ent-ntm-cloud': false,
    };
  });

  const [orgSnapshots, setOrgSnapshots] = useState<OrgStructureSnapshot[]>(() => {
    const saved = localStorage.getItem('nusahr_org_snapshots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'snap-holding-2025-v1',
        tenantId: 'default',
        entityId: 'ent-ntm-holding',
        skDocNumber: 'SK-DIR/HOLDING/2025/001',
        versionTitle: 'Versi Awal Pembentukan Holding 2025 (Baseline SK-001)',
        effectiveDate: '2025-01-02',
        archivedAt: '2025-12-30',
        archivedBy: 'Direktur Utama',
        reason: 'Arsip penetapan awal struktur organisasi holding PT Nusantara Tech Media',
        divisions: INITIAL_DIVISIONS.filter((d) => d.entityId === 'ent-ntm-holding'),
        departments: INITIAL_DEPARTMENTS.filter((d) => d.entityId === 'ent-ntm-holding'),
        orgNodes: INITIAL_ORG_NODES.filter((n) => n.entityId === 'ent-ntm-holding'),
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('nusahr_org_snapshots', JSON.stringify(orgSnapshots));
  }, [orgSnapshots]);

  const isEntityGovernanceLocked = (entityId?: string) => {
    const targetId = entityId || currentEntityId;
    return lockedEntities[targetId] ?? false;
  };

  const toggleEntityGovernanceLock = (entityId: string) => {
    setLockedEntities((prev) => {
      const next = { ...prev, [entityId]: !prev[entityId] };
      localStorage.setItem('nusahr_org_locked_entities', JSON.stringify(next));
      return next;
    });
  };

  const setIsOrgGovernanceLocked = (locked: boolean) => {
    setLockedEntities((prev) => {
      const next = { ...prev, [currentEntityId]: locked };
      localStorage.setItem('nusahr_org_locked_entities', JSON.stringify(next));
      return next;
    });
  };

  // 28. Probation Evaluations
  const [probationEvaluations, setProbationEvaluations] = useState<ProbationEvaluation[]>(() => {
    const saved = localStorage.getItem('nusahr_probation');
    return saved ? JSON.parse(saved) : INITIAL_PROBATION_EVALUATIONS;
  });

  // 29. Contract Reviews
  const [contractReviews, setContractReviews] = useState<ContractRenewalReview[]>(() => {
    const saved = localStorage.getItem('nusahr_contracts');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACT_REVIEWS;
  });

  // 30. Calendar Events
  const [calendarEvents, setCalendarEvents] = useState<CompanyCalendarEvent[]>(() => {
    const saved = localStorage.getItem('nusahr_calendar');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  // 31. Grade Salary Ranges
  const [gradeSalaryRanges, setGradeSalaryRanges] = useState<GradeSalaryRange[]>(() => {
    const saved = localStorage.getItem('nusahr_grades_v2');
    return saved ? JSON.parse(saved) : INITIAL_GRADE_SALARY_RANGES;
  });

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
    localStorage.setItem('nusahr_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('nusahr_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('nusahr_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('nusahr_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('nusahr_templates', JSON.stringify(documentTemplates));
  }, [documentTemplates]);

  useEffect(() => {
    localStorage.setItem('nusahr_payroll', JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  useEffect(() => {
    localStorage.setItem('nusahr_entities', JSON.stringify(entities));
  }, [entities]);

  useEffect(() => {
    localStorage.setItem('nusahr_divisions_v3', JSON.stringify(divisions));
  }, [divisions]);

  useEffect(() => {
    localStorage.setItem('nusahr_departments_v3', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('nusahr_master_job_positions_v3', JSON.stringify(masterJobPositions));
  }, [masterJobPositions]);

  useEffect(() => {
    localStorage.setItem('nusahr_grades_v2', JSON.stringify(gradeSalaryRanges));
  }, [gradeSalaryRanges]);

  useEffect(() => {
    localStorage.setItem('nusahr_job_grading_scheme', jobGradingScheme);
  }, [jobGradingScheme]);

  useEffect(() => {
    localStorage.setItem('nusahr_candidates_v4', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('nusahr_competency_test_types_v1', JSON.stringify(competencyTestTypes));
  }, [competencyTestTypes]);

  useEffect(() => {
    localStorage.setItem('nusahr_interview_types_v1', JSON.stringify(interviewTypeSettings));
  }, [interviewTypeSettings]);

  // Filtered scoped items for active tenant
  const tenantEmployees = useMemo(
    () => employees.filter((e) => e.tenantId === currentTenant.id),
    [employees, currentTenant.id]
  );

  // 1. Employee & Personalia Functions
  const addEmployee = (empData: Omit<Employee, 'id' | 'tenantId'>): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setEmployees((prev) => [newEmp, ...prev]);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
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
      approvedBy: currentUser.name,
      status: 'Disetujui',
      notes: action.notes,
      newBranchLocation: action.newBranchLocation,
      contractDurationMonths: action.contractDurationMonths,
      contractEndDate: action.contractEndDate,
      actingRoleExpiryDate: action.actingRoleExpiryDate,
      permanentAppointmentDate: action.permanentAppointmentDate,
      disciplinaryLevel: action.disciplinaryLevel,
      skDocNumber: letterNumber,
    };

    setPersonaliaLogs((prev) => [log, ...prev]);

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

  // 2. Attendance & Leave
  const clockIn = (employeeId: string, notes?: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    // Standard start hour 08:30
    const [hours, mins] = timeStr.split(':').map(Number);
    const lateMinutes = Math.max(0, hours * 60 + mins - (8 * 60 + 30));
    const status = lateMinutes > 0 ? 'Terlambat' : 'Hadir';

    const existingIdx = attendance.findIndex(
      (a) => a.tenantId === currentTenant.id && a.employeeId === employeeId && a.date === today
    );

    if (existingIdx >= 0) {
      setAttendance((prev) => {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          clockIn: timeStr,
          status,
          lateMinutes,
          notes: notes || copy[existingIdx].notes,
        };
        return copy;
      });
    } else {
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        tenantId: currentTenant.id,
        employeeId,
        date: today,
        clockIn: timeStr,
        status,
        overtimeHours: 0,
        lateMinutes,
        notes: notes || 'Presensi ESS Mobile/Webcam Terverifikasi',
      };
      setAttendance((prev) => [record, ...prev]);
    }
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

    setAttendance((prev) =>
      prev.map((a) => {
        if (a.tenantId === currentTenant.id && a.employeeId === employeeId && a.date === today) {
          return {
            ...a,
            clockOut: timeStr,
            overtimeHours,
            notes: notes || a.notes,
          };
        }
        return a;
      })
    );
  };

  const submitLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'tenantId' | 'status'>) => {
    const newReq: LeaveRequest = {
      ...requestData,
      id: `leave-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu',
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
  };

  const reviewLeaveRequest = (id: string, approved: boolean) => {
    const req = leaveRequests.find((l) => l.id === id);
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
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === req.employeeId
            ? { ...e, remainingLeaveDays: Math.max(0, e.remainingLeaveDays - req.totalDays) }
            : e
        )
      );
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
    const newRecords: PayrollRecord[] = tenantEmployees.map((emp) => {
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
      const allowances = emp.fixedAllowance + emp.transportAllowance + emp.mealAllowance;

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
  };

  const updateLoanStatus = (id: string, status: 'Aktif' | 'Lunas' | 'Menunggu Approval') => {
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
  const addJobRequisition = (req: Omit<JobRequisition, 'id' | 'tenantId' | 'createdAt'>) => {
    const newReq: JobRequisition = {
      ...req,
      id: `req-${Date.now()}`,
      tenantId: currentTenant.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setJobRequisitions((prev) => [newReq, ...prev]);
  };

  const updateJobRequisition = (id: string, updates: Partial<JobRequisition>) => {
    setJobRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const addVacancy = (v: Omit<JobVacancy, 'id' | 'tenantId' | 'postedDate'>) => {
    const newVac: JobVacancy = {
      ...v,
      id: `job-${Date.now()}`,
      tenantId: currentTenant.id,
      postedDate: new Date().toISOString().split('T')[0],
    };
    setVacancies((prev) => [newVac, ...prev]);
  };

  const updateVacancy = (id: string, updates: Partial<JobVacancy>) => {
    setVacancies((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const addCandidate = (c: Omit<Candidate, 'id' | 'tenantId' | 'appliedDate'>) => {
    const newCand: Candidate = {
      ...c,
      id: `cand-${Date.now()}`,
      tenantId: currentTenant.id,
      appliedDate: new Date().toISOString().split('T')[0],
    };
    setCandidates((prev) => [newCand, ...prev]);
  };

  const updateCandidateStage = (
    id: string,
    stage: Candidate['stage'],
    extra?: Partial<Candidate>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage, ...extra } : c))
    );
  };

  const convertCandidateToEmployee = (candidateId: string, joinDate: string) => {
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

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      tenantId: currentTenant.id,
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
    };

    setEmployees((prev) => [newEmp, ...prev]);
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

  const addCompetencyTestType = (testType: Omit<CompetencyTestTypeSetting, 'id'>) => {
    const newTest: CompetencyTestTypeSetting = {
      ...testType,
      id: `test-${Date.now()}`,
    };
    setCompetencyTestTypes((prev) => [newTest, ...prev]);
  };

  const updateCompetencyTestType = (id: string, updates: Partial<CompetencyTestTypeSetting>) => {
    setCompetencyTestTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteCompetencyTestType = (id: string) => {
    setCompetencyTestTypes((prev) => prev.filter((t) => t.id !== id));
  };

  const resetCompetencyTestTypes = () => {
    setCompetencyTestTypes(INITIAL_COMPETENCY_TEST_TYPES);
    localStorage.setItem('nusahr_competency_test_types_v1', JSON.stringify(INITIAL_COMPETENCY_TEST_TYPES));
  };

  const saveCandidateCompetencyScore = (
    candidateId: string,
    scoreData: Omit<CandidateCompetencyScore, 'id' | 'evaluatedAt'>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
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

        return {
          ...c,
          competencyScores: existingScores,
          testType: scoreData.testTypeName,
          testScore: avgScore,
          testPassingGrade: scoreData.passingGrade,
          testStatus: allPassed ? 'Lulus' : 'Tidak Lulus',
          testNotes: scoreData.notes || c.testNotes,
        };
      })
    );
  };

  const deleteCandidateCompetencyScore = (candidateId: string, scoreId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId || !c.competencyScores) return c;
        const updatedScores = c.competencyScores.filter((s) => s.id !== scoreId);
        const avgScore =
          updatedScores.length > 0
            ? Math.round(updatedScores.reduce((acc, s) => acc + s.score, 0) / updatedScores.length)
            : 0;
        const allPassed =
          updatedScores.length > 0
            ? updatedScores.every((s) => s.score >= s.passingGrade)
            : false;
        return {
          ...c,
          competencyScores: updatedScores,
          testScore: avgScore,
          testStatus: updatedScores.length > 0 ? (allPassed ? 'Lulus' : 'Tidak Lulus') : 'Belum Ditugaskan',
        };
      })
    );
  };

  const addInterviewType = (type: Omit<InterviewTypeSetting, 'id'>) => {
    const newType: InterviewTypeSetting = {
      ...type,
      id: `int-${Date.now()}`,
    };
    setInterviewTypeSettings((prev) => [newType, ...prev]);
  };

  const updateInterviewType = (id: string, updates: Partial<InterviewTypeSetting>) => {
    setInterviewTypeSettings((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteInterviewType = (id: string) => {
    setInterviewTypeSettings((prev) => prev.filter((t) => t.id !== id));
  };

  const resetInterviewTypes = () => {
    setInterviewTypeSettings(INITIAL_INTERVIEW_TYPES);
    localStorage.setItem('nusahr_interview_types_v1', JSON.stringify(INITIAL_INTERVIEW_TYPES));
  };

  const saveCandidateInterviewEvaluation = (
    candidateId: string,
    evalData: Omit<CandidateInterviewEvaluation, 'id' | 'evaluatedAt'>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
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

        return {
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
        };
      })
    );
  };

  const deleteCandidateInterviewEvaluation = (candidateId: string, evalId: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId || !c.interviewEvaluations) return c;
        const filtered = c.interviewEvaluations.filter((e) => e.id !== evalId);
        const avgScore =
          filtered.length > 0
            ? Math.round(filtered.reduce((acc, e) => acc + e.calculatedScore, 0) / filtered.length)
            : undefined;
        return {
          ...c,
          interviewEvaluations: filtered,
          interviewScore: avgScore,
        };
      })
    );
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

    const newEmps: Employee[] = [];
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
        id: `emp-mig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId: currentTenant.id,
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
      setEmployees((prev) => [...newEmps, ...prev]);
    }

    return { successCount, errorCount };
  };

  // 13. Onboarding Actions & Checklist Templates
  const updateOnboardingChecklistTemplates = (templates: OnboardingChecklistTemplateItem[]) => {
    setOnboardingChecklistTemplates(templates);
    logAuditAction('Onboarding Settings', 'UPDATE_TEMPLATES', 'templates', `Memperbarui ${templates.length} template checklist onboarding`);
  };

  const addChecklistTemplateItem = (item: Omit<OnboardingChecklistTemplateItem, 'id'>) => {
    const newItem: OnboardingChecklistTemplateItem = {
      ...item,
      id: `tmpl-${Date.now()}`,
    };
    setOnboardingChecklistTemplates((prev) => [...prev, newItem]);
    logAuditAction('Onboarding Settings', 'ADD_TEMPLATE_ITEM', newItem.id, `Menambahkan checklist: ${newItem.title}`);
  };

  const removeChecklistTemplateItem = (id: string) => {
    setOnboardingChecklistTemplates((prev) => prev.filter((t) => t.id !== id));
    logAuditAction('Onboarding Settings', 'DELETE_TEMPLATE_ITEM', id, `Menghapus template checklist ID: ${id}`);
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
          }));

    const newProcess: OnboardingProcess = {
      ...data,
      id: `onb-${Date.now()}`,
      tenantId: currentTenant.id,
      tasks,
      status: 'In Progress',
    };
    setOnboardingProcesses((prev) => [newProcess, ...prev]);
    return newProcess;
  };

  const updateOnboardingTask = (
    processId: string,
    taskId: string,
    isCompleted: boolean,
    actionPayload?: any
  ) => {
    setOnboardingProcesses((prev) =>
      prev.map((p) => {
        if (p.id !== processId) return p;
        const updatedTasks = p.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                isCompleted,
                completedAt: isCompleted ? (t.completedAt || new Date().toISOString().split('T')[0]) : undefined,
                actionPayload: actionPayload ? { ...t.actionPayload, ...actionPayload } : t.actionPayload,
              }
            : t
        );
        const mandatoryCompleted = updatedTasks
          .filter((t) => t.isMandatory !== false)
          .every((t) => t.isCompleted);
        return {
          ...p,
          tasks: updatedTasks,
          status: mandatoryCompleted ? 'Completed' : 'In Progress',
        };
      })
    );
  };

  const completeOnboardingProcess = (processId: string): Employee | null => {
    const process = onboardingProcesses.find((p) => p.id === processId);
    if (!process) return null;

    // If employee already linked or exists, just mark completed
    if (process.createdEmployeeId) {
      const existing = employees.find((e) => e.id === process.createdEmployeeId);
      if (existing) {
        setOnboardingProcesses((prev) =>
          prev.map((p) => (p.id === processId ? { ...p, status: 'Completed' } : p))
        );
        return existing;
      }
    }

    const existingByName = employees.find(
      (e) => e.fullName.toLowerCase() === process.employeeName.toLowerCase()
    );
    if (existingByName) {
      setOnboardingProcesses((prev) =>
        prev.map((p) =>
          p.id === processId ? { ...p, status: 'Completed', createdEmployeeId: existingByName.id } : p
        )
      );
      return existingByName;
    }

    const seq = employees.length + 1;
    const isTetap = process.employmentType === 'Tetap';
    const code = currentTenant.code;
    const docNumber =
      process.contractDocNumber ||
      `${String(seq).padStart(3, '0')}/HRD-${isTetap ? 'SK-TETAP' : 'PKWT'}/${code}/X/2026`;

    const newEmp = addEmployee({
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

    setOnboardingProcesses((prev) =>
      prev.map((p) =>
        p.id === processId ? { ...p, status: 'Completed', createdEmployeeId: newEmp.id } : p
      )
    );

    return newEmp;
  };

  // 14. Shifts & Roaster Actions
  const addShiftSwapRequest = (swap: Omit<ShiftSwapRequest, 'id' | 'tenantId' | 'status'>) => {
    const newSwap: ShiftSwapRequest = {
      ...swap,
      id: `swap-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu',
    };
    setShiftSwaps((prev) => [newSwap, ...prev]);

    // Add to approval hub
    const requester = employees.find((e) => e.id === swap.requesterId);
    setApprovalItems((prev) => [
      {
        id: `appr-sw-${Date.now()}`,
        tenantId: currentTenant.id,
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
      },
      ...prev,
    ]);
  };

  const reviewShiftSwapRequest = (id: string, approved: boolean) => {
    setShiftSwaps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name } : s))
    );
    setApprovalItems((prev) =>
      prev.map((a) => (a.referenceId === id ? { ...a, status: approved ? 'Disetujui' : 'Ditolak' } : a))
    );
  };

  // 15. Attendance Corrections Actions
  const submitAttendanceCorrection = (req: Omit<AttendanceCorrectionRequest, 'id' | 'tenantId' | 'status'>) => {
    const newReq: AttendanceCorrectionRequest = {
      ...req,
      id: `cor-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu',
    };
    setAttendanceCorrections((prev) => [newReq, ...prev]);

    const requester = employees.find((e) => e.id === req.employeeId);
    setApprovalItems((prev) => [
      {
        id: `appr-cor-${Date.now()}`,
        tenantId: currentTenant.id,
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
      },
      ...prev,
    ]);
  };

  const reviewAttendanceCorrection = (id: string, approved: boolean) => {
    setAttendanceCorrections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name } : c))
    );
    setApprovalItems((prev) =>
      prev.map((a) => (a.referenceId === id ? { ...a, status: approved ? 'Disetujui' : 'Ditolak' } : a))
    );
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
    setApprovalItems((prev) => [
      {
        id: `appr-tr-${Date.now()}`,
        tenantId: currentTenant.id,
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
      },
      ...prev,
    ]);
  };

  const reviewBusinessTrip = (id: string, status: BusinessTripRequest['status']) => {
    setBusinessTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, approvedBy: currentUser.name } : t))
    );
    setApprovalItems((prev) =>
      prev.map((a) => (a.referenceId === id ? { ...a, status: status === 'Disetujui Atasan' || status === 'Disetujui Finance' ? 'Disetujui' : 'Ditolak' } : a))
    );
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
        setApprovalItems((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  level: nextLevel,
                  assignedApproverRole: nextRole,
                  notes: notes ? `${a.notes || ''} [L${item.level}: ${notes}]` : a.notes,
                }
              : a
          )
        );
        logAuditAction('Approval Center', 'LEVEL_UP', id, `Approval level ${item.level} disetujui, lanjut ke level ${nextLevel}`);
        return;
      }

      // Final Level Approved!
      setApprovalItems((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'Disetujui', notes: notes ? `${a.notes || ''} [Final: ${notes}]` : a.notes }
            : a
        )
      );

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
      }
      logAuditAction('Approval Center', 'APPROVE_FINAL', id, `Persetujuan final selesai untuk kategori ${item.category}`);
    } else {
      setApprovalItems((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: 'Ditolak', notes: notes || a.notes } : a
        )
      );
      if (item.category === 'Cuti') {
        reviewLeaveRequest(item.referenceId, false);
      } else if (item.category === 'Pinjaman') {
        updateLoanStatus(item.referenceId, 'Menunggu Approval');
      } else if (item.category === 'Perbaikan Presensi') {
        reviewAttendanceCorrection(item.referenceId, false);
      } else if (item.category === 'Tukar Shift') {
        reviewShiftSwapRequest(item.referenceId, false);
      } else if (item.category === 'Perjalanan Dinas') {
        reviewBusinessTrip(item.referenceId, 'Menunggu Approval');
      } else if (item.category === 'Procurement PR') {
        updateProcurementStatus(item.referenceId, 'Pengajuan PR');
      } else if (item.category === 'Promosi/Personalia') {
        rejectPersonaliaRequest(item.referenceId);
      } else if (item.category === 'Lembur') {
        reviewOvertimeRequest(item.referenceId, false);
      }
      logAuditAction('Approval Center', 'REJECT', id, `Ditolak untuk kategori ${item.category}`);
    }
  };

  const setApprovalDelegation = (delegation: Omit<ApprovalDelegation, 'id' | 'tenantId'>) => {
    const newDelegation: ApprovalDelegation = {
      ...delegation,
      id: `del-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setApprovalDelegations((prev) => [newDelegation, ...prev]);
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
    setModuleSettings((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        ...updates,
      },
    }));
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

  const addUser = (userData: Omit<UserAccount, 'id' | 'tenantId'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now().toString().slice(-4)}`,
      tenantId: currentTenant.id,
      status: userData.status || 'Aktif',
    };
    setUsers((prev) => [newUser, ...prev]);
    logAuditAction('RBAC User', 'ADD_USER', newUser.id, `Pendaftaran user baru: ${newUser.name} (${newUser.email}) role ${newUser.role}`);
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (target) {
      logAuditAction('RBAC User', 'DELETE_USER', id, `Menghapus akun user ${target.name} (${target.email})`);
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

  // 22. Entity Handlers
  const addEntity = (entityData: Omit<CompanyEntity, 'id' | 'tenantId'>) => {
    const newEnt: CompanyEntity = {
      ...entityData,
      id: `ent-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setEntities((prev) => [...prev, newEnt]);
    logAuditAction('Struktur Entitas', 'TAMBAH_ENTITAS', newEnt.id, `Menambahkan entitas: ${newEnt.name}`);
  };

  const updateEntity = (id: string, updates: Partial<CompanyEntity>) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    logAuditAction('Struktur Entitas', 'UPDATE_ENTITAS', id, `Memperbarui konfigurasi entitas ${id}`);
  };

  const deleteEntity = (id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    logAuditAction('Struktur Entitas', 'HAPUS_ENTITAS', id, `Menghapus entitas ${id}`);
  };

  const toggleEntityDepartmentLevel = (entityId: string) => {
    setEntities((prev) =>
      prev.map((e) =>
        e.id === entityId ? { ...e, useDepartmentLevel: !(e.useDepartmentLevel ?? true) } : e
      )
    );
    const target = entities.find((e) => e.id === entityId);
    logAuditAction(
      'Struktur Organisasi',
      'TOGGLE_DEPT_LEVEL',
      entityId,
      `Mengubah fleksibilitas hierarki departemen pada ${target?.name || entityId}`
    );
  };

  // 22B. Divisi & Departemen Handlers
  const addDivision = (divData: Omit<CompanyDivision, 'id'>) => {
    const newDiv: CompanyDivision = {
      ...divData,
      id: `div-${Date.now()}`,
    };
    setDivisions((prev) => [...prev, newDiv]);
    logAuditAction('Struktur Divisi', 'TAMBAH_DIVISI', newDiv.id, `Menambahkan divisi: ${newDiv.name}`);
  };

  const updateDivision = (id: string, updates: Partial<CompanyDivision>) => {
    setDivisions((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    logAuditAction('Struktur Divisi', 'UPDATE_DIVISI', id, `Memperbarui divisi ${id}`);
  };

  const deleteDivision = (id: string) => {
    setDivisions((prev) => prev.filter((d) => d.id !== id));
    logAuditAction('Struktur Divisi', 'HAPUS_DIVISI', id, `Menghapus divisi ${id}`);
  };

  const addDepartment = (deptData: Omit<CompanyDepartment, 'id'>) => {
    const newDept: CompanyDepartment = {
      ...deptData,
      id: `dept-${Date.now()}`,
    };
    setDepartments((prev) => [...prev, newDept]);
    logAuditAction('Struktur Departemen', 'TAMBAH_DEPARTEMEN', newDept.id, `Menambahkan departemen: ${newDept.name}`);
  };

  const updateDepartment = (id: string, updates: Partial<CompanyDepartment>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    logAuditAction('Struktur Departemen', 'UPDATE_DEPARTEMEN', id, `Memperbarui departemen ${id}`);
  };

  const deleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    logAuditAction('Struktur Departemen', 'HAPUS_DEPARTEMEN', id, `Menghapus departemen ${id}`);
  };

  // 22B-2. Master Jabatan Handlers
  const addMasterJobPosition = (posData: Omit<MasterJobPosition, 'id'>) => {
    const newPos: MasterJobPosition = {
      ...posData,
      id: `mjp-${Date.now()}`,
    };
    setMasterJobPositions((prev) => [...prev, newPos]);
    logAuditAction('Master Jabatan', 'TAMBAH_MASTER_JABATAN', newPos.id, `Menambahkan standar jabatan: ${newPos.title}`);
  };

  const updateMasterJobPosition = (id: string, updates: Partial<MasterJobPosition>) => {
    setMasterJobPositions((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    logAuditAction('Master Jabatan', 'UPDATE_MASTER_JABATAN', id, `Memperbarui standar jabatan ${id}`);
  };

  const deleteMasterJobPosition = (id: string) => {
    setMasterJobPositions((prev) => prev.filter((p) => p.id !== id));
    logAuditAction('Master Jabatan', 'HAPUS_MASTER_JABATAN', id, `Menghapus standar jabatan ${id}`);
  };

  const assignEmployeeToPosition = (positionId: string, employeeId: string | null) => {
    setOrgNodes((prev) =>
      prev.map((node) => {
        if (node.id === positionId) {
          return {
            ...node,
            currentEmployeeId: employeeId || undefined,
            isVacant: !employeeId,
          };
        }
        return node;
      })
    );
    if (employeeId) {
      const targetNode = orgNodes.find((n) => n.id === positionId);
      if (targetNode) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === employeeId ? { ...emp, position: targetNode.title, department: targetNode.department } : emp
          )
        );
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

  const completeOnboarding = (stagingId: string): Employee | null => {
    const stg = employeeStaging.find((s) => s.id === stagingId);
    if (!stg) return null;

    const ent = entities.find((e) => e.id === stg.entityId) || currentEntity;
    const seq = employees.length + 1;
    const isTetap = stg.employmentType === 'Tetap';
    const finalNik = `${ent.code}-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const docNumber = stg.contractDocNumber || `${String(seq).padStart(3, '0')}/${ent.docPrefix}/${new Date().getFullYear()}`;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      tenantId: currentTenant.id,
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
    };

    setEmployees((prev) => [newEmp, ...prev]);

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

  // 24. Overtime Handlers
  const submitOvertimeRequest = (req: Omit<OvertimeRequest, 'id' | 'tenantId' | 'status'>) => {
    const newReq: OvertimeRequest = {
      ...req,
      id: `ovt-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu',
    };
    setOvertimeRequests((prev) => [newReq, ...prev]);

    const emp = employees.find((e) => e.id === req.employeeId);
    setApprovalItems((prev) => [
      {
        id: `appr-ovt-${Date.now()}`,
        tenantId: currentTenant.id,
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
      },
      ...prev,
    ]);

    logAuditAction('Presensi', 'SUBMIT_LEMBUR', newReq.id, `Pengajuan lembur ${req.hours} jam oleh ${emp?.fullName}`);
  };

  const reviewOvertimeRequest = (id: string, approved: boolean, approvedHours?: number, notes?: string) => {
    setOvertimeRequests((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: approved ? 'Disetujui' : 'Ditolak',
              approvedBy: currentUser.name,
              approvedHours: approvedHours || o.hours,
              notes: notes || o.notes,
            }
          : o
      )
    );
    setApprovalItems((prev) =>
      prev.map((a) => (a.referenceId === id ? { ...a, status: approved ? 'Disetujui' : 'Ditolak' } : a))
    );
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
    logAuditAction('Reimbursement', 'SUBMIT_CLAIM', newClaim.id, `Pengajuan klaim ${newClaim.category} Rp ${newClaim.amount.toLocaleString('id-ID')}`);
  };

  const reviewReimbursementClaim = (id: string, approved: boolean, notes?: string) => {
    setReimbursementClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: approved ? 'Disetujui' : 'Ditolak',
              approvedBy: currentUser.name,
              notes: notes || c.notes,
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
    setApprovalItems((prev) => [
      {
        id: `appr-pers-${Date.now()}`,
        tenantId: currentTenant.id,
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
      },
      ...prev,
    ]);

    logAuditAction('Personalia', 'SUBMIT_REQUEST', newReq.id, `Pengajuan perubahan status ${req.type} untuk ${emp?.fullName}`);
  };

  const approvePersonaliaRequest = (id: string) => {
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
  const replaceEntityStructure = (
    entityId: string,
    newDivisions: CompanyDivision[],
    newDepartments: CompanyDepartment[],
    newNodes: OrgStructureNode[],
    proposalInfo?: { skDocNumber?: string; title?: string; effectiveDate?: string; reason?: string }
  ) => {
    // 1. Simpan snapshot struktur existing sebelum direplace
    const prevDivs = divisions.filter((d) => d.entityId === entityId);
    const prevDepts = departments.filter((d) => d.entityId === entityId);
    const prevNodes = orgNodes.filter((n) => n.entityId === entityId);

    const snapshot: OrgStructureSnapshot = {
      id: `snap-${Date.now()}`,
      tenantId: currentTenant.id,
      entityId,
      skDocNumber: proposalInfo?.skDocNumber || 'SK-RESTRUCT-AUTO',
      versionTitle: `Versi Pra-Restrukturisasi: ${proposalInfo?.title || 'Penataan Struktur'}`,
      effectiveDate: proposalInfo?.effectiveDate || new Date().toISOString().split('T')[0],
      archivedAt: new Date().toISOString().split('T')[0],
      archivedBy: currentUser.name,
      reason: proposalInfo?.reason || 'Snapshot otomatis diarsipkan saat restrukturisasi resmi disetujui',
      divisions: prevDivs,
      departments: prevDepts,
      orgNodes: prevNodes,
    };

    setOrgSnapshots((prev) => [snapshot, ...prev]);

    // 2. Replace data existing entitas dengan data draft baru
    setDivisions((prev) => [...prev.filter((d) => d.entityId !== entityId), ...newDivisions]);
    setDepartments((prev) => [...prev.filter((d) => d.entityId !== entityId), ...newDepartments]);
    setOrgNodes((prev) => [...prev.filter((n) => n.entityId !== entityId), ...newNodes]);

    logAuditAction(
      'Struktur Organisasi',
      'REPLACE_STRUCTURE',
      entityId,
      `Restrukturisasi menyeluruh diterapkan untuk entitas ${entityId}. Struktur lama diarsipkan ke snapshot ID ${snapshot.id}`
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

  const addOrgNode = (node: Omit<OrgStructureNode, 'id'>) => {
    const newNode: OrgStructureNode = {
      ...node,
      id: `org-pos-${Date.now()}`,
    };
    setOrgNodes((prev) => [...prev, newNode]);
    logAuditAction('Struktur Organisasi', 'TAMBAH_POSISI', newNode.id, `Menambahkan posisi jabatan: ${newNode.title}`);
  };

  const updateOrgNode = (id: string, updates: Partial<OrgStructureNode>) => {
    setOrgNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    logAuditAction('Struktur Organisasi', 'UPDATE_POSISI', id, `Memperbarui posisi jabatan ${id}`);
  };

  const deleteOrgNode = (id: string) => {
    setOrgNodes((prev) => prev.filter((n) => n.id !== id));
    logAuditAction('Struktur Organisasi', 'HAPUS_POSISI', id, `Menghapus posisi jabatan ${id}`);
  };

  // 28. Probation Evaluations
  const submitProbationEvaluation = (evaluation: Omit<ProbationEvaluation, 'id' | 'tenantId' | 'status'>) => {
    const newEval: ProbationEvaluation = {
      ...evaluation,
      id: `prb-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu Approval',
    };
    setProbationEvaluations((prev) => [newEval, ...prev]);

    const emp = employees.find((e) => e.id === evaluation.employeeId);
    logAuditAction('Evaluasi Probation', 'SUBMIT_EVALUATION', newEval.id, `Evaluasi masa percobaan untuk ${emp?.fullName}: Rekomendasi ${evaluation.recommendation}`);
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

    setProbationEvaluations((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name } : p))
    );
  };

  // 29. Contract Reviews
  const submitContractReview = (rev: Omit<ContractRenewalReview, 'id' | 'tenantId' | 'status'>) => {
    const newRev: ContractRenewalReview = {
      ...rev,
      id: `cnt-rev-${Date.now()}`,
      tenantId: currentTenant.id,
      status: 'Menunggu Approval',
    };
    setContractReviews((prev) => [newRev, ...prev]);
    logAuditAction('Perpanjangan Kontrak', 'SUBMIT_REVIEW', newRev.id, `Review perpanjangan kontrak: Rekomendasi ${rev.recommendation}`);
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

    setContractReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: approved ? 'Disetujui' : 'Ditolak', approvedBy: currentUser.name } : r))
    );
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
    const newRange: GradeSalaryRange = {
      ...range,
      id: `grd-${Date.now()}`,
      tenantId: currentTenant.id,
    };
    setGradeSalaryRanges((prev) => [...prev, newRange]);
    logAuditAction('Grade Gaji', 'TAMBAH_GRADE', newRange.id, `Menambahkan grade ${newRange.gradeCode}`);
  };

  const updateGradeSalaryRange = (id: string, updates: Partial<GradeSalaryRange>) => {
    setGradeSalaryRanges((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGradeSalaryRange = (id: string) => {
    setGradeSalaryRanges((prev) => prev.filter((g) => g.id !== id));
    logAuditAction('Grade Gaji', 'HAPUS_GRADE', id, `Menghapus master grade ${id}`);
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

    setEmployees(INITIAL_EMPLOYEES);
    setAttendance(INITIAL_ATTENDANCE);
    setPayrollRecords(INITIAL_PAYROLL_RECORDS);
    setLoans(INITIAL_LOANS);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setComplianceRecords(INITIAL_COMPLIANCE);
    setOffboardingRecords(INITIAL_OFFBOARDING);
    setProcurementOrders(INITIAL_PROCUREMENT);
    setApprovalItems(INITIAL_APPROVALS);
    setAssets(INITIAL_ASSETS);
    setCandidates(INITIAL_CANDIDATES);
    setJobRequisitions(INITIAL_JOB_REQUISITIONS);
    setBusinessTrips(INITIAL_BUSINESS_TRIPS);
    setContractReviews(INITIAL_CONTRACT_REVIEWS);
    setProbationEvaluations(INITIAL_PROBATION_EVALUATIONS);
    setOnboardingProcesses(INITIAL_ONBOARDING);
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
        processPersonaliaAction,
        attendance: attendance.filter((a) => a.tenantId === currentTenant.id),
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
        vacancies: vacancies.filter((v) => v.id && v.tenantId === currentTenant.id),
        jobRequisitions: jobRequisitions.filter((r) => r.tenantId === currentTenant.id),
        addJobRequisition,
        updateJobRequisition,
        candidates: candidates.filter((c) => c.tenantId === currentTenant.id),
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
        onboardingProcesses: onboardingProcesses.filter((o) => o.tenantId === currentTenant.id),
        onboardingChecklistTemplates,
        addOnboardingProcess,
        updateOnboardingTask,
        completeOnboardingProcess,
        updateOnboardingChecklistTemplates,
        addChecklistTemplateItem,
        removeChecklistTemplateItem,
        shifts: shifts.filter((s) => s.tenantId === currentTenant.id),
        shiftSwaps: shiftSwaps.filter((s) => s.tenantId === currentTenant.id),
        addShiftSwapRequest,
        reviewShiftSwapRequest,
        attendanceCorrections: attendanceCorrections.filter((c) => c.tenantId === currentTenant.id),
        submitAttendanceCorrection,
        reviewAttendanceCorrection,
        businessTrips: (() => {
          const scoped = businessTrips.filter((t) => t.tenantId === currentTenant.id);
          return scoped.length > 0 ? scoped : businessTrips;
        })(),
        submitBusinessTrip,
        reviewBusinessTrip,
        approvalItems: approvalItems.filter((a) => a.tenantId === currentTenant.id),
        reviewApprovalItem,
        approvalDelegations: approvalDelegations.filter((d) => d.tenantId === currentTenant.id),
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
        entities: entities.filter((e) => e.tenantId === currentTenant.id),
        currentEntityId,
        setCurrentEntityId,
        currentEntity,
        addEntity,
        updateEntity,
        deleteEntity,
        toggleEntityDepartmentLevel,
        divisions: divisions.filter((d) => entities.some((e) => e.id === d.entityId && e.tenantId === currentTenant.id)),
        addDivision,
        updateDivision,
        deleteDivision,
        departments: departments.filter((dept) => entities.some((e) => e.id === dept.entityId && e.tenantId === currentTenant.id)),
        addDepartment,
        updateDepartment,
        deleteDepartment,
        masterJobPositions: masterJobPositions.filter((mjp) => entities.some((e) => e.id === mjp.entityId && e.tenantId === currentTenant.id)),
        addMasterJobPosition,
        updateMasterJobPosition,
        deleteMasterJobPosition,
        assignEmployeeToPosition,
        flexibleNikSettings,
        updateFlexibleNikSettings,
        generateNextNik,
        employeeStaging: employeeStaging.filter((s) => s.tenantId === currentTenant.id),
        addEmployeeStaging,
        updateEmployeeStagingTask,
        completeOnboarding,
        overtimeRequests: overtimeRequests.filter((o) => o.tenantId === currentTenant.id),
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
        orgNodes: orgNodes.filter((n) => entities.some((e) => e.id === n.entityId && e.tenantId === currentTenant.id)),
        addOrgNode,
        updateOrgNode,
        deleteOrgNode,
        orgProposals: orgProposals.filter((p) => p.tenantId === currentTenant.id),
        submitOrgProposal,
        reviewOrgProposal,
        orgSnapshots: orgSnapshots.filter((s) => s.tenantId === currentTenant.id),
        replaceEntityStructure,
        probationEvaluations: probationEvaluations.filter((p) => p.tenantId === currentTenant.id),
        submitProbationEvaluation,
        reviewProbationEvaluation,
        contractReviews: contractReviews.filter((r) => r.tenantId === currentTenant.id),
        submitContractReview,
        reviewContractReview,
        calendarEvents: calendarEvents.filter((c) => c.tenantId === currentTenant.id),
        addCalendarEvent,
        gradeSalaryRanges: gradeSalaryRanges.filter((g) => g.tenantId === currentTenant.id),
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
