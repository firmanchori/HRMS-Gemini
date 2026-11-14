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
  getLeave: () => request<LeaveRequest[]>('/api/employee/leave'),
  submitLeave: (body: { leaveType: string; startDate: string; endDate: string; totalDays: number; reason?: string; attachmentUrl?: string }) =>
    request<LeaveRequest>('/api/employee/leave', { method: 'POST', body: JSON.stringify(body) }),
  getApprovalQueue: () => request<LeaveRequest[]>('/api/employee/approvals/leave'),
  decideLeave: (id: string, decision: 'Disetujui' | 'Ditolak') =>
    request<LeaveRequest>(`/api/employee/approvals/leave/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
};
