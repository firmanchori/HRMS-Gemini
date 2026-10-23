# Rancangan Arsitektur SaaS HRMS Enterprise (NusaHR Enterprise)

Solusi Human Resource Management System (HRMS) multi-tenant kelas enterprise berbasis SaaS dengan kepatuhan penuh regulasi ketenagakerjaan Indonesia (PPh 21 TER 2024, BPJS Kesehatan & Ketenagakerjaan, PP 35/2021), dilengkapi wizard migrasi data interaktif, manajemen aset GA berbasis QR Code, pelacakan KPI real-time, dan tata kelola dokumen berpenomoran otomatis dengan verifikasi tanda tangan digital QR.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Utama yang Telah Diselaraskan**:
> 1. **Setup Awal & Migrasi**: Menggunakan Wizard Onboarding & Migrasi Interaktif multi-tahap dilengkapi validator data instan, mapping kolom otomatis, dan generator template Excel/CSV (Karyawan, Saldo Cuti Awal, Master Inventaris Aset GA, dan Struktur Organisasi).
> 2. **Arah Desain & Estetika Visual**: Clean Enterprise Modern dengan palet indigo (`#4F46E5`), slate (`#0F172A`), high-density tabular view, tipografi Plus Jakarta Sans, dan zero-pill metadata discipline yang profesional dan mudah dinavigasi.
> 3. **Perhitungan Payroll & Pajak**: Standar penuh regulasi perpajakan & ketenagakerjaan Indonesia: PPh 21 tarif efektif rata-rata (TER Bulanan Kategori A, B, C & TER Harian), BPJS TK (JKK, JKM, JHT, JP), BPJS Kesehatan (4% Perusahaan, 1% Karyawan), perhitungan lembur Kepmenakertrans, THR keagamaan, serta kompensasi/pesangon PHK PP 35/2021.

---

## 1. Overview & Core Concept

### Ringkasan Platform
**NusaHR Enterprise** adalah platform SaaS HRMS komprehensif yang memadukan manajemen personalia harian dengan manajemen General Affairs (GA), pengadaan internal (Procurement), kepatuhan hukum tenaga kerja, serta sistem multi-tenant yang terisolasi aman.

### Target Pengguna & Persona
1. **Super Admin / Tenant Owner**: Mengelola lisensi tenant, konfigurasi perusahaan, audit trail, dan penetapan role RBAC.
2. **HR Director & HR Operations**: Menjalankan rekrutmen end-to-end, onboarding/offboarding, personalia (promosi/demosi/mutasi), surat peringatan (SP), serta evaluasi kinerja real-time.
3. **Payroll & Finance Specialist**: Memproses kalkulasi payroll masal, PPh 21 TER, iuran BPJS, reimburse/klaim medis, pinjaman karyawan, slip gaji digital, dan laporan transfer bank.
4. **General Affairs & Procurement Officer**: Melakukan pencatatan aset inventaris, cetak & scan label QR aset, stock opname berkala, pemeliharaan fasilitas gedung, dan Purchase Requisition (PR) ke Purchase Order (PO).
5. **Karyawan (Employee Self-Service / ESS)**: Presensi GPS/Webcam, pengajuan cuti/izin/lembur, pelaporan klaim, monitoring KPI mandiri, dan pengunduhan slip gaji & dokumen legal.

### Nilai Utama (Key Value)
- **Zero-Friction Migration**: Mengurangi waktu implementasi awal HRMS dari hitungan minggu menjadi hitungan menit melalui wizard migrasi yang mendeteksi anomali data (NIK ganda, format tanggal, mapping jabatan).
- **Audit-Proof Compliance**: Seluruh proses personalia (kontrak PKWT/PKWTT/Outsource, SP 1-3, PHK, dokumen resmi bertanda tangan QR) tercatat dalam ledger audit yang tidak dapat dimanipulasi.
- **Unified Operations**: Menghilangkan silo antara HR, Payroll, Keuangan, dan GA dalam satu single-pane dashboard.

---

## 2. User Experience & Visual Design

### A. Alur Pengalaman Pengguna (Key User Flows)

