# Business-Flow Audit Findings & Pre-Backend Checklist
## NusaHR Enterprise HRMS — Frontend-Only State (Pre-API/DB)

**Tanggal Audit:** 31 Oktober 2026
**Metode:** Pembacaan penuh kode frontend (`src/context/HrmsContext.tsx`, `src/types/hrms.ts`,
`src/data/initialData.ts`, dan 33 modul di `src/components/modules/`) oleh 7 sub-agent
tematik, cross-check manual.
**Status aplikasi saat audit:** UI ~95% selesai secara tampilan, TIDAK ada backend/API,
state hidup di React context + simulasi `localStorage` per-browser.

> Dokumen ini adalah **daftar temuan read-only** — tidak ada kode yang diubah untuk
> menghasilkan dokumen ini. Setiap item punya referensi `file:line` yang bisa
> diverifikasi langsung di kode. Gunakan sebagai checklist sebelum desain backend/API
> dan sebelum retouch business-flow dimulai.

---

## Cara membaca checklist ini

- `[ ]` = belum diperbaiki / masih berupa temuan terbuka.
- **Impact**: Critical (celah kontrol/kebocoran data) › High (flow bisnis salah/putus) ›
  Medium (tidak konsisten tapi tidak langsung bahaya) › Low (kosmetik/gaya).
- Referensi path relatif ke root project.

---

## 1. Approval Engine (Pengaturan & Alur Approval) — PRIORITAS TERTINGGI

- [x] **(Critical)** Tidak ada layar **pengaturan** untuk mendefinisikan jumlah level,
  approver per level, dan approver per kategori request (Cuti, SPPD, Pinjaman, dst)
  sebelum proses approve dipakai. Level & role approver di-*hardcode* langsung di
  `src/context/HrmsContext.tsx` per kategori (Cuti level1 `manager` totalLevels 2 ~L1512;
  Pinjaman `payroll_admin` totalLevels 2 ~L1802; dst). Eskalasi level-2+ juga hardcode
  `nextLevel === 2 ? 'director' : 'super_admin'` (`HrmsContext.tsx:3031`), tidak sadar
  kategori (padahal label SPPD level-2 adalah "Finance").
- [x] **(Critical)** Approver **tidak pernah dihitung dari hierarki organisasi nyata**
  (`OrgStructureNode.reportsToId`) — selalu role string hardcode. Field data org chart
  sudah ada dan terisi, tapi tidak dibaca sama sekali oleh engine approval.
- [x] **(Critical)** Antrian approval **tidak di-scope ke approver**. `ApprovalCenter.tsx:120-123`
  dan `MssPortal.tsx:113` menampilkan SEMUA item pending se-tenant ke siapa saja yang
  membuka layar — tidak ada filter berdasarkan role/tim/atasan-langsung. `MssPortal.tsx:112`
  bahkan hardcode `employees.slice(0, 8) // Demo team members` sebagai "tim saya".
  Dampak: approver bisa approve request orang yang bukan bawahannya; dua approver bisa
  berebut menyetujui tiket yang sama.
- [x] **(Critical — bypass kontrol)** Untuk kategori ber-`totalLevels: 2` (Pinjaman, SPPD,
  Reimbursement), tombol approve lokal di modulnya masing-masing memanggil fungsi status
  final secara langsung, **melompati level-2 sepenuhnya**:
  - `LoanManagement.tsx:580` → `updateLoanStatus(..., 'Aktif')` langsung final, padahal
    didesain `totalLevels: 2` (`HrmsContext.tsx:1802`).
  - `BusinessTripManagement.tsx:504` → `reviewBusinessTrip(..., 'Disetujui Atasan')`
    tapi `HrmsContext.tsx:3013-3020` langsung set status akhir `'Disetujui'`.
  - `PayrollManagement.tsx:322` → `reviewReimbursementClaim` finalize dari dalam modul
    Payroll, melompati level manager→finance.
- [ ] **(High)** Procurement PR tidak pernah sinkron balik ke `approvalItems`
  (`updateProcurementStatus`, `HrmsContext.tsx:2366-2385` tidak pernah update tiket
  terkait) — tiket "hantu" tertahan selamanya di status `'Menunggu'` di Approval Center
  meski PR-nya sudah selesai diproses di modul Procurement.
