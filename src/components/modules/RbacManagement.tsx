import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  ShieldCheck,
  Users,
  Check,
  X,
  Plus,
  KeyRound,
  Lock,
  UserCheck,
  Search,
  Filter,
  Sliders,
  Building,
} from 'lucide-react';
import { UserRole, UserAccount } from '../../types/hrms';
import { EmployeeSelect } from '../common/EmployeeSelect';

export const RbacManagement: React.FC = () => {
  const {
    currentTenant,
    users,
    currentUser,
    setCurrentUserRole,
    employees,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [linkedEmpId, setLinkedEmpId] = useState(employees[0]?.id || '');

  const tenantUsers = users.filter((u) => u.tenantId === currentTenant.id);

  const modulesList = [
    { id: 'employees', label: 'Manajemen Karyawan' },
    { id: 'personalia', label: 'Personalia (Promosi/Demosi)' },
    { id: 'attendance', label: 'Presensi, Shift & Cuti' },
    { id: 'trips', label: 'Perjalanan Dinas (SPPD)' },
    { id: 'payroll', label: 'Payroll & PPh 21 TER 2024' },
    { id: 'loans', label: 'Pinjaman & Kasbon' },
    { id: 'approvals', label: 'Pusat Approval Bertingkat' },
    { id: 'kpi', label: 'Penilaian Kinerja (KPI Real-time)' },
    { id: 'compliance', label: 'Kepatuhan & Sanksi SP/PHK' },
    { id: 'recruitment', label: 'Rekrutmen & Onboarding' },
    { id: 'offboarding', label: 'Offboarding & Pesangon' },
    { id: 'assets', label: 'GA & Inventaris Aset QR' },
    { id: 'procurement', label: 'Procurement (PR/PO & Vendor)' },
    { id: 'documents', label: 'Tata Kelola Dokumen & TTD QR' },
  ];

  const getPermission = (modId: string, role: UserRole) => {
    if (role === 'super_admin') return { view: true, create: true, edit: true, delete: true, approve: true, export: true };

    if (role === 'hr_admin') {
      const isHRCore = ['employees', 'personalia', 'attendance', 'trips', 'kpi', 'compliance', 'recruitment', 'offboarding', 'documents', 'approvals'].includes(modId);
      if (isHRCore) {
        return { view: true, create: true, edit: true, delete: false, approve: true, export: true };
      }
      if (['payroll', 'loans', 'assets'].includes(modId)) {
        return { view: true, create: false, edit: false, delete: false, approve: false, export: true };
      }
      return { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    }

    if (role === 'payroll_admin') {
      if (['payroll', 'loans', 'approvals'].includes(modId)) {
        return { view: true, create: true, edit: true, delete: false, approve: true, export: true };
      }
      if (['employees', 'attendance', 'documents'].includes(modId)) {
        return { view: true, create: false, edit: false, delete: false, approve: false, export: false };
      }
      return { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    }

    if (role === 'ga_admin') {
      if (['assets', 'procurement', 'documents', 'approvals'].includes(modId)) {
        return { view: true, create: true, edit: true, delete: false, approve: true, export: true };
      }
      if (['employees'].includes(modId)) {
        return { view: true, create: false, edit: false, delete: false, approve: false, export: false };
      }
      return { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    }

    if (role === 'manager') {
      if (['attendance', 'trips', 'kpi', 'approvals'].includes(modId)) {
        return { view: true, create: true, edit: true, delete: false, approve: true, export: true };
      }
      if (['employees', 'personalia', 'loans', 'procurement'].includes(modId)) {
        return { view: true, create: true, edit: false, delete: false, approve: false, export: false };
      }
      return { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    }

    // employee (ESS)
    if (['attendance', 'trips', 'kpi', 'loans'].includes(modId)) {
      return { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    }
    if (['payroll', 'documents'].includes(modId)) {
      return { view: true, create: false, edit: false, delete: false, approve: false, export: false };
    }
    return { view: false, create: false, edit: false, delete: false, approve: false, export: false };
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    alert(`User baru ${newUserName} berhasil didaftarkan dengan peran ${newUserRole}`);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>Manajemen User Akun & Matriks Hak Akses (RBAC Perusahaan)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Khusus Admin Perusahaan: Kelola akun pengguna internal {currentTenant.name}, penetapan peran, serta izin granular (View, Create, Edit, Delete, Approve, Export).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Akun User
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriks Hak Akses Modul
            </button>
          </div>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah User Akun</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Role Tester */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-700" />
              <div>
                <span className="font-bold text-slate-900">Uji Coba Hak Akses Role Langsung:</span>
                <span className="text-slate-600 ml-1">
                  Pilih role untuk mensimulasikan tampilan sistem sesuai otorisasi pengguna.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {[
                { r: 'super_admin', label: 'Super Admin' },
                { r: 'hr_admin', label: 'HR Admin' },
                { r: 'payroll_admin', label: 'Payroll' },
                { r: 'ga_admin', label: 'GA Admin' },
                { r: 'manager', label: 'Manager' },
                { r: 'employee', label: 'Staff (ESS)' },
              ].map(({ r, label }) => (
                <button
                  key={r}
                  onClick={() => setCurrentUserRole(r as UserRole)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    currentUser.role === r
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Pengguna</th>
                    <th className="py-2.5 px-3 font-semibold">Email Login</th>
                    <th className="py-2.5 px-3 font-semibold">Peran Sistem (Role)</th>
                    <th className="py-2.5 px-3 font-semibold">Karyawan Terkait</th>
                    <th className="py-2.5 px-3 font-semibold">Status Akun</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenantUsers.map((user) => {
                    const emp = employees.find((e) => e.id === user.employeeId);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{user.email}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              user.role === 'super_admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'hr_admin'
                                ? 'bg-indigo-100 text-indigo-800'
                                : user.role === 'payroll_admin'
                                ? 'bg-blue-100 text-blue-800'
                                : user.role === 'ga_admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {emp ? (
                            <div>
                              <div className="font-semibold text-slate-800">{emp.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{emp.nik} · {emp.position}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Tidak ditautkan</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Aktif</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => alert(`Reset password untuk ${user.name}`)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            Matriks hak akses menetapkan izin operasi pengguna pada modul: <span className="font-semibold text-slate-900">View (Lihat)</span>, <span className="font-semibold text-slate-900">Create (Tambah)</span>, <span className="font-semibold text-slate-900">Edit (Ubah)</span>, <span className="font-semibold text-slate-900">Delete (Hapus)</span>, <span className="font-semibold text-slate-900">Approve (Persetujuan)</span>, dan <span className="font-semibold text-slate-900">Export (Cetak/Excel)</span>.
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Modul HRMS</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Super Admin</th>
                    <th className="py-2.5 px-3 font-semibold text-center">HR Admin</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Payroll Admin</th>
                    <th className="py-2.5 px-3 font-semibold text-center">GA Admin</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Manager</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Staff ESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modulesList.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{mod.label}</td>
                      {(['super_admin', 'hr_admin', 'payroll_admin', 'ga_admin', 'manager', 'employee'] as UserRole[]).map((r) => {
                        const perm = getPermission(mod.id, r);
                        return (
                          <td key={r} className="py-2.5 px-3 text-center">
                            {perm.view ? (
                              <div className="inline-flex items-center gap-1 font-mono text-[10px]">
                                <span className={perm.view ? 'text-emerald-700 font-bold' : 'text-slate-300'}>V</span>
                                <span className={perm.create ? 'text-indigo-700 font-bold' : 'text-slate-300'}>C</span>
                                <span className={perm.edit ? 'text-blue-700 font-bold' : 'text-slate-300'}>E</span>
                                <span className={perm.delete ? 'text-rose-700 font-bold' : 'text-slate-300'}>D</span>
                                <span className={perm.approve ? 'text-amber-700 font-bold' : 'text-slate-300'}>A</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Tambah Akun Pengguna Baru</h3>
                <span className="text-[11px] text-slate-400">Otorisasi sistem {currentTenant.name}</span>
              </div>
              <button onClick={() => setIsAddUserModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Nama Lengkap Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Pratama"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Email Login Perusahaan *</label>
                <input
                  type="email"
                  required
                  placeholder="rian.pratama@nusantara.id"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Peran Otorisasi (Role) *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-semibold"
                >
                  <option value="employee">Staff (ESS Mandiri)</option>
                  <option value="manager">Manager / Atasan Tim</option>
                  <option value="hr_admin">HR Administrator</option>
                  <option value="payroll_admin">Payroll & Tax Specialist</option>
                  <option value="ga_admin">General Affairs Administrator</option>
                  <option value="super_admin">Super Administrator Perusahaan</option>
                </select>
              </div>

              <EmployeeSelect
                label="Tautkan dengan Data Karyawan (Opsional)"
                employees={employees}
                value={linkedEmpId}
                onChange={setLinkedEmpId}
              />

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Buat Akun User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
