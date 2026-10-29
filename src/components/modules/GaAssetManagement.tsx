import React, { useState, useRef } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  QrCode,
  Building,
  Plus,
  Printer,
  Download,
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
  Loader2,
  FileDown,
  Laptop,
  Armchair,
  ShieldCheck,
  Edit2,
  RotateCcw,
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
  GAAssetCategorySla,
} from '../../types/hrms';
import { formatRupiah } from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { printPagesDirectly, exportPagesToPdf } from '../../utils/documentPdfExporter';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ValidatedDateInput } from '../common/ValidatedDateInput';
import { ScrollableTabNav } from '../common/ScrollableTabNav';
import { ModuleDocumentModal } from '../common/ModuleDocumentModal';

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

  const [activeTab, setActiveTab] = useState<'aset' | 'mutasi' | 'maintenance' | 'opname' | 'ruang_rapat' | 'kendaraan' | 'atk' | 'tiket_ga' | 'pengaturan' | 'sla_kategori'>('aset');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<GAAsset | null>(null);
  const qrLabelRef = useRef<HTMLDivElement>(null);
  const [isPrintingQR, setIsPrintingQR] = useState(false);
  const [isExportingQR, setIsExportingQR] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [slaToastMessage, setSlaToastMessage] = useState<string | null>(null);

  // Initial SLA per Kategori Aset
  const DEFAULT_ASSET_SLAS: GAAssetCategorySla[] = [
    {
      id: 'sla-cat-1',
      category: 'Laptop & Komputer (IT Assets)',
      icon: 'Laptop',
      responseSlaHours: 1,
      resolutionSlaHours: 8,
      replacementSlaHours: 2,
      procurementSlaDays: 7,
      picName: 'Rian Pratama',
      picRole: 'IT Hardware & Asset Specialist',
      priorityLevel: 'Tinggi',
      autoEscalate: true,
      notes: 'Penyediaan unit cadangan ready-to-use wajib tersedia minimal 2 unit per site.',
      updatedAt: '2026-10-25',
    },
    {
      id: 'sla-cat-2',
      category: 'Kendaraan & Mobil Operasional (Fleet)',
      icon: 'Car',
      responseSlaHours: 2,
      resolutionSlaHours: 24,
      replacementSlaHours: 4,
      procurementSlaDays: 30,
      picName: 'Bambang Sudiro',
      picRole: 'Fleet & Pool Coordinator',
      priorityLevel: 'Kritis',
      autoEscalate: true,
      notes: 'Service berkala wajib di bengkel resmi rekanan dengan garansi pengerjaan.',
      updatedAt: '2026-10-25',
    },
    {
      id: 'sla-cat-3',
      category: 'Fasilitas & Gedung (Building & Facility)',
      icon: 'Building',
      responseSlaHours: 1,
      resolutionSlaHours: 12,
      replacementSlaHours: 4,
      procurementSlaDays: 14,
      picName: 'Dedi Kurniawan',
      picRole: 'Facility & Civil Maintenance Lead',
      priorityLevel: 'Kritis',
      autoEscalate: true,
      notes: 'AC, genset, dan kelistrikan darurat memiliki batas eskalasi 1 jam.',
      updatedAt: '2026-10-26',
    },
    {
      id: 'sla-cat-4',
      category: 'Mesin & Peralatan Kantor (Office Equipment)',
      icon: 'Printer',
      responseSlaHours: 2,
      resolutionSlaHours: 16,
      replacementSlaHours: 8,
      procurementSlaDays: 14,
      picName: 'Hendra Gunawan',
      picRole: 'Office Tech Support',
      priorityLevel: 'Normal',
      autoEscalate: false,
      notes: 'Printer multifungsi & mesin absensi masuk dalam kontrak maintenance berkala.',
      updatedAt: '2026-10-24',
    },
    {
      id: 'sla-cat-5',
      category: 'Furnitur & Meja-Kursi (Furniture)',
      icon: 'Armchair',
      responseSlaHours: 4,
      resolutionSlaHours: 48,
      replacementSlaHours: 24,
      procurementSlaDays: 14,
      picName: 'Siti Rahma',
      picRole: 'General Affairs Officer',
      priorityLevel: 'Normal',
      autoEscalate: false,
      notes: 'Penggantian kursi ergonomis dan workstation kerja departemen.',
      updatedAt: '2026-10-22',
    },
    {
      id: 'sla-cat-6',
      category: 'ATK & Supplies (Consumables)',
      icon: 'Package',
      responseSlaHours: 1,
      resolutionSlaHours: 4,
      replacementSlaHours: 2,
      procurementSlaDays: 3,
      picName: 'Maya Anggraini',
      picRole: 'Pantry & ATK Inventory Controller',
      priorityLevel: 'Rendah',
      autoEscalate: false,
      notes: 'Distribusi reguler setiap hari Selasa & Kamis, permintaan darurat diproses 1 jam.',
      updatedAt: '2026-10-25',
    },
  ];

  const [assetCategorySlas, setAssetCategorySlas] = useState<GAAssetCategorySla[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hrms_ga_asset_sla_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_ASSET_SLAS;
  });

  const [editingSlaCat, setEditingSlaCat] = useState<GAAssetCategorySla | null>(null);

  const handleSaveCategorySla = (slaToSave: GAAssetCategorySla) => {
    const updated = assetCategorySlas.map((s) =>
      s.id === slaToSave.id ? { ...slaToSave, updatedAt: new Date().toISOString().split('T')[0] } : s
    );
    setAssetCategorySlas(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hrms_ga_asset_sla_settings', JSON.stringify(updated));
    }
    setEditingSlaCat(null);
    setSlaToastMessage(`SLA Kategori '${slaToSave.category}' berhasil diperbarui!`);
    setTimeout(() => setSlaToastMessage(null), 4000);
  };

  const handleResetDefaultSla = () => {
    if (confirm('Kembalikan konfigurasi SLA Kategori Aset ke standar default perusahaan?')) {
      setAssetCategorySlas(DEFAULT_ASSET_SLAS);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hrms_ga_asset_sla_settings');
      }
      setSlaToastMessage('Konfigurasi SLA Kategori Aset berhasil dikembalikan ke standar default.');
      setTimeout(() => setSlaToastMessage(null), 4000);
    }
  };

  const handlePrintQR = async () => {
    if (!qrLabelRef.current) return;
    try {
      setIsPrintingQR(true);
      await printPagesDirectly([qrLabelRef.current]);
    } catch (err) {
      console.error('Print QR failed:', err);
      alert('Gagal memproses cetak label barcode aset.');
    } finally {
      setIsPrintingQR(false);
    }
  };

  const handleDownloadQRPdf = async () => {
    if (!qrLabelRef.current || !selectedAssetForQR) return;
    try {
      setIsExportingQR(true);
      const filename = `Label_Aset_${selectedAssetForQR.assetCode}.pdf`;
      await exportPagesToPdf([qrLabelRef.current], filename);
    } catch (err) {
      console.error('Download QR PDF failed:', err);
      alert('Gagal mengunduh PDF label aset.');
    } finally {
      setIsExportingQR(false);
    }
  };

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

  // Mutasi / Perpindahan & BAST Serah Terima Multi-Aset State
  type BastHandoverCategory =
    | 'Aset Karyawan (Personal)'
    | 'Aset Menetap di Ruangan'
    | 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
    | 'Penukaran Aset Antar Karyawan (Melalui GA)';

  interface BastHandoverItem {
    assetId: string;
    assetCode: string;
    assetName: string;
    category: string;
    condition: string;
  }

  interface BastHandoverRecord {
    id: string;
    bastNumber: string;
    handoverDate: string;
    handoverCategory: BastHandoverCategory;
    gaOfficerName: string;
    gaOfficerRole: string;
    recipientEmployeeId: string;
    recipientName: string;
    recipientRole: string;
    isRoomLeaderResponsible?: boolean;
    swapPartyAEmployeeId?: string;
    swapPartyAName?: string;
    swapPartyARole?: string;
    swapPartyAItems?: BastHandoverItem[];
    swapPartyBItems?: BastHandoverItem[];
    building: string;
    roomOrArea: string;
    items: BastHandoverItem[];
    additionalAccessories?: string;
    vehiclePlateNumber?: string;
    vehicleStartOdometerKm?: number;
    vehicleDocumentsIncluded?: string;
    facilitySkNumber?: string;
    notes: string;
    status: 'Aktif / Diserahterimakan' | 'Ditukar Melalui GA' | 'Dikembalikan ke GA';
  }

  const DEFAULT_BAST_HANDOVERS: BastHandoverRecord[] = [
    {
      id: 'bast-1',
      bastNumber: 'BAST/GA-EMP/2026/10/001',
      handoverDate: '2026-10-10',
      handoverCategory: 'Aset Karyawan (Personal)',
      gaOfficerName: 'Bambang Sudiro',
      gaOfficerRole: 'General Affairs & Asset Custodian',
      recipientEmployeeId: employees[0]?.id || 'emp-1',
      recipientName: employees[0]?.fullName || 'Budi Santoso',
      recipientRole: `${employees[0]?.position || 'Senior Software Engineer'} (${employees[0]?.department || 'Engineering'})`,
      building: 'Menara Palma Kuningan',
      roomOrArea: 'Lantai 18 - Dev Wing',
      items: [
        {
          assetId: assets[0]?.id || 'ast-1',
          assetCode: assets[0]?.assetCode || 'AST-LTP-001',
          assetName: assets[0]?.name || 'MacBook Pro 16" M3 Max 36GB',
          category: 'Laptop & Komputer',
          condition: 'Baik',
        },
        {
          assetId: 'ast-acc-mouse-01',
          assetCode: 'AST-ACC-014',
          assetName: 'Logitech MX Master 3S Wireless Mouse',
          category: 'Laptop & Komputer',
          condition: 'Baik',
        },
        {
          assetId: 'ast-acc-mon-01',
          assetCode: 'AST-ELK-022',
          assetName: 'Monitor Dell UltraSharp 27" 4K USB-C Hub',
          category: 'Elektronik & Server',
          condition: 'Baik',
        },
      ],
      additionalAccessories: 'Adaptor MagSafe 140W, Kabel USB-C DisplayPort, Tas Laptop Ransel',
      notes: 'Serah terima 3 perangkat kerja personal karyawan sekaligus dalam 1 BAST antara GA dan Karyawan Penerima.',
      status: 'Aktif / Diserahterimakan',
    },
    {
      id: 'bast-2',
      bastNumber: 'BAST/GA-ROOM/2026/10/002',
      handoverDate: '2026-10-12',
      handoverCategory: 'Aset Menetap di Ruangan',
      gaOfficerName: 'Siti Rahma',
      gaOfficerRole: 'General Affairs Officer',
      recipientEmployeeId: employees[1]?.id || 'emp-2',
      recipientName: employees[1]?.fullName || 'Siti Aminah',
      recipientRole: `Pimpinan Ruangan / Head of ${employees[1]?.department || 'HR & GA'}`,
      isRoomLeaderResponsible: true,
      building: 'Menara Palma Kuningan',
      roomOrArea: 'Ruang Meeting Utama & Area Kerja Lantai 18',
      items: [
        {
          assetId: 'ast-room-tv',
          assetCode: 'AST-RM-101',
          assetName: 'Smart TV Interactive 75 Inch 4K Conference',
          category: 'Elektronik & Server',
          condition: 'Baik',
        },
        {
          assetId: 'ast-room-prj',
          assetCode: 'AST-RM-102',
          assetName: 'Proyektor Laser Epson EB-L200F + Layar Elektrik',
          category: 'Elektronik & Server',
          condition: 'Baik',
        },
        {
          assetId: 'ast-room-ac',
          assetCode: 'AST-RM-103',
          assetName: 'AC Split Ducting Daikin 3 PK (2 Unit) & Meja Konferensi 16 Kursi',
          category: 'Furniture & Kantor',
          condition: 'Baik',
        },
      ],
      additionalAccessories: '2 Remote AC, 1 Remote TV, 1 Kabel HDMI 10 Meter, Speakerphone Poly Sync',
      notes: 'Aset menetap di ruangan menjadi tanggung jawab Pimpinan di ruangan tersebut (serah terima GA dengan Pimpinan Ruangan).',
      status: 'Aktif / Diserahterimakan',
    },
    {
      id: 'bast-3',
      bastNumber: 'BAST/GA-FAC-VEH/2026/10/003',
      handoverDate: '2026-10-15',
      handoverCategory: 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)',
      gaOfficerName: 'Bambang Sudiro',
      gaOfficerRole: 'Fleet & GA Manager',
      recipientEmployeeId: employees[2]?.id || employees[0]?.id || 'emp-3',
      recipientName: employees[2]?.fullName || employees[0]?.fullName || 'Rizky Pratama',
      recipientRole: `${employees[2]?.position || 'Operations Manager'} (Penerima Fasilitas Kendaraan Perusahaan)`,
      building: 'Menara Palma Kuningan',
      roomOrArea: 'Fasilitas Jabatan Melekat (Parkir Khusus B2 - Lot M-04)',
      items: [
        {
          assetId: assets.find((a) => a.category === 'Kendaraan Operasional')?.id || 'ast-veh-1',
          assetCode: assets.find((a) => a.category === 'Kendaraan Operasional')?.assetCode || 'AST-VEH-001',
          assetName:
            assets.find((a) => a.category === 'Kendaraan Operasional')?.name ||
            'Toyota Kijang Innova Zenix 2.0 G HV CVT',
          category: 'Kendaraan Operasional',
          condition: 'Baik',
        },
      ],
      vehiclePlateNumber: 'B 1234 NTM',
      vehicleStartOdometerKm: 12450,
      vehicleDocumentsIncluded: 'STNK Asli, Kartu Asuransi All-Risk, Kunci Utama & Cadangan, Buku Servis Berkala, Tool Kit',
      facilitySkNumber: 'SK-HRD/FAC-CAR/2026/019 (Fasilitas Kendaraan Jabatan Manager)',
      notes: 'Serah terima kendaraan sebagai fasilitas perusahaan yang diberikan khusus dan melekat ke 1 karyawan tersebut selama menjabat.',
      status: 'Aktif / Diserahterimakan',
    },
    {
      id: 'bast-4',
      bastNumber: 'BAST/GA-SWAP/2026/10/004',
      handoverDate: '2026-10-20',
      handoverCategory: 'Penukaran Aset Antar Karyawan (Melalui GA)',
      gaOfficerName: 'Bambang Sudiro',
      gaOfficerRole: 'General Affairs & Asset Custodian (Verifikator Penukaran)',
      swapPartyAEmployeeId: employees[3]?.id || 'emp-4',
      swapPartyAName: employees[3]?.fullName || 'Dimas Wicaksono',
      swapPartyARole: `${employees[3]?.position || 'Senior Software Engineer'} (${employees[3]?.department || 'Engineering'})`,
      recipientEmployeeId: employees[1]?.id || 'emp-2',
      recipientName: employees[1]?.fullName || 'Siti Aminah',
      recipientRole: `${employees[1]?.position || 'HR & Finance Manager'} (${employees[1]?.department || 'HR & Finance'})`,
      swapPartyAItems: [
        {
          assetId: 'ast-1',
          assetCode: 'AST-LTP-001',
          assetName: 'MacBook Pro 16" M3 Max 36GB / 1TB',
          category: 'Laptop & Komputer',
          condition: 'Baik',
        },
      ],
      swapPartyBItems: [
        {
          assetId: 'ast-2',
          assetCode: 'AST-LTP-002',
          assetName: 'ThinkPad X1 Carbon Gen 11 16GB / 512GB',
          category: 'Laptop & Komputer',
          condition: 'Baik',
        },
      ],
      building: 'Menara Palma Kuningan',
      roomOrArea: 'Lantai 18 - Engineering & HR Wing (Melalui Meja Verifikasi GA)',
      items: [
        {
          assetId: 'ast-1',
          assetCode: 'AST-LTP-001',
          assetName: 'MacBook Pro 16" M3 Max 36GB / 1TB (Dari Pihak I → Pihak II)',
          category: 'Laptop & Komputer',
          condition: 'Baik',
        },
        {
          assetId: 'ast-2',
          assetCode: 'AST-LTP-002',
          assetName: 'ThinkPad X1 Carbon Gen 11 16GB / 512GB (Dari Pihak II → Pihak I)',
          category: 'Laptop & Komputer',
          condition: 'Baik',
        },
      ],
      additionalAccessories: 'Masing-masing beserta Charger Original & Tas Laptop',
      notes: 'Penukaran aset kerja antar karyawan yang telah diperiksa kondisi fisiknya dan disahkan melalui General Affairs (GA).',
      status: 'Ditukar Melalui GA',
    },
  ];

  const [bastHandovers, setBastHandovers] = useState<BastHandoverRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nusahr_ga_bast_handovers_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_BAST_HANDOVERS;
  });

  const saveBastHandovers = (nextList: BastHandoverRecord[]) => {
    setBastHandovers(nextList);
    try {
      localStorage.setItem('nusahr_ga_bast_handovers_v3', JSON.stringify(nextList));
    } catch {
      // ignore
    }
  };

  const unassignedAssets = assets.filter((a) => !a.assignedToEmployeeId);

  const [mutasiSubFilter, setMutasiSubFilter] = useState<
    'all' | BastHandoverCategory | 'PENGGUNAAN_OPERASIONAL_SEWAKTU'
  >('all');
  const [mutasiCategory, setMutasiCategory] = useState<BastHandoverCategory>('Aset Karyawan (Personal)');
  const [mutasiAssetId, setMutasiAssetId] = useState(unassignedAssets[0]?.id || '');
  const [selectedMutasiAssetIds, setSelectedMutasiAssetIds] = useState<string[]>(
    unassignedAssets[0]?.id ? [unassignedAssets[0].id] : []
  );
  // State untuk Penukaran Aset Antar Karyawan (Melalui GA)
  const [swapEmpAId, setSwapEmpAId] = useState<string>(employees[3]?.id || employees[0]?.id || 'emp-4');
  const [swapEmpBId, setSwapEmpBId] = useState<string>(employees[1]?.id || employees[0]?.id || 'emp-2');
  const [selectedSwapAssetAIds, setSelectedSwapAssetAIds] = useState<string[]>([]);
  const [selectedSwapAssetBIds, setSelectedSwapAssetBIds] = useState<string[]>([]);
  const [extraBatchItemsText, setExtraBatchItemsText] = useState('Mouse Wireless Logitech, Tas Laptop & Adaptor Charger');
  const [gaHandoverOfficerName, setGaHandoverOfficerName] = useState('Bambang Sudiro (GA Asset Custodian)');
  const [newTargetEmpId, setNewTargetEmpId] = useState(employees[0]?.id || '');
  const [newTargetBuilding, setNewTargetBuilding] = useState('Menara Palma Kuningan');
  const [newTargetRoom, setNewTargetRoom] = useState('Lantai 18 - Dev Wing');
  const [vehiclePlateInput, setVehiclePlateInput] = useState('B 1234 NTM');
  const [vehicleOdometerInput, setVehicleOdometerInput] = useState<number>(15200);
  const [vehicleDocsInput, setVehicleDocsInput] = useState(
    'STNK Asli, Kunci Utama & Cadangan, Polis Asuransi All-Risk, Buku Servis & Tool Kit'
  );
  const [facilitySkInput, setFacilitySkInput] = useState('SK-HRD/FAC-CAR/2026/024 (Fasilitas Kendaraan Karyawan)');
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

  // Vehicle Booking State (Penggunaan Kendaraan Operasional Sewaktu-waktu — konsep sama seperti Penggunaan Ruangan Sewaktu-waktu)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleName: 'Toyota Avanza Veloz (B 5678 NTM) — Armada Pool Operasional',
    borrowerId: employees[0]?.id || '',
    driverType: 'Sopir Kantor' as 'Sopir Kantor' | 'Bawa Sendiri',
    driverName: 'Pak Supriadi (Driver Internal GA)',
    purpose: '',
    destination: 'Kunjungan Klien Sudirman & Site Project',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '14:00',
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
    const purposeWithTime = `[${vehicleForm.startTime} - ${vehicleForm.endTime} WIB] ${vehicleForm.purpose}${
      vehicleForm.destination ? ` (Tujuan: ${vehicleForm.destination})` : ''
    }`;
    addVehicleBooking({
      vehicleName: vehicleForm.vehicleName,
      plateNumber: vehicleForm.vehicleName.match(/\(([^)]+)\)/)?.[1] || 'B 5678 NTM',
      driverType: vehicleForm.driverType,
      driverName:
        vehicleForm.driverType === 'Sopir Kantor'
          ? vehicleForm.driverName || 'Sopir Kantor GA'
          : 'Bawa Sendiri (Lepas Kunci Operasional)',
      borrowerId: vehicleForm.borrowerId || employees[0]?.id || 'emp-001',
      purpose: purposeWithTime,
      destination: vehicleForm.destination || 'Jabodetabek & Site Project',
      startDate: vehicleForm.startDate,
      endDate: vehicleForm.endDate,
      startOdometer: Number(vehicleForm.startMileageKm),
      nextServiceDate: '2027-01-15',
      taxExpiryDate: '2027-06-30',
    });
    setIsVehicleModalOpen(false);
    setVehicleForm({ ...vehicleForm, purpose: '' });
    setSlaToastMessage(
      `Reservasi penggunaan kendaraan operasional sewaktu-waktu (${vehicleForm.vehicleName} · ${vehicleForm.startTime}-${vehicleForm.endTime} WIB) berhasil dicatat!`
    );
    setTimeout(() => setSlaToastMessage(null), 4000);
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

  const handlePreviewBastHandover = (bast: BastHandoverRecord) => {
    const isSwap = bast.handoverCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)';
    const itemLines = bast.items
      .map((it, idx) => `${idx + 1}. [${it.assetCode}] ${it.assetName} (${it.category} — Kondisi: ${it.condition})`)
      .join(' | ');

    openFilePreview({
      title:
        bast.handoverCategory === 'Aset Menetap di Ruangan'
          ? 'BERITA ACARA SERAH TERIMA INVENTARIS ASET MENETAP DI RUANGAN (TANGGUNG JAWAB PIMPINAN RUANGAN)'
          : bast.handoverCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? 'BERITA ACARA SERAH TERIMA FASILITAS KENDARAAN PERUSAHAAN YANG MELEKAT KE KARYAWAN'
          : isSwap
          ? 'BERITA ACARA PENUKARAN ASET ANTAR KARYAWAN MELALUI VERIFIKASI GENERAL AFFAIRS (GA)'
          : 'BERITA ACARA SERAH TERIMA ASET KERJA KARYAWAN DENGAN GENERAL AFFAIRS (MULTI-ASET)',
      documentNumber: bast.bastNumber,
      typeBadge: bast.handoverCategory,
      date: bast.handoverDate,
      partyName: isSwap ? `${bast.swapPartyAName || '-'} ⇄ ${bast.recipientName}` : bast.recipientName,
      partyRole: isSwap ? `Difasilitasi & Disahkan oleh GA: ${bast.gaOfficerName}` : bast.recipientRole,
      statusBadge: {
        label: bast.status,
        variant: bast.status === 'Dikembalikan ke GA' ? 'info' : 'success',
      },
      detailsGrid: [
        { label: 'Nomor Dokumen BAST', value: bast.bastNumber },
        { label: 'Kategori Dokumen', value: bast.handoverCategory },
        {
          label: isSwap ? 'Verifikator & Pengesah (GA)' : 'Pihak Penyerah (GA)',
          value: `${bast.gaOfficerName} (${bast.gaOfficerRole})`,
        },
        ...(isSwap
          ? [
              {
                label: 'Karyawan Pihak I',
                value: `${bast.swapPartyAName || '-'} — ${bast.swapPartyARole || ''}`,
              },
              {
                label: 'Karyawan Pihak II',
                value: `${bast.recipientName} — ${bast.recipientRole}`,
              },
            ]
          : [
              {
                label:
                  bast.handoverCategory === 'Aset Menetap di Ruangan'
                    ? 'Pimpinan Penanggung Jawab Ruangan'
                    : bast.handoverCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
                    ? 'Karyawan Penerima Fasilitas Kendaraan'
                    : 'Karyawan Penerima Aset',
                value: `${bast.recipientName} — ${bast.recipientRole}`,
              },
            ]),
        { label: 'Lokasi Gedung & Ruangan', value: `${bast.roomOrArea} (${bast.building})` },
        { label: 'Jumlah Aset Tercatat', value: `${bast.items.length} Unit Aset` },
        ...(bast.vehiclePlateNumber
          ? [
              { label: 'Nomor Polisi Kendaraan', value: bast.vehiclePlateNumber },
              { label: 'KM Saat Serah Terima', value: `${(bast.vehicleStartOdometerKm || 0).toLocaleString()} KM` },
              {
                label: 'Dasar SK / Fasilitas Jabatan',
                value: bast.facilitySkNumber || 'Fasilitas Kendaraan Perusahaan Melekat ke Karyawan',
              },
            ]
          : []),
      ],
      contentParagraphs: [
        isSwap
          ? `Pada tanggal ${bast.handoverDate}, telah dilakukan penukaran aset kerja antar karyawan antara Pihak I (${bast.swapPartyAName}) dan Pihak II (${bast.recipientName}) yang diperiksa, diverifikasi kondisi fisiknya, dan disahkan secara resmi melalui Departemen General Affairs (${bast.gaOfficerName}).`
          : `Pada tanggal ${bast.handoverDate}, telah dilakukan serah terima resmi antara Departemen General Affairs (${bast.gaOfficerName}) dengan ${
              bast.handoverCategory === 'Aset Menetap di Ruangan'
                ? `Pimpinan Penanggung Jawab Ruangan (${bast.recipientName})`
                : bast.handoverCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
                ? `Karyawan Penerima Fasilitas Kendaraan Perusahaan (${bast.recipientName})`
                : `Karyawan Penerima (${bast.recipientName})`
            }.`,
        `Daftar Aset yang Diserahterimakan / Ditukarkan (${bast.items.length} Item): ${itemLines}.`,
        bast.additionalAccessories
          ? `Perlengkapan / Aksesoris Tambahan: ${bast.additionalAccessories}.`
          : bast.vehicleDocumentsIncluded
          ? `Kendaraan tersebut merupakan fasilitas perusahaan yang diberikan khusus dan melekat kepada 1 karyawan tersebut (${bast.recipientName}). Kelengkapan Dokumen & Kunci Kendaraan: ${bast.vehicleDocumentsIncluded}.`
          : 'Seluruh unit telah diperiksa fungsi fisiknya bersama-sama oleh GA dalam keadaan baik dan layak operasional.',
        `Catatan: ${bast.notes}`,
      ],
      signeeName: isSwap
        ? `${bast.swapPartyAName} · ${bast.recipientName} · Mengetahui GA: ${bast.gaOfficerName}`
        : `${bast.gaOfficerName} & ${bast.recipientName}`,
      signeeRole: isSwap
        ? 'Karyawan Pihak I, Karyawan Pihak II & Petugas Verifikator General Affairs (GA)'
        : bast.handoverCategory === 'Aset Menetap di Ruangan'
        ? 'Petugas General Affairs & Pimpinan Penanggung Jawab Ruangan'
        : bast.handoverCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
        ? 'Petugas General Affairs & Karyawan Penerima Fasilitas Kendaraan'
        : 'Petugas General Affairs (Penyerah) & Karyawan Penerima Aset',
    });
  };

  const handleExecuteMutasi = (e: React.FormEvent) => {
    e.preventDefault();

    // Cabang Khusus: Penukaran Aset Antar Karyawan (Melalui GA)
    if (mutasiCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)') {
      if (!swapEmpAId || !swapEmpBId || swapEmpAId === swapEmpBId) return;
      const empA = employees.find((emp) => emp.id === swapEmpAId);
      const empB = employees.find((emp) => emp.id === swapEmpBId);
      const assetsA = assets.filter(
        (a) => a.assignedToEmployeeId === swapEmpAId && selectedSwapAssetAIds.includes(a.id)
      );
      const assetsB = assets.filter(
        (a) => a.assignedToEmployeeId === swapEmpBId && selectedSwapAssetBIds.includes(a.id)
      );
      if (assetsA.length === 0 && assetsB.length === 0) return;

      // Tukar kepemilikan/penanggung jawab aset di master inventaris melalui GA
      assetsA.forEach((a) => {
        updateAsset(a.id, {
          assignedToEmployeeId: swapEmpBId,
          building: newTargetBuilding,
          room: newTargetRoom,
        });
      });
      assetsB.forEach((b) => {
        updateAsset(b.id, {
          assignedToEmployeeId: swapEmpAId,
          building: newTargetBuilding,
          room: newTargetRoom,
        });
      });

      const partyAItems: BastHandoverItem[] = assetsA.map((a) => ({
        assetId: a.id,
        assetCode: a.assetCode,
        assetName: `${a.name} (Diserahkan dari ${empA?.fullName || 'Pihak I'} → ke ${empB?.fullName || 'Pihak II'})`,
        category: a.category,
        condition: a.condition,
      }));
      const partyBItems: BastHandoverItem[] = assetsB.map((b) => ({
        assetId: b.id,
        assetCode: b.assetCode,
        assetName: `${b.name} (Diserahkan dari ${empB?.fullName || 'Pihak II'} → ke ${empA?.fullName || 'Pihak I'})`,
        category: b.category,
        condition: b.condition,
      }));

      const combinedItems = [...partyAItems, ...partyBItems];

      const swapRecord: BastHandoverRecord = {
        id: `bast-${Date.now()}`,
        bastNumber: `BAST/GA-SWAP/2026/10/${String(bastHandovers.length + 1).padStart(3, '0')}`,
        handoverDate: new Date().toISOString().split('T')[0],
        handoverCategory: 'Penukaran Aset Antar Karyawan (Melalui GA)',
        gaOfficerName: gaHandoverOfficerName.split('(')[0].trim() || 'Bambang Sudiro',
        gaOfficerRole: 'General Affairs & Asset Custodian (Verifikator Penukaran)',
        swapPartyAEmployeeId: empA?.id || swapEmpAId,
        swapPartyAName: empA?.fullName || 'Karyawan Pihak I',
        swapPartyARole: `${empA?.position || 'Staff'} (${empA?.department || 'Operasional'})`,
        recipientEmployeeId: empB?.id || swapEmpBId,
        recipientName: empB?.fullName || 'Karyawan Pihak II',
        recipientRole: `${empB?.position || 'Staff'} (${empB?.department || 'Operasional'})`,
        swapPartyAItems: partyAItems,
        swapPartyBItems: partyBItems,
        building: newTargetBuilding,
        roomOrArea: newTargetRoom,
        items: combinedItems,
        additionalAccessories: extraBatchItemsText || undefined,
        notes:
          mutasiNotes ||
          `Penukaran aset antar karyawan (${empA?.fullName} ⇄ ${empB?.fullName}) yang telah diperiksa dan disahkan melalui General Affairs (GA).`,
        status: 'Ditukar Melalui GA',
      };

      saveBastHandovers([swapRecord, ...bastHandovers]);
      setSlaToastMessage(
        `Berhasil menerbitkan BAST Penukaran Aset Antar Karyawan melalui GA (${swapRecord.bastNumber}: ${empA?.fullName} ⇄ ${empB?.fullName})!`
      );
      setTimeout(() => setSlaToastMessage(null), 4000);
      setIsMutasiModalOpen(false);
      setSelectedSwapAssetAIds([]);
      setSelectedSwapAssetBIds([]);
      setMutasiNotes('');
      return;
    }

    const validUnassignedIds = selectedMutasiAssetIds.filter((id) =>
      unassignedAssets.some((u) => u.id === id)
    );
    if (validUnassignedIds.length === 0) return;

    const targetEmp = employees.find((emp) => emp.id === newTargetEmpId) || employees[0];
    const selectedAssetObjs = unassignedAssets.filter((a) => validUnassignedIds.includes(a.id));

    // Update each selected asset in master inventory
    validUnassignedIds.forEach((id) => {
      updateAsset(id, {
        assignedToEmployeeId: newTargetEmpId || undefined,
        building: newTargetBuilding,
        room: newTargetRoom,
      });
    });

    const itemsPayload: BastHandoverItem[] = selectedAssetObjs.map((a) => ({
      assetId: a.id,
      assetCode: a.assetCode,
      assetName: a.name,
      category: a.category,
      condition: a.condition,
    }));

    const prefix =
      mutasiCategory === 'Aset Menetap di Ruangan'
        ? 'BAST/GA-ROOM'
        : mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
        ? 'BAST/GA-FAC-VEH'
        : 'BAST/GA-EMP';

    const newRecord: BastHandoverRecord = {
      id: `bast-${Date.now()}`,
      bastNumber: `${prefix}/2026/10/${String(bastHandovers.length + 1).padStart(3, '0')}`,
      handoverDate: new Date().toISOString().split('T')[0],
      handoverCategory: mutasiCategory,
      gaOfficerName: gaHandoverOfficerName.split('(')[0].trim() || 'Bambang Sudiro',
      gaOfficerRole: 'General Affairs & Asset Custodian',
      recipientEmployeeId: targetEmp?.id || 'emp-1',
      recipientName: targetEmp?.fullName || 'Karyawan Penerima',
      recipientRole:
        mutasiCategory === 'Aset Menetap di Ruangan'
          ? `Pimpinan Penanggung Jawab Ruangan (${targetEmp?.position || 'Manager'} · ${targetEmp?.department || ''})`
          : mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? `${targetEmp?.position || 'Manager'} (Penerima Fasilitas Kendaraan Perusahaan)`
          : `${targetEmp?.position || 'Staff'} (${targetEmp?.department || 'Operasional'})`,
      isRoomLeaderResponsible: mutasiCategory === 'Aset Menetap di Ruangan',
      building: newTargetBuilding,
      roomOrArea: newTargetRoom,
      items: itemsPayload,
      additionalAccessories:
        mutasiCategory === 'Aset Karyawan (Personal)' || mutasiCategory === 'Aset Menetap di Ruangan'
          ? extraBatchItemsText
          : undefined,
      vehiclePlateNumber:
        mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? vehiclePlateInput
          : undefined,
      vehicleStartOdometerKm:
        mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? Number(vehicleOdometerInput)
          : undefined,
      vehicleDocumentsIncluded:
        mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? vehicleDocsInput
          : undefined,
      facilitySkNumber:
        mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? facilitySkInput
          : undefined,
      notes:
        mutasiNotes ||
        (mutasiCategory === 'Aset Menetap di Ruangan'
          ? 'Serah terima inventaris aset menetap di ruangan kepada Pimpinan Ruangan.'
          : mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
          ? 'Serah terima kendaraan sebagai fasilitas perusahaan yang diberikan dan melekat khusus ke 1 karyawan tersebut.'
          : `Serah terima ${itemsPayload.length} unit aset kerja karyawan dengan General Affairs.`),
      status: 'Aktif / Diserahterimakan',
    };

    saveBastHandovers([newRecord, ...bastHandovers]);
    setSlaToastMessage(
      `Berhasil membuat dokumen ${newRecord.bastNumber} (${itemsPayload.length} aset) untuk ${newRecord.recipientName}!`
    );
    setTimeout(() => setSlaToastMessage(null), 4000);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <span>Manajemen General Affairs (GA), Aset QR & Pemeliharaan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan inventaris gedung, mutasi & serah terima BAST karyawan, tiket perbaikan & penggantian aset rusak, serta stock opname QR Code.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDocModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Dokumen Resmi GA & Aset (BAST/Form)</span>
        </button>
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
          onClick={() => setActiveTab('sla_kategori')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'sla_kategori'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>SLA Kategori Aset</span>
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
                  onClick={() => {
                    const freeIds = assets.filter((a) => !a.assignedToEmployeeId).slice(0, 1).map((a) => a.id);
                    setSelectedMutasiAssetIds(freeIds);
                    setIsMutasiModalOpen(true);
                  }}
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

      {/* TAB 2: MUTASI & PENGGUNAAN ASET (BAST SERAH TERIMA MELEKAT vs PENGGUNAAN OPERASIONAL SEWAKTU-WAKTU) */}
      {activeTab === 'mutasi' && (
        <div className="space-y-5">
          {/* Header & Action Buttons */}
          <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Mutasi, Serah Terima Fasilitas (BAST), Penukaran Aset Antar Karyawan &amp; Penggunaan Operasional</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Membedakan secara tegas antara <strong>Serah Terima Aset / Fasilitas (BAST)</strong> (meliputi:{' '}
                <strong>Aset Kerja Karyawan</strong> bisa &gt;1 aset/BAST,{' '}
                <strong>Aset Menetap di Ruangan</strong> tanggung jawab Pimpinan Ruangan,{' '}
                <strong>Serah Terima Kendaraan yang Melekat ke 1 Karyawan sebagai Fasilitas Perusahaan</strong>, serta{' '}
                <strong>Penukaran Aset Antar Karyawan yang Wajib Melalui Verifikasi GA</strong>) dengan{' '}
                <strong>Penggunaan Kendaraan Operasional (Sewaktu-waktu)</strong> yang konsepnya sama seperti{' '}
                <strong>Penggunaan Ruangan Sewaktu-waktu</strong>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const freeIds = assets.filter((a) => !a.assignedToEmployeeId).slice(0, 1).map((a) => a.id);
                  setSelectedMutasiAssetIds(freeIds);
                  setIsMutasiModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat BAST Serah Terima / Penukaran Aset</span>
              </button>
            </div>
          </div>

          {/* 5 Klasifikasi Kartu Ringkasan: 4 BAST (Termasuk Penukaran Antar Karyawan via GA) vs 1 Penggunaan Operasional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div
              onClick={() => setMutasiSubFilter('Aset Karyawan (Personal)')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                mutasiSubFilter === 'Aset Karyawan (Personal)'
                  ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700">1. BAST Aset Kerja Karyawan</span>
                <Laptop className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {bastHandovers.filter((b) => b.handoverCategory === 'Aset Karyawan (Personal)').length} BAST
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Laptop, Mouse, Monitor · Serah terima GA &amp; Karyawan (&gt;1 aset)
              </div>
            </div>

            <div
              onClick={() => setMutasiSubFilter('Aset Menetap di Ruangan')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                mutasiSubFilter === 'Aset Menetap di Ruangan'
                  ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800">2. BAST Aset Menetap di Ruangan</span>
                <Building className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {bastHandovers.filter((b) => b.handoverCategory === 'Aset Menetap di Ruangan').length} BAST
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                AC, TV, Proyektor · Tanggung jawab Pimpinan Ruangan
              </div>
            </div>

            <div
              onClick={() => setMutasiSubFilter('Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                mutasiSubFilter === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
                  ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800">
                  3. Serah Terima Kendaraan (Fasilitas)
                </span>
                <Car className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {
                  bastHandovers.filter(
                    (b) => b.handoverCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
                  ).length
                }{' '}
                Unit
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Fasilitas perusahaan yang melekat khusus ke 1 karyawan (BAST)
              </div>
            </div>

            <div
              onClick={() => setMutasiSubFilter('Penukaran Aset Antar Karyawan (Melalui GA)')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                mutasiSubFilter === 'Penukaran Aset Antar Karyawan (Melalui GA)'
                  ? 'bg-purple-50/70 border-purple-400 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-800">
                  4. Penukaran Aset Antar Karyawan (Via GA)
                </span>
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {
                  bastHandovers.filter(
                    (b) => b.handoverCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)'
                  ).length
                }{' '}
                BAST
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Tukar aset antar karyawan (Pihak I &amp; II) diverifikasi &amp; disahkan GA
              </div>
            </div>

            <div
              onClick={() => setMutasiSubFilter('PENGGUNAAN_OPERASIONAL_SEWAKTU')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                mutasiSubFilter === 'PENGGUNAAN_OPERASIONAL_SEWAKTU'
                  ? 'bg-sky-50/70 border-sky-400 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800">
                  5. Penggunaan Kendaraan (Operasional)
                </span>
                <Fuel className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">{vehicleBookings.length} Jadwal</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Konsep sama dengan Penggunaan Ruangan Sewaktu-waktu
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { id: 'all', label: 'Semua (Serah Terima BAST, Penukaran & Penggunaan Operasional)' },
                { id: 'Aset Karyawan (Personal)', label: 'BAST Aset untuk Karyawan (Laptop, Mouse, dll)' },
                { id: 'Aset Menetap di Ruangan', label: 'BAST Aset Menetap di Ruangan (Pimpinan Ruangan)' },
                {
                  id: 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)',
                  label: 'Serah Terima Kendaraan (Fasilitas Melekat ke 1 Karyawan)',
                },
                {
                  id: 'Penukaran Aset Antar Karyawan (Melalui GA)',
                  label: 'Penukaran Aset Antar Karyawan (Melalui GA)',
                },
                {
                  id: 'PENGGUNAAN_OPERASIONAL_SEWAKTU',
                  label: 'Penggunaan Kendaraan Operasional (Sewaktu-waktu seperti Ruangan)',
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMutasiSubFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  mutasiSubFilter === f.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* BAGIAN A: DAFTAR SERAH TERIMA ASET, PENUKARAN ANTAR KARYAWAN & FASILITAS PERUSAHAAN (BAST) */}
          {mutasiSubFilter !== 'PENGGUNAAN_OPERASIONAL_SEWAKTU' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Bagian A — Dokumen Serah Terima Aset, Penukaran Antar Karyawan via GA &amp; Fasilitas Perusahaan (BAST)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Mencakup Aset Kerja Karyawan (&gt;1 aset/BAST), Aset Menetap di Ruangan (Pimpinan Ruangan),{' '}
                    <strong>Serah Terima Kendaraan Fasilitas Perusahaan yang Melekat ke 1 Karyawan</strong>, serta{' '}
                    <strong>Penukaran Aset Antar Karyawan (Tetap Melalui Verifikasi GA)</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bastHandovers
                  .filter((b) => mutasiSubFilter === 'all' || b.handoverCategory === mutasiSubFilter)
                  .map((bast) => {
                    const isRoom = bast.handoverCategory === 'Aset Menetap di Ruangan';
                    const isVehFacility =
                      bast.handoverCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)';
                    const isSwap = bast.handoverCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)';

                    return (
                      <div
                        key={bast.id}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3.5 transition-all"
                      >
                        <div className="space-y-3">
                          {/* Header BAST */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    isRoom
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : isVehFacility
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : isSwap
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}
                                >
                                  {bast.handoverCategory}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {bast.bastNumber}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{bast.handoverDate}</span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-xs mt-1.5">
                                {isRoom
                                  ? `Inventaris Menetap di Ruangan: ${bast.roomOrArea}`
                                  : isVehFacility
                                  ? `Fasilitas Kendaraan Perusahaan (Melekat ke 1 Karyawan) — ${bast.recipientName}`
                                  : isSwap
                                  ? `Penukaran Aset Antar Karyawan (Melalui GA): ${bast.swapPartyAName} ⇄ ${bast.recipientName}`
                                  : `Serah Terima Aset Karyawan (${bast.items.length} Aset) — ${bast.recipientName}`}
                              </h4>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {bast.items.length} Aset
                            </span>
                          </div>

                          {/* Pihak Serah Terima / Penukaran */}
                          {isSwap ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-purple-50/50 rounded-lg border border-purple-100 text-xs">
                              <div>
                                <span className="text-[10px] text-purple-700 block uppercase font-semibold">
                                  Karyawan Pihak I
                                </span>
                                <div className="font-bold text-slate-900">{bast.swapPartyAName}</div>
                                <div className="text-[10px] text-slate-500">{bast.swapPartyARole}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-purple-700 block uppercase font-semibold">
                                  Karyawan Pihak II
                                </span>
                                <div className="font-bold text-slate-900">{bast.recipientName}</div>
                                <div className="text-[10px] text-slate-500">{bast.recipientRole}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald-700 block uppercase font-semibold">
                                  Verifikator &amp; Pengesah GA
                                </span>
                                <div className="font-bold text-slate-800">{bast.gaOfficerName}</div>
                                <div className="text-[10px] text-slate-500">{bast.gaOfficerRole}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                                  Pihak Penyerah (General Affairs)
                                </span>
                                <div className="font-bold text-slate-800">{bast.gaOfficerName}</div>
                                <div className="text-[10px] text-slate-500">{bast.gaOfficerRole}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-indigo-600 block uppercase font-semibold">
                                  {isRoom
                                    ? 'Pimpinan Penanggung Jawab Ruangan'
                                    : isVehFacility
                                    ? 'Karyawan Penerima Fasilitas Kendaraan (Melekat)'
                                    : 'Karyawan Penerima Aset'}
                                </span>
                                <div className="font-bold text-slate-900">{bast.recipientName}</div>
                                <div className="text-[10px] text-slate-500">{bast.recipientRole}</div>
                              </div>
                            </div>
                          )}

                          {/* Daftar Multi-Aset dalam 1 Serah Terima / Penukaran */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              {isSwap
                                ? `Rincian Pertukaran Aset yang Disahkan GA (${bast.items.length} Item):`
                                : `Daftar Aset dalam 1 Kali Serah Terima (${bast.items.length} Item):`}
                            </span>
                            <div className="space-y-1">
                              {bast.items.map((item, idx) => (
                                <div
                                  key={`${bast.id}-item-${idx}`}
                                  className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded shrink-0">
                                      {item.assetCode}
                                    </span>
                                    <span className="font-semibold text-slate-800 truncate">{item.assetName}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-semibold shrink-0 ml-2">
                                    {item.condition}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {bast.additionalAccessories && (
                              <div className="text-[11px] text-slate-600 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1.5 rounded-lg">
                                <strong>Kelengkapan / Aksesoris Tambahan:</strong> {bast.additionalAccessories}
                              </div>
                            )}
                            {bast.vehiclePlateNumber && (
                              <div className="text-[11px] text-emerald-900 bg-emerald-50/70 border border-emerald-200 px-2.5 py-1.5 rounded-lg space-y-0.5">
                                <div className="flex items-center justify-between font-mono font-bold">
                                  <span>No. Polisi: {bast.vehiclePlateNumber}</span>
                                  <span>KM Serah Terima: {(bast.vehicleStartOdometerKm || 0).toLocaleString()} KM</span>
                                </div>
                                {bast.facilitySkNumber && (
                                  <div className="text-[10px] text-emerald-900 font-semibold">
                                    Dasar Fasilitas Perusahaan: {bast.facilitySkNumber}
                                  </div>
                                )}
                                <div className="text-[10px] text-emerald-800">
                                  Status: <strong>Fasilitas Kendaraan Perusahaan (Melekat ke 1 Karyawan)</strong> · Dokumen:{' '}
                                  {bast.vehicleDocumentsIncluded}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>
                              📍 Lokasi: <strong className="text-slate-700">{bast.roomOrArea} ({bast.building})</strong>
                            </span>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500 italic truncate">{bast.notes}</span>
                          <button
                            type="button"
                            onClick={() => handlePreviewBastHandover(bast)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Cetak / Lihat BAST</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* BAGIAN B: PENGGUNAAN KENDARAAN OPERASIONAL SEWAKTU-WAKTU (KONSEP SAMA SEPERTI PENGGUNAAN RUANGAN SEWAKTU-WAKTU) */}
          {(mutasiSubFilter === 'all' || mutasiSubFilter === 'PENGGUNAAN_OPERASIONAL_SEWAKTU') && (
            <div className="bg-sky-50/40 border border-sky-200 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-[10px] font-bold uppercase">
                      Penggunaan Sewaktu-waktu (Non-Fasilitas Jabatan)
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Bagian B — Penggunaan Kendaraan Operasional (Konsep Sama dengan Penggunaan Ruangan Sewaktu-waktu)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Berbeda dengan serah terima kendaraan fasilitas yang melekat ke 1 karyawan, penggunaan kendaraan
                    operasional ini bersifat <strong>reservasi/pemakaian sewaktu-waktu</strong> oleh karyawan untuk
                    keperluan dinas berdasarkan tanggal &amp; jam pakai.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Booking Penggunaan Kendaraan Operasional</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {vehicleBookings.map((vb) => {
                  const borrower = employees.find((e) => e.id === vb.borrowerId);
                  return (
                    <div
                      key={vb.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                              Armada Operasional (Sewaktu-waktu)
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs mt-1">{vb.vehicleName}</h5>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              vb.status === 'Disetujui'
                                ? 'bg-blue-100 text-blue-700'
                                : vb.status === 'Sedang Digunakan'
                                ? 'bg-amber-100 text-amber-700'
                                : vb.status === 'Dikembalikan'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {vb.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="font-semibold text-slate-800">{vb.purpose}</div>
                          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>
                              {vb.startDate} s/d {vb.endDate}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Pengguna Sewaktu-waktu:{' '}
                            <strong className="text-slate-800">{borrower?.fullName || 'Aditya Pratama'}</strong> ·
                            Pengemudi: <strong className="text-slate-700">{vb.driverName || vb.driverType}</strong>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600">
                            Odometer: {(vb.startOdometer || 0).toLocaleString()} KM{' '}
                            {vb.endOdometer ? `→ ${vb.endOdometer.toLocaleString()} KM` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">Rute: {vb.destination}</span>
                        {vb.status === 'Disetujui' && (
                          <button
                            type="button"
                            onClick={() => updateVehicleBookingStatus(vb.id, 'Sedang Digunakan')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-semibold"
                          >
                            Mulai Pakai
                          </button>
                        )}
                        {vb.status === 'Sedang Digunakan' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVehicleForReturn(vb);
                              setReturnForm({
                                returnDate: new Date().toISOString().split('T')[0],
                                endOdometer: (vb.startOdometer || 0) + 65,
                                tollFuelCost: 150000,
                                returnNotes: 'Kendaraan operasional selesai digunakan dan dikembalikan ke pool GA.',
                              });
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold"
                          >
                            Selesai &amp; Kembalikan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

      {/* TAB SLA KATEGORI ASET */}
      {activeTab === 'sla_kategori' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-800/80 text-indigo-200 border border-indigo-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-300" />
                    <span>General Affairs Service Level Agreement</span>
                  </span>
                  <span className="text-xs text-indigo-300 font-medium">Baku Standar Operasional</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Pengaturan SLA Kategori Aset Perusahaan</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Konfigurasi baku kecepatan waktu tanggap (Response Time), batas perbaikan / servis (Resolution Time), penyediaan unit cadangan sementara (Replacement SLA), dan siklus pengadaan per kategori inventaris General Affairs.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaultSla}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Kembalikan ke standar baku default"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* SLA Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block">Kategori Inventaris</span>
                <span className="text-xl font-black text-white">{assetCategorySlas.length} Kategori</span>
                <span className="text-[10px] text-emerald-300 block mt-0.5">Semua aktif diawasi</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block">Prioritas Kritis / Tinggi</span>
                <span className="text-xl font-black text-amber-300">
                  {assetCategorySlas.filter(s => s.priorityLevel === 'Kritis' || s.priorityLevel === 'Tinggi').length} Kategori
                </span>
                <span className="text-[10px] text-amber-200 block mt-0.5">Eskalasi otomatis aktif</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block">Target Respon Rata-rata</span>
                <span className="text-xl font-black text-indigo-200">1 - 2 Jam</span>
                <span className="text-[10px] text-indigo-300 block mt-0.5">SLA tanggap tiket</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block">SLA Unit Pengganti</span>
                <span className="text-xl font-black text-emerald-300">2 - 4 Jam</span>
                <span className="text-[10px] text-emerald-200 block mt-0.5">Kesiapan unit cadangan</span>
              </div>
            </div>
          </div>

          {/* Cards Grid SLA per Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetCategorySlas.map((sla) => {
              const isCritical = sla.priorityLevel === 'Kritis';
              const isHigh = sla.priorityLevel === 'Tinggi';

              return (
                <div
                  key={sla.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group"
                >
                  <div className="space-y-3">
                    {/* Header Kategori */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                          {sla.icon === 'Laptop' && <Laptop className="w-5 h-5" />}
                          {sla.icon === 'Car' && <Car className="w-5 h-5" />}
                          {sla.icon === 'Building' && <Building className="w-5 h-5" />}
                          {sla.icon === 'Printer' && <Printer className="w-5 h-5" />}
                          {sla.icon === 'Armchair' && <Armchair className="w-5 h-5" />}
                          {sla.icon === 'Package' && <Package className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs leading-tight group-hover:text-indigo-700 transition-colors">
                            {sla.category}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Update: {sla.updatedAt || '2026-10-25'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isHigh
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Prioritas {sla.priorityLevel}
                      </span>
                    </div>

                    {/* Matrix Grid SLA Waktu */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">SLA Respon Awal</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 text-sm">{sla.responseSlaHours}</span>
                          <span className="text-[10px] text-slate-500">Jam Kerja</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">SLA Resolusi / Servis</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono font-bold text-indigo-700 text-sm">{sla.resolutionSlaHours}</span>
                          <span className="text-[10px] text-slate-500">Jam ({Math.round(sla.resolutionSlaHours / 24 * 10) / 10} Hari)</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Unit Pengganti (Backup)</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono font-bold text-emerald-700 text-sm">{sla.replacementSlaHours}</span>
                          <span className="text-[10px] text-slate-500">Jam Maks.</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Siklus Pengadaan Baru</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 text-sm">{sla.procurementSlaDays}</span>
                          <span className="text-[10px] text-slate-500">Hari Kerja</span>
                        </div>
                      </div>
                    </div>

                    {/* PIC & Escalation Info */}
                    <div className="space-y-1.5 text-[11px] pt-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Lead PIC:</span>
                        <span className="font-bold text-slate-800">{sla.picName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Peran Tim:</span>
                        <span className="italic">{sla.picRole}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                        <span className="text-slate-400">Eskalasi Breached:</span>
                        <span className={`font-semibold ${sla.autoEscalate ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {sla.autoEscalate ? '● Otomatis ke Head GA' : '○ Manual'}
                        </span>
                      </div>
                    </div>

                    {/* Catatan Operasional */}
                    {sla.notes && (
                      <p className="text-[10px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-200/80 leading-relaxed">
                        {sla.notes}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingSlaCat(sla)}
                      className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah Pengaturan SLA</span>
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* TAB 6: PENGGUNAAN KENDARAAN OPERASIONAL (SEWAKTU-WAKTU — KONSEP SAMA DENGAN PENGGUNAAN RUANGAN) */}
      {activeTab === 'kendaraan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" />
                <span>Penggunaan Kendaraan Operasional (Sewaktu-waktu) &amp; Log BBM/KM</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konsepnya sama dengan <strong>Penggunaan Ruangan Sewaktu-waktu</strong> (reservasi armada operasional pool berdasarkan tanggal &amp; jam pakai). Untuk kendaraan yang merupakan <strong>fasilitas perusahaan yang melekat ke 1 karyawan tertentu</strong>, kelola melalui BAST di tab{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('mutasi');
                    setMutasiSubFilter('Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)');
                  }}
                  className="text-emerald-700 font-bold underline hover:text-emerald-800"
                >
                  Mutasi &amp; Serah Terima Fasilitas Kendaraan
                </button>
                .
              </p>
            </div>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Booking Penggunaan Kendaraan Operasional (Sewaktu-waktu)</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Armada Operasional / Nopol</th>
                  <th className="p-3">Karyawan Pengguna &amp; Pengemudi</th>
                  <th className="p-3">Jam Pakai, Keperluan &amp; Rute</th>
                  <th className="p-3">Tanggal Penggunaan</th>
                  <th className="p-3">Odometer &amp; BBM</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleBookings.map((vb) => (
                  <tr key={vb.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{vb.vehicleName}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        Penggunaan Operasional Sewaktu-waktu
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{employees.find((e) => e.id === vb.borrowerId)?.fullName || 'Aditya Pratama'}</div>
                      <div className="text-[11px] text-slate-400">Pengemudi: {vb.driverName || vb.driverType || 'Lepas Kunci'}</div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs">
                      <div className="font-medium text-slate-800">{vb.purpose}</div>
                      <div className="text-[11px] text-slate-400">Tujuan: {vb.destination}</div>
                    </td>
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

      {/* MODAL: SERAH TERIMA BAST MULTI-ASET, PENUKARAN ASET ANTAR KARYAWAN VIA GA & FASILITAS KENDARAAN MELEKAT KE KARYAWAN */}
      {isMutasiModalOpen && (
        <div
          onClick={() => setIsMutasiModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden cursor-default my-8"
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  Formulir Berita Acara Serah Terima &amp; Penukaran Aset melalui GA (BAST GA)
                </h3>
                <p className="text-[11px] text-slate-300">
                  Mencakup Serah Terima Aset Baru (belum ada pemegang) maupun Penukaran Aset Antar Karyawan yang wajib diverifikasi dan disahkan oleh General Affairs (GA).
                </p>
              </div>
              <button onClick={() => setIsMutasiModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleExecuteMutasi} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Pilihan Kategori Serah Terima / Penukaran (BAST) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  1. Pilih Kategori Serah Terima / Penukaran Aset (Melalui GA) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      {
                        id: 'Aset Karyawan (Personal)',
                        title: '1. Aset untuk Karyawan (Laptop, Mouse, dll)',
                        desc: 'Serah terima GA dengan Karyawan Penerima (1 BAST bisa >1 aset belum ada pemegang)',
                      },
                      {
                        id: 'Aset Menetap di Ruangan',
                        title: '2. Aset Menetap di Ruangan',
                        desc: 'Tanggung jawab Pimpinan di ruangan tersebut bersama GA',
                      },
                      {
                        id: 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)',
                        title: '3. Serah Terima Kendaraan (Fasilitas 1 Karyawan)',
                        desc: 'Kendaraan fasilitas perusahaan yang diberikan & melekat ke 1 karyawan',
                      },
                      {
                        id: 'Penukaran Aset Antar Karyawan (Melalui GA)',
                        title: '4. Penukaran Aset Antar Karyawan (Melalui GA)',
                        desc: 'Antar karyawan saling bertukar/mengalihkan aset yang sedang dipegang, wajib melalui verifikasi GA',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMutasiCategory(opt.id);
                        if (opt.id === 'Penukaran Aset Antar Karyawan (Melalui GA)') {
                          const heldA = assets.filter((a) => a.assignedToEmployeeId === swapEmpAId);
                          const heldB = assets.filter((a) => a.assignedToEmployeeId === swapEmpBId);
                          setSelectedSwapAssetAIds(heldA[0] ? [heldA[0].id] : []);
                          setSelectedSwapAssetBIds(heldB[0] ? [heldB[0].id] : []);
                        } else if (opt.id === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)') {
                          const freeVeh = unassignedAssets.filter((a) => a.category === 'Kendaraan Operasional');
                          setSelectedMutasiAssetIds(freeVeh[0] ? [freeVeh[0].id] : []);
                        } else {
                          const freeNonVeh = unassignedAssets.filter((a) => a.category !== 'Kendaraan Operasional');
                          setSelectedMutasiAssetIds(freeNonVeh[0] ? [freeNonVeh[0].id] : []);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        mutasiCategory === opt.id
                          ? opt.id === 'Penukaran Aset Antar Karyawan (Melalui GA)'
                            ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20'
                            : 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{opt.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {mutasiCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)' ? (
                /* MODE PENUKARAN ASET ANTAR KARYAWAN (WAJIB MELALUI VERIFIKASI GA) */
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 flex items-start gap-2.5">
                    <ArrowRightLeft className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Aturan Penukaran Aset Antar Karyawan (Melalui GA):</strong> Penukaran aset kerja antar karyawan tidak boleh dilakukan secara sepihak tanpa pencatatan GA. Pilih <strong>Karyawan Pihak I</strong> &amp; aset yang diserahkan, <strong>Karyawan Pihak II</strong> &amp; aset penukarnya, serta <strong>Petugas GA Verifikator</strong> yang mengesahkan pertukaran.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* KARYAWAN PIHAK I & ASET YANG DISERAHKAN KE PIHAK II */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div>
                        <label className="font-bold text-purple-900 block mb-1">
                          Karyawan Pihak I (Penyerah / Penukar 1) *
                        </label>
                        <EmployeeSelect
                          employees={employees}
                          selectedEmployeeId={swapEmpAId}
                          onSelect={(id) => {
                            setSwapEmpAId(id);
                            const held = assets.filter((a) => a.assignedToEmployeeId === id);
                            setSelectedSwapAssetAIds(held[0] ? [held[0].id] : []);
                          }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-600">
                            Aset Dipegang Pihak I (Diserahkan ke Pihak II)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-purple-700">
                            {
                              selectedSwapAssetAIds.filter((id) =>
                                assets.some((a) => a.id === id && a.assignedToEmployeeId === swapEmpAId)
                              ).length
                            }{' '}
                            dipilih
                          </span>
                        </div>
                        {assets.filter((a) => a.assignedToEmployeeId === swapEmpAId).length === 0 ? (
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 text-center">
                            Karyawan ini sedang tidak memegang aset terdaftar.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {assets
                              .filter((a) => a.assignedToEmployeeId === swapEmpAId)
                              .map((a) => {
                                const isChecked = selectedSwapAssetAIds.includes(a.id);
                                return (
                                  <label
                                    key={a.id}
                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer ${
                                      isChecked
                                        ? 'bg-purple-50 border-purple-400 text-purple-950 font-semibold'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const next = isChecked
                                            ? selectedSwapAssetAIds.filter((id) => id !== a.id)
                                            : [...selectedSwapAssetAIds, a.id];
                                          setSelectedSwapAssetAIds(next);
                                        }}
                                        className="rounded text-purple-600 w-3.5 h-3.5"
                                      />
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                                        {a.assetCode}
                                      </span>
                                      <span className="truncate">{a.name}</span>
                                    </div>
                                  </label>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KARYAWAN PIHAK II & ASET YANG DISERAHKAN KE PIHAK I */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div>
                        <label className="font-bold text-purple-900 block mb-1">
                          Karyawan Pihak II (Lawan Tukar / Penerima) *
                        </label>
                        <EmployeeSelect
                          employees={employees}
                          selectedEmployeeId={swapEmpBId}
                          onSelect={(id) => {
                            setSwapEmpBId(id);
                            const held = assets.filter((a) => a.assignedToEmployeeId === id);
                            setSelectedSwapAssetBIds(held[0] ? [held[0].id] : []);
                          }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-600">
                            Aset Dipegang Pihak II (Diserahkan ke Pihak I)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-purple-700">
                            {
                              selectedSwapAssetBIds.filter((id) =>
                                assets.some((a) => a.id === id && a.assignedToEmployeeId === swapEmpBId)
                              ).length
                            }{' '}
                            dipilih
                          </span>
                        </div>
                        {assets.filter((a) => a.assignedToEmployeeId === swapEmpBId).length === 0 ? (
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 text-center">
                            Karyawan ini sedang tidak memegang aset terdaftar.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {assets
                              .filter((a) => a.assignedToEmployeeId === swapEmpBId)
                              .map((a) => {
                                const isChecked = selectedSwapAssetBIds.includes(a.id);
                                return (
                                  <label
                                    key={a.id}
                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer ${
                                      isChecked
                                        ? 'bg-purple-50 border-purple-400 text-purple-950 font-semibold'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const next = isChecked
                                            ? selectedSwapAssetBIds.filter((id) => id !== a.id)
                                            : [...selectedSwapAssetBIds, a.id];
                                          setSelectedSwapAssetBIds(next);
                                        }}
                                        className="rounded text-purple-600 w-3.5 h-3.5"
                                      />
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                                        {a.assetCode}
                                      </span>
                                      <span className="truncate">{a.name}</span>
                                    </div>
                                  </label>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PETUGAS GA VERIFIKATOR & AKSESORIS PENDAMPING */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Petugas General Affairs (GA) Verifikator &amp; Pengesah Penukaran *
                      </label>
                      <input
                        type="text"
                        required
                        value={gaHandoverOfficerName}
                        onChange={(e) => setGaHandoverOfficerName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Kelengkapan / Aksesoris yang Ikut Ditukar
                      </label>
                      <input
                        type="text"
                        value={extraBatchItemsText}
                        onChange={(e) => setExtraBatchItemsText(e.target.value)}
                        placeholder="Contoh: Charger masing-masing unit, Tas Laptop..."
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE SERAH TERIMA ASET BARU (HANYA ASET YANG BELUM DIPEGANG SIAPAPUN) */
                <>
                  {/* Pilihan Multi-Aset (Hanya Aset yang Belum Dipegang oleh Siapapun / Belum Ada Penanggung Jawabnya) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <label className="font-bold text-slate-800 block">
                          2. Pilih Aset yang Diserahterimakan (Hanya Aset yang Belum Dipegang / Belum Ada Penanggung Jawab) *
                        </label>
                        <span className="text-[10px] text-slate-500">
                          Menampilkan <strong>{unassignedAssets.length} aset tersedia</strong> di inventaris GA yang belum memiliki penanggung jawab/pengguna.
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-mono text-[10px] font-bold">
                        {selectedMutasiAssetIds.filter((id) => unassignedAssets.some((u) => u.id === id)).length} Aset Dipilih
                      </span>
                    </div>

                    {unassignedAssets.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-amber-800 text-xs">
                        Saat ini seluruh aset terdaftar sudah memiliki penanggung jawab/pemegang. Silakan registrasikan aset baru terlebih dahulu.
                      </div>
                    ) : (
                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                        {unassignedAssets.map((a) => {
                          const isChecked = selectedMutasiAssetIds.includes(a.id);
                          return (
                            <label
                              key={a.id}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = isChecked
                                      ? selectedMutasiAssetIds.filter((id) => id !== a.id)
                                      : [...selectedMutasiAssetIds, a.id];
                                    setSelectedMutasiAssetIds(next);
                                    if (next[0]) setMutasiAssetId(next[0]);
                                  }}
                                  className="rounded text-indigo-600 w-4 h-4"
                                />
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                                  {a.assetCode}
                                </span>
                                <span className="truncate">{a.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Belum Ada Pemegang
                                </span>
                                <span className="text-[10px] text-slate-500">{a.category}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {(mutasiCategory === 'Aset Karyawan (Personal)' ||
                      mutasiCategory === 'Aset Menetap di Ruangan') && (
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Item Pendamping / Aksesoris Tambahan dalam Paket Serah Terima Ini
                        </label>
                        <input
                          type="text"
                          value={extraBatchItemsText}
                          onChange={(e) => setExtraBatchItemsText(e.target.value)}
                          placeholder="Contoh: Mouse Wireless, Charger, Tas Laptop, Dongle HDMI, Remote..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pihak Serah Terima: Petugas GA & Penerima / Pimpinan Ruangan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Pihak Penyerah (Petugas General Affairs) *
                      </label>
                      <input
                        type="text"
                        required
                        value={gaHandoverOfficerName}
                        onChange={(e) => setGaHandoverOfficerName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        {mutasiCategory === 'Aset Menetap di Ruangan'
                          ? 'Pimpinan di Ruangan Tersebut (Penanggung Jawab) *'
                          : mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
                          ? 'Karyawan Penerima Fasilitas Kendaraan Perusahaan (Melekat) *'
                          : 'Karyawan Penerima Aset *'}
                      </label>
                      <EmployeeSelect
                        employees={employees}
                        selectedEmployeeId={newTargetEmpId}
                        onSelect={(id) => setNewTargetEmpId(id)}
                      />
                    </div>
                  </div>

                  {/* Detail Khusus Serah Terima Fasilitas Kendaraan yang Melekat ke 1 Karyawan */}
                  {mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)' && (
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Detail Fasilitas Kendaraan Perusahaan (Melekat Khusus ke 1 Karyawan)
                        </span>
                        <span className="text-[10px] text-emerald-800">
                          Kendaraan ini diserahkan sebagai fasilitas perusahaan untuk karyawan penerima tersebut (bukan armada operasional sewaktu-waktu).
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Nomor Polisi (Nopol) *</label>
                          <input
                            type="text"
                            required
                            value={vehiclePlateInput}
                            onChange={(e) => setVehiclePlateInput(e.target.value.toUpperCase())}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Odometer Serah Terima (KM) *</label>
                          <input
                            type="number"
                            required
                            value={vehicleOdometerInput}
                            onChange={(e) => setVehicleOdometerInput(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">No. SK / Dasar Fasilitas *</label>
                          <input
                            type="text"
                            required
                            value={facilitySkInput}
                            onChange={(e) => setFacilitySkInput(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Kelengkapan Dokumen &amp; Perlengkapan Kendaraan (STNK, Kunci Utama/Cadangan, Polis Asuransi, Buku Servis)
                        </label>
                        <input
                          type="text"
                          value={vehicleDocsInput}
                          onChange={(e) => setVehicleDocsInput(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gedung Penempatan *</label>
                  <input
                    type="text"
                    value={newTargetBuilding}
                    onChange={(e) => setNewTargetBuilding(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {mutasiCategory === 'Aset Menetap di Ruangan'
                      ? 'Nama Ruangan (Tempat Aset Menetap) *'
                      : mutasiCategory === 'Fasilitas Kendaraan Karyawan (Melekat ke 1 Karyawan)'
                      ? 'Alokasi Parkir / Homebase Fasilitas Kendaraan *'
                      : 'Ruangan / Area Kerja Karyawan *'}
                  </label>
                  <input
                    type="text"
                    value={newTargetRoom}
                    onChange={(e) => setNewTargetRoom(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan &amp; Catatan Berita Acara (BAST)</label>
                <textarea
                  rows={2}
                  value={mutasiNotes}
                  onChange={(e) => setMutasiNotes(e.target.value)}
                  placeholder="Catatan kondisi fisik dan tanggung jawab pemeliharaan aset/fasilitas..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMutasiModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    mutasiCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)'
                      ? swapEmpAId === swapEmpBId ||
                        selectedSwapAssetAIds.filter((id) =>
                          assets.some((a) => a.id === id && a.assignedToEmployeeId === swapEmpAId)
                        ).length +
                          selectedSwapAssetBIds.filter((id) =>
                            assets.some((a) => a.id === id && a.assignedToEmployeeId === swapEmpBId)
                          ).length ===
                          0
                      : selectedMutasiAssetIds.filter((id) => unassignedAssets.some((u) => u.id === id)).length === 0
                  }
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-xs"
                >
                  {mutasiCategory === 'Penukaran Aset Antar Karyawan (Melalui GA)'
                    ? 'Sahkan Penukaran Aset via GA & Terbitkan BAST'
                    : `Terbitkan BAST Serah Terima (${
                        selectedMutasiAssetIds.filter((id) => unassignedAssets.some((u) => u.id === id)).length
                      } Aset)`}
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

      {/* MODAL: BOOKING PENGGUNAAN KENDARAAN OPERASIONAL (SEWAKTU-WAKTU — KONSEP SAMA DENGAN PENGGUNAAN RUANGAN) */}
      {isVehicleModalOpen && (
        <div
          onClick={() => setIsVehicleModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold">
                  Formulir Penggunaan Kendaraan Operasional (Sewaktu-waktu)
                </h3>
                <p className="text-[10px] text-slate-300">
                  Konsep sama dengan Penggunaan Ruangan Sewaktu-waktu (bukan kendaraan fasilitas yang melekat ke 1 karyawan).
                </p>
              </div>
              <button onClick={() => setIsVehicleModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreateVehicleBooking} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pilihan Armada Kendaraan Operasional (Pool Kantor) *
                </label>
                <select
                  value={vehicleForm.vehicleName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="Toyota Avanza Veloz (B 5678 NTM) — Armada Pool Operasional">
                    Toyota Avanza Veloz (B 5678 NTM) — Armada Pool Operasional (7-Seater)
                  </option>
                  <option value="Toyota Innova Zenix (B 8821 KJA) — Armada Pool Operasional">
                    Toyota Innova Zenix (B 8821 KJA) — Armada Pool Operasional (7-Seater)
                  </option>
                  <option value="Toyota HiAce Commuter (B 9012 NTM) — Armada Pool Operasional">
                    Toyota HiAce Commuter 15-Seater (B 9012 NTM) — Armada Pool Operasional
                  </option>
                  <option value="Daihatsu GranMax Blindvan (B 3456 NTM) — Armada Logistik">
                    Daihatsu GranMax Blindvan Logistik (B 3456 NTM) — Armada Operasional
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Karyawan Pengguna / Pemohon Kendaraan Operasional *
                </label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={vehicleForm.borrowerId}
                  onSelect={(id) => setVehicleForm({ ...vehicleForm, borrowerId: id })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Keperluan Dinas / Agenda *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kunjungan Audit Proyek Site"
                    value={vehicleForm.purpose}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, purpose: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rute / Lokasi Tujuan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sudirman - Kawasan Industri Karawang"
                    value={vehicleForm.destination}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, destination: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* Jadwal Tanggal & Jam Pakai (Sama Konsepnya dengan Reservasi Penggunaan Ruangan Sewaktu-waktu) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ValidatedDateInput
                  id="vehicleStartDate"
                  label="Tgl Mulai *"
                  value={vehicleForm.startDate}
                  onChange={(val) => setVehicleForm({ ...vehicleForm, startDate: val, endDate: val })}
                  required
                />
                <ValidatedDateInput
                  id="vehicleEndDate"
                  label="Tgl Selesai *"
                  value={vehicleForm.endDate}
                  minDate={vehicleForm.startDate}
                  onChange={(val) => setVehicleForm({ ...vehicleForm, endDate: val })}
                  required
                />
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    required
                    value={vehicleForm.startTime}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jam Selesai *</label>
                  <input
                    type="time"
                    required
                    value={vehicleForm.endTime}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mode Pengemudi</label>
                  <select
                    value={vehicleForm.driverType}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        driverType: e.target.value as 'Sopir Kantor' | 'Bawa Sendiri',
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="Sopir Kantor">Dengan Sopir Kantor</option>
                    <option value="Bawa Sendiri">Bawa Sendiri (Lepas Kunci)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Sopir / Pengemudi</label>
                  <input
                    type="text"
                    value={vehicleForm.driverName}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                    disabled={vehicleForm.driverType === 'Bawa Sendiri'}
                    placeholder="Nama driver..."
                    className="w-full p-2 border border-slate-300 rounded disabled:bg-slate-100"
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
                  Konfirmasi Booking Kendaraan Operasional
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
                  type="button"
                  onClick={handleDownloadQRPdf}
                  disabled={isExportingQR}
                  className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shrink-0"
                  title="Unduh Label Format PDF"
                  aria-label="Unduh PDF"
                >
                  {isExportingQR ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePrintQR}
                  disabled={isPrintingQR}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center shrink-0"
                  title="Cetak Label Fisik"
                  aria-label="Cetak Label"
                >
                  {isPrintingQR ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAssetForQR(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 flex items-center justify-center shrink-0"
                  title="Tutup"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div ref={qrLabelRef} className="p-6 text-center space-y-4 bg-white">
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

      {/* Module Document Modal: GA & Aset */}
      <ModuleDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Pusat Dokumen Resmi General Affairs & Inventaris Aset (BAST)"
        categoryFilter="Pengadaan, Aset & Umum (GA)"
        defaultTemplateId="tmpl-15"
      />

      {/* Modal Edit SLA Kategori Aset */}
      {editingSlaCat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                  <Clock className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Konfigurasi SLA Kategori Aset</h3>
                  <p className="text-[11px] text-indigo-200">{editingSlaCat.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlaCat(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCategorySla(editingSlaCat);
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    SLA Respon Awal (Jam) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSlaCat.responseSlaHours}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, responseSlaHours: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Target awal tanggapan tiket</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    SLA Resolusi / Servis (Jam) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSlaCat.resolutionSlaHours}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, resolutionSlaHours: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Batas perbaikan ({Math.round(editingSlaCat.resolutionSlaHours / 24 * 10) / 10} Hari)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    SLA Unit Cadangan / Backup (Jam) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSlaCat.replacementSlaHours}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, replacementSlaHours: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Batas penyediaan unit pinjaman</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    SLA Pengadaan Baru (Hari Kerja) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSlaCat.procurementSlaDays}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, procurementSlaDays: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Lead time pembelian baru</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tingkat Prioritas Kategori</label>
                  <select
                    value={editingSlaCat.priorityLevel}
                    onChange={(e) =>
                      setEditingSlaCat({
                        ...editingSlaCat,
                        priorityLevel: e.target.value as 'Rendah' | 'Normal' | 'Tinggi' | 'Kritis',
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Kritis">Kritis</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="autoEscalateCheck"
                    checked={editingSlaCat.autoEscalate}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, autoEscalate: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="autoEscalateCheck" className="text-slate-700 font-semibold cursor-pointer">
                    Eskalasi otomatis jika SLA breached
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Lead PIC</label>
                  <input
                    type="text"
                    required
                    value={editingSlaCat.picName}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, picName: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Peran / Jabatan Tim</label>
                  <input
                    type="text"
                    required
                    value={editingSlaCat.picRole}
                    onChange={(e) =>
                      setEditingSlaCat({ ...editingSlaCat, picRole: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Operasional / Prosedur</label>
                <textarea
                  rows={2}
                  value={editingSlaCat.notes || ''}
                  onChange={(e) =>
                    setEditingSlaCat({ ...editingSlaCat, notes: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Ketentuan unit cadangan, garansi resmi rekanan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSlaCat(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Simpan Konfigurasi SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {slaToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{slaToastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default GaAssetManagement;
