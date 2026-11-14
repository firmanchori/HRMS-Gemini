# Audit Kesiapan Produksi — NusaHR (2026-11-14)

Metode: pencarian kode (grep/baca file) + hasil `tsc` dan suite test (102 test lolos). **Tidak** ada pengujian browser/manual dan tidak ada pengujian beban. Angka adalah hitungan kasar dari pencarian, bukan analisis statis penuh.

Ringkasan: **belum layak produksi.** Backend inti (auth/sesi, RBAC, approval engine, Personalia, dokumen/QR, aset, kontrak) sudah nyata dan teruji. Namun masih ada (a) perhitungan payroll yang dilakukan di browser, (b) identitas/peran di UI yang bukan dari sesi server, (c) banyak modul yang masih menyimpan data di localStorage, (d) data dan fungsi dummy di form, dan (e) kode mati/duplikat serta utang tipe.

---

## 1. Data dummy

| Temuan | Lokasi | Tingkat |
|---|---|---|
| `src/data/initialData.ts` 7.177 baris data contoh (karyawan NTM, tenant, dll.) masih jadi nilai awal state | `HrmsContext.tsx` (INITIAL_TENANTS, INITIAL_ROLE_PERMISSIONS, INITIAL_MODULE_SETTINGS, INITIAL_REIMBURSEMENT_CLAIMS, INITIAL_ORG_PROPOSALS, INITIAL_GA_*, INITIAL_EMPLOYEE_STAGING, INITIAL_COMPETENCY/INTERVIEW_TYPES) | Tinggi |
| Tenant aktif default `'tenant-ntm'`, daftar tenant dari localStorage | `HrmsContext.tsx:773-776` | Tinggi |
| Form Tambah Karyawan terisi **NIK KTP, No. KK, BPJS, telepon acak** secara default (`Math.random`) | `EmployeeManagement.tsx:228,245,246,265,266,318,471-508,558,2589,2642` | Tinggi (PII palsu bisa tersimpan) |
| Form Kandidat: telepon acak, fallback `081234567890` | `RecruitmentManagement.tsx:2155,2173,3527,3538,1729` | Sedang |
| "Parsing AI CV" hanya `setTimeout` + ringkasan tetap + skor acak 88–97 | `RecruitmentManagement.tsx:~3405-3445` | Tinggi (menampilkan hasil AI yang tidak ada) |
| Seri laptop/asset tag/nomor tiket acak untuk onboarding | `RecruitmentManagement.tsx:1706,1769,1770,4943` | Sedang |
| Password sementara akun korporat ditebak: `Nusa{tahun}!{3 digit}` | `RecruitmentManagement.tsx:1809` | **Tinggi (keamanan)** |
| Email korporat disarankan `@nusantara.id`; 125 sebutan "Nusantara/NTM" tertanam di kode | tersebar | Sedang |
| CSV contoh dengan nama orang asli-tampak | `utils/csvHelper.ts` | Rendah |
| Tombol "Reset Sample Data" | `HrmsContext.tsx` (resetToSampleFlowData) | Sedang |
| Kolom identitas onboarding sudah dikosongkan (diperbaiki sesi ini) | — | selesai |

## 2. Fungsi yang belum terintegrasi satu sama lain

- **~49 state array di `HrmsContext` masih lokal**; 12 kunci localStorage masih dipakai (`tickets, supplies, supply_requests, room_bookings, vehicle_bookings, staging, org_proposals, signatures, job_grading_scheme, tenants, active_tenant, active_entity`). Tidak ada tabel backend untuk: tiket GA, persediaan/permintaan persediaan, booking ruang/kendaraan, **klaim reimbursement**, staging onboarding, proposal struktur organisasi.
- Reimbursement dan staging punya dampak payroll/onboarding tetapi hidup di browser → hilang saat ganti perangkat dan tidak bisa diaudit.
- **Saldo cuti dikurangi di browser** (`HrmsContext.tsx:~1876`, default 12 hari tertanam), bukan ledger server. Tidak ada kolom saldo di server.
- Presensi: geofence ada di server (`lib/geofence.ts`), tetapi jam masuk/keluar dan status "Terlambat" masih dihitung klien (`clockIn`, jam 08:30 tertanam).
- Dua UI ESS paralel: `EssPortal` (di dalam aplikasi admin, bergantung pada context mock) dan `employee/EmployeeApp` (nyata, pakai API karyawan). Fitur tidak sama (mis. lampiran surat dokter hanya sempurna di Employee App).
- Alur tenant admin vs jalur karyawan sudah satu logika server untuk Personalia/dokumen/approval, tetapi **modul lain (cuti, lembur, reimbursement) masih memakai antrean approval yang dibuat klien** (`createApprovalItem` dari browser) — bukan dari server saat entitas dibuat.