- [x] **(High)** "Pengganti Approver" (delegasi saat approver tidak hadir) hanya
  kosmetik: `ApprovalDelegation` dibuat & ditampilkan (`ApprovalCenter.tsx` tab
  "Pengganti Approver" L648-745, `MssPortal.tsx` tab "Delegasi" L620-701) tapi **tidak
  pernah dibaca** oleh `reviewApprovalItem` atau logika routing manapun. Tombol
  "Hentikan Delegasi" hanya menampilkan toast, tidak benar-benar menghapus/menonaktifkan
  apa pun (tidak ada fungsi `deleteDelegation` di context). `ApprovalDelegation` juga
  nol data seed.
- [x] **(High)** SLA tidak fungsional. `deadlineAt` dihitung saat tiket dibuat tapi
  **tidak pernah dibandingkan** dengan waktu sekarang di mana pun — tidak ada reminder,
  auto-eskalasi, atau auto-approve/reject timeout. Tab "SLA & Pengaturan" di
  ApprovalCenter hanya `useState` lokal komponen, hilang saat reload, tombol "Simpan
  Konfigurasi SLA" hanya toast — tidak memanggil context sama sekali. Metric card
  "Mendekati Batas SLA (24 Jam)" juga palsu — hanya menghitung jumlah semua item
  pending, tidak benar-benar membandingkan ke jam.
- [x] **(High)** Tidak ada konsep approver **"mengetahui"** (CC/acknowledge-only) yang
  berbeda dari approver pemutus keputusan — nol hit untuk konsep ini di seluruh model
  data/UI approval.
- [ ] **(High)** RBAC matrix (`RbacManagement.tsx`, `TenantRbacManagement.tsx`) sama
  sekali **tidak ditegakkan**. Toggle "Approve" per role tidak memengaruhi tombol
  Setujui/Tolak di `ApprovalCenter.tsx` (tidak ada pengecekan `getRolePermission` di
  file itu). Konfirmasi lebih luas: tidak ada satu pun modul operasional lain yang
  memanggil `getRolePermission` untuk men-gate aksi — RBAC matrix murni dekoratif di
  seluruh aplikasi.
- [x] **(Medium)** `ApprovalWorkflowItem` tidak punya `rejectionReason` dan tidak punya
  riwayat per-level (begitu naik ke level 2, keputusan level 1 "hilang" dari record).

## 2. Dokumen Resmi, Tanda Tangan (TTD) & QR Verifikasi

- [x] **(Critical)** QR code dan status `'Resmi Diterbitkan'` muncul **otomatis &
  sinkron saat dokumen dibuat**, tanpa gerbang konfirmasi apa pun dari pembuat,
  approver, atau pihak "mengetahui" (`DocumentManagement.tsx:930-983` dan
  `createOfficialDocument`, `HrmsContext.tsx:2388-2424`). Status `'Draft'` memang ada di
  tipe data tapi tidak pernah benar-benar dipakai (dead code).
- [ ] **(High)** `OfficialDocument` hanya punya satu `signeeName`/`signeeRole` (string
  tunggal) — tidak ada array multi-signer dengan status & timestamp konfirmasi
  masing-masing. Tipe `PersonaliaSignatory` yang lebih lengkap sudah ada di tempat lain
  tapi tidak pernah diadopsi oleh `OfficialDocument` (`src/types/hrms.ts:1276-1292`).
- [ ] **(High)** Blok tanda tangan multi-tier di Studio (Dibuat Oleh/Mengetahui/
  Menyetujui) **murni kosmetik untuk tampilan cetak** — tidak ada field `status`,
  `confirmedAt`, atau `userId` per penandatangan, dan nol tombol "konfirmasi/setuju"
  di seluruh `DocumentManagement.tsx` (dikonfirmasi grep). Terlihat seperti alur
  multi-pihak tapi tidak merekam apa pun.
- [ ] **(Critical)** Alur TTD/QR **sepenuhnya terputus dari Approval Center**. Tidak
  ada kategori "penerbitan dokumen" di `ApprovalWorkflowItem`, dan tidak ada field yang
  menghubungkan `OfficialDocument.id` ke tiket approval manapun.
- [x] **(High)** Tidak ada entri audit trail saat dokumen (dan QR-nya) diterbitkan —
  `createOfficialDocument` tidak pernah memanggil `logAuditAction`. Klaim UI "SHA-256 +
  UU ITE compliance" tidak didukung implementasi nyata — hash QR dibuat dengan
  `Math.random().toString(36)` (`HrmsContext.tsx:2409`), bukan hash kriptografis isi
  dokumen.
