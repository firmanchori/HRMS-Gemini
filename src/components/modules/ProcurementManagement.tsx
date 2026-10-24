import React, { useState } from 'react';
import { useHrms } from '../../context/HrmsContext';
import {
  ShoppingCart,
  Plus,
  FileCheck,
  CheckCircle2,
  PackageCheck,
  Building,
  DollarSign,
  X,
  Search,
  Filter,
  Printer,
  FileText,
  Star,
  Settings,
  Briefcase,
  Users,
  Eye,
} from 'lucide-react';
import { ProcurementOrder, Vendor } from '../../types/hrms';
import { formatRupiah } from '../../utils/taxCalculator';
import { QRCodeView } from '../common/QRCodeView';
import { EmployeeSelect } from '../common/EmployeeSelect';
import { ScrollableTabNav } from '../common/ScrollableTabNav';

interface ProjectContract {
  id: string;
  contractNumber: string;
  projectName: string;
  vendorId: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  progressPercent: number;
  paymentMilestones: { name: string; percent: number; amount: number; isPaid: boolean }[];
  status: 'Aktif Berjalan' | 'Selesai' | 'Tertunda';
}

const INITIAL_PROJECT_CONTRACTS: ProjectContract[] = [
  {
    id: 'ctr-001',
    contractNumber: 'KTRK/PRJ/2026/001',
    projectName: 'Pengembangan Infrastruktur Server & Cloud Data Center',
    vendorId: 'ven-1',
    totalValue: 120000000,
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    progressPercent: 65,
    status: 'Aktif Berjalan',
    paymentMilestones: [
      { name: 'DP Awal (Down Payment)', percent: 30, amount: 36000000, isPaid: true },
      { name: 'Milestone 1: UAT Staging Server', percent: 40, amount: 48000000, isPaid: true },
      { name: 'Milestone Final: Go-Live & BAST', percent: 30, amount: 36000000, isPaid: false },
    ],
  },
  {
    id: 'ctr-002',
    contractNumber: 'KTRK/BLD/2026/004',
    projectName: 'Renovasi Interior & Partisi Kaca Akustik Lantai 18',
    vendorId: 'ven-2',
    totalValue: 85000000,
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    progressPercent: 40,
    status: 'Aktif Berjalan',
    paymentMilestones: [
      { name: 'DP 20%', percent: 20, amount: 17000000, isPaid: true },
      { name: 'Progress Fisik 50%', percent: 40, amount: 34000000, isPaid: false },
      { name: 'Pelunasan & Retensi 5%', percent: 40, amount: 34000000, isPaid: false },
    ],
  },
];

