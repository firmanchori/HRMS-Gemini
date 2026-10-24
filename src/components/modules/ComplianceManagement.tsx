import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  FileText,
  Calendar,
  CheckCircle2,
  UserX,
  X,
  Search,
  Filter,
  ShieldCheck,
  FileBadge,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { DisciplinaryLevel, ComplianceRecord, Employee } from '../../types/hrms';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ValidatedDateInput } from '../common/ValidatedDateInput';

export const ComplianceManagement: React.FC = () => {
  const {
    employees,
    complianceRecords,
    issueComplianceAction,
    setActiveModule,
    openFilePreview,
    currentTenant,
    currentUser,
  } = useHrms();

  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [level, setLevel] = useState<DisciplinaryLevel>('SP 1');
  const [violationArticle, setViolationArticle] = useState(
    'Pasal 14 ayat (2) Peraturan Perusahaan (Keterlambatan/Ketidakhadiran berulang)'
  );
  const [violationReason, setViolationReason] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validMonths, setValidMonths] = useState<number>(6);
  const [letterNumber, setLetterNumber] = useState('');
  const [signedBy, setSignedBy] = useState('Aditya Pratama, S.Psi');

  const selectedTargetEmp = employees.find((e) => e.id === employeeId);

  const initFormLetterNumber = (selectedLevel: DisciplinaryLevel) => {
    const year = new Date().getFullYear();
    const seq = String(complianceRecords.length + 1).padStart(3, '0');
    const levelCode = selectedLevel.replace(/\s+/g, '');
    return `${seq}/HRD-${levelCode}/${currentTenant.code}/X/${year}`;
  };

  const handleOpenModal = () => {
    setEmployeeId(employees[0]?.id || '');
    setLevel('SP 1');
    setLetterNumber(initFormLetterNumber('SP 1'));
    setIssueDate(new Date().toISOString().split('T')[0]);
    setValidMonths(6);
    setViolationArticle('Pasal 14 ayat (2) Peraturan Perusahaan (Keterlambatan/Ketidakhadiran berulang)');
    setViolationReason('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleLevelChange = (newLevel: DisciplinaryLevel) => {
    setLevel(newLevel);
    setLetterNumber(initFormLetterNumber(newLevel));
    if (newLevel === 'SP 1') {
      setViolationArticle('Pasal 14 ayat (2) Peraturan Perusahaan (Ketidakhadiran atau keterlambatan berulang)');
    } else if (newLevel === 'SP 2') {
      setViolationArticle('Pasal 14 ayat (4) Peraturan Perusahaan (Pelanggaran berulang dalam masa berlakunya SP 1)');
    } else if (newLevel === 'SP 3') {
      setViolationArticle('Pasal 15 ayat (1) Peraturan Perusahaan (Pelanggaran berat atau SP 2 tidak diindahkan)');
    } else if (newLevel === 'Skorsing') {
      setViolationArticle('Pasal 155 UU Ketenagakerjaan (Skorsing sementara selama proses pemeriksaan)');
    } else if (newLevel === 'PHK') {
      setViolationArticle('Pasal 52 PP 35/2021 (Pemutusan Hubungan Kerja akibat pelanggaran ketentuan PKB)');
    }
  };

  const handlePreviewCompliance = (rec: ComplianceRecord) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    openFilePreview({
      title: `SURAT TINDAKAN DISIPLIN RESMI: ${rec.level.toUpperCase()}`,
      documentNumber: rec.letterNumber,
      typeBadge: `Sanksi Kepatuhan: ${rec.level}`,
      date: rec.issueDate,
      partyName: emp?.fullName || 'Karyawan',
      partyRole: `${emp?.position || 'Staff'} · ${emp?.department || 'Operasional'}`,
      statusBadge: {
        label: `Status: ${rec.status}`,
        variant: rec.level === 'PHK' || rec.level === 'SP 3' ? 'danger' : 'warning',
      },
      detailsGrid: [
        { label: 'Tingkat Tindakan', value: rec.level },
        { label: 'Nomor Surat Keputusan', value: rec.letterNumber },
        { label: 'Tanggal Diterbitkan', value: rec.issueDate },
        { label: 'Masa Berlaku S/D', value: rec.validUntil },
        { label: 'Karyawan Terperiksa', value: emp?.fullName || '-' },
        { label: 'NIK Karyawan', value: emp?.nik || '-' },
        { label: 'Divisi / Departemen', value: emp?.department || '-' },
        { label: 'Pejabat Penandatangan', value: rec.signedBy },
      ],
      contentParagraphs: [
        `Berdasarkan hasil evaluasi kedisiplinan dan berita acara klarifikasi internal, Manajemen ${currentTenant.name} dengan ini resmi menerbitkan ${rec.level} kepada karyawan yang bersangkutan.`,
        `Dasar Pelanggaran & Uraian Fakta: "${rec.violationReason}".`,
        `Sanksi ini berlaku selama 6 (enam) bulan terhitung sejak tanggal diterbitkan sesuai ketentuan Pasal 161 UU No. 13/2003 jo PP No. 35/2021. Karyawan diwajibkan menjalani masa pembinaan dan mematuhi seluruh tata tertib Peraturan Perusahaan (PP).`,
        `Apabila dalam masa berlakunya sanksi ini karyawan melakukan pelanggaran tata tertib kembali, maka manajemen akan menjatuhkan sanksi disiplin pada tingkat yang lebih tinggi hingga Pemutusan Hubungan Kerja (PHK).`,
      ],
      signeeName: rec.signedBy || 'Aditya Pratama, S.Psi',
      signeeRole: 'VP of Human Capital & Industrial Relations',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employeeId) {
      setFormError('Pilih karyawan yang akan dikenakan sanksi peringatan.');
      return;
    }
    if (!violationReason.trim()) {
      setFormError('Uraian detail pelanggaran dan fakta kronologi wajib diisi.');
      return;
    }

    const fullReason = violationArticle
      ? `[${violationArticle}] ${violationReason.trim()}`
      : violationReason.trim();

    issueComplianceAction({
      employeeId,
      level,
      violationReason: fullReason,
      validMonths,
    });

    setIsModalOpen(false);
    setViolationReason('');
  };

  const filteredRecords = complianceRecords.filter((rec) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    const matchesSearch =
      (emp?.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (emp?.nik || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (rec?.letterNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (rec?.violationReason || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesLevel = filterLevel === 'all' || rec.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Manajemen Kepatuhan, Disiplin & Penerbitan Surat Peringatan (SP)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Modul resmi penerbitan Surat Peringatan (SP 1, SP 2, SP 3), skorsing, mitigasi risiko hubungan industrial, dan kepatuhan terhadap Peraturan Perusahaan (PP 35/2021).
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Terbitkan Surat Peringatan (SP)</span>
        </button>
      </div>

      {/* Aggregate Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">Total Sanksi Aktif</span>
            <span className="text-lg font-bold font-mono text-slate-900">
              {complianceRecords.filter((c) => c.status === 'Aktif').length} Kasus
            </span>
            <span className="text-[10px] text-slate-400 block">Masa pembinaan 6 bulan</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">Surat Peringatan 1 (SP 1)</span>
            <span className="text-lg font-bold font-mono text-amber-700">
              {complianceRecords.filter((c) => c.level === 'SP 1').length} Berkas
            </span>
            <span className="text-[10px] text-amber-600 block">Teguran tertulis tingkat I</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">SP 2 & SP 3 Terakhir</span>
            <span className="text-lg font-bold font-mono text-orange-700">
              {complianceRecords.filter((c) => c.level === 'SP 2' || c.level === 'SP 3').length} Berkas
            </span>
            <span className="text-[10px] text-orange-600 block">Peringatan keras & terakhir</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block mb-0.5">Skorsing / Eskalasi PHK</span>
            <span className="text-lg font-bold font-mono text-rose-700">
              {complianceRecords.filter((c) => c.level === 'Skorsing' || c.level === 'PHK').length} Kasus
            </span>
            <span className="text-[10px] text-rose-600 block">Terkoneksi ke Offboarding</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama karyawan, NIK, nomor SP, atau pasal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full sm:w-auto py-2 pl-3 pr-8 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-2xs"
            >
              <option value="all">Semua Tingkat Sanksi Disiplin</option>
              <option value="SP 1">Surat Peringatan 1 (SP 1)</option>
              <option value="SP 2">Surat Peringatan 2 (SP 2)</option>
              <option value="SP 3">Surat Peringatan 3 (SP 3)</option>
              <option value="Skorsing">Skorsing Sementara</option>
              <option value="PHK">Pemutusan Hubungan Kerja (PHK)</option>
            </select>
          </div>

          {(searchQuery || filterLevel !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterLevel('all');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shrink-0"
              title="Reset Filter"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Compliance Records Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Tingkat Sanksi</th>
                <th className="py-2.5 px-3 font-semibold">Nama Karyawan</th>
                <th className="py-2.5 px-3 font-semibold">Nomor SK SP</th>
                <th className="py-2.5 px-3 font-semibold">Uraian Pelanggaran & Dasar Pasal</th>
                <th className="py-2.5 px-3 font-semibold text-center">Tanggal Terbit</th>
                <th className="py-2.5 px-3 font-semibold text-center">Masa Berlaku (6 Bln)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const emp = employees.find((e) => e.id === rec.employeeId);
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => handlePreviewCompliance(rec)}
                      className="hover:bg-rose-50/40 cursor-pointer transition-colors group"
                      title="Klik baris untuk melihat Surat Keputusan Tindakan Disiplin resmi"
                    >
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.level === 'PHK'
                              ? 'bg-rose-700 text-white'
                              : rec.level === 'SP 3' || rec.level === 'Skorsing'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : rec.level === 'SP 2'
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>{rec.level}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {emp?.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={emp.fullName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                              {(emp?.fullName || 'K')[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{emp?.fullName || 'Karyawan'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {emp?.nik} · {emp?.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800 text-[11px]">
                        {rec.letterNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-md truncate" title={rec.violationReason}>
                        {rec.violationReason}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                        {rec.issueDate}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px]">
                        {rec.validUntil}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan surat peringatan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Terbitkan Surat Peringatan Resmi */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold">Penerbitan Surat Peringatan (SP) Resmi</h3>
                  <span className="text-[11px] text-slate-400">
                    Sanksi kedisiplinan berlandaskan Peraturan Perusahaan & UU Ketenagakerjaan
                  </span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Employee Picker */}
              <div>
                <EmployeeSelect
                  label="Pilih Karyawan yang Dikenakan Sanksi *"
                  required
                  employees={employees}
                  value={employeeId}
                  onChange={(id) => setEmployeeId(id)}
                />
              </div>

              {/* Tingkat Tindakan & Masa Berlaku */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Surat Peringatan *</label>
                  <select
                    value={level}
                    onChange={(e) => handleLevelChange(e.target.value as DisciplinaryLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-bold text-rose-700 shadow-xs"
                  >
                    <option value="SP 1">Surat Peringatan 1 (SP 1)</option>
                    <option value="SP 2">Surat Peringatan 2 (SP 2)</option>
                    <option value="SP 3">Surat Peringatan 3 (SP 3 - Terakhir)</option>
                    <option value="Skorsing">Skorsing Sementara (Proses Investigasi)</option>
                    <option value="PHK">Pemutusan Hubungan Kerja (PHK Indisipliner)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Masa Berlaku Sanksi</label>
                  <select
                    value={validMonths}
                    onChange={(e) => setValidMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value={6}>6 Bulan (Pasal 161 UU No. 13/2003 jo PP 35)</option>
                    <option value={3}>3 Bulan (Teguran Khusus)</option>
                    <option value={12}>12 Bulan (Kasus Khusus Integritas)</option>
                  </select>
                </div>
              </div>

              {/* Nomor Surat & Tanggal Terbit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Surat Keputusan SP *</label>
                  <input
                    type="text"
                    required
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-semibold text-rose-700 bg-slate-50"
                  />
                </div>

                <ValidatedDateInput
                  id="spIssueDate"
                  label="Tanggal Diterbitkan *"
                  value={issueDate}
                  onChange={(val) => setIssueDate(val)}
                  required
                  helperText="Format YYYY-MM-DD"
                />
              </div>

              {/* Dasar Pasal Regulasi */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pasal Peraturan Perusahaan (PP) / PKB yang Dilanggar *
                </label>
                <input
                  type="text"
                  required
                  value={violationArticle}
                  onChange={(e) => setViolationArticle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-900"
                />
              </div>

              {/* Uraian Pelanggaran & Bukti */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Uraian Detail Pelanggaran, Kronologi & Bukti Objektif *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan tanggal/waktu kejadian, bukti rekaman presensi atau laporan manajer divisi, serta peringatan lisan yang telah diberikan sebelumnya..."
                  value={violationReason}
                  onChange={(e) => setViolationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-rose-500"
                />
              </div>

              {level === 'PHK' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 leading-snug">
                  <strong>Peringatan Hubungan Industrial:</strong> Penetapan tindakan PHK Indisipliner akan memicu pembuatan draft pesangon sesuai Pasal 52 PP 35/2021 pada menu Offboarding.
                </div>
              )}

              {/* Pejabat Penandatangan */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pejabat Pengesah / Penandatangan</label>
                <input
                  type="text"
                  value={signedBy}
                  onChange={(e) => setSignedBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Sahkan & Terbitkan Surat Peringatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