- [ ] **(Medium)** Tidak ada status `'Dicabut'`/`'Digantikan'`/`'Expired'` untuk dokumen
  — hanya `'Resmi Diterbitkan' | 'Draft'`. SP yang direvisi/SK yang digantikan tidak
  punya cara direpresentasikan sebagai tidak berlaku lagi.
- [ ] **(Medium)** Nomor surat selalu final saat dibuat, bukan setelah disetujui. Modul
  Recruitment punya gerbang parsial (`handleLockContractDocNumber`, gated ke boolean
  `isSigned`) tapi QR tetap tampil "Tervalidasi Digital Legal" walau kandidat belum
  merespons/menolak tawaran (`RecruitmentManagement.tsx:19777-19817`) — inkonsistensi
  antar modul.

## 3. GA Asset & Procurement (Contoh Asli dari Pemilik Produk — Terkonfirmasi)

- [x] **(Critical)** Procurement → Asset **100% terputus**. "Barang Diterima"
  (`updateProcurementStatus`) tidak pernah memanggil `addAsset` — GA harus mengetik
  ulang aset yang sama secara manual tanpa vendor/PO/garansi yang terbawa.
- [x] **(Critical)** **Tidak ada field garansi** di mana pun pada model data (`GAAsset`,
  `ProcurementOrder`) — hanya muncul sebagai teks bebas di klausa kontrak/placeholder
  textarea, bukan field terstruktur.
- [ ] **(High)** Form registrasi aset **hardcode** `purchaseDate` ke hari ini dan
  `condition` ke `'Baik'` — tidak ada input tanggal pembelian/kondisi sama sekali di
  modal registrasi (`GaAssetManagement.tsx:804-826, 2886-2972`).
- [x] **(Critical)** `usageStatus` (status Tersedia/Digunakan/Dalam Perbaikan) ada di
  tipe data dan di seed data, tapi **mati total** — nol pembacaan/penulisan di
  `GaAssetManagement.tsx`. Status open/closed yang terlihat di UI hanyalah ekspresi ad
  hoc `!asset.assignedToEmployeeId` dihitung ulang di JSX, bukan satu sumber kebenaran.
- [x] **(High)** **Tidak ada aksi "kembalikan ke GA / jadikan tersedia"** — sekali
  ditugaskan, aset hanya bisa berpindah ke karyawan lain lewat swap, tidak pernah bisa
  kembali jadi `'Tersedia'`. Status `'Dikembalikan ke GA'` dideklarasikan tapi tidak
  pernah di-set oleh kode apa pun.
- [x] **(High)** Tidak ada link balik Employee → "aset yang sedang saya pegang" —
  hanya ada `allocatedAssets`/`returnedAssets: string[]` bertipe teks bebas di log
  mutasi Personalia, tidak terhubung ke `GAAsset.id` dan tidak pernah tampil di profil
  karyawan.
- [ ] **(Medium)** Flow swap 2 pihak tidak atomik dan tidak divalidasi simetris —
  guard hanya menolak bila **kedua** pihak kosong, memungkinkan transfer sepihak yang
  timpang (`GaAssetManagement.tsx:925-1009`).
- [x] **(Medium)** `OffboardingRecord.assetReturned` hanya boolean tunggal, tidak
  mereferensikan aset spesifik — tidak bisa melacak pengembalian sebagian untuk
  karyawan dengan banyak aset, dan tidak pernah benar-benar query balik ke
  `GAAsset.assignedToEmployeeId` untuk verifikasi.
- [ ] **(Medium)** Lokasi aset (`building`/`room`) teks bebas, tidak terhubung ke
  master `OfficeLocation` — nol referensi dua arah antar modul.
- [ ] **(Low)** Riwayat serah terima aset (`BastHandoverRecord`) hidup di **state lokal
  komponen + localStorage key sendiri** (`nusahr_ga_bast_handovers_v3`), bukan di
  `HrmsContext` global — tidak ter-scope tenant, tidak terlihat modul lain (Offboarding,
  Audit Trail). Tipe `AssetRelocationLog` yang seharusnya menjadi model resmi untuk ini
  sudah didefinisikan tapi tidak pernah dipakai (orphaned).

## 4. Model Data & Relasi Lintas Modul

- [ ] **(High)** `department` adalah string bebas di minimal 3 tempat (`Employee`,
  `OrgStructureNode`, `UserAccount`) — bukan FK ke `CompanyDepartment.id` meski tabel
  master departemen sudah ada.
- [ ] **(High)** Dua field paralel untuk garis pelaporan: `Employee.managerId` (ID) vs
  `Employee.directSupervisor` (teks bebas) — tidak ada aturan mana yang jadi sumber
  kebenaran.
