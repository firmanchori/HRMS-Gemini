import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  QrCode,
  Building,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Camera,
  X,
  ScanLine,
  Wrench,
  ArrowRightLeft,
  Settings,
  ClipboardCheck,
  FileText,
  DollarSign,
  UserCheck,
  Calendar,
  Layers,
  DoorClosed,
  Car,
  Package,
  Headphones,
  Fuel,
  FileCheck,
  Check,
  Clock,
  Send,
} from 'lucide-react';
import {
  GAAsset,
  AssetCondition,
  AssetMaintenanceTicket,
  GARoomBooking,
  GAVehicleBooking,
  GAOfficeSupply,
  GAOfficeSupplyRequest,
  GATicket,
} from '../../types/hrms';
import { formatRupiah } from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

export const GaAssetManagement: React.FC = () => {
  const {
    assets,
    employees,
    addAsset,
    updateAsset,
    performStockOpname,
    currentTenant,
    assetMaintenanceTickets,
    addMaintenanceTicket,
    updateMaintenanceTicket,
    roomBookings,
    addRoomBooking,
    saveMeetingMinutes,
    vehicleBookings,
    addVehicleBooking,
    updateVehicleBookingStatus,
    officeSupplies,
    addOfficeSupply,
    officeSupplyRequests,
    addOfficeSupplyRequest,
    reviewOfficeSupplyRequest,
    gaTickets,
    addGaTicket,
    updateGaTicketStatus,
    currentUser,
    openFilePreview,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'aset' | 'mutasi' | 'maintenance' | 'opname' | 'ruang_rapat' | 'kendaraan' | 'atk' | 'tiket_ga' | 'pengaturan'>('aset');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<GAAsset | null>(null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Register Form State
  const [assetCode, setAssetCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GAAsset['category']>('Laptop & Komputer');
  const [building, setBuilding] = useState('Menara Palma Kuningan');
  const [room, setRoom] = useState('Lantai 18 - Dev Wing');
  const [purchasePrice, setPurchasePrice] = useState<number>(18500000);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');

  // Mutasi / Perpindahan Aset State
  const [mutasiAssetId, setMutasiAssetId] = useState(assets[0]?.id || '');
  const [newTargetEmpId, setNewTargetEmpId] = useState(employees[0]?.id || '');
  const [newTargetBuilding, setNewTargetBuilding] = useState('Menara Palma Kuningan');
  const [newTargetRoom, setNewTargetRoom] = useState('Lantai 20 - Executive Suite');
  const [mutasiNotes, setMutasiNotes] = useState('');

  // Maintenance Ticket Form State
  const [maintAssetId, setMaintAssetId] = useState(assets[0]?.id || '');
  const [maintIssue, setMaintIssue] = useState('');
  const [maintCost, setMaintCost] = useState<number>(750000);
  const [maintVendor, setMaintVendor] = useState('Mitra Service Prima');
  const [maintType, setMaintType] = useState<AssetMaintenanceTicket['issueType']>('Kerusakan Hardware');

  // Scanner state
  const [scannedCode, setScannedCode] = useState('');
  const [scanCondition, setScanCondition] = useState<AssetCondition>('Baik');
  const [scanFeedback, setScanFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Room Booking State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedBookingForMinutes, setSelectedBookingForMinutes] = useState<GARoomBooking | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomName: 'Ruang Meeting VIP - Lantai 18',
    meetingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    topic: '',
    participantsCount: 8,
  });
  const [meetingMinutesText, setMeetingMinutesText] = useState('');

  // Vehicle Booking State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleName: 'Toyota Innova Zenix (B 1234 NTM)',
    driverName: 'Pak Supriadi (Driver Internal)',
    purpose: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startMileageKm: 12450,
  });
  const [selectedVehicleForReturn, setSelectedVehicleForReturn] = useState<GAVehicleBooking | null>(null);
  const [returnForm, setReturnForm] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    endOdometer: 0,
    tollFuelCost: 0,
    returnNotes: 'Kendaraan dikembalikan dalam kondisi prima dan bersih.',
  });

  // Supply Request & Master State
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isAddSupplyModalOpen, setIsAddSupplyModalOpen] = useState(false);
  const [newSupplyForm, setNewSupplyForm] = useState<{
    itemCode: string;
    itemName: string;
    category: GAOfficeSupply['category'];
    currentStock: number;
    reorderPoint: number;
    standardReorderQty: number;
    estimatedUnitPrice: number;
    unit: string;
  }>({
    itemCode: `ATK-${Date.now().toString().slice(-4)}`,
    itemName: '',
    category: 'Kertas & Dokumen',
    currentStock: 25,
    reorderPoint: 5,
    standardReorderQty: 10,
    estimatedUnitPrice: 45000,
    unit: 'Rim',
  });
  const [supplyForm, setSupplyForm] = useState({
    supplyId: officeSupplies[0]?.id || 'sup-1',
    quantity: 2,
    purpose: '',
  });

  // GA Ticket State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicketForResolve, setSelectedTicketForResolve] = useState<GATicket | null>(null);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'Aset Rusak/Perawatan' as const,
    location: 'Lantai 18 - Wing Barat',
    urgency: 'Normal' as 'Rendah' | 'Normal' | 'Tinggi' | 'Darurat',
    description: '',
  });
  const [ticketResolutionNotes, setTicketResolutionNotes] = useState('');

  // Settings State
  const [assetPrefix, setAssetPrefix] = useState('AST');
  const [deprecYears, setDeprecYears] = useState(4);
  const [stockOpnameFreq, setStockOpnameFreq] = useState('Triwulan');
  const [requireBast, setRequireBast] = useState(true);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      (a?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (a?.assetCode || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (a?.building || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (a?.room || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handlePreviewMaintenanceTicket = (t: AssetMaintenanceTicket) => {
    openFilePreview({
      title: 'BERITA ACARA PEMELIHARAAN ASET & PERBAIKAN GA',
      documentNumber: t.ticketNumber,
      typeBadge: 'Tiket Servis GA & Pemeliharaan',
      date: new Date().toLocaleDateString('id-ID'),
      partyName: t.assetName,
      partyRole: `Kode Aset: ${t.assetCode}`,
      statusBadge: {
        label: t.status,
        variant: t.status === 'Selesai Diperbaiki' ? 'success' : 'warning',
      },
      detailsGrid: [
        { label: 'Nomor Tiket Servis', value: t.ticketNumber },
        { label: 'Nama Aset', value: t.assetName },
        { label: 'Kode Registrasi Aset', value: t.assetCode },
        { label: 'Kategori Kerusakan', value: t.issueType },
        { label: 'Teknisi / Rekanan', value: t.assignedTechnician || 'Tim Internal GA' },
        { label: 'Estimasi Biaya', value: formatRupiah(t.cost || 0) },
        { label: 'Status Penanganan', value: t.status },
        { label: 'Perusahaan Entitas', value: currentTenant.name },
      ],
      contentParagraphs: [
        `Laporan pemeliharaan dan perbaikan barang inventaris perusahaan yang diterbitkan oleh Departemen General Affairs.`,
        `Deskripsi Kendala: "${t.description}". Pekerjaan dilakukan dengan standar pengujian fungsi dan keselamatan kerja.`,
        `Aset dinyatakan siap digunakan kembali setelah inspeksi akhir dan serah terima ke penanggung jawab operasional.`,
      ],
      signeeName: 'Bambang Sudiro',
      signeeRole: 'GA Manager & Asset Custodian',
    });
  };

  const handleCreateRoomBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.topic) return;
    addRoomBooking({
      roomName: roomForm.roomName,
      floorLocation: 'Lantai 18',
      capacity: Number(roomForm.participantsCount),
      organizerId: employees[0]?.id || 'emp-001',
      meetingTitle: roomForm.topic,
      date: roomForm.meetingDate,
      startTime: roomForm.startTime,
      endTime: roomForm.endTime,
      attendeesInternal: [employees[0]?.id || 'emp-001'],
      attendeesExternal: [],
    });
    setIsRoomModalOpen(false);
    setRoomForm({ ...roomForm, topic: '' });
  };

  const handleSaveMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForMinutes || !meetingMinutesText) return;
    saveMeetingMinutes(selectedBookingForMinutes.id, meetingMinutesText);
    setSelectedBookingForMinutes(null);
    setMeetingMinutesText('');
  };

  const handleCreateVehicleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.purpose) return;
    addVehicleBooking({
      vehicleName: vehicleForm.vehicleName,
      plateNumber: vehicleForm.vehicleName.match(/\(([^)]+)\)/)?.[1] || 'B 1234 NTM',
      driverType: vehicleForm.driverName ? 'Sopir Kantor' : 'Bawa Sendiri',
      driverName: vehicleForm.driverName || 'Lepas Kunci',
      borrowerId: employees[0]?.id || 'emp-001',
      purpose: vehicleForm.purpose,
      destination: 'Jabodetabek & Site Project',
      startDate: vehicleForm.startDate,
      endDate: vehicleForm.endDate,
      startOdometer: Number(vehicleForm.startMileageKm),
      nextServiceDate: '2027-01-15',
      taxExpiryDate: '2027-06-30',
    });
    setIsVehicleModalOpen(false);
    setVehicleForm({ ...vehicleForm, purpose: '' });
  };

  const handleCreateSupplyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const item = officeSupplies.find((s) => s.id === supplyForm.supplyId);
    if (!item) return;
    addOfficeSupplyRequest({
      requesterId: employees[0]?.id || 'emp-001',
      department: 'General Affairs',
      itemId: item.id,
      qty: Number(supplyForm.quantity),
      reason: supplyForm.purpose || 'Kebutuhan operasional kantor harian',
    });
    setIsSupplyModalOpen(false);
    setSupplyForm({ ...supplyForm, purpose: '' });
  };

  const handleReturnVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForReturn) return;
    updateVehicleBookingStatus(
      selectedVehicleForReturn.id,
      'Dikembalikan',
      Number(returnForm.endOdometer),
      Number(returnForm.tollFuelCost)
    );
    setSelectedVehicleForReturn(null);
  };

  const handleAddSupplyItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplyForm.itemName) return;
    addOfficeSupply({
      itemCode: newSupplyForm.itemCode || `ATK-${Date.now().toString().slice(-4)}`,
      itemName: newSupplyForm.itemName,
      category: newSupplyForm.category,
      currentStock: Number(newSupplyForm.currentStock),
      reorderPoint: Number(newSupplyForm.reorderPoint),
      standardReorderQty: Number(newSupplyForm.standardReorderQty || 10),
      estimatedUnitPrice: Number(newSupplyForm.estimatedUnitPrice || 45000),
      unit: newSupplyForm.unit,
    });
    setIsAddSupplyModalOpen(false);
    setNewSupplyForm({
      itemCode: `ATK-${Date.now().toString().slice(-4)}`,
      itemName: '',
      category: 'Kertas & Dokumen',
      currentStock: 25,
      reorderPoint: 5,
      standardReorderQty: 10,
      estimatedUnitPrice: 45000,
      unit: 'Rim',
    });
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title) return;
    addGaTicket({
      category: ticketForm.category,
      title: ticketForm.title,
      description: ticketForm.description,
      priority: ticketForm.urgency,
      requesterId: employees[0]?.id || 'emp-001',
      slaHours: ticketForm.urgency === 'Darurat' ? 2 : ticketForm.urgency === 'Tinggi' ? 8 : 24,
    });
    setIsTicketModalOpen(false);
    setTicketForm({ ...ticketForm, title: '', description: '' });
  };

  const handleResolveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForResolve) return;
    updateGaTicketStatus(selectedTicketForResolve.id, 'Selesai', ticketResolutionNotes || 'Masalah telah ditangani oleh tim teknisi GA.');
    setSelectedTicketForResolve(null);
    setTicketResolutionNotes('');
  };

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const generatedCode =
      assetCode || `${assetPrefix}-${category.substring(0, 3).toUpperCase()}-${String(assets.length + 1).padStart(3, '0')}`;

    addAsset({
      assetCode: generatedCode,
      name,
      category,
      building,
      room,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: Number(purchasePrice),
      condition: 'Baik',
      assignedToEmployeeId: assignedEmployeeId || undefined,
    });

    setIsRegisterModalOpen(false);
    setName('');
    setAssetCode('');
  };

  const handleExecuteMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiAssetId) return;

    updateAsset(mutasiAssetId, {
      assignedToEmployeeId: newTargetEmpId || undefined,
      building: newTargetBuilding,
      room: newTargetRoom,
    });

    alert('Perpindahan / Mutasi aset berhasil dieksekusi dan riwayat penanggung jawab telah diperbarui!');
    setIsMutasiModalOpen(false);
    setMutasiNotes('');
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintAssetId || !maintIssue) return;

    const ast = assets.find((a) => a.id === maintAssetId);
    addMaintenanceTicket({
      assetCode: ast?.assetCode || 'AST-001',
      assetName: ast?.name || 'Aset Kantor',
      reporterEmployeeId: employees[0]?.id || '',
      issueType: maintType,
      priority: 'Sedang',
      description: maintIssue,
      cost: Number(maintCost),
    });

    alert('Tiket perbaikan aset berhasil dibuat dan diteruskan ke General Affairs & Teknisi!');
    setIsMaintenanceModalOpen(false);
    setMaintIssue('');
  };

  const handleExecuteScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode) return;

    const success = performStockOpname(scannedCode.trim(), scanCondition);
    if (success) {
      setScanFeedback({
        success: true,
        msg: `Aset [${scannedCode}] berhasil diverifikasi! Kondisi diperbarui menjadi "${scanCondition}" dan tanggal stock opname tercatat hari ini.`,
      });
      setScannedCode('');
    } else {
      setScanFeedback({
        success: false,
        msg: `Aset dengan kode [${scannedCode}] tidak ditemukan pada tenant ${currentTenant.name}.`,
      });
    }
  };

  const handleSaveSettings = () => {
    alert('Pengaturan Modul General Affairs & Inventaris berhasil disimpan!');
  };

  return (
    <div className="space-y-5">
      {/* Row 1: Module Header */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-600" />
          <span>Manajemen General Affairs (GA), Aset QR & Pemeliharaan</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pencatatan inventaris gedung, mutasi & serah terima BAST karyawan, tiket perbaikan & penggantian aset rusak, serta stock opname QR Code.
        </p>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar (Not Parallel to Title) */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('aset')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'aset'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Daftar Aset & QR</span>
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'mutasi'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Mutasi & Penggunaan</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'maintenance'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Tiket Perbaikan</span>
          {assetMaintenanceTickets.length > 0 && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === 'maintenance'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {assetMaintenanceTickets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('opname')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'opname'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Pindai QR Opname</span>
        </button>

        <button
          onClick={() => setActiveTab('ruang_rapat')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'ruang_rapat'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <DoorClosed className="w-3.5 h-3.5" />
          <span>Ruang Rapat</span>
        </button>

        <button
          onClick={() => setActiveTab('kendaraan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'kendaraan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Kendaraan / Fleet</span>
        </button>

        <button
          onClick={() => setActiveTab('atk')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'atk'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>ATK & Supplies</span>
        </button>

        <button
          onClick={() => setActiveTab('tiket_ga')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'tiket_ga'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>GA Helpdesk</span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pengaturan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Pengaturan GA</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: DAFTAR ASET */}
      {activeTab === 'aset' && (
        <div className="space-y-4">
          {/* Filter & Action Toolbar */}
          <div className="bg-white p-3 sm:p-3.5 border border-slate-200 rounded-xl shadow-xs space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="relative w-full lg:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kode aset, nama perangkat, ruangan..."
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="all">Semua Kategori</option>
                <option value="Laptop & Komputer">Laptop & Komputer</option>
                <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                <option value="Furniture & Kantor">Furniture & Kantor</option>
                <option value="Elektronik & Server">Elektronik & Server</option>
                <option value="Gedung & Ruangan">Gedung & Ruangan</option>
              </select>

              {(searchQuery || categoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shrink-0"
                  title="Reset Filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}

              <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => setIsMutasiModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mutasi / Serah Terima</span>
                </button>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrasi Aset Baru</span>
                </button>
              </div>
            </div>
          </div>

          {/* Asset Table */}
          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {filteredAssets.map((asset) => {
              const assignedEmp = employees.find((e) => e.id === asset.assignedToEmployeeId);
              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetForQR(asset)}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                >
                  {/* Top Bar: Code, Category & Condition */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {asset.assetCode}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {asset.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                        {asset.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        asset.condition === 'Baik'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : asset.condition === 'Perlu Perbaikan'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {asset.condition}
                    </span>
                  </div>

                  {/* 2-Column Info Grid */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Lokasi:</span>
                      <div className="font-semibold text-slate-800 truncate">{asset.room}</div>
                      <div className="text-[10px] text-slate-500 truncate">{asset.building}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Penanggung Jawab:</span>
                      {assignedEmp ? (
                        <div>
                          <div className="font-semibold text-slate-800 truncate">{assignedEmp.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{assignedEmp.nik}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Pool Umum GA</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Price & QR Label button */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nilai Perolehan:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(asset.purchasePrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssetForQR(asset);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-200 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Label & Berkas QR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAMPILAN DESKTOP: Table of Assets (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Kode & QR</th>
                    <th className="py-2.5 px-3 font-semibold">Nama Aset & Spesifikasi</th>
                    <th className="py-2.5 px-3 font-semibold">Kategori</th>
                    <th className="py-2.5 px-3 font-semibold">Lokasi Ruangan</th>
                    <th className="py-2.5 px-3 font-semibold">Penanggung Jawab</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Nilai Perolehan</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Kondisi</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Label QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map((asset) => {
                    const assignedEmp = employees.find((e) => e.id === asset.assignedToEmployeeId);
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAssetForQR(asset)}
                        className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                        title="Klik baris untuk melihat label QR & berkas identitas aset"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {asset.assetCode}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Beli: {asset.purchaseDate}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{asset.category}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div>{asset.room}</div>
                          <div className="text-[10px] text-slate-400">{asset.building}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {assignedEmp ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={assignedEmp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover border"
                              />
                              <div>
                                <div className="font-semibold text-slate-900 leading-tight">{assignedEmp.fullName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{assignedEmp.nik}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Pool Umum GA</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatRupiah(asset.purchasePrice)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              asset.condition === 'Baik'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : asset.condition === 'Perlu Perbaikan'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {asset.condition}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedAssetForQR(asset)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Label</span>
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

      {/* TAB 2: MUTASI & PENGGUNAAN ASET */}
      {activeTab === 'mutasi' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Riwayat Perpindahan & Serah Terima Aset (BAST)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan alokasi perangkat kerja kepada personil baru atau mutasi antar gedung dan departemen.
              </p>
            </div>
            <button
              onClick={() => setIsMutasiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Mutasi Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.slice(0, 4).map((ast) => {
              const emp = employees.find((e) => e.id === ast.assignedToEmployeeId);
              return (
                <div key={ast.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 text-xs">{ast.assetCode}</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{ast.name}</h4>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {ast.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pengguna Saat Ini:</span>
                      <span className="font-semibold text-slate-900">{emp ? emp.fullName : 'Pool GA'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lokasi Penempatan:</span>
                      <span>{ast.room} ({ast.building})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kondisi:</span>
                      <span className="font-semibold text-emerald-700">{ast.condition}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMutasiAssetId(ast.id);
                        setIsMutasiModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded transition-colors"
                    >
                      Pindahkan Aset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TIKET PERBAIKAN & PENGGANTIAN */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Tiket Pemeliharaan, Perbaikan & Penggantian Aset Rusak</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan keluhan perangkat, penugasan teknisi/vendor, estimasi biaya reparasi, dan status penyelesaian.
              </p>
            </div>
            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Tiket Perbaikan</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">No. Tiket</th>
                  <th className="py-2.5 px-3 font-semibold">Aset</th>
                  <th className="py-2.5 px-3 font-semibold">Tindakan & Deskripsi Masalah</th>
                  <th className="py-2.5 px-3 font-semibold">Vendor / Teknisi</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Estimasi Biaya</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Aksi GA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assetMaintenanceTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handlePreviewMaintenanceTicket(t)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                    title="Klik baris untuk mem-preview Berita Acara Perbaikan GA & Surat Tugas"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{t.assetName}</div>
                      <div className="text-[10px] text-indigo-700 font-mono">{t.assetCode}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{t.issueType}</div>
                      <div className="text-[11px] text-slate-500">{t.description}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{t.assignedTechnician || 'Mitra Teknisi'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatRupiah(t.cost || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === 'Selesai Diperbaiki'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'Sedang Dikerjakan GA'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.status !== 'Selesai Diperbaiki' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {t.status === 'Tiket Dibuka' && (
                            <button
                              onClick={() => updateMaintenanceTicket(t.id, 'Sedang Dikerjakan GA')}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold"
                            >
                              Kerjakan
                            </button>
                          )}
                          <button
                            onClick={() => updateMaintenanceTicket(t.id, 'Selesai Diperbaiki')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                          >
                            Selesai
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Tutup Tiket</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SCAN OPNAME */}
      {activeTab === 'opname' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 border border-slate-200 rounded-lg">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <ScanLine className="w-5 h-5 text-indigo-600" />
              <span>Simulasi Pemindai QR Stock Opname</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pindai stiker QR pada fisik aset secara langsung menggunakan kamera scanner atau input kode secara manual untuk validasi fisik aset.
            </p>

            <form onSubmit={handleExecuteScan} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode Aset QR</label>
                <input
                  type="text"
                  placeholder="Contoh: AST-LTP-001"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono uppercase font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kondisi Hasil Pemeriksaan Fisik</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Baik', 'Rusak Ringan', 'Rusak Berat'] as AssetCondition[]).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setScanCondition(cond)}
                      className={`p-2 rounded border font-semibold transition-colors ${
                        scanCondition === cond
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded shadow-xs"
              >
                Konfirmasi Verifikasi Stock Opname
              </button>
            </form>

            {scanFeedback && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                  scanFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {scanFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{scanFeedback.msg}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center">
            <div className="w-40 h-40 border-2 border-dashed border-indigo-400 rounded-xl flex items-center justify-center bg-white shadow-xs mb-3">
              <Camera className="w-12 h-12 text-indigo-500 animate-pulse" />
            </div>
            <div className="text-xs font-semibold text-slate-800">Visual QR Scanner Active</div>
            <div className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Arahkan kamera ke label QR aset untuk membaca metadata secara instan.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PENGATURAN GA */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white p-6 border border-slate-200 rounded-lg max-w-3xl space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan General Affairs & Inventaris Aset</span>
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi penomoran kode aset, depresiasi akuntansi, dan frekuensi audit fisik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Prefix Kode Aset</label>
              <input
                type="text"
                value={assetPrefix}
                onChange={(e) => setAssetPrefix(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Masa Depresiasi (Tahun)</label>
              <input
                type="number"
                value={deprecYears}
                onChange={(e) => setDeprecYears(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Frekuensi Stock Opname</label>
              <select
                value={stockOpnameFreq}
                onChange={(e) => setStockOpnameFreq(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
              >
                <option value="Bulanan">Bulanan</option>
                <option value="Triwulan">Triwulan (3 Bulan Sekali)</option>
                <option value="Semester">Semester (6 Bulan Sekali)</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="bastCheck"
                checked={requireBast}
                onChange={(e) => setRequireBast(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="bastCheck" className="text-slate-700 font-medium cursor-pointer">
                Wajib terbitkan BAST saat serah terima
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
            >
              Simpan Pengaturan GA
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: PEMINJAMAN RUANG RAPAT & NOTULEN */}
      {activeTab === 'ruang_rapat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DoorClosed className="w-4 h-4 text-indigo-600" />
                <span>Peminjaman Ruang Rapat & Notulen</span>
              </h3>
              <p className="text-xs text-slate-500">
                Reservasi ruang rapat kantor terintegrasi, kapasitas peserta, proyektor/TV, dan dokumentasi notulen rapat.
              </p>
            </div>
            <button
              onClick={() => setIsRoomModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Booking Ruangan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomBookings.map((rb) => (
              <div key={rb.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{rb.roomName}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    rb.status === 'Terkonfirmasi' ? 'bg-emerald-100 text-emerald-700' :
                    rb.status === 'Selesai' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {rb.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">{rb.meetingTitle}</div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rb.date} · {rb.startTime} - {rb.endTime} WIB</span>
                  </div>
                  <div className="text-slate-500">
                    Pemohon: <span className="font-medium text-slate-700">{employees.find((e) => e.id === rb.organizerId)?.fullName || 'Aditya Pratama'}</span> ({rb.capacity} Peserta)
                  </div>
                </div>

                {rb.momNotes ? (
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700 block mb-0.5">Notulen Rapat Tersimpan:</span>
                    <p className="text-slate-600 text-[11px] line-clamp-3 italic">"{rb.momNotes}"</p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedBookingForMinutes(rb);
                      setMeetingMinutesText('');
                    }}
                    className="w-full py-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Input Notulen Rapat</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: KENDARAAN OPERASIONAL & LOG BBM/KM */}
      {activeTab === 'kendaraan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                <span>Peminjaman Kendaraan Operasional & Log BBM/KM</span>
              </h3>
              <p className="text-xs text-slate-500">
                Peminjaman armada mobil dinas, penugasan driver, pencatatan odometer (KM awal/akhir), dan biaya bahan bakar (BBM).
              </p>
            </div>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Booking Kendaraan</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Kendaraan / Nopol</th>
                  <th className="p-3">Peminjam & Driver</th>
                  <th className="p-3">Keperluan / Rute</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Odometer & BBM</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleBookings.map((vb) => (
                  <tr key={vb.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-slate-900">
                      {vb.vehicleName}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{employees.find((e) => e.id === vb.borrowerId)?.fullName || 'Aditya Pratama'}</div>
                      <div className="text-[11px] text-slate-400">Driver: {vb.driverName || 'Lepas Kunci'}</div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">{vb.purpose}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {vb.startDate} s/d {vb.endDate}
                    </td>
                    <td className="p-3 text-slate-700 font-mono text-[11px]">
                      <div>{vb.startOdometer ? `${vb.startOdometer.toLocaleString()} KM` : '-'} {vb.endOdometer ? `→ ${vb.endOdometer.toLocaleString()} KM` : ''}</div>
                      {vb.fuelCost ? <div className="text-emerald-600 font-semibold">{formatRupiah(vb.fuelCost)}</div> : null}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        vb.status === 'Disetujui' ? 'bg-blue-100 text-blue-700' :
                        vb.status === 'Sedang Digunakan' ? 'bg-amber-100 text-amber-700' :
                        vb.status === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {vb.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {vb.status === 'Disetujui' && (
                        <button
                          onClick={() => updateVehicleBookingStatus(vb.id, 'Sedang Digunakan')}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-semibold"
                        >
                          Mulai Jalan
                        </button>
                      )}
                      {vb.status === 'Sedang Digunakan' && (
                        <button
                          onClick={() => {
                            setSelectedVehicleForReturn(vb);
                            setReturnForm({
                              returnDate: new Date().toISOString().split('T')[0],
                              endOdometer: (vb.startOdometer || 0) + 65,
                              tollFuelCost: 150000,
                              returnNotes: 'Kendaraan dikembalikan dalam kondisi prima dan bersih.',
                            });
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                        >
                          Kembalikan Kendaraan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ATK & OFFICE SUPPLIES */}
      {activeTab === 'atk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Pengelolaan ATK & Office Supplies</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan stok fisik alat tulis kantor, batas minimal restock, dan persetujuan permintaan ATK divisi/karyawan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddSupplyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>+ Master ATK Baru</span>
              </button>
              <button
                onClick={() => setIsSupplyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Permintaan ATK</span>
              </button>
            </div>
          </div>

          {/* Stock Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {officeSupplies.map((sup) => {
              const isLow = sup.currentStock <= sup.reorderPoint;
              return (
                <div key={sup.id} className={`p-3 rounded-lg border bg-white shadow-xs ${isLow ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{sup.category}</div>
                  <div className="font-semibold text-slate-900 text-xs mt-1 truncate">{sup.itemName}</div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-lg font-bold font-mono ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                      {sup.currentStock}
                    </span>
                    <span className="text-[11px] text-slate-500">{sup.unit}</span>
                  </div>
                  {isLow && (
                    <span className="inline-block mt-1 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                      Perlu Reorder (Min: {sup.reorderPoint})
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Supply Requests Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Daftar Permintaan ATK dari Karyawan & Divisi
            </div>
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/50">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Pemohon</th>
                  <th className="p-3">Barang ATK</th>
                  <th className="p-3">Jumlah</th>
                  <th className="p-3">Alasan / Tujuan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi HR/GA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officeSupplyRequests.map((req) => {
                  const supplyItem = officeSupplies.find((s) => s.id === req.itemId);
                  const requester = employees.find((e) => e.id === req.requesterId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-slate-600">{req.requestDate}</td>
                      <td className="p-3 font-medium text-slate-800">{requester?.fullName || 'Aditya Pratama'}</td>
                      <td className="p-3 font-semibold text-slate-900">{supplyItem?.itemName || 'Barang ATK'}</td>
                      <td className="p-3 font-mono font-bold">{req.qty} {supplyItem?.unit || 'Unit'}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{req.reason}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          req.status === 'Disetujui' || req.status === 'Didistribusikan' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'Menunggu Approval' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {req.status === 'Menunggu Approval' && (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => reviewOfficeSupplyRequest(req.id, true)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => reviewOfficeSupplyRequest(req.id, false)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: GA HELPDESK & SERVICE DESK TICKETING */}
      {activeTab === 'tiket_ga' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-600" />
                <span>GA Service Desk & Helpdesk Ticketing</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pusat pengaduan fasilitas, AC, kelistrikan, kebersihan, dan kebutuhan operasional kantor dengan SLA terukur.
              </p>
            </div>
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Tiket GA</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">No. Tiket</th>
                  <th className="p-3">Judul Masalah & Deskripsi</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Pelapor</th>
                  <th className="p-3">Prioritas</th>
                  <th className="p-3">SLA & Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gaTickets.map((t) => {
                  const requester = employees.find((e) => e.id === t.requesterId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-indigo-700">{t.ticketNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-slate-500">{t.description}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{t.category}</td>
                      <td className="p-3 text-slate-700">{requester?.fullName || 'Aditya Pratama'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.priority === 'Darurat' ? 'bg-rose-100 text-rose-700 font-bold' :
                          t.priority === 'Tinggi' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{t.status}</div>
                        <div className="text-[10px] text-slate-400">SLA: {t.slaHours} Jam</div>
                      </td>
                      <td className="p-3 text-right">
                        {t.status !== 'Selesai' && (
                          <button
                            onClick={() => {
                              setSelectedTicketForResolve(t);
                              setTicketResolutionNotes('');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                          >
                            Tandai Selesai
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRASI ASET BARU */}
      {isRegisterModalOpen && (
        <div
          onClick={() => setIsRegisterModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Registrasi Aset Baru</h3>
              <button onClick={() => setIsRegisterModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Perangkat / Aset</label>
                <input
                  type="text"
                  placeholder="Contoh: MacBook Pro 16 M3 Max"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="Laptop & Komputer">Laptop & Komputer</option>
                    <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                    <option value="Furniture & Kantor">Furniture & Kantor</option>
                    <option value="Elektronik & Server">Elektronik & Server</option>
                    <option value="Gedung & Ruangan">Gedung & Ruangan</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga Pembelian (Rp)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gedung</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ruangan / Penempatan</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Penanggung Jawab Awal (Opsional)</label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={assignedEmployeeId}
                  onSelect={(id) => setAssignedEmployeeId(id)}
                  placeholder="-- Belum Ditugaskan (Pool Umum GA) --"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Simpan Aset & Buat QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MUTASI ASET */}
      {isMutasiModalOpen && (
        <div
          onClick={() => setIsMutasiModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Perpindahan / Mutasi & Serah Terima Aset</h3>
              <button onClick={() => setIsMutasiModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleExecuteMutasi} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilih Aset Yang Dimutasi</label>
                <select
                  value={mutasiAssetId}
                  onChange={(e) => setMutasiAssetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.assetCode}] {a.name} - ({a.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Penerima Baru / Pemegang Tanggung Jawab</label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={newTargetEmpId}
                  onSelect={(id) => setNewTargetEmpId(id)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gedung Baru</label>
                  <input
                    type="text"
                    value={newTargetBuilding}
                    onChange={(e) => setNewTargetBuilding(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ruangan Baru</label>
                  <input
                    type="text"
                    value={newTargetRoom}
                    onChange={(e) => setNewTargetRoom(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan & Catatan BAST</label>
                <textarea
                  rows={2}
                  value={mutasiNotes}
                  onChange={(e) => setMutasiNotes(e.target.value)}
                  placeholder="Kebutuhan rotasi jabatan atau penambahan personil..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMutasiModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Konfirmasi Serah Terima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TIKET PERBAIKAN */}
      {isMaintenanceModalOpen && (
        <div
          onClick={() => setIsMaintenanceModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Buat Tiket Perbaikan & Penggantian Aset</h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Aset Yang Bermasalah</label>
                <select
                  value={maintAssetId}
                  onChange={(e) => setMaintAssetId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.assetCode}] {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Tindakan</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="Perbaikan Ringan">Perbaikan Ringan</option>
                    <option value="Penggantian Sparepart">Penggantian Sparepart</option>
                    <option value="Penggantian Unit Baru">Penggantian Unit Baru</option>
                    <option value="Servis Rutin Berkala">Servis Rutin Berkala</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    value={maintCost}
                    onChange={(e) => setMaintCost(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Vendor Teknisi</label>
                <input
                  type="text"
                  value={maintVendor}
                  onChange={(e) => setMaintVendor(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Gejala Kerusakan</label>
                <textarea
                  rows={2}
                  value={maintIssue}
                  onChange={(e) => setMaintIssue(e.target.value)}
                  placeholder="Misal: Layar flickering, baterai cepat panas..."
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Kirim Tiket Perbaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOKING RUANG RAPAT */}
      {isRoomModalOpen && (
        <div
          onClick={() => setIsRoomModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Formulir Reservasi Ruang Rapat</h3>
              <button onClick={() => setIsRoomModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateRoomBooking} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilihan Ruangan</label>
                <select
                  value={roomForm.roomName}
                  onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="Ruang Meeting VIP - Lantai 18">Ruang Meeting VIP - Lantai 18 (Kapasitas 12)</option>
                  <option value="Ruang Kolaborasi B - Lantai 18">Ruang Kolaborasi B - Lantai 18 (Kapasitas 6)</option>
                  <option value="Boardroom Direksi - Lantai 20">Boardroom Direksi - Lantai 20 (Kapasitas 20)</option>
                  <option value="Training Center - Lantai 16">Training Center - Lantai 16 (Kapasitas 35)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Topik / Agenda Rapat *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sprint Planning & Sync Target Q4"
                  value={roomForm.topic}
                  onChange={(e) => setRoomForm({ ...roomForm, topic: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ValidatedDateInput
                  id="roomMeetingDate"
                  label="Tanggal *"
                  value={roomForm.meetingDate}
                  onChange={(val) => setRoomForm({ ...roomForm, meetingDate: val })}
                  required
                />
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mulai</label>
                  <input
                    type="time"
                    required
                    value={roomForm.startTime}
                    onChange={(e) => setRoomForm({ ...roomForm, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selesai</label>
                  <input
                    type="time"
                    required
                    value={roomForm.endTime}
                    onChange={(e) => setRoomForm({ ...roomForm, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimasi Jumlah Peserta</label>
                <input
                  type="number"
                  min={1}
                  value={roomForm.participantsCount}
                  onChange={(e) => setRoomForm({ ...roomForm, participantsCount: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Konfirmasi Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT NOTULEN RAPAT */}
      {selectedBookingForMinutes && (
        <div
          onClick={() => setSelectedBookingForMinutes(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Dokumentasi Notulen Rapat</h3>
              <button onClick={() => setSelectedBookingForMinutes(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleSaveMinutes} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-bold text-slate-900">{selectedBookingForMinutes.meetingTitle}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedBookingForMinutes.roomName} · {selectedBookingForMinutes.date} ({selectedBookingForMinutes.startTime} - {selectedBookingForMinutes.endTime})
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hasil Rapat & Action Items *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ringkasan keputusan rapat, pembagian tugas PIC, dan target penyelesaian..."
                  value={meetingMinutesText}
                  onChange={(e) => setMeetingMinutesText(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForMinutes(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Simpan Notulen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOKING KENDARAAN */}
      {isVehicleModalOpen && (
        <div
          onClick={() => setIsVehicleModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Formulir Peminjaman Mobil Operasional</h3>
              <button onClick={() => setIsVehicleModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateVehicleBooking} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Armada Mobil</label>
                <select
                  value={vehicleForm.vehicleName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="Toyota Innova Zenix (B 1234 NTM)">Toyota Innova Zenix (B 1234 NTM)</option>
                  <option value="Toyota Avanza Veloz (B 5678 NTM)">Toyota Avanza Veloz (B 5678 NTM)</option>
                  <option value="Toyota HiAce Commuter (B 9012 NTM)">Toyota HiAce Commuter 15-Seater (B 9012 NTM)</option>
                  <option value="Daihatsu GranMax Blindvan (B 3456 NTM)">Daihatsu GranMax Blindvan Logistik (B 3456 NTM)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tujuan / Keperluan Dinas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kunjungan Audit Proyek Site Karawang"
                  value={vehicleForm.purpose}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, purpose: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Penugasan Pengemudi</label>
                <input
                  type="text"
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ValidatedDateInput
                  id="vehicleStartDate"
                  label="Tanggal Mulai *"
                  value={vehicleForm.startDate}
                  onChange={(val) => setVehicleForm({ ...vehicleForm, startDate: val })}
                  required
                />
                <ValidatedDateInput
                  id="vehicleEndDate"
                  label="Tanggal Selesai *"
                  value={vehicleForm.endDate}
                  minDate={vehicleForm.startDate}
                  onChange={(val) => setVehicleForm({ ...vehicleForm, endDate: val })}
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Odometer KM Awal</label>
                <input
                  type="number"
                  value={vehicleForm.startMileageKm}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, startMileageKm: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Ajukan Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PERMINTAAN ATK */}
      {isSupplyModalOpen && (
        <div
          onClick={() => setIsSupplyModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Formulir Permintaan ATK</h3>
              <button onClick={() => setIsSupplyModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplyRequest} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pilihan Barang ATK</label>
                <select
                  value={supplyForm.supplyId}
                  onChange={(e) => setSupplyForm({ ...supplyForm, supplyId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  {officeSupplies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.itemName} (Stok: {s.currentStock} {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jumlah Unit Diminta</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={supplyForm.quantity}
                  onChange={(e) => setSupplyForm({ ...supplyForm, quantity: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan / Penggunaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pencetakan laporan audit tahunan & dossier legalitas"
                  value={supplyForm.purpose}
                  onChange={(e) => setSupplyForm({ ...supplyForm, purpose: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplyModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Kirim Permintaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT TIKET GA */}
      {isTicketModalOpen && (
        <div
          onClick={() => setIsTicketModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Buat Tiket GA Helpdesk</h3>
              <button onClick={() => setIsTicketModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori Masalah</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="Aset Rusak/Perawatan">Aset Rusak/Perawatan</option>
                  <option value="Pinjam Ruangan/Fasilitas">Pinjam Ruangan/Fasilitas</option>
                  <option value="Pinjam Kendaraan">Pinjam Kendaraan</option>
                  <option value="Minta ATK/Perlengkapan">Minta ATK/Perlengkapan</option>
                  <option value="Lainnya (Umum)">Lainnya (Umum)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judul Permasalahan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC Ruang Meeting Lantai 18 Tidak Dingin"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lokasi Gedung / Ruang</label>
                  <input
                    type="text"
                    value={ticketForm.location}
                    onChange={(e) => setTicketForm({ ...ticketForm, location: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Prioritas</label>
                  <select
                    value={ticketForm.urgency}
                    onChange={(e) => setTicketForm({ ...ticketForm, urgency: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded font-semibold"
                  >
                    <option value="Rendah">Rendah (SLA 48 Jam)</option>
                    <option value="Normal">Normal (SLA 24 Jam)</option>
                    <option value="Tinggi">Tinggi (SLA 8 Jam)</option>
                    <option value="Darurat">Darurat (SLA 2 Jam)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rincian Deskripsi</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan kondisi detail kerusakan atau kebutuhan..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Terbitkan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SELESAIKAN TIKET GA */}
      {selectedTicketForResolve && (
        <div
          onClick={() => setSelectedTicketForResolve(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Tandai Selesai: Tiket {selectedTicketForResolve.ticketNumber}</h3>
              <button onClick={() => setSelectedTicketForResolve(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleResolveTicket} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-900">{selectedTicketForResolve.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{selectedTicketForResolve.category} · Pelapor: {employees.find((e) => e.id === selectedTicketForResolve.requesterId)?.fullName || 'Aditya Pratama'}</div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Resolusi Teknisi *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan tindakan yang telah dilakukan untuk mengatasi masalah ini..."
                  value={ticketResolutionNotes}
                  onChange={(e) => setTicketResolutionNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForResolve(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
                >
                  Konfirmasi Penyelesaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CETAK LABEL QR ASET */}
      {selectedAssetForQR && (
        <div
          onClick={() => setSelectedAssetForQR(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="text-xs font-semibold">Label Barcode / QR Aset</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button onClick={() => setSelectedAssetForQR(null)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="border-2 border-slate-900 p-4 rounded-lg inline-block bg-white shadow-sm">
                <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-1 mb-2">
                  {currentTenant.name} · ASSET TAG
                </div>
                <QRCodeView
                  value={`https://nusahr.id/asset/${selectedAssetForQR.assetCode}?tenant=${currentTenant.id}`}
                  size={140}
                />
                <div className="text-sm font-bold font-mono text-slate-900 mt-2">
                  {selectedAssetForQR.assetCode}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedAssetForQR.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAssetForQR.category} · {selectedAssetForQR.room}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGEMBALIAN ARMADA KENDARAAN */}
      {selectedVehicleForReturn && (
        <div
          onClick={() => setSelectedVehicleForReturn(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Formulir Pengembalian Armada Kendaraan</h3>
              <button onClick={() => setSelectedVehicleForReturn(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleReturnVehicle} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-800 text-sm">{selectedVehicleForReturn.vehicleName}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Driver: <span className="font-semibold text-slate-700">{selectedVehicleForReturn.driverName}</span> · Keperluan: {selectedVehicleForReturn.purpose}
                </div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Odometer Awal: <span className="font-bold font-mono text-slate-700">{selectedVehicleForReturn.startOdometer?.toLocaleString()} KM</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tanggal Pengembalian Fisik</label>
                <input
                  type="date"
                  required
                  value={returnForm.returnDate}
                  onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Odometer Akhir (KM)</label>
                  <input
                    type="number"
                    min={selectedVehicleForReturn.startOdometer || 0}
                    required
                    value={returnForm.endOdometer}
                    onChange={(e) => setReturnForm({ ...returnForm, endOdometer: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Jarak tempuh: {Math.max(0, returnForm.endOdometer - (selectedVehicleForReturn.startOdometer || 0))} KM
                  </span>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Biaya BBM & Tol (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={returnForm.tollFuelCost}
                    onChange={(e) => setReturnForm({ ...returnForm, tollFuelCost: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                    {formatRupiah(returnForm.tollFuelCost)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Kondisi Mobil & Keterangan</label>
                <textarea
                  rows={2}
                  required
                  value={returnForm.returnNotes}
                  onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
                  placeholder="Misal: Kondisi bersih, bensin terisi separuh, tidak ada baret..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForReturn(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
                >
                  Konfirmasi Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRASI MASTER ATK BARU */}
      {isAddSupplyModalOpen && (
        <div
          onClick={() => setIsAddSupplyModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Formulir Tambah Master Barang ATK</h3>
              <button onClick={() => setIsAddSupplyModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleAddSupplyItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Barang / ATK</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kertas HVS A4 80gr PaperOne, Pulpen Joyko Gel 0.5..."
                  value={newSupplyForm.itemName}
                  onChange={(e) => setNewSupplyForm({ ...newSupplyForm, itemName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori ATK</label>
                  <select
                    value={newSupplyForm.category}
                    onChange={(e) => setNewSupplyForm({ ...newSupplyForm, category: e.target.value as GAOfficeSupply['category'] })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="Kertas & Dokumen">Kertas & Dokumen</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                    <option value="Tinta & Toner">Tinta & Toner</option>
                    <option value="Peralatan Kantor">Peralatan Kantor</option>
                    <option value="Kebersihan & Pantry">Kebersihan & Pantry</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Satuan Kemasan</label>
                  <select
                    value={newSupplyForm.unit}
                    onChange={(e) => setNewSupplyForm({ ...newSupplyForm, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="Rim">Rim</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Botol">Botol</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stok Awal Fisik</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSupplyForm.currentStock}
                    onChange={(e) => setNewSupplyForm({ ...newSupplyForm, currentStock: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batas Minimal Reorder</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSupplyForm.reorderPoint}
                    onChange={(e) => setNewSupplyForm({ ...newSupplyForm, reorderPoint: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Notifikasi restock jika dibawah angka ini</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddSupplyModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Simpan Master ATK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