1. **Flow 1: Initial Setup & Data Migration Wizard**
   - Step 1: Profil Perusahaan Tenant (Logo, NPWP, UMR Wilayah, Jam Kerja/Shift, Struktur Departemen).
   - Step 2: Download & Upload Spreadsheet Master Data (Karyawan, Saldo Cuti, Master Aset GA).
   - Step 3: Validasi Real-time & Error Resolution (Preview tabular dengan penanda baris data yang belum lengkap).
   - Step 4: Konfirmasi & Provisioning Tenant (Sistem langsung siap digunakan dengan baseline operasional).

2. **Flow 2: Employee Lifecycle (Rekrutmen -> Karir -> Offboarding)**
   - Manpower Planning (Job Requisition) -> Posting Lowongan -> Kanban Pipeline Kandidat -> Jadwal & Lembar Penilaian Interview -> Offering Letter Otomatis -> Konversi Kandidat ke Karyawan Baru (Onboarding Checklist).
   - Perjalanan Karir: Form Personalia Promosi, Demosi, Mutasi (otomatis memperbarui riwayat jabatan & grading gaji).
   - Offboarding: Exit Interview, Berita Acara Pengembalian Aset GA (via scan QR), Perhitungan Pesangon/Kompensasi PHK, Surat Pengalaman Kerja (Parklaring).

3. **Flow 3: Operasional Harian & Absensi**
   - Dashboard Presensi Live: Rekap realtime kehadiran, terlambat, izin sakit, cuti tahunan, dan pengajuan lembur yang menunggu persetujuan (multi-level approval).

4. **Flow 4: Payroll Run & Tax TER Calculation**
   - Import rekap absensi & lembur otomatis -> Kalkulasi komponen gaji pokok, tunjangan tetap/tidak tetap, pinjaman/kasbon, klaim/reimburse -> Perhitungan otomatis BPJS & PPh 21 TER -> Approval Direksi -> Rilis Slip Gaji Terenkripsi & File Transfer Bank.

5. **Flow 5: GA Asset Management & Stock Opname via QR**
   - Registrasi Aset (Gedung, Lantai, Kategori, Nilai Buku, Depresiasi) -> Cetak Label QR -> Pemindaian Mobile/Webcam untuk verifikasi lokasi, kondisi fisik, dan riwayat peminjam saat stock opname.

### B. Identitas Visual & Tema Antarmuka

- **Aesthetic Direction**: Clean Enterprise Modern. Mengedepankan struktur modular yang rapi, kontras yang tajam namun nyaman di mata, serta pemisahan data tabular yang presisi tanpa elemen dekoratif berlebihan.
- **Palet Warna (Tailwind CSS Tokens)**:
  - Canvas Dominan (60%): Slate 50 (`#F8FAFC`) dengan background panel putih bersih (`#FFFFFF`) dan hairline border halus (`#E2E8F0`).
  - Struktur Permukaan (30%): Slate 900 (`#0F172A`) untuk sidebar navigasi dan tipografi primer; Slate 600 (`#475569`) untuk teks pendukung dan metadata.
  - Aksen Fokus (10%): Indigo 600 (`#4F46E5`) untuk primary actions, active state indikator, dan konfirmasi alur kerja.
  - Status Semantik: Emerald 600 (`#16A34A`) untuk status aktif/hadir/disetujui, Amber 600 (`#D97706`) untuk review/cuti/warning, Crimson 600 (`#DC2626`) untuk SP/terlambat/PHK/reject.
- **Tipografi**:
  - Display & Headings: `Plus Jakarta Sans` dengan geometric balance untuk kejelasan navigasi.
  - Data Numerik & Moneter: `tabular-nums` dan `font-mono` untuk slip gaji, tabel pajak TER, kode aset QR, dan nomor dokumen surat.
- **Prinsip Anti-Slop & Zero-Pill**:
  - Metadata status disajikan menggunakan tipografi bersih dengan pemisah titik tengah (`·`) atau tag status flat yang fungsional, tanpa rounded candy capsule yang mencolok.
  - Tombol kontrol menggunakan label tindakan lugas ("Simpan Draft", "Jalankan Payroll", "Generate QR Aset", "Export CSV").

---

## 3. Key Product Decisions & Trade-Offs

### Keputusan 1: Simulasi Komprehensif & Penyimpanan Terstruktur
- **Pilihan**: State management reaktif client-side yang terstruktur penuh dengan persistensi `localStorage` per tenant, dilengkapi schema model TypeScript yang siap dipetakan ke REST/Firestore/PostgreSQL di backend.
- **Rasional**: Memungkinkan demonstrasi interaktif langsung tanpa hambatan koneksi, mendukung pergantian tenant instan, dan menjamin flow migrasi data bekerja secepat kilat dengan mock data realistis (perusahaan manufaktur/retail Indonesia).