- [x] **(Critical)** Promosi/demosi/mutasi lewat Personalia **tidak pernah
  menyinkronkan** `OrgStructureNode.currentEmployeeId`/`isVacant` — hanya mengubah
  `employee.position/department/grade` sebagai teks. Org chart (`OrgChartManagement`,
  yang render strict dari `node.currentEmployeeId`) jadi basi/salah dibanding data
  karyawan sesungguhnya setelah setiap aksi Personalia.
  _Selesai: tabel `personalia_actions` + `server/lib/personalia.ts`; persetujuan final Approval Engine menerapkan perubahan di server (kursi org chart dikosongkan/diisi, `managerId` mengikuti bagan, SK terbit tanpa QR sampai ditandatangani)._
- [x] **(High)** Personalia menyimpan tabel grade-gaji **hardcode miliknya sendiri**
  (`PersonaliaManagement.tsx:63 GRADE_SALARY_SCALES`), independen dari
  `gradeSalaryRanges` yang dikonfigurasi admin di `GradeSalaryManagement` — modul
  Grade & Salary jadi dekoratif/tidak pernah benar-benar dipakai untuk validasi
  promosi/payroll.
  _Selesai: server memvalidasi gaji terhadap `gradeSalaryRanges`; form Personalia memakai grade & rentang gaji yang dikonfigurasi admin (konstanta hanya fallback bila belum ada grade)._
- [x] **(Medium)** Personalia mengizinkan input posisi teks bebas (`__custom__`) yang
  melewati referensi org chart sama sekali, bertentangan dengan klaim PRD "wajib
  mengambil referensi langsung dari Org Structure Nodes".
- [ ] **(Medium)** Field "Usulan Gaji Baru" di Contract Renewal ditangkap di form tapi
  **tidak pernah diterapkan** ke `employee.basicSalary` saat disetujui — hanya
  tersimpan sebagai teks bebas di `notes`.
- [ ] **(Medium)** `LeaveRequest` tidak punya field lampiran meski salah satu
  `leaveType` adalah "Sakit dengan Surat Dokter" (butuh bukti dokter) — bandingkan
  dengan `AttendanceCorrectionRequest` yang sudah punya `attachmentUrl?`.
- [ ] **(Medium)** Bucket "cuti bersama" hanya hitungan tampilan (`deductsLeaveBucket`
  dihitung ulang tiap render), tidak pernah benar-benar dipotong ke ledger permanen —
  bisa berubah retroaktif jika admin mengubah kalender, dan tidak konsisten ditampilkan
  antar modul (EmployeeManagement tidak pernah menunjukkan bucket ini).
- [ ] **(Medium)** `EmployeeLoan` tidak punya back-reference ke `LoanSchemeConfig.id`
  (tidak bisa diaudit apakah pinjaman sesuai aturan skemanya), tidak ada buku
  cicilan/ledger per periode, tidak ada alasan penolakan.
- [ ] **(Medium)** `BusinessTripRequest` hanya menyimpan estimasi biaya; form
  "Settlement Nota" menghitung selisih biaya aktual tapi **tidak pernah menyimpannya**
  ke record trip (`BusinessTripManagement.tsx:1360-1394` — tidak ada fungsi
  `updateBusinessTrip` di context). `approvedBy` juga satu string meski status
  menyiratkan dua tahap approval (Atasan → Finance) berbeda approver.
- [ ] **(High)** Isolasi multi-entity (holding/anak perusahaan) hanya diterapkan pada
  4 dari ~35+ koleksi data (divisions, departments, masterJobPositions, orgNodes) —
  `employees`, `assets`, `payrollRecords`, `documents`, `loans` dll hanya di-scope per
  tenant, **tidak per entity**, padahal `Employee.entityId` ada di model data.
- [ ] **(Critical)** `businessTrips` punya fallback bug: jika tenant aktif belum punya
  data trip, UI malah menampilkan **trip dari SEMUA tenant** (`scoped.length > 0 ?
  scoped : businessTrips`, `HrmsContext.tsx:4549-4552`) — pola kebocoran data
  cross-tenant jika ini tersambung ke database nyata.

## 5. Rekrutmen, Onboarding, KPI, Compliance, Admin

- [ ] **(Critical)** Karyawan yang dibuat otomatis dari jalur Rekrutmen→Onboarding
  memiliki **PII yang dipalsukan/di-random** — tanggal lahir, agama, status
  pernikahan, NIK KTP, No KK, NPWP, No BPJS, rekening bank semuanya diisi acak
  (`HrmsContext.tsx:2691-2708`). Berisiko legal/compliance tinggi jika dianggap data
  sungguhan.
