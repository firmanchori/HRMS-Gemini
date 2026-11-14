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
- [ ] `src/context/HrmsContext.tsx:1979-2018` (`generatePayroll`): berhenti menghitung `calculatePPh21TER`/BPJS di klien; panggil endpoint baru `POST /api/tenant/payroll-runs` berisi hanya `{ period, employeeIds }`.
- [ ] Buat `server/lib/payrollEngine.ts`: pindahkan logika `src/utils/taxCalculator.ts` (PPh21 TER, BPJS, lembur, THR, pesangon) ke server; sumber input = `employees.basicSalary`, `employeeSalaryAssignments`, presensi/lembur/reimbursement/pinjaman dari DB.
- [ ] `server/routes/tenant.ts:2716-2760` (`payrollRecordSchema`, `/payroll-records/upsert`, `PUT /payroll-records/:id`): **hapus** `pph21*`, gaji bersih, potongan dari body; server mengabaikan angka klien. Tolak PUT pada record berstatus Final/Dibayar.
- [ ] Skema: tambah `payroll_periods(tenantId, period, status Draft|Final|Dibayar, lockedAt, lockedBy)`; semua `payrollRecords` mengacu ke periode; Final = tidak bisa diubah, hanya koreksi lewat periode berikutnya.
- [ ] `server/routes/employee.ts` (slip gaji karyawan): hanya tampilkan periode Final/Dibayar.
- [ ] Audit trail untuk: generate, finalisasi, pembayaran, koreksi (saat ini upsert payroll **tidak** mencatat audit).
- [ ] Pindahkan `PayrollManagement.tsx:1085, 1468, 2621` (THR/simulasi) agar memakai endpoint server; kalkulator simulasi boleh tetap di klien hanya berlabel "Simulasi".
- [ ] Test: `payroll.isolation.test.ts` — angka klien diabaikan; periode Final menolak ubah; karyawan hanya melihat slip Final; PPh21 sesuai tabel TER untuk 3 kasus (TK/0, K/1, K/3).

**B2. Identitas & peran UI diturunkan dari sesi server**
- [ ] `HrmsContext.tsx:821` `useState<UserRole>('super_admin')`: hapus default; peran = hasil `/api/auth/me`.
- [ ] `HrmsContext.tsx:843-855` `currentUser`: hapus fallback `'Aditya Pratama (Admin)' / aditya@nusantara.id`; tanpa sesi → tampilkan layar login, bukan pengguna palsu.
- [ ] `src/components/layout/Header.tsx:640-670`: hapus blok "Ganti Simulasi Peran / Live Demo" dan `setCurrentUserRole` (`HrmsContext.tsx:190, 4996`).
- [ ] `TenantRbacManagement.tsx:101` & `RbacManagement.tsx:281`: hapus teks/kontrol "Simulasi Role Aktif".
- [ ] Menu sidebar disaring dari matriks izin sesi nyata (`rolePermissions` dari server), bukan peran lokal.
- [ ] Test e2e (Playwright): login sebagai karyawan role terbatas → menu tak berizin tidak tampil dan direct-URL ditolak server.

**B3. Password sementara & kredensial**
- [ ] `RecruitmentManagement.tsx:1809`: hapus `Nusa{tahun}!{random}`; buat endpoint server `POST /api/tenant/onboarding/:id/provision-account` yang membuat password acak kriptografis (`crypto.randomBytes`), menandai `mustChangePassword`, dan mengirimnya lewat email (bukan ditampilkan di UI).
- [ ] Paksa ganti password saat login pertama (kolom `employee_accounts.mustChangePassword`, cek di `/api/employee/login`).
- [ ] Test: akun baru tidak bisa memakai API selain ganti-password sampai diganti.

**B4. Hapus PII/data acak dari form**
- [ ] `EmployeeManagement.tsx:228, 245, 246, 265, 266` (nilai awal state): ganti `'0812'+random`, `'3174'+random`, `'24'+random`, `'0001'+random` menjadi `''`.
- [ ] `EmployeeManagement.tsx:318, 471, 487, 488, 507, 508, 558, 2589, 2642`: hapus pengisian acak (termasuk tombol "isi otomatis" di 2589/2642).
- [ ] `RecruitmentManagement.tsx:2155, 2173` (telepon acak), `3527, 3538, 1729` (fallback `081234567890`): jadikan kosong + validasi wajib isi.
- [ ] Validasi format di server untuk NIK KTP 16 digit, NPWP 15/16, telepon (zod, pola sama dengan `personalDataUpdatesSchema` di `server/lib/personalia.ts`) pada `POST/PUT /employees` dan `/candidates`.
- [ ] Test: POST employee dengan NIK KTP 3 digit → 400 dengan pesan per-field.

**B5. "Parsing AI CV" palsu**
- [ ] `RecruitmentManagement.tsx:~3405-3446` (`setTimeout` 600 ms, ringkasan tetap, `Math.random` untuk skor/tahun pengalaman): pilih satu — (a) hapus fitur dan tombolnya, atau (b) implementasikan nyata (endpoint server yang mengekstrak teks PDF + panggilan model, dengan label "saran, harus diverifikasi"). Sampai itu, **hapus**.
- [ ] Hapus toast "diverifikasi & diekstrak (100%)".

### P0 — Persistensi (data tidak boleh hilang saat ganti perangkat)

