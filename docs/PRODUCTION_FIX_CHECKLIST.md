# Checklist Perbaikan Menuju Produksi — NusaHR

Dibuat 2026-11-14 dari audit kode (lihat `PRODUCTION_READINESS_AUDIT.md` untuk ringkasan). Setiap butir menyebut **file:baris**, **apa yang diubah**, dan **bukti selesai** (cara memverifikasi). Nomor baris berlaku per tanggal ini dan akan bergeser — cari berdasarkan nama simbol bila perlu.
Prioritas: **P0** = blokir go-live, **P1** = harus sebelum go-live, **P2** = segera setelahnya.

---

## A. Jawaban: apakah "data dummy" itu data master/template yang seharusnya di database?

Sebagian **ya, sebagian bukan**. `src/data/initialData.ts` (7.177 baris, 57 ekspor) mencampur tiga jenis data. Hanya ~16 ekspor yang masih hidup di aplikasi; ~35 sisanya cuma di-import tetapi tidak dipakai (kode mati).

### A1. Master/template — SEHARUSNYA di database, di-seed otomatis saat tenant dibuat
| Ekspor | Status sekarang | Keputusan |
|---|---|---|
| `INITIAL_DOCUMENT_TEMPLATES` (1.456 baris) | Sudah ada di server (`server/lib/defaultDocumentTemplates.ts`, 45 template, di-seed saat entitas induk dibuat) → salinan frontend **mati** | Hapus dari frontend |
| `DEFAULT_ONBOARDING_CHECKLIST_TEMPLATES` | Masih dipakai `RecruitmentManagement.tsx:132` sebagai nilai awal | Seed per tenant di server; hapus import |
| `INITIAL_COMPETENCY_TEST_TYPES`, `INITIAL_INTERVIEW_TYPES` | Tabel backend sudah ada; frontend memakainya hanya untuk "Reset ke default" (`HrmsContext.tsx:2383, 2477`) | Pindah sebagai seed server + endpoint "reset ke default" |
| `INITIAL_SHIFTS` | Server punya seed (`server/db/seed/attendanceExamples.ts`) tetapi hanya untuk tenant yang **sudah ada**, tidak untuk tenant baru | Seed saat tenant dibuat |
| `INITIAL_MODULE_SETTINGS` | Server seed hanya modul `employee` (`employeeExamples.ts`); modul lain jatuh ke default frontend (`HrmsContext.tsx:1048`) | Seed semua modul saat tenant dibuat |
| `INITIAL_ROLE_PERMISSIONS` + `DEFAULT_ROLES` | Frontend jadi fallback (`HrmsContext.tsx:838, 1514, 3581`); server tidak mem-seed matriks | Seed role sistem + matriks izin per tenant |
| `INITIAL_SALARY_COMPONENTS` | Tabel backend ada; isi awal generik (tunjangan umum) | Jadikan template opsional "Impor komponen standar" |
| `INITIAL_CALENDAR_EVENTS` | Hari libur nasional per tahun | Seed dari daftar SKB 3 Menteri resmi per tahun (bukan dummy), perbarui tahunan |

### A2. Contoh struktur organisasi — BUKAN master; tenant-spesifik
`INITIAL_ENTITIES`, `INITIAL_DIVISIONS`, `INITIAL_DEPARTMENTS`, `INITIAL_MASTER_JOB_POSITIONS`, `INITIAL_ORG_NODES`, `INITIAL_OFFICE_LOCATIONS`, `INITIAL_GRADE_SALARY_RANGES`.
Struktur dan grade gaji adalah milik tiap perusahaan; **jangan** di-seed otomatis ke tenant produksi. Yang sah: tawarkan **template pilihan** (sudah ada `src/utils/orgStructureTemplates.ts`) yang diimpor admin secara sadar. Hapus salinan frontend.

### A3. Data transaksi/contoh — BUKAN master; HAPUS dari aplikasi
`INITIAL_TENANTS, USERS, EMPLOYEES, PERSONALIA_LOGS, PERSONALIA_REQUESTS, ATTENDANCE, LEAVE_REQUESTS, LOANS, KPIS, COMPLIANCE, JOB_REQUISITIONS, JOB_VACANCIES, CANDIDATES, OFFBOARDING, ASSETS, PROCUREMENT, DOCUMENTS, SCHEDULES, SHIFT_SWAPS, ATTENDANCE_CORRECTIONS, BUSINESS_TRIPS, APPROVALS, VENDORS, ONBOARDING, EMPLOYEE_STAGING, OVERTIME_REQUESTS, REIMBURSEMENT_CLAIMS, ORG_PROPOSALS, PROBATION_EVALUATIONS, CONTRACT_REVIEWS, EMPLOYEE_SALARY_ASSIGNMENTS, GA_ROOM_BOOKINGS, GA_VEHICLE_BOOKINGS, GA_SUPPLIES, GA_SUPPLY_REQUESTS, GA_TICKETS, VENDOR_INVOICES, AUDIT_LOGS, ENPS_SURVEY, PAYROLL_RECORDS, _UNUSED_CLM_HOLDER`.
Ini data demo. Tempatnya **hanya** di seed server untuk tenant demo `contoh` (`server/db/seed/*.ts`, sudah ada), tidak pernah di bundel frontend.

---

## B. Checklist perbaikan

### P0 — Keuangan, identitas, keamanan