- [ ] **(High)** Penomoran NIK karyawan hasil auto-onboarding **hardcode**, melewati
  mesin format NIK yang bisa dikonfigurasi admin (`generateNextNik`,
  `HrmsContext.tsx:3480-3499`) — dua aturan penomoran NIK berbeda berjalan paralel.
- [ ] **(High)** `PerformanceKpi` tidak punya pengecekan hierarki atasan-bawahan sama
  sekali — siapa saja bisa menilai siapa saja. Terputus total dari
  `ProbationManagement` (nol referensi silang) walau keduanya seharusnya saling
  menginformasikan.
- [ ] **(High)** Aksi disiplin (SP1-3, Skorsing, PHK) di `ComplianceManagement` **tidak
  tercatat di audit trail** — tindakan HR yang secara legal sensitif tidak terekam,
  padahal perubahan payroll/RBAC lain konsisten tercatat.
- [ ] **(Medium)** `MigrationWizardModal` (impor massal karyawan) memalsukan PII untuk
  kolom yang tidak ada di file sumber secara diam-diam, dan tidak tercatat di audit
  trail.
- [ ] **(Low)** Fitur "Simulasi" di `AuditTrailManagement` menyuntikkan entri audit
  palsu yang tidak bisa dibedakan dari entri asli — risiko tertukar saat audit nyata.
- [ ] **(Low)** Skor tes online kandidat (`CandidateOnlineTestPortal`) tidak otomatis
  masuk ke skor — HR harus input ulang manual nilainya (bukan "otomatis" seperti
  framing di PRD, meski datanya memang sampai ke keputusan akhir).

## 6. State Management & "Koneksi ke Database" (Rekayasa)

- [ ] **(High)** Klaim "semua state di memori" tidak tepat — aplikasi menyimpan hampir
  semua slice state ke `localStorage` per-browser dengan logika merge ad hoc
  per-entitas yang berbeda-beda caranya (rawan duplikat/ghost record jika skema data
  berubah).
- [ ] **(Medium)** Tombol "Reset Sample Data" (`resetToSampleFlowData`) hanya
  membersihkan 15 dari 35+ localStorage key yang sebenarnya dipakai — BAST aset GA dan
  skema pinjaman (lihat §3) tidak ikut ter-reset, membuat demo/QA terlihat bersih tapi
  sebenarnya masih menyisakan state lama.
- [ ] **(Medium)** Beberapa modul (GA Asset BAST, Loan Scheme config, draft
  Organization) menyimpan state penting **di luar `HrmsContext`**, masing-masing di
  `localStorage` key sendiri — tidak konsisten dengan pola state terpusat yang dipakai
  modul lain, dan tidak ter-scope tenant.

---

## Ringkasan Prioritas (untuk perencanaan retouch sebelum backend)

| # | Area | Jumlah temuan | Severity tertinggi |
|---|---|---|---|
| 1 | Approval Engine | 10 | Critical (bypass kontrol, data leak antar approver) |
| 2 | Dokumen/TTD/QR | 7 | Critical (QR terbit sebelum ada yang konfirmasi) |
| 3 | GA Asset/Procurement | 9 | Critical (persis contoh pemilik produk) |
| 4 | Model Data/Relasi | 13 | Critical (cross-tenant leak pada SPPD) |
| 5 | Rekrutmen/KPI/Compliance/Admin | 7 | Critical (PII palsu dianggap data asli) |
| 6 | State/Persistensi | 3 | High |

**Rekomendasi urutan perbaikan sebelum membangun backend:**
1. Desain ulang Approval Engine (settings per kategori, routing by org hierarchy,
   scoping antrian per approver, SLA nyata, delegasi nyata) — ini dipakai oleh hampir
   semua modul lain, jadi harus benar dulu.
2. Desain ulang alur TTD/QR agar menjadi konsekuensi dari Approval Engine (QR hanya
   muncul setelah seluruh pihak wajib konfirmasi).
3. Perbaiki model data Asset (status lifecycle, tanggal, garansi, link ke Procurement
   & Employee) sesuai contoh yang diberikan pemilik produk.
4. Normalisasi relasi department/org-node/grade-salary supaya satu sumber kebenaran.
5. Hapus/ganti fabrikasi PII pada jalur onboarding otomatis sebelum data ini pernah
   menyentuh database produksi.
