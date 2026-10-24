# Product Requirements Document (PRD)
## NusaHR Enterprise - Multi-Tenant Human Resource Management System (HRMS)

**Versi Dokumen:** 2.4.0  
**Status:** Approved & Implemented  
**Tanggal:** 24 Oktober 2026  
**Target Platform:** Web (Desktop, Tablet, Mobile Responsive PWA)  

---

### 1. Executive Summary & Visi Produk
**NusaHR Enterprise** adalah platform Human Resource Management System (HRMS) multi-tenant kelas enterprise yang dirancang khusus untuk mematuhi regulasi ketenagakerjaan, perpajakan, dan jaminan sosial Republik Indonesia (UU Cipta Kerja, PP 35/2021, PMK 168/2023 TER 2024, UU ITE No. 11/2008, dan standar BPJS Ketenagakerjaan & Kesehatan).

Platform ini mengakomodasi struktur korporasi multi-tier (Holding Company, Sub-holding / Anak Perusahaan, dan Cabang / Cucu Usaha) dalam arsitektur multi-tenant terisolasi.

---

### 2. User Personas & Role-Based Access Control (RBAC)

| Peran (Role) | Tanggung Jawab Utama | Hak Akses Utama |
|---|---|---|
| **Super Admin / SaaS Owner** | Pemeliharaan platform, provisioning tenant baru, audit keamanan global. | Konfigurasi tenant, migrasi database, RBAC platform. |
| **HR Director / HR Admin** | Pengelolaan talenta, rekrutmen, onboarding, dokumen SK resmi, kepatuhan SP/PHK. | Master karyawan, mutasi/promosi, lowongan, approval berjenjang, template SK. |
| **Payroll Lead / Admin Gaji** | Penggajian bulanan, perhitungan PPh 21 TER 2024, BPJS, kasbon, slip gaji. | Modul payroll, komponen gaji, cut-off kehadiran, ekspor file bank. |
| **General Affairs & Procurement**| Manajemen inventaris aset QR, pengadaan barang (PO/PR), vendor, perbaikan. | Modul GA, barcode scanner, purchase orders, SPPD travel. |
| **Line Manager (Atasan)** | Evaluasi bawahan, approval cuti/lembur/SPPD/kasbon tim, probation review. | Pusat approval bertingkat, KPI scoring, review kontrak bawahan. |
| **Employee (ESS)** | Presensi mandiri, pengajuan cuti, unduh slip gaji, cek saldo kasbon. | Self-service portal, profil pribadi, riwayat dokumen digital. |

---

### 3. Modul & Spesifikasi Fitur Utama

#### 3.1. Rekrutmen, Lowongan Kerja & Transisi Onboarding
1. **Manajemen Lowongan Kerja (Job Vacancies):**
   - Pembuatan dan monitoring lowongan kerja berdasarkan departemen, tipe kontrak (Tetap, PKWT, Magang), jumlah kuota buka, rentang gaji, dan kualifikasi.
   - Status lowongan: *Aktif (Open)*, *Ditutup (Closed)*, *Draft*.
   - Filter lowongan berdasarkan departemen dan status.
   - Analitik kuantitas pelamar per lowongan kerja.
2. **Pipeline Pelamar (Kanban Board):**
   - Tahapan alur rekrutmen: `Applied` ➔ `Screening CV` ➔ `Interview & Tes` ➔ `Offering Letter` ➔ `Hired (Onboarding)`.
   - Scoring wawancara multi-kriteria dengan catatan pewawancara.
3. **Kalkulator Offering Letter & Benefit Checkable:**
   - Mode kalkulasi gaji penawaran: **Gross** vs **Nett THP** (PPh 21 TER dan BPJS ditanggung perusahaan/karyawan).
   - Penyesuaian komponen gaji (Gaji Pokok, Tunjangan Tetap, Tunjangan Jabatan, Transport, Makan, Komunikasi, Bonus).
   - Generasi draft Surat Penawaran Kerja resmi dengan QR verifikasi dan ekspor PDF.
4. **Dua Alur Onboarding (Dual-Pathway Onboarding):**
   - **Alur 1 (Dari Rekrutmen):** Kandidat yang menerima offering letter langsung ditransisikan ke *Onboarding Tracker* dengan data jabatan, departemen, dan gaji otomatis tersinkronisasi.
   - **Alur 2 (Onboarding Langsung / Direct Hire):** Penambahan karyawan baru langsung (misal: jajaran eksekutif, rekrutmen darurat) tanpa melewati proses pelamaran lowongan publik, tetap melalui tahapan checklist onboarding (kelengkapan berkas KTP/NPWP/BPJS, serah terima aset IT, induksi budaya kerja).

