# Product Requirements Document (PRD)
## NusaHR Enterprise - Multi-Tenant Human Resource Management System (HRMS)

**Versi Dokumen:** 2.5.0 (Addendum Business-Flow Audit)
**Status:** UI Approved & ~95% Implemented — Business Flow & Backend Belum Final
**Tanggal:** 24 Oktober 2026 (revisi 31 Oktober 2026 — lihat §3.6-3.8 dan `docs/AUDIT_FINDINGS.md`)
**Target Platform:** Web (Desktop, Tablet, Mobile Responsive PWA)  

---

### 1. Executive Summary & Visi Produk
**NusaHR Enterprise** adalah platform Human Resource Management System (HRMS) multi-tenant kelas enterprise yang dirancang khusus untuk mematuhi regulasi ketenagakerjaan, perpajakan, dan jaminan sosial Republik Indonesia (UU Cipta Kerja, PP 35/2021, PMK 168/2023 TER 2024, UU ITE No. 11/2008, dan standar BPJS Ketenagakerjaan & Kesehatan).

Platform ini mengakomodasi struktur korporasi multi-tier (Holding Company, Sub-holding / Anak Perusahaan, dan Cabang / Cucu Usaha) dalam arsitektur multi-tenant terisolasi.

---

### 1.1. Model Bisnis SaaS & Hierarki Entitas

> Ditambahkan 31 Oktober 2026 berdasarkan penjelasan pemilik produk — ini adalah
> model bisnis fondasi yang HARUS tercermin di desain Approval Engine, isolasi data,
> dan RBAC (lihat `docs/ERD.md` §5 dan `docs/SYSTEM_DESIGN.md` §Multi-Tenancy).

1. **Apps Owner (SaaS Owner)** adalah pemilik platform NusaHR — menjual paket
   berlangganan ke perusahaan pelanggan (tenant), bukan salah satu tenant itu
   sendiri.
2. **Dua tipe pendaftaran tenant:** *Single Entitas* dan *Multi Entitas (Group)*.
3. **Hierarki entitas tidak dibatasi 3 level.** Entitas Single bisa menambah anak
   perusahaan, cucu, bahkan cicit perusahaan — kedalaman pohon entitas tidak terbatas
   (bukan hanya Holding → Anak → Cucu seperti asumsi ERD versi lama).
4. **Domain/email boleh sama antar level entitas.** Entitas anak boleh memakai
   domain email yang sama dengan entitas induknya — `email`/`domain` TIDAK boleh
   diasumsikan unik secara global antar entitas.
5. **Visibilitas data bersifat hierarkis dan asimetris:**
   - Entitas induk (di level manapun) bisa **melihat seluruh data** entitas-entitas
     di bawahnya (anak, cucu, cicit, dst) — read access berjenjang ke bawah.
   - Entitas anak **hanya bisa melihat entitas di bawahnya sendiri (cucu-nya)**,
     TIDAK bisa melihat/mengurus entitas setara (sibling — anak lain dari induk yang
     sama).
   - Jadi visibilitas bukan sekadar "per tenant", tapi "per cabang pohon entitas".
6. **Pengaturan (cuti, aset, dll) default dikelola masing-masing entitas** — fleksibel
   per entitas. Namun entitas induk bisa **mengambil alih** pengaturan anaknya, baik
   sejak awal dibuat (saat entitas anak pertama kali dibuat oleh induknya) maupun
   di kemudian hari. Ini berarti setiap domain pengaturan butuh konsep "siapa yang
   berhak mengedit" (`owner_entity_id`) yang bisa berbeda dari entitas pemilik data.
7. **Entitas induk yang membuat entitas anak (+ akun admin-nya).** Selebihnya (data
   & pengaturan operasional) ada di tangan entitas anak tersebut, kecuali diambil
   alih sesuai poin 6.
8. **Paket Berlangganan (dikelola Apps Owner):** setiap paket mengatur — mode
   single/multi entitas, jumlah maksimum karyawan, modul apa saja yang aktif, dan
   batas waktu langganan. Wajib ada minimal satu paket yang mengaktifkan SEMUA modul.
9. **Pengecualian ESS — Direktori Karyawan Lintas Entitas:** menu pencarian karyawan
   di ESS sengaja melanggar aturan visibilitas poin 5 — karyawan bisa mencari &
   melihat data dasar (foto, NIK, jabatan) milik karyawan DI SEMUA entitas dalam satu
   tenant, bukan hanya entitas sendiri. Ini direktori ringan, bukan akses penuh.
10. **Batas Visibilitas App Owner (PENTING, koreksi 31 Okt 2026):** hierarki entitas
    (poin 2-3, 6-7) adalah **urusan internal tenant sepenuhnya**, dikelola lewat menu
    Organisasi masing-masing tenant (`OrganizationManagement`) — BUKAN urusan App
    Owner. App Owner **tidak boleh melihat struktur entitas** tenant mana pun. Yang
    boleh dilihat App Owner hanyalah **data agregat per tenant**: jumlah entitas dan
    jumlah user (untuk keperluan penegakan limit paket & billing) — tanpa nama
    entitas, tanpa struktur pohon, tanpa siapa-lapor-ke-siapa.

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

### 3.6. Pengaturan Approval Berjenjang (Approval Engine) — Target Desain

> Status saat ini (lihat `docs/AUDIT_FINDINGS.md` §1): level approval dan approver
> masih hardcode di kode, tidak ada layar pengaturan, antrian approval tidak
> ter-scope per approver, dan delegasi/SLA belum berfungsi nyata. Bagian ini
> mendefinisikan bagaimana seharusnya alur ini bekerja sebelum backend dibangun.