**B1. Payroll dihitung di server, bukan browser**
- [x] `src/context/HrmsContext.tsx:1979-2018` (`generatePayroll`): berhenti menghitung `calculatePPh21TER`/BPJS di klien; panggil endpoint baru `POST /api/tenant/payroll-runs` berisi hanya `{ period, employeeIds }`. _(selesai 2026-11-15: `generatePayrollRun` kini memanggil `POST /payroll-runs`)_
- [x] Buat `server/lib/payrollEngine.ts`: pindahkan logika `src/utils/taxCalculator.ts` (PPh21 TER, BPJS, lembur, THR, pesangon) ke server; sumber input = `employees.basicSalary`, `employeeSalaryAssignments`, presensi/lembur/reimbursement/pinjaman dari DB. _(selesai: kalkulasi memakai `src/utils/taxCalculator.ts` yang sama, dijalankan di server)_
- [x] `server/routes/tenant.ts:2716-2760` (`payrollRecordSchema`, `/payroll-records/upsert`, `PUT /payroll-records/:id`): **hapus** `pph21*`, gaji bersih, potongan dari body; server mengabaikan angka klien. Tolak PUT pada record berstatus Final/Dibayar. _(selesai: tidak ada rute yang menerima angka payroll; `/payroll-records/upsert` dan `PUT /payroll-records/:id` dihapus di admin & karyawan)_
- [x] Skema: tambah `payroll_periods(tenantId, period, status Draft|Final|Dibayar, lockedAt, lockedBy)`; semua `payrollRecords` mengacu ke periode; Final = tidak bisa diubah, hanya koreksi lewat periode berikutnya. _(selesai: tabel `payroll_periods`, status Draft→Approved→Disbursed, periode terkunci; koreksi pasca-bayar belum ada)_
- [x] `server/routes/employee.ts` (slip gaji karyawan): hanya tampilkan periode Final/Dibayar. **Catatan:** saat ini belum ada rute slip gaji milik sendiri untuk karyawan biasa; `GET /api/employee/payroll-records` (izin `payroll:view`) menampilkan seluruh tenant termasuk Draft. Buat `GET /api/employee/my-payslips` (hanya milik sendiri, hanya Approved/Disbursed) dan batasi rute lama ke peran HR. _(selesai 2026-11-15: `GET /api/employee/my-payslips` (hanya milik sendiri, hanya Approved/Disbursed) + `GET /api/employee/my-thr` (hanya Paid); tab "Slip Gaji" di Employee App; rute HR-wide tetap butuh izin `payroll:view`; test membuktikan Draft tidak bocor dan tanpa izin = 403)_
- [x] Audit trail untuk: generate, finalisasi, pembayaran, koreksi (saat ini upsert payroll **tidak** mencatat audit). _(generate/approve/disburse tercatat; koreksi belum ada karena belum ada fitur koreksi)_
- [x] Pindahkan `PayrollManagement.tsx` THR/simulasi (`calculatePPh21TER` di sekitar baris 1085, 1468, 2621) agar memakai endpoint server — **bug ditemukan:** kode THR membaca `emp.ptkpStatus` (properti tidak ada; yang benar `emp.ptkp`, juga di baris ~1221, 2720) sehingga pajak THR selalu dihitung sebagai TK/0; kalkulator simulasi boleh tetap di klien hanya berlabel "Simulasi". _(selesai: THR dihitung server — tabel `thr_payments`, `server/lib/thr.ts` (Permenaker 6/2016 + PPh21 TER dengan PTKP asli karyawan), rute `/thr-runs`, status Draft→Paid immutable; bug `ptkpStatus` diperbaiki; state dummy `paidThrEmpIds=['emp-001']` dihapus. Simulasi pajak DJP/pesangon/"Simulasi Pinjaman" tetap di klien sebagai estimasi — angka resmi tetap dari server)_
- [x] Test: `payroll.isolation.test.ts` — angka klien diabaikan; periode Final menolak ubah; karyawan hanya melihat slip Final; PPh21 sesuai tabel TER untuk 3 kasus (TK/0, K/1, K/3). _(selesai: 6 test, termasuk angka klien diabaikan, periode terkunci, pinjaman dipotong sekali, klaim ditandai; kasus TER dicek untuk K/1 — TK/0 dan K/3 belum)_

**B2. Identitas & peran UI diturunkan dari sesi server**
- [x] `HrmsContext.tsx:821` `useState<UserRole>('super_admin')`: hapus default; peran = hasil `/api/auth/me`. _(selesai 2026-11-15: state peran dihapus; identitas = sesi server)_
- [x] `HrmsContext.tsx:843-855` `currentUser`: hapus fallback `'Aditya Pratama (Admin)' / aditya@nusantara.id`; tanpa sesi → tampilkan layar login, bukan pengguna palsu. _(selesai: tanpa sesi → pengguna kosong, bukan "Aditya Pratama"; **bug serius ikut ditemukan & diperbaiki:** `currentTenant.id` berisi `'tenant-ntm'` (mock) sehingga filter `tenantId === currentTenant.id` menyembunyikan SEMUA data nyata (Personalia, klaim reimbursement). Tenant kini dari `/api/auth/me`, profil perusahaan (kode, NPWP, kota, UMR, logo) disimpan server di module-settings `profile`)_
- [x] `src/components/layout/Header.tsx:640-670`: hapus blok "Ganti Simulasi Peran / Live Demo" dan `setCurrentUserRole` (`HrmsContext.tsx:190, 4996`). _(selesai; juga dihapus: aksi "Ganti Peran" di Command Palette dan "Uji Coba Hak Akses Role" di RbacManagement)_
- [x] `TenantRbacManagement.tsx:101` & `RbacManagement.tsx:281`: hapus teks/kontrol "Simulasi Role Aktif". _(selesai: file TenantRbacManagement.tsx dihapus (tak terpakai))_
- [x] Menu sidebar disaring dari matriks izin sesi nyata (`rolePermissions` dari server), bukan peran lokal. _(tidak berlaku untuk aplikasi admin: semua akunnya tenant_admin dan server default-deny; karyawan berperan terbatas memakai Employee App yang menampilkan tab sesuai izin)_
- [ ] Test e2e (Playwright): login sebagai karyawan role terbatas → menu tak berizin tidak tampil dan direct-URL ditolak server.

**B3. Password sementara & kredensial**
- [x] `RecruitmentManagement.tsx:1809`: hapus `Nusa{tahun}!{random}`; buat endpoint server `POST /api/tenant/onboarding/:id/provision-account` yang membuat password acak kriptografis (`crypto.randomBytes`), menandai `mustChangePassword`, dan mengirimnya lewat email (bukan ditampilkan di UI). _(selesai: tidak ada lagi password sementara; modal onboarding memanggil `POST /api/tenant/employee-accounts` yang membuat akun dengan hash acak tak dikenal + tautan aktivasi sekali pakai (7 hari, hanya hash token disimpan). Email dikirim; bila tak ada mailer/gagal, tautan ditampilkan SEKALI ke admin. Script `scrubTemporaryPasswords.ts` membersihkan sisa password lama)_
- [x] Paksa ganti password saat login pertama (kolom `employee_accounts.mustChangePassword`, cek di `/api/employee/login`). _(digantikan desain lebih kuat: karyawan membuat passwordnya sendiri lewat tautan; tidak ada password awal yang perlu diganti. Admin tidak lagi bisa mengatur password karyawan (field dihapus dari PUT); tersedia `POST /employee-accounts/:id/send-reset` dan `POST /api/employee/forgot-password`)_
- [x] Test: akun baru tidak bisa memakai API selain ganti-password sampai diganti. _(diganti test `employeeAccountActivation.isolation.test.ts`: akun baru tak bisa login, token hash, sekali pakai, kedaluwarsa, tanpa enumerasi akun)_

