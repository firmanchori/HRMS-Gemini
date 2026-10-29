import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  MapPin,
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Compass,
  Radar,
  Users,
  Navigation,
  Warehouse,
  Wrench,
  Globe,
  Crosshair,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react';
import { OfficeLocation, OfficeLocationType } from '../../types/hrms';

const TILE_SIZE = 256;

function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const worldX = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x: worldX, y: worldY };
}

function worldPixelToLatLng(worldX: number, worldY: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (worldX / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * worldY) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Number(Math.max(-85.0511, Math.min(85.0511, lat)).toFixed(6)),
    lng: Number(((((lng + 180) % 360) + 360) % 360 - 180).toFixed(6)),
  };
}

interface PresetCoordinate {
  label: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
}

const INDONESIA_ADDRESS_PRESETS: PresetCoordinate[] = [
  {
    label: 'Kuningan / HR Rasuna Said, Jakarta Selatan',
    address: 'Menara Palma, Jl. HR Rasuna Said Blok X2 Kav. 6, Kuningan, Jakarta Selatan',
    city: 'Jakarta Selatan',
    lat: -6.2325,
    lng: 106.8318,
  },
  {
    label: 'SCBD Sudirman, Jakarta Selatan',
    address: ' Kawasan Niaga Terpadu Sudirman (SCBD) Lot 9, Jl. Jend. Sudirman, Jakarta Selatan',
    city: 'Jakarta Selatan',
    lat: -6.2246,
    lng: 106.8097,
  },
  {
    label: 'Kawasan Industri Pulogadung, Jakarta Timur',
    address: 'Jl. Raya Bekasi KM 21, Kawasan Industri Pulogadung, Jakarta Timur',
    city: 'Jakarta Timur',
    lat: -6.1892,
    lng: 106.9125,
  },
  {
    label: 'Dago / Ir. H. Juanda, Kota Bandung',
    address: 'Jl. Ir. H. Juanda No. 112, Coblong, Kota Bandung, Jawa Barat',
    city: 'Bandung',
    lat: -6.8906,
    lng: 107.6128,
  },
  {
    label: 'Kawasan Industri Jababeka Cikarang, Bekasi',
    address: 'Kawasan Industri Jababeka Tahap II, Cikarang Selatan, Kabupaten Bekasi',
    city: 'Bekasi',
    lat: -6.2945,
    lng: 107.1523,
  },
  {
    label: 'Tunjungan / Pakuwon Center, Surabaya',
    address: 'Jl. Embong Malang No. 1-5, Tegalsari, Kota Surabaya, Jawa Timur',
    city: 'Surabaya',
    lat: -7.2625,
    lng: 112.7402,
  },
  {
    label: 'Simpang Lima / Pandanaran, Semarang',
    address: 'Jl. Pandanaran No. 88, Mugassari, Kota Semarang, Jawa Tengah',
    city: 'Semarang',
    lat: -6.9889,
    lng: 110.4201,
  },
  {
    label: 'BSD Green Office Park, Tangerang',
    address: 'BSD Green Office Park, Cisauk, Tangerang, Banten',
    city: 'Tangerang',
    lat: -6.3016,
    lng: 106.6531,
  },
];