**B6. Pindahkan semua localStorage ke backend** (setiap butir = tabel + route admin + route karyawan bila relevan + RBAC + audit + test)
- [ ] **Reimbursement** — `HrmsContext.tsx:1112-1128` (`INITIAL_REIMBURSEMENT_CLAIMS`). Tabel `reimbursement_claims`; approval lewat Approval Engine (kategori "Reimbursement"); masuk perhitungan payroll (B1). **Kerjakan pertama.**
- [ ] **Staging onboarding** — `HrmsContext.tsx:1096`, `4107` (`TEMP-xxxx` acak). Tabel `employee_staging`; nomor sementara dari urutan DB.
- [ ] **Tiket GA / persediaan / permintaan persediaan / booking ruang / booking kendaraan** — `HrmsContext.tsx:1322-1338` (5 kunci localStorage). Tabel `ga_tickets, ga_supplies, ga_supply_requests, ga_room_bookings, ga_vehicle_bookings`.
- [ ] **Proposal struktur organisasi** — `HrmsContext.tsx:1212` + `OrganizationManagement.tsx` (kunci `nusahr_org_proposals`). Tabel `org_change_proposals` + Approval Engine.
- [ ] **Tanda tangan** — kunci `nusahr_signatures`; simpan di backend per pengguna.
- [ ] **Skema grading jabatan** — kunci `nusahr_job_grading_scheme`; masuk `tenant_module_settings`.
- [ ] **Tenant & entitas aktif** — `HrmsContext.tsx:773-776` (`nusahr_tenants`, `'tenant-ntm'`): tenant datang dari sesi; hanya `nusahr_active_entity` boleh di localStorage sebagai preferensi UI (divalidasi server).
- [ ] `LoanManagement.tsx`, `GaAssetManagement.tsx`, `OrganizationManagement.tsx`, `Header.tsx` (4 file lain yang menyentuh localStorage): audit tiap penggunaan; sisakan hanya preferensi UI.
- [ ] Bukti selesai: `grep -rn "localStorage" src` hanya menyisakan preferensi UI (tema, tab terakhir, entitas aktif); dua browser berbeda melihat data yang sama.

### P1 — Integrasi antar fungsi/modul

**B7. Approval dibuat oleh server, bukan klien**
- [ ] Saat ini klien memanggil `createApprovalItem` untuk Cuti (`HrmsContext.tsx:~1824`), Lembur, Reimbursement, Pinjaman, Perbaikan Presensi, Tukar Shift, Perjalanan Dinas, Procurement PR.
- [ ] Untuk tiap kategori: pembuatan entitas di server (`POST /leave-requests`, dst.) langsung membuat `approvalItem` via `buildApprovalSteps` (seperti `submitPersonaliaAction`) dan mendaftarkan `finalizeHooks[kategori]` yang menerapkan hasil (potong saldo cuti, aktifkan pinjaman, dll.). Hapus `runApprovalSideEffects` kategori terkait di `HrmsContext.tsx:~3336-3395`.
- [ ] Hapus endpoint `POST /approval-items` untuk kategori yang sudah ditangani server (hanya admin override).
- [ ] Test per kategori: tidak bisa pre-approve; approver = atasan nyata; hook menerapkan efek tepat sekali.

**B8. Saldo cuti server-side**
- [ ] Tabel `leave_balances(employeeId, year, entitlement, used, carried)` + `leave_ledger` (mutasi: grant, deduct, adjust, expire).
- [ ] `HrmsContext.tsx:~1876` (`remainingLeaveDays - totalDays` di klien) dan nilai tertanam 12 (`HrmsContext.tsx:2300, 2794, 3054, 4173`): hapus; pemotongan terjadi di `finalizeHooks['Cuti']`.
- [ ] Cuti bersama: potong ke ledger saat kalender ditetapkan (bukan dihitung ulang tiap render — temuan audit §4).
- [ ] Test: approve cuti 2 hari mengurangi saldo 2; reject tidak; saldo tidak bisa negatif; approve dua kali tidak memotong dua kali.

**B9. Presensi: waktu & status dari server**
- [ ] `HrmsContext.tsx` `clockIn/clockOut` (jam 08:30 tertanam `8*60+30`, lembur setelah 17:30 `17*60+30`): hapus; server memakai jam server + jadwal shift karyawan (`server/lib/attendanceClock.ts` sudah ada — jadikan satu-satunya sumber).
- [ ] Klien hanya mengirim koordinat/foto; tolak `clockIn` dari body.
- [ ] Test: mengirim `clockIn:"08:00"` di body diabaikan; terlambat dihitung dari shift.

**B10. Satu portal karyawan**
- [ ] Bandingkan fitur `EssPortal.tsx` (1.646 baris) dengan `employee/EmployeeApp.tsx` (yang sudah ada: profil, presensi, cuti, MFA, antrean approval atasan) dan pindahkan yang belum ada (periksa: reimbursement, slip gaji, pinjaman, lembur, tukar shift, dokumen) ke Employee App dengan API `/api/employee/*`.
- [ ] Hapus rute `case 'ess'` (`App.tsx:179-180`) dan `EssPortal.tsx`; evaluasi `MssPortal.tsx` (dipakai `App.tsx` dan `EmployeeApp.tsx`) → hanya satu antrean persetujuan atasan.
- [ ] Bukti: tidak ada import `EssPortal`; fitur ESS di Employee App lolos test RBAC.

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