## 3 & 4. Relasi dan keselarasan field antar modul

Sudah benar (diverifikasi test): Personalia ↔ org node ↔ manager ↔ dokumen SK ↔ compliance; Procurement ↔ aset ↔ approval; Kontrak ↔ karyawan ↔ dokumen; Cuti sakit ↔ lampiran.

Masih salah/terputus (lihat juga `AUDIT_FINDINGS.md`, 16 butir terbuka):
- `department`, `position`, `grade` masih **teks bebas** di `employees.details`, sementara `departmentId/positionId/orgNodeId` ada di kolom → dua sumber kebenaran; laporan dan filter bisa tak cocok.
- `managerId` vs `directSupervisor` (teks) masih paralel.
- Isolasi per-entitas hanya untuk 4 koleksi; karyawan/aset/payroll/pinjaman hanya per-tenant.
- Pinjaman: tidak ada referensi ke skema, tidak ada buku cicilan.
- Perjalanan dinas: realisasi biaya tidak disimpan; approval dua tahap hanya satu string.
- Cuti bersama tidak masuk ledger. Lokasi aset teks bebas. BAST di state lokal.
- Nomor surat final sebelum disetujui (di Recruitment).

## 5. Kesesuaian standar HRMS / kelayakan produksi

**Sudah baik:** sesi revocable + CSRF + MFA (TOTP) admin & karyawan, RBAC matriks yang ditegakkan server, approval berjenjang dengan SLA/delegasi/anti-self-approval, audit trail untuk aksi sensitif, dokumen bertanda tangan dengan QR hanya setelah semua TTD, rate limit login, CI + dependabot, 102 integration test pada DB nyata.

**Penghambat produksi (urut prioritas):**
1. **Payroll dihitung di klien.** Server menerima `pph21Amount`, `pph21RatePercent`, nilai bersih dari body (`tenant.ts` payrollRecordSchema ~2716-2760); `taxCalculator` hanya ada di `src/utils`. Tidak ada penguncian periode/status final. Ini risiko finansial dan hukum terbesar. Perlu: kalkulasi PPh21 TER/BPJS di server, periode payroll dengan status Draft→Final→Dibayar, dan angka klien diabaikan.
2. **Identitas/peran UI bukan dari sesi.** `currentUserRole` default `'super_admin'`; Header punya "Ganti Simulasi Peran — Live Demo" (`Header.tsx:640`). Server tetap menegakkan akses (jadi bukan lubang keamanan data), tetapi UI menyesatkan dan menampilkan menu yang tidak berhak. Hapus switcher; turunkan peran dari sesi.
3. Data tersimpan di localStorage (poin 2) — tidak aman untuk multi-pengguna/multi-perangkat.
4. Saldo cuti, status terlambat, jam kerja dihitung klien.
5. Tidak ada: kebijakan retensi/penghapusan data pribadi (UU PDP), enkripsi kolom PII (NIK KTP, rekening, NPWP disimpan plaintext di `details` jsonb), ekspor data subjek, backup/restore terdokumentasi, observabilitas selain logger dasar, uji beban, uji keamanan eksternal.
6. Lampiran disimpan sebagai data-URL di kolom teks (maks ~700 KB) — cukup untuk MVP, perlu object storage untuk skala.
7. Tidak ada klaim "ISO 27001" (sudah dihapus); jangan ditambahkan tanpa sertifikasi.

## 6. Kualitas kode