**B4. Hapus PII/data acak dari form**
- [x] `EmployeeManagement.tsx:228, 245, 246, 265, 266` (nilai awal state): ganti `'0812'+random`, `'3174'+random`, `'24'+random`, `'0001'+random` menjadi `''`. _(selesai)_
- [x] `EmployeeManagement.tsx:318, 471, 487, 488, 507, 508, 558, 2589, 2642`: hapus pengisian acak (termasuk tombol "isi otomatis" di 2589/2642). _(selesai)_
- [x] `RecruitmentManagement.tsx:2155, 2173` (telepon acak), `3527, 3538, 1729` (fallback `081234567890`): jadikan kosong + validasi wajib isi. _(selesai; form kandidat kini punya kolom email & telepon wajib dengan validasi format inline, nama wajib, CV wajib; `@example.com`, nama "Kandidat Baru", ukuran "1.2 MB" dan data parsing karangan dihapus; `resumeParsed:false`)_
- [x] Validasi format di server untuk NIK KTP 16 digit, NPWP 15/16, telepon (zod, pola sama dengan `personalDataUpdatesSchema` di `server/lib/personalia.ts`) pada `POST/PUT /employees` dan `/candidates`. _(selesai: `employeeFormatError` dipakai `POST/PUT /employees` (admin & karyawan); kolom kosong tetap boleh; test ditambahkan. Validasi server untuk `/candidates` belum)_
- [x] Test: POST employee dengan NIK KTP 3 digit → 400 dengan pesan per-field. _(selesai)_

**B5. "Parsing AI CV" palsu**
- [x] `RecruitmentManagement.tsx:~3405-3446` (`setTimeout` 600 ms, ringkasan tetap, `Math.random` untuk skor/tahun pengalaman): pilih satu — (a) hapus fitur dan tombolnya, atau (b) implementasikan nyata (endpoint server yang mengekstrak teks PDF + panggilan model, dengan label "saran, harus diverifikasi"). Sampai itu, **hapus**. _(selesai: opsi (a) — kode ekstraksi palsu, `handleTriggerCvParsing`, dan `handleSaveIncomingCandidate` (mati) dihapus)_
- [x] Hapus toast "diverifikasi & diekstrak (100%)".

### P0 — Persistensi (data tidak boleh hilang saat ganti perangkat)

**B6. Pindahkan semua localStorage ke backend** (setiap butir = tabel + route admin + route karyawan bila relevan + RBAC + audit + test)
- [x] **Reimbursement** — `HrmsContext.tsx:1112-1128` (`INITIAL_REIMBURSEMENT_CLAIMS`). Tabel `reimbursement_claims`; approval lewat Approval Engine (kategori "Reimbursement"); masuk perhitungan payroll (B1). **Kerjakan pertama.** _(selesai: tabel `reimbursement_claims`, rute admin + `/api/employee/reimbursements`, approval via Approval Engine, masuk payroll server; kunci localStorage dihapus)_
- [x] **Staging onboarding** — `HrmsContext.tsx:1096`, `4107` (`TEMP-xxxx` acak). Tabel `employee_staging`; nomor sementara dari urutan DB. _(selesai 2026-11-15: ternyata kode mati — tak ada komponen yang memakainya (onboarding nyata sudah memakai onboarding_processes); seluruh konsep staging, TEMP-xxxx acak, dan completeOnboarding (berisi tunjangan/tanggal kontrak karangan) dihapus)_
- [x] **Tiket GA / persediaan / permintaan persediaan / booking ruang / booking kendaraan** — `HrmsContext.tsx:1322-1338` (5 kunci localStorage). Tabel `ga_tickets, ga_supplies, ga_supply_requests, ga_room_bookings, ga_vehicle_bookings`. _(selesai: 5 tabel + server/routes/tenantGa.ts; nomor dokumen/tiket & status dari server; booking ganda ruangan/kendaraan ditolak (409); stok dikurangi atomik & tak bisa negatif; mesin status tiket/kendaraan; notulen mengunci rapat; pemohon/penyelenggara kini dipilih nyata (sebelumnya employees[0] otomatis jadi pemohon); 10 test ga.isolation.test.ts)_
- [ ] **Proposal struktur organisasi** — `HrmsContext.tsx:1212` + `OrganizationManagement.tsx` (kunci `nusahr_org_proposals`). Tabel `org_change_proposals` + Approval Engine. _(BELUM: backend ternyata sudah ada (/api/tenant/org-change-proposals: draft→submit→approve dengan penerapan diff di server + test), tetapi modelnya berbeda dari frontend (frontend memakai payload bertipe create_position / full_restructure / entitas dan menerapkannya lewat endpoint org satu per satu). Menyatukan = memetakan payload klien ke changes server (termasuk perubahan entitas & restrukturisasi menyeluruh) dan menerapkan di server — langkah tersendiri; sementara usulan tetap di localStorage)_
- [x] **Tanda tangan** — kunci `nusahr_signatures`; simpan di backend per pengguna. _(kode mati — tak ada pemakai; state & data spesimen contoh dihapus)_
- [x] **Skema grading jabatan** — kunci `nusahr_job_grading_scheme`; masuk `tenant_module_settings`. _(selesai: disimpan di module-settings job_grading)_
- [x] **Tenant & entitas aktif** — `HrmsContext.tsx:773-776` (`nusahr_tenants`, `'tenant-ntm'`): tenant datang dari sesi; hanya `nusahr_active_entity` boleh di localStorage sebagai preferensi UI (divalidasi server). _(tenant dari sesi server (B2); nusahr_active_tenant dan daftar tenant dihapus; entitas aktif hanya preferensi UI, default tidak lagi 'ent-ntm-holding')_
- [x] `LoanManagement.tsx`, `GaAssetManagement.tsx`, `OrganizationManagement.tsx`, `Header.tsx` (4 file lain yang menyentuh localStorage): audit tiap penggunaan; sisakan hanya preferensi UI. _(selesai: skema pinjaman → module-settings loan_schemes, SLA aset → ga_asset_slas (hook useTenantSetting); BAST → tabel ga_bast_handovers dibuat server bersama perpindahan aset dalam satu transaksi (serah terima & PENUKARAN simetris atomik, validasi siapa memegang apa — menutup temuan swap tak atomik); data BAST contoh dihapus. Sisa localStorage sah: bahasa UI & penanda logout (Header), draf restrukturisasi per-penonton (OrganizationManagement))_
- [ ] Bukti selesai: `grep -rn "localStorage" src` hanya menyisakan preferensi UI (tema, tab terakhir, entitas aktif); dua browser berbeda melihat data yang sama. _(hampir: tersisa nusahr_org_proposals — lihat atas)_

### P1 — Presensi & lokasi kantor (permintaan 2026-11-15)