1. **Pengaturan Flow per Kategori (sebelum dipakai):** Admin mengatur, per kategori
   request (Cuti, SPPD, Pinjaman, Lembur, Reimbursement, Personalia, Dokumen Resmi,
   Procurement PR, dll): jumlah level approval, dan approver tiap level — dipilih
   sebagai *Role* (misal "Manager Langsung"), *Node Org Chart spesifik* (misal
   "VP Finance"), atau *User tertentu*. SLA jam per level juga diatur di sini, bukan
   di layar global terpisah.
2. **Resolusi Approver dari Hierarki Nyata:** Saat request dibuat, approver level-1
   dihitung dari `reportsToId` karyawan pemohon di Org Chart — bukan string role yang
   ditempel manual. Antrian approval (Approval Center & MSS Portal) hanya menampilkan
   item yang approver-nya cocok dengan user yang login (atau delegasinya).
3. **Approver Tidak Hadir / Delegasi:** Jika approver sedang cuti/tidak aktif pada
   tanggal request, sistem otomatis menawarkan/meneruskan ke *substitute approver*
   yang telah diatur sebelumnya (periode mulai-selesai). Delegasi harus benar-benar
   mengubah siapa yang melihat/boleh memutuskan tiket, bukan sekadar catatan.
4. **SLA & Eskalasi:** Jika tiket melewati `due_at` tanpa keputusan, sistem mengirim
   reminder, lalu (jika diaktifkan) eskalasi otomatis ke level berikutnya/approver
   pengganti. Tidak ada jalur di modul manapun yang boleh "melompati" level approval
   yang telah ditentukan (lihat temuan bypass kontrol di AUDIT_FINDINGS.md §1).
5. **Role "Mengetahui" (CC):** Pihak yang hanya perlu mengetahui (bukan memutuskan)
   dicatat terpisah dari approver pemutus, dengan status "sudah dilihat/belum".

### 3.7. Pengaturan Tanda Tangan Dokumen (TTD) & QR Verifikasi — Target Desain

> Status saat ini (lihat `docs/AUDIT_FINDINGS.md` §2): QR dan status "Resmi
> Diterbitkan" muncul otomatis saat dokumen dibuat, tanpa menunggu siapa pun
> konfirmasi — ini harus diperbaiki sebelum backend terhubung.

1. **Multi-Signer Wajib:** Setiap jenis dokumen resmi (SK, PKWT, SP, BAST, dll)
   mendefinisikan daftar pihak wajib: Pembuat (maker), satu atau lebih
   Approver/Penyetuju, dan nol atau lebih pihak "Mengetahui" — masing-masing adalah
   baris tersendiri dengan status individual (`Pending`/`Dilihat`/`Dikonfirmasi`/
   `Ditolak`) dan timestamp.
2. **Gerbang Penerbitan QR:** Nomor surat final dan QR verifikasi **hanya muncul
   setelah seluruh pihak wajib (pembuat + semua approver + semua "mengetahui")
   berstatus `Dikonfirmasi`**. Sebelum itu, dokumen berstatus `Draft`/`Menunggu TTD`
   dan tidak menampilkan QR sama sekali.
3. **Terhubung ke Approval Engine:** Penerbitan dokumen resmi yang memerlukan
   persetujuan berjenjang (misal SK Promosi) menggunakan Approval Engine yang sama
   (§3.6) — bukan mekanisme terpisah yang kini berjalan sendiri di modul Dokumen.
4. **Audit & Keaslian:** Setiap peristiwa (dibuat, dilihat, dikonfirmasi, ditolak, QR
   diterbitkan) tercatat di jejak audit dengan aktor & waktu. Hash yang disematkan ke
   QR adalah hash kriptografis nyata atas isi dokumen final (bukan nilai acak), agar
   klaim kepatuhan UU ITE dapat dibuktikan.

### 3.8. Siklus Hidup Aset GA — Target Desain

> Status saat ini (lihat `docs/AUDIT_FINDINGS.md` §3): field tanggal pembelian/
> garansi tidak bisa diisi, status ketersediaan aset tidak pernah benar-benar
> diperbarui, dan Procurement tidak terhubung ke pembuatan Asset. Contoh ini berasal
> langsung dari masukan pemilik produk.

1. **Data Lengkap per Aset:** Setiap aset menyimpan tanggal pembelian/kedatangan
   aktual (bisa diinput, bukan hardcode "hari ini"), tanggal akhir garansi, kondisi,
   lokasi (referensi ke `OfficeLocation`, bukan teks bebas), dan `status` tunggal
   (`Available`/`Assigned`/`InRepair`/`Retired`) yang menjadi satu-satunya sumber
   kebenaran ketersediaan.
2. **Serah Terima Dua Arah:** Setiap serah terima (handover) tercatat di riwayat
   dengan `from`/`to` karyawan (atau GA pool), tanggal, kondisi saat serah-terima, dan
   dokumen BAST terkait. Dari sisi karyawan, daftar "aset yang sedang saya pegang"
   bisa dilihat langsung — bukan cuma dari sisi aset.
3. **Pengembalian & Swap Atomik:** Mengembalikan aset ke GA mengubah statusnya jadi
   `Available` lagi (saat ini tidak bisa terjadi sama sekali). Swap dua pihak
   divalidasi agar tidak ada transfer sepihak yang timpang.
4. **Procurement → Asset Otomatis:** Saat status Purchase Order menjadi "Barang
   Diterima", record aset dibuat otomatis dengan vendor, harga, dan garansi terbawa
   dari PO — bukan diketik ulang manual.
5. **Offboarding Granular:** Checklist offboarding melacak pengembalian per aset
   spesifik (bukan satu boolean umum), dan status aset ikut berubah otomatis saat
   dicentang.

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
