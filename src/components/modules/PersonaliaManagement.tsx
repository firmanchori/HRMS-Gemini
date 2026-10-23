import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  DollarSign,
  Plus,
  Search,
  Filter,
  FileText,
  CheckCircle,
  Building,
  Calendar,
  X,
  Settings,
  ShieldCheck,
  AlertCircle,
  MapPin,
  UserCheck,
  Clock,
  AlertTriangle,
  Layers,
  Briefcase,
  FileBadge,
} from 'lucide-react';
import { PersonaliaActionType, Employee } from '../../types/hrms';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { QRCodeView } from '../common/QRCodeView';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { formatRupiah } from '../../utils/taxCalculator';

export const PersonaliaManagement: React.FC = () => {
  const {
    employees,
    personaliaLogs,
    processPersonaliaAction,
    currentTenant,
    documents,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'log' | 'pengaturan'>('log');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<{
    log: any;
    doc: any;
  } | null>(null);

  // Form State
  const [targetEmpId, setTargetEmpId] = useState(employees[0]?.id || '');
  const [actionType, setActionType] = useState<PersonaliaActionType>('Promosi');
  
  // Dynamic fields
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newGrade, setNewGrade] = useState('L3');
  const [newSalary, setNewSalary] = useState<number>(10000000);
  const [newPositionAllowance, setNewPositionAllowance] = useState<number>(0);
  const [newFixedAllowance, setNewFixedAllowance] = useState<number>(0);
  const [newBranchLocation, setNewBranchLocation] = useState('Kantor Pusat Jakarta');
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(12);
  const [contractEndDate, setContractEndDate] = useState('2027-10-31');
  const [actingRoleExpiryDate, setActingRoleExpiryDate] = useState('2027-04-30');
  const [permanentAppointmentDate, setPermanentAppointmentDate] = useState('2026-11-01');
  const [disciplinaryLevel, setDisciplinaryLevel] = useState<'SP 1' | 'SP 2' | 'SP 3' | 'Skorsing'>('SP 1');
  const [effectiveDate, setEffectiveDate] = useState('2026-11-01');
  const [reason, setReason] = useState('');
  const [skDocNumber, setSkDocNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Settings State
  const [promosiMinMonths, setPromosiMinMonths] = useState(12);
  const [requireDirectSupervisorApproval, setRequireDirectSupervisorApproval] = useState(true);
  const [requireDirectorSignature, setRequireDirectorSignature] = useState(true);
  const [autoGenerateSK, setAutoGenerateSK] = useState(true);

  const selectedTargetEmp = employees.find((e) => e.id === targetEmpId);

  // Populate smart defaults based on employee selection and action type
  const syncFormDefaults = (emp: Employee | undefined, type: PersonaliaActionType) => {
    if (!emp) return;
    setNewPosition(emp.position);
    setNewDepartment(emp.department);
    setNewGrade(emp.grade || 'L3');
    setNewSalary(emp.basicSalary);
    setNewPositionAllowance(emp.positionAllowance || 0);
    setNewFixedAllowance(emp.fixedAllowance || 0);
    setNewBranchLocation(emp.branchLocation || 'Kantor Pusat Jakarta');

    const year = new Date().getFullYear();
    const seq = String(personaliaLogs.length + 1).padStart(3, '0');

    if (type === 'Promosi') {
      setNewPosition(emp.position.startsWith('Lead') ? `Head of ${emp.department}` : `Lead ${emp.position}`);
      setNewSalary(Math.round(emp.basicSalary * 1.2));
      setNewPositionAllowance((emp.positionAllowance || 0) + 1000000);
      setNewGrade(emp.grade === 'L3' ? 'L4' : emp.grade === 'L2' ? 'L3' : 'M1');
      setSkDocNumber(`${seq}/HRD-SK-PRO/${currentTenant.code}/XI/${year}`);
      setReason('Pencapaian KPI tahunan luar biasa (Rating A) dan lulus asesmen kompetensi manajerial.');
    } else if (type === 'Demosi') {
      setNewSalary(Math.round(emp.basicSalary * 0.9));
      setNewGrade(emp.grade === 'L4' ? 'L3' : 'L2');
      setSkDocNumber(`${seq}/HRD-SK-DEM/${currentTenant.code}/XI/${year}`);
      setReason('Penyesuaian kapasitas manajerial dan penetapan Program Peningkatan Kinerja (PIP) 90 hari.');
    } else if (type === 'Mutasi') {
      const otherDept = emp.department === 'Engineering' ? 'Product & Design' : emp.department === 'Finance' ? 'Operations' : 'Human Capital';
      setNewDepartment(otherDept);
      setNewPosition(`Specialist ${otherDept}`);
      setSkDocNumber(`${seq}/HRD-SK-MUT/${currentTenant.code}/XI/${year}`);
      setReason('Kebutuhan strategis restrukturisasi organisasi dan penguatan kapabilitas divisi penerima.');
    } else if (type === 'Rotasi Cabang') {
      setNewBranchLocation('Cabang Surabaya - Tech Hub');
      setNewFixedAllowance((emp.fixedAllowance || 0) + 2000000);
      setSkDocNumber(`${seq}/HRD-SK-ROT/${currentTenant.code}/XI/${year}`);
      setReason('Penugasan ekspansi operasional cabang regional dan supervisi standar mutu perusahaan.');
    } else if (type === 'Penyesuaian Gaji') {
      setNewSalary(Math.round(emp.basicSalary * 1.1));
      setSkDocNumber(`${seq}/HRD-SK-SAL/${currentTenant.code}/XI/${year}`);
      setReason('Penyesuaian merit rating tahunan dan penyesuaian inflasi serta standar remunerasi industri.');
    } else if (type === 'Pengangkatan Tetap') {
      setPermanentAppointmentDate('2026-11-01');
      setSkDocNumber(`${seq}/DIR-SK-TETAP/${currentTenant.code}/XI/${year}`);
      setReason('Lolos evaluasi masa percobaan 3 bulan dengan predikat Memuaskan sesuai Pasal 60 UU Ketenagakerjaan.');
    } else if (type === 'Perpanjangan Kontrak') {
      setContractDurationMonths(12);
      setContractEndDate('2027-10-31');
      setSkDocNumber(`${seq}/ADD-PKWT/${currentTenant.code}/XI/${year}`);
      setReason('Perpanjangan jangka waktu PKWT tahap II berdasarkan Pasal 59 UU No. 11/2020 jo PP 35/2021.');
    } else if (type === 'Penetapan Plt') {
      setNewPosition(`Plt. Head of ${emp.department}`);
      setActingRoleExpiryDate('2027-04-30');
      setNewPositionAllowance((emp.positionAllowance || 0) + 2500000);
      setSkDocNumber(`${seq}/HRD-SK-PLT/${currentTenant.code}/XI/${year}`);
      setReason('Mengisi kekosongan kepemimpinan divisi sementara maksimal 6 bulan hingga pejabat definitif ditetapkan.');
    }
  };

  const handleSelectEmployee = (id: string) => {
    setTargetEmpId(id);
    if (formError) setFormError(null);
    const emp = employees.find((e) => e.id === id);
    syncFormDefaults(emp, actionType);
  };

  const handleActionTypeChange = (newType: PersonaliaActionType) => {
    setActionType(newType);
    if (formError) setFormError(null);
    syncFormDefaults(selectedTargetEmp, newType);
  };

  const filteredLogs = personaliaLogs.filter((log) => {
    const emp = employees.find((e) => e.id === log.employeeId);
    const matchesSearch =
      (emp?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp?.nik || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.letterNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);
    setFormError(null);

    if (!targetEmpId) {
      setFormError('Pilih karyawan target yang akan diproses personalia.');
      return;
    }
    if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      setFormError('Format tanggal efektif tidak valid (wajib YYYY-MM-DD).');
      return;
    }

    if (!newSalary || newSalary < (currentTenant.umr || 3000000)) {
      setFormError(`Gaji pokok tidak boleh lebih kecil dari standar UMR regional (${formatRupiah(currentTenant.umr)}).`);
      return;
    }

    if (actionType === 'Promosi' || actionType === 'Demosi' || actionType === 'Mutasi' || actionType === 'Penetapan Plt') {
      if (!newPosition.trim()) {
        setFormError('Nama jabatan baru / definitif wajib diisi.');
        return;
      }
    }

    if (actionType === 'Mutasi' && !newDepartment.trim()) {
      setFormError('Departemen tujuan mutasi wajib ditentukan.');
      return;
    }

    if (actionType === 'Perpanjangan Kontrak' && !contractEndDate) {
      setFormError('Tanggal akhir masa perpanjangan kontrak wajib diisi.');
      return;
    }

    processPersonaliaAction({
      employeeId: targetEmpId,
      type: actionType,
      newPosition: newPosition.trim(),
      newDepartment: newDepartment.trim(),
      newGrade,
      newSalary: Number(newSalary),
      newPositionAllowance: Number(newPositionAllowance),
      newFixedAllowance: Number(newFixedAllowance),
      newBranchLocation,
      contractDurationMonths: Number(contractDurationMonths),
      contractEndDate,
      actingRoleExpiryDate,
      permanentAppointmentDate,
      disciplinaryLevel,
      reason: reason || `Penetapan tindakan personalia resmi: ${actionType}`,
      effectiveDate,
      skDocNumber: skDocNumber.trim(),
      notes: reason,
    });

    setIsModalOpen(false);
    setReason('');
    setShowValidationErrors(false);
  };

  const handleOpenSK = (log: any) => {
    const doc = documents.find((d) => d.documentNumber === log.letterNumber) || {
      documentNumber: log.letterNumber,
      title: `Surat Keputusan ${log.type}`,
      issueDate: log.effectiveDate,
      signeeName: log.approvedBy || 'Ir. Budi Santoso',
      signeeRole: 'President Director & CEO',
      qrVerificationUrl: `https://nusahr.enterprise/verify?doc=${log.letterNumber.replace(/\//g, '-')}`,
      contentPreview: `Berdasarkan evaluasi kinerja berkala, ditetapkan keputusan resmi ${log.type} dari jabatan lama ${log.previousPosition} menjadi ${log.newPosition} dengan gaji penyesuaian ${formatRupiah(log.newSalary)}.`,
    };
    setSelectedLetter({ log, doc });
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'Promosi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <ArrowUpRight className="w-3 h-3" /> Promosi Jabatan
          </span>
        );
      case 'Demosi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
            <ArrowDownRight className="w-3 h-3" /> Demosi
          </span>
        );
      case 'Mutasi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
            <Repeat className="w-3 h-3" /> Mutasi Divisi
          </span>
        );
      case 'Rotasi Cabang':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
            <MapPin className="w-3 h-3" /> Rotasi Cabang
          </span>
        );
      case 'Penyesuaian Gaji':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3" /> Kenaikan Gaji
          </span>
        );
      case 'Pengangkatan Tetap':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
            <UserCheck className="w-3 h-3" /> Pengangkatan Tetap (PKWTT)
          </span>
        );
      case 'Perpanjangan Kontrak':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Addendum PKWT
          </span>
        );
      case 'Penetapan Plt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800">
            <Briefcase className="w-3 h-3" /> Pejabat Sementara (Plt)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
            <FileBadge className="w-3 h-3" /> {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Tindakan Personalia & Pergerakan Karier Karyawan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Modul resmi pengelolaan Promosi, Demosi, Mutasi, Rotasi Cabang, Pengangkatan PKWTT, Addendum Kontrak, Plt, dan Sanksi Disiplin berlandaskan UU Ketenagakerjaan & PP 35/2021.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs whitespace-nowrap shadow-2xs">
              <button
                onClick={() => setActiveTab('log')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'log'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riwayat SK Personalia
              </button>
              <button
                onClick={() => setActiveTab('pengaturan')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'pengaturan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Aturan & Kebijakan</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              syncFormDefaults(selectedTargetEmp, actionType);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Tindakan Personalia</span>
          </button>
        </div>
      </div>

      {activeTab === 'log' && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Promosi & Tetap</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  {personaliaLogs.filter((l) => l.type === 'Promosi' || l.type === 'Pengangkatan Tetap').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Karier & status tetap</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Mutasi & Rotasi</span>
                <span className="text-lg font-bold font-mono text-indigo-700">
                  {personaliaLogs.filter((l) => l.type === 'Mutasi' || l.type === 'Rotasi Cabang').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Perpindahan fungsi/site</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Repeat className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Penyesuaian Gaji</span>
                <span className="text-lg font-bold font-mono text-blue-700">
                  {personaliaLogs.filter((l) => l.type === 'Penyesuaian Gaji').length}
                </span>
                <span className="text-[10px] text-slate-400 block">Kenaikan merit berkala</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Addendum & Lainnya</span>
                <span className="text-lg font-bold font-mono text-amber-700">
                  {personaliaLogs.filter((l) => l.type === 'Perpanjangan Kontrak' || l.type === 'Penetapan Plt' || l.type === 'Demosi').length}
                </span>
                <span className="text-[10px] text-slate-400 block">PKWT & penugasan</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama karyawan, NIK, atau nomor SK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-slate-300 rounded-md py-1.5 px-3 bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Jenis Tindakan Personalia (8 Jenis)</option>
                <option value="Promosi">Promosi Jabatan / Grade</option>
                <option value="Demosi">Demosi Jabatan</option>
                <option value="Mutasi">Mutasi Antar Departemen</option>
                <option value="Rotasi Cabang">Rotasi Cabang / Site</option>
                <option value="Penyesuaian Gaji">Penyesuaian Gaji Pokok</option>
                <option value="Pengangkatan Tetap">Pengangkatan Karyawan Tetap (PKWTT)</option>
                <option value="Perpanjangan Kontrak">Perpanjangan Kontrak (PKWT)</option>
                <option value="Penetapan Plt">Penetapan Pejabat Sementara (Plt)</option>
              </select>
            </div>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const emp = employees.find((e) => e.id === log.employeeId);
                return (
                  <div
                    key={log.id}
                    onClick={() => handleOpenSK(log)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                  >
                    {/* Header: Employee & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {emp?.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {(emp?.fullName || 'KR')[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{emp?.fullName || 'Karyawan'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.department}</div>
                        </div>
                      </div>

                      <div className="shrink-0">{renderBadge(log.type)}</div>
                    </div>

                    {/* Position Change */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Perubahan Posisi / Jabatan</span>
                      {log.previousPosition !== log.newPosition ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-400 line-through text-[11px]">{log.previousPosition}</span>
                          <span className="text-indigo-600 font-bold">→</span>
                          <span className="font-bold text-slate-900 text-xs">{log.newPosition}</span>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-900 text-xs">{log.newPosition}</div>
                      )}
                      {log.newDepartment && log.newDepartment !== log.previousDepartment && (
                        <div className="text-[10px] text-indigo-600 font-medium">Divisi Baru: {log.newDepartment}</div>
                      )}
                      {log.newBranchLocation && (
                        <div className="text-[10px] text-purple-600 font-medium">Lokasi: {log.newBranchLocation}</div>
                      )}
                    </div>

                    {/* Salary & Effective Date Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gaji Pokok Baru:</span>
                        {log.newSalary ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900">{formatRupiah(log.newSalary)}</span>
                            {log.newSalary > log.previousSalary && (
                              <span className="text-[10px] text-emerald-600 font-semibold block">
                                +{formatRupiah(log.newSalary - log.previousSalary)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tanggal Efektif:</span>
                        <span className="font-mono font-semibold text-slate-800 text-[11px]">{log.effectiveDate}</span>
                        <div className="text-[10px] text-indigo-700 font-mono truncate mt-0.5">{log.letterNumber}</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">Ketuk untuk membaca Surat Keputusan</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSK(log);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-md border border-indigo-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat SK Resmi</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Belum ada riwayat tindakan personalia yang sesuai filter.
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP: Table (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Karyawan</th>
                    <th className="py-2.5 px-3 font-semibold">Jenis Tindakan</th>
                    <th className="py-2.5 px-3 font-semibold">Perubahan Jabatan / Posisi</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Remunerasi Pokok</th>
                    <th className="py-2.5 px-3 font-semibold">Tanggal Efektif</th>
                    <th className="py-2.5 px-3 font-semibold">Nomor SK Resmi</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const emp = employees.find((e) => e.id === log.employeeId);
                      return (
                        <tr
                          key={log.id}
                          onClick={() => handleOpenSK(log)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              {emp?.avatar ? (
                                <img
                                  src={emp.avatar}
                                  alt={emp.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                  {(emp?.fullName || 'KR')[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{emp?.nik} · {emp?.department}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {renderBadge(log.type)}
                          </td>
                          <td className="py-2.5 px-3">
                            {log.previousPosition !== log.newPosition ? (
                              <div>
                                <div className="text-slate-400 line-through text-[10px]">{log.previousPosition}</div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1">
                                  <span>→</span>
                                  <span>{log.newPosition}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="font-semibold text-slate-900">{log.newPosition}</div>
                            )}
                            {log.newDepartment && log.newDepartment !== log.previousDepartment && (
                              <span className="text-[10px] text-indigo-600 block">Divisi: {log.newDepartment}</span>
                            )}
                            {log.newBranchLocation && (
                              <span className="text-[10px] text-purple-600 block">Lokasi: {log.newBranchLocation}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {log.newSalary ? (
                              <>
                                <div className="text-slate-400 line-through text-[10px]">
                                  {formatRupiah(log.previousSalary)}
                                </div>
                                <div className="font-mono font-bold text-slate-900">
                                  {formatRupiah(log.newSalary)}
                                </div>
                                {log.newSalary > log.previousSalary && (
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    +{formatRupiah(log.newSalary - log.previousSalary)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                            {log.effectiveDate}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-indigo-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                              {log.letterNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSK(log);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 border border-slate-200 rounded font-medium text-[11px] transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Lihat SK</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada riwayat tindakan personalia yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Konfigurasi Kebijakan Tindakan Personalia & Karier
            </h3>
            <p className="text-xs text-slate-500">
              Pengaturan syarat kelayakan promosi, penandatanganan SK digital, serta kepatuhan hukum ketenagakerjaan.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <label className="font-semibold text-slate-800 block">
                Masa Kerja Minimal Sebelum Promosi (Bulan)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={promosiMinMonths}
                  onChange={(e) => setPromosiMinMonths(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                />
                <span className="text-slate-500">Bulan sejak tanggal bergabung (Join Date)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Wajib Approval Atasan Langsung & Kepala Divisi
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pengajuan promosi atau mutasi harus diverifikasi terlebih dahulu sebelum diterbitkan SK oleh Direksi
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requireDirectSupervisorApproval}
                  onChange={(e) => setRequireDirectSupervisorApproval(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Tanda Tangan Direksi pada SK Resmi
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sertakan nama Direktur Utama / VP Human Capital dalam QR Code tanda tangan digital
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requireDirectorSignature}
                  onChange={(e) => setRequireDirectorSignature(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Otomatisasi Penomoran Dokumen SK & Integrasi Arsip
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Setiap tindakan langsung mencatat berkas di menu Dokumen Legal Perusahaan
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoGenerateSK}
                  onChange={(e) => setAutoGenerateSK(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Isian Dinamis Tindakan Personalia */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">Pengajuan Tindakan Personalia Resmi</h3>
                  <span className="text-[11px] text-slate-400">
                    Penerbitan Surat Keputusan (SK) dan sinkronisasi profil master karyawan
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setShowValidationErrors(false);
                }}
              >
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Employee Picker */}
              <div>
                <EmployeeSelect
                  label="Pilih Karyawan Target *"
                  required
                  employees={employees}
                  value={targetEmpId}
                  onChange={handleSelectEmployee}
                />
              </div>

              {/* Action Type Selector (9 Enterprise Types) */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Pilih Jenis Tindakan Personalia *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => handleActionTypeChange(e.target.value as PersonaliaActionType)}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-md bg-white font-semibold text-slate-900 shadow-xs outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Promosi">1. Promosi Jabatan & Kenaikan Grade (Karier Naik)</option>
                  <option value="Demosi">2. Demosi Jabatan & Penyesuaian Performa</option>
                  <option value="Mutasi">3. Mutasi Antar Divisi / Departemen</option>
                  <option value="Rotasi Cabang">4. Rotasi Cabang / Penempatan Luar Kota</option>
                  <option value="Penyesuaian Gaji">5. Penyesuaian Gaji Pokok (Merit Rating / Inflasi)</option>
                  <option value="Pengangkatan Tetap">6. Pengangkatan Karyawan Tetap (PKWT ke PKWTT)</option>
                  <option value="Perpanjangan Kontrak">7. Perpanjangan Masa Kontrak (Addendum PKWT)</option>
                  <option value="Penetapan Plt">8. Penetapan Pejabat Sementara (Acting Role / Plt)</option>
                </select>
                <p className="text-[11px] text-slate-500 italic">
                  Formulir isian di bawah akan otomatis menyesuaikan bidang data yang relevan dengan tindakan di atas.
                </p>
              </div>

              {/* Effective Date & Doc Number */}
              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="personaliaEffectiveDate"
                  label="Tanggal Efektif Berlakunya SK *"
                  value={effectiveDate}
                  onChange={(val) => {
                    setEffectiveDate(val);
                    if (formError) setFormError(null);
                  }}
                  required
                  showError={showValidationErrors}
                  helperText="Format YYYY-MM-DD"
                />

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nomor SK Resmi *</label>
                  <input
                    type="text"
                    required
                    value={skDocNumber}
                    onChange={(e) => setSkDocNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-semibold text-indigo-700 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format resmi SK Perusahaan</span>
                </div>
              </div>

              {/* DYNAMIC FIELDSETS ACCORDING TO ACTION TYPE */}
              
              {/* 1. PROMOSI JABATAN */}
              {actionType === 'Promosi' && (
                <div className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-3">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Parameter Promosi Jabatan & Jenjang Karier</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Jabatan / Posisi Baru *</label>
                      <input
                        type="text"
                        required
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        placeholder="Contoh: Principal Software Engineer"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Grade Golongan Baru</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono"
                      >
                        <option value="L1">L1 - Entry Level / Junior</option>
                        <option value="L2">L2 - Associate Specialist</option>
                        <option value="L3">L3 - Senior Specialist</option>
                        <option value="L4">L4 - Principal / Lead</option>
                        <option value="M1">M1 - Assistant Manager</option>
                        <option value="M2">M2 - Senior Manager</option>
                        <option value="E1">E1 - Vice President</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      id="promosiSalary"
                      label="Gaji Pokok Baru (IDR) *"
                      value={newSalary}
                      onChange={(val) => setNewSalary(val)}
                      required
                      min={currentTenant.umr || 3000000}
                      helperText={`Gaji lama: ${formatRupiah(selectedTargetEmp?.basicSalary || 0)}`}
                    />
                    <CurrencyInput
                      id="promosiAllowance"
                      label="Tunjangan Jabatan Baru (IDR)"
                      value={newPositionAllowance}
                      onChange={(val) => setNewPositionAllowance(val)}
                      helperText="Tunjangan struktural fungsional"
                    />
                  </div>
                </div>
              )}

              {/* 2. DEMOSI JABATAN */}
              {actionType === 'Demosi' && (
                <div className="p-3 bg-rose-50/40 border border-rose-200 rounded-lg space-y-3">
                  <div className="font-semibold text-rose-900 flex items-center gap-1.5 text-xs">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    <span>Parameter Demosi & Penurunan Eselon</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Jabatan Baru Penyesuaian *</label>
                      <input
                        type="text"
                        required
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Grade Diturunkan Ke</label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono"
                      >
                        <option value="L1">L1 - Entry Level</option>
                        <option value="L2">L2 - Associate</option>
                        <option value="L3">L3 - Senior</option>
                      </select>
                    </div>
                  </div>
                  <CurrencyInput
                    id="demosiSalary"
                    label="Penyesuaian Gaji Pokok (IDR) *"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    required
                    min={currentTenant.umr || 3000000}
                    helperText="Tidak boleh di bawah standar UMR regional"
                  />
                </div>
              )}

              {/* 3. MUTASI ANTAR DIVISI */}
              {actionType === 'Mutasi' && (
                <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-lg space-y-3">
                  <div className="font-semibold text-indigo-900 flex items-center gap-1.5 text-xs">
                    <Repeat className="w-4 h-4 text-indigo-600" />
                    <span>Parameter Mutasi Divisi / Perpindahan Unit Kerja</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Departemen / Divisi Tujuan *</label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="Executive Management">Executive Management</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Human Capital">Human Capital</option>
                        <option value="Finance & Tax">Finance & Tax</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Operations & GA">Operations & GA</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Posisi di Divisi Tujuan *</label>
                      <input
                        type="text"
                        required
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      />
                    </div>
                  </div>
                  <CurrencyInput
                    id="mutasiSalary"
                    label="Gaji Pokok Definitif (IDR)"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    helperText="Biasanya setara atau disesuaikan dengan skala divisi baru"
                  />
                </div>
              )}

              {/* 4. ROTASI CABANG / SITE */}
              {actionType === 'Rotasi Cabang' && (
                <div className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg space-y-3">
                  <div className="font-semibold text-purple-900 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>Parameter Penempatan Cabang / Site Regional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Lokasi Cabang / Site Baru *</label>
                      <select
                        value={newBranchLocation}
                        onChange={(e) => setNewBranchLocation(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="Kantor Pusat Jakarta">Kantor Pusat Jakarta (Menara Palma)</option>
                        <option value="Cabang Surabaya - Tech Hub">Cabang Surabaya - Tech Hub</option>
                        <option value="Cabang Bandung - Digital Lab">Cabang Bandung - Digital Lab</option>
                        <option value="Site IKN Balikpapan - Operasional">Site IKN Balikpapan - Operasional</option>
                        <option value="Remote / WFH Nasional">Remote / WFH Nasional</option>
                      </select>
                    </div>
                    <div>
                      <CurrencyInput
                        id="rotasiKemahalan"
                        label="Tunjangan Penempatan / Kemahalan (IDR)"
                        value={newFixedAllowance}
                        onChange={(val) => setNewFixedAllowance(val)}
                        helperText="Tunjangan biaya hidup lokasi penempatan"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PENYESUAIAN GAJI POKOK */}
              {actionType === 'Penyesuaian Gaji' && (
                <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-3">
                  <div className="font-semibold text-blue-900 flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Parameter Kenaikan Gaji Berkala / Merit Increase</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CurrencyInput
                      id="salaryMerit"
                      label="Gaji Pokok Baru (IDR) *"
                      value={newSalary}
                      onChange={(val) => setNewSalary(val)}
                      required
                      min={currentTenant.umr || 3000000}
                    />
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Persentase Kenaikan (%)</label>
                      <div className="px-3 py-2 bg-slate-100 rounded border border-slate-200 font-mono font-bold text-slate-800">
                        {selectedTargetEmp && selectedTargetEmp.basicSalary > 0
                          ? `+${(((newSalary - selectedTargetEmp.basicSalary) / selectedTargetEmp.basicSalary) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Gaji lama: {formatRupiah(selectedTargetEmp?.basicSalary || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. PENGANGKATAN KARYAWAN TETAP (PKWTT) */}
              {actionType === 'Pengangkatan Tetap' && (
                <div className="p-3 bg-teal-50/40 border border-teal-200 rounded-lg space-y-3">
                  <div className="font-semibold text-teal-900 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>Pengangkatan Karyawan Tetap (PKWTT) Sesuai Pasal 60 UU Ketenagakerjaan</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ValidatedDateInput
                      id="tetapAppointmentDate"
                      label="Tanggal Resmi Menjadi Karyawan Tetap *"
                      value={permanentAppointmentDate}
                      onChange={(val) => setPermanentAppointmentDate(val)}
                      required
                      helperText="Berakhirnya masa probation 3 bulan"
                    />
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Hasil Evaluasi Probation</label>
                      <select className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white">
                        <option value="Sangat Memuaskan">Sangat Memuaskan (Nilai A - 95%)</option>
                        <option value="Memuaskan">Memuaskan (Nilai B - 85%)</option>
                      </select>
                      <span className="text-[10px] text-teal-700 mt-0.5 block font-medium">
                        ✓ Berhak atas hak cuti tahunan penuh 12 hari kerja
                      </span>
                    </div>
                  </div>
                  <CurrencyInput
                    id="tetapSalary"
                    label="Gaji Pokok Definitif Tetap (IDR) *"
                    value={newSalary}
                    onChange={(val) => setNewSalary(val)}
                    required
                  />
                </div>
              )}

              {/* 7. PERPANJANGAN KONTRAK PKWT */}
              {actionType === 'Perpanjangan Kontrak' && (
                <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg space-y-3">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Parameter Addendum Perpanjangan PKWT (PP 35/2021)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Durasi Perpanjangan (Bulan)</label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={contractDurationMonths}
                        onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <ValidatedDateInput
                      id="contractEndDate"
                      label="Tanggal Akhir Kontrak Baru *"
                      value={contractEndDate}
                      onChange={(val) => setContractEndDate(val)}
                      required
                      helperText="Batas akhir masa perpanjangan"
                    />
                  </div>
                  <p className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded">
                    Perusahaan wajib membayarkan Uang Kompensasi PKWT sesuai Pasal 61A UU Ketenagakerjaan saat masa kontrak sebelumnya berakhir.
                  </p>
                </div>
              )}

              {/* 8. PENETAPAN PEJABAT SEMENTARA (PLT / PJS) */}
              {actionType === 'Penetapan Plt' && (
                <div className="p-3 bg-cyan-50/40 border border-cyan-200 rounded-lg space-y-3">
                  <div className="font-semibold text-cyan-900 flex items-center gap-1.5 text-xs">
                    <Briefcase className="w-4 h-4 text-cyan-600" />
                    <span>Penetapan Pejabat Sementara (Acting Role / Plt)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Jabatan Plt yang Diemban *</label>
                      <input
                        type="text"
                        required
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        placeholder="Contoh: Plt. Head of Engineering"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-medium"
                      />
                    </div>
                    <ValidatedDateInput
                      id="pltExpiryDate"
                      label="Batas Akhir Penugasan Plt *"
                      value={actingRoleExpiryDate}
                      onChange={(val) => setActingRoleExpiryDate(val)}
                      required
                      helperText="Maksimal 6 bulan sesuai kelaziman korporat"
                    />
                  </div>
                  <CurrencyInput
                    id="pltAllowance"
                    label="Honorarium / Tunjangan Plt Tambahan Bulanan (IDR)"
                    value={newPositionAllowance}
                    onChange={(val) => setNewPositionAllowance(val)}
                    helperText="Tunjangan khusus selama menjabat tugas rangkap"
                  />
                </div>
              )}

              {/* Dasar Pertimbangan / Alasan SK */}
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Dasar Pertimbangan / Alasan Penerbitan SK *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Berdasarkan hasil rapat pimpinan dan hasil penilaian kinerja triwulan..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowValidationErrors(false);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <FileBadge className="w-3.5 h-3.5" />
                  <span>Sahkan & Terbitkan SK Resmi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview SK Resmi Ber-QR */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Surat Keputusan (SK) Resmi Direksi</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedLetter.log.letterNumber}
                </span>
              </div>
              <button onClick={() => setSelectedLetter(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-serif leading-relaxed text-xs">
              {/* Kop Surat */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <h1 className="text-base font-bold tracking-wider font-sans uppercase">
                  {currentTenant.name}
                </h1>
                <p className="text-[10px] text-slate-600 font-sans">
                  Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan · Telp: (021) 555-0199
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  NPWP Perusahaan: {currentTenant.npwp} · Kode Entitas: {currentTenant.code}
                </p>
              </div>

              {/* Judul & Nomor */}
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold uppercase underline tracking-wide font-sans">
                  SURAT KEPUTUSAN DIREKSI TENTANG {selectedLetter.log.type.toUpperCase()}
                </h2>
                <div className="font-mono text-slate-600 font-semibold text-[11px]">
                  Nomor: {selectedLetter.log.letterNumber}
                </div>
              </div>

              {/* Isi SK */}
              <div className="space-y-3 font-sans text-xs">
                <p>
                  Menimbang hasil tinjauan performa kerja dan pemenuhan ketentuan ketenagakerjaan, Manajemen{' '}
                  <span className="font-semibold">{currentTenant.name}</span> dengan ini memutuskan secara sah:
                </p>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 font-sans">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nama Karyawan</span>
                    <span className="col-span-2 font-bold text-slate-900">
                      {employees.find((e) => e.id === selectedLetter.log.employeeId)?.fullName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nomor Induk Karyawan</span>
                    <span className="col-span-2 font-mono text-indigo-700 font-semibold">
                      {employees.find((e) => e.id === selectedLetter.log.employeeId)?.nik}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jenis Tindakan</span>
                    <span className="col-span-2 font-semibold text-slate-900">
                      {selectedLetter.log.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jabatan Ditetapkan</span>
                    <span className="col-span-2 font-semibold text-slate-900">
                      {selectedLetter.log.newPosition}
                    </span>
                  </div>
                  {selectedLetter.log.newDepartment && (
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Divisi / Unit Kerja</span>
                      <span className="col-span-2 font-medium text-slate-800">
                        {selectedLetter.log.newDepartment}
                      </span>
                    </div>
                  )}
                  {selectedLetter.log.newBranchLocation && (
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Lokasi Penempatan</span>
                      <span className="col-span-2 font-medium text-purple-700">
                        {selectedLetter.log.newBranchLocation}
                      </span>
                    </div>
                  )}
                  {selectedLetter.log.newSalary > 0 && (
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500">Gaji Pokok Disepakati</span>
                      <span className="col-span-2 font-mono font-bold text-slate-900">
                        {formatRupiah(selectedLetter.log.newSalary)}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Tanggal Efektif</span>
                    <span className="col-span-2 font-mono text-slate-700">
                      {selectedLetter.log.effectiveDate}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Dasar Pertimbangan</span>
                    <span className="col-span-2 text-slate-700 italic">
                      "{selectedLetter.log.reason}"
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-normal">
                  Surat Keputusan ini berlaku sejak tanggal ditetapkan. Apabila di kemudian hari
                  terdapat kekeliruan dalam keputusan ini, akan diadakan perbaikan sebagaimana
                  mestinya sesuai Undang-Undang Ketenagakerjaan yang berlaku.
                </p>
              </div>

              {/* Tanda Tangan & QR Verification */}
              <div className="flex items-end justify-between pt-6 border-t border-slate-200 font-sans">
                <div className="flex items-center gap-3">
                  <QRCodeView
                    value={selectedLetter.doc.qrVerificationUrl}
                    size={75}
                    label="VALID QR"
                    subLabel="NusaHR Hash"
                  />
                  <div className="text-[10px] text-slate-500 max-w-xs leading-tight">
                    Pindai QR ini untuk verifikasi keabsahan digital SK resmi pada blockchain / server
                    NusaHR Enterprise.
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[11px] text-slate-500">
                    Jakarta, {selectedLetter.log.effectiveDate}
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedLetter.log.approvedBy || 'Ir. Budi Santoso'}
                  </div>
                  <div className="text-[10px] text-slate-500">President Director & CEO</div>
                  <div className="text-[9px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    ✓ Ditandatangani Secara Elektronik (BSrE/Kominfo)
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLetter(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
              >
                Cetak SK (Print PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
