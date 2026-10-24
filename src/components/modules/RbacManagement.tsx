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
  Edit2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Save,
  Trash2,
} from 'lucide-react';
import { UserRole, UserAccount, RoleDefinition, OperationPermissions } from '../../types/hrms';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const RbacManagement: React.FC = () => {
  const {
    currentTenant,
    users = [],
    currentUser,
    setCurrentUserRole,
    employees = [],
    roles = [],
    addRole,
    deleteRole,
    addUser,
    deleteUser,
    rolePermissions = {},
    updateRolePermission,
    getRolePermission,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<RoleDefinition | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Form State for User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('employee');
  const [linkedEmpId, setLinkedEmpId] = useState(employees[0]?.id || '');

  // Form State for New Role
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    key: '',
    description: '',
    copyFrom: 'employee',
  });

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
    { id: 'audit_trail', label: 'Audit Trail & Keamanan' },
    { id: 'calendar', label: 'Kalender Perusahaan' },
  ];

  // Dynamic permission resolver - purely data-driven without hardcoded role if-branches
  const getPermission = (modId: string, roleKey: string): OperationPermissions => {
    return getRolePermission(modId, roleKey);
  };

  // Quick toggle single operation permission
  const handleToggleOperation = (modId: string, roleKey: string, op: keyof OperationPermissions) => {
    const current = getPermission(modId, roleKey);
    updateRolePermission(modId, roleKey, op, !current[op]);
    setFeedbackNotice(`Izin [${op.toUpperCase()}] untuk role ${roleKey} pada modul ${modId} diperbarui.`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name.trim() || !newRoleForm.key.trim()) return;

    const formattedKey = newRoleForm.key.trim().toLowerCase().replace(/\s+/g, '_');
    if (roles.some((r) => r.id === formattedKey)) {
      alert(`Role dengan kode '${formattedKey}' sudah terdaftar.`);
      return;
    }

    const newRole: RoleDefinition = {
      id: formattedKey,
      label: newRoleForm.name.trim(),
      description: newRoleForm.description.trim() || 'Role kustom yang dibuat oleh administrator',
      badgeClass: 'bg-teal-100 text-teal-800',
      isSystem: false,
    };

    addRole(newRole, newRoleForm.copyFrom);
    setIsAddRoleModalOpen(false);
    setNewRoleForm({ name: '', key: '', description: '', copyFrom: 'employee' });
    setFeedbackNotice(`Role baru "${newRole.label}" berhasil dibuat dan disimpan.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    addUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole as UserRole,
      employeeId: linkedEmpId || undefined,
      department: 'Head Office',
      status: 'Aktif',
    });

    setFeedbackNotice(`User baru ${newUserName} berhasil didaftarkan sebagai role ${newUserRole}`);
    setTimeout(() => setFeedbackNotice(null), 4000);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Module Header & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>Manajemen User Akun & Matriks Hak Akses (RBAC Perusahaan)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Khusus Admin Perusahaan: Kelola akun pengguna internal {currentTenant.name}, tambah role baru, serta atur izin operasi granular (View, Create, Edit, Delete, Approve, Export).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tambah Role Baru</span>
          </button>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah User Akun</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Row 2: Standard Enterprise Scrollable Tab Navigation (With Icons) */}
      <ScrollableTabNav>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Akun Pengguna</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'matrix'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriks Hak Akses Modul (RBAC)</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {roles.length} Role
          </span>
        </button>
      </ScrollableTabNav>

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
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setCurrentUserRole(r.id as UserRole)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    currentUser.role === r.id
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
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
                          {(() => {
                            const roleDef = roles.find((r) => r.id === user.role);
                            return (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  roleDef?.badgeClass || 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {roleDef?.label || user.role}
                              </span>
                            );
                          })()}
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
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => alert(`Reset password untuk ${user.name}`)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Reset
                            </button>
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus akun user "${user.name}"?`)) {
                                    deleteUser(user.id);
                                  }
                                }}
                                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                                title="Hapus User"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
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
          {/* Quick Toolbar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">
                  Matriks Hak Akses Modul Granular (RBAC & Operasional)
                </span>
              </div>
              <p className="text-slate-500">
                Klik langsung pada huruf kode izin <b>[V] [C] [E] [D] [A] [X]</b> untuk menyalakan/mematikan operasi, atau klik <b>"Atur Izin"</b> pada kolom role.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAddRoleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Role Baru</span>
              </button>
            </div>
          </div>

          {/* Operation Codes Legend */}
          <div className="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">Keterangan Izin Operasi:</span>
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">V</span> View (Melihat Data)
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">C</span> Create (Membuat Baru)
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">E</span> Edit (Mengubah Data)
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">D</span> Delete (Menghapus Data)
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">A</span> Approve (Persetujuan)
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">X</span> Export (Unduh Excel/PDF)
            </span>
          </div>

          {/* Dynamic Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-3 px-3.5 font-bold min-w-[200px]">Modul Sistem HRMS</th>
                    {roles.map((r) => (
                      <th key={r.id} className="py-3 px-3 text-center min-w-[130px]">
                        <div className="font-bold text-slate-900 flex items-center justify-center gap-1.5">
                          <span>{r.label}</span>
                          {!r.isSystem && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus role kustom "${r.label}"?`)) {
                                  deleteRole(r.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                              title="Hapus Role Kustom Ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedRoleForEdit(r)}
                          className="mt-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Atur Izin</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modulesList.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                        {mod.label}
                      </td>
                      {roles.map((r) => {
                        const perm = getPermission(mod.id, r.id);
                        return (
                          <td key={r.id} className="py-2.5 px-2 text-center">
                            <div className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-50 p-1 rounded-md border border-slate-200/80">
                              <button
                                type="button"
                                title={`Toggle View ${mod.label}`}
                                onClick={() => handleToggleOperation(mod.id, r.id, 'view')}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors ${
                                  perm.view
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                V
                              </button>
                              <button
                                type="button"
                                title={`Toggle Create ${mod.label}`}
                                onClick={() => handleToggleOperation(mod.id, r.id, 'create')}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors ${
                                  perm.create
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                C
                              </button>
                              <button
                                type="button"
                                title={`Toggle Edit ${mod.label}`}
                                onClick={() => handleToggleOperation(mod.id, r.id, 'edit')}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors ${
                                  perm.edit
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                E
                              </button>
                              <button
                                type="button"
                                title={`Toggle Delete ${mod.label}`}
                                onClick={() => handleToggleOperation(mod.id, r.id, 'delete')}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors ${
                                  perm.delete
                                    ? 'bg-rose-600 text-white'
                                    : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                D
                              </button>
                              <button
                                type="button"
                                title={`Toggle Approve ${mod.label}`}
                                onClick={() => handleToggleOperation(mod.id, r.id, 'approve')}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors ${
                                  perm.approve
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                A
                              </button>
                              <button
                                type="button"
                                title={`Toggle Export ${mod.label}`}
                                onClick={() => handleToggleOperation(mod.id, r.id, 'export')}
                                className={`w-4 h-4 rounded flex items-center justify-center font-bold transition-colors ${
                                  perm.export
                                    ? 'bg-teal-600 text-white'
                                    : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                X
                              </button>
                            </div>
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

      {/* MODAL: TAMBAH ROLE BARU */}
      {isAddRoleModalOpen && (
        <div
          onClick={() => setIsAddRoleModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-fadeIn cursor-default"
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Tambah Role Otorisasi Baru</span>
                </h3>
                <span className="text-[11px] text-slate-400">Buat peran kustom internal {currentTenant.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Role *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Finance Supervisor / Site HR"
                  value={newRoleForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewRoleForm({
                      ...newRoleForm,
                      name: val,
                      key: newRoleForm.key || val.toLowerCase().replace(/\s+/g, '_'),
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode Unik Role (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="finance_supervisor"
                  value={newRoleForm.key}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Salin Template Hak Akses Awal</label>
                <select
                  value={newRoleForm.copyFrom}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, copyFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-indigo-600"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      Salin dari {r.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Izin awal akan disalin dari template ini dan dapat Anda ubah kapan saja di tabel matriks.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi & Batasan Peran</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi tugas dan tanggung jawab role ini..."
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Simpan Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATUR IZIN OPERASI PER ROLE */}
      {selectedRoleForEdit && (
        <div
          onClick={() => setSelectedRoleForEdit(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-fadeIn cursor-default"
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Atur Izin Operasi: {selectedRoleForEdit.label}</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Kode: {selectedRoleForEdit.id} · {selectedRoleForEdit.description}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoleForEdit(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                <span className="text-indigo-900 font-medium">
                  Atur hak akses operasional untuk seluruh modul:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      modulesList.forEach((m) => {
                        (['view', 'create', 'edit', 'delete', 'approve', 'export'] as (keyof OperationPermissions)[]).forEach((op) => {
                          updateRolePermission(m.id, selectedRoleForEdit.id, op, true);
                        });
                      });
                    }}
                    className="px-2 py-1 bg-white border border-indigo-300 text-indigo-700 rounded text-[11px] font-semibold hover:bg-indigo-100"
                  >
                    Beri Semua Akses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      modulesList.forEach((m) => {
                        (['view', 'create', 'edit', 'delete', 'approve', 'export'] as (keyof OperationPermissions)[]).forEach((op) => {
                          updateRolePermission(m.id, selectedRoleForEdit.id, op, false);
                        });
                      });
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded text-[11px] font-semibold hover:bg-slate-100"
                  >
                    Cabut Semua
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {modulesList.map((mod) => {
                  const perm = getPermission(mod.id, selectedRoleForEdit.id);
                  return (
                    <div key={mod.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{mod.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1.5">({mod.id})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={perm.view}
                            onChange={() => handleToggleOperation(mod.id, selectedRoleForEdit.id, 'view')}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={perm.view ? 'text-emerald-700 font-bold' : 'text-slate-400'}>View</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={perm.create}
                            onChange={() => handleToggleOperation(mod.id, selectedRoleForEdit.id, 'create')}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={perm.create ? 'text-indigo-700 font-bold' : 'text-slate-400'}>Create</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={perm.edit}
                            onChange={() => handleToggleOperation(mod.id, selectedRoleForEdit.id, 'edit')}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className={perm.edit ? 'text-blue-700 font-bold' : 'text-slate-400'}>Edit</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={perm.delete}
                            onChange={() => handleToggleOperation(mod.id, selectedRoleForEdit.id, 'delete')}
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span className={perm.delete ? 'text-rose-700 font-bold' : 'text-slate-400'}>Delete</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={perm.approve}
                            onChange={() => handleToggleOperation(mod.id, selectedRoleForEdit.id, 'approve')}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className={perm.approve ? 'text-amber-700 font-bold' : 'text-slate-400'}>Approve</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={perm.export}
                            onChange={() => handleToggleOperation(mod.id, selectedRoleForEdit.id, 'export')}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className={perm.export ? 'text-teal-700 font-bold' : 'text-slate-400'}>Export</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRoleForEdit(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Selesai Mengatur Izin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add User */}
      {isAddUserModalOpen && (
        <div
          onClick={() => setIsAddUserModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
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
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
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