**B18. Pengaturan Lokasi Kantor dipindah ke dalam menu Presensi**
- [ ] `src/App.tsx` (`case 'office_locations'`, ~baris 147) dan item sidebar `office_locations` (`src/components/layout/Sidebar.tsx`): hapus menu mandiri "Lokasi Kantor".
- [ ] `src/components/modules/AttendanceManagement.tsx`: tambahkan tab/sub-menu "Lokasi Kantor" yang merender `OfficeLocationManagement` (sudah 1.510 baris — render sebagai komponen anak, jangan salin). Tab hanya tampil bagi yang punya izin RBAC `attendance` (view); aksi tambah/ubah/nonaktif butuh `attendance:edit`.
- [ ] Rute kompatibilitas: `activeModule === 'office_locations'` (command palette `CommandPaletteModal.tsx`, dashboard, tautan di modul lain) diarahkan ke Presensi → tab Lokasi Kantor.
- [ ] Modul RBAC `office_locations` (jika ada di matriks): gabungkan ke `attendance` atau pertahankan sub-izin; pastikan matriks di `RbacManagement.tsx` tidak menampilkan modul yatim.
- [ ] Penugasan karyawan ke lokasi (`assigningLoc`, `OfficeLocationManagement.tsx:~1396`) tetap berfungsi; hasil terlihat di form presensi karyawan.
- [ ] Bukti: tidak ada item sidebar "Lokasi Kantor"; Presensi → tab Lokasi Kantor berisi seluruh fitur lama; test RBAC: peran tanpa `attendance:edit` tidak dapat mengubah lokasi (rute `PUT /api/tenant/office-locations/:id` juga diberi pemeriksaan izin untuk jalur karyawan).

**B19. Poligon geofence tersimpan sebagai poligon (bug)** — *selesai 2026-11-15*
- [x] **Penyebab:** `src/tenant/api.ts` (`OfficeLocation`) tidak punya `shapeType`/`polygonPoints`; `HrmsContext.tsx` `mapApiOfficeLocationToMock`, `addOfficeLocation`, dan `updateOfficeLocation` tidak mengirim maupun membaca keduanya, sehingga poligon hilang saat simpan dan form edit kembali ke lingkaran + radius.
- [x] Perbaikan: tipe API, pemetaan baca/tulis, dan server (`server/routes/tenant.ts` rute POST/PUT `/office-locations`): bentuk selalu konsisten — poligon wajib ≥3 titik, beralih ke lingkaran menghapus titik, edit nama/radius tidak menghapus poligon.
- [x] Test `officeLocation.isolation.test.ts` (3 test: round-trip poligon, edit tidak merusak, ganti bentuk).
- [ ] Verifikasi manual di peta (browser): gambar poligon → simpan → buka edit → titik tampil → radius tidak menimpa; `lib/geofence.ts` dipakai saat clock-in untuk poligon (uji lewat `attendanceClock` dengan titik di dalam/luar poligon).
- [ ] `addOfficeLocation/updateOfficeLocation` hanya `console.error` saat gagal (`HrmsContext.tsx`): tampilkan error di form (ikuti aturan error inline).

### P1 — Sisa data karangan yang ditemukan saat B2–B5 (belum dikerjakan)

**B20. Nama orang & data karangan yang masih tertanam**
- [x] ~40 fallback "Aditya Pratama" (penandatangan SK, pemohon, assessor) di EmployeeManagement, ComplianceManagement, ProcurementManagement, PersonaliaManagement, GaAssetManagement, RecruitmentManagement, ModuleDocumentModal, docxTemplateHelper: dikosongkan / memakai nama pengguna sesi. `docxTemplateHelper.ts`: pencarian penandatangan berbasis nama (Budi Santoso, Hendra, Siti Aminah, Bambang…) dan fallback `employees[0]` (karyawan pertama jadi penandatangan!) dihapus.
- [ ] `RecruitmentManagement.tsx:~3490-3520` (unduh CV): isi CV dibuat dari nilai bawaan ("Jakarta & Wilayah Sekitarnya", "S1 Teknik Informatika", "Perguruan Tinggi Terakreditasi", skill karangan). Hanya cetak data yang benar-benar ada.
- [ ] `RecruitmentManagement.tsx` nomor dokumen bawaan `'001/PKWT-HRD/NTM/X/2026'`, `'001/NDA-HRD/NTM/X/2026'` (modal kontrak/NDA) → nomor dari server (B11).
- [ ] `RecruitmentManagement.tsx:987, 8868` objek tenant mock `'tenant-ntm'` → `currentTenant`.
- [ ] `RecruitmentManagement.tsx` skor default `aiMatchScore ?? 88`, `'Komunikasi Efektif, Problem Solving, Manajemen Waktu'` sebagai kata kunci cocok bawaan (`handleOpenAppliedProfilingModal`): jangan menampilkan skor/kecocokan yang tidak dihitung.
- [ ] `EmployeeManagement.tsx` nilai awal form (`newDept = 'Engineering'`, tunjangan/tipe bawaan) → kosong/pilih dari master.
- [ ] UI "Lupa password" di layar login Employee App (endpoint `/api/employee/forgot-password` sudah ada) dan UI admin untuk membuat akun karyawan dari menu Karyawan (saat ini hanya dari onboarding) serta tombol "Kirim ulang tautan".
- [ ] Validasi server untuk `POST/PUT /candidates` (email/telepon) dan tampilkan error server inline di form karyawan (saat ini error API tidak ditampilkan).

### P1 — Pengaturan identitas aplikasi tenant (permintaan 2026-11-15)

**B21. Pengaturan Nama Aplikasi, Deskripsi, SEO, Favicon, dll. di App-Tenant belum ada**
Kondisi sekarang (hasil pemeriksaan kode): menu **Branding** (`BrandingManagement.tsx`) hanya mengatur **logo dokumen** dan **URL favicon** per entitas. Tidak ada nama aplikasi, deskripsi, SEO, atau pengaturan tampilan lain. `index.html` memakai satu judul tetap ("NusaHR Enterprise - SaaS HRMS…") dan satu `<meta description>` untuk semua tenant; tidak ada kode yang mengubah `document.title`. Favicon: `HrmsContext` membaca `currentTenant.appFaviconUrl` (profil tenant) sedangkan layar Branding menyimpan ke entitas (`updateEntity`) — dua sumber berbeda. Favicon hanya berupa kolom URL (dengan preset contoh dari domain pihak ketiga/`example.com`), tanpa unggah berkas.