#### 3.2. Master Karyawan & Personalia (Promosi, Demosi, Mutasi)
1. **Master Karyawan (Dossier Terpadu):**
   - NIK Perusahaan, NIK KTP (16 digit), No KK, NPWP 16 digit, PTKP (TK/0 s.d K/3).
   - Status Kontrak (PKWTT Tetap, PKWT Kontrak, Magang, Outsourcing).
   - Foto profil avatar karyawan (preset atau kustom upload).
2. **Tindakan Personalia Resmi:**
   - **Promosi Jabatan:** Kenaikan eselon/grade, penyesuaian gaji pokok di atas UMR regional, dan tunjangan jabatan.
   - **Demosi Jabatan:** Penyesuaian jabatan turun dengan berita acara dan evaluasi performa.
   - **Mutasi & Rotasi:** Pemindahan antar divisi atau entitas anak perusahaan.
   - **Pengisian Jabatan Baru Mereferensikan Tabel Posisi:** Dropdown posisi/jabatan baru wajib mengambil referensi langsung dari struktur bagan organisasi (*Org Structure Nodes*) dan grade range perusahaan, mencegah inkonsistensi input bebas.
   - Penerbitan otomatis Surat Keputusan (SK) Direksi dengan nomor registrasi unik berformula.

#### 3.3. Presensi, Shift, Cuti Bersama & SPPD
1. **Presensi Multi-Cabang & Lembur:**
   - Geofencing radius GPS kantor dan foto selfie verifikasi.
   - Kalkulasi otomatis lembur Depnaker (1.5x jam pertama, 2x jam berikutnya).
2. **Sistem Kuota Cuti Dua Bucket:**
   - *Bucket 1 (Cuti Bersama Pemerintah):* Dipotong otomatis dari hari libur bersama resmi.
   - *Bucket 2 (Hak Cuti Pribadi):* Sisa kuota cuti tahunan mandiri karyawan.
3. **Perjalanan Dinas (SPPD):**
   - Pengajuan anggaran tiket, hotel, dan uang saku harian dengan approval atasan dan reimburse bukti struk.

#### 3.4. Payroll, PPh 21 TER 2024 & Slip Gaji Terenkripsi
1. **Perhitungan Pajak Penghasilan (PPh 21 PMK 168/2023):**
   - Kategori TER A, TER B, dan TER C berdasarkan status PTKP.
   - Tarif efektif bulanan masa pajak Januari-November dan perhitungan pasal 17 pada masa Desember.
2. **BPJS Ketenagakerjaan & BPJS Kesehatan:**
   - JKK (0.24% - 1.74%), JKM (0.3%), JHT (3.7% perusahaan + 2% karyawan), JP (2% perusahaan + 1% karyawan dengan cap plafon).
   - BPJS Kesehatan 4% perusahaan + 1% karyawan dengan cap plafon batas atas.
3. **Slip Gaji & Integrasi Kasbon:**
   - Otomatis memotong cicilan pinjaman kasbon aktif.
   - Slip gaji ber-watermark QR Code verifikasi UU ITE dan dapat diunduh PDF / dibagikan via WhatsApp.

#### 3.5. Tata Kelola Dokumen Legal & Branding Perusahaan
1. **Editor & Parser Template Dokumen (.docx):**
   - Penggantian variabel dinamis (`{{nama}}`, `{{nik}}`, `{{jabatan}}`, `{{gaji_pokok}}`, `{{nomor_surat}}`).
   - Penomoran surat berformula otomatis (`HRD/{ROMAN}/{YYYY}/{SEQ:4}`).
2. **Pengaturan Logo & Branding Perusahaan:**
   - **Logo Dokumen Resmi (Kop Dokumen):** Konfigurasi gambar logo resolusi tinggi untuk disematkan pada kop surat SK, kontrak, slip gaji, dan preview dokumen resmi.
   - **App Favicon & Identitas Aplikasi:** Pengaturan icon favicon browser `.ico` / `.png` / SVG serta logo header sistem yang langsung merender ke DOM web.
   - Preview interaktif real-time kop surat dan favicon sebelum disimpan.

---

### 4. Non-Functional Requirements (NFR)
1. **Responsivitas & Desain Adaptif:**
   - Layout responsif optimal di desktop (≥ 1280px), tablet (768px - 1024px seperti iPad / Galaxy Tab), dan mobile (< 768px).
   - Sub-menu tabs memiliki bar navigasi mandiri scrollable horizontal, tidak menumpuk di samping judul halaman.
2. **Interaktivitas Modal Dialog:**
   - Seluruh modal wajib dapat ditutup (*dismiss*) saat pengguna mengklik area luar modal (backdrop) atau menekan tombol `Esc`.
3. **Performa:**
   - First Contentful Paint (FCP) < 1.2s.
   - Client-side navigation tanpa reload halaman.
4. **Keamanan:**
   - Enkripsi SHA-256 digital signature pada seluruh dokumen yang dihasilkan.
   - Validasi data input ketat (nomor rekening, NIK 16 digit, NPWP 16 digit, format tanggal YYYY-MM-DD).