export const ProcurementManagement: React.FC = () => {
  const {
    procurementOrders,
    addProcurementOrder,
    updateProcurementStatus,
    employees,
    vendors,
    addVendor,
    vendorInvoices,
    addVendorInvoice,
    updateVendorInvoiceStatus,
    currentTenant,
    moduleSettings,
    updateModuleSettings,
  } = useHrms();

  const [activeTab, setActiveTab] = useState<'orders' | 'vendors' | 'projects' | 'invoices' | 'pengaturan'>('orders');
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<ProcurementOrder | null>(null);

  // PR Form Modal
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState(vendors[0]?.name || 'PT Mitra Solusi Komputindo');
  const [itemName, setItemName] = useState('');
  const [procurementCategory, setProcurementCategory] = useState<'Pengadaan Barang' | 'Proyek / Jasa Kontrak'>('Pengadaan Barang');
  const [quantity, setQuantity] = useState<number>(1);
  const [estimatedCost, setEstimatedCost] = useState<number>(7500000);
  const [requestorEmpId, setRequestorEmpId] = useState(employees[0]?.id || '');
  const [department, setDepartment] = useState('Engineering');

  // Vendor Form Modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVenName, setNewVenName] = useState('');
  const [newVenCategory, setNewVenCategory] = useState<Vendor['category']>('Hardware & IT');
  const [newVenPic, setNewVenPic] = useState('');
  const [newVenPhone, setNewVenPhone] = useState('021-555' + Math.floor(1000 + Math.random() * 9000));
  const [newVenEmail, setNewVenEmail] = useState('');
  const [newVenNpwp, setNewVenNpwp] = useState('01.234.567.8-000.000');
  const [newVenAddress, setNewVenAddress] = useState('Kawasan Industri Pulogadung, Jakarta Timur');

  // Project Contracts State & Modal
  const [projectContracts, setProjectContracts] = useState<ProjectContract[]>(INITIAL_PROJECT_CONTRACTS);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    contractNumber: 'KTRK/PRJ/2026/003',
    projectName: '',
    vendorId: vendors[0]?.id || 'ven-1',
    totalValue: 50000000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
    progressPercent: 10,
    status: 'Aktif Berjalan' as const,
    dpPercent: 20,
    term1Percent: 40,
    term2Percent: 40,
  });

  // Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    vendorId: vendors[0]?.id || 'ven-1',
    poNumber: 'PO-2026-001',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    amount: 15000000,
    taxInvoiceNumber: '010.000-26.88392100',
    notes: 'Pembayaran termin sesuai BAST dan PO.',
  });

  // Settings State
  const [prThreshold, setPrThreshold] = useState(moduleSettings.procurement?.directorApprovalThreshold || 20000000);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('Net 30 Days');
  const [requireQuotationCompare, setRequireQuotationCompare] = useState(true);

  const reqEmp = employees.find((e) => e.id === requestorEmpId);

  const handleSubmitPR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !vendorName) return;

    addProcurementOrder({
      vendorName,
      itemName: `[${procurementCategory}] ${itemName}`,
      quantity: Number(quantity),
      estimatedCost: Number(estimatedCost),
      requestor: reqEmp?.fullName || 'Aditya Pratama',
      department,
    });

    setIsPRModalOpen(false);
    setItemName('');
    alert('Pengajuan Purchase Requisition (PR) berhasil dibuat dan diteruskan ke bagian Purchasing!');
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenName) return;

    addVendor({
      name: newVenName,
      code: `VND-${String(vendors.length + 1).padStart(3, '0')}`,
      category: newVenCategory,
      contactPerson: newVenPic || 'PIC Marketing',
      phone: newVenPhone,
      email: newVenEmail || 'info@vendor.co.id',
      address: newVenAddress,
      npwp: newVenNpwp,
      rating: 4.8,
      isVerified: true,
    });

    setIsVendorModalOpen(false);
    setNewVenName('');
    alert(`Vendor "${newVenName}" berhasil didaftarkan ke direktori supplier rekanan!`);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.projectName) return;

    const totalVal = Number(projectForm.totalValue);
    const dpAmount = Math.round((totalVal * Number(projectForm.dpPercent)) / 100);
    const t1Amount = Math.round((totalVal * Number(projectForm.term1Percent)) / 100);
    const t2Amount = totalVal - dpAmount - t1Amount;

    const newProject: ProjectContract = {
      id: `ctr-${Date.now().toString().slice(-4)}`,
      contractNumber: projectForm.contractNumber || `KTRK/PRJ/2026/${String(projectContracts.length + 1).padStart(3, '0')}`,
      projectName: projectForm.projectName,
      vendorId: projectForm.vendorId,
      totalValue: totalVal,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      progressPercent: Number(projectForm.progressPercent),
      status: projectForm.status,
      paymentMilestones: [
        { name: `DP Awal (${projectForm.dpPercent}%)`, percent: Number(projectForm.dpPercent), amount: dpAmount, isPaid: true },
        { name: `Milestone 1 (${projectForm.term1Percent}%)`, percent: Number(projectForm.term1Percent), amount: t1Amount, isPaid: false },
        { name: `Pelunasan Final (${projectForm.term2Percent}%)`, percent: Number(projectForm.term2Percent), amount: t2Amount, isPaid: false },
      ],
    };

    setProjectContracts([newProject, ...projectContracts]);
    setIsProjectModalOpen(false);
    setProjectForm({
      ...projectForm,
      projectName: '',
      contractNumber: `KTRK/PRJ/2026/${String(projectContracts.length + 2).padStart(3, '0')}`,
    });
    alert('Kontrak proyek & termin milestone berhasil didaftarkan!');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.invoiceNumber) return;

    const selectedVendor = vendors.find((v) => v.id === invoiceForm.vendorId) || vendors[0];
    addVendorInvoice({
      vendorId: selectedVendor?.id || 'ven-1',
      vendorName: selectedVendor?.name || 'Vendor Rekanan',
      poNumber: invoiceForm.poNumber,
      invoiceNumber: invoiceForm.invoiceNumber,
      invoiceDate: invoiceForm.invoiceDate,
      dueDate: invoiceForm.dueDate,
      amount: Number(invoiceForm.amount),
      taxInvoiceNumber: invoiceForm.taxInvoiceNumber,
      notes: invoiceForm.notes,
    });

    setIsInvoiceModalOpen(false);
    setInvoiceForm({
      ...invoiceForm,
      invoiceNumber: '',
    });
    alert('Faktur & Tagihan Vendor (AP) berhasil dicatat ke sistem!');
  };

  const handleSaveSettings = () => {
    updateModuleSettings('procurement', {
      directorApprovalThreshold: Number(prThreshold),
    });
    alert('Pengaturan Modul Procurement & Approval Anggaran berhasil disimpan!');
  };

  const totalProcurementBudget = procurementOrders.reduce((sum, p) => sum + p.estimatedCost, 0);

  return (
    <div className="space-y-5">
      {/* Row 1: Module Header */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          <span>Manajemen Pengadaan Barang, Proyek & Vendor (Procurement)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Alur Purchase Requisition (PR), perbandingan quotation vendor, Purchase Order (PO) bertanda tangan QR, serta kontrak proyek jangka panjang.
        </p>
      </div>

      {/* Row 2: Enterprise Tab Navigation Bar with Arrows */}
      <ScrollableTabNav className="border-b border-slate-200" containerClassName="pt-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Pengadaan (PR & PO)</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'vendors'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Direktori Vendor</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'vendors'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {vendors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'projects'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Kontrak Proyek & Milestone</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'invoices'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Tagihan & Invoice Vendor</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'invoices'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {vendorInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`pb-3 pt-2 px-3 sm:px-4 text-xs font-semibold transition-all flex items-center gap-2 shrink-0 border-b-2 -mb-px ${
            activeTab === 'pengaturan'
              ? 'border-slate-900 text-slate-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <span>Pengaturan Pengadaan</span>
        </button>
      </ScrollableTabNav>

      {/* TAB 1: PR & PO ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Total Anggaran Pengadaan</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatRupiah(totalProcurementBudget)}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">PR Dalam Peninjauan</span>
                <span className="text-base font-bold font-mono text-amber-700">
                  {procurementOrders.filter((p) => p.status === 'Pengajuan PR').length} Pengajuan
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-500 block">PO Terbit / Siap Kirim</span>
                <span className="text-base font-bold font-mono text-indigo-700">
                  {procurementOrders.filter((p) => p.status === 'PO Terbit').length} Pesanan
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPRModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Pengajuan PR</span>
            </button>
          </div>

          {/* Orders Table */}
          {/* TAMPILAN MOBILE & TABLET: Adaptive Card View (< md) */}
          <div className="md:hidden space-y-3">
            {procurementOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedPOForPrint(order)}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs space-y-3 cursor-pointer active:scale-[0.99] transition-all"
              >
                {/* Header: Numbers & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {order.prNumber}
                      </span>
                      {order.poNumber ? (
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {order.poNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          PO Pending
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-1.5 leading-snug">
                      {order.itemName}
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      order.status === 'Barang Diterima'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'PO Terbit'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* 2-Column Info Grid */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Vendor Supplier:</span>
                    <div className="font-semibold text-slate-800 truncate">{order.vendorName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Qty: {order.quantity} unit</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pemohon / Dept:</span>
                    <div className="font-semibold text-slate-800 truncate">{order.requestor}</div>
                    <div className="text-[10px] text-slate-500 truncate">{order.department}</div>
                  </div>
                </div>

                {/* Footer: Cost & Action */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimasi Biaya:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(order.estimatedCost)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {order.status === 'Pengajuan PR' && (
                      <button
                        type="button"
                        onClick={() => updateProcurementStatus(order.id, 'PO Terbit')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                      >
                        Rilis PO
                      </button>
                    )}
                    {order.status === 'PO Terbit' && (
                      <button
                        type="button"
                        onClick={() => updateProcurementStatus(order.id, 'Barang Diterima')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                      >
                        BAST Terima
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedPOForPrint(order)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold border border-indigo-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dokumen PO</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: Orders Table (>= md) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">No. PR / PO</th>
                    <th className="py-2.5 px-3 font-semibold">Item & Spesifikasi</th>
                    <th className="py-2.5 px-3 font-semibold">Vendor Supplier</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Jumlah</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Estimasi Biaya</th>
                    <th className="py-2.5 px-3 font-semibold">Pemohon & Dept</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {procurementOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedPOForPrint(order)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-bold text-slate-900">{order.prNumber}</div>
                        {order.poNumber ? (
                          <div className="text-[10px] text-indigo-700 font-semibold">{order.poNumber}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">PO Belum Rilis</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{order.itemName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{order.vendorName}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium">{order.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(order.estimatedCost)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div>{order.requestor}</div>
                        <div className="text-[10px] text-slate-400">{order.department}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            order.status === 'Barang Diterima'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.status === 'PO Terbit'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {order.status === 'Pengajuan PR' && (
                            <button
                              onClick={() => updateProcurementStatus(order.id, 'PO Terbit')}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold"
                            >
                              Setujui & Rilis PO
                            </button>
                          )}
                          {order.status === 'PO Terbit' && (
                            <button
                              onClick={() => updateProcurementStatus(order.id, 'Barang Diterima')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                            >
                              BAST Terima
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPOForPrint(order)}
                            className="p-1 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Lihat Dokumen PO Resmi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN VENDOR */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Direktori Vendor & Supplier Rekanan Resmi</span>
              </h3>
              <p className="text-xs text-slate-500">
                Data legalitas NPWP/SIUP, PIC operasional, rating performa dan riwayat pemenuhan pesanan.
              </p>
            </div>
            <button
              onClick={() => setIsVendorModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan Vendor Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((ven) => (
              <div key={ven.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{ven.name}</h4>
                    <span className="text-[11px] font-medium text-indigo-700">{ven.category}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{ven.rating}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kontak PIC:</span>
                    <span className="font-semibold text-slate-900">{ven.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telepon:</span>
                    <span className="font-mono">{ven.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono text-indigo-600">{ven.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NPWP Perusahaan:</span>
                    <span className="font-mono text-[10px]">{ven.npwp}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Vendor Terverifikasi</span>
                  </span>
                  <button className="text-indigo-600 hover:underline font-medium">Buat Quotation</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KONTRAK PROYEK & MILESTONE */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Pengadaan Berbasis Proyek & Jadwal Termin Pembayaran</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pengadaan jasa kontraktor, konsultansi IT, dan renovasi dengan pembayaran bertahap (Milestone-based).
              </p>
            </div>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Daftarkan Kontrak Proyek Baru</span>
            </button>
          </div>

          <div className="space-y-4">
            {projectContracts.map((prj) => (
              <div key={prj.id} className="p-5 bg-white border border-slate-200 rounded-lg space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-700">{prj.contractNumber}</div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{prj.projectName}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-900">
                      {formatRupiah(prj.totalValue)}
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                      {prj.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Progress Penyelesaian Fisik</span>
                    <span className="text-indigo-700">{prj.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${prj.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Milestones list */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Termin Pembayaran Kontrak:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {prj.paymentMilestones.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs ${
                          m.isPaid
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                          {formatRupiah(m.amount)} ({m.percent}%)
                        </div>
                        <div className="mt-1">
                          {m.isPaid ? (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Lunas Dicairkan</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-medium">
                              Menunggu Verifikasi BAST
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TAGIHAN & INVOICE VENDOR (AP) */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Pencatatan Tagihan & Invoice Vendor (Accounts Payable)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Monitoring faktur tagihan supplier, nomor faktur pajak elektronik (e-Faktur), jatuh tempo pembayaran, dan rekonsiliasi PO.
              </p>
            </div>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Tagihan Vendor Baru</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">No. Invoice & Tanggal</th>
                    <th className="p-3">Vendor / Rekanan</th>
                    <th className="p-3">Ref PO & Pajak</th>
                    <th className="p-3">Jatuh Tempo</th>
                    <th className="p-3 text-right">Nilai Tagihan (IDR)</th>
                    <th className="p-3 text-center">Status Pembayaran</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Belum ada data tagihan vendor yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    vendorInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-500">{inv.invoiceDate}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{inv.vendorName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{inv.notes || '-'}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <div className="text-indigo-600 font-semibold">{inv.poNumber}</div>
                          {inv.taxInvoiceNumber && (
                            <div className="text-slate-500 text-[10px]">FP: {inv.taxInvoiceNumber}</div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {inv.dueDate}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(inv.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              inv.status === 'Sudah Bill'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              updateVendorInvoiceStatus(
                                inv.id,
                                inv.status === 'Belum Bill' ? 'Sudah Bill' : 'Belum Bill'
                              )
                            }
                            className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                              inv.status === 'Belum Bill'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {inv.status === 'Belum Bill' ? 'Tandai Terbayar' : 'Batal Bayar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PENGATURAN PROCUREMENT */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white p-6 border border-slate-200 rounded-lg max-w-3xl space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan Alur Procurement & Threshold Anggaran</span>
            </h3>
            <p className="text-xs text-slate-500">
              Kebijakan limit approval direksi, persyaratan minimal penawaran vendor, dan klausul syarat bayar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Threshold PR Wajib Approval Direktur (Rp)
              </label>
              <input
                type="number"
                value={prThreshold}
                onChange={(e) => setPrThreshold(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Pengadaan di atas nominal ini wajib disetujui Direktur Keuangan.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Klausul Pembayaran</label>
              <select
                value={defaultPaymentTerms}
                onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white font-medium"
              >
                <option value="Cash On Delivery (COD)">Cash On Delivery (COD)</option>
                <option value="Net 14 Days">Net 14 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
                <option value="DP 30% + Pelunasan BAST">DP 30% + Pelunasan BAST</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="quoteCheck"
                checked={requireQuotationCompare}
                onChange={(e) => setRequireQuotationCompare(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="quoteCheck" className="text-slate-700 font-medium cursor-pointer">
                Wajib melampirkan minimal 3 Quotation komparasi untuk belanja di atas Rp 10.000.000
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs"
            >
              Simpan Pengaturan Procurement
            </button>
          </div>
        </div>
      )}

      {/* MODAL: PENGAJUAN PR */}
      {isPRModalOpen && (
        <div
          onClick={() => setIsPRModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Pengajuan Purchase Requisition (PR)</h3>
              <button onClick={() => setIsPRModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmitPR} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jenis Pengadaan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProcurementCategory('Pengadaan Barang')}
                    className={`py-1.5 px-3 rounded border font-semibold ${
                      procurementCategory === 'Pengadaan Barang'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Pengadaan Barang Fisik
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcurementCategory('Proyek / Jasa Kontrak')}
                    className={`py-1.5 px-3 rounded border font-semibold ${
                      procurementCategory === 'Proyek / Jasa Kontrak'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Proyek / Kontrak Jasa
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Item / Pekerjaan</label>
                <input
                  type="text"
                  placeholder="Misal: 5 Unit Laptop Developer atau Renovasi Jaringan"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rekomendasi Vendor</label>
                  <select
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-semibold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimasi Total Biaya (Rp)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departemen Pemohon</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Human Capital">Human Capital</option>
                    <option value="Finance & Tax">Finance & Tax</option>
                    <option value="General Affairs">General Affairs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Karyawan Pemohon (PIC)</label>
                <EmployeeSelect
                  employees={employees}
                  selectedEmployeeId={requestorEmpId}
                  onSelect={(id) => setRequestorEmpId(id)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPRModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Kirim Pengajuan PR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRASI VENDOR */}
      {isVendorModalOpen && (
        <div
          onClick={() => setIsVendorModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Daftarkan Vendor Supplier Rekanan Baru</h3>
              <button onClick={() => setIsVendorModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Perusahaan Vendor</label>
                <input
                  type="text"
                  placeholder="Contoh: PT Sumber Berkah Mandiri"
                  value={newVenName}
                  onChange={(e) => setNewVenName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori Pengadaan</label>
                  <select
                    value={newVenCategory}
                    onChange={(e) => setNewVenCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="Hardware & IT Equipment">Hardware & IT Equipment</option>
                    <option value="Office Stationery & Supplies">Office Stationery & Supplies</option>
                    <option value="Building Contractor & Renovation">Building Contractor & Renovation</option>
                    <option value="IT Consulting & Software">IT Consulting & Software</option>
                    <option value="Facility & Cleaning Services">Facility & Cleaning Services</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor NPWP</label>
                  <input
                    type="text"
                    value={newVenNpwp}
                    onChange={(e) => setNewVenNpwp(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama PIC Vendor</label>
                  <input
                    type="text"
                    value={newVenPic}
                    onChange={(e) => setNewVenPic(e.target.value)}
                    placeholder="Budi Santoso (Account Manager)"
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={newVenPhone}
                    onChange={(e) => setNewVenPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Kantor Operasional</label>
                <textarea
                  rows={2}
                  value={newVenAddress}
                  onChange={(e) => setNewVenAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Simpan Data Rekanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW PO DENGAN QR TTD */}
      {selectedPOForPrint && (
        <div
          onClick={() => setSelectedPOForPrint(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 cursor-default"
          >
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="text-xs font-semibold">Dokumen Purchase Order (PO) Resmi</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button onClick={() => setSelectedPOForPrint(null)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-800 bg-white text-xs">
              {/* Header Surat */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                    {currentTenant.name}
                  </h1>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    NPWP: {currentTenant.npwp} · {currentTenant.city}
                  </p>
                  <div className="text-xs font-semibold text-indigo-700 mt-2 uppercase tracking-wide">
                    SURAT PESANAN PEMBELIAN / PURCHASE ORDER (PO)
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-900">
                    {selectedPOForPrint.poNumber || selectedPOForPrint.prNumber}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Tanggal: {new Date().toISOString().split('T')[0]}
                  </div>
                </div>
              </div>

              {/* Vendor & Delivery Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Ditujukan Kepada Vendor:
                  </span>
                  <div className="font-bold text-slate-900">{selectedPOForPrint.vendorName}</div>
                  <div className="text-slate-600 mt-0.5">Mitra Penyedia Resmi Rekanan NusaHR</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Lokasi Pengiriman & Pemohon:
                  </span>
                  <div className="font-bold text-slate-900">{currentTenant.name}</div>
                  <div className="text-slate-600 mt-0.5">
                    Pemohon: {selectedPOForPrint.requestor} ({selectedPOForPrint.department})
                  </div>
                </div>
              </div>

              {/* Item Table */}
              <table className="w-full text-left border border-slate-200 rounded">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Deskripsi Barang / Jasa</th>
                    <th className="py-2 px-3 text-center">Jumlah</th>
                    <th className="py-2 px-3 text-right">Harga Satuan</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">
                      {selectedPOForPrint.itemName}
                    </td>
                    <td className="py-2 px-3 text-center">{selectedPOForPrint.quantity}</td>
                    <td className="py-2 px-3 text-right">
                      {formatRupiah(Math.round(selectedPOForPrint.estimatedCost / selectedPOForPrint.quantity))}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatRupiah(selectedPOForPrint.estimatedCost)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tanda Tangan QR */}
              <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 max-w-xs">
                  PO ini sah secara hukum dengan verifikasi tanda tangan digital QR Code dan telah disetujui anggaran divisinya.
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-slate-700">Purchasing & Finance Dept</div>
                    <div className="text-[10px] text-slate-500">Authorized Signatory</div>
                  </div>
                  <QRCodeView
                    value={`https://nusahr.id/verify/po/${selectedPOForPrint.poNumber || selectedPOForPrint.id}?tenant=${currentTenant.id}`}
                    size={52}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAFTARKAN KONTRAK PROYEK BARU */}
      {isProjectModalOpen && (
        <div
          onClick={() => setIsProjectModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Daftarkan Kontrak Proyek Baru & Jadwal Termin</h3>
              <button onClick={() => setIsProjectModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor Perjanjian / Kontrak</label>
                <input
                  type="text"
                  required
                  value={projectForm.contractNumber}
                  onChange={(e) => setProjectForm({ ...projectForm, contractNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Paket Pekerjaan / Proyek</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Firewall Data Center & Migrasi SD-WAN..."
                  value={projectForm.projectName}
                  onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vendor / Kontraktor Rekanan</label>
                  <select
                    value={projectForm.vendorId}
                    onChange={(e) => setProjectForm({ ...projectForm, vendorId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Nilai Kontrak (Rp)</label>
                  <input
                    type="number"
                    min="1000000"
                    step="1000000"
                    required
                    value={projectForm.totalValue}
                    onChange={(e) => setProjectForm({ ...projectForm, totalValue: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-semibold"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                    {formatRupiah(projectForm.totalValue)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Mulai Proyek</label>
                  <input
                    type="date"
                    required
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Selesai (BAST)</label>
                  <input
                    type="date"
                    required
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* Milestones distribution */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Pembagian Persentase Termin Pembayaran (%)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">DP Awal (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={projectForm.dpPercent}
                      onChange={(e) => setProjectForm({ ...projectForm, dpPercent: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">Termin 1 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={projectForm.term1Percent}
                      onChange={(e) => setProjectForm({ ...projectForm, term1Percent: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">Pelunasan (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={projectForm.term2Percent}
                      onChange={(e) => setProjectForm({ ...projectForm, term2Percent: Number(e.target.value) })}
                      className="w-full p-1.5 border border-slate-300 rounded text-center font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Simpan Kontrak Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PENCATATAN TAGIHAN / INVOICE VENDOR */}
      {isInvoiceModalOpen && (
        <div
          onClick={() => setIsInvoiceModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden cursor-default"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-semibold">Pencatatan Tagihan & Invoice Vendor Baru</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vendor / Rekanan Pengirim</label>
                  <select
                    value={invoiceForm.vendorId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, vendorId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Referensi Nomor PO</label>
                  <select
                    value={invoiceForm.poNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, poNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  >
                    {procurementOrders.map((po) => (
                      <option key={po.id} value={po.poNumber || po.prNumber}>
                        {po.poNumber || po.prNumber} - {po.itemName.slice(0, 25)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Invoice Supplier</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: INV/2026/0991-MSK"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Faktur Pajak (e-Faktur)</label>
                  <input
                    type="text"
                    placeholder="010.000-26.88392100"
                    value={invoiceForm.taxInvoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxInvoiceNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Faktur</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Tagihan (IDR)</label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Tagihan / Keterangan Pembayaran</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Keterangan pengiriman, rekening penerima bank transfer..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
                >
                  Simpan Invoice Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