Yang harus dibuat:
- [ ] **Model data:** simpan pengaturan di server per tenant (kunci module-settings `appearance` atau tabel `tenant_branding`): `appName`, `tagline`, `description`, `seoTitle`, `seoDescription`, `seoKeywords`, `ogImageUrl`, `faviconUrl`, `appleTouchIconUrl`, `loginLogoUrl`, `loginBackgroundUrl`, `primaryColor`, `accentColor`, `supportEmail`, `supportPhone`, `footerText`, `defaultLanguage`, `timezone`, `dateFormat`, `currency`. Validasi zod (panjang judul ≤ 60, deskripsi ≤ 160, URL https, warna hex).
- [ ] **Satu sumber kebenaran:** pilih tingkat tenant untuk nama/SEO/favicon aplikasi, dan tingkat entitas hanya untuk logo kop dokumen; hapus favicon dari `updateEntity` atau jadikan fallback eksplisit. Perbaiki sinkron favicon di `HrmsContext.tsx` (efek "Sync Favicon to HTML head") agar membaca sumber yang sama.
- [ ] **Unggah berkas** (logo, favicon, OG image) ke object storage (lihat P2 lampiran) dengan validasi tipe (PNG/ICO/SVG), ukuran (favicon ≤ 100 KB, logo ≤ 1 MB), dan dimensi; hapus preset contoh dari domain pihak ketiga di `BrandingManagement.tsx:246-275`.
- [ ] **Terapkan ke halaman:** `document.title = appName`, `<meta name="description">`, `og:title/og:description/og:image`, `twitter:*`, `theme-color` di-set saat aplikasi memuat pengaturan tenant (aplikasi admin, Employee App, layar login tenant, halaman aktivasi/reset). Untuk SEO/preview tautan yang dibaca crawler (yang tidak menjalankan JavaScript), render meta di server: rute `GET /` per subdomain menyisipkan tag ke `index.html` (middleware SSR ringan) — periksa dengan "view source".
- [ ] `robots`: halaman tenant adalah aplikasi privat → `<meta name="robots" content="noindex,nofollow">` + header `X-Robots-Tag` kecuali halaman publik yang memang ingin diindeks (tentukan: layar login tenant tidak diindeks); sediakan `/robots.txt` dan `/manifest.webmanifest` (nama, ikon, warna tema) per tenant.
- [ ] **Email & dokumen:** nama aplikasi/tenant dan email dukungan dipakai di template email (`server/lib/email.ts`: saat ini "NusaHR" tertanam di subjek/isi) dan footer dokumen.
- [ ] **UI:** perluas menu Branding menjadi tab "Identitas Aplikasi" (Nama & Deskripsi, SEO & Pratinjau Tautan, Ikon & Favicon, Warna, Kontak & Footer, Bahasa & Format) dengan pratinjau langsung (tab browser, kartu bagikan tautan, layar login), validasi inline per kolom, dan tombol "Kembalikan ke bawaan" dengan modal konfirmasi.
- [ ] **RBAC & audit:** hanya `tenant_admin` (atau peran dengan izin modul `branding:edit`); setiap perubahan tercatat di audit trail (siapa, nilai lama→baru).
- [ ] **Test:** integrasi — simpan/ambil pengaturan, validasi menolak judul >60 karakter dan URL `javascript:`, pengaturan tenant A tidak terlihat tenant B; render meta server menyisipkan judul/deskripsi tenant yang benar (tanpa XSS: nilai di-escape).
- [ ] Bukti: ubah nama aplikasi → judul tab dan layar login berubah tanpa rebuild; `curl -s https://<subdomain>/ | grep -i "<title>\|og:"` menampilkan nilai tenant.

### Temuan tambahan B7–B10
- [x] **Penghapusan pinjaman diam-diam:** penyelesaian offboarding di klien menandai semua pinjaman aktif "Lunas" (sisa 0) — dihapus. Server kini menolak finance clearance bila masih ada pinjaman aktif; pelunasan manual lewat `POST /loans/:id/settle` (catatan wajib, audit).
- [x] PR yang ditolak di Approval Center tidak bisa lagi dilanjutkan ke PO (sebelumnya lolos karena hanya cek "menunggu"); PUT pengadaan jalur karyawan kini memakai gerbang & pembuatan aset yang sama; PR selalu lahir "Pengajuan PR" dengan item approval dari server.
- [ ] Parameter pinjaman per skema (aturan "existingLoanRule", bunga, biaya admin) di `LoanManagement` masih hanya divalidasi klien; server baru menegakkan plafon cicilan % gaji, tenor maks, dan satu pinjaman aktif (module-settings `loan`). Pindahkan skema ke server dan tegakkan semuanya (B15).
- [ ] Nomor PR (`PR-YYYY-NNN`) masih dibuat klien (`HrmsContext.addProcurementOrder`); nomor SPPD kini dari server — samakan penomoran PR/PO di B11.
- [ ] Pengaturan presensi `lateGracePeriodMins`, `latePenaltyPerHour`, jendela clock-in/out: satukan dengan toleransi shift (satu sumber).
- [ ] Settlement SPPD (biaya aktual) belum tersimpan (B15); status "Disetujui Atasan" kini tak dipakai (satu keputusan engine → "Disetujui Finance"; atur 2 tahap lewat workflow config kategori Perjalanan Dinas).
- [ ] Verifikasi manual di browser untuk semua layar Employee App baru (Pengajuan, Dokumen, Tim & Approval) dan layar admin yang berubah (Presensi, Pinjaman, SPPD, Procurement, Dashboard).

### Temuan tambahan B6 (belum dikerjakan)
- [ ] Master data GA masih tertanam di UI: daftar ruangan ("Ruang Meeting VIP - Lantai 18" dst.) dan armada ("Toyota Avanza Veloz (B 5678 NTM)", plat diambil dari teks nama kendaraan, "Pak Supriadi") di GaAssetManagement.tsx → tabel master ruangan & kendaraan (kapasitas, lokasi, plat, jadwal servis, masa pajak) dengan CRUD; booking merujuk ke master (FK) bukan teks.
- [ ] GaAssetManagement.tsx: nama "Bambang Sudiro" tertanam di dokumen pemeliharaan (signeeName), fallback peminjam, form tiket location 'Lantai 18 - Wing Barat'.
- [ ] Jalur karyawan untuk GA (tiket, booking ruangan/kendaraan, permintaan ATK) — saat ini hanya admin; tambahkan rute /api/employee/ga-* (hanya milik sendiri) + tab di Employee App.
- [ ] Persetujuan permintaan ATK/booking kendaraan lewat Approval Engine (kategori GA) alih-alih tombol admin langsung.
- [ ] Restok barang ATK (endpoint ada, belum ada UI) dan peringatan stok di bawah titik pesan ulang.

### P1 — Integrasi antar fungsi/modul