| Metrik | Nilai |
|---|---|
| Error TypeScript | **291** (baseline; tidak bertambah sesi ini) — build produksi bergantung pada Vite yang tidak memeriksa tipe |
| `any` / `as any` | ~155 |
| `@ts-ignore` / `eslint-disable` | 14 |
| `console.log/debug` di kode non-test | 43 |
| `alert()/window.confirm()` | 70 (melanggar aturan "konfirmasi via modal" proyek) |
| TODO/FIXME/HACK | 43 |
| File terbesar | `RecruitmentManagement.tsx` 23.356 baris, `OrganizationManagement` 9.271, `DocumentManagement` 6.065, `HrmsContext` 5.249 |
| Server | `tenant.ts` 3.760 baris, satu file untuk semua rute admin |

Kesimpulan: logika server yang baru rapi, terstruktur (lib/ + test). Frontend adalah utang terbesar: file raksasa, context tunggal 5.000+ baris, tipe longgar. Perlu dipecah per modul (context per domain, rute per modul) dan error tipe ditutup sebelum produksi.

## 7. Fungsi sementara / bukan fungsi real

- "Parsing AI CV" (setTimeout + data tetap + skor acak) — `RecruitmentManagement.tsx`.
- "Uji Cepat (Simulasi Data Nyata)" di `MigrationWizardModal.tsx:309`.
- "Simulasi Pemindai QR Stock Opname" `GaAssetManagement.tsx:2237` dan "Simulasi presensi" di `DashboardOverview.tsx:975` — tombol demo, bukan pemindaian/presensi sungguhan.
- Role switcher "Live Demo" (`Header.tsx`).
- `resetToSampleFlowData` ("Reset Sample Data").
- Pembuatan nomor otomatis berbasis `Math.random` (`OrganizationManagement.tsx:603`, `RecruitmentManagement.tsx:1582,4263`) — tidak dijamin unik, tidak urut, tidak dari server.
- Penomoran `TEMP-xxxx` staging (`HrmsContext.tsx:4107`).
- Kalkulator Simulasi Pinjaman/Pesangon/PPh21 **boleh dipertahankan** (itu fitur simulasi yang sah) selama hasil resmi dihitung server.

## 8. Modul yang tidak dipakai / duplikat

Tidak terpakai (tidak diimpor di mana pun):
- `TenantRbacManagement.tsx` — duplikat `RbacManagement.tsx` (hanya yang terakhir dirutekan). **Hapus.**
- `OrgChartManagement.tsx` — tidak dirutekan. Hapus atau gabungkan ke Organisasi bila bagan memang dibutuhkan.
- `GradeSalaryManagement.tsx` — tidak dirutekan; grade dikelola dari `OrganizationManagement`. Verifikasi lalu hapus salah satunya.
- `src/utils/qrGenerator.ts` — tanpa pemakai. `src/scratch/` dan `test-studio-render.tsx` — sisa eksperimen (sumber error TS "Cannot find module").

Duplikat fungsi:
- `EssPortal` (admin app) vs `EmployeeApp` (portal karyawan nyata): pilih satu; arah yang benar adalah `EmployeeApp`, `EssPortal` dipensiunkan setelah fiturnya dipindahkan.
- `MssPortal` dipakai di dua tempat; periksa apakah duplikat antrean persetujuan atasan di Employee App.
- Antrean approval ada di dua tempat penciptaan (klien membuat item, dan server membuat item untuk Personalia/Procurement) — satukan: server membuat item saat entitas dibuat.
- Penomoran dokumen: `utils/documentNumbering.ts` (klien) vs penomoran server (`SK-PRS/…`) — satukan di server.

---

## Rekomendasi urutan perbaikan

1. **Payroll server-side + penguncian periode** (risiko tertinggi).
2. Hapus role switcher/"Live Demo", turunkan peran UI dari sesi; ganti default `tenant-ntm`.
3. Hapus semua nilai acak/dummy di form dan password sementara tebakan (generate di server, paksa ganti saat login pertama).
4. Pindahkan sisa localStorage ke backend (reimbursement, staging, tiket/booking GA, proposal organisasi) — reimbursement dulu karena menyentuh payroll.
5. Ledger saldo cuti di server; jam kerja/terlambat dari server.
6. Normalisasi `department/position/grade` ke ID + hapus `directSupervisor`.
7. Bersihkan kode mati (butir §8), tutup 291 error TS bertahap, ganti `alert/confirm` dengan modal, pecah file raksasa.
8. Kerjakan butir non-fungsional (PII encryption, retensi UU PDP, backup, observabilitas, uji beban, pentest) sebelum go-live.