### Keputusan 2: PPh 21 TER Sesuai PMK 168/2023 & PP 58/2023
- **Pilihan**: Mengimplementasikan tabel TER resmi Kategori A (TK/0, TK/1, K/0), Kategori B (TK/2, TK/3, K/1, K/2), dan Kategori C (K/3) dengan rentang bracket penghasilan bruto bulanan yang akurat.
- **Rasional**: Memastikan pengguna HR dan Finance mendapatkan perhitungan akurat sesuai regulasi Indonesia yang berlaku sejak 1 Januari 2024.

### Keputusan 3: Penomoran Dokumen & Tanda Tangan QR Dinamis
- **Pilihan**: Generator nomor surat otomatis dengan pola kustom (contoh: `042/HRD-PKWT/NUSA/{MONTH}/{YEAR}`) dan QR Code verification payload yang memvalidasi keaslian dokumen, penandatangan, tanggal verifikasi, dan hash integritas.
- **Rasional**: Memenuhi kebutuhan legalitas tanpa memerlukan layanan e-meterai pihak ketiga yang berbayar saat fase implementasi awal.

---

## 4. Technical Architecture & Data Strategy

### Diagram Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NusaHR SaaS Portal View                         │
│  ┌───────────────────────────┐  ┌────────────────────────────────────┐ │
│  │   Tenant & Workspace      │  │   Top Bar: Breadcrumbs, Tenant     │ │
│  │   Switcher (Multi-Tenant) │  │   Switcher, Quick Search, User     │ │
│  └─────────────┬─────────────┘  └─────────────────┬──────────────────┘ │
│                │                                  │                    │
│  ┌─────────────▼──────────────────────────────────▼──────────────────┐ │
│  │ 1. Setup & Data Migration Wizard (Excel/CSV Parser & Importer)    │ │
│  │ 2. Core HR & Personalia (Karyawan, Kontrak, Promosi/Demosi)       │ │
│  │ 3. Attendance & Time Tracking (Shift, Izin, Cuti, Lembur)         │ │
│  │ 4. Payroll, Tax & Deductions (PPh 21 TER, BPJS, THR, Pesangon)    │ │
│  │ 5. Pinjaman Karyawan & Kasbon Ledger (Tenor, Cicilan, Saldo)      │ │
│  │ 6. Real-time KPI & Performance Review (Bobot Target, OKR, Nilai)  │ │
│  │ 7. Compliance & Disciplinary (SP 1, 2, 3, Skorsing, PHK)         │ │
│  │ 8. Recruitment & Applicant Tracking (Kanban, Interview, Offering) │ │
│  │ 9. Offboarding & Clearance Checklist (Aset, Dokumen, Pesangon)    │ │
│  │ 10. GA, Building & Asset Manager (QR Code Generator & Scanner)   │ │
│  │ 11. Procurement & PO Management (PR, Approval, PO, Supplier)      │ │
│  │ 12. Document & Template Hub (Auto-Numbering, Generator & QR TTD)  │ │
│  │ 13. Tenant Management & RBAC Matrix (Super Admin, HR, GA, Staff)  │ │
│  └─────────────────────────────────┬─────────────────────────────────┘ │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                      Central Domain State Store                        │
│  - TenantStore (Tenant info, Subscription, Configuration, Work Hours)  │
│  - EmployeeStore (Master Karyawan, Riwayat Jabatan, Personalia Logs)   │
│  - AttendanceStore (Clock-in/out, Requests, Cuti, Saldo Cuti)          │
│  - PayrollStore (Salary Components, TER Brackets, BPJS, Payslips)      │
│  - AssetStore (QR Codes, Master Aset, Maintenance, Stock Opname)       │
│  - RecruitmentStore (Job Vacancies, Candidates, Interview Scores)      │
│  - DocumentStore (Templates, Generated Letters, QR Signatures)         │
│  - ProcurementStore (Vendors, Purchase Requests, Purchase Orders)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Entitas Data Utama (Data Models)