**B7. Approval dibuat oleh server, bukan klien**
- [x] Saat ini klien memanggil `createApprovalItem` untuk Cuti (`HrmsContext.tsx:~1824`), Lembur, Reimbursement, Pinjaman, Perbaikan Presensi, Tukar Shift, Perjalanan Dinas, Procurement PR. _(selesai 2026-11-15: server/lib/requests.ts + approvalFlows.ts; Cuti, Lembur, Pinjaman, Perbaikan Presensi, Tukar Shift, Perjalanan Dinas, Procurement PR dibuat server bersama permintaannya (approver = atasan nyata); Personalia & Reimbursement sudah sebelumnya)_
- [x] Untuk tiap kategori: pembuatan entitas di server (`POST /leave-requests`, dst.) langsung membuat `approvalItem` via `buildApprovalSteps` (seperti `submitPersonaliaAction`) dan mendaftarkan `finalizeHooks[kategori]` yang menerapkan hasil (potong saldo cuti, aktifkan pinjaman, dll.). Hapus `runApprovalSideEffects` kategori terkait di `HrmsContext.tsx:~3336-3395`. _(selesai: finalizeHooks + approvalPrechecks (saldo cuti, roster tukar shift diperiksa SEBELUM keputusan dicatat); efek diterapkan sekali. Helper klien createApprovalItem/persistApprovalItem* dihapus; runApprovalSideEffects tinggal memuat ulang data. Catatan: surat "Hak Cuti" yang dibuat klien tiap cuti disetujui dihapus (dokumen dibuat lewat aksi eksplisit))_
- [x] Hapus endpoint `POST /approval-items` untuk kategori yang sudah ditangani server (hanya admin override). _(selesai: POST /approval-items menolak kategori server-managed (400); PUT tak bisa mengubah status item kategori itu; tabel permintaan tak punya rute edit status lagi — PUT/POST lama leave/overtime/loans/corrections/swaps/trips dihapus)_
- [x] Test per kategori: tidak bisa pre-approve; approver = atasan nyata; hook menerapkan efek tepat sekali. _(selesai: requests.isolation.test.ts, 17 test)_

**B8. Saldo cuti server-side**
- [x] Tabel `leave_balances(employeeId, year, entitlement, used, carried)` + `leave_ledger` (mutasi: grant, deduct, adjust, expire). _(selesai: leave_balances + leave_ledger (deduct/restore/grant, idempotent per sumber); entitlement dari module-settings "leave".annualEntitlementDays, default 12 (UU 13/2003); saldo tersedia = sisa − cuti tertunda sehingga dua pengajuan tak bisa melewati saldo)_
- [x] `HrmsContext.tsx:~1876` (`remainingLeaveDays - totalDays` di klien) dan nilai tertanam 12 (`HrmsContext.tsx:2300, 2794, 3054, 4173`): hapus; pemotongan terjadi di `finalizeHooks['Cuti']`. _(selesai: pemotongan hanya di finalizeHooks['Cuti']; tampilan sisa cuti karyawan ditimpa dari ledger. Catatan: angka 12 yang masih tertulis di payload pembuatan karyawan (details.remainingLeaveDays) kini tidak dipakai — hapus saat normalisasi B12; belum ada pro-rata karyawan baru, carry-over, dan kedaluwarsa)_
- [x] Cuti bersama: potong ke ledger saat kalender ditetapkan (bukan dihitung ulang tiap render — temuan audit §4). _(selesai: applyCollectiveLeave saat event Cuti Bersama (deductsLeaveBucket) dibuat; idempotent per event)_
- [x] Test: approve cuti 2 hari mengurangi saldo 2; reject tidak; saldo tidak bisa negatif; approve dua kali tidak memotong dua kali. _(selesai)_

**B9. Presensi: waktu & status dari server**
- [x] `HrmsContext.tsx` `clockIn/clockOut` (jam 08:30 tertanam `8*60+30`, lembur setelah 17:30 `17*60+30`): hapus; server memakai jam server + jadwal shift karyawan (`server/lib/attendanceClock.ts` sudah ada — jadikan satu-satunya sumber). _(selesai: fungsi klien dihapus (termasuk kartu "simulasi presensi" Dashboard yang memakai employees[0]); server memakai jam Asia/Jakarta (sebelumnya jam lokal server), shift terjadwal → shift SH-NOR tenant → DEFAULT_SHIFT 08:00–17:00 (satu tempat), toleransi dari shift. **Bug ditemukan:** clock-in server sebelumnya tidak pernah menghitung keterlambatan (status selalu "Hadir", lateMinutes 0) sehingga potongan keterlambatan payroll selalu nol untuk presensi nyata)_
- [x] Klien hanya mengirim koordinat/foto; tolak `clockIn` dari body. _(selesai: rute presensi admin menolak lateMinutes/overtimeHours dari body dan menurunkannya dari shift; format jam HH:MM divalidasi. Pengaturan lateGracePeriodMins di modul Presensi belum dipakai server (toleransi per shift) — samakan di B12)_
- [x] Test: mengirim `clockIn:"08:00"` di body diabaikan; terlambat dihitung dari shift. _(selesai, termasuk shift malam lintas tengah malam)_

**B10. Satu portal karyawan**
- [x] Bandingkan fitur `EssPortal.tsx` (1.646 baris) dengan `employee/EmployeeApp.tsx` (yang sudah ada: profil, presensi, cuti, MFA, antrean approval atasan) dan pindahkan yang belum ada (periksa: reimbursement, slip gaji, pinjaman, lembur, tukar shift, dokumen) ke Employee App dengan API `/api/employee/*`. _(selesai: Employee App kini punya Pengajuan (lembur, koreksi presensi, tukar shift, pinjaman, SPPD, reimbursement), Slip Gaji+THR, Dokumen Saya, Cuti dengan saldo, Tim & Approval (antrean semua kategori lewat engine, alasan tolak wajib, monitoring tim, delegasi))_
- [x] Hapus rute `case 'ess'` (`App.tsx:179-180`) dan `EssPortal.tsx`; evaluasi `MssPortal.tsx` (dipakai `App.tsx` dan `EmployeeApp.tsx`) → hanya satu antrean persetujuan atasan. _(selesai: EssPortal.tsx dan MssPortal.tsx dihapus beserta menu sidebar & tautan Header; satu antrean persetujuan atasan = Tim & Approval)_
- [x] Bukti: tidak ada import `EssPortal`; fitur ESS di Employee App lolos test RBAC. _(selesai; fitur baru diuji di requests.isolation.test.ts. UI Employee App belum diuji di browser)_