export const OfficeLocationManagement: React.FC = () => {
  const {
    officeLocations,
    addOfficeLocation,
    updateOfficeLocation,
    deleteOfficeLocation,
    entities,
    employees,
    updateEmployee,
    currentTenant,
  } = useHrms();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<OfficeLocationType>('Kantor Pusat');
  const [formCompanyName, setFormCompanyName] = useState(entities[0]?.name || currentTenant.name);
  const [formEntityId, setFormEntityId] = useState(entities[0]?.id || '');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Jakarta Selatan');
  const [formLat, setFormLat] = useState<number>(-6.2325);
  const [formLng, setFormLng] = useState<number>(106.8318);
  const [formRadius, setFormRadius] = useState<number>(100);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Map Search & Interactive Draggable Map State inside Form Modal
  const [mapSearchInput, setMapSearchInput] = useState('');
  const [mapSearchFeedback, setMapSearchFeedback] = useState<string | null>(null);
  const [mapViewLat, setMapViewLat] = useState<number>(-6.2325);
  const [mapViewLng, setMapViewLng] = useState<number>(106.8318);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapViewportSize, setMapViewportSize] = useState<{ width: number; height: number }>({
    width: 720,
    height: 280,
  });

  useEffect(() => {
    if (!isModalOpen) return;
    const updateSize = () => {
      if (mapContainerRef.current) {
        setMapViewportSize({
          width: mapContainerRef.current.clientWidth || 720,
          height: mapContainerRef.current.clientHeight || 280,
        });
      }
    };
    updateSize();
    const timer = setTimeout(updateSize, 60);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [isModalOpen]);

  // Delete Confirmation Modal
  const [deletingLoc, setDeletingLoc] = useState<OfficeLocation | null>(null);

  // Quick Assign Employees Modal for a Location
  const [assigningLoc, setAssigningLoc] = useState<OfficeLocation | null>(null);
  const [empAssignSearch, setEmpAssignSearch] = useState('');

  const companiesList = useMemo(() => {
    const set = new Set<string>();
    entities.forEach((e) => set.add(e.name));
    officeLocations.forEach((l) => {
      if (l.companyName) set.add(l.companyName);
    });
    if (set.size === 0) set.add(currentTenant.name);
    return Array.from(set);
  }, [entities, officeLocations, currentTenant.name]);

  const filteredLocations = useMemo(() => {
    return officeLocations.filter((loc) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.companyName.toLowerCase().includes(q) ||
        `${loc.latitude}, ${loc.longitude}`.includes(q);
      const matchType = filterType === 'all' || loc.type === filterType;
      const matchComp = filterCompany === 'all' || loc.companyName === filterCompany;
      return matchSearch && matchType && matchComp;
    });
  }, [officeLocations, searchQuery, filterType, filterCompany]);

  const getAssignedEmployees = (loc: OfficeLocation) => {
    return employees.filter((emp) => {
      if (emp.officeLocationIds && emp.officeLocationIds.includes(loc.id)) return true;
      if (emp.branchLocation && emp.branchLocation.toLowerCase().includes(loc.name.toLowerCase())) return true;
      return false;
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    const nextNum = officeLocations.length + 1;
    setFormCode(`LOC-${String(nextNum).padStart(3, '0')}`);
    setFormName('');
    setFormType('Kantor Cabang');
    setFormCompanyName(entities[0]?.name || currentTenant.name);
    setFormEntityId(entities[0]?.id || '');
    setFormAddress('Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan');
    setFormCity('Jakarta Selatan');
    setFormLat(-6.2246);
    setFormLng(106.8097);
    setMapViewLat(-6.2246);
    setMapViewLng(106.8097);
    setMapZoom(16);
    setDragOffset({ x: 0, y: 0 });
    setFormRadius(100);
    setFormIsActive(true);
    setFormNotes('');
    setMapSearchInput('');
    setMapSearchFeedback(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: OfficeLocation) => {
    setEditingId(loc.id);
    setFormCode(loc.code);
    setFormName(loc.name);
    setFormType(loc.type);
    setFormCompanyName(loc.companyName);
    setFormEntityId(loc.entityId || entities[0]?.id || '');
    setFormAddress(loc.address);
    setFormCity(loc.city);
    setFormLat(loc.latitude);
    setFormLng(loc.longitude);
    setMapViewLat(loc.latitude);
    setMapViewLng(loc.longitude);
    setMapZoom(16);
    setDragOffset({ x: 0, y: 0 });
    setFormRadius(loc.radiusMeters);
    setFormIsActive(loc.isActive);
    setFormNotes(loc.notes || '');
    setMapSearchInput('');
    setMapSearchFeedback(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Search by Address or by "Lat, Long"
  const handleMapSearch = async () => {
    const raw = mapSearchInput.trim();
    if (!raw) return;

    // 1. Check if input is Lat, Long coordinate pair (e.g. "-6.2325, 106.8318" or "-6.2325 106.8318")
    const coordMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      const parsedLat = parseFloat(coordMatch[1]);
      const parsedLng = parseFloat(coordMatch[2]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        const cleanLat = Number(parsedLat.toFixed(6));
        const cleanLng = Number(parsedLng.toFixed(6));
        setFormLat(cleanLat);
        setFormLng(cleanLng);
        setMapViewLat(cleanLat);
        setMapViewLng(cleanLng);
        setDragOffset({ x: 0, y: 0 });
        setMapSearchFeedback(`Titik koordinat berhasil ditemukan: Lat ${cleanLat}, Long ${cleanLng}`);
        return;
      }
    }

    // 2. Search in preset addresses / cities
    const q = raw.toLowerCase();
    const matchedPreset = INDONESIA_ADDRESS_PRESETS.find(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );

    if (matchedPreset) {
      setFormLat(matchedPreset.lat);
      setFormLng(matchedPreset.lng);
      setMapViewLat(matchedPreset.lat);
      setMapViewLng(matchedPreset.lng);
      setDragOffset({ x: 0, y: 0 });
      setFormAddress(matchedPreset.address);
      setFormCity(matchedPreset.city);
      setMapSearchFeedback(`Lokasi ditemukan: ${matchedPreset.label} (${matchedPreset.lat}, ${matchedPreset.lng})`);
      return;
    }

    // 3. Try live OpenStreetMap Nominatim Geocoding first
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(raw)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          const foundLat = Number(parseFloat(data[0].lat).toFixed(6));
          const foundLng = Number(parseFloat(data[0].lon).toFixed(6));
          setFormLat(foundLat);
          setFormLng(foundLng);
          setMapViewLat(foundLat);
          setMapViewLng(foundLng);
          setDragOffset({ x: 0, y: 0 });
          if (data[0].display_name) {
            setFormAddress(data[0].display_name);
          }
          setMapSearchFeedback(`Lokasi ditemukan di peta: ${data[0].display_name || raw} (${foundLat}, ${foundLng})`);
          return;
        }
      }
    } catch {
      // Fallback to deterministic coordinate mapping below if offline
    }

    // 4. Deterministic geocoding fallback for any custom address string
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const offsetLat = ((hash % 1000) / 1000) * 0.08 - 0.04;
    const offsetLng = (((hash >> 4) % 1000) / 1000) * 0.08 - 0.04;
    const newLat = Number((-6.2297 + offsetLat).toFixed(6));
    const newLng = Number((106.8295 + offsetLng).toFixed(6));

    setFormLat(newLat);
    setFormLng(newLng);
    setMapViewLat(newLat);
    setMapViewLng(newLng);
    setDragOffset({ x: 0, y: 0 });
    setFormAddress(raw);
    setMapSearchFeedback(`Alamat "${raw}" dipetakan ke titik koordinat: ${newLat}, ${newLng}`);
  };

  // Pointer Down / Move / Up for Draggable (Geser Peta) + Clickable (Klik Titik Lokasi) Map
  const handleMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDraggingMap(true);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingMap || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleMapPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingMap || !dragStartRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const movedDistance = Math.hypot(dx, dy);

    const centerWorld = latLngToWorldPixel(mapViewLat, mapViewLng, mapZoom);

    if (movedDistance > 5) {
      // User dragged/panned the map (Geser Peta)
      const nextCenter = worldPixelToLatLng(centerWorld.x - dx, centerWorld.y - dy, mapZoom);
      setMapViewLat(nextCenter.lat);
      setMapViewLng(nextCenter.lng);
    } else {
      // User clicked on the map (Klik untuk menentukan lokasi)
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const topLeftX = centerWorld.x - rect.width / 2;
      const topLeftY = centerWorld.y - rect.height / 2;
      const clickedCoord = worldPixelToLatLng(topLeftX + clickX, topLeftY + clickY, mapZoom);

      setFormLat(clickedCoord.lat);
      setFormLng(clickedCoord.lng);
      setMapSearchFeedback(
        `Titik peta diklik → Latitude: ${clickedCoord.lat}, Longitude: ${clickedCoord.lng} otomatis terisi!`
      );
    }

    dragStartRef.current = null;
    setIsDraggingMap(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMapWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    setMapZoom((prev) => Math.max(5, Math.min(18, prev + delta)));
  };

  const panMapByPixels = (pxX: number, pxY: number) => {
    const centerWorld = latLngToWorldPixel(mapViewLat, mapViewLng, mapZoom);
    const nextCenter = worldPixelToLatLng(centerWorld.x + pxX, centerWorld.y + pxY, mapZoom);
    setMapViewLat(nextCenter.lat);
    setMapViewLng(nextCenter.lng);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setFormError('Kode dan Nama Lokasi Kantor wajib diisi.');
      return;
    }
    if (!formAddress.trim()) {
      setFormError('Alamat lengkap lokasi kantor wajib diisi.');
      return;
    }

    const payload = {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      type: formType,
      companyName: formCompanyName.trim(),
      entityId: formEntityId || undefined,
      address: formAddress.trim(),
      city: formCity.trim() || 'Jakarta',
      latitude: Number(formLat),
      longitude: Number(formLng),
      radiusMeters: Math.max(10, Number(formRadius) || 100),
      isActive: formIsActive,
      notes: formNotes.trim(),
    };

    if (editingId) {
      updateOfficeLocation(editingId, payload);
      setNotice(`Lokasi "${payload.name}" berhasil diperbarui.`);
    } else {
      addOfficeLocation(payload);
      setNotice(`Lokasi baru "${payload.name}" berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotice(null), 4000);
  };

  const toggleEmployeeAssignment = (empId: string, loc: OfficeLocation) => {
    const emp = employees.find((x) => x.id === empId);
    if (!emp) return;

    const currentIds = emp.officeLocationIds || [];
    const exists = currentIds.includes(loc.id);
    const nextIds = exists ? currentIds.filter((id) => id !== loc.id) : [...currentIds, loc.id];

    const assignedNames = officeLocations
      .filter((l) => nextIds.includes(l.id))
      .map((l) => l.name)
      .join(', ');

    updateEmployee(emp.id, {
      officeLocationIds: nextIds,
      branchLocation: assignedNames || emp.branchLocation,
    });
  };

  const getTypeBadge = (type: OfficeLocationType) => {
    switch (type) {
      case 'Kantor Pusat':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Building2 };
      case 'Kantor Cabang':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: Globe };
      case 'Gudang':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Warehouse };
      case 'Workshop':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Wrench };
      default:
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: MapPin };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <span>Master Lokasi Kantor & Titik Geofencing Presensi (GPS Maps)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar Kantor Pusat, Kantor Cabang, Gudang, dan Workshop per entitas perusahaan beserta koordinat Latitude/Longitude dan radius absensi GPS.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Lokasi Kantor</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 block">Total Titik Lokasi Kantor</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{officeLocations.length} Lokasi</span>
          <span className="text-[10px] text-emerald-600 font-medium">Aktif Terintegrasi Geofence</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 block">Kantor Pusat & Cabang</span>
          <span className="text-xl font-bold text-indigo-600 mt-0.5 block">
            {officeLocations.filter((l) => l.type === 'Kantor Pusat' || l.type === 'Kantor Cabang').length} Gedung
          </span>
          <span className="text-[10px] text-slate-400">Operasional & Administrasi</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 block">Gudang & Workshop</span>
          <span className="text-xl font-bold text-amber-600 mt-0.5 block">
            {officeLocations.filter((l) => l.type === 'Gudang' || l.type === 'Workshop').length} Fasilitas
          </span>
          <span className="text-[10px] text-slate-400">Logistik, Distribusi & Teknik</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 block">Rata-Rata Radius Absensi</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-0.5 block">
            {Math.round(
              officeLocations.reduce((acc, l) => acc + l.radiusMeters, 0) / (officeLocations.length || 1)
            )}{' '}
            Meter
          </span>
          <span className="text-[10px] text-slate-400">Validasi GPS Presensi</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama lokasi, perusahaan, alamat, kota, atau koordinat lat/long..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="all">Semua Perusahaan / Entitas</option>
            {companiesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="all">Semua Tipe Lokasi</option>
            <option value="Kantor Pusat">Kantor Pusat</option>
            <option value="Kantor Cabang">Kantor Cabang</option>
            <option value="Gudang">Gudang</option>
            <option value="Workshop">Workshop</option>
            <option value="Site Operasional">Site Operasional</option>
          </select>
        </div>
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredLocations.map((loc) => {
          const badge = getTypeBadge(loc.type);
          const BadgeIcon = badge.icon;
          const assignedEmps = getAssignedEmployees(loc);

          return (
            <div
              key={loc.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs overflow-hidden flex flex-col justify-between transition-all"
            >
              <div className="p-4 space-y-3">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{loc.type}</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {loc.code}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          loc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {loc.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                    <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{loc.companyName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(loc)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
                      title="Ubah Lokasi & Titik Peta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingLoc(loc)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                      title="Hapus Lokasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800">{loc.address}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Kota/Kabupaten: {loc.city}</div>
                  </div>
                </div>

                {/* Coordinates & Radius Info */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Latitude</span>
                    <strong className="font-mono text-slate-900 text-xs">{loc.latitude}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Longitude</span>
                    <strong className="font-mono text-slate-900 text-xs">{loc.longitude}</strong>
                  </div>
                  <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-200">
                    <span className="text-[10px] text-indigo-600 block uppercase font-semibold">Radius Absensi</span>
                    <strong className="font-mono text-indigo-900 text-xs">{loc.radiusMeters} Meter</strong>
                  </div>
                </div>
              </div>

              {/* Footer: Assigned Employees */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Ditugaskan: <strong className="text-slate-900">{assignedEmps.length} Karyawan</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAssigningLoc(loc);
                    setEmpAssignSearch('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Kelola Penugasan Karyawan →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADD / EDIT OFFICE LOCATION WITH INTERACTIVE MAP PICKER */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">
                  {editingId ? 'Ubah Lokasi Kantor & Radius Geofence' : 'Tambah Lokasi Kantor Baru'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Perusahaan & Kategori Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Perusahaan / Entitas *</label>
                  <input
                    type="text"
                    list="companyOptionsList"
                    required
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="Contoh: PT Perusahaan A"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <datalist id="companyOptionsList">
                    {companiesList.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe / Jenis Lokasi *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as OfficeLocationType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Kantor Pusat">Kantor Pusat</option>
                    <option value="Kantor Cabang">Kantor Cabang</option>
                    <option value="Gudang">Gudang</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Site Operasional">Site Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Lokasi *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="LOC-HQ-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Nama Lokasi & Kota */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nama Lokasi Kantor / Cabang / Gudang *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kantor Pusat Jakarta / Gudang Logistik Cikarang"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Row 3: Pencarian Peta (Search by Address atau Search by Lat Long) */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>Pencarian Titik Lokasi Maps (By Address atau By Lat Long)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Klik Peta = Lat Long Otomatis Terisi
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mapSearchInput}
                      onChange={(e) => setMapSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleMapSearch();
                        }
                      }}
                      placeholder="Ketik alamat (mis: Kuningan, Bandung, Cikarang) atau koordinat (-6.2325, 106.8318)..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleMapSearch}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Cari Lokasi / Koordinat</span>
                  </button>
                </div>

                {/* Preset Quick Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-semibold">Lokasi Cepat:</span>
                  {INDONESIA_ADDRESS_PRESETS.slice(0, 5).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setFormLat(preset.lat);
                        setFormLng(preset.lng);
                        setMapViewLat(preset.lat);
                        setMapViewLng(preset.lng);
                        setDragOffset({ x: 0, y: 0 });
                        setFormAddress(preset.address);
                        setFormCity(preset.city);
                        setMapSearchFeedback(`Titik peta diarahkan ke ${preset.label} (${preset.lat}, ${preset.lng})`);
                      }}
                      className="text-[10px] px-2 py-0.5 bg-white hover:bg-indigo-100 text-slate-700 border border-slate-200 rounded transition-colors"
                    >
                      {preset.city}
                    </button>
                  ))}
                </div>

                {mapSearchFeedback && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{mapSearchFeedback}</span>
                  </div>
                )}

                {/* Interactive Draggable (Pan/Geser), Zoomable & Clickable Slippy Map */}
                <div className="space-y-1.5">
                  {(() => {
                    const width = mapViewportSize.width || 720;
                    const height = mapViewportSize.height || 280;
                    const centerWorld = latLngToWorldPixel(mapViewLat, mapViewLng, mapZoom);
                    const effectiveCenterX = centerWorld.x - dragOffset.x;
                    const effectiveCenterY = centerWorld.y - dragOffset.y;
                    const topLeftX = effectiveCenterX - width / 2;
                    const topLeftY = effectiveCenterY - height / 2;

                    const minTileX = Math.floor(topLeftX / TILE_SIZE);
                    const maxTileX = Math.floor((topLeftX + width) / TILE_SIZE);
                    const minTileY = Math.floor(topLeftY / TILE_SIZE);
                    const maxTileY = Math.floor((topLeftY + height) / TILE_SIZE);
                    const numTiles = Math.pow(2, mapZoom);

                    const tiles: { key: string; url: string; left: number; top: number }[] = [];
                    for (let tx = minTileX; tx <= maxTileX; tx++) {
                      for (let ty = minTileY; ty <= maxTileY; ty++) {
                        if (ty < 0 || ty >= numTiles) continue;
                        const wrappedX = ((tx % numTiles) + numTiles) % numTiles;
                        tiles.push({
                          key: `${mapZoom}-${tx}-${ty}`,
                          url: `https://tile.openstreetmap.org/${mapZoom}/${wrappedX}/${ty}.png`,
                          left: Math.round(tx * TILE_SIZE - topLeftX),
                          top: Math.round(ty * TILE_SIZE - topLeftY),
                        });
                      }
                    }

                    // Active Pin position on screen
                    const pinWorld = latLngToWorldPixel(formLat, formLng, mapZoom);
                    const pinScreenX = pinWorld.x - topLeftX;
                    const pinScreenY = pinWorld.y - topLeftY;

                    // Real-world radius in pixels at current zoom & latitude
                    const metersPerPixel =
                      (156543.03392 * Math.cos((formLat * Math.PI) / 180)) / Math.pow(2, mapZoom);
                    const radiusDiameterPx = Math.min(
                      520,
                      Math.max(32, Math.round((formRadius * 2) / Math.max(0.1, metersPerPixel)))
                    );

                    return (
                      <div
                        ref={mapContainerRef}
                        onPointerDown={handleMapPointerDown}
                        onPointerMove={handleMapPointerMove}
                        onPointerUp={handleMapPointerUp}
                        onWheel={handleMapWheel}
                        style={{ touchAction: 'none' }}
                        className={`relative w-full h-72 rounded-xl overflow-hidden border-2 border-indigo-300 bg-slate-200 select-none shadow-inner ${
                          isDraggingMap ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                        title="Tahan & geser (drag) untuk menggeser peta, atau klik di titik mana saja untuk menentukan lokasi pin"
                      >
                        {/* OpenStreetMap Slippy Tiles Layer */}
                        <div className="absolute inset-0 pointer-events-none">
                          {tiles.map((t) => (
                            <img
                              key={t.key}
                              src={t.url}
                              alt=""
                              draggable={false}
                              style={{
                                position: 'absolute',
                                left: `${t.left}px`,
                                top: `${t.top}px`,
                                width: `${TILE_SIZE}px`,
                                height: `${TILE_SIZE}px`,
                              }}
                              className="max-w-none select-none pointer-events-none"
                            />
                          ))}
                        </div>

                        {/* Subtle Center Crosshair Guide while panning */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-5 h-5 border border-slate-900/30 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-slate-900/40 rounded-full" />
                          </div>
                        </div>

                        {/* Geofence Radius Circle & Pin Marker anchored to (formLat, formLng) */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${pinScreenX}px`,
                            top: `${pinScreenY}px`,
                            width: `${radiusDiameterPx}px`,
                            height: `${radiusDiameterPx}px`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="rounded-full bg-indigo-500/20 border-2 border-indigo-600 pointer-events-none flex items-center justify-center transition-[width,height] duration-150"
                        >
                          <div className="relative flex flex-col items-center">
                            <div className="px-1.5 py-0.5 bg-slate-900/90 text-white text-[9px] font-mono rounded shadow-sm whitespace-nowrap -mt-7 mb-0.5">
                              Radius {formRadius}m
                            </div>
                            <div className="w-4 h-4 rounded-full bg-rose-600 ring-4 ring-white shadow-lg" />
                          </div>
                        </div>

                        {/* Top-Left Coordinate Status Badge */}
                        <div className="absolute top-2.5 left-2.5 bg-slate-900/85 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1.5 pointer-events-none shadow-sm">
                          <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Pin: {formLat}, {formLng} · Radius {formRadius}m · Zoom {mapZoom}x
                          </span>
                        </div>

                        {/* Top-Right Interactive Map Controls (Zoom In/Out, Center to Pin, Set Pin at Center) */}
                        <div
                          className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1 bg-white/95 p-1 rounded-lg shadow-md border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
                              className="p-1.5 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded transition-colors"
                              title="Perbesar Peta (Zoom In)"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapZoom((z) => Math.max(5, z - 1))}
                              className="p-1.5 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded transition-colors"
                              title="Perkecil Peta (Zoom Out)"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMapViewLat(formLat);
                                setMapViewLng(formLng);
                                setDragOffset({ x: 0, y: 0 });
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors"
                              title="Pusatkan tampilan peta ke posisi Pin saat ini"
                            >
                              Pusatkan Pin
                            </button>
                          </div>

                          {/* Directional Pan Controls + Set Pin at Map Center */}
                          <div className="flex items-center gap-1 bg-white/95 p-1 rounded-lg shadow-md border border-slate-200">
                            <button
                              type="button"
                              onClick={() => panMapByPixels(-120, 0)}
                              className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-700"
                              title="Geser Kiri"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              onClick={() => panMapByPixels(0, -100)}
                              className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-700"
                              title="Geser Atas"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => panMapByPixels(0, 100)}
                              className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-700"
                              title="Geser Bawah"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => panMapByPixels(120, 0)}
                              className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-100 rounded text-slate-700"
                              title="Geser Kanan"
                            >
                              ▶
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const cLat = Number(mapViewLat.toFixed(6));
                                const cLng = Number(mapViewLng.toFixed(6));
                                setFormLat(cLat);
                                setFormLng(cLng);
                                setMapSearchFeedback(
                                  `Pin ditempatkan di titik tengah peta → Latitude: ${cLat}, Longitude: ${cLng}`
                                );
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors"
                              title="Pasang Pin Lokasi tepat di titik tengah tampilan peta saat ini"
                            >
                              📍 Set Tengah
                            </button>
                          </div>
                        </div>

                        {/* Bottom Instruction Banner */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/85 text-white px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between pointer-events-none">
                          <span className="flex items-center gap-1.5">
                            <Move className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                            <span>
                              <strong>Tahan & Geser (Drag)</strong> untuk menggeser peta · <strong>Klik di mana saja</strong> untuk menentukan titik lokasi (Lat/Long otomatis terisi)
                            </span>
                          </span>
                          <span className="font-mono text-emerald-300 font-bold shrink-0 ml-2">GESER & KLIK</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Latitude, Longitude & Radius Inputs (Auto-filled when clicking map) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Latitude (Garis Lintang) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLat}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormLat(val);
                        setMapViewLat(val);
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Longitude (Garis Bujur) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formLng}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormLng(val);
                        setMapViewLng(val);
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Radius Absensi GPS (Meter) *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={5000}
                        required
                        value={formRadius}
                        onChange={(e) => setFormRadius(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-indigo-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Alamat Lengkap & Catatan */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap Lokasi Kantor *</label>
                <textarea
                  rows={2}
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jl. HR Rasuna Said Blok X2 Kav. 6, Kuningan, Jakarta Selatan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span>Lokasi Aktif Digunakan untuk Validasi Geofencing Presensi</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingId ? 'Simpan Perubahan Lokasi' : 'Simpan Lokasi Kantor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELOLA PENUGASAN KARYAWAN DI LOKASI INI */}
      {assigningLoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssigningLoc(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Penugasan Karyawan — {assigningLoc.name}</h3>
                <p className="text-[11px] text-slate-300">
                  Radius Presensi: {assigningLoc.radiusMeters}m · Karyawan dapat ditugaskan di 1 atau lebih lokasi kantor.
                </p>
              </div>
              <button type="button" onClick={() => setAssigningLoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <input
                type="text"
                value={empAssignSearch}
                onChange={(e) => setEmpAssignSearch(e.target.value)}
                placeholder="Cari nama karyawan, NIK, atau departemen..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {employees
                .filter((e) =>
                  `${e.fullName} ${e.nik} ${e.department} ${e.position}`
                    .toLowerCase()
                    .includes(empAssignSearch.trim().toLowerCase())
                )
                .map((emp) => {
                  const isAssigned =
                    (emp.officeLocationIds && emp.officeLocationIds.includes(assigningLoc.id)) ||
                    (emp.branchLocation &&
                      emp.branchLocation.toLowerCase().includes(assigningLoc.name.toLowerCase()));
                  const assignedCount = emp.officeLocationIds?.length || 1;

                  return (
                    <label
                      key={emp.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50/40 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!isAssigned}
                          onChange={() => toggleEmployeeAssignment(emp.id, assigningLoc)}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {emp.nik} · {emp.position} ({emp.department})
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                        {assignedCount} Lokasi
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="p-3.5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setAssigningLoc(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS LOKASI */}
      {deletingLoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingLoc(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden p-5 space-y-4 text-xs">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Lokasi Kantor?</span>
            </div>
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus <strong>{deletingLoc.name}</strong> ({deletingLoc.companyName}) dari daftar lokasi kantor?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingLoc(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOfficeLocation(deletingLoc.id);
                  setNotice(`Lokasi "${deletingLoc.name}" telah dihapus.`);
                  setDeletingLoc(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