1. **Tenant & Setting**: `id`, `companyName`, `npwp`, `industry`, `workScheme` (5/6 hari), `umrAmount`, `planTier`.
2. **Employee (Karyawan)**: `id`, `nik`, `nama`, `email`, `status` (Tetap/Kontrak/Outsource), `department`, `position`, `grade`, `joinDate`, `endDate`, `ptkpStatus` (TK/0..K/3), `bpjsKesehatanNo`, `bpjsTkNo`, `bankAccount`, `basicSalary`, `allowances`.
3. **Personalia Action**: `id`, `employeeId`, `type` (Promosi / Demosi / Mutasi), `effectiveDate`, `previousPosition`, `newPosition`, `previousSalary`, `newSalary`, `skNumber`, `approvedBy`.
4. **Attendance & Leave**: `id`, `employeeId`, `date`, `clockIn`, `clockOut`, `status` (Hadir / Terlambat / Izin / Sakit / Cuti / Alpa), `overtimeHours`, `leaveTypeId`, `notes`.
5. **Payroll Record**: `id`, `period`, `employeeId`, `basicSalary`, `allowances`, `overtimePay`, `reimbursement`, `bpjsTkCompany`, `bpjsTkEmployee`, `bpjsKesCompany`, `bpjsKesEmployee`, `grossPay`, `pph21TERCategory`, `pph21Rate`, `pph21Amount`, `loanDeduction`, `otherDeductions`, `netPay`, `status` (Draft / Approved / Disbursed).
6. **Employee Loan (Pinjaman)**: `id`, `employeeId`, `loanType`, `totalAmount`, `monthlyInstallment`, `remainingAmount`, `tenorMonths`, `paidMonths`, `status`.
7. **Performance KPI**: `id`, `employeeId`, `period`, `goals` (Array of { metric, weight, target, actual, score }), `finalScore`, `feedback`, `reviewerId`.
8. **Compliance (Surat Peringatan & PHK)**: `id`, `employeeId`, `level` (SP1 / SP2 / SP3 / PHK), `violation`, `issueDate`, `expiryDate`, `documentNumber`, `consequence`.
9. **Recruitment**: `id`, `title`, `dept`, `status`, `applicants` (Array of candidate status: Screening, Interview, Offered, Hired).
10. **GA Asset**: `id`, `assetCode`, `qrCodePayload`, `name`, `category` (Elektronik / Kendaraan / Fasilitas / Furniture), `location`, `buildingRoom`, `condition` (Baik / Rusak / Servis), `assignedToEmployeeId`, `purchaseDate`, `purchasePrice`.
11. **Procurement**: `id`, `prNumber`, `poNumber`, `vendorName`, `items`, `totalAmount`, `approvalStage`, `deliveryStatus`.
12. **Document Template**: `id`, `title`, `type` (PKWT, PKWTT, SP, Promosi, Parklaring, BAST Aset), `patternNumber`, `bodyTemplate`, `qrSignatureEnabled`.

---

## 5. Rencana Eksekusi Bertahap

- **Tahap 1**: Inisialisasi struktur aplikasi, modul multi-tenant, dan sistem navigasi enterprise yang responsif.
- **Tahap 2**: Modul Wizard Setup Awal & Migrasi Data (Upload file Excel/CSV, validator baris data, dan auto-provisioning).
- **Tahap 3**: Modul Core Personalia & Karyawan (Data karyawan, filter status kontrak, dan riwayat promosi/demosi).
- **Tahap 4**: Modul Absensi, Manajemen Cuti, dan Approval Lembur.
- **Tahap 5**: Modul Engine Payroll Lengkap (PPh 21 TER 2024, BPJS Kesehatan & TK, THR, pesangon PHK, dan slip gaji interaktif).
- **Tahap 6**: Modul Pinjaman Karyawan & KPI Kinerja Real-time.
- **Tahap 7**: Modul Kepatuhan (SP 1-3) & Siklus Rekrutmen hingga Onboarding / Offboarding.
- **Tahap 8**: Modul GA & Aset (Generator label QR, scanner QR, lokasi gedung, dan stock opname) + Pengadaan (PR/PO).
- **Tahap 9**: Modul Dokumen Digital (Penomoran otomatis & verifikasi TTD QR) serta manajemen User & Hak Akses (RBAC).
- **Tahap 10**: Polishing antarmuka, verifikasi data terintegrasi, dan pengujian build tanpa error.
