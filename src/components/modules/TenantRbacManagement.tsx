import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Building,
  ShieldCheck,
  Users,
  Check,
  X,
  Plus,
  KeyRound,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { formatRupiah } from '../../utils/taxCalculator';
import { UserRole } from '../../types/hrms';

export const TenantRbacManagement: React.FC = () => {
  const {
    tenants,
    currentTenant,
    setCurrentTenantId,
    users,
    currentUser,
    setCurrentUserRole,
  } = useHrms();

  const [activeSubTab, setActiveSubTab] = useState<'rbac' | 'tenant'>('rbac');

  // Matrix Definition
  const modulesList = [
    { id: 'employees', label: 'Manajemen Karyawan & Personalia' },
    { id: 'attendance', label: 'Presensi, Cuti & Lembur' },
    { id: 'payroll', label: 'Payroll & PPh 21 TER 2024' },
    { id: 'loans', label: 'Pinjaman & Kasbon Karyawan' },
    { id: 'kpi', label: 'Penilaian Kinerja (KPI Real-time)' },
    { id: 'compliance', label: 'Kepatuhan & Sanksi SP/PHK' },
    { id: 'recruitment', label: 'Rekrutmen & Onboarding' },
    { id: 'offboarding', label: 'Offboarding & Pesangon' },
    { id: 'assets', label: 'GA & Inventaris Aset QR' },
    { id: 'procurement', label: 'Procurement (PR/PO)' },
    { id: 'documents', label: 'Tata Kelola Dokumen & TTD QR' },
    { id: 'tenants', label: 'Pengaturan Tenant & Lisensi SaaS' },
  ];

  // RBAC Permission map [Module, Role]: Read, Write, Approve, None
  const getPermission = (modId: string, role: UserRole) => {
    if (role === 'super_admin') return { read: true, write: true, approve: true };

    if (role === 'hr_admin') {
      if (['employees', 'attendance', 'kpi', 'compliance', 'recruitment', 'offboarding', 'documents'].includes(modId)) {
        return { read: true, write: true, approve: true };
      }
      if (['payroll', 'loans', 'assets'].includes(modId)) {
        return { read: true, write: false, approve: false };
      }
      return { read: false, write: false, approve: false };
    }

    if (role === 'payroll_admin') {
      if (['payroll', 'loans'].includes(modId)) {
        return { read: true, write: true, approve: true };
      }
      if (['employees', 'attendance', 'documents'].includes(modId)) {
        return { read: true, write: false, approve: false };
      }
      return { read: false, write: false, approve: false };
    }

    if (role === 'ga_admin') {
      if (['assets', 'procurement', 'documents'].includes(modId)) {
        return { read: true, write: true, approve: true };
      }
      if (['employees'].includes(modId)) {
        return { read: true, write: false, approve: false };
      }
      return { read: false, write: false, approve: false };
    }

    // employee (ESS)
    if (['attendance', 'kpi', 'loans'].includes(modId)) {
      return { read: true, write: true, approve: false };
    }
    if (['payroll', 'documents'].includes(modId)) {
      return { read: true, write: false, approve: false };
    }
    return { read: false, write: false, approve: false };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Manajemen Multi-Tenant & Matriks Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-slate-500">
            Tata kelola isolasi data multi-perusahaan, konfigurasi UMR regional, dan kontrol hak akses granular per peran.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveSubTab('rbac')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriks Hak Akses (RBAC)
          </button>
          <button
            onClick={() => setActiveSubTab('tenant')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'tenant'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Konfigurasi Tenant SaaS ({tenants.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: RBAC MATRIX */}
      {activeSubTab === 'rbac' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-xs font-bold text-slate-900">Simulasi Role Aktif Sesi Anda:</span>
                <span className="text-xs font-mono font-bold text-indigo-700 ml-2">
                  {currentUser.role.toUpperCase()}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Anda dapat berpindah peran kapan saja melalui dropdown peran di header untuk menguji pembatasan hak akses.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Read/Write
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Approve
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-1/4">Modul Sistem</th>
                  <th className="py-2.5 px-3 font-bold text-center">Super Admin</th>
                  <th className="py-2.5 px-3 font-bold text-center">HR Director</th>
                  <th className="py-2.5 px-3 font-bold text-center">Payroll Lead</th>
                  <th className="py-2.5 px-3 font-bold text-center">GA Manager</th>
                  <th className="py-2.5 px-3 font-bold text-center">Employee (ESS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modulesList.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{mod.label}</td>
                    {(['super_admin', 'hr_admin', 'payroll_admin', 'ga_admin', 'employee'] as UserRole[]).map(
                      (role) => {
                        const perm = getPermission(mod.id, role);
                        return (
                          <td key={role} className="py-2.5 px-3 text-center">
                            {perm.read ? (
                              <div className="inline-flex items-center gap-1 text-[11px] font-mono">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold ${
                                    perm.write ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {perm.write ? 'Full' : 'Read'}
                                </span>
                                {perm.approve && (
                                  <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                                    Appr
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono text-[11px]">-</span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TENANT CONFIG */}
      {activeSubTab === 'tenant' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => {
              const isCurrent = t.id === currentTenant.id;
              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {t.code}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600">
                          {t.planTier} Plan
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{t.name}</h3>
                      <p className="text-xs text-slate-500">{t.city}</p>
                    </div>

                    {isCurrent ? (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold border border-indigo-200">
                        Tenant Aktif
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentTenantId(t.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
                      >
                        Beralih ke Tenant Ini
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nomor NPWP Badan:</span>
                      <span className="font-mono font-medium text-slate-800">{t.npwp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Standar UMR Wilayah:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatRupiah(t.umr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Skema Hari Kerja:</span>
                      <span className="font-medium text-slate-800">
                        {t.workDaysPerWeek} Hari / Minggu ({t.standardWorkHours} Jam per Hari)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