**B11. Penomoran & nomor acak**
- [ ] `OrganizationManagement.tsx:603` (`SK-DIR/RESTRUCT/…random`), `RecruitmentManagement.tsx:1582, 4263, 1706, 4943` (nomor tiket/ID acak): ganti dengan penomoran server berurutan per tenant per tahun (pola `nextLetterNumber` di `server/lib/personalia.ts`), unik via indeks DB.
- [ ] `RecruitmentManagement.tsx:1769-1770` (serial laptop/asset tag acak): ambil dari modul aset (aset nyata dipilih, bukan dibuat acak).
- [ ] `ProcurementManagement.tsx:180` (telepon vendor acak `021-555…`): kosongkan.
- [ ] `utils/documentNumbering.ts` (klien): hapus; nomor dokumen dari server.
- [ ] `OrganizationManagement.tsx:973-1005` (`draft-*` id acak): sah untuk draf lokal; pastikan tidak ikut terkirim sebagai id DB.

### P1 — Relasi & keselarasan field

**B12. Normalisasi `department/position/grade`**
- [ ] `employees.details.department|position|grade` (teks) → hanya `departmentId`, `positionId`, `orgNodeId`, `gradeCode` (kolom). Tambah kolom `grade_code` pada `employees`.
- [ ] Migrasi data: petakan teks → ID (laporan baris yang tidak cocok untuk diperbaiki manual).
- [ ] `mergeRowIntoMock` (`HrmsContext.tsx`): turunkan `department/position` dari relasi (join), bukan dari `details`.
- [ ] Update semua pembaca: `PersonaliaManagement`, `EmployeeManagement`, `ReportsManagement` (48 error TS di sini sebagian karena ini), `PayrollManagement`.
- [ ] Hapus penulisan teks di `server/lib/personalia.ts` apply (`details.position/department/grade`) setelah kolom ID menjadi sumber.
- [ ] Test: ubah nama departemen di master → tampil di semua modul tanpa edit karyawan.

**B13. Satu garis pelaporan**
- [ ] Hapus `Employee.directSupervisor` (teks); semua UI memakai `managerId`. Migrasi: cocokkan nama → `managerId`.
- [ ] Validasi server: `managerId` bukan diri sendiri, bukan bawahan sendiri (cegah siklus) pada `PUT /employees/:id`.

**B14. Isolasi per-entitas**
- [ ] Terapkan `resolveVisibleEmployeeIds`-style scoping pada koleksi yang belum: `ga_assets`, `procurement_orders`, `employee_loans`, `payroll_records`, `official_documents`, `business_trips`, `approval_items` (kolom `entity_id` + filter). Sebagian sudah scoping lewat employeeId; periksa tiap `GET` di `server/routes/tenant.ts`.
- [ ] Test lintas-entitas: admin entitas anak tidak melihat data entitas saudara/induk.

**B15. Pinjaman, perjalanan dinas, aset, dokumen (butir audit §3–§4)**
- [ ] Pinjaman: kolom `loan_scheme_id`, tabel `loan_installments` (jadwal + status bayar per periode, terhubung ke payroll), alasan penolakan.
- [ ] Perjalanan dinas: simpan realisasi biaya (`actualCost`, `settlementAt`), approval dua tahap (Atasan → Finance) via Approval Engine dengan dua `approvedBy`.
- [ ] Aset: `building/room` → FK ke `office_locations`/ruangan; swap 2 pihak dalam satu transaksi dengan validasi simetris; BAST (`BastHandoverRecord`) ke tabel; `purchaseDate` form registrasi tidak di-hardcode hari ini.
- [ ] Dokumen: nomor surat final **setelah** approval (Recruitment `RecruitmentManagement.tsx:19777-19817` — QR tidak boleh tampil sebelum kandidat merespons).
- [ ] Skor tes online kandidat (`CandidateOnlineTestPortal`) otomatis masuk ke `candidates` (server menghitung).

### P1 — Data awal (jawaban bagian A)

**B16. Seed master per tenant di server**
- [ ] Buat `server/lib/tenantDefaults.ts` → `seedTenantDefaults(tenantId)` dipanggil di `POST /entities` (entitas induk) dan di pembuatan tenant: role sistem + matriks izin, work shifts, module settings semua modul, template checklist onboarding, tipe tes kompetensi, tipe wawancara, hari libur nasional tahun berjalan+1, komponen gaji standar (opsional), template dokumen (sudah ada).
- [ ] Idempoten (aman diulang) + script backfill untuk tenant lama (pola `backfillDocumentTemplates.ts`).
- [ ] Endpoint "reset ke default" server-side untuk tipe tes/wawancara (ganti `HrmsContext.tsx:2383, 2477`).
- [ ] Test: tenant baru langsung punya role, shift, 45 template dokumen, checklist onboarding; seed dua kali tidak menggandakan.

**B17. Bersihkan `initialData.ts`**
- [ ] Hapus 35 impor tak terpakai di `HrmsContext.tsx:~120-173` (INITIAL_EMPLOYEES, ATTENDANCE, ASSETS, DOCUMENTS, … — lihat A3).
- [ ] Setelah B6 & B16 selesai: hapus ekspor yang tersisa; `initialData.ts` dihapus total. `_UNUSED_CLM_HOLDER` dan 20 error TS di file ini hilang.
- [ ] Hapus `resetToSampleFlowData` (`HrmsContext.tsx:584, 4963, 5229`; `Header.tsx:63`; `CommandPaletteModal.tsx:305, 378, 412`) — tidak boleh ada tombol yang mereset data produksi.
- [ ] Hapus `csvHelper.ts:4-8` baris contoh orang; ganti template CSV dengan data placeholder jelas ("Nama Karyawan").
- [ ] Bukti: `grep -rn "initialData" src` kosong.

### P1 — Fungsi sementara/demo
- [ ] `MigrationWizardModal.tsx:309` "Uji Cepat (Simulasi Data Nyata)": hapus tombol; impor hanya dari file pengguna.
- [ ] `GaAssetManagement.tsx:2237` "Simulasi Pemindai QR": ganti dengan pemindai kamera sungguhan (`BarcodeDetector`/library) atau input kode manual; hapus simulasi.
- [ ] `DashboardOverview.tsx:975` & `761`: "Simulasi presensi": arahkan ke presensi nyata.
- [ ] `GaAssetManagement.tsx:441` (`vehicleStartOdometerKm: 12450` tertanam), `2112, 2733` (`endOdometer = start + 65` — **mengisi odometer akhir otomatis**): hapus; wajib input pengguna.
- [ ] `RecruitmentManagement.tsx:731-732` ruang "Simulasi Teknis" adalah nama ruang contoh: ambil dari master ruang (B6 booking ruang).
- [ ] Mempertahankan (sah): kalkulator Simulasi Pinjaman, Simulasi Pesangon `OffboardingManagement.tsx:966`, Simulasi PPh21 `PayrollManagement.tsx:1543-1949` — pastikan berlabel "estimasi" dan angka resmi dari server (B1).

