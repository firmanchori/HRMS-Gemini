/**
 * Real employee (ESS) / manager (MSS) login client — server/routes/employee.ts.
 * Deliberately separate from shared/authApi.ts: that one is for app_owner/
 * tenant_admin sessions, this is for the employee_accounts session type
 * added to close the "tidak ada role karyawan sungguhan" finding.
 */
import { getCsrfHeader } from '../shared/csrf';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export class EmployeeApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getCsrfHeader() },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new EmployeeApiError(json.error || `Request failed (${res.status})`, res.status);
  return json as T;
}

export interface EmployeeSessionUser {
  id: string;
  email: string;
  roleKey: string;
  name: string;
}

/** Either a completed login, or a signal that a second (TOTP/backup code) step is still needed before a real session exists — mirrors shared/authApi.ts's LoginResult for the employee_accounts session type. */
export type EmployeeLoginResult = EmployeeSessionUser | { mfaRequired: true };

export interface EmployeeProfile {
  employee: {
    id: string;
    fullName: string;
    nik: string;
    email: string | null;
    phone: string | null;
    employmentType: string;
    status: string;
    joinDate: string | null;
  };
  roleKey: string;
  permissions: {
    attendance: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean; export: boolean };
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  workType: string | null;
  notes: string | null;
  clockInInsideRadius: boolean | null;
  clockOutInsideRadius: boolean | null;
}

export type WorkType = 'WFO' | 'WFA' | 'Perjalanan Dinas';

export interface ClockInCheckResult {
  insideRadius: boolean;
  hasAssignedLocations: boolean;
  allowedWorkTypes: WorkType[];
  requireSelfieCamera: boolean;
  withinTimeWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

export interface ClockOutCheckResult {
  insideRadius: boolean;
  withinTimeWindow: boolean;
  windowStart: string;
  windowEnd: string;
}

export interface Payslip {
  id: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtimePay: number;
  reimbursement: number;
  grossPay: number;
  bpjsKesEmployee: number;
  bpjsTkEmployee: number;
  pph21Amount: number;
  loanDeduction: number;
  lateDeduction: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  paidDate: string | null;
}

export interface ThrSlip {
  id: string;
  year: number;
  occasion: string;
  paymentDate: string;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
}

export interface LeaveBalance { entitlement: number; carried: number; used: number; pending: number; remaining: number; available: number; year: number }

export interface ApprovalItem {
  id: string;
  category: string;
  title: string;
  requesterId: string;
  status: string;
  notes: string | null;
  amount: number | null;
  level: number;
  totalLevels: number;
  submittedAt: string;
  deadlineAt: string | null;
  steps: { level: number; mode: string; label: string; approverEmployeeId: string | null; decision: string | null; decidedByName: string | null; reason: string | null }[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  attachmentUrl?: string | null;
  status: string;
  approvedBy: string | null;
  createdAt: string;
}

export const employeeApi = {
  login: (email: string, password: string) => request<EmployeeLoginResult>('/api/employee/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  /** Second step of login when login() returned { mfaRequired: true }. */
  verifyMfaLogin: (code: string) => request<EmployeeSessionUser>('/api/employee/mfa/verify-login', { method: 'POST', body: JSON.stringify({ code }) }),
  mfaStatus: () => request<{ enabled: boolean }>('/api/employee/mfa/status'),
  mfaSetup: () => request<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }>('/api/employee/mfa/setup', { method: 'POST' }),
  mfaConfirm: (code: string) => request<{ backupCodes: string[] }>('/api/employee/mfa/confirm', { method: 'POST', body: JSON.stringify({ code }) }),
  mfaDisable: (password: string) => request<{ ok: true }>('/api/employee/mfa/disable', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<EmployeeProfile>('/api/employee/me'),
  getAttendance: () => request<AttendanceRecord[]>('/api/employee/attendance'),
  checkClockIn: (lat: number, lng: number) =>
    request<ClockInCheckResult>('/api/employee/attendance/clock-in/check', { method: 'POST', body: JSON.stringify({ lat, lng }) }),
  checkClockOut: (lat: number, lng: number) =>
    request<ClockOutCheckResult>('/api/employee/attendance/clock-out/check', { method: 'POST', body: JSON.stringify({ lat, lng }) }),
  clockIn: (lat: number, lng: number, workType: WorkType) =>
    request<AttendanceRecord>('/api/employee/attendance/clock-in', { method: 'POST', body: JSON.stringify({ lat, lng, workType }) }),
  clockOut: (lat: number, lng: number) =>
    request<AttendanceRecord>('/api/employee/attendance/clock-out', { method: 'POST', body: JSON.stringify({ lat, lng }) }),
  getMyPayslips: () => request<Payslip[]>('/api/employee/my-payslips'),
  getMyThr: () => request<ThrSlip[]>('/api/employee/my-thr'),
  getLeave: () => request<LeaveRequest[]>('/api/employee/leave'),
  submitLeave: (body: { leaveType: string; startDate: string; endDate: string; totalDays: number; reason?: string; attachmentUrl?: string }) =>
    request<LeaveRequest>('/api/employee/leave', { method: 'POST', body: JSON.stringify(body) }),
  // ----- Self-service requests (server creates the approval item; the browser never sets a status) -----
  getLeaveBalance: (year?: number) => request<LeaveBalance>(`/api/employee/requests/leave-balance${year ? `?year=${year}` : ''}`),
  list: <T = Record<string, unknown>>(resource: 'overtime' | 'corrections' | 'shift-swaps' | 'loans' | 'trips' | 'colleagues' | 'my-documents' | 'team' | 'delegations') =>
    request<T[]>(`/api/employee/requests/${resource}`),
  submit: <T = Record<string, unknown>>(resource: 'overtime' | 'corrections' | 'shift-swaps' | 'loans' | 'trips' | 'delegations', body: Record<string, unknown>) =>
    request<T>(`/api/employee/requests/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
  removeDelegation: (id: string) => request<{ ok: true }>(`/api/employee/requests/delegations/${id}`, { method: 'DELETE' }),
  getReimbursements: () => request<Record<string, unknown>[]>('/api/employee/reimbursements'),
  submitReimbursement: (body: Record<string, unknown>) => request<Record<string, unknown>>('/api/employee/reimbursements', { method: 'POST', body: JSON.stringify(body) }),
  // ----- Approvals: every category goes through the Approval Engine -----
  getApprovalItems: () => request<ApprovalItem[]>('/api/employee/approval-items'),
  decideApproval: (id: string, decision: 'Disetujui' | 'Ditolak' | 'Diketahui', reason?: string) =>
    request<ApprovalItem>(`/api/employee/approval-items/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),
};
