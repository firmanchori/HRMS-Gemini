import React, { useState, useEffect, useRef } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  Plane,
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Receipt,
  X,
  Settings,
  Printer,
  Download,
  ChevronRight,
  MessageSquare,
  Loader2,
  FileDown,
} from 'lucide-react';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { QRCodeView } from '../common/QRCodeView';
import { CurrencyInput } from '../common/CurrencyInput';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { validateDateRange, validateDateString } from '../../utils/dateValidator';
import { formatRupiah } from '../../utils/taxCalculator';
import { BusinessTripRequest } from '../../types/hrms';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { printPagesDirectly, exportPagesToPdf } from '../../utils/documentPdfExporter';
import { openWhatsAppChat } from '../../utils/whatsappHelper';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';

export const BusinessTripManagement: React.FC = () => {
  const {
    employees,
    businessTrips,
    submitBusinessTrip,
    reviewBusinessTrip,
    currentTenant,
    currentUser,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'trips' | 'realisasi' | 'pengaturan'>('trips');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTripForDoc, setSelectedTripForDoc] = useState<BusinessTripRequest | null>(null);
  const sppdSheetRef = useRef<HTMLDivElement>(null);
  const [isPrintingSppd, setIsPrintingSppd] = useState(false);
  const [isExportingSppd, setIsExportingSppd] = useState(false);
  const [isSppdWaModalOpen, setIsSppdWaModalOpen] = useState(false);
  const [sppdWaNumber, setSppdWaNumber] = useState('08129876543');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const handlePrintSppd = async () => {
    if (!sppdSheetRef.current) return;
    try {
      setIsPrintingSppd(true);
      await printPagesDirectly([sppdSheetRef.current]);
    } catch (err) {
      console.error('Print SPPD failed:', err);
      alert('Gagal memproses pencetakan fisik dokumen SPPD.');
    } finally {
      setIsPrintingSppd(false);
    }
  };

  const handleDownloadSppdPdf = async () => {
    if (!sppdSheetRef.current || !selectedTripForDoc) return;
    try {
      setIsExportingSppd(true);
      const filename = `SPPD_${selectedTripForDoc.tripNumber.replace(/\//g, '_')}.pdf`;
      await exportPagesToPdf([sppdSheetRef.current], filename);
    } catch (err) {
      console.error('Download SPPD PDF failed:', err);
      alert('Gagal mengunduh berkas PDF SPPD.');
    } finally {
      setIsExportingSppd(false);
    }
  };

  const handleOpenSppdWaModal = () => {
    if (selectedTripForDoc) {
      const emp = employees.find((e) => e.id === selectedTripForDoc.employeeId);
      setSppdWaNumber(emp?.phone || '08129876543');
    }
    setIsSppdWaModalOpen(true);
  };

  const handleSendSppdWhatsApp = () => {
    if (!selectedTripForDoc) return;
    const sppdEmp = employees.find((e) => e.id === selectedTripForDoc.employeeId);
    const msg =
      `*SURAT PERINTAH PERJALANAN DINAS (SPPD) - ${currentTenant.name.toUpperCase()}*\n\n` +
      `Nomor: *${selectedTripForDoc.tripNumber}*\n` +
      `Penerima Tugas: *${sppdEmp?.fullName || 'Karyawan'}* (NIK: ${sppdEmp?.nik || '-'})\n` +
      `Jabatan: ${sppdEmp?.position || '-'}\n` +
      `Kota Tujuan: *${selectedTripForDoc.destinationCity}*\n` +
      `Lama Tugas: *${selectedTripForDoc.totalDays} Hari* (${selectedTripForDoc.startDate} s/d ${selectedTripForDoc.endDate})\n` +
      `Keperluan: ${selectedTripForDoc.purpose}\n` +
      `Alokasi Anggaran: *${formatRupiah(selectedTripForDoc.estimatedCost)}*\n\n` +
      `Dokumen dinas resmi ini telah disahkan secara elektronik dan diakui secara hukum.\n` +
      `Verifikasi Dokumen: https://nusahr.enterprise/verify-sppd?doc=${selectedTripForDoc.tripNumber.replace(/\//g, '-')}`;
    openWhatsAppChat(sppdWaNumber || sppdEmp?.phone || '08129876543', msg);
    setIsSppdWaModalOpen(false);
  };

  // Form State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [destinationCity, setDestinationCity] = useState('');
  const [startDate, setStartDate] = useState('2026-11-05');
  const [endDate, setEndDate] = useState('2026-11-07');
  const [purpose, setPurpose] = useState('');
  const [transportType, setTransportType] = useState<BusinessTripRequest['transportType']>('Pesawat');
  const [perDiemDaily, setPerDiemDaily] = useState<number>(500000);
  const [accommodationCost, setAccommodationCost] = useState<number>(1800000);
  const [ticketCost, setTicketCost] = useState<number>(2500000);

  // Settlement Form State
  const [selectedTripForClaim, setSelectedTripForClaim] = useState<BusinessTripRequest | null>(null);
  const [actualExpense, setActualExpense] = useState<number>(0);
  const [receiptNotes, setReceiptNotes] = useState('');

  // Form Validation Errors
  const [sppdFormError, setSppdFormError] = useState<string | null>(null);
  const [claimFormError, setClaimFormError] = useState<string | null>(null);

  // Close any active modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTripForDoc) setSelectedTripForDoc(null);
        else if (selectedTripForClaim) setSelectedTripForClaim(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTripForDoc, selectedTripForClaim, isModalOpen]);

  // Settings State
  const [perDiemStaff, setPerDiemStaff] = useState(350000);
  const [perDiemManager, setPerDiemManager] = useState(500000);
  const [perDiemDirector, setPerDiemDirector] = useState(800000);
  const [maxHotelPerNight, setMaxHotelPerNight] = useState(750000);

  // Days Calculation with validation
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    if (d2 < d1) return 0;
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) || diff < 1 ? 0 : diff;
  };

  const totalDays = calculateDays();
  const estimatedCost = totalDays * perDiemDaily + accommodationCost + ticketCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setSppdFormError('Pilih nama karyawan yang ditugaskan dinas');
      return;
    }
    if (!destinationCity.trim()) {
      setSppdFormError('Kota tujuan perjalanan dinas wajib diisi');
      return;
    }
    const rangeCheck = validateDateRange(startDate, endDate);
    if (!rangeCheck.isValid) {
      setSppdFormError(rangeCheck.errorMessage || 'Rentang tanggal dinas tidak valid');
      return;
    }
    if (!purpose.trim()) {
      setSppdFormError('Keperluan / maksud tugas dinas wajib diisi');
      return;
    }

    setSppdFormError(null);
    submitBusinessTrip({
      employeeId,
      destinationCity,
      startDate,
      endDate,
      totalDays,
      purpose,
      transportType,
      perDiemDaily,
      accommodationCost,
      estimatedCost,
    });

    setIsModalOpen(false);
    setDestinationCity('');
    setPurpose('');
  };

  const filteredTrips = businessTrips.filter((t) => {
    const emp = employees.find((e) => e.id === t.employeeId);
    const matchesSearch =
      (emp?.fullName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (t?.tripNumber || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (t?.destinationCity || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [sppdNotice, setSppdNotice] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Row 1: Module Header & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Perjalanan Dinas (SPPD)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pengajuan Surat Perintah Perjalanan Dinas, kalkulasi uang saku harian, approval bertingkat, dan realisasi biaya (settlement).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dokumen Resmi SPPD & Dinas</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajukan Perjalanan Dinas</span>
          </button>
        </div>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar (Not Parallel to Title) */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('trips')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'trips'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Daftar SPPD</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'trips'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {businessTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('realisasi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'realisasi'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Klaim & Realisasi</span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pengaturan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengaturan SPPD & Plafon</span>
        </button>
      </ScrollableTabNav>

      {sppdNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sppdNotice}</span>
          </div>
          <button onClick={() => setSppdNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {activeTab === 'trips' && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Total Pengajuan SPPD</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {businessTrips.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Semua status tugas</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Menunggu Approval Atasan</span>
              <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
                {businessTrips.filter((t) => t.status === 'Menunggu Approval').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Verifikasi urgensi tugas</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Disetujui & Siap Berangkat</span>
              <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {businessTrips.filter((t) => t.status === 'Disetujui Atasan' || t.status === 'Disetujui Finance').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Dana per diem dialokasikan</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-xs text-slate-500 block mb-1">Total Estimasi Anggaran</span>
              <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
                {formatRupiah(businessTrips.reduce((sum, t) => sum + t.estimatedCost, 0))}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Biaya dinas tahun 2026</span>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="relative w-full lg:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari karyawan, tujuan, atau no SPPD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="all">Semua Status</option>
                <option value="Menunggu Approval">Menunggu Approval</option>
                <option value="Disetujui Atasan">Disetujui Atasan</option>
                <option value="Disetujui Finance">Disetujui Finance</option>
                <option value="Selesai">Selesai</option>
              </select>

              {(searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shrink-0"
                  title="Reset Filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip) => {
                const emp = employees.find((e) => e.id === trip.employeeId);
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripForDoc(trip)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                  >
                    {/* Top Bar: Trip Number, Transport & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {trip.tripNumber}
                          </span>
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {trip.transportType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-xs mt-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{trip.destinationCity}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          trip.status === 'Disetujui Atasan' || trip.status === 'Disetujui Finance'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trip.status === 'Selesai'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>

                    {/* Employee & Purpose */}
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        {emp?.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.fullName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                            {(emp?.fullName || 'K')[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{emp?.fullName}</div>
                          <div className="text-[10px] text-slate-500">{emp?.position}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-snug">
                        <span className="text-slate-400">Keperluan: </span>
                        {trip.purpose}
                      </div>
                    </div>

                    {/* Dates & Cost */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Durasi Tugas:</span>
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {trip.startDate} - {trip.endDate}
                        </div>
                        <span className="text-[10px] text-slate-500 font-sans">({trip.totalDays} Hari)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Estimasi Biaya:</span>
                        <div className="font-bold text-slate-900 text-sm">
                          {formatRupiah(trip.estimatedCost)}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions: Bottom approval buttons if Menunggu Approval */}
                    {trip.status === 'Menunggu Approval' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reviewBusinessTrip(trip.id, 'Ditolak');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition-colors"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reviewBusinessTrip(trip.id, 'Disetujui Atasan');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                        >
                          Setujui
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
                Belum ada data perjalanan dinas yang tercatat.
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP: Table (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">No SPPD</th>
                    <th className="py-2.5 px-3 font-semibold">Karyawan Pelaksana</th>
                    <th className="py-2.5 px-3 font-semibold">Kota Tujuan</th>
                    <th className="py-2.5 px-3 font-semibold">Periode Tugas</th>
                    <th className="py-2.5 px-3 font-semibold">Transportasi</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Estimasi Biaya</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => {
                      const emp = employees.find((e) => e.id === trip.employeeId);
                      return (
                        <tr
                          key={trip.id}
                          onClick={() => setSelectedTripForDoc(trip)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                            {trip.tripNumber}
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
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                                  {(emp?.fullName || 'K')[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{emp?.fullName}</div>
                                <div className="text-[10px] text-slate-500">{emp?.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{trip.destinationCity}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{trip.purpose}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                            <div>{trip.startDate} s/d {trip.endDate}</div>
                            <span className="text-[10px] text-slate-500 font-sans">
                              ({trip.totalDays} Hari)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                              {trip.transportType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(trip.estimatedCost)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                trip.status === 'Disetujui Atasan' || trip.status === 'Disetujui Finance'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : trip.status === 'Selesai'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {trip.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors ml-auto" />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Belum ada data perjalanan dinas yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Realisasi & Settlement Tab */}
      {activeTab === 'realisasi' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Realisasi Biaya & Pelaporan Nota Dinas (Expense Settlement)
            </h3>
            <p className="text-xs text-slate-500">
              Karyawan yang telah kembali dari tugas dinas wajib mengunggah rekap biaya riil untuk rekonsiliasi kelebihan/kekurangan uang muka (Cash Advance).
            </p>
          </div>

          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {businessTrips.length > 0 ? (
              businessTrips.map((trip) => {
                const emp = employees.find((e) => e.id === trip.employeeId);
                return (
                  <div
                    key={`mob-real-${trip.id}`}
                    onClick={() => {
                      setSelectedTripForClaim(trip);
                      setActualExpense(trip.estimatedCost);
                    }}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-xs space-y-3 cursor-pointer hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-700 font-bold text-xs">
                        {trip.tripNumber}
                      </span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                        {trip.destinationCity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {emp?.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {(emp?.fullName || 'K')[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs text-slate-900">{emp?.fullName}</div>
                        <div className="text-[10px] text-slate-400">{emp?.position}</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-xs border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Uang Muka:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatRupiah(trip.estimatedCost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Periode Tugas:</span>
                        <span className="font-mono">{trip.startDate} - {trip.endDate} ({trip.totalDays} Hari)</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:text-indigo-700">
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                        Settlement Nota & Kwitansi
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada data perjalanan dinas untuk settlement biaya.
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP: List View (>= md) */}
          <div className="hidden md:block divide-y divide-slate-100">
            {businessTrips.length > 0 ? (
              businessTrips.map((trip) => {
                const emp = employees.find((e) => e.id === trip.employeeId);
                return (
                  <div
                    key={trip.id}
                    onClick={() => {
                      setSelectedTripForClaim(trip);
                      setActualExpense(trip.estimatedCost);
                    }}
                    className="py-4 px-2 -mx-2 rounded-lg flex flex-row items-center justify-between gap-4 cursor-pointer hover:bg-indigo-50/50 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-700 font-bold text-xs">{trip.tripNumber}</span>
                        <span className="text-xs font-semibold text-slate-900">{emp?.fullName}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{trip.destinationCity}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Uang Muka Diterima: <span className="font-mono font-bold text-slate-900">{formatRupiah(trip.estimatedCost)}</span>
                        {' · '}
                        Periode: {trip.startDate} - {trip.endDate} ({trip.totalDays} Hari)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-600 transition-colors hidden sm:inline">
                        Settlement Nota
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada data perjalanan dinas untuk pelaporan settlement nota.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Standar Plafon Uang Saku & Akomodasi Dinas
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi uang saku harian (Per Diem) dan batas maksimal hotel per malam sesuai jenjang level organisasi.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Uang Saku Staff / Non-Manager
                </label>
                <input
                  type="number"
                  value={perDiemStaff}
                  onChange={(e) => setPerDiemStaff(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Per hari kalender</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Uang Saku Manager / Lead
                </label>
                <input
                  type="number"
                  value={perDiemManager}
                  onChange={(e) => setPerDiemManager(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Per hari kalender</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Uang Saku VP / Direksi
                </label>
                <input
                  type="number"
                  value={perDiemDirector}
                  onChange={(e) => setPerDiemDirector(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Per hari kalender</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Plafon Standar Hotel Bintang 3-4 (Per Malam)
              </label>
              <input
                type="number"
                value={maxHotelPerNight}
                onChange={(e) => setMaxHotelPerNight(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-1.5 border border-slate-300 rounded font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Biaya di atas plafon memerlukan persetujuan direktur finance
              </span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSppdNotice('Pengaturan standar SPPD berhasil disimpan!');
                  setTimeout(() => setSppdNotice(null), 4000);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs"
              >
                Simpan Standar SPPD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Pengajuan SPPD */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Form Pengajuan Perjalanan Dinas (SPPD)</h3>
                <span className="text-[11px] text-slate-400">Surat Perintah Perjalanan Dinas Resmi</span>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Form Validation Error Notice */}
              {sppdFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{sppdFormError}</span>
                </div>
              )}

              <EmployeeSelect
                label="Karyawan yang Ditugaskan"
                required
                employees={employees}
                value={employeeId}
                onChange={(val) => {
                  setEmployeeId(val);
                  if (sppdFormError) setSppdFormError(null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Kota Tujuan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Surabaya / Bandung"
                    value={destinationCity}
                    onChange={(e) => {
                      setDestinationCity(e.target.value);
                      if (sppdFormError) setSppdFormError(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Moda Transportasi</label>
                  <select
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="Pesawat">Pesawat Udara</option>
                    <option value="Kereta Api">Kereta Api / Whoosh</option>
                    <option value="Mobil Operasional">Mobil Dinas / Operasional</option>
                    <option value="Travel">Travel / Antar Kota</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="sppdStartDate"
                  label="Tanggal Berangkat *"
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    if (sppdFormError) setSppdFormError(null);
                  }}
                  required
                  helperText="Hari pertama dinas"
                />
                <ValidatedDateInput
                  id="sppdEndDate"
                  label="Tanggal Kembali *"
                  value={endDate}
                  minDate={startDate}
                  onChange={(val) => {
                    setEndDate(val);
                    if (sppdFormError) setSppdFormError(null);
                  }}
                  required
                  helperText="Hari kepulangan"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Keperluan / Maksud Tugas Dinas *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Implementasi sistem server di kantor cabang dan pendampingan audit ISO..."
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (sppdFormError) setSppdFormError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              {/* Rincian Estimasi Biaya dengan CurrencyInput */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-semibold text-slate-800 block">Kalkulasi Estimasi Anggaran ({totalDays} Hari)</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <CurrencyInput
                    id="perDiemDaily"
                    label="Uang Saku / Hari"
                    value={perDiemDaily}
                    onChange={setPerDiemDaily}
                    showTerbilang={false}
                    helperText="Per diem dinas"
                  />
                  <CurrencyInput
                    id="accommodationCost"
                    label="Total Hotel / Akomodasi"
                    value={accommodationCost}
                    onChange={setAccommodationCost}
                    showTerbilang={false}
                    helperText="Biaya penginapan"
                  />
                  <CurrencyInput
                    id="ticketCost"
                    label="Tiket Transport"
                    value={ticketCost}
                    onChange={setTicketCost}
                    showTerbilang={false}
                    helperText="Tiket pesawat/KA"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Total Uang Muka Dinas:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {formatRupiah(estimatedCost)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-md font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold shadow-xs"
                >
                  Kirim Pengajuan SPPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview Cetak Dokumen SPPD */}
      {selectedTripForDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTripForDoc(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Surat Perintah Perjalanan Dinas (SPPD)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  {selectedTripForDoc.tripNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Unduh Berkas PDF */}
                <button
                  type="button"
                  onClick={handleDownloadSppdPdf}
                  disabled={isExportingSppd}
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shrink-0"
                  title="Unduh Berkas SPPD Format PDF"
                  aria-label="Unduh PDF"
                >
                  {isExportingSppd ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                </button>

                {/* Cetak Fisik Naskah A4 */}
                <button
                  type="button"
                  onClick={handlePrintSppd}
                  disabled={isPrintingSppd}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shrink-0"
                  title="Cetak Fisik Dokumen SPPD (Printer)"
                  aria-label="Cetak SPPD"
                >
                  {isPrintingSppd ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                </button>

                {/* Kirim WhatsApp */}
                <button
                  type="button"
                  onClick={handleOpenSppdWaModal}
                  className="p-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title="Kirim Penugasan SPPD ke WhatsApp Karyawan"
                  aria-label="Kirim WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTripForDoc(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 flex items-center justify-center shrink-0"
                  title="Tutup (Esc)"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div ref={sppdSheetRef} className="p-8 overflow-y-auto space-y-6 text-slate-900 font-serif leading-relaxed text-xs bg-white">
              {/* Kop Surat */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h1 className="text-base font-bold tracking-wider font-sans uppercase">
                  {currentTenant.name}
                </h1>
                <p className="text-[10px] text-slate-600 font-sans">
                  Menara Palma Lantai 18, Jl. HR Rasuna Said, Jakarta Selatan · Telp: (021) 555-0199
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  NPWP: {currentTenant.npwp}
                </p>
              </div>

              {/* Judul & Nomor */}
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold uppercase underline tracking-wide font-sans">
                  SURAT PERINTAH PERJALANAN DINAS (SPPD)
                </h2>
                <div className="font-mono text-slate-600 font-semibold text-[11px]">
                  Nomor: {selectedTripForDoc.tripNumber}
                </div>
              </div>

              {/* Isi Surat */}
              <div className="space-y-3 font-sans text-xs">
                <p>
                  Pejabat yang berwenang memberikan perintah tugas kepada karyawan di bawah ini:
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nama Pegawai</span>
                    <span className="col-span-2 font-bold text-slate-900">
                      {employees.find((e) => e.id === selectedTripForDoc.employeeId)?.fullName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Nomor Induk Karyawan</span>
                    <span className="col-span-2 font-mono font-semibold text-indigo-700">
                      {employees.find((e) => e.id === selectedTripForDoc.employeeId)?.nik}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Jabatan / Divisi</span>
                    <span className="col-span-2 font-medium text-slate-800">
                      {employees.find((e) => e.id === selectedTripForDoc.employeeId)?.position}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Tempat Berangkat</span>
                    <span className="col-span-2 font-medium text-slate-800">Jakarta (Kantor Pusat)</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Tempat Tujuan</span>
                    <span className="col-span-2 font-bold text-slate-900">
                      {selectedTripForDoc.destinationCity}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Lama Perjalanan</span>
                    <span className="col-span-2 font-mono">
                      {selectedTripForDoc.totalDays} Hari ({selectedTripForDoc.startDate} s/d {selectedTripForDoc.endDate})
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Maksud / Keperluan</span>
                    <span className="col-span-2 text-slate-800 leading-normal">
                      {selectedTripForDoc.purpose}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500">Alokasi Biaya Dinas</span>
                    <span className="col-span-2 font-mono font-bold text-indigo-800">
                      {formatRupiah(selectedTripForDoc.estimatedCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TTD & QR Verification */}
              <div className="flex items-end justify-between pt-6 border-t border-slate-200 font-sans">
                <div className="flex items-center gap-3">
                  <QRCodeView
                    value={`https://nusahr.enterprise/verify-sppd?doc=${selectedTripForDoc.tripNumber.replace(/\//g, '-')}`}
                    size={80}
                    label="VALID SPPD"
                    subLabel="NusaHR Seal"
                  />
                  <div className="text-[10px] text-slate-500 max-w-xs leading-tight">
                    Surat perintah ini sah dan tercatat pada registri sistem HRMS dengan jaminan asuransi perjalanan dinas.
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[11px] text-slate-500">
                    Jakarta, {selectedTripForDoc.startDate}
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedTripForDoc.approvedBy || 'Aditya Pratama, S.Psi'}
                  </div>
                  <div className="text-[10px] text-slate-500">Pemberi Perintah / Direksi</div>
                  <div className="text-[9px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    ✓ Otentikasi Digital
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Kirim WhatsApp SPPD */}
      {isSppdWaModalOpen && selectedTripForDoc && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsSppdWaModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-emerald-200" />
                <h3 className="text-sm font-bold">Kirim Penugasan SPPD ke WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSppdWaModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Karyawan: {employees.find((e) => e.id === selectedTripForDoc.employeeId)?.fullName}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Tujuan: {selectedTripForDoc.destinationCity} · {selectedTripForDoc.totalDays} Hari ({selectedTripForDoc.startDate})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Penerima Tugas
                </label>
                <input
                  type="text"
                  value={sppdWaNumber}
                  onChange={(e) => setSppdWaNumber(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format nomor Indonesia: 08xx atau 628xx. Pesan mencakup nomor SPPD, kota tujuan, durasi dinas, alokasi biaya, dan link verifikasi digital NusaHR.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSppdWaModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendSppdWhatsApp}
                  className="px-4 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Settlement Nota */}
      {selectedTripForClaim && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTripForClaim(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Settlement Realisasi Biaya Dinas</h3>
                <span className="text-[11px] text-slate-400 font-mono">{selectedTripForClaim.tripNumber}</span>
              </div>
              <button onClick={() => setSelectedTripForClaim(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Uang Muka Diterima:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedTripForClaim.estimatedCost)}</span>
                </div>
              </div>

              <CurrencyInput
                id="actualExpense"
                label="Total Pengeluaran Riil (Sesuai Bukti Nota) *"
                value={actualExpense}
                onChange={setActualExpense}
                required
                min={10000}
                helperText="Total seluruh bukti nota, tiket, dan kuitansi pengeluaran"
              />

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-indigo-900 font-semibold">Selisih Rekonsiliasi:</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {formatRupiah(actualExpense - selectedTripForClaim.estimatedCost)}
                  </span>
                </div>
                <span className="text-[10px] text-indigo-700 block">
                  {actualExpense > selectedTripForClaim.estimatedCost
                    ? 'Perusahaan akan mengganti kelebihan bayar karyawan.'
                    : 'Karyawan mengembalikan sisa uang muka ke kasir perusahaan.'}
                </span>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Catatan Realisasi & Lampiran Bukti</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tiket boarding pass, nota hotel, dan transport lokal..."
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTripForClaim(null)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Laporan settlement berhasil disimpan dan diajukan ke bagian Finance');
                    setSelectedTripForClaim(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold shadow-xs"
                >
                  Kirim Settlement Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Document Modal: SPPD & Perjalanan Dinas */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Pusat Dokumen Resmi Perjalanan Dinas (SPPD)"
        categoryFilter="Kehadiran, Cuti & Perjalanan Dinas"
        defaultTemplateId="tmpl-12"
      />
    </div>
  );
};