### P1 — Modul mati/duplikat
- [ ] Hapus `src/components/modules/TenantRbacManagement.tsx` (tak diimpor; duplikat `RbacManagement`).
- [ ] Hapus `src/components/modules/OrgChartManagement.tsx` (tak dirutekan) — atau rutekan bila bagan memang fitur; putuskan.
- [ ] `GradeSalaryManagement.tsx` tak dirutekan namun memanggil `addGradeSalaryRange`; verifikasi apakah `OrganizationManagement` sudah mencakup seluruh fiturnya → hapus yang redundan, atau rutekan satu layar "Grade & Gaji" (grade kini dipakai validasi Personalia).
- [ ] Hapus `src/utils/qrGenerator.ts` (0 pemakai), `src/scratch/`, `test-studio-render.tsx` (119 error TS, bukan bagian aplikasi).
- [ ] Hapus `EssPortal.tsx` setelah B10.

### P1 — Kualitas kode
- [ ] **Error TypeScript 291 → 0**, per file: `test-studio-render.tsx` 119 (hapus), `RecruitmentManagement.tsx` 58, `ReportsManagement.tsx` 48, `initialData.ts` 20 (hilang via B17), `PersonaliaManagement.tsx` 14 (properti `role`, `score`, `rating`, `branch`, `skNumber`, `actionType` yang tidak ada di tipe), `OrganizationManagement.tsx` 14, `HrmsContext.tsx` 5 (`patternCfg` undefined ~4089-4098), `PayrollManagement.tsx` 5, `NikFormatSettingsTab.tsx` 5, `OffboardingManagement.tsx` 1, `EssPortal.tsx` 1, `Sidebar.tsx` 1.
- [ ] Tambahkan `npm run typecheck` (`tsc --noEmit`) ke `.github/workflows/ci.yml` sebagai langkah wajib **setelah** nol error, agar tidak kambuh.
- [ ] `alert()/confirm()` (70 pemakaian) → modal konfirmasi/toast sesuai aturan proyek: `RecruitmentManagement.tsx` 30, `ProcurementManagement.tsx` 7, `OrganizationManagement.tsx` 6, `PayrollManagement.tsx` 5, `GaAssetManagement.tsx` 5, `EssPortal.tsx` 5 (hilang via B10), `OfficialMultiPageDocumentSheet.tsx` 5, `HrmsContext.tsx` 4, `RbacManagement.tsx` 3, `ShiftRosterManagement.tsx` 2, `EmployeeManagement.tsx` 2, `BusinessTripManagement.tsx` 2, sisanya 1 per file (Offboarding, Mss, AuditTrail, UniversalFilePreview). Buat satu komponen `ConfirmDialog` dan `useToast` bersama.
- [ ] `any`/`as any` ~155 → tipe sebenarnya; prioritas file dengan error TS di atas. Target < 30.
- [ ] `@ts-ignore`/`eslint-disable` 14 → hapus alasan atau beri komentar alasan.
- [x] TODO/FIXME: dicek — 43 kecocokan semuanya salah-deteksi (kata "StartOdometer", "IntoDossier" mengandung "todo"); tidak ada TODO/FIXME asli. Tambahkan aturan lint agar tidak ada TODO tanpa tiket.
- [ ] Pecah file raksasa (tidak mengubah perilaku; satu PR per file, setiap PR lolos test): `RecruitmentManagement.tsx` 23.356 baris → sub-komponen per tab (Requisition, Vacancy, Candidate, Interview, Offer, Onboarding); `OrganizationManagement.tsx` 9.271; `DocumentManagement.tsx` 6.065; `GaAssetManagement.tsx` 4.757; `EmployeeManagement.tsx` 4.550; `PersonaliaManagement.tsx` 4.146.
- [ ] Pecah `HrmsContext.tsx` (5.249 baris, satu context) menjadi context/hook per domain (`useEmployees`, `usePayroll`, `useApprovals`, …) yang memanggil `tenantApi` langsung; kurangi re-render.
- [ ] Pecah `server/routes/tenant.ts` (3.760 baris) menjadi `server/routes/tenant/{employees,payroll,attendance,…}.ts` per modul.
- [ ] Tambah ESLint + Prettier + `noUnusedLocals` bertahap; aturan: dilarang `alert`, `Math.random` untuk ID/nomor bisnis.
- [ ] `console.log` hanya di script seed/migrasi (sudah demikian) — pertahankan; log server lewat `server/lib/logger.ts`.

### P2 — Non-fungsional produksi
- [ ] Enkripsi kolom PII (NIK KTP, No. KK, NPWP, rekening, BPJS) di `employees.details`: enkripsi aplikasi (AES-GCM, kunci dari KMS/env) + masking di respons untuk peran tanpa izin; rotasi kunci terdokumentasi.
- [ ] Kebijakan retensi & penghapusan data pribadi (UU PDP): jadwal retensi per jenis data, anonimisasi karyawan resign, endpoint ekspor data subjek.
- [ ] Lampiran → object storage (S3-kompatibel) dengan URL bertanda tangan; hentikan data-URL di kolom teks (`leave_requests.attachment_url`, dokumen).
- [ ] Backup & restore: backup terjadwal Postgres, uji restore berkala, RPO/RTO tertulis.
- [ ] Observabilitas: metrik (latensi, error rate), alert (sudah ada `server/lib/alerts.ts` untuk keamanan — tambah operasional), health check.
- [ ] Uji beban (`server/db/seed/loadTestTenant.ts` sudah ada): target p95 per endpoint kritis, indeks DB berdasarkan hasil.
- [ ] Pentest eksternal + perbaikan temuan; pemindaian dependensi sudah ada (Dependabot).
- [ ] Dokumen runbook go-live: migrasi, rollback, kontak insiden.

---

## C. Urutan eksekusi yang disarankan
1. B2, B3, B4, B5 (cepat, risiko tinggi) →
2. B1 (payroll) bersama B6-reimbursement →
3. B16 + B17 (seed master di server, lalu hapus `initialData.ts`) →
4. B6 sisa, B7, B8, B9 →
5. B10–B15 →
6. Kualitas kode (TS → 0, `alert` → modal, pecah file) berjalan paralel per PR kecil →
7. P2.

Aturan kerja: tiap butir selesai hanya bila (a) kode, (b) test integrasi pada DB nyata, (c) `npm run test` hijau, (d) `docs/AUDIT_FINDINGS.md`/checklist ini dicentang.
